import React, { useState, useEffect } from 'react';
import { X, Building, Save, Calculator } from 'lucide-react';
import { Database } from '../lib/database.types';

type Asset = Database['public']['Tables']['assets']['Row'];

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (asset: Omit<Asset, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'is_active'>) => void;
  editData?: Asset | null;
}

export const AddAssetModal: React.FC<AddAssetModalProps> = ({ 
  isOpen, 
  onClose, 
  onAdd, 
  editData 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'property' as 'property' | 'vehicle' | 'electronics' | 'jewelry' | 'investment' | 'other',
    current_value: 0,
    purchase_value: 0,
    purchase_date: new Date().toISOString().split('T')[0],
    monthly_contribution: 0,
    interest_rate: 0,
    status: 'active' as 'active' | 'sold' | 'depreciated',
    condition: 'good' as 'excellent' | 'good' | 'fair' | 'poor',
    description: '',
    location: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editData) {
      setFormData({
        name: editData.name,
        category: editData.category,
        current_value: editData.current_value,
        purchase_value: editData.purchase_value,
        purchase_date: editData.purchase_date,
        monthly_contribution: editData.monthly_contribution || 0,
        interest_rate: editData.interest_rate || 0,
        status: editData.status,
        condition: editData.condition,
        description: editData.description || '',
        location: editData.location || '',
        notes: editData.notes || ''
      });
    } else {
      setFormData({
        name: '',
        category: 'property',
        current_value: 0,
        purchase_value: 0,
        purchase_date: new Date().toISOString().split('T')[0],
        monthly_contribution: 0,
        interest_rate: 0,
        status: 'active',
        condition: 'good',
        description: '',
        location: '',
        notes: ''
      });
    }
  }, [editData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const assetData = {
        ...formData,
        monthly_contribution: formData.monthly_contribution || null,
        interest_rate: formData.interest_rate || null,
        description: formData.description || null,
        location: formData.location || null,
        notes: formData.notes || null
      };
      
      await onAdd(assetData);
      
      if (!editData) {
        setFormData({
          name: '',
          category: 'property',
          current_value: 0,
          purchase_value: 0,
          purchase_date: new Date().toISOString().split('T')[0],
          monthly_contribution: 0,
          interest_rate: 0,
          status: 'active',
          condition: 'good',
          description: '',
          location: '',
          notes: ''
        });
      }
    } catch (error) {
      console.error('Error saving asset:', error);
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

  const calculateGainLoss = () => {
    const gain = formData.current_value - formData.purchase_value;
    const percentage = formData.purchase_value > 0 ? (gain / formData.purchase_value) * 100 : 0;
    return { gain, percentage };
  };

  const { gain, percentage } = calculateGainLoss();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">
              {editData ? 'Edit Asset' : 'Add New Asset'}
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
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Asset Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="e.g., Primary Residence, Toyota Camry"
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
                  <option value="property">Property</option>
                  <option value="vehicle">Vehicle</option>
                  <option value="electronics">Electronics</option>
                  <option value="jewelry">Jewelry</option>
                  <option value="investment">Investment</option>
                  <option value="other">Other</option>
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
                  <option value="sold">Sold</option>
                  <option value="depreciated">Depreciated</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
                <select
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Brief description of the asset"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location (Optional)</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="e.g., Jakarta, Bandung"
              />
            </div>
          </div>

          {/* Financial Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Financial Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Value (IDR)</label>
                <input
                  type="number"
                  value={formData.purchase_value}
                  onChange={(e) => setFormData({ ...formData, purchase_value: Number(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Original purchase price"
                  min="0"
                  step="1000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Value (IDR)</label>
                <input
                  type="number"
                  value={formData.current_value}
                  onChange={(e) => setFormData({ ...formData, current_value: Number(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Current market value"
                  min="0"
                  step="1000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Date</label>
                <input
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Contribution (IDR)</label>
                <input
                  type="number"
                  value={formData.monthly_contribution}
                  onChange={(e) => setFormData({ ...formData, monthly_contribution: Number(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="For investments (optional)"
                  min="0"
                  step="1000"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Annual Interest Rate (%)</label>
                <input
                  type="number"
                  value={formData.interest_rate}
                  onChange={(e) => setFormData({ ...formData, interest_rate: Number(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="For investments (optional)"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
            </div>
          </div>

          {/* Gain/Loss Preview */}
          {(formData.current_value > 0 || formData.purchase_value > 0) && (
            <div className={`rounded-xl p-4 border ${
              gain >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center space-x-3 mb-3">
                <Calculator className={`w-5 h-5 ${gain >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                <h4 className={`font-semibold ${gain >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                  Gain/Loss Preview
                </h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className={gain >= 0 ? 'text-green-700' : 'text-red-700'}>
                    Purchase Value:
                  </span>
                  <span className={`font-medium ${gain >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                    {formatCurrency(formData.purchase_value)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={gain >= 0 ? 'text-green-700' : 'text-red-700'}>
                    Current Value:
                  </span>
                  <span className={`font-medium ${gain >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                    {formatCurrency(formData.current_value)}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className={gain >= 0 ? 'text-green-700' : 'text-red-700'}>
                    {gain >= 0 ? 'Gain:' : 'Loss:'}
                  </span>
                  <span className={`font-bold ${gain >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                    {gain >= 0 ? '+' : ''}{formatCurrency(gain)} ({gain >= 0 ? '+' : ''}{percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Additional notes about this asset"
            />
          </div>

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
                  <span>{editData ? 'Update Asset' : 'Add Asset'}</span>
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
