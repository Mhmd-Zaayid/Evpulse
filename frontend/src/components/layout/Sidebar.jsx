import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context';
import {
  LayoutDashboard,
  MapPin,
  Calendar,
  CreditCard,
  Settings,
  LogOut,
  Zap,
  Building2,
  Users,
  BarChart3,
  Wrench,
  FileText,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  X,
} from 'lucide-react';
import { useState } from 'react';

const Sidebar = ({ mobileOpen, onMobileClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const userLinks = [
    { to: '/user/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/user/stations', icon: MapPin, label: 'Find Stations' },
    { to: '/user/bookings', icon: Calendar, label: 'My Bookings' },
    { to: '/user/history', icon: Zap, label: 'Charging History' },
    { to: '/user/payments', icon: CreditCard, label: 'Payments' },
    { to: '/user/settings', icon: Settings, label: 'Settings' },
  ];

  const operatorLinks = [
    { to: '/operator', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/operator/stations', icon: Building2, label: 'My Stations' },
    { to: '/operator/sessions', icon: Zap, label: 'Sessions' },
    { to: '/operator/feedback', icon: BarChart3, label: 'Feedback' },
    { to: '/operator/reports', icon: FileText, label: 'Reports' },
    { to: '/operator/settings', icon: Settings, label: 'Settings' },
  ];

  const adminLinks = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/users', icon: Users, label: 'Users' },
    { to: '/admin/stations', icon: MapPin, label: 'Stations' },
    { to: '/admin/feedback', icon: BarChart3, label: 'Feedback' },
    { to: '/admin/transactions', icon: CreditCard, label: 'Transactions' },
    { to: '/admin/reports', icon: FileText, label: 'Reports' },
    { to: '/admin/settings', icon: Settings, label: 'Settings' },
  ];

  const getLinks = () => {
    switch (user?.role) {
      case 'operator':
        return operatorLinks;
      case 'admin':
        return adminLinks;
      default:
        return userLinks;
    }
  };

  const links = getLinks();

  const getRoleBadge = () => {
    const badges = {
      admin: { bg: 'bg-red-100', text: 'text-red-700', label: 'Admin' },
      operator: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Operator' },
      user: { bg: 'bg-primary-100', text: 'text-primary-700', label: 'EV Owner' },
    };
    return badges[user?.role] || badges.user;
  };

  const badge = getRoleBadge();

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-secondary-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen border-r border-secondary-100 transition-all duration-300 ease-in-out z-50 flex flex-col shadow-xl lg:shadow-none ${
          collapsed ? 'lg:w-20' : 'lg:w-72'
        } ${mobileOpen ? 'w-72 translate-x-0' : 'w-72 -translate-x-full lg:translate-x-0'}`}
        style={{ backgroundColor: '#abf7b1' }}
      >
        {/* Logo Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-secondary-100" style={{ backgroundColor: '#abf7b1' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-green-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25 ring-2 ring-primary-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <span className="text-xl font-bold text-secondary-900 tracking-tight">
                EV<span className="text-primary-500">Pulse</span>
              </span>
            )}
          </div>
          
          {/* Mobile Close Button */}
          <button 
            onClick={onMobileClose}
            className="lg:hidden p-2 hover:bg-secondary-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-secondary-500" />
          </button>
        </div>

        {/* User Info Card */}
        {!collapsed && (
          <div className="mx-4 mt-4 p-4 bg-gradient-to-br from-secondary-50 to-secondary-100/50 rounded-2xl border border-secondary-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-secondary-900 truncate">
                  {user?.name || 'User'}
                </p>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                  {badge.label}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Collapsed User Avatar */}
        {collapsed && (
          <div className="mx-auto mt-4">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white font-bold">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-secondary-200 scrollbar-track-transparent">
          {!collapsed && (
            <p className="px-3 py-2 text-xs font-semibold text-secondary-400 uppercase tracking-wider">
              Navigation
            </p>
          )}
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onMobileClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 shadow-sm'
                    : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
                } ${collapsed ? 'justify-center' : ''}`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-2 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-primary-500 text-white shadow-md shadow-primary-500/30' 
                      : 'bg-secondary-100 text-secondary-500 group-hover:bg-secondary-200 group-hover:text-secondary-700'
                  }`}>
                    <link.icon className="w-4 h-4" />
                  </div>
                  {!collapsed && <span>{link.label}</span>}
                  {isActive && !collapsed && (
                    <div className="ml-auto w-1.5 h-1.5 bg-primary-500 rounded-full" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="p-3 border-t border-secondary-100 space-y-2" style={{ backgroundColor: '#abf7b1' }}>
          {/* Help Link */}
          {!collapsed && (
            <NavLink 
              to={user?.role === 'user' ? '/user/help' : user?.role === 'operator' ? '/operator/help' : '/admin/help'}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900 transition-colors group"
            >
              <div className="p-2 rounded-lg bg-secondary-100 text-secondary-500 group-hover:bg-secondary-200 group-hover:text-secondary-700 transition-colors">
                <HelpCircle className="w-4 h-4" />
              </div>
              <span className="font-medium">Help & Support</span>
            </NavLink>
          )}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-colors group ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <div className="p-2 rounded-lg bg-red-100 text-red-500 group-hover:bg-red-200 group-hover:text-red-600 transition-colors">
              <LogOut className="w-4 h-4" />
            </div>
            {!collapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>

        {/* Collapse Toggle - Desktop Only */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 border border-secondary-200 rounded-full items-center justify-center shadow-md hover:shadow-lg hover:scale-110 transition-all duration-200"
          style={{ backgroundColor: '#abf7b1' }}
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5 text-secondary-600" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5 text-secondary-600" />
          )}
        </button>
      </aside>
    </>
  );
};

export default Sidebar;
