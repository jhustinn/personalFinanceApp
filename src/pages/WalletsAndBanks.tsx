import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Trash2 } from 'lucide-react';
import { Layout } from '../components/Layout';
import { WalletCard } from '../components/WalletCard';
import { AddWalletModal } from '../components/AddWalletModal';
import { walletService } from '../services/walletService';
import { Database } from '../lib/database.types';

type Wallet = Database['public']['Tables']['wallets']['Row'];

export const WalletsAndBanks: React.FC = () => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'bank' | 'ewallet'>('all');
  const [hiddenBalances, setHiddenBalances] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadWallets();
  }, []);

  const loadWallets = async () => {
    try {
      setLoading(true);
      const data = await walletService.getWallets();
      setWallets(data);
    } catch (error) {
      console.error('Error loading wallets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWallet = async (walletData: Omit<Wallet, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'is_active'>) => {
    try {
      await walletService.createWallet(walletData);
      await loadWallets();
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding wallet:', error);
    }
  };

  const handleEditWallet = async (id: string, updates: Partial<Wallet>) => {
    try {
      await walletService.updateWallet(id, updates);
      await loadWallets();
      setEditingWallet(null);
    } catch (error) {
      console.error('Error updating wallet:', error);
    }
  };

  const handleDeleteWallet = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this wallet?')) {
      try {
        await walletService.deleteWallet(id);
        await loadWallets();
      } catch (error) {
        console.error('Error deleting wallet:', error);
      }
    }
  };

  const toggleBalance = (id: string) => {
    setHiddenBalances(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const filteredWallets = wallets.filter(wallet => {
    const matchesSearch = wallet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         wallet.account_number.includes(searchTerm);
    const matchesFilter = filterType === 'all' || wallet.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const totalBalance = filteredWallets.reduce((sum, wallet) => sum + wallet.balance, 0);

  const actionButtons = (
    <div className="flex items-center space-x-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search wallets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors w-64"
        />
      </div>

      <select
        value={filterType}
        onChange={(e) => setFilterType(e.target.value as 'all' | 'bank' | 'ewallet')}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
      >
        <option value="all">All Types</option>
        <option value="bank">Banks</option>
        <option value="ewallet">E-Wallets</option>
      </select>

      <button
        onClick={() => setShowAddModal(true)}
        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span>Add New</span>
      </button>
    </div>
  );

  if (loading) {
    return (
      <Layout title="Wallets & Banks" action={actionButtons}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Wallets & Banks" action={actionButtons}>
      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Wallets</p>
                <p className="text-2xl font-bold text-gray-800">{filteredWallets.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Plus className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Banks</p>
                <p className="text-2xl font-bold text-gray-800">
                  {filteredWallets.filter(w => w.type === 'bank').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Filter className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Balance</p>
                <p className="text-2xl font-bold text-gray-800">
                  {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(totalBalance)}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-yellow-600 font-bold">Rp</span>
              </div>
            </div>
          </div>
        </div>

        {/* Wallets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredWallets.map((wallet) => (
            <div key={wallet.id} className="relative group">
              <WalletCard
                wallet={wallet}
                showBalance={!hiddenBalances.has(wallet.id)}
                onToggleBalance={toggleBalance}
              />
              
              {/* Action Buttons */}
              <div className="absolute top-4 right-4 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setEditingWallet(wallet)}
                  className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors"
                >
                  <Edit className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={() => handleDeleteWallet(wallet.id)}
                  className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredWallets.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">No wallets found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterType !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by adding your first wallet or bank account.'
              }
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Add Your First Wallet</span>
            </button>
          </div>
        )}

        {/* Add/Edit Wallet Modal */}
        <AddWalletModal
          isOpen={showAddModal || !!editingWallet}
          onClose={() => {
            setShowAddModal(false);
            setEditingWallet(null);
          }}
          onAdd={editingWallet ? 
            (data) => handleEditWallet(editingWallet.id, data) : 
            handleAddWallet
          }
          editData={editingWallet}
        />
      </div>
    </Layout>
  );
};
