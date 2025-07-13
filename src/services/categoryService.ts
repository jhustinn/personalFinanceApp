import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

type Category = Database['public']['Tables']['categories']['Row'];
type CategoryInsert = Database['public']['Tables']['categories']['Insert'];
type CategoryUpdate = Database['public']['Tables']['categories']['Update'];

// Helper function to get authenticated user ID
async function getAuthenticatedUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('User not authenticated');
  }
  return user.id;
}

export interface CategoryWithUsage extends Category {
  usage_count?: number;
  last_used?: string;
}

export const categoryService = {
  // Get all categories
  async getCategories(): Promise<Category[]> {
    const userId = await getAuthenticatedUserId();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  },

  // Get categories by type
  async getCategoriesByType(type: 'income' | 'expense'): Promise<Category[]> {
    const userId = await getAuthenticatedUserId();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .eq('type', type)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  },

  // Get categories by context (for specific features)
  async getCategoriesByContext(context: 'transaction' | 'budget' | 'goal' | 'loan' | 'asset'): Promise<Category[]> {
    const userId = await getAuthenticatedUserId();
    let query = supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    // Filter categories based on context
    switch (context) {
      case 'transaction':
      case 'budget':
        // For transactions and budgets, use income/expense categories
        query = query.in('type', ['income', 'expense']);
        break;
      case 'goal':
        // For goals, use goal-specific categories
        query = query.eq('type', 'goal');
        break;
      case 'loan':
        // For loans, use loan-specific categories
        query = query.eq('type', 'loan');
        break;
      case 'asset':
        // For assets, use asset-specific categories
        query = query.eq('type', 'asset');
        break;
    }

    query = query.order('name');

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // Get categories with usage statistics
  async getCategoriesWithUsage(): Promise<CategoryWithUsage[]> {
    const userId = await getAuthenticatedUserId();
    
    // Get categories with transaction counts
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('categories')
      .select(`
        *,
        transactions!inner(count)
      `)
      .eq('user_id', userId)
      .eq('is_active', true);

    if (categoriesError) throw categoriesError;

    // Get usage statistics for each category
    const categoriesWithUsage = await Promise.all(
      (categoriesData || []).map(async (category) => {
        const usage = await this.getCategoryUsage(category.id);
        return {
          ...category,
          ...usage
        };
      })
    );

    return categoriesWithUsage;
  },

  // Get category usage statistics
  async getCategoryUsage(categoryId: string): Promise<{ usage_count: number; last_used?: string }> {
    const userId = await getAuthenticatedUserId();
    
    // Count transactions using this category
    const { data: transactionData, error: transactionError } = await supabase
      .from('transactions')
      .select('created_at')
      .eq('user_id', userId)
      .eq('category_id', categoryId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (transactionError) throw transactionError;

    const { count: transactionCount, error: countError } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('category_id', categoryId);

    if (countError) throw countError;

    return {
      usage_count: transactionCount || 0,
      last_used: transactionData?.[0]?.created_at
    };
  },

  // Get category by ID
  async getCategory(id: string): Promise<Category | null> {
    const userId = await getAuthenticatedUserId();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  // Create new category
  async createCategory(category: Omit<CategoryInsert, 'user_id'>): Promise<Category> {
    const userId = await getAuthenticatedUserId();
    const { data, error } = await supabase
      .from('categories')
      .insert([{ ...category, user_id: userId }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update category
  async updateCategory(id: string, updates: Omit<CategoryUpdate, 'user_id'>): Promise<Category> {
    const userId = await getAuthenticatedUserId();
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete category (soft delete)
  async deleteCategory(id: string): Promise<void> {
    const userId = await getAuthenticatedUserId();
    
    // Check if category is being used
    const usage = await this.getCategoryUsage(id);
    if (usage.usage_count > 0) {
      throw new Error('Cannot delete category that is currently being used. Please reassign or delete related items first.');
    }

    const { error } = await supabase
      .from('categories')
      .update({ is_active: false })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  },

  // Create comprehensive default categories for all contexts
  async createDefaultCategories(): Promise<void> {
    const userId = await getAuthenticatedUserId();
    const defaultCategories = [
      // Income categories
      { name: 'Salary', type: 'income' as const, color: '#10B981', icon: 'Briefcase' },
      { name: 'Freelance', type: 'income' as const, color: '#84CC16', icon: 'Briefcase' },
      { name: 'Investment Returns', type: 'income' as const, color: '#06B6D4', icon: 'TrendingUp' },
      { name: 'Business Income', type: 'income' as const, color: '#8B5CF6', icon: 'Briefcase' },
      { name: 'Rental Income', type: 'income' as const, color: '#F59E0B', icon: 'Home' },
      { name: 'Side Hustle', type: 'income' as const, color: '#EC4899', icon: 'Zap' },
      
      // Expense categories
      { name: 'Food & Dining', type: 'expense' as const, color: '#EF4444', icon: 'UtensilsCrossed' },
      { name: 'Transportation', type: 'expense' as const, color: '#3B82F6', icon: 'Car' },
      { name: 'Shopping', type: 'expense' as const, color: '#8B5CF6', icon: 'ShoppingBag' },
      { name: 'Bills & Utilities', type: 'expense' as const, color: '#F59E0B', icon: 'Zap' },
      { name: 'Entertainment', type: 'expense' as const, color: '#EC4899', icon: 'Film' },
      { name: 'Healthcare', type: 'expense' as const, color: '#06B6D4', icon: 'Heart' },
      { name: 'Education', type: 'expense' as const, color: '#8B5CF6', icon: 'BookOpen' },
      { name: 'Housing', type: 'expense' as const, color: '#10B981', icon: 'Home' },
      { name: 'Insurance', type: 'expense' as const, color: '#6B7280', icon: 'Shield' },
      { name: 'Personal Care', type: 'expense' as const, color: '#F97316', icon: 'Heart' },
      
      // Goal categories
      { name: 'Emergency Fund', type: 'goal' as const, color: '#EF4444', icon: 'AlertTriangle' },
      { name: 'Retirement', type: 'goal' as const, color: '#10B981', icon: 'Target' },
      { name: 'Education Fund', type: 'goal' as const, color: '#3B82F6', icon: 'BookOpen' },
      { name: 'Travel Fund', type: 'goal' as const, color: '#06B6D4', icon: 'Plane' },
      { name: 'House Down Payment', type: 'goal' as const, color: '#8B5CF6', icon: 'Home' },
      { name: 'Vehicle Fund', type: 'goal' as const, color: '#F59E0B', icon: 'Car' },
      { name: 'Wedding Fund', type: 'goal' as const, color: '#EC4899', icon: 'Heart' },
      { name: 'Business Investment', type: 'goal' as const, color: '#84CC16', icon: 'Briefcase' },
      { name: 'Investment Portfolio', type: 'goal' as const, color: '#F97316', icon: 'TrendingUp' },
      
      // Loan categories
      { name: 'Personal Loan', type: 'loan' as const, color: '#EF4444', icon: 'CreditCard' },
      { name: 'Mortgage', type: 'loan' as const, color: '#10B981', icon: 'Home' },
      { name: 'Car Loan', type: 'loan' as const, color: '#3B82F6', icon: 'Car' },
      { name: 'Credit Card Debt', type: 'loan' as const, color: '#EC4899', icon: 'CreditCard' },
      { name: 'Student Loan', type: 'loan' as const, color: '#8B5CF6', icon: 'BookOpen' },
      { name: 'Business Loan', type: 'loan' as const, color: '#F59E0B', icon: 'Briefcase' },
      { name: 'Medical Debt', type: 'loan' as const, color: '#06B6D4', icon: 'Heart' },
      
      // Asset categories
      { name: 'Real Estate', type: 'asset' as const, color: '#10B981', icon: 'Home' },
      { name: 'Vehicles', type: 'asset' as const, color: '#3B82F6', icon: 'Car' },
      { name: 'Electronics', type: 'asset' as const, color: '#8B5CF6', icon: 'Smartphone' },
      { name: 'Jewelry & Valuables', type: 'asset' as const, color: '#F59E0B', icon: 'Gem' },
      { name: 'Investment Assets', type: 'asset' as const, color: '#06B6D4', icon: 'TrendingUp' },
      { name: 'Collectibles', type: 'asset' as const, color: '#EC4899', icon: 'Gift' },
      { name: 'Business Assets', type: 'asset' as const, color: '#84CC16', icon: 'Briefcase' },
    ];

    const categoriesToInsert = defaultCategories.map(cat => ({
      ...cat,
      user_id: userId
    }));

    const { error } = await supabase
      .from('categories')
      .insert(categoriesToInsert);

    if (error) throw error;
  },

  // Get category types for dropdown
  getCategoryTypes(): Array<{ value: string; label: string; description: string }> {
    return [
      { 
        value: 'income', 
        label: 'Income', 
        description: 'Categories for money coming in (salary, freelance, etc.)' 
      },
      { 
        value: 'expense', 
        label: 'Expense', 
        description: 'Categories for money going out (food, bills, etc.)' 
      },
      { 
        value: 'goal', 
        label: 'Financial Goal', 
        description: 'Categories for savings goals and targets' 
      },
      { 
        value: 'loan', 
        label: 'Loan/Debt', 
        description: 'Categories for loans and debt management' 
      },
      { 
        value: 'asset', 
        label: 'Asset', 
        description: 'Categories for tracking valuable possessions' 
      }
    ];
  },

  // Bulk update categories
  async bulkUpdateCategories(updates: Array<{ id: string; updates: Partial<CategoryUpdate> }>): Promise<void> {
    const userId = await getAuthenticatedUserId();
    
    for (const update of updates) {
      await supabase
        .from('categories')
        .update(update.updates)
        .eq('id', update.id)
        .eq('user_id', userId);
    }
  },

  // Duplicate category
  async duplicateCategory(id: string, newName: string): Promise<Category> {
    const originalCategory = await this.getCategory(id);
    if (!originalCategory) throw new Error('Category not found');

    const duplicateData = {
      name: newName,
      type: originalCategory.type,
      color: originalCategory.color,
      icon: originalCategory.icon
    };

    return this.createCategory(duplicateData);
  }
};
