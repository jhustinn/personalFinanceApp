import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

type Wallet = Database['public']['Tables']['wallets']['Row'];
type WalletInsert = Database['public']['Tables']['wallets']['Insert'];
type WalletUpdate = Database['public']['Tables']['wallets']['Update'];

export const walletService = {
  // Get all wallets
  async getWallets(): Promise<Wallet[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get wallet by ID
  async getWallet(id: string): Promise<Wallet | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) throw error;
    return data;
  },

  // Create new wallet
  async createWallet(wallet: Omit<WalletInsert, 'user_id'>): Promise<Wallet> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('wallets')
      .insert([{ ...wallet, user_id: user.id }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update wallet
  async updateWallet(id: string, updates: Omit<WalletUpdate, 'user_id'>): Promise<Wallet> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('wallets')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete wallet (soft delete)
  async deleteWallet(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('wallets')
      .update({ is_active: false })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
  },

  // Update wallet balance
  async updateBalance(id: string, amount: number, operation: 'add' | 'subtract'): Promise<Wallet> {
    const wallet = await this.getWallet(id);
    if (!wallet) throw new Error('Wallet not found');

    const newBalance = operation === 'add' 
      ? wallet.balance + amount 
      : wallet.balance - amount;

    return this.updateWallet(id, { balance: newBalance });
  },

  // Get total balance across all wallets
  async getTotalBalance(): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (error) throw error;
    return data?.reduce((total, wallet) => total + wallet.balance, 0) || 0;
  }
};
