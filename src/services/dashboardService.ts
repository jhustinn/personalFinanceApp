import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

// Helper function to get authenticated user ID
async function getAuthenticatedUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('User not authenticated');
  }
  return user.id;
}

export interface DashboardStats {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  totalTransactions: number;
  savingsRate: number;
  topCategories: Array<{
    name: string;
    amount: number;
    color: string;
    percentage: number;
  }>;
  recentTransactions: Array<{
    id: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    date: string;
    category_name: string;
    wallet_name: string;
  }>;
  monthlyTrend: Array<{
    month: string;
    income: number;
    expense: number;
    savings: number;
  }>;
  budgetOverview: {
    totalBudget: number;
    totalSpent: number;
    overBudgetCount: number;
    onTrackCount: number;
  };
}

export const dashboardService = {
  // Get comprehensive dashboard statistics
  async getDashboardStats(): Promise<DashboardStats> {
    const userId = await getAuthenticatedUserId();
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    // Get current month date range
    const startOfMonth = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;
    const endOfMonth = new Date(currentYear, currentMonth, 0).getDate();
    const endOfMonthStr = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${endOfMonth.toString().padStart(2, '0')}`;

    // Fetch all required data in parallel
    const [
      walletsData,
      monthlyTransactionsData,
      allTransactionsData,
      categoriesData,
      budgetsData
    ] = await Promise.all([
      this.getTotalBalance(userId),
      this.getMonthlyTransactions(userId, startOfMonth, endOfMonthStr),
      this.getRecentTransactions(userId),
      this.getTopCategories(userId, startOfMonth, endOfMonthStr),
      this.getBudgetOverview(userId, currentMonth, currentYear)
    ]);

    // Calculate monthly income and expenses
    const monthlyIncome = monthlyTransactionsData
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const monthlyExpenses = monthlyTransactionsData
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate savings rate
    const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;

    // Get monthly trend (last 6 months)
    const monthlyTrend = await this.getMonthlyTrend(userId, 6);

    return {
      totalBalance: walletsData,
      monthlyIncome,
      monthlyExpenses,
      totalTransactions: allTransactionsData.length,
      savingsRate,
      topCategories: categoriesData,
      recentTransactions: allTransactionsData.slice(0, 5), // Latest 5 transactions
      monthlyTrend,
      budgetOverview: budgetsData
    };
  },

  // Get total balance from all active wallets
  async getTotalBalance(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) throw error;
    return data?.reduce((total, wallet) => total + wallet.balance, 0) || 0;
  },

  // Get transactions for current month
  async getMonthlyTransactions(userId: string, startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select('amount, type')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) throw error;
    return data || [];
  },

  // Get recent transactions with details
  async getRecentTransactions(userId: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        id,
        description,
        amount,
        type,
        date,
        category:categories(name),
        wallet:wallets(name)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    
    return (data || []).map(transaction => ({
      id: transaction.id,
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      date: transaction.date,
      category_name: transaction.category?.name || 'Unknown',
      wallet_name: transaction.wallet?.name || 'Unknown'
    }));
  },

  // Get top spending categories for current month
  async getTopCategories(userId: string, startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        amount,
        category:categories(name, color)
      `)
      .eq('user_id', userId)
      .eq('type', 'expense')
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) throw error;

    // Group by category and calculate totals
    const categoryTotals: { [key: string]: { amount: number; color: string } } = {};
    let totalExpenses = 0;

    (data || []).forEach(transaction => {
      const categoryName = transaction.category?.name || 'Other';
      const categoryColor = transaction.category?.color || '#6B7280';
      
      if (!categoryTotals[categoryName]) {
        categoryTotals[categoryName] = { amount: 0, color: categoryColor };
      }
      
      categoryTotals[categoryName].amount += transaction.amount;
      totalExpenses += transaction.amount;
    });

    // Convert to array and calculate percentages
    const topCategories = Object.entries(categoryTotals)
      .map(([name, data]) => ({
        name,
        amount: data.amount,
        color: data.color,
        percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6); // Top 6 categories

    return topCategories;
  },

  // Get monthly trend data
  async getMonthlyTrend(userId: string, months: number) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - months);

    const { data, error } = await supabase
      .from('transactions')
      .select('amount, type, date')
      .eq('user_id', userId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0]);

    if (error) throw error;

    // Group by month
    const monthlyData: { [key: string]: { income: number; expense: number } } = {};
    
    (data || []).forEach(transaction => {
      const monthKey = transaction.date.substring(0, 7); // YYYY-MM
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expense: 0 };
      }
      
      if (transaction.type === 'income') {
        monthlyData[monthKey].income += transaction.amount;
      } else {
        monthlyData[monthKey].expense += transaction.amount;
      }
    });

    // Convert to array and calculate savings
    const trendData = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('id-ID', { month: 'short' }),
        income: data.income,
        expense: data.expense,
        savings: data.income - data.expense
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return trendData;
  },

  // Get budget overview for current month
  async getBudgetOverview(userId: string, month: number, year: number) {
    const monthStr = `${year}-${month.toString().padStart(2, '0')}`;
    
    // Get budgets for current month
    const { data: budgets, error: budgetError } = await supabase
      .from('budgets')
      .select(`
        id,
        amount,
        category_id,
        category:categories(name)
      `)
      .eq('user_id', userId)
      .eq('month', monthStr);

    if (budgetError) throw budgetError;

    if (!budgets || budgets.length === 0) {
      return {
        totalBudget: 0,
        totalSpent: 0,
        overBudgetCount: 0,
        onTrackCount: 0
      };
    }

    // Calculate spent amounts for each budget
    const budgetOverview = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await this.getSpentAmount(userId, budget.category_id, monthStr);
        return {
          ...budget,
          spent
        };
      })
    );

    const totalBudget = budgetOverview.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = budgetOverview.reduce((sum, b) => sum + b.spent, 0);
    const overBudgetCount = budgetOverview.filter(b => b.spent > b.amount).length;
    const onTrackCount = budgetOverview.filter(b => b.spent <= b.amount * 0.8).length;

    return {
      totalBudget,
      totalSpent,
      overBudgetCount,
      onTrackCount
    };
  },

  // Get spent amount for a category in a specific month
  async getSpentAmount(userId: string, categoryId: string, month: string): Promise<number> {
    const [year, monthNum] = month.split('-');
    const startDate = `${year}-${monthNum}-01`;
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
  }
};
