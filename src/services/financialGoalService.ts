import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

type FinancialGoal = Database['public']['Tables']['financial_goals']['Row'];
type FinancialGoalInsert = Database['public']['Tables']['financial_goals']['Insert'];
type FinancialGoalUpdate = Database['public']['Tables']['financial_goals']['Update'];
type GoalContribution = Database['public']['Tables']['goal_contributions']['Row'];
type GoalContributionInsert = Database['public']['Tables']['goal_contributions']['Insert'];

// Helper function to get authenticated user ID
async function getAuthenticatedUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('User not authenticated');
  }
  return user.id;
}

export interface FinancialGoalWithCalculations extends FinancialGoal {
  progressPercentage: number;
  remainingAmount: number;
  daysRemaining: number;
  monthsRemaining: number;
  requiredMonthlyAmount: number;
  isOnTrack: boolean;
  projectedCompletionDate: string;
  totalContributions: number;
  averageMonthlyContribution: number;
  wallet?: Database['public']['Tables']['wallets']['Row'];
}

export interface GoalStats {
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  totalTargetAmount: number;
  totalCurrentAmount: number;
  totalProgress: number;
  onTrackGoals: number;
  behindScheduleGoals: number;
  categoryBreakdown: Array<{
    category: string;
    count: number;
    targetAmount: number;
    currentAmount: number;
    percentage: number;
  }>;
  upcomingDeadlines: FinancialGoalWithCalculations[];
}

