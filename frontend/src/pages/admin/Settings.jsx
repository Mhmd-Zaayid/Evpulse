import { useState } from 'react';
import { useAuth, useNotifications } from '../../context';
import { Button, Input, Select, Modal } from '../../components';
import {
  Settings as SettingsIcon,
  Globe,
  Bell,
  Shield,
  Database,
  Mail,
  Server,
  Key,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  ChevronRight,
  Users,
  Building2,
  CreditCard,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';

const Settings = () => {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  // General settings
  const [general, setGeneral] = useState({
    platformName: 'EvPulse',
    supportEmail: 'support@evpulse.com',
    timezone: 'UTC',
    currency: 'INR',
    language: 'en',
    maintenanceMode: false,
  });

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: false,
    systemAlerts: true,
    weeklyReports: true,
    monthlyReports: true,
    operatorApprovalAlerts: true,
    paymentAlerts: true,
    maintenanceAlerts: true,
  });

  // Security settings
  const [security, setSecurity] = useState({
    twoFactorRequired: false,
    sessionTimeout: '60',
    passwordMinLength: '8',
    passwordExpiry: '90',
    maxLoginAttempts: '5',
    ipWhitelist: '',
  });

  // Integration settings
  const [integrations, setIntegrations] = useState({
    stripeEnabled: true,
    stripeKey: 'sk_live_••••••••••••••••',
    twilioEnabled: false,
    twilioSid: '',
    sendgridEnabled: true,
    sendgridKey: 'SG.••••••••••••••••',
    googleMapsKey: 'AIza••••••••••••••••',
  });

  const tabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  const handleSave = async (section) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      showToast({ type: 'success', message: `${section} settings saved successfully!` });
    } catch (error) {
      showToast({ type: 'error', message: 'Failed to save settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      showToast({ type: 'success', message: 'Cache cleared successfully!' });
    } catch (error) {
      showToast({ type: 'error', message: 'Failed to clear cache' });
    } finally {
      setLoading(false);
    }
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">Platform Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Platform Name"
            value={general.platformName}
            onChange={(e) => setGeneral(prev => ({ ...prev, platformName: e.target.value }))}
          />
          <Input
            label="Support Email"
            type="email"
            value={general.supportEmail}
            onChange={(e) => setGeneral(prev => ({ ...prev, supportEmail: e.target.value }))}
            icon={Mail}
          />
          <Select
            label="Default Timezone"
            value={general.timezone}
            onChange={(e) => setGeneral(prev => ({ ...prev, timezone: e.target.value }))}
          >
            <option value="UTC">UTC</option>
            <option value="America/New_York">Eastern Time</option>
            <option value="America/Chicago">Central Time</option>
            <option value="America/Denver">Mountain Time</option>
            <option value="America/Los_Angeles">Pacific Time</option>
          </Select>
          <Select
            label="Default Currency"
            value={general.currency}
            onChange={(e) => setGeneral(prev => ({ ...prev, currency: e.target.value }))}
          >
            <option value="INR">INR (₹)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
            <option value="CAD">CAD (C$)</option>
          </Select>
          <Select
            label="Default Language"
            value={general.language}
            onChange={(e) => setGeneral(prev => ({ ...prev, language: e.target.value }))}
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
          </Select>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">Maintenance Mode</h3>
        <div className="p-4 bg-secondary-50 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-secondary-900">Maintenance Mode</p>
              <p className="text-sm text-secondary-500">Disable access for regular users during maintenance</p>
            </div>
            <button
              onClick={() => setGeneral(prev => ({ ...prev, maintenanceMode: !prev.maintenanceMode }))}
              className={`w-12 h-6 rounded-full transition-colors ${
                general.maintenanceMode ? 'bg-amber-500' : 'bg-secondary-300'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                general.maintenanceMode ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
          {general.maintenanceMode && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">Maintenance Mode Active</p>
                <p className="text-sm text-amber-700">Users will see a maintenance page when trying to access the platform.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button icon={Save} onClick={() => handleSave('General')} loading={loading}>
          Save Changes
        </Button>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">Notification Channels</h3>
        <div className="space-y-4">
          {[
            { key: 'emailNotifications', label: 'Email Notifications', desc: 'Send notifications via email' },
            { key: 'smsNotifications', label: 'SMS Notifications', desc: 'Send notifications via SMS' },
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
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">Alert Types</h3>
        <div className="space-y-4">
          {[
            { key: 'systemAlerts', label: 'System Alerts', desc: 'Critical system notifications' },
            { key: 'operatorApprovalAlerts', label: 'Operator Approvals', desc: 'New operator registration alerts' },
            { key: 'paymentAlerts', label: 'Payment Alerts', desc: 'Large transactions and failures' },
            { key: 'maintenanceAlerts', label: 'Maintenance Alerts', desc: 'Station maintenance notifications' },
            { key: 'weeklyReports', label: 'Weekly Reports', desc: 'Automated weekly summary' },
            { key: 'monthlyReports', label: 'Monthly Reports', desc: 'Automated monthly analytics' },
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
        <Button icon={Save} onClick={() => handleSave('Notification')} loading={loading}>
          Save Changes
        </Button>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">Authentication</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-xl">
            <div>
              <p className="font-medium text-secondary-900">Require Two-Factor Authentication</p>
              <p className="text-sm text-secondary-500">Force all admins to use 2FA</p>
            </div>
            <button
              onClick={() => setSecurity(prev => ({ ...prev, twoFactorRequired: !prev.twoFactorRequired }))}
              className={`w-12 h-6 rounded-full transition-colors ${
                security.twoFactorRequired ? 'bg-primary-500' : 'bg-secondary-300'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                security.twoFactorRequired ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">Session Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Session Timeout (minutes)"
            value={security.sessionTimeout}
            onChange={(e) => setSecurity(prev => ({ ...prev, sessionTimeout: e.target.value }))}
          >
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="60">1 hour</option>
            <option value="120">2 hours</option>
            <option value="480">8 hours</option>
          </Select>
          <Select
            label="Max Login Attempts"
            value={security.maxLoginAttempts}
            onChange={(e) => setSecurity(prev => ({ ...prev, maxLoginAttempts: e.target.value }))}
          >
            <option value="3">3 attempts</option>
            <option value="5">5 attempts</option>
            <option value="10">10 attempts</option>
          </Select>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">Password Policy</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Minimum Password Length"
            value={security.passwordMinLength}
            onChange={(e) => setSecurity(prev => ({ ...prev, passwordMinLength: e.target.value }))}
          >
            <option value="8">8 characters</option>
            <option value="10">10 characters</option>
            <option value="12">12 characters</option>
            <option value="16">16 characters</option>
          </Select>
          <Select
            label="Password Expiry (days)"
            value={security.passwordExpiry}
            onChange={(e) => setSecurity(prev => ({ ...prev, passwordExpiry: e.target.value }))}
          >
            <option value="30">30 days</option>
            <option value="60">60 days</option>
            <option value="90">90 days</option>
            <option value="never">Never</option>
          </Select>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">IP Whitelist</h3>
        <Input
          label="Allowed IP Addresses"
          value={security.ipWhitelist}
          onChange={(e) => setSecurity(prev => ({ ...prev, ipWhitelist: e.target.value }))}
          placeholder="Enter IP addresses separated by commas"
          helperText="Leave empty to allow all IPs"
        />
      </div>

      <div className="flex justify-end">
        <Button icon={Save} onClick={() => handleSave('Security')} loading={loading}>
          Save Changes
        </Button>
      </div>
    </div>
  );

  const renderIntegrationSettings = () => (
    <div className="space-y-6">
      {/* Stripe */}
      <div className="p-4 border border-secondary-200 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-secondary-900">Stripe</p>
              <p className="text-sm text-secondary-500">Payment processing</p>
            </div>
          </div>
          <button
            onClick={() => setIntegrations(prev => ({ ...prev, stripeEnabled: !prev.stripeEnabled }))}
            className={`w-12 h-6 rounded-full transition-colors ${
              integrations.stripeEnabled ? 'bg-primary-500' : 'bg-secondary-300'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
              integrations.stripeEnabled ? 'translate-x-6' : 'translate-x-0.5'
            }`} />
          </button>
        </div>
        {integrations.stripeEnabled && (
          <Input
            label="API Key"
            value={integrations.stripeKey}
            onChange={(e) => setIntegrations(prev => ({ ...prev, stripeKey: e.target.value }))}
            icon={Key}
          />
        )}
      </div>

      {/* Twilio */}
      <div className="p-4 border border-secondary-200 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="font-medium text-secondary-900">Twilio</p>
              <p className="text-sm text-secondary-500">SMS notifications</p>
            </div>
          </div>
          <button
            onClick={() => setIntegrations(prev => ({ ...prev, twilioEnabled: !prev.twilioEnabled }))}
            className={`w-12 h-6 rounded-full transition-colors ${
              integrations.twilioEnabled ? 'bg-primary-500' : 'bg-secondary-300'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
              integrations.twilioEnabled ? 'translate-x-6' : 'translate-x-0.5'
            }`} />
          </button>
        </div>
        {integrations.twilioEnabled && (
          <Input
            label="Account SID"
            value={integrations.twilioSid}
            onChange={(e) => setIntegrations(prev => ({ ...prev, twilioSid: e.target.value }))}
            placeholder="Enter Twilio Account SID"
          />
        )}
      </div>

      {/* SendGrid */}
      <div className="p-4 border border-secondary-200 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-secondary-900">SendGrid</p>
              <p className="text-sm text-secondary-500">Email service</p>
            </div>
          </div>
          <button
            onClick={() => setIntegrations(prev => ({ ...prev, sendgridEnabled: !prev.sendgridEnabled }))}
            className={`w-12 h-6 rounded-full transition-colors ${
              integrations.sendgridEnabled ? 'bg-primary-500' : 'bg-secondary-300'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
              integrations.sendgridEnabled ? 'translate-x-6' : 'translate-x-0.5'
            }`} />
          </button>
        </div>
        {integrations.sendgridEnabled && (
          <Input
            label="API Key"
            value={integrations.sendgridKey}
            onChange={(e) => setIntegrations(prev => ({ ...prev, sendgridKey: e.target.value }))}
            icon={Key}
          />
        )}
      </div>

      {/* Google Maps */}
      <div className="p-4 border border-secondary-200 rounded-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Globe className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="font-medium text-secondary-900">Google Maps</p>
            <p className="text-sm text-secondary-500">Location services</p>
          </div>
        </div>
        <Input
          label="API Key"
          value={integrations.googleMapsKey}
          onChange={(e) => setIntegrations(prev => ({ ...prev, googleMapsKey: e.target.value }))}
          icon={Key}
        />
      </div>

      <div className="flex justify-end">
        <Button icon={Save} onClick={() => handleSave('Integration')} loading={loading}>
          Save Changes
        </Button>
      </div>
    </div>
  );

  const renderDatabaseSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">Database Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="font-medium text-green-800">Connected</span>
            </div>
            <p className="text-sm text-green-700">Primary Database</p>
          </div>
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="font-medium text-green-800">Synced</span>
            </div>
            <p className="text-sm text-green-700">Replica Database</p>
          </div>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-5 h-5 text-blue-500" />
              <span className="font-medium text-blue-800">256 MB</span>
            </div>
            <p className="text-sm text-blue-700">Cache Size</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">Maintenance Actions</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-xl">
            <div>
              <p className="font-medium text-secondary-900">Clear Cache</p>
              <p className="text-sm text-secondary-500">Remove all cached data</p>
            </div>
            <Button variant="outline" size="sm" icon={RefreshCw} onClick={handleClearCache} loading={loading}>
              Clear Cache
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-xl">
            <div>
              <p className="font-medium text-secondary-900">Backup Database</p>
              <p className="text-sm text-secondary-500">Last backup: 2 hours ago</p>
            </div>
            <Button variant="outline" size="sm" icon={Database}>
              Create Backup
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-xl">
            <div>
              <p className="font-medium text-red-900">Reset Demo Data</p>
              <p className="text-sm text-red-700">Restore all data to default state</p>
            </div>
            <Button variant="danger" size="sm" onClick={() => setShowResetModal(true)}>
              Reset Data
            </Button>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Users', value: '3,456' },
            { label: 'Stations', value: '165' },
            { label: 'Sessions', value: '45,678' },
            { label: 'Transactions', value: '89,234' },
          ].map((stat) => (
            <div key={stat.label} className="p-4 bg-secondary-50 rounded-xl text-center">
              <p className="text-2xl font-bold text-secondary-900">{stat.value}</p>
              <p className="text-sm text-secondary-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralSettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'security':
        return renderSecuritySettings();
      case 'integrations':
        return renderIntegrationSettings();
      case 'database':
        return renderDatabaseSettings();
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">System Settings</h1>
        <p className="text-secondary-500 mt-1">Configure platform settings and preferences</p>
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

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Reset Demo Data"
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Warning</p>
                <p className="text-sm text-red-700 mt-1">
                  This will reset all data to the default demo state. This action cannot be undone.
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setShowResetModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={() => {
                showToast({ type: 'success', message: 'Demo data reset successfully!' });
                setShowResetModal(false);
              }}
            >
              Reset Data
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Settings;
