import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CreditCard, 
  Tag, 
  Wallet, 
  Calendar, 
  BarChart3, 
  Settings,
  X,
  Target,
  TrendingUp,
  Building,
  Bot,
  Lightbulb,
  Calculator,
  BookOpen,
  Menu
} from 'lucide-react';
import { NavigationItem } from '../types';

interface SidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

const navigationItems: NavigationItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', path: '/dashboard' },
  { id: 'transactions', label: 'Transactions', icon: 'CreditCard', path: '/transactions' },
  { id: 'categories', label: 'Categories', icon: 'Tag', path: '/categories' },
  { id: 'wallets', label: 'Wallets & Banks', icon: 'Wallet', path: '/wallets' },
  { id: 'budgets', label: 'Monthly Budgets', icon: 'Calendar', path: '/budgets' },
  { id: 'reports', label: 'Reports & Analytics', icon: 'BarChart3', path: '/reports' },
];

const goalItems: NavigationItem[] = [
  { id: 'goals-loans', label: 'Goals & Loans', icon: 'Target', path: '/goals-loans' },
  { id: 'financial-goals', label: 'Financial Goals', icon: 'TrendingUp', path: '/financial-goals' },
  { id: 'assets', label: 'Assets', icon: 'Building', path: '/assets' },
];

const aiAssistantItems: NavigationItem[] = [
  { id: 'ask-ai', label: 'Ask AI', icon: 'Bot', path: '/ask-ai' },
  { id: 'ai-recommendations', label: 'AI Recommendations', icon: 'Lightbulb', path: '/ai-recommendations' },
  { id: 'simulations', label: 'Simulations', icon: 'Calculator', path: '/simulations' },
  { id: 'educational-articles', label: 'Educational Articles', icon: 'BookOpen', path: '/educational-articles' },
];

const settingsItems: NavigationItem[] = [
  { id: 'settings', label: 'Account Settings', icon: 'Settings', path: '/settings' },
];

const iconMap = {
  LayoutDashboard,
  CreditCard,
  Tag,
  Wallet,
  Calendar,
  BarChart3,
  Settings,
  Target,
  TrendingUp,
  Building,
  Bot,
  Lightbulb,
  Calculator,
  BookOpen,
};

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onToggle }) => {
  const location = useLocation();

  const renderNavigationSection = (items: NavigationItem[], title?: string) => (
    <div className="mb-6">
      {title && (
        <div className="px-4 mb-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {title}
          </h3>
        </div>
      )}
      <ul className="space-y-1 px-4">
        {items.map((item) => {
          const IconComponent = iconMap[item.icon as keyof typeof iconMap];
          const isActive = location.pathname === item.path;
          return (
            <li key={item.id}>
              <Link
                to={item.path}
                className={`
                  flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm
                  ${isActive 
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600 font-medium' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                  }
                `}
              >
                <IconComponent className={`w-4 h-4 ${isActive ? 'text-blue-600' : ''}`} />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:shadow-none
        w-64 flex flex-col
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-800">FinanceApp</span>
          </div>
          {onToggle && (
            <button
              onClick={onToggle}
              className="lg:hidden p-1 rounded-md hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 overflow-y-auto">
          {/* Main Navigation */}
          {renderNavigationSection(navigationItems)}
          
          {/* Goals & Finance Section */}
          {renderNavigationSection(goalItems, "Goals & Finance")}
          
          {/* AI Assistant Section */}
          {renderNavigationSection(aiAssistantItems, "AI Assistant")}
          
          {/* Settings Section */}
          {renderNavigationSection(settingsItems)}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">JD</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">John Doe</p>
              <p className="text-xs text-gray-500 truncate">john@example.com</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
