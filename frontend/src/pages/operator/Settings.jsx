import { useState, useEffect } from 'react';
import { useAuth, useNotifications } from '../../context';
import { Button, Input, Select, Modal, LoadingSpinner } from '../../components';
import { formatCurrency } from '../../utils';
import {
  User,
  Building2,
  Bell,
  Shield,
  CreditCard,
  HelpCircle,
  Save,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  Globe,
  Clock,
  Eye,
  EyeOff,
  Check,
  Info,
} from 'lucide-react';

const Settings = () => {
  const { user, updateUser } = useAuth();
  const { showToast } = useNotifications();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  // Profile settings
  const [profile, setProfile] = useState({
    name: user?.name || 'John Doe',
    email: user?.email || 'john@example.com',
    phone: '+1 (555) 123-4567',
    company: 'EV Charge Networks Inc.',
    address: '123 Energy Street, Green City',
    website: 'www.evchargenetworks.com',
    timezone: 'America/New_York',
  });

  // Business settings
  const [business, setBusiness] = useState({
    companyName: 'EV Charge Networks Inc.',
    registrationNumber: 'REG-2024-12345',
    taxId: 'TAX-2024-67890',
    billingEmail: 'billing@evchargenetworks.com',
    supportEmail: 'support@evchargenetworks.com',
    supportPhone: '+1 (555) 987-6543',
  });

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: false,
    pushAlerts: true,
    maintenanceAlerts: true,
    revenueReports: true,
    sessionAlerts: false,
    weeklyDigest: true,
    monthlyReport: true,
  });

  // Security settings
  const [security, setSecurity] = useState({
    twoFactorEnabled: false,
    sessionTimeout: '30',
    ipWhitelist: '',
    apiKeyGenerated: false,
  });

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    showCurrent: false,
    showNew: false,
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'business', label: 'Business', icon: Building2 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ];

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateUser({ ...user, name: profile.name, email: profile.email });
      showToast({ type: 'success', message: 'Profile updated successfully!' });
    } catch (error) {
      showToast({ type: 'error', message: 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBusiness = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      showToast({ type: 'success', message: 'Business settings updated!' });
    } catch (error) {
      showToast({ type: 'error', message: 'Failed to update business settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      showToast({ type: 'success', message: 'Notification preferences saved!' });
    } catch (error) {
      showToast({ type: 'error', message: 'Failed to save preferences' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast({ type: 'error', message: 'Passwords do not match' });
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      showToast({ type: 'error', message: 'Password must be at least 8 characters' });
      return;
    }
    
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      showToast({ type: 'success', message: 'Password changed successfully!' });
      setShowPasswordModal(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        showCurrent: false,
        showNew: false,
      });
    } catch (error) {
      showToast({ type: 'error', message: 'Failed to change password' });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateApiKey = () => {
    setSecurity(prev => ({ ...prev, apiKeyGenerated: true }));
    showToast({ type: 'success', message: 'API key generated successfully!' });
  };

  const renderProfileSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">Profile</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Full Name"
            value={profile.name}
            onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
            icon={User}
          />
          <Input
            label="Email Address"
            value={profile.email}
            onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
            icon={Mail}
          />
          <Input
            label="Phone Number"
            value={profile.phone}
            onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
            icon={Phone}
          />
          <Input
            label="Company"
            value={profile.company}
            onChange={(e) => setProfile(prev => ({ ...prev, company: e.target.value }))}
            icon={Building2}
          />
          <Input
            label="Address"
            value={profile.address}
            onChange={(e) => setProfile(prev => ({ ...prev, address: e.target.value }))}
            icon={MapPin}
          />
          <Input
            label="Website"
            value={profile.website}
            onChange={(e) => setProfile(prev => ({ ...prev, website: e.target.value }))}
            icon={Globe}
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">Preferences</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Timezone"
            value={profile.timezone}
            onChange={(e) => setProfile(prev => ({ ...prev, timezone: e.target.value }))}
            options={[
              { value: 'America/New_York', label: 'Eastern Time (ET)' },
              { value: 'America/Chicago', label: 'Central Time (CT)' },
              { value: 'America/Denver', label: 'Mountain Time (MT)' },
              { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
              { value: 'UTC', label: 'UTC' },
            ]}
          />
          <Select
            label="Language"
            value="en"
            options={[
              { value: 'en', label: 'English' },
              { value: 'es', label: 'Spanish' },
              { value: 'fr', label: 'French' },
              { value: 'de', label: 'German' },
            ]}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button icon={Save} onClick={handleSaveProfile} loading={loading}>
          Save Changes
        </Button>
      </div>
    </div>
  );

  const renderBusinessSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">Business Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Company Name"
            value={business.companyName}
            onChange={(e) => setBusiness(prev => ({ ...prev, companyName: e.target.value }))}
            icon={Building2}
          />
          <Input
            label="Registration Number"
            value={business.registrationNumber}
            onChange={(e) => setBusiness(prev => ({ ...prev, registrationNumber: e.target.value }))}
          />
          <Input
            label="Tax ID"
            value={business.taxId}
            onChange={(e) => setBusiness(prev => ({ ...prev, taxId: e.target.value }))}
          />
          <Input
            label="Billing Email"
            type="email"
            value={business.billingEmail}
            onChange={(e) => setBusiness(prev => ({ ...prev, billingEmail: e.target.value }))}
            icon={Mail}
          />
          <Input
            label="Support Email"
            type="email"
            value={business.supportEmail}
            onChange={(e) => setBusiness(prev => ({ ...prev, supportEmail: e.target.value }))}
            icon={Mail}
          />
          <Input
            label="Support Phone"
            value={business.supportPhone}
            onChange={(e) => setBusiness(prev => ({ ...prev, supportPhone: e.target.value }))}
            icon={Phone}
          />
        </div>
      </div>

      <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-500 mt-0.5" />
          <div>
            <p className="font-medium text-blue-900">Business Verification</p>
            <p className="text-sm text-blue-700 mt-1">
              Your business has been verified. For any changes to legal information, please contact support.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button icon={Save} onClick={handleSaveBusiness} loading={loading}>
          Save Changes
        </Button>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">Alert Channels</h3>
        <div className="space-y-4">
          {[
            { key: 'emailAlerts', label: 'Email Alerts', desc: 'Receive alerts via email' },
            { key: 'smsAlerts', label: 'SMS Alerts', desc: 'Receive alerts via text message' },
            { key: 'pushAlerts', label: 'Push Notifications', desc: 'Receive in-app notifications' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-4 bg-secondary-50 rounded-xl">
              <div>
                <p className="font-medium text-secondary-900">{item.label}</p>
                <p className="text-sm text-secondary-500">{item.desc}</p>
              </div>
              <button
                onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                className={`w-12 h-6 rounded-full transition-colors ${
                  notifications[item.key] ? 'bg-primary-500' : 'bg-secondary-300'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  notifications[item.key] ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">Notification Types</h3>
        <div className="space-y-4">
          {[
            { key: 'maintenanceAlerts', label: 'Maintenance Alerts', desc: 'Get notified about maintenance issues' },
            { key: 'revenueReports', label: 'Revenue Updates', desc: 'Daily revenue summaries' },
            { key: 'sessionAlerts', label: 'Session Alerts', desc: 'Notifications for each session' },
            { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'Weekly performance summary' },
            { key: 'monthlyReport', label: 'Monthly Report', desc: 'Detailed monthly analytics' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-4 bg-secondary-50 rounded-xl">
              <div>
                <p className="font-medium text-secondary-900">{item.label}</p>
                <p className="text-sm text-secondary-500">{item.desc}</p>
              </div>
              <button
                onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                className={`w-12 h-6 rounded-full transition-colors ${
                  notifications[item.key] ? 'bg-primary-500' : 'bg-secondary-300'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  notifications[item.key] ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button icon={Save} onClick={handleSaveNotifications} loading={loading}>
          Save Preferences
        </Button>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">Account Security</h3>
        <div className="space-y-4">
          {/* Password */}
          <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-xl">
            <div>
              <p className="font-medium text-secondary-900">Password</p>
              <p className="text-sm text-secondary-500">Last changed 30 days ago</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowPasswordModal(true)}>
              Change Password
            </Button>
          </div>

          {/* 2FA */}
          <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-xl">
            <div>
              <p className="font-medium text-secondary-900">Two-Factor Authentication</p>
              <p className="text-sm text-secondary-500">
                {security.twoFactorEnabled ? 'Enabled - Using authenticator app' : 'Add an extra layer of security'}
              </p>
            </div>
            <button
              onClick={() => setSecurity(prev => ({ ...prev, twoFactorEnabled: !prev.twoFactorEnabled }))}
              className={`w-12 h-6 rounded-full transition-colors ${
                security.twoFactorEnabled ? 'bg-primary-500' : 'bg-secondary-300'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                security.twoFactorEnabled ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          {/* Session Timeout */}
          <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-xl">
            <div>
              <p className="font-medium text-secondary-900">Session Timeout</p>
              <p className="text-sm text-secondary-500">Auto logout after inactivity</p>
            </div>
            <Select
              value={security.sessionTimeout}
              onChange={(e) => setSecurity(prev => ({ ...prev, sessionTimeout: e.target.value }))}
              className="w-32"
              options={[
                { value: '15', label: '15 minutes' },
                { value: '30', label: '30 minutes' },
                { value: '60', label: '1 hour' },
                { value: '120', label: '2 hours' },
              ]}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">API Access</h3>
        <div className="p-4 bg-secondary-50 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-medium text-secondary-900">API Key</p>
              <p className="text-sm text-secondary-500">Use this key to integrate with external services</p>
            </div>
            {!security.apiKeyGenerated ? (
              <Button variant="outline" size="sm" onClick={handleGenerateApiKey}>
                Generate Key
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={handleGenerateApiKey}>
                Regenerate
              </Button>
            )}
          </div>
          {security.apiKeyGenerated && (
            <div className="p-3 bg-secondary-100 rounded-lg font-mono text-sm text-secondary-700">
              sk_live_••••••••••••••••••••••••••••1234
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderBillingSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">Payment Information</h3>
        <div className="p-4 bg-secondary-50 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-400 rounded flex items-center justify-center text-white text-xs font-bold">
                VISA
              </div>
              <div>
                <p className="font-medium text-secondary-900">•••• •••• •••• 4242</p>
                <p className="text-sm text-secondary-500">Expires 12/26</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Update
            </Button>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">Payout Settings</h3>
        <div className="p-4 bg-secondary-50 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-medium text-secondary-900">Bank Account</p>
              <p className="text-sm text-secondary-500">Chase Bank •••• 5678</p>
            </div>
            <Button variant="outline" size="sm">
              Update
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-secondary-900">Payout Schedule</p>
              <p className="text-sm text-secondary-500">Weekly (Every Friday)</p>
            </div>
            <Select 
              className="w-32"
              options={[
                { value: 'weekly', label: 'Weekly' },
                { value: 'biweekly', label: 'Bi-weekly' },
                { value: 'monthly', label: 'Monthly' },
              ]}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">Billing History</h3>
        <div className="space-y-2">
          {[
            { date: 'Jan 1, 2026', amount: formatCurrency(299), status: 'Paid' },
            { date: 'Dec 1, 2025', amount: formatCurrency(299), status: 'Paid' },
            { date: 'Nov 1, 2025', amount: formatCurrency(299), status: 'Paid' },
          ].map((invoice, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
              <div>
                <p className="font-medium text-secondary-900">{invoice.date}</p>
                <p className="text-sm text-secondary-500">Monthly subscription</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-medium text-secondary-900">{invoice.amount}</span>
                <span className="text-sm text-green-600">{invoice.status}</span>
                <Button variant="ghost" size="sm">
                  Download
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderHelpSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">Help & Support</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: 'Documentation', desc: 'Browse our guides and tutorials', action: 'View Docs' },
            { title: 'API Reference', desc: 'Technical documentation for developers', action: 'View API' },
            { title: 'Contact Support', desc: 'Get help from our support team', action: 'Contact' },
            { title: 'Community Forum', desc: 'Connect with other operators', action: 'Visit Forum' },
          ].map((item) => (
            <div key={item.title} className="p-4 bg-secondary-50 rounded-xl">
              <h4 className="font-medium text-secondary-900">{item.title}</h4>
              <p className="text-sm text-secondary-500 mt-1">{item.desc}</p>
              <Button variant="outline" size="sm" className="mt-3">
                {item.action}
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">Frequently Asked Questions</h3>
        <div className="space-y-2">
          {[
            'How do I add a new charging station?',
            'How can I update pricing for my stations?',
            'How do I view my payout history?',
            'How do I handle maintenance requests?',
          ].map((question, i) => (
            <button
              key={i}
              className="w-full flex items-center justify-between p-4 bg-secondary-50 rounded-xl hover:bg-secondary-100 transition-colors text-left"
            >
              <span className="font-medium text-secondary-900">{question}</span>
              <ChevronRight className="w-5 h-5 text-secondary-400" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileSettings();
      case 'business':
        return renderBusinessSettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'security':
        return renderSecuritySettings();
      case 'billing':
        return renderBillingSettings();
      case 'help':
        return renderHelpSettings();
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-secondary-900 ml-4">Settings</h1>
        <p className="text-secondary-500 mt-1 ml-4">Manage your account and preferences</p>
      </div>

      {/* Content */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-card p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-secondary-600 hover:bg-secondary-50'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="card">
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Change Password"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Current Password"
            type={passwordForm.showCurrent ? 'text' : 'password'}
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
            placeholder="Enter current password"
          />
          <Input
            label="New Password"
            type={passwordForm.showNew ? 'text' : 'password'}
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
            placeholder="Enter new password"
          />
          <Input
            label="Confirm New Password"
            type={passwordForm.showNew ? 'text' : 'password'}
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
            placeholder="Confirm new password"
          />

          <div className="flex gap-3 mt-6">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setShowPasswordModal(false)}
            >
              Cancel
            </Button>
            <Button fullWidth onClick={handleChangePassword} loading={loading}>
              Change Password
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Settings;
