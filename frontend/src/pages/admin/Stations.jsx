import { useState, useEffect } from 'react';
import { useNotifications } from '../../context';
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

  // Mock stations data
  const mockStations = [
    { id: 1, name: 'Downtown Hub', address: '123 Main St, City Center', operator: 'EV Charge Inc', operatorId: 1, status: 'online', ports: 8, activePorts: 6, totalSessions: 1250, revenue: 15680, rating: 4.8 },
    { id: 2, name: 'Mall Parking A', address: '456 Shopping Ave, West Mall', operator: 'GreenCharge', operatorId: 2, status: 'online', ports: 12, activePorts: 10, totalSessions: 2340, revenue: 28450, rating: 4.5 },
    { id: 3, name: 'Highway Rest Stop', address: 'I-95 Mile 125, North', operator: 'FastCharge Co', operatorId: 3, status: 'maintenance', ports: 6, activePorts: 0, totalSessions: 890, revenue: 12340, rating: 4.2 },
    { id: 4, name: 'Tech Park Station', address: '789 Innovation Dr, Tech District', operator: 'EV Charge Inc', operatorId: 1, status: 'online', ports: 10, activePorts: 8, totalSessions: 1890, revenue: 22100, rating: 4.7 },
    { id: 5, name: 'Airport Terminal', address: 'Airport Rd, Terminal 3', operator: 'AirCharge', operatorId: 4, status: 'online', ports: 20, activePorts: 15, totalSessions: 4560, revenue: 56780, rating: 4.6 },
    { id: 6, name: 'University Campus', address: '321 College St, Campus Center', operator: 'GreenCharge', operatorId: 2, status: 'offline', ports: 4, activePorts: 0, totalSessions: 560, revenue: 6780, rating: 4.3 },
    { id: 7, name: 'City Hospital', address: '555 Healthcare Blvd', operator: 'MedCharge', operatorId: 5, status: 'online', ports: 6, activePorts: 4, totalSessions: 780, revenue: 9450, rating: 4.4 },
    { id: 8, name: 'Sports Arena', address: '100 Stadium Way', operator: 'FastCharge Co', operatorId: 3, status: 'pending', ports: 16, activePorts: 0, totalSessions: 0, revenue: 0, rating: 0 },
  ];

  const operators = [
    { id: 1, name: 'EV Charge Inc' },
    { id: 2, name: 'GreenCharge' },
    { id: 3, name: 'FastCharge Co' },
    { id: 4, name: 'AirCharge' },
    { id: 5, name: 'MedCharge' },
  ];

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setStations(mockStations);
    } catch (error) {
      console.error('Failed to fetch stations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStations = stations.filter(station => {
    const matchesSearch = station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         station.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || station.status === statusFilter;
    const matchesOperator = operatorFilter === 'all' || station.operatorId === parseInt(operatorFilter);
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
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setStations(prev => prev.filter(s => s.id !== selectedStation.id));
      showToast({ type: 'success', message: 'Station deleted successfully!' });
      setShowDeleteModal(false);
      setSelectedStation(null);
    } catch (error) {
      showToast({ type: 'error', message: 'Failed to delete station' });
    }
  };

  const handleToggleStatus = async (station) => {
    const newStatus = station.status === 'online' ? 'offline' : 'online';
    try {
      setStations(prev => prev.map(s => 
        s.id === station.id ? { ...s, status: newStatus, activePorts: newStatus === 'offline' ? 0 : s.ports } : s
      ));
      showToast({ 
        type: 'success', 
        message: `Station ${newStatus === 'online' ? 'brought online' : 'taken offline'} successfully!` 
      });
    } catch (error) {
      showToast({ type: 'error', message: 'Failed to update station status' });
    }
  };

  const handleApproveStation = async (station) => {
    try {
      setStations(prev => prev.map(s => 
        s.id === station.id ? { ...s, status: 'online', activePorts: s.ports } : s
      ));
      showToast({ type: 'success', message: 'Station approved and brought online!' });
    } catch (error) {
      showToast({ type: 'error', message: 'Failed to approve station' });
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      online: 'success',
      offline: 'danger',
      maintenance: 'warning',
      pending: 'info',
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
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
          {row.status === 'pending' && (
            <button
              onClick={() => handleApproveStation(row)}
              className="p-2 text-secondary-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Approve"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
          {row.status !== 'pending' && row.status !== 'maintenance' && (
            <button
              onClick={() => handleToggleStatus(row)}
              className={`p-2 rounded-lg transition-colors ${
                row.status === 'online'
                  ? 'text-secondary-500 hover:text-red-600 hover:bg-red-50'
                  : 'text-secondary-500 hover:text-green-600 hover:bg-green-50'
              }`}
              title={row.status === 'online' ? 'Take Offline' : 'Bring Online'}
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
    online: stations.filter(s => s.status === 'online').length,
    offline: stations.filter(s => s.status === 'offline').length,
    pending: stations.filter(s => s.status === 'pending').length,
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
          <h1 className="text-2xl font-bold text-secondary-900">Station Management</h1>
          <p className="text-secondary-500 mt-1">Manage all charging stations</p>
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
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-900">{stats.total}</p>
              <p className="text-sm text-secondary-500">Total Stations</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-900">{stats.online}</p>
              <p className="text-sm text-secondary-500">Online</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-900">{stats.activePorts}/{stats.totalPorts}</p>
              <p className="text-sm text-secondary-500">Active Ports</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-900">{formatCurrency(stats.totalRevenue)}</p>
              <p className="text-sm text-secondary-500">Total Revenue</p>
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
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="maintenance">Maintenance</option>
              <option value="pending">Pending</option>
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
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="maintenance">Maintenance</option>
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
                  showToast({ type: 'success', message: 'Station updated successfully!' });
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
