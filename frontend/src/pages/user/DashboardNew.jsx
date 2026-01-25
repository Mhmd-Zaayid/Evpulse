import { useState, useEffect } from 'react';
import { useAuth } from '../../context';
import { formatCurrency } from '../../utils';
import { ChevronRight, ChevronLeft } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(11);
  const [currentDate] = useState(new Date());

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth };
  };

  const getWeekDays = () => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const activityData = [
    [2, 3, 4, 3, 2, 1, 0],
    [3, 4, 5, 4, 3, 2, 1],
    [4, 5, 6, 5, 4, 3, 2],
    [3, 4, 5, 6, 5, 4, 3],
    [2, 3, 4, 5, 6, 5, 4],
  ];

  const getHeatmapColor = (value) => {
    if (value === 0) return 'bg-gray-100';
    if (value <= 2) return 'bg-green-200';
    if (value <= 4) return 'bg-green-400';
    return 'bg-green-600';
  };

  const { firstDay, daysInMonth } = getDaysInMonth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Hello, {user?.name?.split(' ')[0]}!</h1>
          <p className="text-secondary-500 mt-1">Here's the overview for your business</p>
        </div>
      </div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Customers Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-secondary-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
          </div>
          <div>
            <p className="text-sm text-secondary-500 mb-2">Total Customers</p>
            <p className="text-3xl font-bold text-secondary-900 mb-2">21,922</p>
            <p className="text-sm text-green-600">+8% since last week</p>
            <button className="flex items-center gap-1 text-sm text-secondary-600 mt-3 hover:text-primary-600 transition-colors">
              View More <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* New Customers Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-secondary-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
          </div>
          <div>
            <p className="text-sm text-secondary-500 mb-2">New customers</p>
            <p className="text-3xl font-bold text-secondary-900 mb-2">723</p>
            <p className="text-sm text-green-600">+12% since last week</p>
            <button className="flex items-center gap-1 text-sm text-secondary-600 mt-3 hover:text-primary-600 transition-colors">
              View More <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Income Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-secondary-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
          </div>
          <div>
            <p className="text-sm text-secondary-500 mb-2">Income</p>
            <p className="text-3xl font-bold text-secondary-900 mb-2">{formatCurrency(24291.92)}</p>
            <p className="text-sm text-green-600">+23% since last week</p>
            <button className="flex items-center gap-1 text-sm text-secondary-600 mt-3 hover:text-primary-600 transition-colors">
              View More <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expense Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-secondary-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          </div>
          <div>
            <p className="text-sm text-secondary-500 mb-2">Expense</p>
            <p className="text-3xl font-bold text-secondary-900 mb-2">{formatCurrency(4200.39)}</p>
            <p className="text-sm text-green-600">+5% since last week</p>
            <button className="flex items-center gap-1 text-sm text-secondary-600 mt-3 hover:text-primary-600 transition-colors">
              View More <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Report - Takes 2 columns */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6 border border-secondary-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-secondary-900">Sales Report</h2>
            <button className="text-secondary-400 hover:text-secondary-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
          </div>

          {/* Time Period Tabs */}
          <div className="flex gap-4 mb-6">
            <button className="text-secondary-900 font-medium border-b-2 border-primary-500 pb-2">Weekly</button>
            <button className="text-secondary-400 pb-2 hover:text-secondary-700">Monthly</button>
            <button className="text-secondary-400 pb-2 hover:text-secondary-700">Yearly</button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-3xl font-bold text-secondary-900">{formatCurrency(24291)}</p>
              <p className="text-sm text-green-600 mt-1">+25.0%</p>
              <p className="text-xs text-secondary-500 mt-1">Compared to {formatCurrency(19340)} last week</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-secondary-900">{formatCurrency(48903)}</p>
              <p className="text-sm text-green-600 mt-1">+1.01%</p>
              <p className="text-xs text-secondary-500 mt-1">Compared to {formatCurrency(48411)} last month</p>
            </div>
          </div>

          {/* Chart Area */}
          <div className="relative h-64 mb-4">
            <svg viewBox="0 0 600 200" className="w-full h-full">
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity="0.05" />
                </linearGradient>
              </defs>
              <path
                d="M 0 180 Q 150 150 200 120 T 400 100 L 600 80 L 600 200 L 0 200 Z"
                fill="url(#gradient)"
              />
              <path
                d="M 0 180 Q 150 150 200 120 T 400 100 L 600 80"
                fill="none"
                stroke="#22c55e"
                strokeWidth="3"
              />
              
              {/* Data points */}
              <circle cx="150" cy="150" r="4" fill="#22c55e" />
              <circle cx="300" cy="110" r="4" fill="#22c55e" />
              <circle cx="450" cy="95" r="4" fill="#22c55e" />
              <circle cx="600" cy="80" r="4" fill="#22c55e" />
              
              {/* Labels */}
              <text x="100" y="195" fontSize="12" fill="#64748b">3,021</text>
              <text x="300" y="195" fontSize="12" fill="#64748b">12,222</text>
              <text x="450" y="195" fontSize="12" fill="#64748b">50,201</text>
              <text x="580" y="195" fontSize="12" fill="#64748b">82,229</text>
            </svg>
          </div>

          {/* Bottom Stats */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-secondary-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-secondary-900">21,980</p>
              <p className="text-sm text-secondary-500 mt-1">Week 1</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-secondary-900">50,201</p>
              <p className="text-sm text-secondary-500 mt-1">Week 2</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-secondary-900">82,229</p>
              <p className="text-sm text-secondary-500 mt-1">Week 3</p>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Calendar Widget */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-secondary-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-secondary-900">This week</h3>
              <div className="flex gap-2">
                <button className="p-1 hover:bg-secondary-100 rounded transition-colors">
                  <ChevronLeft className="w-4 h-4 text-secondary-600" />
                </button>
                <button className="p-1 hover:bg-secondary-100 rounded transition-colors">
                  <ChevronRight className="w-4 h-4 text-secondary-600" />
                </button>
              </div>
            </div>

            {/* Week days header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {getWeekDays().map((day) => (
                <div key={day} className="text-center text-xs text-secondary-500 py-1">
                  {day.slice(0, 3)}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {[...Array(firstDay)].map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square"></div>
              ))}
              {[...Array(daysInMonth)].map((_, i) => {
                const day = i + 1;
                const isSelected = day === selectedDate;
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(day)}
                    className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-green-500 text-white shadow-md'
                        : 'hover:bg-secondary-100 text-secondary-700'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Activity Heatmap */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-secondary-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-secondary-900">Activity heatmap</h3>
                <p className="text-xs text-secondary-500">Sessions frequency of use</p>
              </div>
              <button className="text-secondary-400 hover:text-secondary-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
            </div>

            {/* Week days header */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div key={day} className="text-center text-xs text-secondary-500">
                  {day}
                </div>
              ))}
            </div>

            {/* Heatmap grid */}
            <div className="space-y-2">
              {activityData.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7 gap-2">
                  {week.map((value, dayIndex) => (
                    <div
                      key={dayIndex}
                      className={`aspect-square rounded transition-colors ${getHeatmapColor(value)}`}
                      title={`${value} sessions`}
                    />
                  ))}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-secondary-100">
              <div className="flex items-center gap-2 text-xs text-secondary-500">
                <span>0-99</span>
                <span>100-249</span>
                <span>250-399</span>
                <span>400+</span>
              </div>
            </div>
          </div>

          {/* Conversion Stats */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-secondary-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-secondary-900">Conversion</h3>
              <button className="text-secondary-400 hover:text-secondary-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-secondary-600">Active stations</span>
                  <span className="text-sm font-medium text-secondary-900">85%</span>
                </div>
                <div className="h-2 bg-secondary-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: '85%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-secondary-600">Passive stations</span>
                  <span className="text-sm font-medium text-secondary-900">42%</span>
                </div>
                <div className="h-2 bg-secondary-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-400 rounded-full transition-all" style={{ width: '42%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
