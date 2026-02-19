import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { stationsAPI, bookingsAPI, sessionsAPI, reviewsAPI, getSmartChargerRecommendation, estimateSlotDuration, estimateWaitingTime } from '../../services';
import { getAiChargingOptimization, isAiConfigured } from '../../services/aiService';
import { formatCurrency, formatDistance, getStatusColor, getStatusText, calculateChargingTime } from '../../utils';
import { Button, Badge, Modal, Select, LoadingSpinner, ProgressBar, StationRating, RatingDisplay, RatingSummary } from '../../components';
import { useNotifications, useAuth } from '../../context';
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
  Brain,
  Timer,
  AlertCircle,
  Battery,
  TrendingUp,
  Info,
  MessageSquare,
  Sparkles,
  RefreshCw,
  Settings2,
} from 'lucide-react';

const StationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useNotifications();
  const { user } = useAuth();
  
  const [station, setStation] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPort, setSelectedPort] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showChargingModal, setShowChargingModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [isCharging, setIsCharging] = useState(false);
  const [chargingProgress, setChargingProgress] = useState(0);
  const [activeSessionId, setActiveSessionId] = useState(null);
  
  // AI-based states
  const [currentBattery, setCurrentBattery] = useState(35);
  const [targetBattery, setTargetBattery] = useState(80);
  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [slotEstimate, setSlotEstimate] = useState(null);
  const [waitTimeEstimate, setWaitTimeEstimate] = useState(null);

  // AI states (neutral naming)
  const [vehicleType, setVehicleType] = useState('Car');
  const [batteryCapacity, setBatteryCapacity] = useState(60);
  const [aiReport, setAiReport] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  
  const [bookingData, setBookingData] = useState({
    date: '',
    timeSlot: '',
    chargingMode: 'normal',
  });
  const [availableSlots, setAvailableSlots] = useState([]);

  useEffect(() => {
    fetchStationDetails();
    fetchReviews();
  }, [id]);

  // Update AI recommendations when battery level changes
  useEffect(() => {
    if (station && station.ports) {
      updateAiRecommendations();
    }
  }, [currentBattery, targetBattery, station]);

  const fetchStationDetails = async () => {
    try {
      const response = await stationsAPI.getById(id);
      if (response.success && response.data) {
        setStation(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch station:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await reviewsAPI.getByStation(id);
      if (response.success) {
        setReviews(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    }
  };

  const updateAiRecommendations = () => {
    if (!station || !station.ports) return;
    
    // Get smart charger recommendation
    const recommendation = getSmartChargerRecommendation(currentBattery, 60);
    setAiRecommendation(recommendation);

    // Get slot duration estimate
    const vType = user?.vehicle?.make && user?.vehicle?.model 
      ? `${user.vehicle.make} ${user.vehicle.model}` 
      : 'default';
    const estimate = estimateSlotDuration(vType, currentBattery, targetBattery, recommendation.type);
    setSlotEstimate(estimate);

    // Get waiting time estimate
    const busyPorts = station.ports.filter(p => p.status === 'busy').length || 0;
    const totalPorts = station.ports.length || 4;
    const waitTime = estimateWaitingTime(station?.id, 0, busyPorts, totalPorts);
    setWaitTimeEstimate(waitTime);

    // Update battery capacity from user profile if available
    if (user?.vehicle?.batteryCapacity) {
      setBatteryCapacity(user.vehicle.batteryCapacity);
    }
  };

  // AI optimization (neutral naming)
  const fetchAiOptimization = useCallback(async () => {
    if (!station) return;

    setAiLoading(true);
    setAiError(null);

    // Determine charger info from selected port or first available
    const port = selectedPort || station.ports.find(p => p.status === 'available') || station.ports[0];
    const chargerType = port?.type?.includes('DC') ? 'Fast' : 'Normal';
    const chargerPower = port?.power || 22;
    const costPerKwh = port?.price ? port.price * 84 : 8; // Convert USD to ₹ approx

    const peakStart = station.peakHours?.start || '18:00';
    const peakEnd = station.peakHours?.end || '21:00';
    const formatTime12 = (t) => {
      const [h, m] = t.split(':');
      const hr = parseInt(h);
      const ampm = hr >= 12 ? 'PM' : 'AM';
      return `${hr > 12 ? hr - 12 : hr || 12}${m !== '00' ? ':' + m : ''} ${ampm}`;
    };
    const peakHoursStr = `${formatTime12(peakStart)} – ${formatTime12(peakEnd)}`;

    try {
      const result = await getAiChargingOptimization({
        vehicleType,
        batteryCapacity,
        currentPercentage: currentBattery,
        targetPercentage: targetBattery,
        chargerType,
        chargerPower,
        costPerKwh: Math.round(costPerKwh * 100) / 100,
        peakHours: peakHoursStr,
      });

      if (result.success) {
        setAiReport(result.text);
      } else {
        setAiError(result.error);
      }
    } catch (err) {
      setAiError(err.message || 'Failed to fetch AI optimization');
    } finally {
      setAiLoading(false);
    }
  }, [station, selectedPort, vehicleType, batteryCapacity, currentBattery, targetBattery]);

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
      const response = await bookingsAPI.create({
        stationId: id,
        portId: selectedPort?.id,
        date: bookingData.date,
        timeSlot: bookingData.timeSlot,
        chargingType: selectedPort?.type || 'Normal AC',
      });

      if (!response.success) {
        showToast({ type: 'error', message: response.error || 'Failed to book slot' });
        return;
      }

      showToast({ type: 'success', message: 'Booking confirmed successfully!' });
      setShowBookingModal(false);
      navigate('/user/bookings');
    } catch (error) {
      showToast({ type: 'error', message: 'Failed to book slot' });
    }
  };

  const handleStartCharging = async () => {
    if (!selectedPort) {
      showToast({ type: 'error', message: 'Select an available port first' });
      return;
    }

    try {
      const response = await sessionsAPI.startSession({
        stationId: id,
        portId: selectedPort.id,
        chargingType: selectedPort.type || 'Normal AC',
        paymentMethod: 'Wallet',
        batteryStart: currentBattery,
      });

      if (!response.success) {
        showToast({ type: 'error', message: response.error || 'Failed to start session' });
        return;
      }

      setActiveSessionId(response.data?.id || null);
      setIsCharging(true);
      setShowChargingModal(true);
      setChargingProgress(response.data?.progress || 0);
      showToast({ type: 'success', message: 'Charging session started' });
    } catch (error) {
      showToast({ type: 'error', message: 'Failed to start charging session' });
    }
  };

  const handleStopCharging = async () => {
    if (!activeSessionId) {
      showToast({ type: 'error', message: 'No active session found' });
      return;
    }

    try {
      const response = await sessionsAPI.stopSession(activeSessionId);
      if (!response.success) {
        showToast({ type: 'error', message: response.error || 'Failed to stop session' });
        return;
      }

      setIsCharging(false);
      setChargingProgress(0);
      setShowChargingModal(false);
      setActiveSessionId(null);
      showToast({ type: 'success', message: 'Charging session completed!' });
      setTimeout(() => setShowRatingModal(true), 500);
    } catch (error) {
      showToast({ type: 'error', message: 'Failed to stop charging session' });
    }
  };

  const handleRatingSubmit = async (ratingData) => {
    try {
      await reviewsAPI.create({
        stationId: id,
        ...ratingData,
      });
      showToast({ type: 'success', message: 'Thank you for your feedback!' });
      fetchReviews();
    } catch (error) {
      showToast({ type: 'error', message: 'Failed to submit rating' });
    }
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
                <h1 className="text-2xl font-bold text-white ml-4">{station.name}</h1>
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
          <div className="text-center p-4 rounded-xl" style={{ backgroundColor: '#abf7b1' }}>
            <Star className="w-6 h-6 text-amber-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-secondary-900">{station.rating}</p>
            <p className="text-sm text-secondary-500">{station.totalReviews} reviews</p>
          </div>
          <div className="text-center p-4 rounded-xl" style={{ backgroundColor: '#abf7b1' }}>
            <MapPin className="w-6 h-6 text-primary-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-secondary-900">{formatDistance(station.distance)}</p>
            <p className="text-sm text-secondary-500">Distance</p>
          </div>
          <div className="text-center p-4 rounded-xl" style={{ backgroundColor: '#abf7b1' }}>
            <Zap className="w-6 h-6 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-secondary-900">{availablePorts.length}/{station.ports.length}</p>
            <p className="text-sm text-secondary-500">Available Ports</p>
          </div>
          <div className="text-center p-4 rounded-xl" style={{ backgroundColor: '#abf7b1' }}>
            <Clock className="w-6 h-6 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-secondary-900">{station.operatingHours}</p>
            <p className="text-sm text-secondary-500">Hours</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Smart Recommendations removed — replaced by AI Charging Optimization below */}

          {/* AI Charging Optimization Report (moved up; themed like Smart Recommendations) */}
          <div className="card bg-gradient-to-br from-primary-50 to-blue-50 border-primary-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-600" />
                <h2 className="text-lg font-semibold text-secondary-900">AI Charging Optimization</h2>
                <Badge variant="info" size="sm">AI</Badge>
              </div>
              <button
                onClick={fetchAiOptimization}
                disabled={aiLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-violet-700 bg-violet-100 hover:bg-violet-200 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${aiLoading ? 'animate-spin' : ''}`} />
                {aiLoading ? 'Analyzing...' : aiReport ? 'Re-analyze' : 'Analyze'}
              </button>
            </div>

            {/* Configuration Inputs */}
            <div className="mb-4 p-4 bg-white/60 rounded-xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs font-medium text-secondary-600 mb-1 block">Vehicle Type</label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-secondary-200 rounded-lg focus:ring-2 focus:ring-violet-300 focus:border-violet-400 bg-white"
                  >
                    <option value="Car">Car</option>
                    <option value="Bike">Bike</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-secondary-600 mb-1 block">Battery Capacity (kWh)</label>
                  <input
                    type="number"
                    min="10"
                    max="200"
                    value={batteryCapacity}
                    onChange={(e) => setBatteryCapacity(parseInt(e.target.value) || 60)}
                    className="w-full px-3 py-2 text-sm border border-secondary-200 rounded-lg focus:ring-2 focus:ring-violet-300 focus:border-violet-400 bg-white"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-secondary-600 mb-1 block">Current Battery (%)</label>
                  <div className="pt-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-secondary-500">5%</span>
                      <span className="text-sm font-bold text-violet-600">{currentBattery}%</span>
                      <span className="text-xs text-secondary-500">95%</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="95"
                      value={currentBattery}
                      onChange={(e) => setCurrentBattery(parseInt(e.target.value))}
                      className="w-full h-2 bg-secondary-200 rounded-lg appearance-none cursor-pointer accent-violet-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-secondary-600 mb-1 block">Target Battery (%)</label>
                  <div className="pt-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-secondary-500">10%</span>
                      <span className="text-sm font-bold text-violet-600">{targetBattery}%</span>
                      <span className="text-xs text-secondary-500">100%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={targetBattery}
                      onChange={(e) => setTargetBattery(parseInt(e.target.value))}
                      className="w-full h-2 bg-secondary-200 rounded-lg appearance-none cursor-pointer accent-violet-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* API Key Warning */}
            {!isAiConfigured() && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
                <Settings2 className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-700">AI API Key Required</p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    Add your API key to the backend .env as <code className="px-1 py-0.5 bg-amber-100 rounded text-amber-800">AI_API_KEY</code> or to frontend env as <code className="px-1 py-0.5 bg-amber-100 rounded text-amber-800">VITE_AI_API_KEY</code>.
                  </p>
                </div>
              </div>
            )}

            {/* Error State */}
            {aiError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{aiError}</p>
              </div>
            )}

            {/* Loading State */}
            {aiLoading && (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-12 h-12 mb-3 relative">
                  <Sparkles className="w-12 h-12 text-violet-400 animate-pulse" />
                </div>
                <p className="text-sm font-medium text-violet-600">AI is analyzing your charging session...</p>
                <p className="text-xs text-secondary-500 mt-1">This may take a few seconds</p>
              </div>
            )}

            {/* AI Report Results — rendered as formatted text */}
            {aiReport && !aiLoading && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-violet-100/60 rounded-xl">
                  <Sparkles className="w-5 h-5 text-violet-600" />
                  <span className="text-sm font-semibold text-violet-800">⚡ AI Charging Optimization Report</span>
                </div>
                <div className="p-4 bg-white rounded-xl shadow-sm border border-violet-100">
                  <p className="text-sm text-secondary-800 leading-relaxed whitespace-pre-wrap">{aiReport}</p>
                </div>
              </div>
            )}

            {/* Initial Empty State */}
            {!aiReport && !aiLoading && !aiError && (
              <div className="text-center py-6">
                <Sparkles className="w-10 h-10 text-violet-300 mx-auto mb-2" />
                <p className="text-sm text-secondary-500">Click <strong>Analyze</strong> to get an AI-powered charging optimization report</p>
                <p className="text-xs text-secondary-400 mt-1">Powered by AI</p>
              </div>
            )}
          </div>

          {/* Available Charging Ports */}
          <div className="card">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">Available Charging Ports</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {station.ports.map((port) => (
                <button
                  key={port.id}
                  onClick={() => handlePortSelect(port)}
                  disabled={port.status !== 'available'}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    selectedPort?.id === port.id
                      ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                      : port.status === 'available'
                        ? 'border-secondary-200 hover:border-primary-300 hover:bg-primary-50/50 cursor-pointer'
                        : 'border-secondary-200 bg-secondary-50 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-secondary-900">Port #{port.id}</span>
                    <Badge 
                      variant={port.status === 'available' ? 'success' : port.status === 'busy' ? 'warning' : 'danger'}
                      size="sm"
                    >
                      {getStatusText(port.status)}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-secondary-600">{port.type}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-secondary-500">{port.power}kW</span>
                      <span className="text-sm font-medium text-primary-600">{formatCurrency(port.price)}/kWh</span>
                    </div>
                  </div>
                  {selectedPort?.id === port.id && (
                    <div className="mt-2 flex items-center gap-1 text-primary-600">
                      <Check className="w-4 h-4" />
                      <span className="text-xs font-medium">Selected</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

            {/* Reviews */}
            <div className="card">
              <h2 className="text-lg font-semibold text-secondary-900 mb-4">Reviews</h2>
              {reviews && reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.slice(0, 3).map((review) => (
                    <div key={review.id || review._id} className="p-4 bg-white rounded-xl shadow-sm">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-medium text-secondary-900">{review.userName}</span>
                          <div className="flex mt-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${star <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="text-sm text-secondary-500">{review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}</div>
                      </div>
                      <p className="text-sm text-secondary-600 mt-2">{review.comment}</p>
                    </div>
                  ))}

                  {reviews.length > 3 && (
                    <Button variant="outline" fullWidth icon={MessageSquare}>
                      View All {reviews.length} Reviews
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <MessageSquare className="w-10 h-10 text-secondary-300 mx-auto mb-2" />
                  <p className="text-secondary-500">No reviews yet</p>
                </div>
              )}
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
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-700 font-medium">Ensure the charging gun is securely connected to the vehicle</p>
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

      {/* Rating Modal */}
      <StationRating
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        stationName={station?.name}
        sessionId={Date.now()}
        onSubmit={handleRatingSubmit}
      />
    </div>
  );
};

export default StationDetail;
