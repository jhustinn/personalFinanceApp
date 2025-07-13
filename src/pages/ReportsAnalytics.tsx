import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  Calendar,
  PieChart,
  LineChart,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  DollarSign,
  Target,
  Activity
} from 'lucide-react';
import { Layout } from '../components/Layout';
import { 
  LineChart as RechartsLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  ComposedChart
} from 'recharts';
import { reportService, ReportData } from '../services/reportService';

export const ReportsAnalytics: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | '3months' | '6months' | 'year'>('6months');
  const [selectedReport, setSelectedReport] = useState('overview');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReportData();
  }, [selectedPeriod]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reportService.getReportData(selectedPeriod);
      setReportData(data);
    } catch (error) {
      console.error('Error loading report data:', error);
      setError('Failed to load report data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReportData();
    setRefreshing(false);
  };

  const handleExport = async () => {
    if (!reportData) return;
    
    try {
      const csvContent = await reportService.exportReportData(reportData, selectedPeriod);
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `financial-report-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Failed to export report. Please try again.');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'positive':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />;
      default:
        return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'positive':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const actionButtons = (
    <div className="flex items-center space-x-3">
      <select
        value={selectedPeriod}
        onChange={(e) => setSelectedPeriod(e.target.value as any)}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
      >
        <option value="month">Last Month</option>
        <option value="3months">Last 3 Months</option>
        <option value="6months">Last 6 Months</option>
        <option value="year">Last Year</option>
      </select>

      <select
        value={selectedReport}
        onChange={(e) => setSelectedReport(e.target.value)}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
      >
        <option value="overview">Overview</option>
        <option value="income">Income Analysis</option>
        <option value="expenses">Expense Analysis</option>
        <option value="trends">Trends</option>
        <option value="budgets">Budget Analysis</option>
      </select>

      <button
        onClick={handleRefresh}
        disabled={refreshing}
        className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        <span>Refresh</span>
      </button>

      <button
        onClick={handleExport}
        disabled={!reportData}
        className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
      >
        <Download className="w-4 h-4" />
        <span>Export</span>
      </button>

      <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
        <BarChart3 className="w-4 h-4" />
        <span>Generate Report</span>
      </button>
    </div>
  );

  if (loading) {
    return (
      <Layout title="Reports & Analytics" action={actionButtons}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (error || !reportData) {
    return (
      <Layout title="Reports & Analytics" action={actionButtons}>
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Report</h3>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={loadReportData}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Reports & Analytics" action={actionButtons}>
      <div className="space-y-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Income</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(reportData.summary.totalIncome)}</p>
                <p className="text-sm text-green-600 mt-1">
                  {reportData.summary.transactionCount} transactions
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(reportData.summary.totalExpenses)}</p>
                <p className="text-sm text-red-600 mt-1">
                  Avg: {formatCurrency(reportData.summary.avgDailySpending)}/day
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Savings</p>
                <p className={`text-2xl font-bold ${reportData.summary.netSavings >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {formatCurrency(reportData.summary.netSavings)}
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  {reportData.summary.savingsRate.toFixed(1)}% savings rate
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Largest Expense</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(reportData.summary.mostExpensiveTransaction)}
                </p>
                <p className="text-sm text-purple-600 mt-1">
                  Top spending day: {reportData.summary.topSpendingDay ? new Date(reportData.summary.topSpendingDay).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : 'N/A'}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Income vs Expenses Trend */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Income vs Expenses Trend</h3>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">Income</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-gray-600">Expenses</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-600">Savings</span>
                </div>
              </div>
            </div>
            <div className="h-80">
              {reportData.monthlyTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={reportData.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" stroke="#666" fontSize={12} />
                    <YAxis stroke="#666" fontSize={12} tickFormatter={(value) => `${value / 1000000}M`} />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), '']}
                      labelStyle={{ color: '#666' }}
                    />
                    <Bar dataKey="income" fill="#10B981" name="Income" />
                    <Bar dataKey="expense" fill="#EF4444" name="Expenses" />
                    <Line 
                      type="monotone" 
                      dataKey="savings" 
                      stroke="#3B82F6" 
                      strokeWidth={3}
                      dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                      name="Savings"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <LineChart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No trend data available</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Expense Categories</h3>
              <span className="text-sm text-gray-500">By amount spent</span>
            </div>
            <div className="h-80">
              {reportData.categoryBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={reportData.categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="amount"
                    >
                      {reportData.categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <PieChart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No category data available</p>
                  </div>
                </div>
              )}
            </div>
            {reportData.categoryBreakdown.length > 0 && (
              <div className="grid grid-cols-1 gap-3 mt-4">
                {reportData.categoryBreakdown.slice(0, 5).map((category, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      ></div>
                      <div>
                        <span className="text-sm font-medium text-gray-900">{category.name}</span>
                        <p className="text-xs text-gray-500">{category.transactionCount} transactions</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(category.amount)}</span>
                      <p className="text-xs text-gray-500">{category.percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Additional Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Daily Spending Pattern */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Daily Spending Pattern</h3>
              <span className="text-sm text-gray-500">Last 30 days</span>
            </div>
            <div className="h-80">
              {reportData.dailySpending.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={reportData.dailySpending}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#666" 
                      fontSize={12}
                      tickFormatter={(value) => new Date(value).getDate().toString()}
                    />
                    <YAxis stroke="#666" fontSize={12} tickFormatter={(value) => `${value / 1000}K`} />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), 'Spent']}
                      labelFormatter={(value) => new Date(value).toLocaleDateString('id-ID')}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#8B5CF6" 
                      fill="#8B5CF6"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No daily spending data available</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Wallet Performance */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Wallet Performance</h3>
              <span className="text-sm text-gray-500">Net flow</span>
            </div>
            <div className="h-80">
              {reportData.walletPerformance.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={reportData.walletPerformance} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" stroke="#666" fontSize={12} tickFormatter={(value) => `${value / 1000000}M`} />
                    <YAxis type="category" dataKey="name" stroke="#666" fontSize={12} width={100} />
                    <Tooltip formatter={(value: number) => [formatCurrency(value), 'Net Flow']} />
                    <Bar dataKey="netFlow" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No wallet data available</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Budget Analysis */}
        {reportData.budgetAnalysis.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Budget Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reportData.budgetAnalysis.map((budget, index) => (
                <div key={index} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">{budget.categoryName}</h4>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      budget.status === 'over' ? 'bg-red-100 text-red-800' :
                      budget.status === 'on-track' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {budget.status === 'over' ? 'Over Budget' :
                       budget.status === 'on-track' ? 'On Track' : 'Under Budget'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Budget:</span>
                      <span className="font-medium">{formatCurrency(budget.budgetAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Spent:</span>
                      <span className="font-medium">{formatCurrency(budget.spentAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Remaining:</span>
                      <span className={`font-medium ${budget.remainingAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(budget.remainingAmount)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          budget.utilizationRate > 100 ? 'bg-red-500' :
                          budget.utilizationRate > 80 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(budget.utilizationRate, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {budget.utilizationRate.toFixed(1)}% utilized
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Financial Insights */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-6">AI Financial Insights</h3>
          {reportData.insights.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reportData.insights.map((insight, index) => (
                <div key={index} className={`rounded-xl p-6 border ${getInsightColor(insight.type)}`}>
                  <div className="flex items-start space-x-3">
                    {getInsightIcon(insight.type)}
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-2">{insight.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                      {insight.value && (
                        <p className="text-lg font-bold text-gray-900">{insight.value}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Info className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No insights available for this period</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};
