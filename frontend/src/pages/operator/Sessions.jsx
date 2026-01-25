import { useState, useEffect } from 'react';
import { useAuth, useNotifications } from '../../context';
import { sessionsAPI, stationsAPI } from '../../services';
import { chargingStations, chargingSessions } from '../../services/mockData';
import { formatCurrency, formatEnergy, formatDuration, formatDateTime, getStatusColor, getStatusText } from '../../utils';
import { Button, Badge, Table, Select, LoadingSpinner, ProgressBar } from '../../components';
import { Zap, Clock, Battery, User, Filter, RefreshCw } from 'lucide-react';

const Sessions = () => {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedStation, setSelectedStation] = useState('all');
  const [stations, setStations] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Get stations for this operator
      const stationsRes = await stationsAPI.getByOperator(user.id);
      setStations(stationsRes.data);
      
      // Get all sessions for operator's stations
      const allSessions = chargingSessions.map(session => ({
        ...session,
        station: chargingStations.find(s => s.id === session.stationId),
        user: { name: 'John Doe', email: 'user@example.com' }, // Mock user data
      }));
      setSessions(allSessions);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchData();
  };

  const filteredSessions = sessions.filter(session => {
    if (filter !== 'all' && session.status !== filter) return false;
    if (selectedStation !== 'all' && session.stationId !== parseInt(selectedStation)) return false;
    return true;
  });

  const activeSessions = sessions.filter(s => s.status === 'active');
  const completedSessions = sessions.filter(s => s.status === 'completed');
  const totalRevenue = completedSessions.reduce((sum, s) => sum + (s.cost || 0), 0);
  const totalEnergy = completedSessions.reduce((sum, s) => sum + (s.energyDelivered || 0), 0);

  const columns = [
    {
      key: 'session',
      label: 'Session',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            row.status === 'active' ? 'bg-green-100' : 'bg-secondary-100'
          }`}>
            <Zap className={`w-5 h-5 ${row.status === 'active' ? 'text-green-600' : 'text-secondary-500'}`} />
          </div>
          <div>
            <p className="font-medium text-secondary-900">{row.orderId || `#${row.id}`}</p>
            <p className="text-sm text-secondary-500">{row.chargingType}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'station',
      label: 'Station',
      render: (row) => (
        <div>
          <p className="font-medium text-secondary-900">{row.station?.name}</p>
          <p className="text-sm text-secondary-500">Port #{row.portId}</p>
        </div>
      ),
    },
    {
      key: 'time',
      label: 'Time',
      render: (row) => (
        <div>
          <p className="text-secondary-900">{formatDateTime(row.startTime)}</p>
          {row.duration && (
            <p className="text-sm text-secondary-500">{formatDuration(row.duration)}</p>
          )}
        </div>
      ),
    },
    {
      key: 'energy',
      label: 'Energy',
      render: (row) => (
        <div>
          <p className="font-medium text-secondary-900">{formatEnergy(row.energyDelivered)}</p>
          {row.status === 'active' && row.progress && (
            <div className="w-20 mt-1">
              <ProgressBar value={row.progress} size="sm" />
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'cost',
      label: 'Cost',
      render: (row) => (
        <span className="font-semibold text-secondary-900">
          {row.cost ? formatCurrency(row.cost) : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Badge variant={row.status === 'active' ? 'success' : row.status === 'completed' ? 'info' : 'default'}>
          {getStatusText(row.status)}
        </Badge>
      ),
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
          <h1 className="text-2xl font-bold text-secondary-900">Charging Sessions</h1>
          <p className="text-secondary-500 mt-1">Monitor active and completed sessions</p>
        </div>
        <Button variant="secondary" icon={RefreshCw} onClick={handleRefresh}>
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-900">{activeSessions.length}</p>
              <p className="text-sm text-secondary-500">Active Sessions</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-900">{completedSessions.length}</p>
              <p className="text-sm text-secondary-500">Completed Today</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Battery className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-900">{formatEnergy(totalEnergy)}</p>
              <p className="text-sm text-secondary-500">Energy Delivered</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <span className="text-purple-600 font-bold">$</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-900">{formatCurrency(totalRevenue)}</p>
              <p className="text-sm text-secondary-500">Revenue</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Sessions */}
      {activeSessions.length > 0 && (
        <div className="card border-2 border-green-200 bg-green-50/50">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <h2 className="text-lg font-semibold text-secondary-900">Active Sessions</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeSessions.map((session) => (
              <div key={session.id} className="p-4 bg-white rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium text-secondary-900">{session.station?.name}</p>
                    <p className="text-sm text-secondary-500">Port #{session.portId}</p>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary-500">Progress</span>
                    <span className="font-medium">{session.progress}%</span>
                  </div>
                  <ProgressBar value={session.progress} color="success" animated />
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                  <div>
                    <p className="text-secondary-500">Energy</p>
                    <p className="font-medium">{formatEnergy(session.energyDelivered)}</p>
                  </div>
                  <div>
                    <p className="text-secondary-500">Est. Cost</p>
                    <p className="font-medium">{formatCurrency(session.energyDelivered * 0.35)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <Select
            label="Status"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'completed', label: 'Completed' },
            ]}
            className="w-full md:w-40"
          />
          <Select
            label="Station"
            value={selectedStation}
            onChange={(e) => setSelectedStation(e.target.value)}
            options={[
              { value: 'all', label: 'All Stations' },
              ...stations.map(s => ({ value: s.id.toString(), label: s.name })),
            ]}
            className="w-full md:w-48"
          />
        </div>
      </div>

      {/* Sessions Table */}
      <Table
        columns={columns}
        data={filteredSessions}
        emptyMessage="No sessions found"
      />
    </div>
  );
};

export default Sessions;
