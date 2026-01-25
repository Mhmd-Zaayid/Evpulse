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
  Bell,
  Wrench,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userLinks = [
    { to: '/user/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/user/stations', icon: MapPin, label: 'Find Stations' },
    { to: '/user/bookings', icon: Calendar, label: 'My Bookings' },
    { to: '/user/payments', icon: CreditCard, label: 'Payments' },
    { to: '/user/settings', icon: Settings, label: 'Settings' },
  ];

  const operatorLinks = [
    { to: '/operator/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/operator/stations', icon: Building2, label: 'My Stations' },
    { to: '/operator/sessions', icon: Zap, label: 'Sessions' },
    { to: '/operator/maintenance', icon: Wrench, label: 'Maintenance' },
    { to: '/operator/reports', icon: FileText, label: 'Reports' },
    { to: '/operator/settings', icon: Settings, label: 'Settings' },
  ];

  const adminLinks = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/users', icon: Users, label: 'Users' },
    { to: '/admin/operators', icon: Building2, label: 'Operators' },
    { to: '/admin/stations', icon: MapPin, label: 'Stations' },
    { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/admin/notifications', icon: Bell, label: 'Notifications' },
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

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-white border-r border-secondary-200 transition-all duration-300 z-40 flex flex-col ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="p-6 border-b border-secondary-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
            <Zap className="w-6 h-6 text-white" />
          </div>
          {!collapsed && (
            <span className="text-xl font-bold text-secondary-900">
              EV<span className="text-primary-500">Pulse</span>
            </span>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              isActive ? 'sidebar-link-active' : 'sidebar-link'
            }
          >
            <link.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{link.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-secondary-100">
        {!collapsed && (
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center">
              <span className="text-primary-700 font-semibold">
                {user?.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-secondary-900 truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-secondary-500 capitalize">{user?.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-white border border-secondary-200 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow"
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4 text-secondary-600" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-secondary-600" />
        )}
      </button>
    </aside>
  );
};

export default Sidebar;
