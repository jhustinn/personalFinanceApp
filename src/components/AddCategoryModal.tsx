import React, { useState, useEffect } from 'react';
import { X, Tag, Palette, Info } from 'lucide-react';
import { Database } from '../lib/database.types';
import { categoryService } from '../services/categoryService';

type Category = Database['public']['Tables']['categories']['Row'];

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (category: Omit<Category, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'is_active'>) => void;
  editData?: Category | null;
}

const iconOptions = [
  { name: 'Tag', icon: '🏷️' },
  { name: 'Briefcase', icon: '💼' },
  { name: 'UtensilsCrossed', icon: '🍽️' },
  { name: 'Car', icon: '🚗' },
  { name: 'Home', icon: '🏠' },
  { name: 'ShoppingBag', icon: '🛍️' },
  { name: 'Film', icon: '🎬' },
  { name: 'Heart', icon: '❤️' },
  { name: 'Zap', icon: '⚡' },
  { name: 'BookOpen', icon: '📚' },
  { name: 'Gamepad2', icon: '🎮' },
  { name: 'Plane', icon: '✈️' },
  { name: 'Coffee', icon: '☕' },
  { name: 'Shirt', icon: '👕' },
  { name: 'Smartphone', icon: '📱' },
  { name: 'Fuel', icon: '⛽' },
  { name: 'Gift', icon: '🎁' },
  { name: 'Music', icon: '🎵' },
  { name: 'Camera', icon: '📷' },
  { name: 'Dumbbell', icon: '🏋️' },
  { name: 'Shield', icon: '🛡️' },
  { name: 'TrendingUp', icon: '📈' },
  { name: 'Target', icon: '🎯' },
  { name: 'AlertTriangle', icon: '⚠️' },
  { name: 'CreditCard', icon: '💳' },
  { name: 'Gem', icon: '💎' },
];

