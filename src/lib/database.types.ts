export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          first_name: string | null
          last_name: string | null
          email: string | null
          phone: string | null
          bio: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          phone?: string | null
          bio?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          phone?: string | null
          bio?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      wallets: {
        Row: {
          id: string
          user_id: string
          name: string
          account_number: string
          balance: number
          type: 'bank' | 'ewallet'
          color: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          account_number: string
          balance?: number
          type: 'bank' | 'ewallet'
          color?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          account_number?: string
          balance?: number
          type?: 'bank' | 'ewallet'
          color?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'income' | 'expense'
          color: string
          icon: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: 'income' | 'expense'
          color?: string
          icon?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'income' | 'expense'
          color?: string
          icon?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          wallet_id: string
          category_id: string
          amount: number
          type: 'income' | 'expense'
          description: string
          date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          wallet_id: string
          category_id: string
          amount: number
          type: 'income' | 'expense'
          description: string
          date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          wallet_id?: string
          category_id?: string
          amount?: number
          type?: 'income' | 'expense'
          description?: string
          date?: string
          created_at?: string
          updated_at?: string
        }
      }
      budgets: {
        Row: {
          id: string
          user_id: string
          category_id: string
          amount: number
          month: string
          year: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_id: string
          amount: number
          month: string
          year: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: string
          amount?: number
          month?: string
          year?: number
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: 'info' | 'warning' | 'success' | 'error'
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type?: 'info' | 'warning' | 'success' | 'error'
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: 'info' | 'warning' | 'success' | 'error'
          read?: boolean
          created_at?: string
        }
      }
      assets: {
        Row: {
          id: string
          user_id: string
          name: string
          category: 'property' | 'vehicle' | 'electronics' | 'jewelry' | 'investment' | 'other'
          current_value: number
          purchase_value: number
          purchase_date: string
          monthly_contribution: number | null
          interest_rate: number | null
          status: 'active' | 'sold' | 'depreciated'
          condition: 'excellent' | 'good' | 'fair' | 'poor'
          description: string | null
          location: string | null
          notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          category: 'property' | 'vehicle' | 'electronics' | 'jewelry' | 'investment' | 'other'
          current_value?: number
          purchase_value?: number
          purchase_date: string
          monthly_contribution?: number | null
          interest_rate?: number | null
          status?: 'active' | 'sold' | 'depreciated'
          condition?: 'excellent' | 'good' | 'fair' | 'poor'
          description?: string | null
          location?: string | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          category?: 'property' | 'vehicle' | 'electronics' | 'jewelry' | 'investment' | 'other'
          current_value?: number
          purchase_value?: number
          purchase_date?: string
          monthly_contribution?: number | null
          interest_rate?: number | null
          status?: 'active' | 'sold' | 'depreciated'
          condition?: 'excellent' | 'good' | 'fair' | 'poor'
          description?: string | null
          location?: string | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      financial_goals: {
        Row: {
          id: string
          user_id: string
          title: string
          category: 'retirement' | 'education' | 'travel' | 'house' | 'emergency' | 'investment' | 'vehicle' | 'wedding' | 'business' | 'other'
          target_amount: number
          current_amount: number
          target_date: string
          priority: 'high' | 'medium' | 'low'
          status: 'active' | 'completed' | 'paused' | 'cancelled'
          description: string | null
          monthly_target: number
          auto_contribution: boolean
          contribution_source: string | null
          reminder_enabled: boolean
          reminder_frequency: 'weekly' | 'monthly' | 'quarterly'
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          category: 'retirement' | 'education' | 'travel' | 'house' | 'emergency' | 'investment' | 'vehicle' | 'wedding' | 'business' | 'other'
          target_amount: number
          current_amount?: number
          target_date: string
          priority?: 'high' | 'medium' | 'low'
          status?: 'active' | 'completed' | 'paused' | 'cancelled'
          description?: string | null
          monthly_target?: number
          auto_contribution?: boolean
          contribution_source?: string | null
          reminder_enabled?: boolean
          reminder_frequency?: 'weekly' | 'monthly' | 'quarterly'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          category?: 'retirement' | 'education' | 'travel' | 'house' | 'emergency' | 'investment' | 'vehicle' | 'wedding' | 'business' | 'other'
          target_amount?: number
          current_amount?: number
          target_date?: string
          priority?: 'high' | 'medium' | 'low'
          status?: 'active' | 'completed' | 'paused' | 'cancelled'
          description?: string | null
          monthly_target?: number
          auto_contribution?: boolean
          contribution_source?: string | null
          reminder_enabled?: boolean
          reminder_frequency?: 'weekly' | 'monthly' | 'quarterly'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      goal_contributions: {
        Row: {
          id: string
          user_id: string
          goal_id: string
          amount: number
          contribution_date: string
          source_wallet_id: string | null
          notes: string | null
          is_automatic: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          goal_id: string
          amount: number
          contribution_date?: string
          source_wallet_id?: string | null
          notes?: string | null
          is_automatic?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          goal_id?: string
          amount?: number
          contribution_date?: string
          source_wallet_id?: string | null
          notes?: string | null
          is_automatic?: boolean
          created_at?: string
        }
      }
    }
  }
}
