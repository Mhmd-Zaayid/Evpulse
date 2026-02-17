import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context';
import { operatorAPI } from '../../services';
import { formatCurrency, formatEnergy } from '../../utils';
import { StatCard, Button, Badge, ProgressBar } from '../../components';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Building2,
  Zap,
  DollarSign,
  Battery,
  AlertTriangle,
  TrendingUp,
  ChevronRight,
  Clock,
  Users,
} from 'lucide-react';

const OperatorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await operatorAPI.getStats(user.id);
      setStats({
        totalStations: 0,
        activeSessions: 0,
        todayRevenue: 0,
        todayEnergy: 0,
        portUtilization: 0,
        totalPorts: 0,
        monthlyRevenue: 0,
        monthlyEnergy: 0,
        averageSessionDuration: 0,
        revenueByStation: [],
        sessionsByHour: [],
        maintenanceAlerts: [],
        ...response,
      });
    } catch (error) {
      console.error('Failed to fetch operator stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 ml-4">Operator Dashboard</h1>
          <p className="text-secondary-500 mt-1 ml-4">Welcome back, {user?.name}</p>
        </div>
        <Button onClick={() => navigate('/operator/stations')}>
          Manage Stations
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Stations"
          value={stats.totalStations}
          icon={Building2}
          iconColor="bg-blue-100 text-blue-600"
        />
        <StatCard
          title="Active Sessions"
          value={stats.activeSessions}
          icon={Zap}
          iconColor="bg-green-100 text-green-600"
        />
        <StatCard
          title="Today's Revenue"
          value={formatCurrency(stats.todayRevenue)}
          icon={DollarSign}
          iconColor="bg-purple-100 text-purple-600"
          trend="up"
          trendValue={18.3}
        />
        <StatCard
          title="Energy Delivered"
          value={formatEnergy(stats.todayEnergy)}
          icon={Battery}
          iconColor="bg-amber-100 text-amber-600"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Station */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-secondary-900">Revenue by Station</h2>
            <Badge variant="success">This Month</Badge>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.revenueByStation}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="station" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="revenue" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sessions by Hour */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-secondary-900">Sessions by Hour</h2>
            <Badge variant="info">Today</Badge>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.sessionsByHour}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="sessions" 
                  stroke="#22c55e" 
                  strokeWidth={3}
                  dot={{ fill: '#22c55e', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Port Utilization */}
        <div className="card">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">Port Utilization</h2>
          <div className="text-center mb-4">
            <div className="text-4xl font-bold text-primary-600">{stats.portUtilization}%</div>
            <p className="text-secondary-500">Average utilization</p>
          </div>
          <ProgressBar value={stats.portUtilization} size="lg" color="primary" />
          <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-secondary-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-secondary-900">{stats.totalPorts}</p>
              <p className="text-sm text-secondary-500">Total Ports</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-secondary-900">{stats.activeSessions}</p>
              <p className="text-sm text-secondary-500">Active Now</p>
            </div>
          </div>
        </div>

        {/* Maintenance Alerts */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-secondary-900">Maintenance Alerts</h2>
            <Badge variant="warning">{stats.maintenanceAlerts.length}</Badge>
          </div>
          <div className="space-y-3">
            {stats.maintenanceAlerts.length > 0 ? (
              stats.maintenanceAlerts.map((alert) => (
                <div 
                  key={alert.id}
                  className={`p-3 rounded-xl ${
                    alert.priority === 'high' ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={`w-5 h-5 ${
                      alert.priority === 'high' ? 'text-red-500' : 'text-amber-500'
                    }`} />
                    <div>
                      <p className="font-medium text-secondary-900">{alert.message}</p>
                      <p className="text-sm text-secondary-500">
                        Station #{alert.stationId} • Port #{alert.portId}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-secondary-500">
                <AlertTriangle className="w-12 h-12 mx-auto text-secondary-300 mb-2" />
                <p>No maintenance alerts</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="card">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">Monthly Overview</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-secondary-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-secondary-600">Revenue</span>
              </div>
              <span className="font-semibold text-secondary-900">
                {formatCurrency(stats.monthlyRevenue)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-secondary-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Battery className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-secondary-600">Energy</span>
              </div>
              <span className="font-semibold text-secondary-900">
                {formatEnergy(stats.monthlyEnergy)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-secondary-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-secondary-600">Avg Session</span>
              </div>
              <span className="font-semibold text-secondary-900">
                {stats.averageSessionDuration} mins
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperatorDashboard;
