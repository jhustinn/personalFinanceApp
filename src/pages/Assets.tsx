import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Building, 
  Car,
  Smartphone,
  Home,
  TrendingUp,
  TrendingDown,
  Edit,
  Trash2,
  DollarSign,
  Calendar,
  Search,
  Filter,
  Download,
  Eye,
  EyeOff,
  BarChart3,
  PieChart,
  Target,
  Gem,
  Briefcase,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { Layout } from '../components/Layout';
import { AddAssetModal } from '../components/AddAssetModal';
import { assetService, AssetWithCalculations } from '../services/assetService';
import { Database } from '../lib/database.types';

type Asset = Database['public']['Tables']['assets']['Row'];

export const Assets: React.FC = () => {
  const [assets, setAssets] = useState<AssetWithCalculations[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'value' | 'date' | 'name' | 'gain'>('value');
  const [hiddenValues, setHiddenValues] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      setLoading(true);
      const [assetsData, statsData] = await Promise.all([
        assetService.getAssets(),
        assetService.getAssetStats()
      ]);
      setAssets(assetsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAssets();
    setRefreshing(false);
  };

  const handleAddAsset = async (assetData: Omit<Asset, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'is_active'>) => {
    try {
      await assetService.createAsset(assetData);
      await loadAssets();
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding asset:', error);
      alert('Error adding asset. Please try again.');
    }
  };

  const handleEditAsset = async (assetData: Omit<Asset, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'is_active'>) => {
    if (!editingAsset) return;
    
    try {
      await assetService.updateAsset(editingAsset.id, assetData);
      await loadAssets();
      setEditingAsset(null);
    } catch (error) {
      console.error('Error updating asset:', error);
      alert('Error updating asset. Please try again.');
    }
  };

  const handleDeleteAsset = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this asset? This action cannot be undone.')) {
      try {
        await assetService.deleteAsset(id);
        await loadAssets();
      } catch (error) {
        console.error('Error deleting asset:', error);
        alert('Error deleting asset. Please try again.');
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
      case 'property':
        return <Home className="w-5 h-5" />;
      case 'vehicle':
        return <Car className="w-5 h-5" />;
      case 'electronics':
        return <Smartphone className="w-5 h-5" />;
      case 'jewelry':
        return <Gem className="w-5 h-5" />;
      case 'investment':
        return <TrendingUp className="w-5 h-5" />;
      default:
        return <Briefcase className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'property':
        return 'bg-blue-100 text-blue-600';
      case 'vehicle':
        return 'bg-green-100 text-green-600';
      case 'electronics':
        return 'bg-purple-100 text-purple-600';
      case 'jewelry':
        return 'bg-yellow-100 text-yellow-600';
      case 'investment':
        return 'bg-orange-100 text-orange-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent':
        return 'bg-green-100 text-green-800';
      case 'good':
        return 'bg-blue-100 text-blue-800';
      case 'fair':
        return 'bg-yellow-100 text-yellow-800';
      case 'poor':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'sold':
        return 'bg-blue-100 text-blue-800';
      case 'depreciated':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const toggleValueVisibility = (assetId: string) => {
    setHiddenValues(prev => {
      const newSet = new Set(prev);
      if (newSet.has(assetId)) {
        newSet.delete(assetId);
      } else {
        newSet.add(assetId);
      }
      return newSet;
    });
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || asset.category === filter;
    return matchesSearch && matchesFilter;
  });

  const sortedAssets = [...filteredAssets].sort((a, b) => {
    switch (sortBy) {
      case 'value':
        return b.current_value - a.current_value;
      case 'date':
        return new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime();
      case 'name':
        return a.name.localeCompare(b.name);
      case 'gain':
        return b.gainLoss - a.gainLoss;
      default:
        return 0;
    }
  });

  const exportAssets = () => {
    const csvContent = [
      ['Name', 'Category', 'Current Value', 'Purchase Value', 'Gain/Loss', 'Purchase Date', 'Status', 'Condition'].join(','),
      ...sortedAssets.map(asset => [
        `"${asset.name}"`,
        asset.category,
        asset.current_value,
        asset.purchase_value,
        asset.gainLoss,
        asset.purchase_date,
        asset.status,
        asset.condition
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assets-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const actionButtons = (
    <div className="flex items-center space-x-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search assets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors w-64"
        />
      </div>

      <select
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
      >
        <option value="all">All Categories</option>
        <option value="property">Property</option>
        <option value="vehicle">Vehicle</option>
        <option value="electronics">Electronics</option>
        <option value="jewelry">Jewelry</option>
        <option value="investment">Investment</option>
        <option value="other">Other</option>
      </select>

      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value as any)}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
      >
        <option value="value">Sort by Value</option>
        <option value="date">Sort by Date</option>
        <option value="name">Sort by Name</option>
        <option value="gain">Sort by Gain/Loss</option>
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
        onClick={exportAssets}
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
        <span>Add Asset</span>
      </button>
    </div>
  );

  if (loading) {
    return (
      <Layout title="Assets" action={actionButtons}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Assets" action={actionButtons}>
      <div className="space-y-6">
        {/* Summary Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Assets</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.totalAssets}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Current Value</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalCurrentValue)}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Purchase Value</p>
                  <p className="text-2xl font-bold text-gray-600">{formatCurrency(stats.totalPurchaseValue)}</p>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-gray-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Gain/Loss</p>
                  <p className={`text-2xl font-bold ${stats.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.totalGainLoss >= 0 ? '+' : ''}{formatCurrency(stats.totalGainLoss)}
                  </p>
                  <p className={`text-sm ${stats.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.totalGainLoss >= 0 ? '+' : ''}{stats.totalGainLossPercentage.toFixed(1)}%
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  stats.totalGainLoss >= 0 ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {stats.totalGainLoss >= 0 ? (
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  ) : (
                    <TrendingDown className="w-6 h-6 text-red-600" />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Asset Categories Overview */}
        {stats && stats.categoryBreakdown.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Asset Categories Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {stats.categoryBreakdown.map((category: any) => (
                <div key={category.category} className="text-center p-4 bg-gray-50 rounded-xl">
                  <div className={`w-12 h-12 mx-auto rounded-lg flex items-center justify-center mb-3 ${getCategoryColor(category.category)}`}>
                    {getCategoryIcon(category.category)}
                  </div>
                  <h4 className="font-medium text-gray-900 capitalize mb-1">{category.category}</h4>
                  <p className="text-sm text-gray-600">{category.count} items</p>
                  <p className="text-xs text-gray-500">{category.percentage.toFixed(1)}%</p>
                  <p className="text-xs font-semibold text-gray-900">{formatCurrency(category.value)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assets List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">
              Your Assets ({sortedAssets.length})
            </h3>
          </div>

          <div className="p-6">
            {sortedAssets.length === 0 ? (
              <div className="text-center py-12">
                <Building className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No assets found</h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm || filter !== 'all'
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Start tracking your assets to monitor your net worth.'
                  }
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Your First Asset</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {sortedAssets.map((asset) => {
                  const isHidden = hiddenValues.has(asset.id);
                  
                  return (
                    <div key={asset.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getCategoryColor(asset.category)}`}>
                            {getCategoryIcon(asset.category)}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{asset.name}</h4>
                            <p className="text-sm text-gray-500">{asset.description}</p>
                            {asset.location && (
                              <p className="text-xs text-gray-400">{asset.location}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => toggleValueVisibility(asset.id)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                          >
                            {isHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => setEditingAsset(asset)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteAsset(asset.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Asset Details */}
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Current Value</span>
                          <span className="text-sm font-semibold text-gray-900">
                            {isHidden ? '••••••••' : formatCurrency(asset.current_value)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Purchase Value</span>
                          <span className="text-sm font-semibold text-gray-900">
                            {isHidden ? '••••••••' : formatCurrency(asset.purchase_value)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Gain/Loss</span>
                          <span className={`text-sm font-semibold ${asset.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {isHidden ? '••••••••' : (
                              <>
                                {asset.gainLoss >= 0 ? '+' : ''}{formatCurrency(asset.gainLoss)} ({asset.gainLoss >= 0 ? '+' : ''}{asset.gainLossPercentage.toFixed(1)}%)
                              </>
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Purchase Date</span>
                          <span className="text-sm font-semibold text-gray-900">
                            {new Date(asset.purchase_date).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                        {asset.monthly_contribution && asset.monthly_contribution > 0 && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Monthly Contribution</span>
                            <span className="text-sm font-semibold text-blue-600">
                              {isHidden ? '••••••••' : formatCurrency(asset.monthly_contribution)}
                            </span>
                          </div>
                        )}
                        {asset.interest_rate && asset.interest_rate > 0 && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Interest Rate</span>
                            <span className="text-sm font-semibold text-green-600">
                              {asset.interest_rate}% per year
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Progress Bar for Gain/Loss */}
                      <div className="mt-4">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              asset.gainLoss >= 0 ? 'bg-green-500' : 'bg-red-500'
                            }`}
                            style={{ 
                              width: `${Math.min(Math.abs(asset.gainLossPercentage), 100)}%` 
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {Math.abs(asset.gainLossPercentage).toFixed(1)}% {asset.gainLoss >= 0 ? 'gain' : 'loss'}
                        </p>
                      </div>

                      {/* Tags */}
                      <div className="flex items-center space-x-2 mt-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(asset.category)}`}>
                          {asset.category}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getConditionColor(asset.condition)}`}>
                          {asset.condition}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(asset.status)}`}>
                          {asset.status}
                        </span>
                      </div>

                      {/* Notes */}
                      {asset.notes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-600">{asset.notes}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Performance Insights */}
        {stats && stats.topPerformers.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performers */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Top Performers</h3>
              <div className="space-y-3">
                {stats.topPerformers.slice(0, 3).map((asset: AssetWithCalculations, index: number) => (
                  <div key={asset.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600 font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{asset.name}</p>
                        <p className="text-sm text-gray-500">{asset.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">+{asset.gainLossPercentage.toFixed(1)}%</p>
                      <p className="text-sm text-gray-500">{formatCurrency(asset.gainLoss)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Asset Allocation */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Asset Allocation</h3>
              <div className="space-y-4">
                {stats.categoryBreakdown.map((category: any) => (
                  <div key={category.category}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 capitalize">{category.category}</span>
                      <span className="text-sm text-gray-600">{category.percentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${category.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6 border border-purple-200">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Building className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Asset Management Tips</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Regularly update asset values to track your net worth accurately</li>
                <li>• Keep receipts and documentation for insurance and tax purposes</li>
                <li>• Consider depreciation for vehicles and electronics</li>
                <li>• Review and rebalance your asset portfolio periodically</li>
                <li>• Insure valuable assets to protect against loss or damage</li>
                <li>• Diversify across different asset categories to reduce risk</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Add/Edit Asset Modal */}
        <AddAssetModal
          isOpen={showAddModal || !!editingAsset}
          onClose={() => {
            setShowAddModal(false);
            setEditingAsset(null);
          }}
          onAdd={editingAsset ? handleEditAsset : handleAddAsset}
          editData={editingAsset}
        />
      </div>
    </Layout>
  );
};
