import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useNotifications } from '../../context';
import { adminAPI } from '../../services';
import { formatCurrency, formatDate } from '../../utils';
import { Button, Input, Select, Modal, Table, Badge, EmptyState, LoadingSpinner } from '../../components';
import {
  Building2,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  MapPin,
  Zap,
  DollarSign,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  Power,
  Settings,
} from 'lucide-react';

const Stations = () => {
  const { showToast } = useNotifications();
  const [searchParams] = useSearchParams();
  const normalizeSearchValue = (value) =>
    String(value || '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ');
  
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [operatorFilter, setOperatorFilter] = useState('all');
  const [showStationModal, setShowStationModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const operators = [...new Map(stations.map((s) => [s.operatorId, { id: s.operatorId, name: s.operator || 'Unknown Operator' }])).values()]
    .filter((operator) => operator.id);

  useEffect(() => {
    fetchStations();
  }, []);

  useEffect(() => {
    const cityQuery = searchParams.get('city') || '';
    setSearchQuery(cityQuery);
    setCurrentPage(1);
  }, [searchParams]);

  const fetchStations = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getAllStations();
      if (response?.success) {
        const mappedStations = (response.data || []).map((station) => {
          const ports = Array.isArray(station.ports) ? station.ports : [];
          const activePorts = ports.filter((port) => port.status !== 'offline').length;
          return {
            id: station.id,
            name: station.name || 'Unknown Station',
            address: station.address || 'N/A',
            city: station.city || station.location?.city || '',
            operator: station.operatorName || station.operator || 'Unknown Operator',
            operatorId: station.operatorId || '',
            status: station.status || 'offline',
            ports: ports.length,
            activePorts,
            totalSessions: 0,
            revenue: 0,
            rating: station.rating || 0,
          };
        });
        setStations(mappedStations);
      } else {
        setStations([]);
        showToast({ type: 'error', message: response?.error || 'Failed to fetch stations' });
      }
    } catch (error) {
      setStations([]);
      showToast({ type: 'error', message: 'Failed to fetch stations' });
    } finally {
      setLoading(false);
    }
  };

  const filteredStations = stations.filter(station => {
    const normalizedSearchQuery = normalizeSearchValue(searchQuery);
    const matchesSearch = normalizeSearchValue(station.name).includes(normalizedSearchQuery) ||
                         normalizeSearchValue(station.address).includes(normalizedSearchQuery) ||
                         normalizeSearchValue(station.city).includes(normalizedSearchQuery);
    const matchesStatus = statusFilter === 'all' || station.status === statusFilter;
    const matchesOperator = operatorFilter === 'all' || station.operatorId === operatorFilter;
    return matchesSearch && matchesStatus && matchesOperator;
  });

  const paginatedStations = filteredStations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleEditStation = (station) => {
    setSelectedStation(station);
    setShowStationModal(true);
  };

  const handleDeleteStation = (station) => {
    setSelectedStation(station);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    showToast({ type: 'error', message: 'Station deletion API is not available yet' });
    setShowDeleteModal(false);
    setSelectedStation(null);
  };

  const handleToggleStatus = async (station) => {
    const newStatus = station.status === 'offline' ? 'available' : 'offline';
    try {
      const response = await adminAPI.updateStationStatus(station.id, newStatus);
      if (response?.success) {
        showToast({ 
          type: 'success', 
          message: `Station ${newStatus === 'offline' ? 'taken offline' : 'brought online'} successfully!` 
        });
        await fetchStations();
      } else {
        showToast({ type: 'error', message: response?.error || 'Failed to update station status' });
      }
    } catch (error) {
      showToast({ type: 'error', message: 'Failed to update station status' });
    }
  };

  const handleApproveStation = async (station) => {
    try {
      const response = await adminAPI.updateStationStatus(station.id, 'available');
      if (response?.success) {
        showToast({ type: 'success', message: 'Station approved and brought online!' });
        await fetchStations();
      } else {
        showToast({ type: 'error', message: response?.error || 'Failed to approve station' });
      }
    } catch (error) {
      showToast({ type: 'error', message: 'Failed to approve station' });
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      available: 'success',
      busy: 'warning',
      offline: 'danger',
      maintenance: 'warning',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const columns = [
    {
      key: 'name',
      label: 'Station',
      render: (value, row) => (
        <div>
          <p className="font-medium text-secondary-900">{value}</p>
          <div className="flex items-center gap-1 text-sm text-secondary-500">
            <MapPin className="w-3 h-3" />
            <span className="truncate max-w-[200px]">{row.address}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'operator',
      label: 'Operator',
      render: (value) => (
        <span className="text-secondary-700">{value}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => getStatusBadge(value),
    },
    {
      key: 'ports',
      label: 'Ports',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <span className="text-secondary-900">{row.activePorts}/{value}</span>
          <div className="w-16 h-2 bg-secondary-200 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${
                row.activePorts === 0 ? 'bg-secondary-300' :
                row.activePorts === value ? 'bg-green-500' : 'bg-amber-500'
              }`}
              style={{ width: `${(row.activePorts / value) * 100}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'totalSessions',
      label: 'Sessions',
      render: (value) => value.toLocaleString(),
    },
    {
      key: 'revenue',
      label: 'Revenue',
      render: (value) => formatCurrency(value),
    },
    {
      key: 'rating',
      label: 'Rating',
      render: (value) => value > 0 ? (
        <div className="flex items-center gap-1">
          <span className="text-amber-500">★</span>
          <span>{value.toFixed(1)}</span>
        </div>
      ) : '-',
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEditStation(row)}
            className="p-2 text-secondary-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          {row.status !== 'maintenance' && (
            <button
              onClick={() => handleToggleStatus(row)}
              className={`p-2 rounded-lg transition-colors ${
                row.status !== 'offline'
                  ? 'text-secondary-500 hover:text-red-600 hover:bg-red-50'
                  : 'text-secondary-500 hover:text-green-600 hover:bg-green-50'
              }`}
              title={row.status !== 'offline' ? 'Take Offline' : 'Bring Online'}
            >
              <Power className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => handleDeleteStation(row)}
            className="p-2 text-secondary-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const stats = {
    total: stations.length,
    online: stations.filter(s => s.status === 'available' || s.status === 'busy').length,
    offline: stations.filter(s => s.status === 'offline').length,
    pending: 0,
    totalPorts: stations.reduce((acc, s) => acc + s.ports, 0),
    activePorts: stations.reduce((acc, s) => acc + s.activePorts, 0),
    totalRevenue: stations.reduce((acc, s) => acc + s.revenue, 0),
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 ml-4">Station Management</h1>
          <p className="text-secondary-500 mt-1 ml-4">Manage all charging stations</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" icon={Download}>
            Export
          </Button>
          <Button icon={Plus}>
            Add Station
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl shadow-lg shadow-green-500/10 p-5 border border-green-500/20 bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/20 hover:scale-[1.02]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-300 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-sm text-emerald-100/80">Total Stations</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl shadow-lg shadow-green-500/10 p-5 border border-green-500/20 bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/20 hover:scale-[1.02]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-300 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.online}</p>
              <p className="text-sm text-emerald-100/80">Online</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl shadow-lg shadow-green-500/10 p-5 border border-green-500/20 bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/20 hover:scale-[1.02]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-300 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.activePorts}/{stats.totalPorts}</p>
              <p className="text-sm text-emerald-100/80">Active Ports</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl shadow-lg shadow-green-500/10 p-5 border border-green-500/20 bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/20 hover:scale-[1.02]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-300 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalRevenue)}</p>
              <p className="text-sm text-emerald-100/80">Total Revenue</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search stations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={Search}
            />
          </div>
          <div className="flex gap-3">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-40"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="busy">Busy</option>
              <option value="offline">Offline</option>
            </Select>
            <Select
              value={operatorFilter}
              onChange={(e) => setOperatorFilter(e.target.value)}
              className="w-48"
            >
              <option value="all">All Operators</option>
              {operators.map(op => (
                <option key={op.id} value={op.id}>{op.name}</option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {/* Stations Table */}
      {paginatedStations.length > 0 ? (
        <Table
          columns={columns}
          data={paginatedStations}
          pagination={{
            currentPage,
            totalPages: Math.ceil(filteredStations.length / itemsPerPage),
            from: (currentPage - 1) * itemsPerPage + 1,
            to: Math.min(currentPage * itemsPerPage, filteredStations.length),
            total: filteredStations.length,
            onPageChange: setCurrentPage,
          }}
        />
      ) : (
        <EmptyState
          icon={Building2}
          title="No stations found"
          description="Try adjusting your search or filters"
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedStation(null);
        }}
        title="Delete Station"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-secondary-600">
            Are you sure you want to delete <strong>{selectedStation?.name}</strong>? This will also remove all associated data.
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedStation(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={handleConfirmDelete}
            >
              Delete Station
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Station Modal */}
      <Modal
        isOpen={showStationModal}
        onClose={() => {
          setShowStationModal(false);
          setSelectedStation(null);
        }}
        title="Edit Station"
        size="lg"
      >
        {selectedStation && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Station Name"
                defaultValue={selectedStation.name}
              />
              <Select label="Operator" defaultValue={selectedStation.operatorId}>
                {operators.map(op => (
                  <option key={op.id} value={op.id}>{op.name}</option>
                ))}
              </Select>
            </div>
            <Input
              label="Address"
              defaultValue={selectedStation.address}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Number of Ports"
                type="number"
                defaultValue={selectedStation.ports}
              />
              <Select label="Status" defaultValue={selectedStation.status}>
                <option value="available">Available</option>
                <option value="busy">Busy</option>
                <option value="offline">Offline</option>
              </Select>
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  setShowStationModal(false);
                  setSelectedStation(null);
                }}
              >
                Cancel
              </Button>
              <Button
                fullWidth
                onClick={() => {
                    showToast({ type: 'info', message: 'Station edit API is not available yet' });
                  setShowStationModal(false);
                  setSelectedStation(null);
                }}
              >
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Stations;