const colorOptions = [
  { name: 'Red', value: '#EF4444' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Amber', value: '#F59E0B' },
  { name: 'Yellow', value: '#EAB308' },
  { name: 'Lime', value: '#84CC16' },
  { name: 'Green', value: '#22C55E' },
  { name: 'Emerald', value: '#10B981' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Sky', value: '#0EA5E9' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Violet', value: '#8B5CF6' },
  { name: 'Purple', value: '#A855F7' },
  { name: 'Fuchsia', value: '#D946EF' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Rose', value: '#F43F5E' },
  { name: 'Gray', value: '#6B7280' },
];

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({ 
  isOpen, 
  onClose, 
  onAdd, 
  editData 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense' as 'income' | 'expense' | 'goal' | 'loan' | 'asset',
    color: colorOptions[0].value,
    icon: iconOptions[0].name,
  });
  const [showCustomColor, setShowCustomColor] = useState(false);
  const [customColor, setCustomColor] = useState('#6B7280');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editData) {
      setFormData({
        name: editData.name,
        type: editData.type as any,
        color: editData.color,
        icon: editData.icon,
      });
      
      // Check if it's a custom color
      const isPredefined = colorOptions.some(color => color.value === editData.color);
      if (!isPredefined) {
        setShowCustomColor(true);
        setCustomColor(editData.color);
      }
    } else {
      setFormData({
        name: '',
        type: 'expense',
        color: colorOptions[0].value,
        icon: iconOptions[0].name,
      });
      setShowCustomColor(false);
      setCustomColor('#6B7280');
    }
  }, [editData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const finalColor = showCustomColor ? customColor : formData.color;
      await onAdd({ ...formData, color: finalColor });
      
      if (!editData) {
        setFormData({
          name: '',
          type: 'expense',
          color: colorOptions[0].value,
          icon: iconOptions[0].name,
        });
        setShowCustomColor(false);
      }
    } catch (error) {
      console.error('Error saving category:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomColorChange = (color: string) => {
    setCustomColor(color);
    setFormData({ ...formData, color });
  };

  const getCategoryTypeInfo = (type: string) => {
    const types = categoryService.getCategoryTypes();
    return types.find(t => t.value === type);
  };

  if (!isOpen) return null;

  const displayColor = showCustomColor ? customColor : formData.color;
  const selectedIcon = iconOptions.find(icon => icon.name === formData.icon);
  const typeInfo = getCategoryTypeInfo(formData.type);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Tag className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">
              {editData ? 'Edit Category' : 'Add New Category'}
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
            <label className="block text-sm font-medium text-gray-700 mb-3">Category Type</label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {categoryService.getCategoryTypes().map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: type.value as any })}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                    formData.type === type.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <h4 className="font-medium text-gray-900 mb-1">{type.label}</h4>
                  <p className="text-xs text-gray-500">{type.description}</p>
                </button>
              ))}
            </div>
            
            {typeInfo && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start space-x-2">
                  <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-700">{typeInfo.description}</p>
                </div>
              </div>
            )}
          </div>

          {/* Category Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="e.g., Food & Dining, Emergency Fund, Car Loan"
              required
            />
          </div>

          {/* Icon Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Icon</label>
            <div className="grid grid-cols-6 md:grid-cols-8 gap-3 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {iconOptions.map((icon) => (
                <button
                  key={icon.name}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon: icon.name })}
                  className={`p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                    formData.icon === icon.name
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  title={icon.name}
                >
                  <span className="text-2xl">{icon.icon}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">Color</label>
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
                <div className="flex items-center space-x-4">
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => handleCustomColorChange(e.target.value)}
                    className="w-16 h-12 rounded-lg border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={customColor}
                    onChange={(e) => handleCustomColorChange(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="#6B7280"
                    pattern="^#[0-9A-Fa-f]{6}$"
                  />
                </div>
              </div>
            ) : (
              /* Predefined Colors Grid */
              <div className="grid grid-cols-6 gap-3">
                {colorOptions.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={`w-full h-12 rounded-lg transition-all hover:scale-105 ${
                      formData.color === color.value ? 'ring-2 ring-offset-2 ring-blue-500 scale-105' : ''
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  >
                    {formData.color === color.value && (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-4 h-4 bg-white rounded-full"></div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Category Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Preview</label>
            <div className="flex justify-center">
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="flex items-center space-x-4">
                  <div 
                    className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: `${displayColor}20` }}
                  >
                    <span>{selectedIcon?.icon}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-lg">
                      {formData.name || 'Category Name'}
                    </h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <span 
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          formData.type === 'income' ? 'bg-green-100 text-green-800' :
                          formData.type === 'expense' ? 'bg-red-100 text-red-800' :
                          formData.type === 'goal' ? 'bg-blue-100 text-blue-800' :
                          formData.type === 'loan' ? 'bg-orange-100 text-orange-800' :
                          'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {formData.type}
                      </span>
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: displayColor }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Usage Context Info */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Where this category will be used:</h4>
            <div className="text-sm text-gray-600 space-y-1">
              {formData.type === 'income' && (
                <>
                  <p>• Transaction recording (income entries)</p>
                  <p>• Budget planning (income budgets)</p>
                  <p>• Financial reports and analytics</p>
                </>
              )}
              {formData.type === 'expense' && (
                <>
                  <p>• Transaction recording (expense entries)</p>
                  <p>• Budget planning (expense budgets)</p>
                  <p>• Financial reports and analytics</p>
                </>
              )}
              {formData.type === 'goal' && (
                <>
                  <p>• Financial goals creation and tracking</p>
                  <p>• Savings goal categorization</p>
                  <p>• Goal progress reporting</p>
                </>
              )}
              {formData.type === 'loan' && (
                <>
                  <p>• Loan and debt tracking</p>
                  <p>• Debt categorization and management</p>
                  <p>• Payment tracking and reporting</p>
                </>
              )}
              {formData.type === 'asset' && (
                <>
                  <p>• Asset tracking and valuation</p>
                  <p>• Portfolio categorization</p>
                  <p>• Net worth calculations</p>
                </>
              )}
            </div>
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
                editData ? 'Update Category' : 'Add Category'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
