import { useState, useRef } from 'react';
import { useAuth, useNotifications } from '../../context';
import { Button, Input } from '../../components';
import { User, Mail, Phone, Car, Bell, Shield, Save, Camera, X } from 'lucide-react';

const Settings = () => {
  const { user, updateUser } = useAuth();
  const { showToast } = useNotifications();
  const fileInputRef = useRef(null);
  
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(user?.profileImage || null);
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    vehicleMake: user?.vehicle?.make || '',
    vehicleModel: user?.vehicle?.model || '',
    batteryCapacity: user?.vehicle?.batteryCapacity || '',
  });

  const [notifications, setNotifications] = useState({
    chargingComplete: true,
    bookingReminder: true,
    promotions: false,
    maintenance: true,
    priceAlerts: true,
  });

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showToast({ type: 'error', message: 'Please select an image file' });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast({ type: 'error', message: 'Image size should be less than 5MB' });
        return;
      }
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfileImage(event.target?.result);
        showToast({ type: 'success', message: 'Profile image updated!' });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    showToast({ type: 'info', message: 'Profile image removed' });
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      updateUser({
        name: profileData.name,
        phone: profileData.phone,
        profileImage: profileImage,
        vehicle: {
          make: profileData.vehicleMake,
          model: profileData.vehicleModel,
          batteryCapacity: parseInt(profileData.batteryCapacity),
        },
      });
      showToast({ type: 'success', message: 'Profile updated successfully!' });
    } catch (error) {
      showToast({ type: 'error', message: 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationChange = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Settings</h1>
        <p className="text-secondary-500 mt-1">Manage your account preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="card p-2">
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

        {/* Content */}
        <div className="lg:col-span-3">
          {activeTab === 'profile' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-secondary-900 mb-6">Profile Information</h2>
              
              {/* Avatar */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-secondary-100">
                <div className="relative group">
                  {profileImage ? (
                    <img 
                      src={profileImage} 
                      alt="Profile" 
                      className="w-20 h-20 rounded-full object-cover ring-4 ring-primary-100"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary-700">
                        {user?.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="profile-image-upload"
                  />
                  <label 
                    htmlFor="profile-image-upload"
                    className="absolute bottom-0 right-0 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-primary-600 transition-colors cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                  </label>
                  {profileImage && (
                    <button 
                      onClick={handleRemoveImage}
                      className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div>
                  <p className="font-medium text-secondary-900">{user?.name}</p>
                  <p className="text-sm text-secondary-500">{user?.email}</p>
                  <p className="text-xs text-secondary-400 mt-1">Click camera icon to upload photo</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  name="name"
                  value={profileData.name}
                  onChange={handleProfileChange}
                  icon={User}
                />
                <Input
                  label="Email"
                  name="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  icon={Mail}
                  disabled
                />
                <Input
                  label="Phone Number"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleProfileChange}
                  icon={Phone}
                />
              </div>

              {/* Vehicle Information */}
              <h3 className="text-md font-semibold text-secondary-900 mt-8 mb-4">Vehicle Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Vehicle Make"
                  name="vehicleMake"
                  placeholder="e.g., Tesla"
                  value={profileData.vehicleMake}
                  onChange={handleProfileChange}
                  icon={Car}
                />
                <Input
                  label="Vehicle Model"
                  name="vehicleModel"
                  placeholder="e.g., Model 3"
                  value={profileData.vehicleModel}
                  onChange={handleProfileChange}
                />
                <Input
                  label="Battery Capacity (kWh)"
                  name="batteryCapacity"
                  type="number"
                  placeholder="e.g., 75"
                  value={profileData.batteryCapacity}
                  onChange={handleProfileChange}
                />
              </div>

              <div className="flex justify-end mt-6 pt-6 border-t border-secondary-100">
                <Button icon={Save} onClick={handleSaveProfile} loading={loading}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-secondary-900 mb-6">Notification Preferences</h2>
              
              <div className="space-y-4">
                {[
                  { key: 'chargingComplete', label: 'Charging Complete', desc: 'Get notified when your vehicle is fully charged' },
                  { key: 'bookingReminder', label: 'Booking Reminders', desc: 'Receive reminders before your scheduled charging slot' },
                  { key: 'maintenance', label: 'Maintenance Alerts', desc: 'Get notified about station maintenance and outages' },
                  { key: 'priceAlerts', label: 'Price Alerts', desc: 'Receive alerts about pricing changes and peak hours' },
                  { key: 'promotions', label: 'Promotions & Offers', desc: 'Stay updated with special offers and discounts' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 bg-secondary-50 rounded-xl">
                    <div>
                      <p className="font-medium text-secondary-900">{item.label}</p>
                      <p className="text-sm text-secondary-500">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => handleNotificationChange(item.key)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        notifications[item.key] ? 'bg-primary-500' : 'bg-secondary-300'
                      }`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        notifications[item.key] ? 'translate-x-7' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-secondary-900 mb-6">Security Settings</h2>
              
              <div className="space-y-6">
                {/* Change Password */}
                <div className="p-4 border border-secondary-200 rounded-xl">
                  <h3 className="font-medium text-secondary-900 mb-4">Change Password</h3>
                  <div className="space-y-4">
                    <Input
                      label="Current Password"
                      type="password"
                      placeholder="Enter current password"
                    />
                    <Input
                      label="New Password"
                      type="password"
                      placeholder="Enter new password"
                    />
                    <Input
                      label="Confirm New Password"
                      type="password"
                      placeholder="Confirm new password"
                    />
                    <Button>Update Password</Button>
                  </div>
                </div>

                {/* Two-Factor Auth */}
                <div className="p-4 border border-secondary-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-secondary-900">Two-Factor Authentication</h3>
                      <p className="text-sm text-secondary-500 mt-1">Add an extra layer of security to your account</p>
                    </div>
                    <Button variant="outline">Enable</Button>
                  </div>
                </div>

                {/* Delete Account */}
                <div className="p-4 border border-red-200 bg-red-50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-red-700">Delete Account</h3>
                      <p className="text-sm text-red-600 mt-1">Permanently delete your account and all data</p>
                    </div>
                    <Button variant="danger">Delete</Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
