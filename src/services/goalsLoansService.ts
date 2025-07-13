import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

type GoalLoan = Database['public']['Tables']['goals_loans']['Row'];
type GoalLoanInsert = Database['public']['Tables']['goals_loans']['Insert'];
type GoalLoanUpdate = Database['public']['Tables']['goals_loans']['Update'];
type GoalLoanTransaction = Database['public']['Tables']['goal_loan_transactions']['Row'];
type GoalLoanTransactionInsert = Database['public']['Tables']['goal_loan_transactions']['Insert'];

// Helper function to get authenticated user ID
async function getAuthenticatedUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('User not authenticated');
  }
  return user.id;
}

export interface GoalLoanWithCalculations extends GoalLoan {
  progressPercentage: number;
  remainingAmount: number;
  daysRemaining: number;
  monthsRemaining: number;
  isOnTrack: boolean;
  totalPaid: number;
  nextPaymentDate?: string;
  wallet?: Database['public']['Tables']['wallets']['Row'];
}

export interface GoalLoanStats {
  totalGoals: number;
  totalLoans: number;
  activeItems: number;
  completedItems: number;
  totalGoalAmount: number;
  totalLoanAmount: number;
  totalSaved: number;
  totalOwed: number;
  monthlyPayments: number;
  monthlyContributions: number;
}

