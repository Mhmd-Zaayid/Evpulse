import { MapPin, Star, Zap, Clock, ChevronRight, Navigation, Plug } from 'lucide-react';
import { formatCurrency, formatDistance, getStatusColor, getStatusText } from '../../utils';

const StationCard = ({ station, onClick, compact = false }) => {
  const availablePorts = station.ports?.filter(p => p.status === 'available').length || 0;
  const totalPorts = station.ports?.length || 0;
  const portTypes = [...new Set(station.ports?.map(p => p.type) || [])];
  const firstPortPrice = station.ports?.find((p) => p?.price != null)?.price;
  const normalizedPricePerKwh =
    firstPortPrice ??
    station.pricing?.normal?.base ??
    station.pricing?.fast?.base ??
    station.pricing?.perKwh ??
    0;

  if (compact) {
    return (
      <div 
        onClick={onClick}
        className="bg-white rounded-2xl p-4 border border-secondary-100 cursor-pointer hover:shadow-lg hover:border-primary-200 transition-all duration-300 group"
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-secondary-100 to-secondary-200 overflow-hidden flex-shrink-0 ring-2 ring-secondary-100">
            <img 
              src={station.image} 
              alt={station.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=100&h=100&fit=crop';
              }}
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-secondary-900 truncate group-hover:text-primary-600 transition-colors">
              {station.name}
            </h3>
            <p className="text-sm text-secondary-500 truncate flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5" />
              {station.address}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                station.status === 'available' ? 'bg-green-100 text-green-700' :
                station.status === 'busy' ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  station.status === 'available' ? 'bg-green-500' :
                  station.status === 'busy' ? 'bg-amber-500' :
                  'bg-red-500'
                }`} />
                {getStatusText(station.status)}
              </span>
              <span className="text-xs text-secondary-500 font-medium">
                {availablePorts}/{totalPorts} ports
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <ChevronRight className="w-5 h-5 text-secondary-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
            <span className="text-xs text-secondary-400">{formatDistance(station.distance)}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-2xl border border-secondary-100 overflow-hidden cursor-pointer group hover:shadow-xl hover:border-primary-200 transition-all duration-300"
    >
      {/* Image */}
      <div className="relative h-44 overflow-hidden">
        <img 
          src={station.image} 
          alt={station.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=400&h=200&fit=crop';
          }}
        />
        
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md ${
            station.status === 'available' ? 'bg-green-500/90 text-white' :
            station.status === 'busy' ? 'bg-amber-500/90 text-white' :
            'bg-red-500/90 text-white'
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            {getStatusText(station.status)}
          </span>
        </div>

        {/* Distance Badge */}
        {station.distance && (
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-white/90 text-secondary-700 backdrop-blur-md">
              <Navigation className="w-3 h-3" />
              {formatDistance(station.distance)}
            </span>
          </div>
        )}
        
        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-bold text-white text-lg drop-shadow-lg">{station.name}</h3>
          <p className="text-white/80 text-sm flex items-center gap-1 mt-0.5">
            <MapPin className="w-3.5 h-3.5" />
            {station.address}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Rating & Reviews */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 rounded-lg">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="font-bold text-secondary-900">{station.rating}</span>
            </div>
            <span className="text-sm text-secondary-500">({station.totalReviews} reviews)</span>
          </div>
          
          <div className="flex items-center gap-1.5 text-secondary-500">
            <Clock className="w-4 h-4" />
            <span className="text-sm">{station.operatingHours}</span>
          </div>
        </div>

        {/* Ports Info */}
        <div className="flex items-center justify-between p-3 bg-secondary-50 rounded-xl">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Plug className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-secondary-900">
                {availablePorts} of {totalPorts} Available
              </p>
              <p className="text-xs text-secondary-500">Charging ports</p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-lg font-bold text-primary-600">
              {formatCurrency(normalizedPricePerKwh)}<span className="text-xs font-normal text-secondary-500">/kWh</span>
            </p>
          </div>
        </div>

        {/* Port Types */}
        <div className="flex flex-wrap gap-2">
          {portTypes.map((type) => (
            <span 
              key={type}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary-100 text-secondary-700 text-xs font-semibold rounded-lg hover:bg-secondary-200 transition-colors"
            >
              <Zap className="w-3 h-3 text-primary-500" />
              {type}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StationCard;
