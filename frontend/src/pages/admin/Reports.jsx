import { useState, useEffect } from 'react';
import { adminAPI } from '../../services';
import { formatCurrency, formatEnergy } from '../../utils';
import { Button, Select, LoadingSpinner } from '../../components';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Zap,
  DollarSign,
  Users,
  Building2,
  Activity,
} from 'lucide-react';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month');
  const [stats, setStats] = useState(null);
  const [sessionsByHour, setSessionsByHour] = useState([]);
  const [stationPerformance, setStationPerformance] = useState([]);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const [statsResponse, sessionsResponse, stationsResponse] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getAllSessions(),
        adminAPI.getAllStations(),
      ]);

      if (statsResponse?.success) {
        setStats(statsResponse.data || {});
      } else {
        setStats({});
      }

      const sessions = sessionsResponse?.success ? (sessionsResponse.data || []) : [];
      const hours = Array.from({ length: 24 }, (_, hour) => ({
        hour: `${hour.toString().padStart(2, '0')}:00`,
        sessions: 0,
      }));
      sessions.forEach((session) => {
        if (!session?.startTime) {
          return;
        }
        const hour = new Date(session.startTime).getHours();
        if (hour >= 0 && hour < 24) {
          hours[hour].sessions += 1;
        }
      });
      setSessionsByHour(hours.filter((item, index) => index % 3 === 0));

      const stations = stationsResponse?.success ? (stationsResponse.data || []) : [];
      const stationRows = stations
        .map((station) => ({
          name: station.name || 'Unknown Station',
          utilization: Math.round(((station.ports || []).filter((port) => port.status !== 'offline').length / Math.max((station.ports || []).length, 1)) * 100),
          revenue: 0,
          sessions: 0,
          rating: station.rating || 0,
        }))
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 5);
      setStationPerformance(stationRows);
    } finally {
      setLoading(false);
    }
  };

  const revenueByMonth = stats?.revenueByMonth || [];
  const stationsByCity = stats?.stationsByCity || [];

  const kpiCards = [
    {
      label: 'Total Revenue',
      value: formatCurrency(stats?.totalRevenue || 0),
      change: `${stats?.monthlyGrowth?.revenue ?? 0}%`,
      trend: (stats?.monthlyGrowth?.revenue ?? 0) >= 0 ? 'up' : 'down',
      icon: DollarSign,
      color: 'bg-green-100 text-green-600',
    },
    {
      label: 'Total Users',
      value: (stats?.totalUsers || 0).toLocaleString(),
      change: `${stats?.monthlyGrowth?.users ?? 0}%`,
      trend: (stats?.monthlyGrowth?.users ?? 0) >= 0 ? 'up' : 'down',
      icon: Users,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      label: 'Energy Delivered',
      value: formatEnergy(stats?.totalEnergy || 0),
      change: `${stats?.monthlyGrowth?.energy ?? 0}%`,
      trend: (stats?.monthlyGrowth?.energy ?? 0) >= 0 ? 'up' : 'down',
      icon: Zap,
      color: 'bg-amber-100 text-amber-600',
    },
    {
      label: 'Active Chargers',
      value: (stats?.activeChargers || 0).toLocaleString(),
      change: `${stats?.monthlyGrowth?.stations ?? 0}%`,
      trend: (stats?.monthlyGrowth?.stations ?? 0) >= 0 ? 'up' : 'down',
      icon: Activity,
      color: 'bg-purple-100 text-purple-600',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 ml-4">Reports & Analytics</h1>
          <p className="text-secondary-500 mt-1 ml-4">Live metrics from database activity</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onChange={(e) => setDateRange(e.target.value)} icon={Calendar}>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </Select>
          <Button icon={Download} onClick={fetchReportData}>
            Refresh Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => (
          <div key={kpi.label} className="card" style={{ backgroundColor: '#abf7b1' }}>
            <div className="flex items-start justify-between">
              <div className={`p-3 rounded-xl ${kpi.color}`}>
                <kpi.icon className="w-6 h-6" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {kpi.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {kpi.change}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-secondary-900">{kpi.value}</p>
              <p className="text-sm text-secondary-500">{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-6">Revenue Trend</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueByMonth}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#22c55e" fill="url(#revenueGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-6">Stations by City</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stationsByCity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="city" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="Stations" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-secondary-900 mb-6">Top Rated Stations</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-secondary-200">
                <th className="text-left py-3 px-4 font-semibold text-secondary-700">Station</th>
                <th className="text-left py-3 px-4 font-semibold text-secondary-700">Utilization</th>
                <th className="text-left py-3 px-4 font-semibold text-secondary-700">Revenue</th>
                <th className="text-left py-3 px-4 font-semibold text-secondary-700">Sessions</th>
              </tr>
            </thead>
            <tbody>
              {stationPerformance.map((station) => (
                <tr key={station.name} className="border-b border-secondary-100 hover:bg-secondary-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary-600" />
                      </div>
                      <span className="font-medium text-secondary-900">{station.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-secondary-700">{station.utilization}%</td>
                  <td className="py-3 px-4 font-medium text-secondary-900">{formatCurrency(station.revenue)}</td>
                  <td className="py-3 px-4 text-secondary-700">{station.sessions.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-secondary-900 mb-6">Sessions by Time of Day</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sessionsByHour}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="hour" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="sessions" name="Sessions" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6', strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Reports;
