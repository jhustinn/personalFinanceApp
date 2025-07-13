import React, { useState, useEffect } from 'react';
import { X, Wallet, Palette } from 'lucide-react';
import { Database } from '../lib/database.types';

type Wallet = Database['public']['Tables']['wallets']['Row'];

interface AddWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (wallet: Omit<Wallet, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'is_active'>) => void;
  editData?: Wallet | null;
}

const predefinedColors = [
  // Blues
  { name: 'Ocean Blue', value: 'bg-gradient-to-br from-blue-500 to-blue-600' },
  { name: 'Sky Blue', value: 'bg-gradient-to-br from-sky-400 to-sky-600' },
  { name: 'Indigo', value: 'bg-gradient-to-br from-indigo-500 to-indigo-700' },
  { name: 'Cyan', value: 'bg-gradient-to-br from-cyan-400 to-cyan-600' },
  
  // Reds & Oranges
  { name: 'Sunset Red', value: 'bg-gradient-to-br from-red-500 to-red-600' },
  { name: 'Orange Burst', value: 'bg-gradient-to-br from-orange-500 to-red-500' },
  { name: 'Coral', value: 'bg-gradient-to-br from-orange-400 to-pink-500' },
  { name: 'Rose', value: 'bg-gradient-to-br from-rose-400 to-rose-600' },
  
  // Greens
  { name: 'Forest Green', value: 'bg-gradient-to-br from-green-500 to-emerald-600' },
  { name: 'Mint', value: 'bg-gradient-to-br from-emerald-400 to-teal-500' },
  { name: 'Lime', value: 'bg-gradient-to-br from-lime-400 to-green-500' },
  { name: 'Teal', value: 'bg-gradient-to-br from-teal-500 to-cyan-600' },
  
  // Purples & Pinks
  { name: 'Royal Purple', value: 'bg-gradient-to-br from-purple-500 to-indigo-600' },
  { name: 'Violet', value: 'bg-gradient-to-br from-violet-500 to-purple-600' },
  { name: 'Pink', value: 'bg-gradient-to-br from-pink-500 to-rose-500' },
  { name: 'Fuchsia', value: 'bg-gradient-to-br from-fuchsia-500 to-pink-600' },
  
  // Yellows & Golds
  { name: 'Golden Sun', value: 'bg-gradient-to-br from-yellow-400 to-orange-500' },
  { name: 'Amber', value: 'bg-gradient-to-br from-amber-400 to-orange-600' },
  { name: 'Gold', value: 'bg-gradient-to-br from-yellow-500 to-yellow-600' },
  
  // Grays & Darks
  { name: 'Slate', value: 'bg-gradient-to-br from-slate-600 to-slate-700' },
  { name: 'Charcoal', value: 'bg-gradient-to-br from-gray-700 to-gray-800' },
  { name: 'Midnight', value: 'bg-gradient-to-br from-gray-800 to-black' },
  
  // Special gradients
  { name: 'Sunset', value: 'bg-gradient-to-br from-orange-400 via-red-500 to-pink-500' },
  { name: 'Ocean', value: 'bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600' },
  { name: 'Forest', value: 'bg-gradient-to-br from-green-400 via-green-500 to-emerald-600' },
  { name: 'Aurora', value: 'bg-gradient-to-br from-purple-400 via-pink-500 to-red-500' },
];

