import { useState, useRef, useEffect } from 'react';
import { useAuth, useNotifications } from '../../context';
import { formatRelativeTime } from '../../utils';
import {
  Bell,
  Search,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Check,
  X,
  Info,
  AlertTriangle,
  CheckCircle,
  Menu,
  Sparkles,
  Command,
  Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  
  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const getStationsPathByRole = (role) => {
    if (role === 'admin') return '/admin/stations';
    if (role === 'operator') return '/operator/stations';
    return '/user/stations';
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) {
      return;
    }

    const stationsPath = getStationsPathByRole(user?.role);
    navigate(`${stationsPath}?city=${encodeURIComponent(trimmedQuery)}`);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'error':
        return <X className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getRoleBadge = () => {
    const badges = {
      admin: { bg: 'bg-gradient-to-r from-red-500 to-rose-500', label: 'Admin' },
      operator: { bg: 'bg-gradient-to-r from-amber-500 to-orange-500', label: 'Operator' },
      user: { bg: 'bg-gradient-to-r from-primary-500 to-green-500', label: 'EV Owner' },
    };
    return badges[user?.role] || badges.user;
  };

  const badge = getRoleBadge();

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-secondary-100/80">
      <div className="flex items-center justify-between px-4 lg:px-6 h-16">
        {/* Left Section - Mobile Menu & Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2.5 hover:bg-secondary-100 rounded-xl transition-all duration-200 active:scale-95"
          >
            <Menu className="w-5 h-5 text-secondary-600" />
          </button>
          
          {/* Page Title - Mobile */}
          <div className="lg:hidden flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-green-500 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-secondary-900">EVPulse</span>
          </div>
        </div>

        {/* Search Bar - Center */}
        <div className="hidden md:flex items-center flex-1 max-w-xl mx-8">
          <form
            onSubmit={handleSearchSubmit}
            className={`relative w-full transition-all duration-300 ${searchFocused ? 'scale-[1.02]' : ''}`}
          >
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${searchFocused ? 'text-primary-500' : 'text-secondary-400'}`} />
            <input
              type="text"
              placeholder="Search charging stations by city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className={`w-full pl-12 pr-20 py-3 bg-secondary-50/80 border rounded-2xl outline-none transition-all duration-200 ${
                searchFocused 
                  ? 'border-primary-500 ring-4 ring-primary-500/10 bg-white shadow-lg' 
                  : 'border-secondary-200 hover:border-secondary-300'
              }`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-1 bg-secondary-200/60 rounded-lg">
              <Command className="w-3 h-3 text-secondary-500" />
              <span className="text-xs text-secondary-500 font-medium">K</span>
            </div>
          </form>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Mobile Search Button */}
          <button className="md:hidden p-2.5 hover:bg-secondary-100 rounded-xl transition-colors">
            <Search className="w-5 h-5 text-secondary-600" />
          </button>

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`relative p-2.5 rounded-xl transition-all duration-200 ${
                showNotifications ? 'bg-primary-50 text-primary-600' : 'hover:bg-secondary-100 text-secondary-600'
              }`}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 px-1.5 bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg shadow-red-500/30 animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-secondary-100 overflow-hidden animate-fade-in">
                <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-secondary-50 to-white border-b border-secondary-100">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <Bell className="w-4 h-4 text-primary-600" />
                    </div>
                    <h3 className="font-semibold text-secondary-900">Notifications</h3>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.slice(0, 5).map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => markAsRead(notification.id)}
                        className={`flex gap-4 px-5 py-4 hover:bg-secondary-50 cursor-pointer transition-all duration-200 border-b border-secondary-50 last:border-0 ${
                          !notification.read ? 'bg-primary-50/30' : ''
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          notification.type === 'success' ? 'bg-green-100' :
                          notification.type === 'warning' ? 'bg-amber-100' :
                          notification.type === 'error' ? 'bg-red-100' : 'bg-blue-100'
                        }`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-secondary-900">
                            {notification.title}
                          </p>
                          <p className="text-sm text-secondary-500 mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-secondary-400 mt-2">
                            {formatRelativeTime(notification.timestamp)}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2.5 h-2.5 bg-primary-500 rounded-full mt-1.5 flex-shrink-0 animate-pulse" />
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="px-5 py-12 text-center">
                      <div className="w-16 h-16 bg-secondary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Bell className="w-8 h-8 text-secondary-300" />
                      </div>
                      <p className="text-secondary-500 font-medium">All caught up!</p>
                      <p className="text-sm text-secondary-400 mt-1">No new notifications</p>
                    </div>
                  )}
                </div>
                <div className="px-5 py-3 bg-secondary-50/50 border-t border-secondary-100">
                  <button className="w-full py-2 text-sm text-primary-600 hover:text-primary-700 font-semibold hover:bg-primary-50 rounded-xl transition-colors">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px h-8 bg-secondary-200 mx-2" />

          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfile(!showProfile)}
              className={`flex items-center gap-3 p-1.5 pr-3 rounded-2xl transition-all duration-200 ${
                showProfile ? 'bg-secondary-100' : 'hover:bg-secondary-50'
              }`}
            >
              <div className={`w-10 h-10 ${badge.bg} rounded-xl flex items-center justify-center shadow-md`}>
                <span className="text-white font-bold text-sm">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-secondary-900">{user?.name}</p>
                <p className="text-xs text-secondary-500">{badge.label}</p>
              </div>
              <ChevronDown className={`hidden md:block w-4 h-4 text-secondary-400 transition-transform duration-200 ${showProfile ? 'rotate-180' : ''}`} />
            </button>

            {/* Profile Dropdown Menu */}
            {showProfile && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-secondary-100 overflow-hidden animate-fade-in">
                <div className="p-4 bg-gradient-to-r from-secondary-50 to-white border-b border-secondary-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 ${badge.bg} rounded-xl flex items-center justify-center shadow-md`}>
                      <span className="text-white font-bold">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-secondary-900 truncate">{user?.name}</p>
                      <p className="text-xs text-secondary-500 truncate">{user?.email}</p>
                    </div>
                  </div>
                </div>
                <div className="p-2">
                  <button
                    onClick={() => {
                      setShowProfile(false);
                      navigate(`/${user?.role}/settings`);
                    }}
                    className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-secondary-700 hover:bg-secondary-50 rounded-xl transition-colors"
                  >
                    <div className="p-2 bg-secondary-100 rounded-lg">
                      <User className="w-4 h-4 text-secondary-600" />
                    </div>
                    <span className="font-medium">My Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowProfile(false);
                      navigate(`/${user?.role}/settings`);
                    }}
                    className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-secondary-700 hover:bg-secondary-50 rounded-xl transition-colors"
                  >
                    <div className="p-2 bg-secondary-100 rounded-lg">
                      <Settings className="w-4 h-4 text-secondary-600" />
                    </div>
                    <span className="font-medium">Settings</span>
                  </button>
                </div>
                <div className="p-2 border-t border-secondary-100">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <div className="p-2 bg-red-100 rounded-lg">
                      <LogOut className="w-4 h-4 text-red-500" />
                    </div>
                    <span className="font-medium">Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
