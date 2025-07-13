import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { transactionService } from './transactionService';

type Budget = Database['public']['Tables']['budgets']['Row'];
type BudgetInsert = Database['public']['Tables']['budgets']['Insert'];
type BudgetUpdate = Database['public']['Tables']['budgets']['Update'];

// Helper function to get authenticated user ID
async function getAuthenticatedUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('User not authenticated');
  }
  return user.id;
}

export interface BudgetWithDetails extends Budget {
  category?: Database['public']['Tables']['categories']['Row'];
  spent?: number;
}

export const budgetService = {
  // Get all budgets with category details and spent amounts
  async getBudgets(month?: string, year?: number): Promise<BudgetWithDetails[]> {
    const userId = await getAuthenticatedUserId();
    let query = supabase
      .from('budgets')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('user_id', userId);

    if (month && year) {
      query = query.eq('month', `${year}-${month.padStart(2, '0')}`);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    // Calculate spent amounts for each budget
    const budgetsWithSpent = await Promise.all(
      (data || []).map(async (budget) => {
        const spent = await this.getSpentAmount(budget.category_id, budget.month);
        return {
          ...budget,
          spent
        };
      })
    );

    return budgetsWithSpent;
  },

  // Get budget by ID
  async getBudget(id: string): Promise<BudgetWithDetails | null> {
    const userId = await getAuthenticatedUserId();
    const { data, error } = await supabase
      .from('budgets')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    
    if (data) {
      const spent = await this.getSpentAmount(data.category_id, data.month);
      return { ...data, spent };
    }
    
    return null;
  },

  // Create new budget
  async createBudget(budget: Omit<BudgetInsert, 'user_id'>): Promise<Budget> {
    const userId = await getAuthenticatedUserId();
    const { data, error } = await supabase
      .from('budgets')
      .insert([{ ...budget, user_id: userId }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update budget
  async updateBudget(id: string, updates: Omit<BudgetUpdate, 'user_id'>): Promise<Budget> {
    const userId = await getAuthenticatedUserId();
    const { data, error } = await supabase
      .from('budgets')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete budget
  async deleteBudget(id: string): Promise<void> {
    const userId = await getAuthenticatedUserId();
    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  },

  // Get spent amount for a category in a specific month
  async getSpentAmount(categoryId: string, month: string): Promise<number> {
    const userId = await getAuthenticatedUserId();
    const [year, monthNum] = month.split('-');
    const startDate = `${year}-${monthNum}-01`;
    
    // Calculate the last day of the month properly
    const lastDay = new Date(parseInt(year), parseInt(monthNum), 0).getDate();
    const endDate = `${year}-${monthNum}-${lastDay.toString().padStart(2, '0')}`;

    const { data, error } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('category_id', categoryId)
      .eq('type', 'expense')
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) throw error;
    return data?.reduce((total, transaction) => total + transaction.amount, 0) || 0;
  },

  // Get budget overview for a specific month
  async getBudgetOverview(month: string, year: number): Promise<{
    totalBudget: number;
    totalSpent: number;
    overBudgetCount: number;
    onTrackCount: number;
  }> {
    const budgets = await this.getBudgets(month.toString().padStart(2, '0'), year);
    
    const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);
    const totalSpent = budgets.reduce((sum, budget) => sum + (budget.spent || 0), 0);
    const overBudgetCount = budgets.filter(b => (b.spent || 0) > b.amount).length;
    const onTrackCount = budgets.filter(b => (b.spent || 0) <= b.amount * 0.8).length;

    return {
      totalBudget,
      totalSpent,
      overBudgetCount,
      onTrackCount
    };
  }
};
