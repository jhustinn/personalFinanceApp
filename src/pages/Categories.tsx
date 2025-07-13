import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Tag,
  TrendingUp,
  TrendingDown,
  Filter,
  Download,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { Layout } from '../components/Layout';
import { AddCategoryModal } from '../components/AddCategoryModal';
import { categoryService } from '../services/categoryService';
import { Database } from '../lib/database.types';

type Category = Database['public']['Tables']['categories']['Row'];

const iconMap: { [key: string]: string } = {
  'Tag': '🏷️',
  'Briefcase': '💼',
  'UtensilsCrossed': '🍽️',
  'Car': '🚗',
  'Home': '🏠',
  'ShoppingBag': '🛍️',
  'Film': '🎬',
  'Heart': '❤️',
  'Zap': '⚡',
  'BookOpen': '📚',
  'Gamepad2': '🎮',
  'Plane': '✈️',
  'Coffee': '☕',
  'Shirt': '👕',
  'Smartphone': '📱',
  'Fuel': '⛽',
  'Gift': '🎁',
  'Music': '🎵',
  'Camera': '📷',
  'Dumbbell': '🏋️',
};

export const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCategories();
    setRefreshing(false);
  };

  const handleAddCategory = async (categoryData: Omit<Category, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'is_active'>) => {
    try {
      await categoryService.createCategory(categoryData);
      await loadCategories();
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding category:', error);
      alert('Error adding category. Please try again.');
    }
  };

  const handleEditCategory = async (categoryData: Omit<Category, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'is_active'>) => {
    if (!editingCategory) return;
    
    try {
      await categoryService.updateCategory(editingCategory.id, categoryData);
      await loadCategories();
      setEditingCategory(null);
    } catch (error) {
      console.error('Error updating category:', error);
      alert('Error updating category. Please try again.');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      try {
        await categoryService.deleteCategory(id);
        await loadCategories();
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Error deleting category. Please try again.');
      }
    }
  };

  const handleCreateDefaults = async () => {
    if (window.confirm('This will create default categories. Continue?')) {
      try {
        await categoryService.createDefaultCategories();
        await loadCategories();
      } catch (error) {
        console.error('Error creating default categories:', error);
        alert('Error creating default categories. Some may already exist.');
      }
    }
  };

  const exportCategories = () => {
    const csvContent = [
      ['Name', 'Type', 'Color', 'Icon', 'Status'].join(','),
      ...filteredCategories.map(category => [
        category.name,
        category.type,
        category.color,
        category.icon,
        category.is_active ? 'Active' : 'Inactive'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'categories.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || category.type === filterType;
    const matchesActive = showInactive || category.is_active;
    return matchesSearch && matchesType && matchesActive;
  });

  const incomeCategories = categories.filter(c => c.type === 'income' && c.is_active).length;
  const expenseCategories = categories.filter(c => c.type === 'expense' && c.is_active).length;
  const inactiveCategories = categories.filter(c => !c.is_active).length;

  const actionButtons = (
    <div className="flex items-center space-x-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors w-64"
        />
      </div>

      <select
        value={filterType}
        onChange={(e) => setFilterType(e.target.value as any)}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
      >
        <option value="all">All Types</option>
        <option value="income">Income</option>
        <option value="expense">Expense</option>
      </select>

      <button
        onClick={() => setShowInactive(!showInactive)}
        className={`flex items-center space-x-2 px-4 py-2 border rounded-lg transition-colors ${
          showInactive 
            ? 'border-blue-500 bg-blue-50 text-blue-700' 
            : 'border-gray-300 hover:bg-gray-50'
        }`}
      >
        {showInactive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        <span>{showInactive ? 'Hide Inactive' : 'Show Inactive'}</span>
      </button>

      <button
        onClick={handleRefresh}
        disabled={refreshing}
        className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        <span>Refresh</span>
      </button>

      <button
        onClick={exportCategories}
        className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
      >
        <Download className="w-4 h-4" />
        <span>Export</span>
      </button>

      <button
        onClick={handleCreateDefaults}
        className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span>Add Defaults</span>
      </button>

      <button
        onClick={() => setShowAddModal(true)}
        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span>Add Category</span>
      </button>
    </div>
  );

  if (loading) {
    return (
      <Layout title="Categories" action={actionButtons}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Categories" action={actionButtons}>
      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Categories</p>
                <p className="text-2xl font-bold text-gray-800">{categories.filter(c => c.is_active).length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Tag className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Income Categories</p>
                <p className="text-2xl font-bold text-green-600">{incomeCategories}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expense Categories</p>
                <p className="text-2xl font-bold text-red-600">{expenseCategories}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inactive</p>
                <p className="text-2xl font-bold text-gray-600">{inactiveCategories}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <EyeOff className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">
                All Categories ({filteredCategories.length})
              </h3>
              {showInactive && (
                <span className="text-sm text-gray-500">
                  Including inactive categories
                </span>
              )}
            </div>
          </div>

          <div className="p-6">
            {filteredCategories.length === 0 ? (
              <div className="text-center py-12">
                <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm || filterType !== 'all'
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Start by creating your first category or add default categories.'
                  }
                </p>
                <div className="flex items-center justify-center space-x-3">
                  <button
                    onClick={handleCreateDefaults}
                    className="inline-flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Add Default Categories</span>
                  </button>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Add Custom Category</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredCategories.map((category) => {
                  const iconEmoji = iconMap[category.icon] || '🏷️';
                  return (
                    <div
                      key={category.id}
                      className={`bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-colors group relative ${
                        !category.is_active ? 'opacity-60' : ''
                      }`}
                    >
                      {!category.is_active && (
                        <div className="absolute top-2 right-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-600">
                            Inactive
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mb-4">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                          style={{ backgroundColor: `${category.color}20` }}
                        >
                          <span>{iconEmoji}</span>
                        </div>
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => setEditingCategory(category)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteCategory(category.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-900">{category.name}</h4>
                        <div className="flex items-center justify-between">
                          <span 
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              category.type === 'income' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {category.type === 'income' ? (
                              <TrendingUp className="w-3 h-3 mr-1" />
                            ) : (
                              <TrendingDown className="w-3 h-3 mr-1" />
                            )}
                            {category.type}
                          </span>
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: category.color }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Category Tips */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Tag className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Category Management Tips</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Create specific categories to better track your spending patterns</li>
                <li>• Use income categories for different revenue streams</li>
                <li>• Keep expense categories broad enough to be useful but specific enough to be meaningful</li>
                <li>• Use colors and icons to quickly identify categories at a glance</li>
                <li>• Regularly review and update your categories based on your spending habits</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Add/Edit Category Modal */}
        <AddCategoryModal
          isOpen={showAddModal || !!editingCategory}
          onClose={() => {
            setShowAddModal(false);
            setEditingCategory(null);
          }}
          onAdd={editingCategory ? handleEditCategory : handleAddCategory}
          editData={editingCategory}
        />
      </div>
    </Layout>
  );
};
