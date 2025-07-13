import React, { useState, useEffect } from 'react';
import { X, CreditCard, Calendar, Wallet, Tag, AlertTriangle } from 'lucide-react';
import { Database } from '../lib/database.types';
import { walletService } from '../services/walletService';
import { categoryService } from '../services/categoryService';

type Transaction = Database['public']['Tables']['transactions']['Row'];
type Wallet = Database['public']['Tables']['wallets']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (transaction: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  editData?: Transaction | null;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ 
  isOpen, 
  onClose, 
  onAdd, 
  editData 
}) => {
  const [formData, setFormData] = useState({
    wallet_id: '',
    category_id: '',
    amount: 0,
    type: 'expense' as 'income' | 'expense',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [balanceError, setBalanceError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadWallets();
      loadCategories();
      
      if (editData) {
        setFormData({
          wallet_id: editData.wallet_id,
          category_id: editData.category_id,
          amount: editData.amount,
          type: editData.type,
          description: editData.description,
          date: editData.date,
        });
      } else {
        setFormData({
          wallet_id: '',
          category_id: '',
          amount: 0,
          type: 'expense',
          description: '',
          date: new Date().toISOString().split('T')[0],
        });
      }
      setBalanceError('');
    }
  }, [isOpen, editData]);

  useEffect(() => {
    if (formData.type) {
      loadCategories();
    }
  }, [formData.type]);

  // Check balance when wallet, amount, or type changes
  useEffect(() => {
    checkWalletBalance();
  }, [formData.wallet_id, formData.amount, formData.type]);

  const loadWallets = async () => {
    try {
      const data = await walletService.getWallets();
      setWallets(data);
    } catch (error) {
      console.error('Error loading wallets:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await categoryService.getCategoriesByType(formData.type);
      setCategories(data);
      
      // Reset category if current selection doesn't match new type
      if (formData.category_id && !data.find(c => c.id === formData.category_id)) {
        setFormData(prev => ({ ...prev, category_id: '' }));
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const checkWalletBalance = () => {
    setBalanceError('');
    
    if (formData.type === 'expense' && formData.wallet_id && formData.amount > 0) {
      const selectedWallet = wallets.find(w => w.id === formData.wallet_id);
      if (selectedWallet) {
        // For editing, we need to consider the original transaction amount
        let availableBalance = selectedWallet.balance;
        if (editData && editData.wallet_id === formData.wallet_id) {
          // Add back the original amount if it was an expense, subtract if it was income
          if (editData.type === 'expense') {
            availableBalance += editData.amount;
          } else {
            availableBalance -= editData.amount;
          }
        }

        if (formData.amount > availableBalance) {
          setBalanceError(
            `Insufficient balance. Available: ${formatCurrency(availableBalance)}, Required: ${formatCurrency(formData.amount)}`
          );
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check balance before submitting
    if (balanceError) {
      alert('Cannot proceed: ' + balanceError);
      return;
    }
    
    setLoading(true);
    
    try {
      await onAdd(formData);
      if (!editData) {
        setFormData({
          wallet_id: '',
          category_id: '',
          amount: 0,
          type: 'expense',
          description: '',
          date: new Date().toISOString().split('T')[0],
        });
      }
      setBalanceError('');
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('Error saving transaction. Please try again.');
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

  if (!isOpen) return null;

  const selectedWallet = wallets.find(w => w.id === formData.wallet_id);
  const selectedCategory = categories.find(c => c.id === formData.category_id);
  const isFormValid = formData.wallet_id && formData.category_id && formData.amount > 0 && formData.description && !balanceError;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">
              {editData ? 'Edit Transaction' : 'Add New Transaction'}
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Transaction Type</label>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'income', category_id: '' })}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                  formData.type === 'income'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                Income
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'expense', category_id: '' })}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                  formData.type === 'expense'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                Expense
              </button>
            </div>
          </div>

          {/* Wallet Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Wallet
            </label>
            <select
              value={formData.wallet_id}
              onChange={(e) => setFormData({ ...formData, wallet_id: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              required
            >
              <option value="">Select a wallet</option>
              {wallets.map((wallet) => (
                <option key={wallet.id} value={wallet.id}>
                  {wallet.name} - {wallet.account_number} ({formatCurrency(wallet.balance)})
                </option>
              ))}
            </select>
            
            {/* Wallet Balance Info */}
            {selectedWallet && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Current Balance:</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(selectedWallet.balance)}
                  </span>
                </div>
                {formData.type === 'expense' && formData.amount > 0 && (
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-gray-600">After Transaction:</span>
                    <span className={`font-semibold ${
                      selectedWallet.balance - formData.amount >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(selectedWallet.balance - formData.amount)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

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

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (IDR)
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                balanceError ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Enter amount"
              min="0"
              step="1000"
              required
            />
            {formData.amount > 0 && !balanceError && (
              <p className="text-sm text-gray-500 mt-1">
                {formatCurrency(formData.amount)}
              </p>
            )}
            
            {/* Balance Error */}
            {balanceError && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-700">{balanceError}</p>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Enter transaction description"
              required
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              required
            />
          </div>

          {/* Transaction Preview */}
          {formData.wallet_id && formData.category_id && formData.amount > 0 && !balanceError && (
            <div className={`rounded-xl p-4 border ${
              formData.type === 'income' 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center space-x-3 mb-3">
                <Calendar className={`w-5 h-5 ${
                  formData.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`} />
                <h4 className={`font-semibold ${
                  formData.type === 'income' ? 'text-green-900' : 'text-red-900'
                }`}>
                  Transaction Preview
                </h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className={formData.type === 'income' ? 'text-green-700' : 'text-red-700'}>
                    Type:
                  </span>
                  <span className={`font-medium capitalize ${
                    formData.type === 'income' ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {formData.type}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={formData.type === 'income' ? 'text-green-700' : 'text-red-700'}>
                    Wallet:
                  </span>
                  <span className={`font-medium ${
                    formData.type === 'income' ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {selectedWallet?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={formData.type === 'income' ? 'text-green-700' : 'text-red-700'}>
                    Category:
                  </span>
                  <span className={`font-medium ${
                    formData.type === 'income' ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {selectedCategory?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={formData.type === 'income' ? 'text-green-700' : 'text-red-700'}>
                    Amount:
                  </span>
                  <span className={`font-bold ${
                    formData.type === 'income' ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {formData.type === 'income' ? '+' : '-'}{formatCurrency(formData.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={formData.type === 'income' ? 'text-green-700' : 'text-red-700'}>
                    Date:
                  </span>
                  <span className={`font-medium ${
                    formData.type === 'income' ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {new Date(formData.date).toLocaleDateString('id-ID')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Balance Warning for Low Balance */}
          {selectedWallet && formData.type === 'expense' && formData.amount > 0 && !balanceError && 
           selectedWallet.balance - formData.amount < 100000 && selectedWallet.balance - formData.amount >= 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <p className="text-sm text-yellow-700">
                  Warning: This transaction will leave you with a low balance of {formatCurrency(selectedWallet.balance - formData.amount)}
                </p>
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
              disabled={loading || !isFormValid}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                </div>
              ) : (
                editData ? 'Update Transaction' : 'Add Transaction'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