export const goalsLoansService = {
  // Get all goals and loans
  async getGoalsAndLoans(): Promise<GoalLoanWithCalculations[]> {
    const userId = await getAuthenticatedUserId();
    const { data, error } = await supabase
      .from('goals_loans')
      .select(`
        *,
        wallet:wallets(*)
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    const itemsWithCalculations = await Promise.all(
      (data || []).map(async (item) => {
        const calculations = await this.calculateItemMetrics(item);
        return {
          ...item,
          ...calculations
        };
      })
    );

    return itemsWithCalculations;
  },

  // Get goals and loans by type
  async getByType(type: 'goal' | 'loan'): Promise<GoalLoanWithCalculations[]> {
    const userId = await getAuthenticatedUserId();
    const { data, error } = await supabase
      .from('goals_loans')
      .select(`
        *,
        wallet:wallets(*)
      `)
      .eq('user_id', userId)
      .eq('type', type)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    const itemsWithCalculations = await Promise.all(
      (data || []).map(async (item) => {
        const calculations = await this.calculateItemMetrics(item);
        return {
          ...item,
          ...calculations
        };
      })
    );

    return itemsWithCalculations;
  },

  // Get by status
  async getByStatus(status: 'active' | 'completed' | 'paused' | 'cancelled'): Promise<GoalLoanWithCalculations[]> {
    const userId = await getAuthenticatedUserId();
    const { data, error } = await supabase
      .from('goals_loans')
      .select(`
        *,
        wallet:wallets(*)
      `)
      .eq('user_id', userId)
      .eq('status', status)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    const itemsWithCalculations = await Promise.all(
      (data || []).map(async (item) => {
        const calculations = await this.calculateItemMetrics(item);
        return {
          ...item,
          ...calculations
        };
      })
    );

    return itemsWithCalculations;
  },

  // Get single item by ID
  async getGoalLoan(id: string): Promise<GoalLoanWithCalculations | null> {
    const userId = await getAuthenticatedUserId();
    const { data, error } = await supabase
      .from('goals_loans')
      .select(`
        *,
        wallet:wallets(*)
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    
    if (data) {
      const calculations = await this.calculateItemMetrics(data);
      return {
        ...data,
        ...calculations
      };
    }
    
    return null;
  },

  // Create new goal or loan
  async createGoalLoan(item: Omit<GoalLoanInsert, 'user_id'>): Promise<GoalLoan> {
    const userId = await getAuthenticatedUserId();
    const { data, error } = await supabase
      .from('goals_loans')
      .insert([{ ...item, user_id: userId }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update goal or loan
  async updateGoalLoan(id: string, updates: Omit<GoalLoanUpdate, 'user_id'>): Promise<GoalLoan> {
    const userId = await getAuthenticatedUserId();
    const { data, error } = await supabase
      .from('goals_loans')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete goal or loan (soft delete)
  async deleteGoalLoan(id: string): Promise<void> {
    const userId = await getAuthenticatedUserId();
    const { error } = await supabase
      .from('goals_loans')
      .update({ is_active: false })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  },

  // Add transaction (payment or contribution)
  async addTransaction(transaction: Omit<GoalLoanTransactionInsert, 'user_id'>): Promise<GoalLoanTransaction> {
    const userId = await getAuthenticatedUserId();
    
    // Insert transaction
    const { data: transactionData, error: transactionError } = await supabase
      .from('goal_loan_transactions')
      .insert([{ ...transaction, user_id: userId }])
      .select()
      .single();

    if (transactionError) throw transactionError;

    // Update goal/loan current amount
    const { data: itemData, error: itemError } = await supabase
      .from('goals_loans')
      .select('current_amount, type')
      .eq('id', transaction.goal_loan_id)
      .eq('user_id', userId)
      .single();

    if (itemError) throw itemError;

    let newCurrentAmount: number;
    if (itemData.type === 'goal') {
      // For goals, add contributions
      newCurrentAmount = itemData.current_amount + transaction.amount;
    } else {
      // For loans, subtract payments from remaining balance
      newCurrentAmount = Math.max(0, itemData.current_amount - transaction.amount);
    }
    
    await supabase
      .from('goals_loans')
      .update({ current_amount: newCurrentAmount })
      .eq('id', transaction.goal_loan_id)
      .eq('user_id', userId);

    return transactionData;
  },

  // Get transactions for a goal/loan
  async getTransactions(goalLoanId: string): Promise<GoalLoanTransaction[]> {
    const userId = await getAuthenticatedUserId();
    const { data, error } = await supabase
      .from('goal_loan_transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('goal_loan_id', goalLoanId)
      .order('transaction_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Calculate metrics for a goal/loan
  async calculateItemMetrics(item: GoalLoan): Promise<{
    progressPercentage: number;
    remainingAmount: number;
    daysRemaining: number;
    monthsRemaining: number;
    isOnTrack: boolean;
    totalPaid: number;
    nextPaymentDate?: string;
  }> {
    let progressPercentage: number;
    let remainingAmount: number;
    
    if (item.type === 'goal') {
      // For goals: progress = current_amount / target_amount
      progressPercentage = item.target_amount > 0 ? (item.current_amount / item.target_amount) * 100 : 0;
      remainingAmount = Math.max(0, item.target_amount - item.current_amount);
    } else {
      // For loans: progress = (target_amount - current_amount) / target_amount
      // current_amount represents remaining balance for loans
      progressPercentage = item.target_amount > 0 ? ((item.target_amount - item.current_amount) / item.target_amount) * 100 : 0;
      remainingAmount = item.current_amount; // For loans, current_amount is remaining balance
    }
    
    // Calculate time remaining
    const targetDate = new Date(item.target_date);
    const currentDate = new Date();
    const timeDiff = targetDate.getTime() - currentDate.getTime();
    const daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
    const monthsRemaining = Math.max(0, Math.ceil(daysRemaining / 30.44));
    
    // Check if on track
    let isOnTrack = true;
    if (item.monthly_payment > 0 && monthsRemaining > 0) {
      const requiredMonthly = remainingAmount / monthsRemaining;
      isOnTrack = requiredMonthly <= item.monthly_payment;
    }
    
    // Get total paid from transactions
    const transactions = await this.getTransactions(item.id);
    const totalPaid = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
    
    // Calculate next payment date
    let nextPaymentDate: string | undefined;
    if (item.payment_due_date && item.status === 'active') {
      const nextDate = new Date();
      nextDate.setDate(item.payment_due_date);
      if (nextDate <= currentDate) {
        nextDate.setMonth(nextDate.getMonth() + 1);
      }
      nextPaymentDate = nextDate.toISOString().split('T')[0];
    }

    return {
      progressPercentage: Math.min(progressPercentage, 100),
      remainingAmount,
      daysRemaining,
      monthsRemaining,
      isOnTrack,
      totalPaid,
      nextPaymentDate
    };
  },

  // Get statistics
  async getStats(): Promise<GoalLoanStats> {
    const items = await this.getGoalsAndLoans();
    
    const goals = items.filter(item => item.type === 'goal');
    const loans = items.filter(item => item.type === 'loan');
    
    const totalGoals = goals.length;
    const totalLoans = loans.length;
    const activeItems = items.filter(item => item.status === 'active').length;
    const completedItems = items.filter(item => item.status === 'completed').length;
    
    const totalGoalAmount = goals.reduce((sum, goal) => sum + goal.target_amount, 0);
    const totalLoanAmount = loans.reduce((sum, loan) => sum + loan.target_amount, 0);
    const totalSaved = goals.reduce((sum, goal) => sum + goal.current_amount, 0);
    const totalOwed = loans.reduce((sum, loan) => sum + loan.current_amount, 0); // current_amount is remaining balance for loans
    
    const monthlyPayments = loans
      .filter(loan => loan.status === 'active')
      .reduce((sum, loan) => sum + (loan.monthly_payment || 0), 0);
    
    const monthlyContributions = goals
      .filter(goal => goal.status === 'active')
      .reduce((sum, goal) => sum + (goal.monthly_payment || 0), 0); // monthly_payment used as monthly contribution for goals

    return {
      totalGoals,
      totalLoans,
      activeItems,
      completedItems,
      totalGoalAmount,
      totalLoanAmount,
      totalSaved,
      totalOwed,
      monthlyPayments,
      monthlyContributions
    };
  },

  // Mark as completed
  async completeGoalLoan(id: string): Promise<GoalLoan> {
    const item = await this.getGoalLoan(id);
    if (!item) throw new Error('Goal/Loan not found');
    
    let updates: Partial<GoalLoanUpdate> = { status: 'completed' };
    
    if (item.type === 'goal') {
      updates.current_amount = item.target_amount;
    } else {
      updates.current_amount = 0; // Loan fully paid
    }
    
    return this.updateGoalLoan(id, updates);
  },

  // Toggle status (pause/resume)
  async toggleStatus(id: string, status: 'active' | 'paused'): Promise<GoalLoan> {
    return this.updateGoalLoan(id, { status });
  }
};
