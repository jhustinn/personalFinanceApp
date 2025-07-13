import React, { useState, useEffect } from 'react';
import { X, Target, Save, Calculator, Calendar } from 'lucide-react';
import { Database } from '../lib/database.types';
import { walletService } from '../services/walletService';

type FinancialGoal = Database['public']['Tables']['financial_goals']['Row'];
type Wallet = Database['public']['Tables']['wallets']['Row'];

interface AddFinancialGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (goal: Omit<FinancialGoal, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'is_active'>) => void;
  editData?: FinancialGoal | null;
}

export const AddFinancialGoalModal: React.FC<AddFinancialGoalModalProps> = ({ 
  isOpen, 
  onClose, 
  onAdd, 
  editData 
}) => {
  const [formData, setFormData] = useState({
    title: '',
    category: 'emergency' as 'retirement' | 'education' | 'travel' | 'house' | 'emergency' | 'investment' | 'vehicle' | 'wedding' | 'business' | 'other',
    target_amount: 0,
    current_amount: 0,
    target_date: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    status: 'active' as 'active' | 'completed' | 'paused' | 'cancelled',
    description: '',
    monthly_target: 0,
    auto_contribution: false,
    contribution_source: '',
    reminder_enabled: true,
    reminder_frequency: 'monthly' as 'weekly' | 'monthly' | 'quarterly'
  });
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadWallets();
      
      if (editData) {
        setFormData({
          title: editData.title,
          category: editData.category,
          target_amount: editData.target_amount,
          current_amount: editData.current_amount,
          target_date: editData.target_date,
          priority: editData.priority,
          status: editData.status,
          description: editData.description || '',
          monthly_target: editData.monthly_target,
          auto_contribution: editData.auto_contribution,
          contribution_source: editData.contribution_source || '',
          reminder_enabled: editData.reminder_enabled,
          reminder_frequency: editData.reminder_frequency
        });
      } else {
        // Set default target date to 1 year from now
        const defaultDate = new Date();
        defaultDate.setFullYear(defaultDate.getFullYear() + 1);
        
        setFormData({
          title: '',
          category: 'emergency',
          target_amount: 0,
          current_amount: 0,
          target_date: defaultDate.toISOString().split('T')[0],
          priority: 'medium',
          status: 'active',
          description: '',
          monthly_target: 0,
          auto_contribution: false,
          contribution_source: '',
          reminder_enabled: true,
          reminder_frequency: 'monthly'
        });
      }
    }
  }, [isOpen, editData]);

  const loadWallets = async () => {
    try {
      const data = await walletService.getWallets();
      setWallets(data);
    } catch (error) {
      console.error('Error loading wallets:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const goalData = {
        ...formData,
        description: formData.description || null,
        contribution_source: formData.contribution_source || null
      };
      
      await onAdd(goalData);
      
      if (!editData) {
        const defaultDate = new Date();
        defaultDate.setFullYear(defaultDate.getFullYear() + 1);
        
        setFormData({
          title: '',
          category: 'emergency',
          target_amount: 0,
          current_amount: 0,
          target_date: defaultDate.toISOString().split('T')[0],
          priority: 'medium',
          status: 'active',
          description: '',
          monthly_target: 0,
          auto_contribution: false,
          contribution_source: '',
          reminder_enabled: true,
          reminder_frequency: 'monthly'
        });
      }
    } catch (error) {
      console.error('Error saving goal:', error);
    } finally {
      setLoading(false);
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

  const calculateTimeToGoal = () => {
    if (formData.monthly_target > 0 && formData.target_amount > formData.current_amount) {
      const remaining = formData.target_amount - formData.current_amount;
      const months = Math.ceil(remaining / formData.monthly_target);
      return months;
    }
    return 0;
  };

  const calculateTargetDate = () => {
    const targetDate = new Date(formData.target_date);
    const currentDate = new Date();
    const timeDiff = targetDate.getTime() - currentDate.getTime();
    const monthsRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24 * 30.44));
    
    if (monthsRemaining > 0 && formData.target_amount > formData.current_amount) {
      const remaining = formData.target_amount - formData.current_amount;
      return Math.ceil(remaining / monthsRemaining);
    }
    return 0;
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

  if (!isOpen) return null;

  const progressPercentage = formData.target_amount > 0 ? (formData.current_amount / formData.target_amount) * 100 : 0;
  const timeToGoal = calculateTimeToGoal();
  const requiredMonthly = calculateTargetDate();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">
              {editData ? 'Edit Financial Goal' : 'Add New Financial Goal'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Goal Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Goal Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="e.g., Emergency Fund, Dream Vacation"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  required
                >
                  <option value="emergency">Emergency Fund</option>
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Describe your financial goal..."
              />
            </div>
          </div>

          {/* Financial Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Financial Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Amount (IDR)</label>
                <input
                  type="number"
                  value={formData.target_amount}
                  onChange={(e) => setFormData({ ...formData, target_amount: Number(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Goal amount"
                  min="0"
                  step="1000"
                  required
                />
                {formData.target_amount > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    {formatCurrency(formData.target_amount)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Amount (IDR)</label>
                <input
                  type="number"
                  value={formData.current_amount}
                  onChange={(e) => setFormData({ ...formData, current_amount: Number(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Amount already saved"
                  min="0"
                  step="1000"
                />
                {formData.current_amount > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    {formatCurrency(formData.current_amount)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Date</label>
                <input
                  type="date"
                  value={formData.target_date}
                  onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Target (IDR)</label>
                <input
                  type="number"
                  value={formData.monthly_target}
                  onChange={(e) => setFormData({ ...formData, monthly_target: Number(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Monthly saving target"
                  min="0"
                  step="1000"
                />
                {formData.monthly_target > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    {formatCurrency(formData.monthly_target)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Auto Contribution Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Contribution Settings</h3>
            
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="auto_contribution"
                checked={formData.auto_contribution}
                onChange={(e) => setFormData({ ...formData, auto_contribution: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="auto_contribution" className="text-sm font-medium text-gray-700">
                Enable automatic contributions
              </label>
            </div>

            {formData.auto_contribution && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Source Wallet</label>
                <select
                  value={formData.contribution_source}
                  onChange={(e) => setFormData({ ...formData, contribution_source: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  <option value="">Select wallet for auto contributions</option>
                  {wallets.map((wallet) => (
                    <option key={wallet.id} value={wallet.id}>
                      {wallet.name} - {wallet.account_number}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="reminder_enabled"
                  checked={formData.reminder_enabled}
                  onChange={(e) => setFormData({ ...formData, reminder_enabled: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="reminder_enabled" className="text-sm font-medium text-gray-700">
                  Enable reminders
                </label>
              </div>

              {formData.reminder_enabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reminder Frequency</label>
                  <select
                    value={formData.reminder_frequency}
                    onChange={(e) => setFormData({ ...formData, reminder_frequency: e.target.value as any })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Goal Preview */}
          {formData.target_amount > 0 && (
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center space-x-3 mb-4">
                <div className="text-3xl">{getCategoryIcon(formData.category)}</div>
                <div>
                  <h4 className="font-semibold text-blue-900">{formData.title || 'Your Goal'}</h4>
                  <p className="text-sm text-blue-700 capitalize">{formData.category} • {formData.priority} priority</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-blue-700">Progress</span>
                  <span className="font-medium text-blue-900">{Math.round(progressPercentage)}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-blue-700">Target Amount</p>
                  <p className="font-bold text-blue-900">{formatCurrency(formData.target_amount)}</p>
                </div>
                <div>
                  <p className="text-blue-700">Current Amount</p>
                  <p className="font-bold text-blue-900">{formatCurrency(formData.current_amount)}</p>
                </div>
                <div>
                  <p className="text-blue-700">Remaining</p>
                  <p className="font-bold text-blue-900">{formatCurrency(Math.max(0, formData.target_amount - formData.current_amount))}</p>
                </div>
                <div>
                  <p className="text-blue-700">Target Date</p>
                  <p className="font-bold text-blue-900">{new Date(formData.target_date).toLocaleDateString('id-ID')}</p>
                </div>
              </div>

              {/* Calculations */}
              {requiredMonthly > 0 && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-blue-700">Required Monthly</p>
                      <p className="font-bold text-blue-900">{formatCurrency(requiredMonthly)}</p>
                    </div>
                    {timeToGoal > 0 && (
                      <div>
                        <p className="text-blue-700">Time to Goal</p>
                        <p className="font-bold text-blue-900">{timeToGoal} months</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Save className="w-4 h-4" />
                  <span>{editData ? 'Update Goal' : 'Create Goal'}</span>
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
