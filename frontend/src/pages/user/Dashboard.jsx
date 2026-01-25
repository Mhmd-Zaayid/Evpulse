import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useNotifications } from '../../context';
import { stationsAPI, sessionsAPI } from '../../services';
import { formatCurrency, formatEnergy, formatDuration, formatDate } from '../../utils';
import { StatCard, StationCard, ProgressBar, Button, Badge } from '../../components';
import {
  MapPin,
  Zap,
  DollarSign,
  Battery,
  Clock,
  ChevronRight,
  Play,
  Square,
  Navigation,
} from 'lucide-react';

const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useNotifications();
  
  const [nearbyStations, setNearbyStations] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [stationsRes, sessionRes, historyRes] = await Promise.all([
        stationsAPI.getAll({ sortBy: 'distance', maxDistance: 10 }),
        sessionsAPI.getActive(user.id),
        sessionsAPI.getByUser(user.id),
      ]);
      
      setNearbyStations(stationsRes.data.slice(0, 3));
      setActiveSession(sessionRes.data);
      setRecentActivity(historyRes.data.filter(s => s.status === 'completed').slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Simulate charging progress
  useEffect(() => {
    if (activeSession?.status === 'active') {
      const interval = setInterval(() => {
        setActiveSession(prev => {
          if (!prev || prev.progress >= 100) {
            clearInterval(interval);
            return prev;
          }
          return { ...prev, progress: Math.min(prev.progress + 1, 100) };
        });
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [activeSession?.status]);

  const handleStopCharging = () => {
    showToast({ type: 'success', message: 'Charging session stopped successfully!' });
    setActiveSession(prev => ({ ...prev, status: 'completed', progress: 100 }));
  };

  // Calculate user stats
  const stats = {
    nearbyStations: nearbyStations.length,
    totalEnergy: recentActivity.reduce((sum, s) => sum + (s.energyDelivered || 0), 0),
    totalCost: recentActivity.reduce((sum, s) => sum + (s.cost || 0), 0),
    totalSessions: recentActivity.length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">
          Welcome back, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-secondary-500 mt-1">Here's your charging overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Nearby Stations"
          value={stats.nearbyStations}
          icon={MapPin}
          iconColor="bg-blue-100 text-blue-600"
        />
        <StatCard
          title="Active Session"
          value={activeSession ? '1' : '0'}
          icon={Zap}
          iconColor="bg-green-100 text-green-600"
        />
        <StatCard
          title="Energy Used"
          value={formatEnergy(stats.totalEnergy)}
          icon={Battery}
          iconColor="bg-amber-100 text-amber-600"
          trend="up"
          trendValue={12.5}
        />
        <StatCard
          title="Total Spent"
          value={formatCurrency(stats.totalCost)}
          icon={DollarSign}
          iconColor="bg-purple-100 text-purple-600"
        />
      </div>

      {/* Active Session Card */}
      {activeSession && activeSession.status === 'active' && (
        <div className="card bg-gradient-to-br from-primary-500 to-primary-600 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-sm font-medium text-primary-100">Charging in Progress</span>
              </div>
              <h3 className="text-xl font-semibold mb-1">GreenCharge Hub</h3>
              <p className="text-primary-100 text-sm mb-4">Port #2 • Fast DC 150kW</p>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-primary-100 text-xs">Energy Delivered</p>
                  <p className="text-lg font-semibold">{formatEnergy(activeSession.energyDelivered)}</p>
                </div>
                <div>
                  <p className="text-primary-100 text-xs">Time Elapsed</p>
                  <p className="text-lg font-semibold">{formatDuration(45)}</p>
                </div>
                <div>
                  <p className="text-primary-100 text-xs">Est. Cost</p>
                  <p className="text-lg font-semibold">{formatCurrency(activeSession.energyDelivered * 0.35)}</p>
                </div>
              </div>
            </div>

            <div className="lg:w-64">
              <div className="text-center mb-3">
                <span className="text-4xl font-bold">{activeSession.progress}%</span>
              </div>
              <ProgressBar 
                value={activeSession.progress} 
                size="lg" 
                color="success"
                animated
              />
              <p className="text-center text-primary-100 text-sm mt-2">
                Est. completion: 15 mins
              </p>
              <Button
                variant="secondary"
                fullWidth
                icon={Square}
                onClick={handleStopCharging}
                className="mt-4"
              >
                Stop Charging
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Section */}
        <div className="lg:col-span-2">
          <div className="card h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-secondary-900">Nearby Stations</h2>
              <Button 
                variant="ghost" 
                size="sm"
                icon={ChevronRight}
                iconPosition="right"
                onClick={() => navigate('/user/stations')}
              >
                View All
              </Button>
            </div>
            
            {/* Map Placeholder */}
            <div className="relative h-64 bg-secondary-100 rounded-xl overflow-hidden mb-4">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Navigation className="w-12 h-12 text-secondary-400 mx-auto mb-2" />
                  <p className="text-secondary-500">Interactive Map</p>
                  <p className="text-sm text-secondary-400">Showing stations within 10km</p>
                </div>
              </div>
              {/* Map markers placeholder */}
              <div className="absolute top-1/3 left-1/4 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center shadow-lg shadow-primary-500/30 animate-pulse">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div className="absolute top-1/2 left-1/2 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center shadow-lg shadow-primary-500/30">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div className="absolute bottom-1/3 right-1/4 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Zap className="w-4 h-4 text-white" />
              </div>
            </div>

            {/* Station List */}
            <div className="space-y-3">
              {nearbyStations.map((station) => (
                <StationCard 
                  key={station.id} 
                  station={station} 
                  compact
                  onClick={() => navigate(`/user/stations/${station.id}`)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-1">
          <div className="card h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-secondary-900">Recent Activity</h2>
              <Button 
                variant="ghost" 
                size="sm"
                icon={ChevronRight}
                iconPosition="right"
                onClick={() => navigate('/user/payments')}
              >
                View All
              </Button>
            </div>

            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((session) => (
                  <div 
                    key={session.id}
                    className="flex items-center gap-3 p-3 bg-secondary-50 rounded-xl"
                  >
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <Zap className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-secondary-900 truncate">
                        {session.chargingType} Charging
                      </p>
                      <p className="text-xs text-secondary-500">
                        {formatDate(session.startTime)} • {formatEnergy(session.energyDelivered)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-secondary-900">
                      {formatCurrency(session.cost)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-secondary-500">
                  <Zap className="w-12 h-12 mx-auto text-secondary-300 mb-2" />
                  <p>No charging history yet</p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="mt-6 pt-6 border-t border-secondary-100">
              <h3 className="text-sm font-medium text-secondary-700 mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/user/stations')}
                >
                  Find Station
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/user/bookings')}
                >
                  My Bookings
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
