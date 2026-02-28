import { useState, useEffect } from 'react';
import { adminAPI } from '../../services';
import { formatCurrency, formatEnergy } from '../../utils';
import { Button, Select, LoadingSpinner } from '../../components';
import {
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

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const [statsResponse] = await Promise.all([adminAPI.getStats()]);

      if (statsResponse?.success) {
        setStats(statsResponse.data || {});
      } else {
        setStats({});
      }
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
      label: 'Total Operators',
      value: (stats?.totalOperators || 0).toLocaleString(),
      change: `${stats?.monthlyGrowth?.stations ?? 0}%`,
      trend: (stats?.monthlyGrowth?.stations ?? 0) >= 0 ? 'up' : 'down',
      icon: Building2,
      color: 'bg-indigo-100 text-indigo-600',
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpiCards.map((kpi) => (
          <div key={kpi.label} className="rounded-2xl shadow-lg shadow-green-500/10 p-5 border border-green-500/20 bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/20 hover:scale-[1.02]">
            <div className="flex items-start justify-between">
              <div className={`p-3 rounded-xl bg-gradient-to-br from-emerald-400 to-green-300`}>
                <kpi.icon className="w-6 h-6 text-white" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${kpi.trend === 'up' ? 'text-green-200' : 'text-red-200'}`}>
                {kpi.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {kpi.change}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-white">{kpi.value}</p>
              <p className="text-sm text-emerald-100/80">{kpi.label}</p>
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

    </div>
  );
};

export default Reports;
