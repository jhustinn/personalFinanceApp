import React from 'react';
import { MoreVertical, Eye, EyeOff } from 'lucide-react';
import { Wallet } from '../types';

interface WalletCardProps {
  wallet: Wallet;
  onToggleBalance?: (id: string) => void;
  showBalance?: boolean;
}

export const WalletCard: React.FC<WalletCardProps> = ({ 
  wallet, 
  onToggleBalance, 
  showBalance = true 
}) => {
  const maskAccountNumber = (accountNumber: string) => {
    if (accountNumber.length <= 4) return accountNumber;
    const firstTwo = accountNumber.slice(0, 2);
    const lastTwo = accountNumber.slice(-2);
    const middleDots = '•'.repeat(Math.min(8, accountNumber.length - 4));
    return `${firstTwo}${middleDots}${lastTwo}`;
  };

  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(balance);
  };

  return (
    <div className={`
      ${wallet.color} 
      rounded-2xl p-6 text-white relative overflow-hidden
      transform transition-all duration-300 hover:scale-105 hover:shadow-xl
      cursor-pointer group
    `}>
      {/* Background Pattern */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
        <div className="w-full h-full bg-white rounded-full transform translate-x-8 -translate-y-8"></div>
      </div>
      
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
          <span className="text-xs font-semibold uppercase tracking-wide">
            {wallet.type === 'bank' ? 'BANK' : 'E-WALLET'}
          </span>
        </div>
        <button className="p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* Bank Name */}
      <div className="mb-4">
        <h3 className="text-xl font-bold tracking-wide">{wallet.name}</h3>
      </div>

      {/* Account Number */}
      <div className="mb-6">
        <p className="text-white text-opacity-90 text-lg font-mono tracking-wider">
          {maskAccountNumber(wallet.account_number)}
        </p>
      </div>

      {/* Balance */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {showBalance ? (
            <p className="text-2xl font-bold tracking-tight">
              {formatBalance(wallet.balance)}
            </p>
          ) : (
            <p className="text-2xl font-bold tracking-tight">
              ••••••••
            </p>
          )}
        </div>
        
        {onToggleBalance && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleBalance(wallet.id);
            }}
            className="p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors ml-2"
          >
            {showBalance ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Hover Effect */}
      <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-2xl"></div>
    </div>
  );
};
