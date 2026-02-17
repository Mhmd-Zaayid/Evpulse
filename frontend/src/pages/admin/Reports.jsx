import { useState, useEffect } from 'react';
import { formatCurrency, formatEnergy, formatDate } from '../../utils';
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
  FileText,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
} from 'lucide-react';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month');

  // Mock data
  const userGrowthData = [
    { month: 'Aug', newUsers: 320, activeUsers: 2100 },
    { month: 'Sep', newUsers: 410, activeUsers: 2380 },
    { month: 'Oct', newUsers: 380, activeUsers: 2650 },
    { month: 'Nov', newUsers: 520, activeUsers: 2980 },
    { month: 'Dec', newUsers: 480, activeUsers: 3250 },
    { month: 'Jan', newUsers: 590, activeUsers: 3650 },
  ];

  const energyData = [
    { date: 'Week 1', dcFast: 28500, level2: 12400 },
    { date: 'Week 2', dcFast: 32100, level2: 14200 },
    { date: 'Week 3', dcFast: 29800, level2: 13100 },
    { date: 'Week 4', dcFast: 35600, level2: 15800 },
  ];

  const stationPerformance = [
    { name: 'Downtown Hub', utilization: 82, revenue: 15680, sessions: 245 },
    { name: 'Mall Parking A', utilization: 75, revenue: 12450, sessions: 198 },
    { name: 'Airport Terminal', utilization: 89, revenue: 28900, sessions: 412 },
    { name: 'Tech Park', utilization: 68, revenue: 9870, sessions: 156 },
    { name: 'University', utilization: 71, revenue: 7650, sessions: 128 },
  ];

  const sessionsByHour = [
    { hour: '00:00', sessions: 45 },
    { hour: '04:00', sessions: 28 },
    { hour: '08:00', sessions: 156 },
    { hour: '12:00', sessions: 234 },
    { hour: '16:00', sessions: 289 },
    { hour: '20:00', sessions: 178 },
  ];

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, []);

  const kpiCards = [
    { label: 'Total Revenue', value: formatCurrency(208000), change: '+12.5%', trend: 'up', icon: DollarSign, color: 'bg-green-100 text-green-600' },
    { label: 'Active Users', value: '3,650', change: '+18.2%', trend: 'up', icon: Users, color: 'bg-blue-100 text-blue-600' },
    { label: 'Energy Delivered', value: formatEnergy(126000), change: '+15.8%', trend: 'up', icon: Zap, color: 'bg-amber-100 text-amber-600' },
    { label: 'Avg Utilization', value: '77%', change: '+3.2%', trend: 'up', icon: Activity, color: 'bg-purple-100 text-purple-600' },
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
          <p className="text-secondary-500 mt-1 ml-4">Comprehensive system insights and metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            icon={Calendar}
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </Select>
          <Button icon={Download}>
            Export Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => (
          <div key={kpi.label} className="card" style={{ backgroundColor: '#abf7b1' }}>
            <div className="flex items-start justify-between">
              <div className={`p-3 rounded-xl ${kpi.color}`}>
                <kpi.icon className="w-6 h-6" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${
                kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
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

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-secondary-900">User Growth</h3>
              <p className="text-sm text-secondary-500">New vs Active users</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userGrowthData}>
                <defs>
                  <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }}
                />
                <Legend />
                <Area type="monotone" dataKey="activeUsers" name="Active Users" stroke="#0ea5e9" fill="url(#colorActive)" />
                <Line type="monotone" dataKey="newUsers" name="New Users" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Energy Consumption by Type */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-secondary-900">Energy by Charger Type</h3>
              <p className="text-sm text-secondary-500">DC Fast vs Level 2</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={energyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }}
                  formatter={(value) => formatEnergy(value)}
                />
                <Legend />
                <Bar dataKey="dcFast" name="DC Fast" stackId="a" fill="#22c55e" />
                <Bar dataKey="level2" name="Level 2" stackId="a" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Station Performance Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-secondary-900">Station Performance</h3>
            <p className="text-sm text-secondary-500">Top performing stations</p>
          </div>
        </div>
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
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-secondary-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            station.utilization >= 80 ? 'bg-green-500' :
                            station.utilization >= 60 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${station.utilization}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-secondary-900">{station.utilization}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium text-secondary-900">
                    {formatCurrency(station.revenue)}
                  </td>
                  <td className="py-3 px-4 text-secondary-700">
                    {station.sessions.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sessions by Time */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-secondary-900">Sessions by Time of Day</h3>
            <p className="text-sm text-secondary-500">Peak usage patterns</p>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sessionsByHour}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="hour" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }}
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
    </div>
  );
};

export default Reports;
