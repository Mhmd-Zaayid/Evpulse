import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useNotifications } from '../../context';
import { historyAPI, sessionsAPI, bookingsAPI, notificationsAPI } from '../../services';
import { formatCurrency, formatDate, formatDuration, formatEnergy, formatRelativeTime } from '../../utils';
import { Button, Badge, LoadingSpinner } from '../../components';
import {
  Zap,
  MapPin,
  Calendar,
  Clock,
  Battery,
  TrendingUp,
  ChevronRight,
  Bell,
  CreditCard,
  History,
  Navigation,
  Star,
  AlertCircle,
  CheckCircle,
  Leaf,
  Car,
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user?.id]);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, activeRes, bookingsRes, historyRes, notifRes] = await Promise.all([
        historyAPI.getStats(user?.id),
        sessionsAPI.getActive(user?.id),
        bookingsAPI.getByUser(user?.id),
        historyAPI.getByUser(user?.id),
        notificationsAPI.getByUser(user?.id),
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (activeRes.success) setActiveSession(activeRes.data);
      if (bookingsRes.success) setUpcomingBookings(bookingsRes.data.filter(b => b.status === 'confirmed'));
      if (historyRes.success) setRecentSessions(historyRes.data.slice(0, 3));
      if (notifRes.success) setNotifications(notifRes.data.filter(n => !n.read).slice(0, 4));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'booking_confirmed':
        return <Calendar className="w-5 h-5 text-green-500" />;
      case 'charging_complete':
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case 'payment_success':
        return <CreditCard className="w-5 h-5 text-purple-500" />;
      case 'reminder':
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      default:
        return <Bell className="w-5 h-5 text-secondary-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 ml-4">
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-secondary-500 mt-1">
            Here's your EV charging overview
          </p>
        </div>
        <Button icon={MapPin} onClick={() => navigate('/user/stations')}>
          Find Stations
        </Button>
      </div>

      {/* Active Charging Session Alert */}
      {activeSession && (
        <div className="bg-gradient-to-r from-primary-500 to-green-500 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <Zap className="w-8 h-8" />
              </div>
              <div>
                <p className="text-white/80 text-sm">Currently Charging</p>
                <h2 className="text-xl font-bold">GreenCharge Hub - Port #2</h2>
                <div className="flex items-center gap-4 mt-2">
                  <span className="flex items-center gap-1">
                    <Battery className="w-4 h-4" />
                    {activeSession.progress || 68}% Complete
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    ~12 min remaining
                  </span>
                </div>
              </div>
            </div>
            <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
              View Session
            </Button>
          </div>
          <div className="mt-4">
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${activeSession.progress || 68}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl shadow-lg shadow-green-500/10 hover:shadow-xl hover:shadow-green-500/20 p-5 border border-green-500/20 bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 transition-all duration-300 hover:scale-[1.02]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-green-300 shadow-lg shadow-emerald-500/30 flex items-center justify-center">
              <Zap className="w-6 h-6 text-green-900" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-100/80 drop-shadow-sm">Total Energy</p>
              <p className="text-xl font-bold text-white drop-shadow-md">
                {stats ? formatEnergy(stats.totalEnergy) : '0 kWh'}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-sm text-emerald-200 drop-shadow-sm">
            <TrendingUp className="w-4 h-4" />
            <span>+12% this month</span>
          </div>
        </div>

        <div className="rounded-2xl shadow-lg shadow-green-500/10 hover:shadow-xl hover:shadow-green-500/20 p-5 border border-green-500/20 bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 transition-all duration-300 hover:scale-[1.02]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-green-300 shadow-lg shadow-emerald-500/30 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-green-900" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-100/80 drop-shadow-sm">Total Spent</p>
              <p className="text-xl font-bold text-white drop-shadow-md">
                {stats ? formatCurrency(stats.totalCost) : formatCurrency(0)}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-sm text-emerald-100/70 drop-shadow-sm">
            <span>{stats?.totalSessions || 0} charging sessions</span>
          </div>
        </div>

        <div className="rounded-2xl shadow-lg shadow-green-500/10 hover:shadow-xl hover:shadow-green-500/20 p-5 border border-green-500/20 bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 transition-all duration-300 hover:scale-[1.02]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-green-300 shadow-lg shadow-emerald-500/30 flex items-center justify-center">
              <Leaf className="w-6 h-6 text-green-900" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-100/80 drop-shadow-sm">CO₂ Saved</p>
              <p className="text-xl font-bold text-white drop-shadow-md">
                {stats ? `${stats.co2Saved} kg` : '0 kg'}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-sm text-emerald-200 drop-shadow-sm">
            <span>🌱 Great for the planet!</span>
          </div>
        </div>

        <div className="rounded-2xl shadow-lg shadow-green-500/10 hover:shadow-xl hover:shadow-green-500/20 p-5 border border-green-500/20 bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 transition-all duration-300 hover:scale-[1.02]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-green-300 shadow-lg shadow-emerald-500/30 flex items-center justify-center">
              <Clock className="w-6 h-6 text-green-900" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-100/80 drop-shadow-sm">Avg. Session</p>
              <p className="text-xl font-bold text-white drop-shadow-md">
                {stats ? formatDuration(stats.avgSessionDuration) : '0 min'}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-sm text-emerald-100/70 drop-shadow-sm">
            <span>Per charging session</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vehicle Info Card */}
          {user?.vehicle && (
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-secondary-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-secondary-900">Your Vehicle</h2>
                <Button variant="outline" size="sm" onClick={() => navigate('/user/settings')}>
                  Edit
                </Button>
              </div>
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-secondary-100 rounded-2xl flex items-center justify-center">
                  <Car className="w-10 h-10 text-secondary-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-secondary-900">
                    {user.vehicle.make} {user.vehicle.model}
                  </h3>
                  <div className="flex items-center gap-6 mt-2 text-sm text-secondary-500">
                    <span className="flex items-center gap-1">
                      <Battery className="w-4 h-4" />
                      {user.vehicle.batteryCapacity} kWh Battery
                    </span>
                    <span className="flex items-center gap-1">
                      <Navigation className="w-4 h-4" />
                      {user.vehicle.range} km Range
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Upcoming Bookings */}
          <div className="bg-white rounded-2xl shadow-sm border border-secondary-100 overflow-hidden">
            <div className="p-6 border-b border-secondary-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-secondary-900">Upcoming Bookings</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/user/bookings')}>
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            {upcomingBookings.length > 0 ? (
              <div className="divide-y divide-secondary-100">
                {upcomingBookings.map((booking) => (
                  <div key={booking.id} className="p-4 hover:bg-secondary-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                          <Calendar className="w-6 h-6 text-primary-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-secondary-900">
                            Station #{booking.stationId}
                          </h3>
                          <p className="text-sm text-secondary-500">
                            {formatDate(booking.date)} • {booking.timeSlot}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="success">{booking.status}</Badge>
                        <p className="text-sm text-secondary-500 mt-1">
                          {booking.chargingType}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Calendar className="w-12 h-12 text-secondary-300 mx-auto mb-3" />
                <p className="text-secondary-500">No upcoming bookings</p>
                <Button variant="outline" className="mt-4" onClick={() => navigate('/user/stations')}>
                  Book a Charging Slot
                </Button>
              </div>
            )}
          </div>

          {/* Recent Sessions */}
          <div className="bg-white rounded-2xl shadow-sm border border-secondary-100 overflow-hidden">
            <div className="p-6 border-b border-secondary-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-secondary-900">Recent Sessions</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/user/history')}>
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            {recentSessions.length > 0 ? (
              <div className="divide-y divide-secondary-100">
                {recentSessions.map((session) => (
                  <div key={session.id} className="p-4 hover:bg-secondary-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          session.chargingType === 'Fast DC' ? 'bg-amber-100' : 'bg-blue-100'
                        }`}>
                          <Zap className={`w-6 h-6 ${
                            session.chargingType === 'Fast DC' ? 'text-amber-600' : 'text-blue-600'
                          }`} />
                        </div>
                        <div>
                          <h3 className="font-medium text-secondary-900">{session.stationName}</h3>
                          <p className="text-sm text-secondary-500">
                            {formatDate(session.date)} • {formatDuration(session.duration)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary-600">{formatCurrency(session.cost)}</p>
                        <p className="text-sm text-secondary-500">{session.energyConsumed} kWh</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <History className="w-12 h-12 text-secondary-300 mx-auto mb-3" />
                <p className="text-secondary-500">No charging history yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Notifications */}
          <div className="bg-white rounded-2xl shadow-sm border border-secondary-100 overflow-hidden">
            <div className="p-4 border-b border-secondary-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-secondary-900">Notifications</h2>
              {notifications.length > 0 && (
                <Badge variant="danger">{notifications.length}</Badge>
              )}
            </div>
            {notifications.length > 0 ? (
              <div className="divide-y divide-secondary-100">
                {notifications.map((notif) => (
                  <div key={notif.id} className="p-4 hover:bg-secondary-50 transition-colors cursor-pointer">
                    <div className="flex gap-3">
                      {getNotificationIcon(notif.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-secondary-900">{notif.title}</p>
                        <p className="text-xs text-secondary-500 truncate mt-0.5">
                          {notif.message}
                        </p>
                        <p className="text-xs text-secondary-400 mt-1">
                          {formatRelativeTime(notif.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center">
                <Bell className="w-10 h-10 text-secondary-300 mx-auto mb-2" />
                <p className="text-sm text-secondary-500">No new notifications</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-secondary-100">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button 
                onClick={() => navigate('/user/stations')}
                className="w-full flex items-center gap-3 p-3 bg-secondary-50 rounded-xl hover:bg-secondary-100 transition-colors"
              >
                <MapPin className="w-5 h-5 text-primary-500" />
                <span className="text-secondary-700">Find Nearby Stations</span>
              </button>
              <button 
                onClick={() => navigate('/user/bookings')}
                className="w-full flex items-center gap-3 p-3 bg-secondary-50 rounded-xl hover:bg-secondary-100 transition-colors"
              >
                <Calendar className="w-5 h-5 text-primary-500" />
                <span className="text-secondary-700">My Bookings</span>
              </button>
              <button 
                onClick={() => navigate('/user/history')}
                className="w-full flex items-center gap-3 p-3 bg-secondary-50 rounded-xl hover:bg-secondary-100 transition-colors"
              >
                <History className="w-5 h-5 text-primary-500" />
                <span className="text-secondary-700">Charging History</span>
              </button>
              <button 
                onClick={() => navigate('/user/payments')}
                className="w-full flex items-center gap-3 p-3 bg-secondary-50 rounded-xl hover:bg-secondary-100 transition-colors"
              >
                <CreditCard className="w-5 h-5 text-primary-500" />
                <span className="text-secondary-700">Payment Methods</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