export const financialGoalService = {
  // Get all financial goals
  async getFinancialGoals(): Promise<FinancialGoalWithCalculations[]> {
    const userId = await getAuthenticatedUserId();
    const { data, error } = await supabase
      .from('financial_goals')
      .select(`
        *,
        wallet:wallets(*)
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    const goalsWithCalculations = await Promise.all(
      (data || []).map(async (goal) => {
        const calculations = await this.calculateGoalMetrics(goal);
        return {
          ...goal,
          ...calculations
        };
      })
    );

    return goalsWithCalculations;
  },

  // Get goals by status
  async getGoalsByStatus(status: 'active' | 'completed' | 'paused' | 'cancelled'): Promise<FinancialGoalWithCalculations[]> {
    const userId = await getAuthenticatedUserId();
    const { data, error } = await supabase
      .from('financial_goals')
      .select(`
        *,
        wallet:wallets(*)
      `)
      .eq('user_id', userId)
      .eq('status', status)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    const goalsWithCalculations = await Promise.all(
      (data || []).map(async (goal) => {
        const calculations = await this.calculateGoalMetrics(goal);
        return {
          ...goal,
          ...calculations
        };
      })
    );

    return goalsWithCalculations;
  },

  // Get goal by ID
  async getFinancialGoal(id: string): Promise<FinancialGoalWithCalculations | null> {
    const userId = await getAuthenticatedUserId();
    const { data, error } = await supabase
      .from('financial_goals')
      .select(`
        *,
        wallet:wallets(*)
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    
    if (data) {
      const calculations = await this.calculateGoalMetrics(data);
      return {
        ...data,
        ...calculations
      };
    }
    
    return null;
  },

  // Create new financial goal
  async createFinancialGoal(goal: Omit<FinancialGoalInsert, 'user_id'>): Promise<FinancialGoal> {
    const userId = await getAuthenticatedUserId();
    const { data, error } = await supabase
      .from('financial_goals')
      .insert([{ ...goal, user_id: userId }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update financial goal
  async updateFinancialGoal(id: string, updates: Omit<FinancialGoalUpdate, 'user_id'>): Promise<FinancialGoal> {
    const userId = await getAuthenticatedUserId();
    const { data, error } = await supabase
      .from('financial_goals')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete financial goal (soft delete)
  async deleteFinancialGoal(id: string): Promise<void> {
    const userId = await getAuthenticatedUserId();
    const { error } = await supabase
      .from('financial_goals')
      .update({ is_active: false })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  },

  // Add contribution to goal
  async addContribution(contribution: Omit<GoalContributionInsert, 'user_id'>): Promise<GoalContribution> {
    const userId = await getAuthenticatedUserId();
    
    // Insert contribution
    const { data: contributionData, error: contributionError } = await supabase
      .from('goal_contributions')
      .insert([{ ...contribution, user_id: userId }])
      .select()
      .single();

    if (contributionError) throw contributionError;

    // Update goal current amount
    const { data: goalData, error: goalError } = await supabase
      .from('financial_goals')
      .select('current_amount')
      .eq('id', contribution.goal_id)
      .eq('user_id', userId)
      .single();

    if (goalError) throw goalError;

    const newCurrentAmount = goalData.current_amount + contribution.amount;
    
    await supabase
      .from('financial_goals')
      .update({ current_amount: newCurrentAmount })
      .eq('id', contribution.goal_id)
      .eq('user_id', userId);

    return contributionData;
  },

  // Get goal contributions
  async getGoalContributions(goalId: string): Promise<GoalContribution[]> {
    const userId = await getAuthenticatedUserId();
    const { data, error } = await supabase
      .from('goal_contributions')
      .select('*')
      .eq('user_id', userId)
      .eq('goal_id', goalId)
      .order('contribution_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Calculate goal metrics
  async calculateGoalMetrics(goal: FinancialGoal): Promise<{
    progressPercentage: number;
    remainingAmount: number;
    daysRemaining: number;
    monthsRemaining: number;
    requiredMonthlyAmount: number;
    isOnTrack: boolean;
    projectedCompletionDate: string;
    totalContributions: number;
    averageMonthlyContribution: number;
  }> {
    const progressPercentage = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
    const remainingAmount = Math.max(0, goal.target_amount - goal.current_amount);
    
    // Calculate time remaining
    const targetDate = new Date(goal.target_date);
    const currentDate = new Date();
    const timeDiff = targetDate.getTime() - currentDate.getTime();
    const daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
    const monthsRemaining = Math.max(0, Math.ceil(daysRemaining / 30.44));
    
    // Calculate required monthly amount
    const requiredMonthlyAmount = monthsRemaining > 0 ? remainingAmount / monthsRemaining : 0;
    
    // Check if on track
    const isOnTrack = goal.monthly_target > 0 ? requiredMonthlyAmount <= goal.monthly_target : true;
    
    // Calculate projected completion date
    let projectedCompletionDate = goal.target_date;
    if (goal.monthly_target > 0 && remainingAmount > 0) {
      const monthsToComplete = Math.ceil(remainingAmount / goal.monthly_target);
      const projectedDate = new Date();
      projectedDate.setMonth(projectedDate.getMonth() + monthsToComplete);
      projectedCompletionDate = projectedDate.toISOString().split('T')[0];
    }

    // Get contribution statistics
    const contributions = await this.getGoalContributions(goal.id);
    const totalContributions = contributions.reduce((sum, contrib) => sum + contrib.amount, 0);
    
    // Calculate average monthly contribution
    const goalStartDate = new Date(goal.created_at);
    const monthsSinceStart = Math.max(1, Math.ceil((currentDate.getTime() - goalStartDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)));
    const averageMonthlyContribution = totalContributions / monthsSinceStart;

    return {
      progressPercentage: Math.min(progressPercentage, 100),
      remainingAmount,
      daysRemaining,
      monthsRemaining,
      requiredMonthlyAmount,
      isOnTrack,
      projectedCompletionDate,
      totalContributions,
      averageMonthlyContribution
    };
  },

  // Get goal statistics
  async getGoalStats(): Promise<GoalStats> {
    const goals = await this.getFinancialGoals();
    
    const totalGoals = goals.length;
    const activeGoals = goals.filter(g => g.status === 'active').length;
    const completedGoals = goals.filter(g => g.status === 'completed').length;
    const totalTargetAmount = goals.reduce((sum, g) => sum + g.target_amount, 0);
    const totalCurrentAmount = goals.reduce((sum, g) => sum + g.current_amount, 0);
    const totalProgress = totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0;
    const onTrackGoals = goals.filter(g => g.isOnTrack && g.status === 'active').length;
    const behindScheduleGoals = goals.filter(g => !g.isOnTrack && g.status === 'active').length;

    // Category breakdown
    const categoryData: { [key: string]: { count: number; targetAmount: number; currentAmount: number } } = {};
    goals.forEach(goal => {
      if (!categoryData[goal.category]) {
        categoryData[goal.category] = { count: 0, targetAmount: 0, currentAmount: 0 };
      }
      categoryData[goal.category].count += 1;
      categoryData[goal.category].targetAmount += goal.target_amount;
      categoryData[goal.category].currentAmount += goal.current_amount;
    });

    const categoryBreakdown = Object.entries(categoryData).map(([category, data]) => ({
      category,
      count: data.count,
      targetAmount: data.targetAmount,
      currentAmount: data.currentAmount,
      percentage: totalTargetAmount > 0 ? (data.targetAmount / totalTargetAmount) * 100 : 0
    }));

    // Upcoming deadlines (goals due within 90 days)
    const upcomingDeadlines = goals
      .filter(g => g.status === 'active' && g.daysRemaining <= 90)
      .sort((a, b) => a.daysRemaining - b.daysRemaining)
      .slice(0, 5);

    return {
      totalGoals,
      activeGoals,
      completedGoals,
      totalTargetAmount,
      totalCurrentAmount,
      totalProgress,
      onTrackGoals,
      behindScheduleGoals,
      categoryBreakdown,
      upcomingDeadlines
    };
  },

  // Mark goal as completed
  async completeGoal(id: string): Promise<FinancialGoal> {
    return this.updateFinancialGoal(id, { 
      status: 'completed',
      current_amount: (await this.getFinancialGoal(id))?.target_amount || 0
    });
  },

  // Pause/Resume goal
  async toggleGoalStatus(id: string, status: 'active' | 'paused'): Promise<FinancialGoal> {
    return this.updateFinancialGoal(id, { status });
  }
};
