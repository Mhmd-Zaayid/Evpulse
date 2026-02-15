import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const StatCard = ({ 
  title, 
  value, 
  subtitle,
  icon: Icon, 
  trend, 
  trendValue, 
  iconBg = 'bg-primary-100',
  iconColor = 'text-primary-600',
  gradient = false,
  className = '' 
}) => {
  const isPositive = trend === 'up';
  const isNeutral = trend === 'neutral';

  if (gradient) {
    return (
      <div className={`relative overflow-hidden rounded-2xl p-6 text-white ${className}`}>
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/70 text-sm font-medium">{title}</p>
              <p className="text-3xl font-bold mt-1">{value}</p>
              {subtitle && <p className="text-white/60 text-sm mt-1">{subtitle}</p>}
            </div>
            {Icon && (
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Icon className="w-6 h-6" />
              </div>
            )}
          </div>
          
          {trendValue && (
            <div className="flex items-center gap-1.5 mt-4">
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                isPositive ? 'bg-white/20 text-white' : isNeutral ? 'bg-white/20 text-white' : 'bg-red-400/30 text-white'
              }`}>
                {isPositive ? <TrendingUp className="w-3 h-3" /> : isNeutral ? <Minus className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {trendValue}%
              </div>
              <span className="text-white/60 text-xs">vs last period</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 p-6 border border-secondary-100 ${className}`} style={{ backgroundColor: '#abf7b1' }}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-secondary-500">{title}</p>
          <p className="text-2xl font-bold text-secondary-900 mt-1">{value}</p>
          {subtitle && <p className="text-sm text-secondary-400 mt-0.5">{subtitle}</p>}
          
          {trendValue && (
            <div className="flex items-center gap-2 mt-3">
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                isPositive ? 'bg-green-100 text-green-700' : isNeutral ? 'bg-secondary-100 text-secondary-600' : 'bg-red-100 text-red-700'
              }`}>
                {isPositive ? <TrendingUp className="w-3 h-3" /> : isNeutral ? <Minus className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {trendValue}%
              </div>
              <span className="text-xs text-secondary-400">vs last month</span>
            </div>
          )}
        </div>
        
        {Icon && (
          <div className={`p-3 rounded-xl ${iconBg}`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
