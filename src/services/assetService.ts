import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

type Asset = Database['public']['Tables']['assets']['Row'];
type AssetInsert = Database['public']['Tables']['assets']['Insert'];
type AssetUpdate = Database['public']['Tables']['assets']['Update'];

// Helper function to get authenticated user ID
async function getAuthenticatedUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('User not authenticated');
  }
  return user.id;
}

export interface AssetWithCalculations extends Asset {
  gainLoss: number;
  gainLossPercentage: number;
  monthsOwned: number;
  projectedValue?: number;
}

export const assetService = {
  // Get all assets
  async getAssets(): Promise<AssetWithCalculations[]> {
    const userId = await getAuthenticatedUserId();
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return (data || []).map(asset => this.calculateAssetMetrics(asset));
  },

  // Get assets by category
  async getAssetsByCategory(category: string): Promise<AssetWithCalculations[]> {
    const userId = await getAuthenticatedUserId();
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('user_id', userId)
      .eq('category', category)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return (data || []).map(asset => this.calculateAssetMetrics(asset));
  },

  // Get asset by ID
  async getAsset(id: string): Promise<AssetWithCalculations | null> {
    const userId = await getAuthenticatedUserId();
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    
    return data ? this.calculateAssetMetrics(data) : null;
  },

  // Create new asset
  async createAsset(asset: Omit<AssetInsert, 'user_id'>): Promise<Asset> {
    const userId = await getAuthenticatedUserId();
    const { data, error } = await supabase
      .from('assets')
      .insert([{ ...asset, user_id: userId }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update asset
  async updateAsset(id: string, updates: Omit<AssetUpdate, 'user_id'>): Promise<Asset> {
    const userId = await getAuthenticatedUserId();
    const { data, error } = await supabase
      .from('assets')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete asset (soft delete)
  async deleteAsset(id: string): Promise<void> {
    const userId = await getAuthenticatedUserId();
    const { error } = await supabase
      .from('assets')
      .update({ is_active: false })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  },

  // Calculate asset metrics
  calculateAssetMetrics(asset: Asset): AssetWithCalculations {
    const gainLoss = asset.current_value - asset.purchase_value;
    const gainLossPercentage = asset.purchase_value > 0 ? (gainLoss / asset.purchase_value) * 100 : 0;
    
    // Calculate months owned
    const purchaseDate = new Date(asset.purchase_date);
    const currentDate = new Date();
    const monthsOwned = Math.floor((currentDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44));

    // Calculate projected value if it's an investment with interest rate
    let projectedValue;
    if (asset.interest_rate && asset.interest_rate > 0 && asset.category === 'investment') {
      const monthlyRate = asset.interest_rate / 100 / 12;
      const monthsFromPurchase = monthsOwned;
      projectedValue = asset.purchase_value * Math.pow(1 + monthlyRate, monthsFromPurchase);
      
      // Add monthly contributions if any
      if (asset.monthly_contribution && asset.monthly_contribution > 0) {
        const contributionGrowth = asset.monthly_contribution * 
          ((Math.pow(1 + monthlyRate, monthsFromPurchase) - 1) / monthlyRate);
        projectedValue += contributionGrowth;
      }
    }

    return {
      ...asset,
      gainLoss,
      gainLossPercentage,
      monthsOwned,
      projectedValue
    };
  },

  // Get asset statistics
  async getAssetStats(): Promise<{
    totalAssets: number;
    totalCurrentValue: number;
    totalPurchaseValue: number;
    totalGainLoss: number;
    totalGainLossPercentage: number;
    categoryBreakdown: Array<{
      category: string;
      count: number;
      value: number;
      percentage: number;
    }>;
    topPerformers: AssetWithCalculations[];
    worstPerformers: AssetWithCalculations[];
  }> {
    const assets = await this.getAssets();
    
    const totalCurrentValue = assets.reduce((sum, asset) => sum + asset.current_value, 0);
    const totalPurchaseValue = assets.reduce((sum, asset) => sum + asset.purchase_value, 0);
    const totalGainLoss = totalCurrentValue - totalPurchaseValue;
    const totalGainLossPercentage = totalPurchaseValue > 0 ? (totalGainLoss / totalPurchaseValue) * 100 : 0;

    // Category breakdown
    const categoryData: { [key: string]: { count: number; value: number } } = {};
    assets.forEach(asset => {
      if (!categoryData[asset.category]) {
        categoryData[asset.category] = { count: 0, value: 0 };
      }
      categoryData[asset.category].count += 1;
      categoryData[asset.category].value += asset.current_value;
    });

    const categoryBreakdown = Object.entries(categoryData).map(([category, data]) => ({
      category,
      count: data.count,
      value: data.value,
      percentage: totalCurrentValue > 0 ? (data.value / totalCurrentValue) * 100 : 0
    }));

    // Top and worst performers
    const sortedByPerformance = [...assets].sort((a, b) => b.gainLossPercentage - a.gainLossPercentage);
    const topPerformers = sortedByPerformance.slice(0, 5);
    const worstPerformers = sortedByPerformance.slice(-5).reverse();

    return {
      totalAssets: assets.length,
      totalCurrentValue,
      totalPurchaseValue,
      totalGainLoss,
      totalGainLossPercentage,
      categoryBreakdown,
      topPerformers,
      worstPerformers
    };
  },

  // Update asset value (for tracking value changes over time)
  async updateAssetValue(id: string, newValue: number, notes?: string): Promise<Asset> {
    const updates: Partial<AssetUpdate> = {
      current_value: newValue,
      updated_at: new Date().toISOString()
    };

    if (notes) {
      updates.notes = notes;
    }

    return this.updateAsset(id, updates);
  },

  // Get assets due for value update (older than 30 days)
  async getAssetsNeedingUpdate(): Promise<AssetWithCalculations[]> {
    const userId = await getAuthenticatedUserId();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .lt('updated_at', thirtyDaysAgo.toISOString())
      .order('updated_at', { ascending: true });

    if (error) throw error;
    
    return (data || []).map(asset => this.calculateAssetMetrics(asset));
  }
};
