import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Eye,
  EyeOff,
  Target,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { Layout } from '../components/Layout';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { dashboardService, DashboardStats } from '../services/dashboardService';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardService.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getChangePercentage = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const actionButtons = (
    <div className="flex items-center space-x-3">
      <button
        onClick={handleRefresh}
        disabled={refreshing}
        className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        <span>Refresh</span>
      </button>
    </div>
  );

  if (loading) {
    return (
      <Layout title="Dashboard" action={actionButtons}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (error || !stats) {
    return (
      <Layout title="Dashboard" action={actionButtons}>
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={loadDashboardData}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </Layout>
    );
  }

  // Calculate trend indicators
  const currentMonthData = stats.monthlyTrend[stats.monthlyTrend.length - 1];
  const previousMonthData = stats.monthlyTrend[stats.monthlyTrend.length - 2];
  
  const incomeChange = previousMonthData ? getChangePercentage(currentMonthData?.income || 0, previousMonthData.income) : 0;
  const expenseChange = previousMonthData ? getChangePercentage(currentMonthData?.expense || 0, previousMonthData.expense) : 0;

  return (
    <Layout title="Dashboard" action={actionButtons}>
      <div className="space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-blue-600" />
              </div>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {showBalance ? <EyeOff className="w-4 h-4 text-gray-500" /> : <Eye className="w-4 h-4 text-gray-500" />}
              </button>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600">Total Balance</p>
              <p className="text-2xl font-bold text-gray-900">
                {showBalance ? formatCurrency(stats.totalBalance) : '••••••••'}
              </p>
              <p className="text-sm text-gray-500">Across all wallets</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-green-500" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600">Monthly Income</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.monthlyIncome)}</p>
              <p className={`text-sm ${incomeChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {incomeChange >= 0 ? '+' : ''}{incomeChange.toFixed(1)}% from last month
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
              <ArrowDownRight className="w-5 h-5 text-red-500" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600">Monthly Expenses</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.monthlyExpenses)}</p>
              <p className={`text-sm ${expenseChange <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {expenseChange >= 0 ? '+' : ''}{expenseChange.toFixed(1)}% from last month
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <Plus className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600">Savings Rate</p>
              <p className="text-2xl font-bold text-gray-900">{stats.savingsRate.toFixed(1)}%</p>
              <p className="text-sm text-gray-500">{stats.totalTransactions} transactions this month</p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Income vs Expense Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Income vs Expenses Trend</h3>
              <select className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>Last 6 months</option>
                <option>Last 12 months</option>
                <option>This year</option>
              </select>
            </div>
            <div className="h-80">
              {stats.monthlyTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" stroke="#666" fontSize={12} />
                    <YAxis stroke="#666" fontSize={12} tickFormatter={(value) => `${value / 1000000}M`} />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), '']}
                      labelStyle={{ color: '#666' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="income" 
                      stroke="#10B981" 
                      strokeWidth={3}
                      dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                      name="Income"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="expense" 
                      stroke="#EF4444" 
                      strokeWidth={3}
                      dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
                      name="Expenses"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No transaction data available</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Expense Categories */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Top Expense Categories</h3>
              <select className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>This month</option>
                <option>Last month</option>
                <option>Last 3 months</option>
              </select>
            </div>
            <div className="h-80">
              {stats.topCategories.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.topCategories}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="amount"
                    >
                      {stats.topCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <PieChart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No expense data available</p>
                  </div>
                </div>
              )}
            </div>
            {stats.topCategories.length > 0 && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                {stats.topCategories.map((category, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <span className="text-sm text-gray-600 truncate">{category.name}</span>
                    <span className="text-sm font-medium text-gray-900">{category.percentage.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Budget Overview */}
        {stats.budgetOverview.totalBudget > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Budget Overview</h3>
              <span className="text-sm text-gray-500">This month</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Budget</p>
                <p className="text-xl font-bold text-blue-600">{formatCurrency(stats.budgetOverview.totalBudget)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Spent</p>
                <p className="text-xl font-bold text-red-600">{formatCurrency(stats.budgetOverview.totalSpent)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Over Budget</p>
                <p className="text-xl font-bold text-red-600">{stats.budgetOverview.overBudgetCount}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">On Track</p>
                <p className="text-xl font-bold text-green-600">{stats.budgetOverview.onTrackCount}</p>
              </div>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.min((stats.budgetOverview.totalSpent / stats.budgetOverview.totalBudget) * 100, 100)}%` 
                }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>0%</span>
              <span>{Math.round((stats.budgetOverview.totalSpent / stats.budgetOverview.totalBudget) * 100)}% used</span>
              <span>100%</span>
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Recent Transactions</h3>
            <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
              View All
            </button>
          </div>
          <div className="space-y-4">
            {stats.recentTransactions.length > 0 ? (
              stats.recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {transaction.type === 'income' ? (
                        <ArrowUpRight className="w-5 h-5 text-green-600" />
                      ) : (
                        <ArrowDownRight className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-sm text-gray-500">
                        {transaction.category_name} • {transaction.wallet_name}
                      </p>
                      <p className="text-xs text-gray-400">{formatDate(transaction.date)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No recent transactions</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};
