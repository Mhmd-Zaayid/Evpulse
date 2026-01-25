import { MapPin, Star, Zap, Clock, ChevronRight } from 'lucide-react';
import { formatDistance, getStatusColor, getStatusText } from '../../utils';

const StationCard = ({ station, onClick, compact = false }) => {
  const availablePorts = station.ports.filter(p => p.status === 'available').length;
  const totalPorts = station.ports.length;

  if (compact) {
    return (
      <div 
        onClick={onClick}
        className="card cursor-pointer group"
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-secondary-100 overflow-hidden flex-shrink-0">
            <img 
              src={station.image} 
              alt={station.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/64?text=EV';
              }}
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-secondary-900 truncate">{station.name}</h3>
            <p className="text-sm text-secondary-500 truncate">{station.address}</p>
            <div className="flex items-center gap-3 mt-1.5">
              <span className={`badge ${getStatusColor(station.status)}`}>
                {getStatusText(station.status)}
              </span>
              <span className="text-sm text-secondary-500">
                {availablePorts}/{totalPorts} available
              </span>
            </div>
          </div>

          <ChevronRight className="w-5 h-5 text-secondary-400 group-hover:text-primary-500 transition-colors" />
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={onClick}
      className="card cursor-pointer group overflow-hidden"
    >
      {/* Image */}
      <div className="relative h-40 -mx-6 -mt-6 mb-4 overflow-hidden">
        <img 
          src={station.image} 
          alt={station.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/400x160?text=EV+Station';
          }}
        />
        <div className="absolute top-3 right-3">
          <span className={`badge ${getStatusColor(station.status)}`}>
            {getStatusText(station.status)}
          </span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
          <h3 className="font-semibold text-white text-lg">{station.name}</h3>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-secondary-600">
          <MapPin className="w-4 h-4 text-secondary-400" />
          <span className="text-sm truncate">{station.address}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="font-medium text-secondary-900">{station.rating}</span>
            <span className="text-sm text-secondary-500">({station.totalReviews})</span>
          </div>
          <span className="text-sm text-secondary-500">{formatDistance(station.distance)}</span>
        </div>

        <div className="flex items-center gap-4 pt-2 border-t border-secondary-100">
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-primary-500" />
            <span className="text-sm text-secondary-700">
              {availablePorts}/{totalPorts} ports
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-secondary-400" />
            <span className="text-sm text-secondary-500">{station.operatingHours}</span>
          </div>
        </div>

        {/* Port Types */}
        <div className="flex flex-wrap gap-2">
          {[...new Set(station.ports.map(p => p.type))].map((type) => (
            <span 
              key={type}
              className="px-2.5 py-1 bg-secondary-100 text-secondary-700 text-xs font-medium rounded-lg"
            >
              {type}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StationCard;
