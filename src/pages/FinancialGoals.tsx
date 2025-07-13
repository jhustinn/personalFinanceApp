import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Target, 
  Calendar,
  TrendingUp,
  CheckCircle,
  Clock,
  DollarSign,
  PieChart,
  Edit,
  Trash2,
  Play,
  Pause,
  RefreshCw,
  AlertTriangle,
  Eye,
  EyeOff,
  Download
} from 'lucide-react';
import { Layout } from '../components/Layout';
import { AddFinancialGoalModal } from '../components/AddFinancialGoalModal';
import { financialGoalService, FinancialGoalWithCalculations, GoalStats } from '../services/financialGoalService';
import { Database } from '../lib/database.types';

type FinancialGoal = Database['public']['Tables']['financial_goals']['Row'];

export const FinancialGoals: React.FC = () => {
  const [goals, setGoals] = useState<FinancialGoalWithCalculations[]>([]);
  const [stats, setStats] = useState<GoalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'paused'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [hiddenValues, setHiddenValues] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const [goalsData, statsData] = await Promise.all([
        financialGoalService.getFinancialGoals(),
        financialGoalService.getGoalStats()
      ]);
      setGoals(goalsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadGoals();
    setRefreshing(false);
  };

  const handleAddGoal = async (goalData: Omit<FinancialGoal, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'is_active'>) => {
    try {
      await financialGoalService.createFinancialGoal(goalData);
      await loadGoals();
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding goal:', error);
      alert('Error adding goal. Please try again.');
    }
  };

  const handleEditGoal = async (goalData: Omit<FinancialGoal, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'is_active'>) => {
    if (!editingGoal) return;
    
    try {
      await financialGoalService.updateFinancialGoal(editingGoal.id, goalData);
      await loadGoals();
      setEditingGoal(null);
    } catch (error) {
      console.error('Error updating goal:', error);
      alert('Error updating goal. Please try again.');
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this goal? This action cannot be undone.')) {
      try {
        await financialGoalService.deleteFinancialGoal(id);
        await loadGoals();
      } catch (error) {
        console.error('Error deleting goal:', error);
        alert('Error deleting goal. Please try again.');
      }
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      await financialGoalService.toggleGoalStatus(id, newStatus);
      await loadGoals();
    } catch (error) {
      console.error('Error updating goal status:', error);
      alert('Error updating goal status. Please try again.');
    }
  };

  const handleCompleteGoal = async (id: string) => {
    if (window.confirm('Mark this goal as completed?')) {
      try {
        await financialGoalService.completeGoal(id);
        await loadGoals();
      } catch (error) {
        console.error('Error completing goal:', error);
        alert('Error completing goal. Please try again.');
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
      case 'retirement': return '🏖️';
      case 'education': return '🎓';
      case 'travel': return '✈️';
      case 'house': return '🏠';
      case 'emergency': return '🚨';
      case 'investment': return '📈';
      case 'vehicle': return '🚗';
      case 'wedding': return '💒';
      case 'business': return '💼';
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

  const toggleValueVisibility = (goalId: string) => {
    setHiddenValues(prev => {
      const newSet = new Set(prev);
      if (newSet.has(goalId)) {
        newSet.delete(goalId);
      } else {
        newSet.add(goalId);
      }
      return newSet;
    });
  };

  const filteredGoals = goals.filter(goal => {
    const statusMatch = filter === 'all' || goal.status === filter;
    const categoryMatch = categoryFilter === 'all' || goal.category === categoryFilter;
    return statusMatch && categoryMatch;
  });

  const exportGoals = () => {
    const csvContent = [
      ['Title', 'Category', 'Target Amount', 'Current Amount', 'Progress %', 'Target Date', 'Status', 'Priority'].join(','),
      ...filteredGoals.map(goal => [
        `"${goal.title}"`,
        goal.category,
        goal.target_amount,
        goal.current_amount,
        Math.round(goal.progressPercentage),
        goal.target_date,
        goal.status,
        goal.priority
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-goals-${new Date().toISOString().split('T')[0]}.csv`;
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
        <option value="all">All Status</option>
        <option value="active">Active</option>
        <option value="completed">Completed</option>
        <option value="paused">Paused</option>
      </select>

      <select
        value={categoryFilter}
        onChange={(e) => setCategoryFilter(e.target.value)}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
      >
        <option value="all">All Categories</option>
        <option value="emergency">Emergency</option>
        <option value="retirement">Retirement</option>
        <option value="education">Education</option>
        <option value="travel">Travel</option>
        <option value="house">House</option>
        <option value="investment">Investment</option>
        <option value="vehicle">Vehicle</option>
        <option value="wedding">Wedding</option>
        <option value="business">Business</option>
        <option value="other">Other</option>
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
        onClick={exportGoals}
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
        <span>Add Goal</span>
      </button>
    </div>
  );

  if (loading) {
    return (
      <Layout title="Financial Goals" action={actionButtons}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Financial Goals" action={actionButtons}>
      <div className="space-y-6">
        {/* Summary Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Goals</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.activeGoals}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed Goals</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completedGoals}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Saved</p>
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.totalCurrentAmount)}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Overall Progress</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {Math.round(stats.totalProgress)}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <PieChart className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Overall Progress */}
        {stats && stats.totalTargetAmount > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Overall Financial Goals Progress</h3>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Progress</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(stats.totalCurrentAmount)} / {formatCurrency(stats.totalTargetAmount)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(stats.totalProgress, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>0%</span>
                <span>{Math.round(stats.totalProgress)}%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        )}

        {/* Goals Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredGoals.length === 0 ? (
            <div className="lg:col-span-2 bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-200">
              <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No financial goals found</h3>
              <p className="text-gray-500 mb-6">
                Start planning your financial future by creating your first goal.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Create Your First Goal</span>
              </button>
            </div>
          ) : (
            filteredGoals.map((goal) => {
              const isHidden = hiddenValues.has(goal.id);
              
              return (
                <div key={goal.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-3xl">{getCategoryIcon(goal.category)}</div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{goal.title}</h4>
                        <p className="text-sm text-gray-500">{goal.description}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(goal.priority)}`}>
                            {goal.priority}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(goal.status)}`}>
                            {goal.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleValueVisibility(goal.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        {isHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => setEditingGoal(goal)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteGoal(goal.id)}
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
                          stroke="#3B82F6"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 40}`}
                          strokeDashoffset={`${2 * Math.PI * 40 * (1 - goal.progressPercentage / 100)}`}
                          className="transition-all duration-300"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-bold text-gray-900">{Math.round(goal.progressPercentage)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Goal Details */}
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Target Amount</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {isHidden ? '••••••••' : formatCurrency(goal.target_amount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Current Amount</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {isHidden ? '••••••••' : formatCurrency(goal.current_amount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Remaining</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {isHidden ? '••••••••' : formatCurrency(goal.remainingAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Monthly Target</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {isHidden ? '••••••••' : formatCurrency(goal.monthly_target)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Time Remaining</span>
                      <span className="text-sm font-semibold text-gray-900 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {goal.daysRemaining > 0 ? `${goal.daysRemaining} days` : 'Overdue'}
                      </span>
                    </div>
                    {goal.requiredMonthlyAmount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Required Monthly</span>
                        <span className={`text-sm font-semibold ${goal.isOnTrack ? 'text-green-600' : 'text-red-600'}`}>
                          {isHidden ? '••••••••' : formatCurrency(goal.requiredMonthlyAmount)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Status Indicators */}
                  {!goal.isOnTrack && goal.status === 'active' && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        <p className="text-sm text-yellow-700">
                          Behind schedule - increase monthly savings to stay on track
                        </p>
                      </div>
                    </div>
                  )}

                  {goal.progressPercentage >= 100 && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <p className="text-sm text-green-700">
                          Congratulations! You've reached your goal!
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-2 mt-6">
                    {goal.status === 'active' && goal.progressPercentage >= 100 ? (
                      <button
                        onClick={() => handleCompleteGoal(goal.id)}
                        className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        Mark Complete
                      </button>
                    ) : (
                      <button
                        onClick={() => handleToggleStatus(goal.id, goal.status)}
                        className={`flex-1 py-2 px-4 rounded-lg transition-colors text-sm ${
                          goal.status === 'active' 
                            ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {goal.status === 'active' ? (
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
                      Add Contribution
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Tips */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 border border-green-200">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Financial Goal Success Tips</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Start with small, achievable goals to build momentum</li>
                <li>• Prioritize high-impact goals like emergency funds and retirement</li>
                <li>• Use the 50/30/20 rule: 50% needs, 30% wants, 20% savings/goals</li>
                <li>• Review and adjust your goals quarterly based on life changes</li>
                <li>• Consider inflation when setting long-term financial targets</li>
                <li>• Automate contributions to stay consistent with your savings</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Add/Edit Goal Modal */}
        <AddFinancialGoalModal
          isOpen={showAddModal || !!editingGoal}
          onClose={() => {
            setShowAddModal(false);
            setEditingGoal(null);
          }}
          onAdd={editingGoal ? handleEditGoal : handleAddGoal}
          editData={editingGoal}
        />
      </div>
    </Layout>
  );
};
