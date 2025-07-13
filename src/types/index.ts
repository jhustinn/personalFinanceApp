export interface Wallet {
  id: string;
  name: string;
  account_number: string;
  balance: number;
  type: 'bank' | 'ewallet';
  color: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  wallet_id: string;
  category_id: string;
  amount: number;
  type: 'income' | 'expense';
  description: string;
  date: string;
  created_at: string;
  updated_at: string;
  wallet?: Wallet;
  category?: Category;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  category_id: string;
  amount: number;
  spent: number;
  month: string;
  year: number;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  created_at: string;
}

export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  active?: boolean;
}

export interface DashboardStats {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  totalTransactions: number;
}
