import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { stationsAPI } from '../../services';
import { useNotifications } from '../../context';
import { formatDistance, formatStationAddress } from '../../utils';
import { StationCard, Button, Select, Input, LoadingSpinner, EmptyState } from '../../components';
import { 
  Search, 
  MapPin, 
  List, 
  Map, 
  Filter, 
  Zap, 
  Navigation,
  SlidersHorizontal,
  X 
} from 'lucide-react';

const StationDiscovery = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useNotifications();
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [filters, setFilters] = useState({
    status: 'all',
    chargingType: 'all',
    maxDistance: 50,
    sortBy: 'distance',
  });

  const cityQueryFromUrl = (searchParams.get('city') || '').trim();
  const normalizeSearchValue = (value) =>
    String(value || '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ');

  useEffect(() => {
    fetchStations();
  }, [filters, cityQueryFromUrl]);

  useEffect(() => {
    setSearchQuery(cityQueryFromUrl);
  }, [cityQueryFromUrl]);

  const fetchStations = async () => {
    setLoading(true);
    try {
      const apiFilters = cityQueryFromUrl
        ? { ...filters, maxDistance: undefined }
        : filters;

      const response = await stationsAPI.getAll(apiFilters);
      if (response?.success) {
        const normalizedStations = (response.data || []).map((station) => ({
          ...station,
          name: station?.name || 'Unnamed Station',
          address: formatStationAddress(station),
          ports: Array.isArray(station?.ports) ? station.ports : [],
          amenities: Array.isArray(station?.amenities) ? station.amenities : [],
          pricing: station?.pricing || {},
        }));
        setStations(normalizedStations);
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

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const normalizedSearchQuery = normalizeSearchValue(searchQuery);

  const filteredStations = stations.filter((station) => {
    const stationCity = normalizeSearchValue(station.city || station.location?.city);
    return stationCity.includes(normalizedSearchQuery);
  });

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'available', label: 'Available' },
    { value: 'busy', label: 'Busy' },
    { value: 'offline', label: 'Offline' },
  ];

  const chargingTypeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'fast', label: 'Fast DC' },
    { value: 'normal', label: 'Normal AC' },
  ];

  const sortOptions = [
    { value: 'distance', label: 'Distance' },
    { value: 'rating', label: 'Rating' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 ml-4">Find Charging Stations</h1>
          <p className="text-secondary-500 mt-1 ml-4">Discover nearby EV charging stations</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2.5 rounded-xl transition-colors ${
              viewMode === 'list' 
                ? 'bg-primary-500 text-white' 
                : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
            }`}
          >
            <List className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`p-2.5 rounded-xl transition-colors ${
              viewMode === 'map' 
                ? 'bg-primary-500 text-white' 
                : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
            }`}
          >
            <Map className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="card">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
            <input
              type="text"
              placeholder="Search by city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-secondary-50 border border-secondary-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-3">
            <Select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              options={statusOptions}
              className="w-36"
            />
            <Select
              value={filters.chargingType}
              onChange={(e) => handleFilterChange('chargingType', e.target.value)}
              options={chargingTypeOptions}
              className="w-36"
            />
            <Button
              variant="secondary"
              icon={SlidersHorizontal}
              onClick={() => setShowFilters(!showFilters)}
            >
              <span className="hidden sm:inline">More Filters</span>
            </Button>
          </div>
        </div>

        {/* Extended Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-secondary-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="input-label">Max Distance</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={filters.maxDistance}
                    onChange={(e) => handleFilterChange('maxDistance', parseInt(e.target.value))}
                    className="flex-1 accent-primary-500"
                  />
                  <span className="text-sm text-secondary-600 w-16">
                    {filters.maxDistance} km
                  </span>
                </div>
              </div>
              <Select
                label="Sort By"
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                options={sortOptions}
              />
              <div className="flex items-end">
                <Button
                  variant="ghost"
                  onClick={() => setFilters({
                    status: 'all',
                    chargingType: 'all',
                    maxDistance: 50,
                    sortBy: 'distance',
                  })}
                >
                  Reset Filters
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-secondary-600">
          Found <span className="font-semibold text-secondary-900">{filteredStations.length}</span> stations
        </p>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : viewMode === 'list' ? (
        /* List View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStations.length > 0 ? (
            filteredStations.map((station) => (
              <StationCard
                key={station.id}
                station={station}
                onClick={() => navigate(`/user/stations/${station.id}`)}
              />
            ))
          ) : (
            <div className="col-span-full">
              <EmptyState
                icon={MapPin}
                title="No stations found"
                description="Try adjusting your filters or search query"
                action={
                  <Button variant="primary" onClick={() => {
                    setSearchQuery('');
                    setFilters({
                      status: 'all',
                      chargingType: 'all',
                      maxDistance: 50,
                      sortBy: 'distance',
                    });
                  }}>
                    Clear Filters
                  </Button>
                }
              />
            </div>
          )}
        </div>
      ) : (
        /* Map View */
        <div className="card p-0 overflow-hidden">
          <div className="relative h-[600px] bg-secondary-100">
            {/* Map Placeholder */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Navigation className="w-16 h-16 text-secondary-400 mx-auto mb-3" />
                <p className="text-lg font-medium text-secondary-600">Interactive Map View</p>
                <p className="text-secondary-400 mt-1">
                  {filteredStations.length} stations in your area
                </p>
              </div>
            </div>

            {/* Station Markers */}
            {filteredStations.slice(0, 5).map((station, index) => {
              const positions = [
                { top: '20%', left: '30%' },
                { top: '40%', left: '60%' },
                { top: '60%', left: '25%' },
                { top: '35%', left: '70%' },
                { top: '70%', left: '55%' },
              ];
              const pos = positions[index] || positions[0];
              
              return (
                <div
                  key={station.id}
                  className="absolute cursor-pointer group"
                  style={{ top: pos.top, left: pos.left }}
                  onClick={() => navigate(`/user/stations/${station.id}`)}
                >
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-110
                    ${station.status === 'available' ? 'bg-primary-500 shadow-primary-500/30' : 
                      station.status === 'busy' ? 'bg-amber-500 shadow-amber-500/30' : 
                      'bg-secondary-400 shadow-secondary-400/30'}
                  `}>
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="bg-white rounded-lg shadow-lg p-3 min-w-[200px]">
                      <p className="font-medium text-secondary-900">{station.name}</p>
                      <p className="text-sm text-secondary-500">{formatDistance(station.distance)}</p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Current Location Marker */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="w-6 h-6 bg-blue-500 rounded-full border-4 border-white shadow-lg">
                <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-50" />
              </div>
            </div>
          </div>

          {/* Station List Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-secondary-200 p-4 max-h-48 overflow-y-auto">
            <div className="flex gap-4 overflow-x-auto pb-2">
              {filteredStations.map((station) => (
                <div
                  key={station.id}
                  onClick={() => navigate(`/user/stations/${station.id}`)}
                  className="flex-shrink-0 w-72 p-3 bg-secondary-50 rounded-xl cursor-pointer hover:bg-secondary-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      ${station.status === 'available' ? 'bg-primary-100 text-primary-600' : 
                        station.status === 'busy' ? 'bg-amber-100 text-amber-600' : 
                        'bg-secondary-200 text-secondary-500'}
                    `}>
                      <Zap className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-secondary-900 truncate">{station.name}</p>
                      <p className="text-sm text-secondary-500">{formatDistance(station.distance)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StationDiscovery;
