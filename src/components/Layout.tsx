import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { LogOut, User, Menu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  action?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children, title, action }) => {
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-xl md:text-2xl font-bold text-gray-800">{title}</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {action}
              
              {/* User Menu */}
              <div className="flex items-center space-x-2 md:space-x-3">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">{user?.email}</span>
                </div>
                
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
