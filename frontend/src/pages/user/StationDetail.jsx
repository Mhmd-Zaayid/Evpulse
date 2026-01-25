import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { stationsAPI, bookingsAPI } from '../../services';
import { formatCurrency, formatDistance, getStatusColor, getStatusText, calculateChargingTime } from '../../utils';
import { Button, Badge, Modal, Select, LoadingSpinner, ProgressBar } from '../../components';
import { useNotifications } from '../../context';
import {
  ArrowLeft,
  MapPin,
  Star,
  Clock,
  Zap,
  Wifi,
  Car,
  Coffee,
  ShowerHead,
  ShoppingBag,
  Calendar,
  Play,
  ChevronRight,
  Check,
} from 'lucide-react';

const StationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useNotifications();
  
  const [station, setStation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPort, setSelectedPort] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showChargingModal, setShowChargingModal] = useState(false);
  const [isCharging, setIsCharging] = useState(false);
  const [chargingProgress, setChargingProgress] = useState(0);
  
  const [bookingData, setBookingData] = useState({
    date: '',
    timeSlot: '',
    chargingMode: 'normal',
  });
  const [availableSlots, setAvailableSlots] = useState([]);

  useEffect(() => {
    fetchStationDetails();
  }, [id]);

  const fetchStationDetails = async () => {
    try {
      const response = await stationsAPI.getById(id);
      if (response.success) {
        setStation(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch station:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePortSelect = (port) => {
    if (port.status === 'available') {
      setSelectedPort(port);
    }
  };

  const handleBookSlot = async () => {
    if (!bookingData.date || !bookingData.timeSlot) {
      showToast({ type: 'error', message: 'Please select date and time slot' });
      return;
    }

    try {
      showToast({ type: 'success', message: 'Booking confirmed successfully!' });
      setShowBookingModal(false);
      navigate('/user/bookings');
    } catch (error) {
      showToast({ type: 'error', message: 'Failed to book slot' });
    }
  };

  const handleStartCharging = () => {
    setIsCharging(true);
    setShowChargingModal(true);
    
    // Simulate charging progress
    const interval = setInterval(() => {
      setChargingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 500);
  };

  const handleStopCharging = () => {
    setIsCharging(false);
    setChargingProgress(0);
    setShowChargingModal(false);
    showToast({ type: 'success', message: 'Charging session completed!' });
  };

  const fetchAvailableSlots = async (date) => {
    const response = await bookingsAPI.getAvailableSlots(id, date);
    setAvailableSlots(response.data);
  };

  const handleDateChange = (e) => {
    const date = e.target.value;
    setBookingData(prev => ({ ...prev, date, timeSlot: '' }));
    fetchAvailableSlots(date);
  };

  const getAmenityIcon = (amenity) => {
    const icons = {
      'WiFi': Wifi,
      'Parking': Car,
      'Cafe': Coffee,
      'Restroom': ShowerHead,
      'Shop': ShoppingBag,
      'Mall Access': ShoppingBag,
      'Food Court': Coffee,
      'Vending Machine': ShoppingBag,
    };
    return icons[amenity] || Wifi;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!station) {
    return (
      <div className="text-center py-20">
        <p className="text-secondary-500">Station not found</p>
        <Button variant="primary" onClick={() => navigate('/user/stations')} className="mt-4">
          Back to Stations
        </Button>
      </div>
    );
  }

  const availablePorts = station.ports.filter(p => p.status === 'available');

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/user/stations')}
        className="flex items-center gap-2 text-secondary-600 hover:text-secondary-900 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Stations</span>
      </button>

      {/* Station Header */}
      <div className="card overflow-hidden">
        <div className="relative h-48 -mx-6 -mt-6 mb-6">
          <img
            src={station.image}
            alt={station.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/800x200?text=EV+Station';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-6 right-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">{station.name}</h1>
                <div className="flex items-center gap-2 mt-1 text-white/80">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{station.address}</span>
                </div>
              </div>
              <Badge variant={station.status === 'available' ? 'success' : station.status === 'busy' ? 'warning' : 'danger'} size="lg">
                {getStatusText(station.status)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-secondary-50 rounded-xl">
            <Star className="w-6 h-6 text-amber-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-secondary-900">{station.rating}</p>
            <p className="text-sm text-secondary-500">{station.totalReviews} reviews</p>
          </div>
          <div className="text-center p-4 bg-secondary-50 rounded-xl">
            <MapPin className="w-6 h-6 text-primary-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-secondary-900">{formatDistance(station.distance)}</p>
            <p className="text-sm text-secondary-500">Distance</p>
          </div>
          <div className="text-center p-4 bg-secondary-50 rounded-xl">
            <Zap className="w-6 h-6 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-secondary-900">{availablePorts.length}/{station.ports.length}</p>
            <p className="text-sm text-secondary-500">Available Ports</p>
          </div>
          <div className="text-center p-4 bg-secondary-50 rounded-xl">
            <Clock className="w-6 h-6 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-secondary-900">{station.operatingHours}</p>
            <p className="text-sm text-secondary-500">Hours</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Charging Ports */}
          <div className="card">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">Charging Ports</h2>
            <div className="space-y-3">
              {station.ports.map((port) => (
                <div
                  key={port.id}
                  onClick={() => handlePortSelect(port)}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    selectedPort?.id === port.id
                      ? 'border-primary-500 bg-primary-50'
                      : port.status === 'available'
                      ? 'border-secondary-200 hover:border-primary-300 hover:bg-secondary-50'
                      : 'border-secondary-200 bg-secondary-50 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        port.status === 'available' ? 'bg-green-100' : 
                        port.status === 'busy' ? 'bg-amber-100' : 'bg-secondary-200'
                      }`}>
                        <Zap className={`w-6 h-6 ${
                          port.status === 'available' ? 'text-green-600' : 
                          port.status === 'busy' ? 'text-amber-600' : 'text-secondary-400'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium text-secondary-900">Port #{port.id}</p>
                        <p className="text-sm text-secondary-500">{port.type} • {port.power}kW</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={port.status === 'available' ? 'success' : port.status === 'busy' ? 'warning' : 'danger'}>
                        {getStatusText(port.status)}
                      </Badge>
                      <p className="text-sm text-secondary-600 mt-1">
                        {formatCurrency(port.price)}/kWh
                      </p>
                    </div>
                  </div>
                  
                  {selectedPort?.id === port.id && (
                    <div className="mt-4 pt-4 border-t border-primary-200">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-secondary-500">Est. Time (50kWh)</p>
                          <p className="font-medium">{calculateChargingTime(50, port.power)}</p>
                        </div>
                        <div>
                          <p className="text-secondary-500">Est. Cost</p>
                          <p className="font-medium">{formatCurrency(50 * port.price)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div className="card">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">Pricing</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {station.pricing.normal && (
                <div className="p-4 bg-secondary-50 rounded-xl">
                  <h3 className="font-medium text-secondary-900 mb-2">Normal AC Charging</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-secondary-500">Base Rate</span>
                      <span className="font-medium">{formatCurrency(station.pricing.normal.base)}/kWh</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-500">Peak Hours ({station.peakHours.start} - {station.peakHours.end})</span>
                      <span className="font-medium">{formatCurrency(station.pricing.normal.peak)}/kWh</span>
                    </div>
                  </div>
                </div>
              )}
              {station.pricing.fast && (
                <div className="p-4 bg-primary-50 rounded-xl">
                  <h3 className="font-medium text-secondary-900 mb-2">Fast DC Charging</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-secondary-500">Base Rate</span>
                      <span className="font-medium">{formatCurrency(station.pricing.fast.base)}/kWh</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-500">Peak Hours ({station.peakHours.start} - {station.peakHours.end})</span>
                      <span className="font-medium">{formatCurrency(station.pricing.fast.peak)}/kWh</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Action Card */}
          <div className="card">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">Start Charging</h2>
            {selectedPort ? (
              <div className="space-y-4">
                <div className="p-3 bg-primary-50 rounded-xl">
                  <p className="text-sm text-secondary-600">Selected Port</p>
                  <p className="font-medium text-secondary-900">
                    Port #{selectedPort.id} • {selectedPort.type}
                  </p>
                </div>
                <Button 
                  fullWidth 
                  icon={Play}
                  onClick={handleStartCharging}
                  disabled={isCharging}
                >
                  Start Now
                </Button>
                <Button 
                  variant="outline" 
                  fullWidth 
                  icon={Calendar}
                  onClick={() => setShowBookingModal(true)}
                >
                  Book for Later
                </Button>
              </div>
            ) : (
              <p className="text-secondary-500 text-center py-4">
                Select an available port to continue
              </p>
            )}
          </div>

          {/* Amenities */}
          <div className="card">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">Amenities</h2>
            <div className="grid grid-cols-2 gap-3">
              {station.amenities.map((amenity) => {
                const Icon = getAmenityIcon(amenity);
                return (
                  <div key={amenity} className="flex items-center gap-2 p-2 bg-secondary-50 rounded-lg">
                    <Icon className="w-4 h-4 text-secondary-500" />
                    <span className="text-sm text-secondary-700">{amenity}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Location */}
          <div className="card">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">Location</h2>
            <div className="h-40 bg-secondary-100 rounded-xl flex items-center justify-center mb-3">
              <MapPin className="w-8 h-8 text-secondary-400" />
            </div>
            <p className="text-sm text-secondary-600">{station.address}, {station.city}</p>
            <Button variant="outline" fullWidth className="mt-3">
              Get Directions
            </Button>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <Modal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        title="Book Charging Slot"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="input-label">Select Date</label>
            <input
              type="date"
              value={bookingData.date}
              onChange={handleDateChange}
              min={new Date().toISOString().split('T')[0]}
              className="input-field"
            />
          </div>

          {bookingData.date && (
            <div>
              <label className="input-label">Available Time Slots</label>
              <div className="grid grid-cols-3 gap-2">
                {availableSlots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setBookingData(prev => ({ ...prev, timeSlot: slot }))}
                    className={`p-2 text-sm rounded-lg border transition-colors ${
                      bookingData.timeSlot === slot
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-secondary-200 hover:border-primary-300'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Select
            label="Charging Mode"
            value={bookingData.chargingMode}
            onChange={(e) => setBookingData(prev => ({ ...prev, chargingMode: e.target.value }))}
            options={[
              { value: 'normal', label: 'Normal Charging' },
              { value: 'fast', label: 'Fast Charging' },
            ]}
          />

          {selectedPort && bookingData.timeSlot && (
            <div className="p-4 bg-secondary-50 rounded-xl">
              <h3 className="font-medium text-secondary-900 mb-2">Booking Summary</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-secondary-500">Station</span>
                  <span>{station.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-500">Port</span>
                  <span>#{selectedPort.id} - {selectedPort.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-500">Date & Time</span>
                  <span>{bookingData.date} • {bookingData.timeSlot}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-secondary-200 mt-2">
                  <span className="font-medium">Estimated Cost</span>
                  <span className="font-bold text-primary-600">{formatCurrency(15.75)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="secondary" fullWidth onClick={() => setShowBookingModal(false)}>
              Cancel
            </Button>
            <Button fullWidth onClick={handleBookSlot}>
              Confirm Booking
            </Button>
          </div>
        </div>
      </Modal>

      {/* Charging Modal */}
      <Modal
        isOpen={showChargingModal}
        onClose={() => {}}
        title="Charging in Progress"
        size="md"
        showCloseButton={false}
      >
        <div className="text-center py-4">
          <div className="w-32 h-32 mx-auto mb-6 relative">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="#e2e8f0"
                strokeWidth="12"
                fill="none"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="#22c55e"
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${chargingProgress * 3.52} 352`}
                className="transition-all duration-300"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div>
                <span className="text-3xl font-bold text-secondary-900">{chargingProgress}%</span>
                <p className="text-sm text-secondary-500">Charged</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-secondary-900">{(chargingProgress * 0.5).toFixed(1)}</p>
              <p className="text-sm text-secondary-500">kWh Delivered</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-secondary-900">{Math.round((100 - chargingProgress) * 0.3)}</p>
              <p className="text-sm text-secondary-500">Minutes Left</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-600">{formatCurrency(chargingProgress * 0.175)}</p>
              <p className="text-sm text-secondary-500">Current Cost</p>
            </div>
          </div>

          {chargingProgress < 100 ? (
            <Button variant="danger" fullWidth onClick={handleStopCharging}>
              Stop Charging
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-green-600">
                <Check className="w-5 h-5" />
                <span className="font-medium">Charging Complete!</span>
              </div>
              <Button fullWidth onClick={handleStopCharging}>
                Finish & Pay
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default StationDetail;
