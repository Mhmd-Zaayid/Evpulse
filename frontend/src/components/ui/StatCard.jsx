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
    <div className={`rounded-2xl shadow-lg shadow-green-500/10 hover:shadow-xl hover:shadow-green-500/20 transition-all duration-300 p-6 border border-green-500/20 bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 hover:scale-[1.02] ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold text-emerald-100/80 drop-shadow-sm">{title}</p>
          <p className="text-2xl font-bold text-white mt-1 drop-shadow-md">{value}</p>
          {subtitle && <p className="text-sm text-emerald-100/70 mt-0.5 drop-shadow-sm">{subtitle}</p>}
          
          {trendValue && (
            <div className="flex items-center gap-2 mt-3">
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                isPositive ? 'bg-emerald-400/30 text-emerald-100' : isNeutral ? 'bg-white/20 text-white' : 'bg-red-400/30 text-red-100'
              }`}>
                {isPositive ? <TrendingUp className="w-3 h-3" /> : isNeutral ? <Minus className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {trendValue}%
              </div>
              <span className="text-xs text-emerald-100/60 drop-shadow-sm">vs last month</span>
            </div>
          )}
        </div>
        
        {Icon && (
          <div className={`p-3 rounded-xl ${iconBg} bg-gradient-to-br from-emerald-400 to-green-300 shadow-lg shadow-emerald-500/30`}>
            <Icon className="w-6 h-6 text-green-900" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
