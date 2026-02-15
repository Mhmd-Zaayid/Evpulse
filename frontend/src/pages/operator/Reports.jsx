import { useState, useEffect } from 'react';
import { useAuth, useNotifications } from '../../context';
import { operatorAPI } from '../../services';
import { formatCurrency, formatEnergy, formatDate } from '../../utils';
import { Button, Select, LoadingSpinner } from '../../components';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Zap,
  DollarSign,
  Users,
  Clock,
  FileText,
} from 'lucide-react';

const Reports = () => {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('week');
  const [stats, setStats] = useState(null);

  // Mock report data
  const revenueData = [
    { date: 'Mon', revenue: 245, sessions: 12 },
    { date: 'Tue', revenue: 312, sessions: 15 },
    { date: 'Wed', revenue: 287, sessions: 14 },
    { date: 'Thu', revenue: 398, sessions: 18 },
    { date: 'Fri', revenue: 421, sessions: 20 },
    { date: 'Sat', revenue: 356, sessions: 17 },
    { date: 'Sun', revenue: 289, sessions: 14 },
  ];

  const utilizationData = [
    { name: 'Downtown Hub', utilization: 78 },
    { name: 'Mall Parking', utilization: 65 },
    { name: 'Highway Rest', utilization: 82 },
    { name: 'Tech Park', utilization: 71 },
    { name: 'Airport', utilization: 89 },
  ];

  const peakHoursData = [
    { hour: '6AM', sessions: 5 },
    { hour: '8AM', sessions: 18 },
    { hour: '10AM', sessions: 22 },
    { hour: '12PM', sessions: 28 },
    { hour: '2PM', sessions: 25 },
    { hour: '4PM', sessions: 32 },
    { hour: '6PM', sessions: 35 },
    { hour: '8PM', sessions: 20 },
    { hour: '10PM', sessions: 12 },
  ];

  useEffect(() => {
    fetchStats();
  }, [dateRange]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await operatorAPI.getStats(user.id);
      setStats(response);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = (type) => {
    showToast({ type: 'success', message: `${type} report exported successfully!` });
  };

  const summaryStats = [
    {
      label: 'Total Revenue',
      value: formatCurrency(2308),
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'bg-green-100 text-green-600',
    },
    {
      label: 'Energy Delivered',
      value: formatEnergy(1451),
      change: '+8.3%',
      trend: 'up',
      icon: Zap,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      label: 'Total Sessions',
      value: '110',
      change: '+15.2%',
      trend: 'up',
      icon: Users,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      label: 'Avg Session Time',
      value: '42 min',
      change: '-5.1%',
      trend: 'down',
      icon: Clock,
      color: 'bg-amber-100 text-amber-600',
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 ml-4">Reports & Analytics</h1>
          <p className="text-secondary-500 mt-1">Comprehensive performance insights</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            options={[
              { value: 'week', label: 'This Week' },
              { value: 'month', label: 'This Month' },
              { value: 'quarter', label: 'This Quarter' },
              { value: 'year', label: 'This Year' },
            ]}
          />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryStats.map((stat) => (
          <div key={stat.label} className="card" style={{ backgroundColor: '#abf7b1' }}>
            <div className="flex items-start justify-between">
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${
                stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.trend === 'up' ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {stat.change}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-secondary-900">{stat.value}</p>
              <p className="text-sm text-secondary-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-secondary-900">Revenue Overview</h3>
            <p className="text-sm text-secondary-500">Daily revenue and session count</p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            icon={FileText}
            onClick={() => handleExportReport('Revenue')}
          >
            Export
          </Button>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
              <YAxis yAxisId="left" stroke="#64748b" fontSize={12} />
              <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="revenue" name="Revenue (₹)" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="sessions" name="Sessions" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Peak Hours and Station Utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peak Hours */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-secondary-900">Peak Usage Hours</h3>
              <p className="text-sm text-secondary-500">Sessions by time of day</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={peakHoursData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="hour" stroke="#64748b" fontSize={12} />
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
                  dataKey="sessions" 
                  name="Sessions" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  dot={{ fill: '#8b5cf6', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Station Utilization */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-secondary-900">Station Utilization</h3>
              <p className="text-sm text-secondary-500">Average utilization by station</p>
            </div>
          </div>
          <div className="space-y-4">
            {utilizationData.map((station) => (
              <div key={station.name}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-secondary-700">{station.name}</span>
                  <span className="text-sm font-semibold text-secondary-900">{station.utilization}%</span>
                </div>
                <div className="h-3 bg-secondary-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      station.utilization >= 80 ? 'bg-green-500' :
                      station.utilization >= 60 ? 'bg-blue-500' :
                      'bg-amber-500'
                    }`}
                    style={{ width: `${station.utilization}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
