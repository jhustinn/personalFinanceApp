import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AuthGuard } from './components/AuthGuard';
import { Dashboard } from './pages/Dashboard';
import { WalletsAndBanks } from './pages/WalletsAndBanks';
import { Transactions } from './pages/Transactions';
import { Categories } from './pages/Categories';
import { MonthlyBudgets } from './pages/MonthlyBudgets';
import { ReportsAnalytics } from './pages/ReportsAnalytics';
import { AccountSettings } from './pages/AccountSettings';
import { GoalsAndLoans } from './pages/GoalsAndLoans';
import { FinancialGoals } from './pages/FinancialGoals';
import { Assets } from './pages/Assets';
import { AskAI } from './pages/AskAI';
import { AIRecommendations } from './pages/AIRecommendations';
import { Simulations } from './pages/Simulations';
import { EducationalArticles } from './pages/EducationalArticles';

function App() {
  return (
    <AuthProvider>
      <Router>
        <AuthGuard>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/wallets" element={<WalletsAndBanks />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/budgets" element={<MonthlyBudgets />} />
            <Route path="/reports" element={<ReportsAnalytics />} />
            <Route path="/settings" element={<AccountSettings />} />
            
            {/* Goals & Finance */}
            <Route path="/goals-loans" element={<GoalsAndLoans />} />
            <Route path="/financial-goals" element={<FinancialGoals />} />
            <Route path="/assets" element={<Assets />} />
            
            {/* AI Assistant */}
            <Route path="/ask-ai" element={<AskAI />} />
            <Route path="/ai-recommendations" element={<AIRecommendations />} />
            <Route path="/simulations" element={<Simulations />} />
            <Route path="/educational-articles" element={<EducationalArticles />} />
          </Routes>
        </AuthGuard>
      </Router>
    </AuthProvider>
  );
}

export default App;
