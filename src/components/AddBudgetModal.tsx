import React, { useState, useEffect } from 'react';
import { X, Target, Calendar } from 'lucide-react';
import { Database } from '../lib/database.types';
import { categoryService } from '../services/categoryService';

type Budget = Database['public']['Tables']['budgets']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

interface AddBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (budget: Omit<Budget, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  editData?: Budget | null;
}

export const AddBudgetModal: React.FC<AddBudgetModalProps> = ({ 
  isOpen, 
  onClose, 
  onAdd, 
  editData 
}) => {
  const [formData, setFormData] = useState({
    category_id: '',
    amount: 0,
    month: '',
    year: new Date().getFullYear(),
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCategories();
      
      if (editData) {
        setFormData({
          category_id: editData.category_id,
          amount: editData.amount,
          month: editData.month,
          year: editData.year,
        });
      } else {
        const currentDate = new Date();
        const currentMonth = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
        setFormData({
          category_id: '',
          amount: 0,
          month: currentMonth,
          year: currentDate.getFullYear(),
        });
      }
    }
  }, [isOpen, editData]);

  const loadCategories = async () => {
    try {
      const data = await categoryService.getCategoriesByType('expense');
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await onAdd(formData);
      if (!editData) {
        const currentDate = new Date();
        const currentMonth = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
        setFormData({
          category_id: '',
          amount: 0,
          month: currentMonth,
          year: currentDate.getFullYear(),
        });
      }
    } catch (error) {
      console.error('Error saving budget:', error);
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

  const generateMonthOptions = () => {
    const options = [];
    const currentYear = new Date().getFullYear();
    
    for (let year = currentYear - 1; year <= currentYear + 1; year++) {
      for (let month = 1; month <= 12; month++) {
        const monthStr = `${year}-${month.toString().padStart(2, '0')}`;
        const monthName = new Date(year, month - 1).toLocaleDateString('id-ID', { 
          month: 'long', 
          year: 'numeric' 
        });
        options.push({ value: monthStr, label: monthName, year });
      }
    }
    
    return options;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">
              {editData ? 'Edit Budget' : 'Add New Budget'}
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
          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              required
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Month Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Month & Year
            </label>
            <select
              value={formData.month}
              onChange={(e) => {
                const selectedMonth = e.target.value;
                const year = parseInt(selectedMonth.split('-')[0]);
                setFormData({ 
                  ...formData, 
                  month: selectedMonth,
                  year: year
                });
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              required
            >
              <option value="">Select month</option>
              {generateMonthOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Budget Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Budget Amount (IDR)
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Enter budget amount"
              min="0"
              step="1000"
              required
            />
            {formData.amount > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                {formatCurrency(formData.amount)}
              </p>
            )}
          </div>

          {/* Budget Preview */}
          {formData.category_id && formData.amount > 0 && (
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center space-x-3 mb-3">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-blue-900">Budget Preview</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Category:</span>
                  <span className="font-medium text-blue-900">
                    {categories.find(c => c.id === formData.category_id)?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Period:</span>
                  <span className="font-medium text-blue-900">
                    {new Date(formData.month + '-01').toLocaleDateString('id-ID', { 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Budget:</span>
                  <span className="font-bold text-blue-900">
                    {formatCurrency(formData.amount)}
                  </span>
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
                editData ? 'Update Budget' : 'Add Budget'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
