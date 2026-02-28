import { useState, useEffect } from 'react';
import { useAuth, useNotifications } from '../../context';
import { adminAPI } from '../../services';
import { formatCurrency, formatEnergy, formatNumber } from '../../utils';
import { StatCard, LoadingSpinner } from '../../components';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Users,
  Building2,
  Zap,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  ChevronRight,
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const summaryStats = stats ? [
    {
      title: 'Total Users',
      value: formatNumber(stats.totalUsers),
      change: '+18.2%',
      trend: 'up',
      icon: Users,
      color: 'primary',
    },
    {
      title: 'Total Operators',
      value: formatNumber(stats.totalOperators),
      change: '+8.7%',
      trend: 'up',
      icon: Building2,
      color: 'secondary',
    },
    {
      title: 'Total Stations',
      value: formatNumber(stats.totalStations),
      change: '+12.5%',
      trend: 'up',
      icon: Building2,
      color: 'secondary',
    },
    {
      title: 'Energy Delivered',
      value: formatEnergy(stats.totalEnergy),
      change: '+24.8%',
      trend: 'up',
      icon: Zap,
      color: 'accent',
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      change: '+15.3%',
      trend: 'up',
      icon: DollarSign,
      color: 'warning',
    },
  ] : [];

  const revenueData = (stats?.revenueByMonth || []).map((item) => ({
    date: item.month,
    revenue: Number(item.revenue || 0),
    users: Number(item.users || 0),
  }));

  const energyData = (stats?.energyByMonth || stats?.revenueByMonth || []).map((item) => ({
    date: item.month,
    energy: Number(item.energy || 0),
  }));

  const userGrowthData = (stats?.userGrowthByMonth || stats?.revenueByMonth || []).map((item) => ({
    month: item.month,
    users: Number(item.users || 0),
  }));

  const stationStatusData = [
    { name: 'Online', value: stats?.activeChargers || 0, color: '#22c55e' },
    { name: 'Offline', value: Math.max((stats?.totalStations || 0) - (stats?.activeChargers || 0), 0), color: '#ef4444' },
  ];

  const topRegions = (stats?.stationsByCity || []).map((item) => ({
    name: item.city,
    stations: item.count,
    revenue: 0,
    growth: 0,
  }));

  const recentActivity = (stats?.recentActivity || []).map((activity) => ({
    type: activity.action?.toLowerCase().includes('user')
      ? 'user'
      : activity.action?.toLowerCase().includes('station')
      ? 'station'
      : activity.action?.toLowerCase().includes('payment')
      ? 'payment'
      : 'alert',
    message: `${activity.action}: ${activity.user}`,
    time: activity.timestamp || '-',
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 ml-4">Admin Dashboard</h1>
          <p className="text-secondary-500 mt-1 ml-4">System overview and analytics</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {summaryStats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-secondary-900">Revenue Overview</h3>
              <p className="text-sm text-secondary-500">Daily revenue and active users</p>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                  }}
                  formatter={(value, name) => [
                    name === 'revenue' ? formatCurrency(value) : value,
                    name === 'revenue' ? 'Revenue' : 'Users'
                  ]}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  name="Revenue" 
                  stroke="#22c55e" 
                  fill="url(#colorRevenue)" 
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  name="Users" 
                  stroke="#0ea5e9" 
                  strokeWidth={2}
                  dot={{ fill: '#0ea5e9', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Station Status */}
        <div className="card">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-secondary-900">Station Status</h3>
            <p className="text-sm text-secondary-500">Current station health</p>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stationStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stationStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-4">
            {stationStatusData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-secondary-600">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Energy Consumption */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-secondary-900">Energy Consumption</h3>
              <p className="text-sm text-secondary-500">Daily energy delivered (kWh)</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={energyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                  }}
                  formatter={(value) => [formatEnergy(value), 'Energy']}
                />
                <Bar dataKey="energy" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Growth */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-secondary-900">User Growth</h3>
              <p className="text-sm text-secondary-500">Monthly user registrations</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  name="Users" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  dot={{ fill: '#8b5cf6', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Regions */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-secondary-900">Top Regions</h3>
              <p className="text-sm text-secondary-500">Performance by location</p>
            </div>
            <button className="text-sm text-primary-600 font-medium hover:text-primary-700">
              View All
            </button>
          </div>
          <div className="space-y-4">
            {topRegions.map((region, index) => (
              <div key={region.name} className="flex items-center justify-between p-3 bg-secondary-50 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-secondary-900">{region.name}</p>
                    <p className="text-sm text-secondary-500">{region.stations} stations</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-secondary-900">{formatCurrency(region.revenue)}</p>
                  <p className={`text-sm flex items-center gap-1 justify-end ${
                    region.growth > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {region.growth > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {region.growth}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-secondary-900">Recent Activity</h3>
              <p className="text-sm text-secondary-500">Latest system events</p>
            </div>
            <button className="text-sm text-primary-600 font-medium hover:text-primary-700">
              View All
            </button>
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className={`p-2 rounded-lg ${
                  activity.type === 'user' ? 'bg-blue-100' :
                  activity.type === 'station' ? 'bg-red-100' :
                  activity.type === 'payment' ? 'bg-green-100' :
                  activity.type === 'operator' ? 'bg-purple-100' :
                  'bg-amber-100'
                }`}>
                  {activity.type === 'user' && <Users className="w-4 h-4 text-blue-600" />}
                  {activity.type === 'station' && <Building2 className="w-4 h-4 text-red-600" />}
                  {activity.type === 'payment' && <DollarSign className="w-4 h-4 text-green-600" />}
                  {activity.type === 'operator' && <CheckCircle className="w-4 h-4 text-purple-600" />}
                  {activity.type === 'alert' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-secondary-900">{activity.message}</p>
                  <p className="text-xs text-secondary-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
