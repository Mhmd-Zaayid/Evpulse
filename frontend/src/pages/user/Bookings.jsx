import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useNotifications } from '../../context';
import { bookingsAPI } from '../../services';
import { chargingStations } from '../../services/mockData';
import { formatCurrency, formatDate, getStatusColor, getStatusText } from '../../utils';
import { Button, Badge, Modal, Table, EmptyState, LoadingSpinner } from '../../components';
import { Calendar, Clock, MapPin, Zap, X, ChevronRight, Plus } from 'lucide-react';

const Bookings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useNotifications();
  
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await bookingsAPI.getByUser(user.id);
      const bookingsData = response.data || [];
      // Enrich bookings with station data
      const enrichedBookings = bookingsData.map(booking => ({
        ...booking,
        station: chargingStations.find(s => s.id === booking.stationId),
      }));
      setBookings(enrichedBookings);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    try {
      await bookingsAPI.cancel(selectedBooking.id);
      setBookings(prev => prev.filter(b => b.id !== selectedBooking.id));
      setShowCancelModal(false);
      setSelectedBooking(null);
      showToast({ type: 'success', message: 'Booking cancelled successfully' });
    } catch (error) {
      showToast({ type: 'error', message: 'Failed to cancel booking' });
    }
  };

  const upcomingBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending');
  const pastBookings = bookings.filter(b => b.status === 'completed' || b.status === 'cancelled');

  const displayBookings = activeTab === 'upcoming' ? upcomingBookings : pastBookings;

  const columns = [
    {
      key: 'station',
      label: 'Station',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <p className="font-medium text-secondary-900">{row.station?.name}</p>
            <p className="text-sm text-secondary-500">{row.station?.address}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'dateTime',
      label: 'Date & Time',
      render: (_, row) => (
        <div>
          <p className="font-medium text-secondary-900">{formatDate(row.date)}</p>
          <p className="text-sm text-secondary-500">{row.timeSlot}</p>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Charging Type',
      render: (_, row) => (
        <Badge variant={row.chargingType === 'Fast DC' ? 'primary' : 'default'}>
          {row.chargingType}
        </Badge>
      ),
    },
    {
      key: 'cost',
      label: 'Est. Cost',
      render: (_, row) => (
        <span className="font-medium text-secondary-900">
          {formatCurrency(row.estimatedCost)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_, row) => (
        <Badge variant={row.status === 'confirmed' ? 'success' : row.status === 'pending' ? 'warning' : 'default'}>
          {getStatusText(row.status)}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          {(row.status === 'confirmed' || row.status === 'pending') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedBooking(row);
                setShowCancelModal(true);
              }}
            >
              Cancel
            </Button>
          )}
          <ChevronRight className="w-5 h-5 text-secondary-400" />
        </div>
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
          <h1 className="text-2xl font-bold text-secondary-900 ml-4">My Bookings</h1>
          <p className="text-secondary-500 mt-1 ml-4">Manage your charging slot reservations</p>
        </div>
        <Button icon={Plus} onClick={() => navigate('/user/stations')}>
          New Booking
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 border border-green-500/20 shadow-lg shadow-green-500/10 hover:shadow-xl hover:shadow-green-500/20 transition-all duration-300 hover:scale-[1.02]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-300 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Calendar className="w-6 h-6 text-green-900" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white drop-shadow-md">{upcomingBookings.length}</p>
              <p className="text-sm text-emerald-100/80 drop-shadow-sm">Upcoming</p>
            </div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 border border-green-500/20 shadow-lg shadow-green-500/10 hover:shadow-xl hover:shadow-green-500/20 transition-all duration-300 hover:scale-[1.02]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-300 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Zap className="w-6 h-6 text-green-900" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white drop-shadow-md">
                {bookings.filter(b => b.status === 'completed').length}
              </p>
              <p className="text-sm text-emerald-100/80 drop-shadow-sm">Completed</p>
            </div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 border border-green-500/20 shadow-lg shadow-green-500/10 hover:shadow-xl hover:shadow-green-500/20 transition-all duration-300 hover:scale-[1.02]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-300 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Clock className="w-6 h-6 text-green-900" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white drop-shadow-md">
                {formatCurrency(bookings.reduce((sum, b) => sum + b.estimatedCost, 0))}
              </p>
              <p className="text-sm text-emerald-100/80 drop-shadow-sm">Total Bookings Value</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-secondary-200">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'upcoming'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-secondary-500 hover:text-secondary-700'
          }`}
        >
          Upcoming ({upcomingBookings.length})
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'past'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-secondary-500 hover:text-secondary-700'
          }`}
        >
          Past ({pastBookings.length})
        </button>
      </div>

      {/* Bookings List */}
      {displayBookings.length > 0 ? (
        <Table
          columns={columns}
          data={displayBookings}
          onRowClick={(row) => navigate(`/user/stations/${row.stationId}`)}
        />
      ) : (
        <EmptyState
          icon={Calendar}
          title={activeTab === 'upcoming' ? 'No upcoming bookings' : 'No past bookings'}
          description={
            activeTab === 'upcoming'
              ? 'Book a charging slot to get started'
              : 'Your completed and cancelled bookings will appear here'
          }
          action={
            activeTab === 'upcoming' && (
              <Button onClick={() => navigate('/user/stations')}>
                Find a Station
              </Button>
            )
          }
        />
      )}

      {/* Cancel Booking Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setSelectedBooking(null);
        }}
        title="Cancel Booking"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-secondary-600">
            Are you sure you want to cancel this booking?
          </p>
          
          {selectedBooking && (
            <div className="p-4 bg-secondary-50 rounded-xl">
              <p className="font-medium text-secondary-900">{selectedBooking.station?.name}</p>
              <p className="text-sm text-secondary-500 mt-1">
                {formatDate(selectedBooking.date)} • {selectedBooking.timeSlot}
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                setShowCancelModal(false);
                setSelectedBooking(null);
              }}
            >
              Keep Booking
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={handleCancelBooking}
            >
              Cancel Booking
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Bookings;