export const AddWalletModal: React.FC<AddWalletModalProps> = ({ 
  isOpen, 
  onClose, 
  onAdd, 
  editData 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    account_number: '',
    balance: 0,
    type: 'bank' as 'bank' | 'ewallet',
    color: predefinedColors[0].value,
  });
  const [showCustomColor, setShowCustomColor] = useState(false);
  const [customColor1, setCustomColor1] = useState('#3B82F6');
  const [customColor2, setCustomColor2] = useState('#1E40AF');

  useEffect(() => {
    if (editData) {
      setFormData({
        name: editData.name,
        account_number: editData.account_number,
        balance: editData.balance,
        type: editData.type,
        color: editData.color,
      });
      
      // Check if it's a custom color
      const isPredefined = predefinedColors.some(color => color.value === editData.color);
      if (!isPredefined) {
        setShowCustomColor(true);
        // Try to extract colors from custom gradient
        const gradientMatch = editData.color.match(/from-\[([^\]]+)\].*to-\[([^\]]+)\]/);
        if (gradientMatch) {
          setCustomColor1(gradientMatch[1]);
          setCustomColor2(gradientMatch[2]);
        }
      }
    } else {
      setFormData({
        name: '',
        account_number: '',
        balance: 0,
        type: 'bank',
        color: predefinedColors[0].value,
      });
      setShowCustomColor(false);
      setCustomColor1('#3B82F6');
      setCustomColor2('#1E40AF');
    }
  }, [editData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
    if (!editData) {
      setFormData({
        name: '',
        account_number: '',
        balance: 0,
        type: 'bank',
        color: predefinedColors[0].value,
      });
      setShowCustomColor(false);
    }
  };

  const handleCustomColorChange = () => {
    const customGradient = `bg-gradient-to-br from-[${customColor1}] to-[${customColor2}]`;
    setFormData({ ...formData, color: customGradient });
  };

  useEffect(() => {
    if (showCustomColor) {
      handleCustomColorChange();
    }
  }, [customColor1, customColor2, showCustomColor]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">
              {editData ? 'Edit Wallet' : 'Add New Wallet'}
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
            <label className="block text-sm font-medium text-gray-700 mb-3">Type</label>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'bank' })}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                  formData.type === 'bank'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                Bank
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'ewallet' })}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                  formData.type === 'ewallet'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                E-Wallet
              </button>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {formData.type === 'bank' ? 'Bank Name' : 'E-Wallet Name'}
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder={formData.type === 'bank' ? 'e.g., BRI, BNI, Mandiri' : 'e.g., OVO, GoPay, DANA'}
              required
            />
          </div>

          {/* Account Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Number
            </label>
            <input
              type="text"
              value={formData.account_number}
              onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Enter account number"
              required
            />
          </div>

          {/* Balance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {editData ? 'Current Balance (IDR)' : 'Initial Balance (IDR)'}
            </label>
            <input
              type="number"
              value={formData.balance}
              onChange={(e) => setFormData({ ...formData, balance: Number(e.target.value) })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="0"
              min="0"
            />
          </div>

          {/* Color Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">Card Color</label>
              <button
                type="button"
                onClick={() => setShowCustomColor(!showCustomColor)}
                className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
              >
                <Palette className="w-4 h-4" />
                <span>{showCustomColor ? 'Use Presets' : 'Custom Color'}</span>
              </button>
            </div>

            {showCustomColor ? (
              /* Custom Color Picker */
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Start Color</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={customColor1}
                        onChange={(e) => setCustomColor1(e.target.value)}
                        className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={customColor1}
                        onChange={(e) => setCustomColor1(e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="#3B82F6"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">End Color</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={customColor2}
                        onChange={(e) => setCustomColor2(e.target.value)}
                        className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={customColor2}
                        onChange={(e) => setCustomColor2(e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="#1E40AF"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Custom Color Preview */}
                <div className="flex justify-center">
                  <div 
                    className={`w-32 h-20 rounded-lg ${formData.color} flex items-center justify-center text-white font-semibold text-sm shadow-lg`}
                  >
                    Preview
                  </div>
                </div>
              </div>
            ) : (
              /* Predefined Colors Grid */
              <div className="grid grid-cols-4 gap-3">
                {predefinedColors.map((color, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={`group relative w-full h-16 rounded-lg ${color.value} transition-all duration-200 hover:scale-105 ${
                      formData.color === color.value ? 'ring-2 ring-offset-2 ring-blue-500 scale-105' : ''
                    }`}
                    title={color.name}
                  >
                    {formData.color === color.value && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                          <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                        </div>
                      </div>
                    )}
                    
                    {/* Tooltip */}
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                      {color.name}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Color Preview Card */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Preview</label>
            <div className="flex justify-center">
              <div className={`${formData.color} rounded-2xl p-6 text-white relative overflow-hidden w-80 h-48`}>
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 w-24 h-24 opacity-10">
                  <div className="w-full h-full bg-white rounded-full transform translate-x-6 -translate-y-6"></div>
                </div>
                
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      {formData.type === 'bank' ? 'BANK' : 'E-WALLET'}
                    </span>
                  </div>
                </div>

                {/* Bank Name */}
                <div className="mb-3">
                  <h3 className="text-lg font-bold tracking-wide">
                    {formData.name || 'Bank Name'}
                  </h3>
                </div>

                {/* Account Number */}
                <div className="mb-4">
                  <p className="text-white text-opacity-90 text-sm font-mono tracking-wider">
                    {formData.account_number ? 
                      `••••••••${formData.account_number.slice(-2)}` : 
                      '••••••••••'
                    }
                  </p>
                </div>

                {/* Balance */}
                <div>
                  <p className="text-lg font-bold tracking-tight">
                    {new Intl.NumberFormat('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(formData.balance)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {editData ? 'Update Wallet' : 'Add Wallet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
