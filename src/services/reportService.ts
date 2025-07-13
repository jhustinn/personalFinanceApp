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

export interface ReportData {
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netSavings: number;
    savingsRate: number;
    transactionCount: number;
    avgDailySpending: number;
    topSpendingDay: string;
    mostExpensiveTransaction: number;
  };
  monthlyTrend: Array<{
    month: string;
    income: number;
    expense: number;
    savings: number;
    savingsRate: number;
  }>;
  categoryBreakdown: Array<{
    name: string;
    amount: number;
    percentage: number;
    color: string;
    transactionCount: number;
    avgTransaction: number;
  }>;
  walletPerformance: Array<{
    name: string;
    totalIncome: number;
    totalExpenses: number;
    netFlow: number;
    transactionCount: number;
    color: string;
  }>;
  dailySpending: Array<{
    date: string;
    amount: number;
    transactionCount: number;
  }>;
  budgetAnalysis: Array<{
    categoryName: string;
    budgetAmount: number;
    spentAmount: number;
    remainingAmount: number;
    utilizationRate: number;
    status: 'under' | 'on-track' | 'over';
  }>;
  insights: Array<{
    type: 'positive' | 'warning' | 'info';
    title: string;
    description: string;
    value?: string;
  }>;
}

export const reportService = {
  // Get comprehensive report data
  async getReportData(period: 'month' | '3months' | '6months' | 'year' = '6months'): Promise<ReportData> {
    const userId = await getAuthenticatedUserId();
    const { startDate, endDate } = this.getDateRange(period);

    // Fetch all required data in parallel
    const [
      transactions,
      categories,
      wallets,
      budgets
    ] = await Promise.all([
      this.getTransactions(userId, startDate, endDate),
      this.getCategories(userId),
      this.getWallets(userId),
      this.getBudgets(userId)
    ]);

    // Calculate summary statistics
    const summary = this.calculateSummary(transactions, startDate, endDate);
    
    // Generate monthly trend
    const monthlyTrend = this.generateMonthlyTrend(transactions, period);
    
    // Calculate category breakdown
    const categoryBreakdown = this.calculateCategoryBreakdown(transactions, categories);
    
    // Calculate wallet performance
    const walletPerformance = this.calculateWalletPerformance(transactions, wallets);
    
    // Generate daily spending pattern
    const dailySpending = this.generateDailySpending(transactions, startDate, endDate);
    
    // Calculate budget analysis
    const budgetAnalysis = await this.calculateBudgetAnalysis(userId, budgets, transactions);
    
    // Generate insights
    const insights = this.generateInsights(summary, monthlyTrend, categoryBreakdown, budgetAnalysis);

    return {
      summary,
      monthlyTrend,
      categoryBreakdown,
      walletPerformance,
      dailySpending,
      budgetAnalysis,
      insights
    };
  },

  // Get date range based on period
  getDateRange(period: string): { startDate: string; endDate: string } {
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case '3months':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case '6months':
        startDate.setMonth(endDate.getMonth() - 6);
        break;
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  },

  // Get transactions with details
  async getTransactions(userId: string, startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        category:categories(name, color),
        wallet:wallets(name, color)
      `)
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Get categories
  async getCategories(userId: string) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  },

  // Get wallets
  async getWallets(userId: string) {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  },

  // Get budgets
  async getBudgets(userId: string) {
    const currentDate = new Date();
    const currentMonth = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
    
    const { data, error } = await supabase
      .from('budgets')
      .select(`
        *,
        category:categories(name, color)
      `)
      .eq('user_id', userId)
      .eq('month', currentMonth);

    if (error) throw error;
    return data || [];
  },

  // Calculate summary statistics
  calculateSummary(transactions: any[], startDate: string, endDate: string) {
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

    // Calculate days between start and end date
    const daysDiff = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
    const avgDailySpending = daysDiff > 0 ? totalExpenses / daysDiff : 0;

    // Find top spending day
    const dailySpending: { [key: string]: number } = {};
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const date = t.date;
        dailySpending[date] = (dailySpending[date] || 0) + t.amount;
      });

    const topSpendingDay = Object.entries(dailySpending)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '';

    const mostExpensiveTransaction = Math.max(
      ...transactions.filter(t => t.type === 'expense').map(t => t.amount),
      0
    );

    return {
      totalIncome,
      totalExpenses,
      netSavings,
      savingsRate,
      transactionCount: transactions.length,
      avgDailySpending,
      topSpendingDay,
      mostExpensiveTransaction
    };
  },

  // Generate monthly trend
  generateMonthlyTrend(transactions: any[], period: string) {
    const monthlyData: { [key: string]: { income: number; expense: number } } = {};

    transactions.forEach(transaction => {
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

    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
        income: data.income,
        expense: data.expense,
        savings: data.income - data.expense,
        savingsRate: data.income > 0 ? ((data.income - data.expense) / data.income) * 100 : 0
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  },

  // Calculate category breakdown
  calculateCategoryBreakdown(transactions: any[], categories: any[]) {
    const categoryData: { [key: string]: { amount: number; count: number; color: string } } = {};
    let totalExpenses = 0;

    transactions
      .filter(t => t.type === 'expense')
      .forEach(transaction => {
        const categoryName = transaction.category?.name || 'Other';
        const categoryColor = transaction.category?.color || '#6B7280';

        if (!categoryData[categoryName]) {
          categoryData[categoryName] = { amount: 0, count: 0, color: categoryColor };
        }

        categoryData[categoryName].amount += transaction.amount;
        categoryData[categoryName].count += 1;
        totalExpenses += transaction.amount;
      });

    return Object.entries(categoryData)
      .map(([name, data]) => ({
        name,
        amount: data.amount,
        percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0,
        color: data.color,
        transactionCount: data.count,
        avgTransaction: data.count > 0 ? data.amount / data.count : 0
      }))
      .sort((a, b) => b.amount - a.amount);
  },

  // Calculate wallet performance
  calculateWalletPerformance(transactions: any[], wallets: any[]) {
    const walletData: { [key: string]: { income: number; expense: number; count: number; color: string } } = {};

    transactions.forEach(transaction => {
      const walletName = transaction.wallet?.name || 'Unknown';
      const walletColor = transaction.wallet?.color || '#6B7280';

      if (!walletData[walletName]) {
        walletData[walletName] = { income: 0, expense: 0, count: 0, color: walletColor };
      }

      if (transaction.type === 'income') {
        walletData[walletName].income += transaction.amount;
      } else {
        walletData[walletName].expense += transaction.amount;
      }
      walletData[walletName].count += 1;
    });

    return Object.entries(walletData)
      .map(([name, data]) => ({
        name,
        totalIncome: data.income,
        totalExpenses: data.expense,
        netFlow: data.income - data.expense,
        transactionCount: data.count,
        color: data.color
      }))
      .sort((a, b) => b.netFlow - a.netFlow);
  },

  // Generate daily spending pattern
  generateDailySpending(transactions: any[], startDate: string, endDate: string) {
    const dailyData: { [key: string]: { amount: number; count: number } } = {};

    transactions
      .filter(t => t.type === 'expense')
      .forEach(transaction => {
        const date = transaction.date;
        if (!dailyData[date]) {
          dailyData[date] = { amount: 0, count: 0 };
        }
        dailyData[date].amount += transaction.amount;
        dailyData[date].count += 1;
      });

    return Object.entries(dailyData)
      .map(([date, data]) => ({
        date,
        amount: data.amount,
        transactionCount: data.count
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30); // Last 30 days
  },

  // Calculate budget analysis
  async calculateBudgetAnalysis(userId: string, budgets: any[], transactions: any[]) {
    const currentDate = new Date();
    const currentMonth = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;

    const budgetAnalysis = await Promise.all(
      budgets.map(async (budget) => {
        const spentAmount = await this.getSpentAmount(userId, budget.category_id, currentMonth);
        const remainingAmount = budget.amount - spentAmount;
        const utilizationRate = budget.amount > 0 ? (spentAmount / budget.amount) * 100 : 0;

        let status: 'under' | 'on-track' | 'over';
        if (utilizationRate > 100) {
          status = 'over';
        } else if (utilizationRate > 80) {
          status = 'on-track';
        } else {
          status = 'under';
        }

        return {
          categoryName: budget.category?.name || 'Unknown',
          budgetAmount: budget.amount,
          spentAmount,
          remainingAmount,
          utilizationRate,
          status
        };
      })
    );

    return budgetAnalysis;
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
  },

  // Generate insights
  generateInsights(summary: any, monthlyTrend: any[], categoryBreakdown: any[], budgetAnalysis: any[]) {
    const insights: Array<{
      type: 'positive' | 'warning' | 'info';
      title: string;
      description: string;
      value?: string;
    }> = [];

    // Savings rate insight
    if (summary.savingsRate > 20) {
      insights.push({
        type: 'positive',
        title: 'Excellent Savings Rate!',
        description: `Your savings rate of ${summary.savingsRate.toFixed(1)}% is above the recommended 20%. Keep up the great work!`,
        value: `${summary.savingsRate.toFixed(1)}%`
      });
    } else if (summary.savingsRate < 10) {
      insights.push({
        type: 'warning',
        title: 'Low Savings Rate',
        description: `Your savings rate of ${summary.savingsRate.toFixed(1)}% is below the recommended 20%. Consider reducing expenses or increasing income.`,
        value: `${summary.savingsRate.toFixed(1)}%`
      });
    }

    // Top spending category insight
    if (categoryBreakdown.length > 0) {
      const topCategory = categoryBreakdown[0];
      if (topCategory.percentage > 40) {
        insights.push({
          type: 'warning',
          title: 'High Category Concentration',
          description: `${topCategory.name} accounts for ${topCategory.percentage.toFixed(1)}% of your expenses. Consider diversifying your spending.`,
          value: `${topCategory.percentage.toFixed(1)}%`
        });
      }
    }

    // Monthly trend insight
    if (monthlyTrend.length >= 2) {
      const lastMonth = monthlyTrend[monthlyTrend.length - 1];
      const previousMonth = monthlyTrend[monthlyTrend.length - 2];
      const expenseChange = ((lastMonth.expense - previousMonth.expense) / previousMonth.expense) * 100;

      if (expenseChange > 20) {
        insights.push({
          type: 'warning',
          title: 'Spending Increase',
          description: `Your expenses increased by ${expenseChange.toFixed(1)}% compared to last month. Review your recent purchases.`,
          value: `+${expenseChange.toFixed(1)}%`
        });
      } else if (expenseChange < -10) {
        insights.push({
          type: 'positive',
          title: 'Spending Reduction',
          description: `Great job! You reduced your expenses by ${Math.abs(expenseChange).toFixed(1)}% compared to last month.`,
          value: `-${Math.abs(expenseChange).toFixed(1)}%`
        });
      }
    }

    // Budget insights
    const overBudgetCount = budgetAnalysis.filter(b => b.status === 'over').length;
    if (overBudgetCount > 0) {
      insights.push({
        type: 'warning',
        title: 'Budget Exceeded',
        description: `You've exceeded the budget in ${overBudgetCount} ${overBudgetCount === 1 ? 'category' : 'categories'}. Review your spending in these areas.`,
        value: `${overBudgetCount} categories`
      });
    }

    // Transaction frequency insight
    if (summary.transactionCount > 0) {
      const avgTransactionSize = summary.totalExpenses / summary.transactionCount;
      if (avgTransactionSize < 50000) {
        insights.push({
          type: 'info',
          title: 'Frequent Small Transactions',
          description: `You make many small transactions. Consider consolidating purchases to reduce transaction fees and better track spending.`,
          value: `Avg: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(avgTransactionSize)}`
        });
      }
    }

    return insights;
  },

  // Export report data to CSV
  async exportReportData(reportData: ReportData, period: string): Promise<string> {
    const csvRows = [];
    
    // Summary section
    csvRows.push(['FINANCIAL REPORT SUMMARY']);
    csvRows.push(['Period', period]);
    csvRows.push(['Total Income', reportData.summary.totalIncome]);
    csvRows.push(['Total Expenses', reportData.summary.totalExpenses]);
    csvRows.push(['Net Savings', reportData.summary.netSavings]);
    csvRows.push(['Savings Rate (%)', reportData.summary.savingsRate.toFixed(2)]);
    csvRows.push(['Transaction Count', reportData.summary.transactionCount]);
    csvRows.push(['']);

    // Category breakdown
    csvRows.push(['CATEGORY BREAKDOWN']);
    csvRows.push(['Category', 'Amount', 'Percentage', 'Transaction Count', 'Avg Transaction']);
    reportData.categoryBreakdown.forEach(category => {
      csvRows.push([
        category.name,
        category.amount,
        category.percentage.toFixed(2),
        category.transactionCount,
        category.avgTransaction.toFixed(2)
      ]);
    });
    csvRows.push(['']);

    // Monthly trend
    csvRows.push(['MONTHLY TREND']);
    csvRows.push(['Month', 'Income', 'Expenses', 'Savings', 'Savings Rate (%)']);
    reportData.monthlyTrend.forEach(month => {
      csvRows.push([
        month.month,
        month.income,
        month.expense,
        month.savings,
        month.savingsRate.toFixed(2)
      ]);
    });

    return csvRows.map(row => row.join(',')).join('\n');
  }
};
