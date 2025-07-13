import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  ArrowUpRight, 
  ArrowDownRight,
  Calendar,
  Wallet,
  Tag,
  Edit,
  Trash2,
  RefreshCw,
  FileText,
  ScanLine
} from 'lucide-react';
import { Layout } from '../components/Layout';
import { AddTransactionModal } from '../components/AddTransactionModal';
import { ScanReceiptModal } from '../components/ScanReceiptModal';
import { transactionService, TransactionWithDetails } from '../services/transactionService';
import { walletService } from '../services/walletService';
import { categoryService } from '../services/categoryService';
import { Database } from '../lib/database.types';

type Transaction = Database['public']['Tables']['transactions']['Row'];
type Wallet = Database['public']['Tables']['wallets']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

export const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<TransactionWithDetails[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedWallet, setSelectedWallet] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [transactionsData, walletsData, categoriesData] = await Promise.all([
        transactionService.getTransactions(),
        walletService.getWallets(),
        categoryService.getCategories()
      ]);
      
      setTransactions(transactionsData);
      setWallets(walletsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAddTransaction = async (transactionData: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      await transactionService.createTransaction(transactionData);
      await loadData();
      setShowAddModal(false);
      setShowScanModal(false);
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Error adding transaction. Please try again.');
    }
  };

  const handleEditTransaction = async (transactionData: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!editingTransaction) return;
    
    try {
      await transactionService.updateTransaction(editingTransaction.id, transactionData);
      await loadData();
      setEditingTransaction(null);
    } catch (error) {
      console.error('Error updating transaction:', error);
      alert('Error updating transaction. Please try again.');
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
      try {
        await transactionService.deleteTransaction(id);
        await loadData();
      } catch (error) {
        console.error('Error deleting transaction:', error);
        alert('Error deleting transaction. Please try again.');
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getDateRangeFilter = () => {
    const now = new Date();
    switch (dateRange) {
      case 'today':
        return { start: now.toISOString().split('T')[0], end: now.toISOString().split('T')[0] };
      case 'week':
        const weekStart = new Date(now.setDate(now.getDate() - 7));
        return { start: weekStart.toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] };
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: monthStart.toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] };
      case 'year':
        const yearStart = new Date(now.getFullYear(), 0, 1);
        return { start: yearStart.toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] };
      default:
        return null;
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.category?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.wallet?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || transaction.type === filterType;
    const matchesWallet = selectedWallet === 'all' || transaction.wallet_id === selectedWallet;
    const matchesCategory = selectedCategory === 'all' || transaction.category_id === selectedCategory;
    
    let matchesDate = true;
    const dateFilter = getDateRangeFilter();
    if (dateFilter) {
      const transactionDate = transaction.date;
      matchesDate = transactionDate >= dateFilter.start && transactionDate <= dateFilter.end;
    }
    
    return matchesSearch && matchesType && matchesWallet && matchesCategory && matchesDate;
  });

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const exportTransactions = () => {
    const csvContent = [
      ['Date', 'Type', 'Description', 'Category', 'Wallet', 'Amount'].join(','),
      ...filteredTransactions.map(transaction => [
        transaction.date,
        transaction.type,
        `"${transaction.description}"`,
        transaction.category?.name || '',
        transaction.wallet?.name || '',
        transaction.amount
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const actionButtons = (
    <div className="flex items-center space-x-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search transactions..."
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
        <option value="expense">Expenses</option>
      </select>

      <button
        onClick={exportTransactions}
        className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
      >
        <Download className="w-4 h-4" />
        <span>Export</span>
      </button>

      <button
        onClick={() => setShowScanModal(true)}
        className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
      >
        <ScanLine className="w-4 h-4" />
        <span>Scan Struk</span>
      </button>

      <button
        onClick={() => setShowAddModal(true)}
        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span>Add Transaction</span>
      </button>
    </div>
  );

  if (loading) {
    return (
      <Layout title="Transactions" action={actionButtons}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Transactions" action={actionButtons}>
      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-800">{filteredTransactions.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Income</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <ArrowUpRight className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <ArrowDownRight className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Amount</p>
                <p className={`text-2xl font-bold ${totalIncome - totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(totalIncome - totalExpenses)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Wallet className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">
                Transaction History ({filteredTransactions.length})
              </h3>
              {(searchTerm || filterType !== 'all' || selectedWallet !== 'all' || selectedCategory !== 'all' || dateRange !== 'all') && (
                <span className="text-sm text-gray-500">
                  Filtered results
                </span>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            {filteredTransactions.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm || filterType !== 'all' || selectedWallet !== 'all' || selectedCategory !== 'all' || dateRange !== 'all'
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Start by adding your first transaction.'
                  }
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Transaction</span>
                </button>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transaction
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Wallet
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                            {transaction.type === 'income' ? (
                              <ArrowUpRight className="w-5 h-5 text-green-600" />
                            ) : (
                              <ArrowDownRight className="w-5 h-5 text-red-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{transaction.description}</p>
                            <p className="text-sm text-gray-500 capitalize">{transaction.type}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: transaction.category?.color }}
                          ></div>
                          <span className="text-sm text-gray-900">{transaction.category?.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{transaction.wallet?.name}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{formatDate(transaction.date)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`font-bold ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => setEditingTransaction(transaction)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteTransaction(transaction.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Add/Edit Transaction Modal */}
        <AddTransactionModal
          isOpen={showAddModal || !!editingTransaction}
          onClose={() => {
            setShowAddModal(false);
            setEditingTransaction(null);
          }}
          onAdd={editingTransaction ? handleEditTransaction : handleAddTransaction}
          editData={editingTransaction}
        />

        {/* Scan Receipt Modal */}
        <ScanReceiptModal
          isOpen={showScanModal}
          onClose={() => setShowScanModal(false)}
          onSave={handleAddTransaction}
        />
      </div>
    </Layout>
  );
};
