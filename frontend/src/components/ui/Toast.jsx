import { CheckCircle, AlertTriangle, Info, X, XCircle, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

const Toast = ({ type = 'info', message, title, onClose, duration = 5000 }) => {
  const [isLeaving, setIsLeaving] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    // Progress bar animation
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
    }, 50);

    // Auto-dismiss
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(onClose, 300);
  };

  const config = {
    success: {
      icon: CheckCircle,
      bgGradient: 'from-green-500 to-emerald-500',
      bgLight: 'bg-green-50',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      progressColor: 'bg-green-500',
      title: title || 'Success!',
    },
    error: {
      icon: XCircle,
      bgGradient: 'from-red-500 to-rose-500',
      bgLight: 'bg-red-50',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      progressColor: 'bg-red-500',
      title: title || 'Error',
    },
    warning: {
      icon: AlertTriangle,
      bgGradient: 'from-amber-500 to-orange-500',
      bgLight: 'bg-amber-50',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      progressColor: 'bg-amber-500',
      title: title || 'Warning',
    },
    info: {
      icon: Info,
      bgGradient: 'from-blue-500 to-indigo-500',
      bgLight: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      progressColor: 'bg-blue-500',
      title: title || 'Info',
    },
  };

  const { icon: Icon, bgGradient, bgLight, iconBg, iconColor, progressColor, title: defaultTitle } = config[type];
  const isError = type === 'error';

  return (
    <div 
      className={`relative overflow-hidden rounded-2xl shadow-2xl min-w-[340px] max-w-md transform transition-all duration-300 ${
        isError ? 'bg-red-500 text-white border border-red-500' : 'bg-white border border-secondary-100'
      } ${
        isLeaving ? 'opacity-0 translate-x-full scale-95' : 'opacity-100 translate-x-0 scale-100'
      }`}
      style={{
        animation: isLeaving ? 'none' : 'slideIn 0.3s ease-out'
      }}
    >
      {/* Top Gradient Accent */}
      {!isError && <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${bgGradient}`} />}
      
      {/* Content */}
      <div className="flex items-start gap-4 p-4">
        <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${isError ? 'bg-red-400' : iconBg}`}>
          <Icon className={`w-5 h-5 ${isError ? 'text-white' : iconColor}`} />
        </div>
        
        <div className="flex-1 min-w-0 pt-0.5">
          <p className={`font-semibold ${isError ? 'text-white' : 'text-secondary-900'}`}>{defaultTitle}</p>
          <p className={`text-sm mt-0.5 ${isError ? 'text-white' : 'text-secondary-600'}`}>{message}</p>
        </div>
        
        <button
          onClick={handleClose}
          className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${
            isError
              ? 'hover:bg-red-400 text-white/80 hover:text-white'
              : 'hover:bg-secondary-100 text-secondary-400 hover:text-secondary-600'
          }`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${isError ? 'bg-red-400' : 'bg-secondary-100'}`}>
        <div 
          className={`h-full ${progressColor} transition-all duration-100 ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default Toast;
