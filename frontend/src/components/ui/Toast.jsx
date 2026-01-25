import { CheckCircle, AlertTriangle, Info, X, XCircle } from 'lucide-react';

const Toast = ({ type = 'info', message, onClose }) => {
  const config = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      iconColor: 'text-green-500',
      textColor: 'text-green-800',
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      iconColor: 'text-red-500',
      textColor: 'text-red-800',
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      iconColor: 'text-amber-500',
      textColor: 'text-amber-800',
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-500',
      textColor: 'text-blue-800',
    },
  };

  const { icon: Icon, bgColor, borderColor, iconColor, textColor } = config[type];

  return (
    <div 
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${bgColor} ${borderColor} shadow-lg animate-slide-in min-w-[300px] max-w-md`}
    >
      <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0`} />
      <p className={`flex-1 text-sm font-medium ${textColor}`}>{message}</p>
      <button
        onClick={onClose}
        className={`p-1 rounded-lg hover:bg-black/5 transition-colors ${textColor}`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;
