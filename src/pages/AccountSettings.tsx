import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Bell, 
  Shield, 
  Palette,
  Download,
  Trash2,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import { Layout } from '../components/Layout';

export const AccountSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [notifications, setNotifications] = useState({
    budgetAlerts: true,
    transactionNotifications: true,
    monthlyReports: true,
    securityAlerts: true,
    marketingEmails: false
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Preferences', icon: Palette },
    { id: 'data', label: 'Data & Privacy', icon: Download }
  ];

  const handleNotificationChange = (key: string) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }));
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-2xl">JD</span>
              </div>
              <div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors mr-3">
                  Change Photo
                </button>
                <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                  Remove
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                <input
                  type="text"
                  defaultValue="John"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                <input
                  type="text"
                  defaultValue="Doe"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  defaultValue="john@example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  defaultValue="+62 812 3456 7890"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                <textarea
                  rows={4}
                  defaultValue="Personal finance enthusiast who loves tracking expenses and optimizing budgets."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-green-600" />
                <span className="text-green-800 font-medium">Your account is secure</span>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Change Password</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors pr-12"
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Two-Factor Authentication</h4>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">SMS Authentication</p>
                  <p className="text-sm text-gray-600">Receive codes via SMS</p>
                </div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Enable
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Login Sessions</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Current Session</p>
                    <p className="text-sm text-gray-600">Chrome on Windows • Jakarta, Indonesia</p>
                  </div>
                  <span className="text-green-600 text-sm font-medium">Active</span>
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Mobile App</p>
                    <p className="text-sm text-gray-600">iPhone • Last active 2 hours ago</p>
                  </div>
                  <button className="text-red-600 text-sm font-medium hover:text-red-700">
                    Revoke
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Email Notifications</h4>
              <div className="space-y-4">
                {Object.entries(notifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        {key === 'budgetAlerts' && 'Budget Alerts'}
                        {key === 'transactionNotifications' && 'Transaction Notifications'}
                        {key === 'monthlyReports' && 'Monthly Reports'}
                        {key === 'securityAlerts' && 'Security Alerts'}
                        {key === 'marketingEmails' && 'Marketing Emails'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {key === 'budgetAlerts' && 'Get notified when you exceed budget limits'}
                        {key === 'transactionNotifications' && 'Receive alerts for new transactions'}
                        {key === 'monthlyReports' && 'Monthly financial summary reports'}
                        {key === 'securityAlerts' && 'Important security notifications'}
                        {key === 'marketingEmails' && 'Product updates and promotional content'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleNotificationChange(key)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        value ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          value ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Push Notifications</h4>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-3">
                  Enable push notifications to receive real-time alerts on your device.
                </p>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Enable Push Notifications
                </button>
              </div>
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Display Settings</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors">
                    <option>Light</option>
                    <option>Dark</option>
                    <option>System</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors">
                    <option>English</option>
                    <option>Bahasa Indonesia</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors">
                    <option>IDR (Indonesian Rupiah)</option>
                    <option>USD (US Dollar)</option>
                    <option>EUR (Euro)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Date & Time</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors">
                    <option>DD/MM/YYYY</option>
                    <option>MM/DD/YYYY</option>
                    <option>YYYY-MM-DD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time Zone</label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors">
                    <option>Asia/Jakarta (GMT+7)</option>
                    <option>Asia/Singapore (GMT+8)</option>
                    <option>UTC (GMT+0)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );

      case 'data':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Data Export</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Export All Data</p>
                    <p className="text-sm text-gray-600">Download all your financial data in CSV format</p>
                  </div>
                  <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    <Download className="w-4 h-4" />
                    <span>Export</span>
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Export Transactions</p>
                    <p className="text-sm text-gray-600">Download transaction history only</p>
                  </div>
                  <button className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                    <Download className="w-4 h-4" />
                    <span>Export</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Privacy Settings</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Data Analytics</p>
                    <p className="text-sm text-gray-600">Help improve our service by sharing anonymous usage data</p>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600 transition-colors">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 text-red-600">Danger Zone</h4>
              <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                <div className="space-y-4">
                  <div>
                    <p className="font-medium text-red-900">Delete Account</p>
                    <p className="text-sm text-red-700 mb-3">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                    <button className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Account</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Layout title="Account Settings">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex">
            {/* Sidebar */}
            <div className="w-64 bg-gray-50 border-r border-gray-200">
              <div className="p-6">
                <nav className="space-y-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                      }`}
                    >
                      <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-blue-600' : ''}`} />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="p-8">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {tabs.find(tab => tab.id === activeTab)?.label}
                  </h2>
                  <p className="text-gray-600">
                    {activeTab === 'profile' && 'Manage your personal information and profile settings.'}
                    {activeTab === 'security' && 'Keep your account secure with these security settings.'}
                    {activeTab === 'notifications' && 'Control how and when you receive notifications.'}
                    {activeTab === 'preferences' && 'Customize your app experience and preferences.'}
                    {activeTab === 'data' && 'Manage your data and privacy settings.'}
                  </p>
                </div>

                {renderTabContent()}

                {/* Save Button */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-end space-x-3">
                    <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                      Cancel
                    </button>
                    <button className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
