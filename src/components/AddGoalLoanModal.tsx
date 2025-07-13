import React, { useState, useEffect } from 'react';
import { X, Target, CreditCard, Save, Calculator, Calendar } from 'lucide-react';
import { Database } from '../lib/database.types';
import { walletService } from '../services/walletService';

type GoalLoan = Database['public']['Tables']['goals_loans']['Row'];
type Wallet = Database['public']['Tables']['wallets']['Row'];

interface AddGoalLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: Omit<GoalLoan, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'is_active'>) => void;
  editData?: GoalLoan | null;
}

export const AddGoalLoanModal: React.FC<AddGoalLoanModalProps> = ({ 
  isOpen, 
  onClose, 
  onAdd, 
  editData 
}) => {
  const [formData, setFormData] = useState({
    title: '',
    type: 'goal' as 'goal' | 'loan',
    category: 'emergency' as string,
    target_amount: 0,
    current_amount: 0,
    target_date: '',
    interest_rate: 0,
    monthly_payment: 0,
    priority: 'medium' as 'high' | 'medium' | 'low',
    status: 'active' as 'active' | 'completed' | 'paused' | 'cancelled',
    description: '',
    auto_payment: false,
    payment_source: '',
    reminder_enabled: true,
    reminder_frequency: 'monthly' as 'weekly' | 'monthly' | 'quarterly',
    start_date: new Date().toISOString().split('T')[0],
    lender_name: '',
    account_number: '',
    minimum_payment: 0,
    payment_due_date: 1
  });
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadWallets();
      
      if (editData) {
        setFormData({
          title: editData.title,
          type: editData.type,
          category: editData.category,
          target_amount: editData.target_amount,
          current_amount: editData.current_amount,
          target_date: editData.target_date,
          interest_rate: editData.interest_rate || 0,
          monthly_payment: editData.monthly_payment || 0,
          priority: editData.priority,
          status: editData.status,
          description: editData.description || '',
          auto_payment: editData.auto_payment,
          payment_source: editData.payment_source || '',
          reminder_enabled: editData.reminder_enabled,
          reminder_frequency: editData.reminder_frequency,
          start_date: editData.start_date || new Date().toISOString().split('T')[0],
          lender_name: editData.lender_name || '',
          account_number: editData.account_number || '',
          minimum_payment: editData.minimum_payment || 0,
          payment_due_date: editData.payment_due_date || 1
        });
      } else {
        // Set default target date to 1 year from now
        const defaultDate = new Date();
        defaultDate.setFullYear(defaultDate.getFullYear() + 1);
        
        setFormData({
          title: '',
          type: 'goal',
          category: 'emergency',
          target_amount: 0,
          current_amount: 0,
          target_date: defaultDate.toISOString().split('T')[0],
          interest_rate: 0,
          monthly_payment: 0,
          priority: 'medium',
          status: 'active',
          description: '',
          auto_payment: false,
          payment_source: '',
          reminder_enabled: true,
          reminder_frequency: 'monthly',
          start_date: new Date().toISOString().split('T')[0],
          lender_name: '',
          account_number: '',
          minimum_payment: 0,
          payment_due_date: 1
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
      const itemData = {
        ...formData,
        description: formData.description || null,
        payment_source: formData.payment_source || null,
        lender_name: formData.lender_name || null,
        account_number: formData.account_number || null,
        interest_rate: formData.interest_rate || null,
        monthly_payment: formData.monthly_payment || null,
        minimum_payment: formData.minimum_payment || null
      };
      
      await onAdd(itemData);
      
      if (!editData) {
        const defaultDate = new Date();
        defaultDate.setFullYear(defaultDate.getFullYear() + 1);
        
        setFormData({
          title: '',
          type: 'goal',
          category: 'emergency',
          target_amount: 0,
          current_amount: 0,
          target_date: defaultDate.toISOString().split('T')[0],
          interest_rate: 0,
          monthly_payment: 0,
          priority: 'medium',
          status: 'active',
          description: '',
          auto_payment: false,
          payment_source: '',
          reminder_enabled: true,
          reminder_frequency: 'monthly',
          start_date: new Date().toISOString().split('T')[0],
          lender_name: '',
          account_number: '',
          minimum_payment: 0,
          payment_due_date: 1
        });
      }
    } catch (error) {
      console.error('Error saving item:', error);
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

  const getCategoryOptions = () => {
    if (formData.type === 'goal') {
      return [
        { value: 'emergency', label: 'Emergency Fund' },
        { value: 'retirement', label: 'Retirement' },
        { value: 'education', label: 'Education' },
        { value: 'travel', label: 'Travel' },
        { value: 'house', label: 'House' },
        { value: 'vehicle', label: 'Vehicle' },
        { value: 'wedding', label: 'Wedding' },
        { value: 'business', label: 'Business' },
        { value: 'other', label: 'Other' }
      ];
    } else {
      return [
        { value: 'personal_loan', label: 'Personal Loan' },
        { value: 'mortgage', label: 'Mortgage' },
        { value: 'car_loan', label: 'Car Loan' },
        { value: 'credit_card', label: 'Credit Card' },
        { value: 'student_loan', label: 'Student Loan' },
        { value: 'business', label: 'Business Loan' },
        { value: 'other', label: 'Other' }
      ];
    }
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

  if (!isOpen) return null;

  const progressPercentage = formData.target_amount > 0 ? 
    (formData.type === 'goal' ? 
      (formData.current_amount / formData.target_amount) * 100 :
      ((formData.target_amount - formData.current_amount) / formData.target_amount) * 100
    ) : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              {formData.type === 'goal' ? 
                <Target className="w-5 h-5 text-blue-600" /> : 
                <CreditCard className="w-5 h-5 text-blue-600" />
              }
            </div>
            <h2 className="text-xl font-bold text-gray-800">
              {editData ? `Edit ${formData.type === 'goal' ? 'Goal' : 'Loan'}` : `Add New ${formData.type === 'goal' ? 'Goal' : 'Loan'}`}
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
          {/* Type Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Type</h3>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'goal', category: 'emergency' })}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                  formData.type === 'goal'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Target className="w-5 h-5 mx-auto mb-2" />
                Financial Goal
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'loan', category: 'personal_loan' })}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                  formData.type === 'loan'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <CreditCard className="w-5 h-5 mx-auto mb-2" />
                Loan/Debt
              </button>
            </div>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.type === 'goal' ? 'Goal' : 'Loan'} Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder={formData.type === 'goal' ? 'e.g., Emergency Fund' : 'e.g., Car Loan'}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  required
                >
                  {getCategoryOptions().map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
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
                placeholder={`Describe your ${formData.type}...`}
              />
            </div>
          </div>

          {/* Financial Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Financial Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.type === 'goal' ? 'Target Amount' : 'Loan Amount'} (IDR)
                </label>
                <input
                  type="number"
                  value={formData.target_amount}
                  onChange={(e) => setFormData({ ...formData, target_amount: Number(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder={formData.type === 'goal' ? 'Goal amount' : 'Total loan amount'}
                  min="0"
                  step="1000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.type === 'goal' ? 'Current Amount' : 'Remaining Balance'} (IDR)
                </label>
                <input
                  type="number"
                  value={formData.current_amount}
                  onChange={(e) => setFormData({ ...formData, current_amount: Number(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder={formData.type === 'goal' ? 'Amount already saved' : 'Amount still owed'}
                  min="0"
                  step="1000"
                />
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.type === 'goal' ? 'Monthly Contribution' : 'Monthly Payment'} (IDR)
                </label>
                <input
                  type="number"
                  value={formData.monthly_payment}
                  onChange={(e) => setFormData({ ...formData, monthly_payment: Number(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder={formData.type === 'goal' ? 'Monthly saving target' : 'Monthly payment amount'}
                  min="0"
                  step="1000"
                />
              </div>

              {formData.type === 'loan' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Interest Rate (% per year)</label>
                    <input
                      type="number"
                      value={formData.interest_rate}
                      onChange={(e) => setFormData({ ...formData, interest_rate: Number(e.target.value) })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Annual interest rate"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Payment (IDR)</label>
                    <input
                      type="number"
                      value={formData.minimum_payment}
                      onChange={(e) => setFormData({ ...formData, minimum_payment: Number(e.target.value) })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Minimum monthly payment"
                      min="0"
                      step="1000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Lender Name</label>
                    <input
                      type="text"
                      value={formData.lender_name}
                      onChange={(e) => setFormData({ ...formData, lender_name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Bank or lender name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Due Date</label>
                    <select
                      value={formData.payment_due_date}
                      onChange={(e) => setFormData({ ...formData, payment_due_date: Number(e.target.value) })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    >
                      {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Auto Payment Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {formData.type === 'goal' ? 'Auto Contribution' : 'Auto Payment'} Settings
            </h3>
            
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="auto_payment"
                checked={formData.auto_payment}
                onChange={(e) => setFormData({ ...formData, auto_payment: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="auto_payment" className="text-sm font-medium text-gray-700">
                Enable automatic {formData.type === 'goal' ? 'contributions' : 'payments'}
              </label>
            </div>

            {formData.auto_payment && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Source Wallet</label>
                <select
                  value={formData.payment_source}
                  onChange={(e) => setFormData({ ...formData, payment_source: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  <option value="">Select wallet for auto {formData.type === 'goal' ? 'contributions' : 'payments'}</option>
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

          {/* Preview */}
          {formData.target_amount > 0 && (
            <div className={`rounded-xl p-6 border ${
              formData.type === 'goal' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center space-x-3 mb-4">
                <div className="text-3xl">{getCategoryIcon(formData.category)}</div>
                <div>
                  <h4 className={`font-semibold ${formData.type === 'goal' ? 'text-green-900' : 'text-red-900'}`}>
                    {formData.title || `Your ${formData.type === 'goal' ? 'Goal' : 'Loan'}`}
                  </h4>
                  <p className={`text-sm ${formData.type === 'goal' ? 'text-green-700' : 'text-red-700'} capitalize`}>
                    {formData.category} • {formData.priority} priority
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className={formData.type === 'goal' ? 'text-green-700' : 'text-red-700'}>Progress</span>
                  <span className={`font-medium ${formData.type === 'goal' ? 'text-green-900' : 'text-red-900'}`}>
                    {Math.round(progressPercentage)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-300 ${
                      formData.type === 'goal' ? 'bg-green-600' : 'bg-red-600'
                    }`}
                    style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className={formData.type === 'goal' ? 'text-green-700' : 'text-red-700'}>
                    {formData.type === 'goal' ? 'Target Amount' : 'Loan Amount'}
                  </p>
                  <p className={`font-bold ${formData.type === 'goal' ? 'text-green-900' : 'text-red-900'}`}>
                    {formatCurrency(formData.target_amount)}
                  </p>
                </div>
                <div>
                  <p className={formData.type === 'goal' ? 'text-green-700' : 'text-red-700'}>
                    {formData.type === 'goal' ? 'Current Amount' : 'Remaining Balance'}
                  </p>
                  <p className={`font-bold ${formData.type === 'goal' ? 'text-green-900' : 'text-red-900'}`}>
                    {formatCurrency(formData.current_amount)}
                  </p>
                </div>
                <div>
                  <p className={formData.type === 'goal' ? 'text-green-700' : 'text-red-700'}>
                    {formData.type === 'goal' ? 'Remaining' : 'Amount Paid'}
                  </p>
                  <p className={`font-bold ${formData.type === 'goal' ? 'text-green-900' : 'text-red-900'}`}>
                    {formData.type === 'goal' ? 
                      formatCurrency(Math.max(0, formData.target_amount - formData.current_amount)) :
                      formatCurrency(Math.max(0, formData.target_amount - formData.current_amount))
                    }
                  </p>
                </div>
                <div>
                  <p className={formData.type === 'goal' ? 'text-green-700' : 'text-red-700'}>Target Date</p>
                  <p className={`font-bold ${formData.type === 'goal' ? 'text-green-900' : 'text-red-900'}`}>
                    {new Date(formData.target_date).toLocaleDateString('id-ID')}
                  </p>
                </div>
              </div>
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
                  <span>{editData ? `Update ${formData.type === 'goal' ? 'Goal' : 'Loan'}` : `Create ${formData.type === 'goal' ? 'Goal' : 'Loan'}`}</span>
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
