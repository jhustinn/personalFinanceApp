import React, { useState, useEffect, useCallback } from 'react';
import { X, ScanLine, UploadCloud, Loader, AlertTriangle, CheckCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { receiptService, ExtractedData } from '../services/receiptService';
import { Database } from '../lib/database.types';
import { walletService } from '../services/walletService';
import { categoryService } from '../services/categoryService';

type Transaction = Database['public']['Tables']['transactions']['Row'];
type Wallet = Database['public']['Tables']['wallets']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

interface ScanReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
}

export const ScanReceiptModal: React.FC<ScanReceiptModalProps> = ({ isOpen, onClose, onSave }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'reviewing' | 'saving'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>>({
    wallet_id: '',
    category_id: '',
    amount: 0,
    type: 'expense',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      const previewUrl = URL.createObjectURL(selectedFile);
      setPreview(previewUrl);
      setError(null);
      handleAnalyze(selectedFile);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.png', '.jpg', '.webp'] },
    multiple: false,
  });

  useEffect(() => {
    if (isOpen) {
      loadDropdownData();
    } else {
      // Reset state on close
      setFile(null);
      setPreview(null);
      setStatus('idle');
      setError(null);
      setFormData({
        wallet_id: '', category_id: '', amount: 0, type: 'expense',
        description: '', date: new Date().toISOString().split('T')[0],
      });
    }
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [isOpen]);

  useEffect(() => {
    if (formData.type) {
      loadCategories(formData.type);
    }
  }, [formData.type]);

  const loadDropdownData = async () => {
    try {
      const [walletsData, categoriesData] = await Promise.all([
        walletService.getWallets(),
        categoryService.getCategoriesByType(formData.type)
      ]);
      setWallets(walletsData);
      setCategories(categoriesData);
    } catch (err) {
      console.error("Failed to load data", err);
      setError("Gagal memuat data dompet & kategori.");
    }
  };

  const loadCategories = async (type: 'income' | 'expense') => {
    const categoriesData = await categoryService.getCategoriesByType(type);
    setCategories(categoriesData);
    if (!categoriesData.find(c => c.id === formData.category_id)) {
      setFormData(prev => ({ ...prev, category_id: '' }));
    }
  };

  const handleAnalyze = async (imageFile: File) => {
    setStatus('analyzing');
    try {
      const extractedData = await receiptService.analyzeReceipt(imageFile);
      setFormData(prev => ({
        ...prev,
        amount: extractedData.amount || 0,
        description: extractedData.description || 'Transaksi dari struk',
        date: extractedData.date || new Date().toISOString().split('T')[0],
        type: extractedData.type || 'expense',
      }));
      setStatus('reviewing');
    } catch (err: any) {
      setError(`Gagal menganalisis struk: ${err.message}`);
      setStatus('idle');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('saving');
    setError(null);
    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(`Gagal menyimpan transaksi: ${err.message}`);
      setStatus('reviewing');
    }
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);

  if (!isOpen) return null;

  const renderContent = () => {
    switch (status) {
      case 'analyzing':
        return (
          <div className="text-center p-8">
            <Loader className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800">Menganalisis Struk...</h3>
            <p className="text-gray-500">Mohon tunggu, AI sedang membaca detail transaksi Anda.</p>
            {preview && <img src={preview} alt="Preview" className="mt-4 max-h-48 mx-auto rounded-lg shadow-md" />}
          </div>
        );
      case 'reviewing':
        return (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
              <CheckCircle className="w-5 h-5" />
              <p className="text-sm font-medium">Analisis berhasil! Silakan periksa dan lengkapi data di bawah.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="expense">Pengeluaran</option>
                  <option value="income">Pemasukan</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah (IDR)</label>
                <input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
              <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dompet</label>
                <select value={formData.wallet_id} onChange={e => setFormData({...formData, wallet_id: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
                  <option value="">Pilih Dompet</option>
                  {wallets.map(w => <option key={w.id} value={w.id}>{w.name} ({formatCurrency(w.balance)})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <select value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
                  <option value="">Pilih Kategori</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
              <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div className="flex justify-end space-x-3 pt-4">
              <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">Batal</button>
              <button type="submit" disabled={status === 'saving'} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
                {status === 'saving' ? 'Menyimpan...' : 'Simpan Transaksi'}
              </button>
            </div>
          </form>
        );
      default: // 'idle'
        return (
          <div {...getRootProps()} className={`p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${isDragActive ? 'border-purple-600 bg-purple-50' : 'border-gray-300 hover:border-purple-400'}`}>
            <input {...getInputProps()} />
            <UploadCloud className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800">Unggah atau Jatuhkan Struk</h3>
            <p className="text-gray-500">Seret file gambar ke sini, atau klik untuk memilih file.</p>
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <ScanLine className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Scan Struk Transaksi</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-600" /></button>
        </div>
        <div className="p-6">{renderContent()}</div>
      </div>
    </div>
  );
};
