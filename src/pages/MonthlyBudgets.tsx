import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Calendar, 
  Target, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Edit,
  Trash2,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { Layout } from '../components/Layout';
import { AddBudgetModal } from '../components/AddBudgetModal';
import { budgetService, BudgetWithDetails } from '../services/budgetService';
import { Database } from '../lib/database.types';

type Budget = Database['public']['Tables']['budgets']['Row'];

export const MonthlyBudgets: React.FC = () => {
  const [budgets, setBudgets] = useState<BudgetWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadBudgets();
  }, [selectedMonth]);

  const loadBudgets = async () => {
    try {
      setLoading(true);
      const [year, month] = selectedMonth.split('-');
      const data = await budgetService.getBudgets(month, parseInt(year));
      setBudgets(data);
    } catch (error) {
      console.error('Error loading budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBudgets();
    setRefreshing(false);
  };

  const handleAddBudget = async (budgetData: Omit<Budget, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      await budgetService.createBudget(budgetData);
      await loadBudgets();
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding budget:', error);
      alert('Error adding budget. Please try again.');
    }
  };

  const handleEditBudget = async (budgetData: Omit<Budget, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!editingBudget) return;
    
    try {
      await budgetService.updateBudget(editingBudget.id, budgetData);
      await loadBudgets();
      setEditingBudget(null);
    } catch (error) {
      console.error('Error updating budget:', error);
      alert('Error updating budget. Please try again.');
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      try {
        await budgetService.deleteBudget(id);
        await loadBudgets();
      } catch (error) {
        console.error('Error deleting budget:', error);
        alert('Error deleting budget. Please try again.');
      }
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

  const getProgressPercentage = (spent: number, budget: number) => {
    return Math.min((spent / budget) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusIcon = (spent: number, budget: number) => {
    const percentage = (spent / budget) * 100;
    if (percentage >= 100) return <AlertTriangle className="w-5 h-5 text-red-500" />;
    if (percentage >= 80) return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    return <CheckCircle className="w-5 h-5 text-green-500" />;
  };

  const generateMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    
    for (let i = -6; i <= 6; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const value = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      const label = date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      options.push({ value, label });
    }
    
    return options;
  };

  const exportBudgets = () => {
    const csvContent = [
      ['Category', 'Budget Amount', 'Spent Amount', 'Remaining', 'Progress %'].join(','),
      ...budgets.map(budget => [
        budget.category?.name || '',
        budget.amount,
        budget.spent || 0,
        budget.amount - (budget.spent || 0),
        Math.round(((budget.spent || 0) / budget.amount) * 100)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budgets-${selectedMonth}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);
  const totalSpent = budgets.reduce((sum, budget) => sum + (budget.spent || 0), 0);
  const overBudgetCount = budgets.filter(b => (b.spent || 0) > b.amount).length;
  const onTrackCount = budgets.filter(b => (b.spent || 0) <= b.amount * 0.8).length;

  const actionButtons = (
    <div className="flex items-center space-x-3">
      <select
        value={selectedMonth}
        onChange={(e) => setSelectedMonth(e.target.value)}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
      >
        {generateMonthOptions().map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
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
        onClick={exportBudgets}
        className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
      >
        <Download className="w-4 h-4" />
        <span>Export</span>
      </button>

      <button
        onClick={() => setShowAddModal(true)}
        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span>Add Budget</span>
      </button>
    </div>
  );

  if (loading) {
    return (
      <Layout title="Monthly Budgets" action={actionButtons}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Monthly Budgets" action={actionButtons}>
      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Budget</p>
                <p className="text-2xl font-bold text-gray-800">{formatCurrency(totalBudget)}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalSpent)}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Over Budget</p>
                <p className="text-2xl font-bold text-red-600">{overBudgetCount}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">On Track</p>
                <p className="text-2xl font-bold text-green-600">{onTrackCount}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Budget Overview */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Budget Overview</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>
                {new Date(selectedMonth + '-01').toLocaleDateString('id-ID', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </span>
            </div>
          </div>

          {totalBudget > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Overall Progress</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(totalSpent)} / {formatCurrency(totalBudget)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(getProgressPercentage(totalSpent, totalBudget))}`}
                  style={{ width: `${getProgressPercentage(totalSpent, totalBudget)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span>{Math.round(getProgressPercentage(totalSpent, totalBudget))}%</span>
                <span>100%</span>
              </div>
            </div>
          )}

          {budgets.length === 0 ? (
            <div className="text-center py-12">
              <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No budgets found</h3>
              <p className="text-gray-500 mb-6">
                Start by creating your first budget for this month.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Add Budget</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {budgets.map((budget) => {
                const percentage = getProgressPercentage(budget.spent || 0, budget.amount);
                return (
                  <div key={budget.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${budget.category?.color}20` }}
                        >
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: budget.category?.color }}
                          ></div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{budget.category?.name}</h4>
                          <p className="text-sm text-gray-500">
                            {formatCurrency(budget.spent || 0)} of {formatCurrency(budget.amount)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(budget.spent || 0, budget.amount)}
                        <div className="flex items-center space-x-1">
                          <button 
                            onClick={() => setEditingBudget(budget)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteBudget(budget.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(percentage)}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{Math.round(percentage)}% used</span>
                        <span className={`font-medium ${
                          (budget.spent || 0) > budget.amount ? 'text-red-600' : 
                          percentage >= 80 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {(budget.spent || 0) > budget.amount 
                            ? `Over by ${formatCurrency((budget.spent || 0) - budget.amount)}`
                            : `${formatCurrency(budget.amount - (budget.spent || 0))} remaining`
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Budget Tips */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Budget Tips</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Review your spending weekly to stay on track</li>
                <li>• Set realistic budgets based on your past spending patterns</li>
                <li>• Consider the 50/30/20 rule: 50% needs, 30% wants, 20% savings</li>
                <li>• Use alerts to notify you when you're approaching budget limits</li>
                <li>• Adjust budgets monthly based on your actual spending</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Add/Edit Budget Modal */}
        <AddBudgetModal
          isOpen={showAddModal || !!editingBudget}
          onClose={() => {
            setShowAddModal(false);
            setEditingBudget(null);
          }}
          onAdd={editingBudget ? handleEditBudget : handleAddBudget}
          editData={editingBudget}
        />
      </div>
    </Layout>
  );
};
