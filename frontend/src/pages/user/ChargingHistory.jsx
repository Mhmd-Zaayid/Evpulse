import { useState, useEffect } from 'react';
import { useAuth } from '../../context';
import { historyAPI } from '../../services';
import { formatCurrency, formatDate, formatDuration, formatEnergy } from '../../utils';
import { Button, Badge, LoadingSpinner, Modal } from '../../components';
import {
  History,
  Zap,
  DollarSign,
  Clock,
  Leaf,
  Calendar,
  ChevronRight,
  Download,
  Filter,
  Star,
  TrendingUp,
  Battery,
  MapPin,
} from 'lucide-react';

const ChargingHistory = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState('all');

  useEffect(() => {
    fetchHistory();
    fetchStats();
  }, [user?.id]);

  const fetchHistory = async () => {
    try {
      const response = await historyAPI.getByUser(user?.id);
      if (response.success) {
        setHistory(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await historyAPI.getStats(user?.id);
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleViewDetails = (session) => {
    setSelectedSession(session);
    setShowDetailModal(true);
  };

  const filteredHistory = history.filter(session => {
    if (filterPeriod === 'all') return true;
    const sessionDate = new Date(session.date);
    const now = new Date();
    if (filterPeriod === 'week') {
      const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
      return sessionDate >= weekAgo;
    }
    if (filterPeriod === 'month') {
      const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
      return sessionDate >= monthAgo;
    }
    return true;
  });

  const renderStars = (rating) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 ml-4">Charging History</h1>
          <p className="text-secondary-500 mt-1">View your past charging sessions and reports</p>
        </div>
        <Button variant="outline" icon={Download}>
          Export Report
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="rounded-2xl shadow-lg shadow-green-500/10 hover:shadow-xl hover:shadow-green-500/20 p-5 border border-green-500/20 bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 transition-all duration-300 hover:scale-[1.02]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-green-300 shadow-lg shadow-emerald-500/30 flex items-center justify-center">
                <Zap className="w-6 h-6 text-green-900" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-100/80 drop-shadow-sm">Total Energy</p>
                <p className="text-xl font-bold text-white drop-shadow-md">{formatEnergy(stats.totalEnergy)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl shadow-lg shadow-green-500/10 hover:shadow-xl hover:shadow-green-500/20 p-5 border border-green-500/20 bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 transition-all duration-300 hover:scale-[1.02]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-green-300 shadow-lg shadow-emerald-500/30 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-900" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-100/80 drop-shadow-sm">Total Spent</p>
                <p className="text-xl font-bold text-white drop-shadow-md">{formatCurrency(stats.totalCost)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl shadow-lg shadow-green-500/10 hover:shadow-xl hover:shadow-green-500/20 p-5 border border-green-500/20 bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 transition-all duration-300 hover:scale-[1.02]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-green-300 shadow-lg shadow-emerald-500/30 flex items-center justify-center">
                <Battery className="w-6 h-6 text-green-900" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-100/80 drop-shadow-sm">Total Sessions</p>
                <p className="text-xl font-bold text-white drop-shadow-md">{stats.totalSessions}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl shadow-lg shadow-green-500/10 hover:shadow-xl hover:shadow-green-500/20 p-5 border border-green-500/20 bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 transition-all duration-300 hover:scale-[1.02]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-green-300 shadow-lg shadow-emerald-500/30 flex items-center justify-center">
                <Clock className="w-6 h-6 text-green-900" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-100/80 drop-shadow-sm">Avg. Duration</p>
                <p className="text-xl font-bold text-white drop-shadow-md">{formatDuration(stats.avgSessionDuration)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl shadow-lg shadow-green-500/10 hover:shadow-xl hover:shadow-green-500/20 p-5 border border-green-500/20 bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 transition-all duration-300 hover:scale-[1.02]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-green-300 shadow-lg shadow-emerald-500/30 flex items-center justify-center">
                <Leaf className="w-6 h-6 text-green-900" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-100/80 drop-shadow-sm">CO₂ Saved</p>
                <p className="text-xl font-bold text-white drop-shadow-md">{stats.co2Saved} kg</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl shadow-sm p-4 border border-secondary-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-secondary-400" />
            <span className="text-sm text-secondary-600">Filter by:</span>
            <div className="flex gap-2">
              {[
                { value: 'all', label: 'All Time' },
                { value: 'week', label: 'This Week' },
                { value: 'month', label: 'This Month' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFilterPeriod(option.value)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    filterPeriod === option.value
                      ? 'bg-primary-100 text-primary-700 font-medium'
                      : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <p className="text-sm text-secondary-500">
            {filteredHistory.length} session{filteredHistory.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* History List */}
      <div className="bg-white rounded-2xl shadow-sm border border-secondary-100 overflow-hidden">
        <div className="p-6 border-b border-secondary-100">
          <h2 className="text-lg font-semibold text-secondary-900">Session History</h2>
        </div>
        
        {filteredHistory.length > 0 ? (
          <div className="divide-y divide-secondary-100">
            {filteredHistory.map((session) => (
              <div
                key={session.id}
                className="p-6 hover:bg-secondary-50 transition-colors cursor-pointer"
                onClick={() => handleViewDetails(session)}
              >
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
                      <div className="flex items-center gap-3 mt-1 text-sm text-secondary-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(session.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {session.startTime} - {session.endTime}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-sm text-secondary-500">Energy</p>
                      <p className="font-semibold text-secondary-900">{session.energyConsumed} kWh</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-secondary-500">Duration</p>
                      <p className="font-semibold text-secondary-900">{formatDuration(session.duration)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-secondary-500">Cost</p>
                      <p className="font-semibold text-primary-600">{formatCurrency(session.cost)}</p>
                    </div>
                    <div className="text-center min-w-[80px]">
                      {session.rating ? (
                        renderStars(session.rating)
                      ) : (
                        <Badge variant="warning">Not Rated</Badge>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-secondary-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <History className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-secondary-900 mb-2">No charging history</h3>
            <p className="text-secondary-500">Your charging sessions will appear here</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Session Details"
        size="md"
      >
        {selectedSession && (
          <div className="space-y-6">
            {/* Station Info */}
            <div className="flex items-center gap-4 p-4 bg-secondary-50 rounded-xl">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                selectedSession.chargingType === 'Fast DC' ? 'bg-amber-100' : 'bg-blue-100'
              }`}>
                <Zap className={`w-7 h-7 ${
                  selectedSession.chargingType === 'Fast DC' ? 'text-amber-600' : 'text-blue-600'
                }`} />
              </div>
              <div>
                <h3 className="font-semibold text-secondary-900">{selectedSession.stationName}</h3>
                <p className="text-sm text-secondary-500">{selectedSession.chargingType}</p>
              </div>
            </div>

            {/* Session Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-secondary-50 rounded-xl">
                <p className="text-sm text-secondary-500 mb-1">Date & Time</p>
                <p className="font-medium text-secondary-900">
                  {formatDate(selectedSession.date)}
                </p>
                <p className="text-sm text-secondary-600">
                  {selectedSession.startTime} - {selectedSession.endTime}
                </p>
              </div>
              <div className="p-4 bg-secondary-50 rounded-xl">
                <p className="text-sm text-secondary-500 mb-1">Duration</p>
                <p className="font-medium text-secondary-900">
                  {formatDuration(selectedSession.duration)}
                </p>
              </div>
              <div className="p-4 bg-secondary-50 rounded-xl">
                <p className="text-sm text-secondary-500 mb-1">Energy Consumed</p>
                <p className="font-medium text-secondary-900">
                  {selectedSession.energyConsumed} kWh
                </p>
              </div>
              <div className="p-4 bg-primary-50 rounded-xl">
                <p className="text-sm text-secondary-500 mb-1">Total Cost</p>
                <p className="font-bold text-primary-600 text-lg">
                  {formatCurrency(selectedSession.cost)}
                </p>
              </div>
            </div>

            {/* Battery Progress */}
            <div className="p-4 bg-secondary-50 rounded-xl">
              <p className="text-sm text-secondary-500 mb-3">Battery Level</p>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-secondary-900">{selectedSession.batteryStart}%</p>
                  <p className="text-xs text-secondary-500">Start</p>
                </div>
                <div className="flex-1 h-3 bg-secondary-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-400 to-green-500 rounded-full transition-all"
                    style={{ width: `${selectedSession.batteryEnd}%` }}
                  />
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{selectedSession.batteryEnd}%</p>
                  <p className="text-xs text-secondary-500">End</p>
                </div>
              </div>
            </div>

            {/* Rating */}
            {selectedSession.rating ? (
              <div className="p-4 bg-secondary-50 rounded-xl">
                <p className="text-sm text-secondary-500 mb-2">Your Rating</p>
                {renderStars(selectedSession.rating)}
              </div>
            ) : (
              <div className="p-4 bg-amber-50 rounded-xl text-center">
                <p className="text-sm text-amber-700 mb-2">You haven't rated this session</p>
                <Button variant="outline" size="sm">
                  Rate Now
                </Button>
              </div>
            )}

            <Button fullWidth onClick={() => setShowDetailModal(false)}>
              Close
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ChargingHistory;
