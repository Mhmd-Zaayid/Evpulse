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
        className={`fixed left-0 top-0 h-screen border-r border-green-800/20 transition-all duration-300 ease-in-out z-50 flex flex-col shadow-2xl bg-gradient-to-b from-green-700 via-green-600 to-emerald-600 ${
          collapsed ? 'lg:w-20' : 'lg:w-72'
        } ${mobileOpen ? 'w-72 translate-x-0' : 'w-72 -translate-x-full lg:translate-x-0'}`}
      >
        {/* Logo Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/10 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-300 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30 ring-2 ring-white/30 hover:scale-110 transition-transform duration-200">
              <Zap className="w-5 h-5 text-green-900" />
            </div>
            {!collapsed && (
              <span className="text-xl font-bold text-white tracking-tight drop-shadow-lg">
                EV<span className="text-emerald-200">Pulse</span>
              </span>
            )}
          </div>
          
          {/* Mobile Close Button */}
          <button 
            onClick={onMobileClose}
            className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-all duration-200 hover:scale-105"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* User Info Card */}
        {!collapsed && (
          <div className="mx-4 mt-4 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 hover:bg-white/15 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-300 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30 ring-2 ring-white/30">
                <span className="text-green-900 font-bold text-lg">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate drop-shadow-md">
                  {user?.name || 'User'}
                </p>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-400/30 text-emerald-100 border border-emerald-400/30">
                  {badge.label}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Collapsed User Avatar */}
        {collapsed && (
          <div className="mx-auto mt-4">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-300 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30 ring-2 ring-white/30 hover:scale-110 transition-transform duration-200">
              <span className="text-green-900 font-bold">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
          {!collapsed && (
            <p className="px-3 py-2 text-xs font-semibold text-emerald-200/70 uppercase tracking-wider">
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
                    ? 'bg-emerald-400/25 text-white shadow-lg shadow-emerald-500/20 border border-emerald-400/30'
                    : 'text-white/80 hover:bg-white/10 hover:text-white hover:shadow-md'
                } ${collapsed ? 'justify-center' : ''}`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-2 rounded-lg transition-all duration-200 ${
                    isActive 
                      ? 'bg-gradient-to-br from-emerald-400 to-green-300 text-green-900 shadow-lg shadow-emerald-500/40 scale-105' 
                      : 'bg-white/10 text-white group-hover:bg-white/20 group-hover:scale-105'
                  }`}>
                    <link.icon className="w-4 h-4" />
                  </div>
                  {!collapsed && <span className="drop-shadow-md">{link.label}</span>}
                  {isActive && !collapsed && (
                    <div className="ml-auto w-2 h-2 bg-emerald-300 rounded-full shadow-lg shadow-emerald-500/50 animate-pulse" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="p-3 border-t border-white/10 space-y-2 backdrop-blur-sm">
          {/* Help Link */}
          {!collapsed && (
            <NavLink 
              to={user?.role === 'user' ? '/user/help' : user?.role === 'operator' ? '/operator/help' : '/admin/help'}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/80 hover:bg-white/10 hover:text-white transition-all duration-200 group hover:shadow-md"
            >
              <div className="p-2 rounded-lg bg-white/10 text-white group-hover:bg-white/20 group-hover:scale-105 transition-all duration-200">
                <HelpCircle className="w-4 h-4" />
              </div>
              <span className="font-medium drop-shadow-md">Help & Support</span>
            </NavLink>
          )}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-200 hover:bg-red-500/20 hover:text-white transition-all duration-200 group border border-transparent hover:border-red-400/30 hover:shadow-lg hover:shadow-red-500/20 ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <div className="p-2 rounded-lg bg-red-500/20 text-red-200 group-hover:bg-red-500/30 group-hover:text-white group-hover:scale-105 transition-all duration-200">
              <LogOut className="w-4 h-4" />
            </div>
            {!collapsed && <span className="font-medium drop-shadow-md">Logout</span>}
          </button>
        </div>

        {/* Collapse Toggle - Desktop Only */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute -right-3 top-20 w-7 h-7 border-2 border-white/30 rounded-full items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-white" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-white" />
          )}
        </button>
      </aside>
    </>
  );
};

export default Sidebar;
