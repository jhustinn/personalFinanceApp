import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Target, 
  CreditCard, 
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Edit,
  Trash2,
  DollarSign,
  Play,
  Pause,
  RefreshCw,
  Filter,
  Download,
  Eye,
  EyeOff,
  Clock,
  Zap
} from 'lucide-react';
import { Layout } from '../components/Layout';
import { AddGoalLoanModal } from '../components/AddGoalLoanModal';
import { goalsLoansService, GoalLoanWithCalculations, GoalLoanStats } from '../services/goalsLoansService';
import { Database } from '../lib/database.types';

type GoalLoan = Database['public']['Tables']['goals_loans']['Row'];

export const GoalsAndLoans: React.FC = () => {
  const [items, setItems] = useState<GoalLoanWithCalculations[]>([]);
  const [stats, setStats] = useState<GoalLoanStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<GoalLoan | null>(null);
  const [filter, setFilter] = useState<'all' | 'goal' | 'loan'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'paused'>('all');
  const [hiddenValues, setHiddenValues] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [itemsData, statsData] = await Promise.all([
        goalsLoansService.getGoalsAndLoans(),
        goalsLoansService.getStats()
      ]);
      setItems(itemsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAddItem = async (itemData: Omit<GoalLoan, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'is_active'>) => {
    try {
      await goalsLoansService.createGoalLoan(itemData);
      await loadData();
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Error adding item. Please try again.');
    }
  };

  const handleEditItem = async (itemData: Omit<GoalLoan, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'is_active'>) => {
    if (!editingItem) return;
    
    try {
      await goalsLoansService.updateGoalLoan(editingItem.id, itemData);
      await loadData();
      setEditingItem(null);
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Error updating item. Please try again.');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      try {
        await goalsLoansService.deleteGoalLoan(id);
        await loadData();
      } catch (error) {
        console.error('Error deleting item:', error);
        alert('Error deleting item. Please try again.');
      }
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      await goalsLoansService.toggleStatus(id, newStatus);
      await loadData();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status. Please try again.');
    }
  };

  const handleCompleteItem = async (id: string) => {
    if (window.confirm('Mark this item as completed?')) {
      try {
        await goalsLoansService.completeGoalLoan(id);
        await loadData();
      } catch (error) {
        console.error('Error completing item:', error);
        alert('Error completing item. Please try again.');
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'emergency': return '🚨';
      case 'retirement': return '🏖️';
      case 'education': return '🎓';
      case 'travel': return '✈️';
      case 'house': return '🏠';
      case 'vehicle': return '🚗';
      case 'wedding': return '💒';
      case 'business': return '💼';
      case 'personal_loan': return '💳';
      case 'mortgage': return '🏠';
      case 'car_loan': return '🚗';
      case 'credit_card': return '💳';
      case 'student_loan': return '🎓';
      default: return '🎯';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const toggleValueVisibility = (itemId: string) => {
    setHiddenValues(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const filteredItems = items.filter(item => {
    const typeMatch = filter === 'all' || item.type === filter;
    const statusMatch = statusFilter === 'all' || item.status === statusFilter;
    return typeMatch && statusMatch;
  });

  const exportData = () => {
    const csvContent = [
      ['Title', 'Type', 'Category', 'Target Amount', 'Current Amount', 'Progress %', 'Target Date', 'Status', 'Priority'].join(','),
      ...filteredItems.map(item => [
        `"${item.title}"`,
        item.type,
        item.category,
        item.target_amount,
        item.current_amount,
        Math.round(item.progressPercentage),
        item.target_date,
        item.status,
        item.priority
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `goals-loans-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const actionButtons = (
    <div className="flex items-center space-x-3">
      <select
        value={filter}
        onChange={(e) => setFilter(e.target.value as any)}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
      >
        <option value="all">All Types</option>
        <option value="goal">Goals</option>
        <option value="loan">Loans</option>
      </select>

      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value as any)}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
      >
        <option value="all">All Status</option>
        <option value="active">Active</option>
        <option value="completed">Completed</option>
        <option value="paused">Paused</option>
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
        onClick={exportData}
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
        <span>Add Goal/Loan</span>
      </button>
    </div>
  );

  if (loading) {
    return (
      <Layout title="Goals & Loans" action={actionButtons}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Goals & Loans" action={actionButtons}>
      <div className="space-y-6">
        {/* Summary Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Items</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.activeItems}</p>
                  <p className="text-xs text-gray-500">{stats.totalGoals} goals, {stats.totalLoans} loans</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Saved</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalSaved)}</p>
                  <p className="text-xs text-gray-500">Across all goals</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Owed</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalOwed)}</p>
                  <p className="text-xs text-gray-500">Remaining debt</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Monthly Payments</p>
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.monthlyPayments + stats.monthlyContributions)}</p>
                  <p className="text-xs text-gray-500">Total monthly commitment</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Goals & Loans Grid */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">
              Your Goals & Loans ({filteredItems.length})
            </h3>
          </div>

          <div className="p-6">
            {filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
                <p className="text-gray-500 mb-6">
                  Start by creating your first financial goal or loan tracker.
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Goal/Loan</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredItems.map((item) => {
                  const isHidden = hiddenValues.has(item.id);
                  
                  return (
                    <div key={item.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            item.type === 'goal' ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                            {item.type === 'goal' ? (
                              <Target className="w-6 h-6 text-green-600" />
                            ) : (
                              <CreditCard className="w-6 h-6 text-red-600" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{item.title}</h4>
                            <p className="text-sm text-gray-500">{item.description}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                                {item.status}
                              </span>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                                {item.priority}
                              </span>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                item.type === 'goal' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {item.type}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => toggleValueVisibility(item.id)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                          >
                            {isHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => setEditingItem(item)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Progress Circle */}
                      <div className="flex items-center justify-center mb-6">
                        <div className="relative w-24 h-24">
                          <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              stroke="#E5E7EB"
                              strokeWidth="8"
                              fill="none"
                            />
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              stroke={item.type === 'goal' ? '#10B981' : '#EF4444'}
                              strokeWidth="8"
                              fill="none"
                              strokeDasharray={`${2 * Math.PI * 40}`}
                              strokeDashoffset={`${2 * Math.PI * 40 * (1 - item.progressPercentage / 100)}`}
                              className="transition-all duration-300"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-lg font-bold text-gray-900">{Math.round(item.progressPercentage)}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Item Details */}
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">
                            {item.type === 'goal' ? 'Target Amount' : 'Loan Amount'}
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            {isHidden ? '••••••••' : formatCurrency(item.target_amount)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">
                            {item.type === 'goal' ? 'Current Amount' : 'Remaining Balance'}
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            {isHidden ? '••••••••' : formatCurrency(item.current_amount)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">
                            {item.type === 'goal' ? 'Monthly Contribution' : 'Monthly Payment'}
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            {isHidden ? '••••••••' : formatCurrency(item.monthly_payment || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Time Remaining</span>
                          <span className="text-sm font-semibold text-gray-900 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {item.daysRemaining > 0 ? `${item.daysRemaining} days` : 'Overdue'}
                          </span>
                        </div>
                        {item.interest_rate && item.interest_rate > 0 && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Interest Rate</span>
                            <span className="text-sm font-semibold text-red-600">
                              {item.interest_rate}% per year
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Status Indicators */}
                      {!item.isOnTrack && item.status === 'active' && (
                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <AlertCircle className="w-4 h-4 text-yellow-600" />
                            <p className="text-sm text-yellow-700">
                              Behind schedule - {item.type === 'goal' ? 'increase contributions' : 'consider higher payments'}
                            </p>
                          </div>
                        </div>
                      )}

                      {item.progressPercentage >= 100 && (
                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <p className="text-sm text-green-700">
                              {item.type === 'goal' ? 'Congratulations! Goal achieved!' : 'Loan fully paid off!'}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex space-x-2 mt-6">
                        {item.status === 'active' && item.progressPercentage >= 100 ? (
                          <button
                            onClick={() => handleCompleteItem(item.id)}
                            className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                          >
                            Mark Complete
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleStatus(item.id, item.status)}
                            className={`flex-1 py-2 px-4 rounded-lg transition-colors text-sm ${
                              item.status === 'active' 
                                ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            {item.status === 'active' ? (
                              <>
                                <Pause className="w-4 h-4 inline mr-1" />
                                Pause
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 inline mr-1" />
                                Resume
                              </>
                            )}
                          </button>
                        )}
                        <button className="py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                          {item.type === 'goal' ? 'Add Contribution' : 'Add Payment'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Tips */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Financial Success Tips</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Set SMART goals: Specific, Measurable, Achievable, Relevant, Time-bound</li>
                <li>• Prioritize high-interest debt payments to save money long-term</li>
                <li>• Automate your savings and payments to stay consistent</li>
                <li>• Review and adjust your goals regularly based on life changes</li>
                <li>• Celebrate milestones to stay motivated on your financial journey</li>
                <li>• Consider the debt avalanche method for multiple loans</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Add/Edit Modal */}
        <AddGoalLoanModal
          isOpen={showAddModal || !!editingItem}
          onClose={() => {
            setShowAddModal(false);
            setEditingItem(null);
          }}
          onAdd={editingItem ? handleEditItem : handleAddItem}
          editData={editingItem}
        />
      </div>
    </Layout>
  );
};
