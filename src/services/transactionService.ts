import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { walletService } from './walletService';

type Transaction = Database['public']['Tables']['transactions']['Row'];
type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];
type TransactionUpdate = Database['public']['Tables']['transactions']['Update'];

// Helper function to get authenticated user ID
async function getAuthenticatedUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('User not authenticated');
  }
  return user.id;
}

export interface TransactionWithDetails extends Transaction {
  wallet?: Database['public']['Tables']['wallets']['Row'];
  category?: Database['public']['Tables']['categories']['Row'];
}

export const transactionService = {
  // Get all transactions with wallet and category details
  async getTransactions(): Promise<TransactionWithDetails[]> {
    const userId = await getAuthenticatedUserId();
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        wallet:wallets(*),
        category:categories(*)
      `)
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get transactions with filters
  async getTransactionsFiltered(filters: {
    type?: 'income' | 'expense';
    wallet_id?: string;
    category_id?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
  }): Promise<TransactionWithDetails[]> {
    const userId = await getAuthenticatedUserId();
    let query = supabase
      .from('transactions')
      .select(`
        *,
        wallet:wallets(*),
        category:categories(*)
      `)
      .eq('user_id', userId);

    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    if (filters.wallet_id) {
      query = query.eq('wallet_id', filters.wallet_id);
    }
    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id);
    }
    if (filters.date_from) {
      query = query.gte('date', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('date', filters.date_to);
    }
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    query = query.order('date', { ascending: false })
                 .order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // Get transaction by ID
  async getTransaction(id: string): Promise<TransactionWithDetails | null> {
    const userId = await getAuthenticatedUserId();
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        wallet:wallets(*),
        category:categories(*)
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  // Create new transaction
  async createTransaction(transaction: Omit<TransactionInsert, 'user_id'>): Promise<Transaction> {
    const userId = await getAuthenticatedUserId();
    // Start transaction
    const { data, error } = await supabase
      .from('transactions')
      .insert([{ ...transaction, user_id: userId }])
      .select()
      .single();

    if (error) throw error;

    // Update wallet balance
    const operation = transaction.type === 'income' ? 'add' : 'subtract';
    await walletService.updateBalance(transaction.wallet_id, transaction.amount, operation);

    return data;
  },

  // Update transaction
  async updateTransaction(id: string, updates: Omit<TransactionUpdate, 'user_id'>): Promise<Transaction> {
    const userId = await getAuthenticatedUserId();
    // Get original transaction to revert wallet balance
    const originalTransaction = await this.getTransaction(id);
    if (!originalTransaction) throw new Error('Transaction not found');

    // Revert original transaction from wallet
    const revertOperation = originalTransaction.type === 'income' ? 'subtract' : 'add';
    await walletService.updateBalance(originalTransaction.wallet_id, originalTransaction.amount, revertOperation);

    // Update transaction
    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    // Apply new transaction to wallet (use updated values or original if not changed)
    const newAmount = updates.amount ?? originalTransaction.amount;
    const newType = updates.type ?? originalTransaction.type;
    const newWalletId = updates.wallet_id ?? originalTransaction.wallet_id;
    
    const applyOperation = newType === 'income' ? 'add' : 'subtract';
    await walletService.updateBalance(newWalletId, newAmount, applyOperation);

    return data;
  },

  // Delete transaction
  async deleteTransaction(id: string): Promise<void> {
    const userId = await getAuthenticatedUserId();
    // Get transaction to revert wallet balance
    const transaction = await this.getTransaction(id);
    if (!transaction) throw new Error('Transaction not found');

    // Revert transaction from wallet
    const revertOperation = transaction.type === 'income' ? 'subtract' : 'add';
    await walletService.updateBalance(transaction.wallet_id, transaction.amount, revertOperation);

    // Delete transaction
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  },

  // Get transaction statistics
  async getTransactionStats(month?: string, year?: number): Promise<{
    totalIncome: number;
    totalExpenses: number;
    netAmount: number;
    transactionCount: number;
  }> {
    const userId = await getAuthenticatedUserId();
    let query = supabase
      .from('transactions')
      .select('amount, type')
      .eq('user_id', userId);

    if (month && year) {
      const startDate = `${year}-${month.padStart(2, '0')}-01`;
      const endDate = `${year}-${month.padStart(2, '0')}-31`;
      query = query.gte('date', startDate).lte('date', endDate);
    }

    const { data, error } = await query;
    if (error) throw error;

    const stats = data?.reduce((acc, transaction) => {
      if (transaction.type === 'income') {
        acc.totalIncome += transaction.amount;
      } else {
        acc.totalExpenses += transaction.amount;
      }
      acc.transactionCount++;
      return acc;
    }, {
      totalIncome: 0,
      totalExpenses: 0,
      transactionCount: 0
    }) || { totalIncome: 0, totalExpenses: 0, transactionCount: 0 };

    return {
      ...stats,
      netAmount: stats.totalIncome - stats.totalExpenses
    };
  },

  // Get monthly transaction data for charts
  async getMonthlyData(months: number = 6): Promise<Array<{
    month: string;
    income: number;
    expense: number;
    savings: number;
  }>> {
    const userId = await getAuthenticatedUserId();
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
    
    data?.forEach(transaction => {
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
    return Object.entries(monthlyData).map(([month, data]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }),
      income: data.income,
      expense: data.expense,
      savings: data.income - data.expense
    })).sort((a, b) => a.month.localeCompare(b.month));
  }
};
