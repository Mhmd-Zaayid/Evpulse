// Format currency
export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

// Format number with thousands separator
export const formatNumber = (number) => {
  return new Intl.NumberFormat('en-US').format(number);
};

// Format date
export const formatDate = (date, options = {}) => {
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  return new Date(date).toLocaleDateString('en-US', { ...defaultOptions, ...options });
};

// Format time
export const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Format datetime
export const formatDateTime = (date) => {
  return `${formatDate(date)} ${formatTime(date)}`;
};

// Format relative time
export const formatRelativeTime = (date) => {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now - past) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return formatDate(date);
};

// Format energy (kWh)
export const formatEnergy = (kwh) => {
  if (kwh >= 1000) {
    return `${(kwh / 1000).toFixed(2)} MWh`;
  }
  return `${kwh.toFixed(1)} kWh`;
};

// Format duration
export const formatDuration = (minutes) => {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

// Format distance
export const formatDistance = (km) => {
  if (km < 1) return `${(km * 1000).toFixed(0)} m`;
  return `${km.toFixed(1)} km`;
};

// Calculate charging time estimate
export const calculateChargingTime = (energyNeeded, power) => {
  const hours = energyNeeded / power;
  const minutes = Math.round(hours * 60);
  return formatDuration(minutes);
};

// Calculate charging cost
export const calculateChargingCost = (energy, pricePerKwh) => {
  return energy * pricePerKwh;
};

// Get status color class
export const getStatusColor = (status) => {
  const colors = {
    available: 'badge-success',
    busy: 'badge-warning',
    offline: 'badge-danger',
    completed: 'badge-success',
    active: 'badge-info',
    pending: 'badge-warning',
    confirmed: 'badge-success',
    cancelled: 'badge-danger',
  };
  return colors[status] || 'badge-info';
};

// Get status text
export const getStatusText = (status) => {
  const texts = {
    available: 'Available',
    busy: 'In Use',
    offline: 'Offline',
    completed: 'Completed',
    active: 'Active',
    pending: 'Pending',
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
  };
  return texts[status] || status;
};

// Validate email
export const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// Validate password
export const isValidPassword = (password) => {
  return password.length >= 6;
};

// Validate phone number
export const isValidPhone = (phone) => {
  const regex = /^\+?[\d\s-]{10,}$/;
  return regex.test(phone);
};

// Truncate text
export const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Generate random ID
export const generateId = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Local storage helpers
export const storage = {
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  },
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },
};
