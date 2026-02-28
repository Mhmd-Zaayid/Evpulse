// Format currency
export const formatCurrency = (amount, currency = 'INR') => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
  }).format(num);
};

// Format number with thousands separator
export const formatNumber = (number) => {
  return new Intl.NumberFormat('en-US').format(number);
};

// Format date
export const formatDate = (date, options = {}) => {
  if (!date) return 'N/A';
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) return 'N/A';
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  return parsed.toLocaleDateString('en-US', { ...defaultOptions, ...options });
};

// Format time
export const formatTime = (date) => {
  if (!date) return 'N/A';
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) return 'N/A';
  return parsed.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Format datetime
export const formatDateTime = (date) => {
  if (!date) return 'N/A';
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) return 'N/A';
  return `${formatDate(date)} ${formatTime(date)}`;
};

// Format relative time
export const formatRelativeTime = (date) => {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now - past) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }
  return formatDate(date);
};

// Format energy (kWh)
export const formatEnergy = (kwh) => {
  if (kwh === undefined || kwh === null || isNaN(kwh)) return '0.0 kWh';
  if (kwh >= 1000) {
    return `${(kwh / 1000).toFixed(2)} MWh`;
  }
  return `${Number(kwh).toFixed(1)} kWh`;
};

// Format duration
export const formatDuration = (minutes) => {
  if (minutes === undefined || minutes === null || isNaN(minutes)) return '0 min';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

// Format distance
export const formatDistance = (km) => {
  if (km === undefined || km === null || isNaN(km)) return 'N/A';
  if (km < 1) return `${(km * 1000).toFixed(0)} m`;
  return `${km.toFixed(1)} km`;
};

export const formatStationAddress = (station) => {
  const city = String(station?.city || station?.location?.city || '').trim();
  const nearby = String(station?.nearbyLandmark || station?.nearby_landmark || station?.address || '').trim();
  const escapedCity = city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  if (city && nearby) {
    const cityPrefixPattern = new RegExp(`^\\s*${escapedCity}\\s*[-,]`, 'i');
    if (cityPrefixPattern.test(nearby) || nearby.toLowerCase() === city.toLowerCase()) {
      return nearby;
    }
    return `${city} - ${nearby}`;
  }

  return city || nearby || 'Address not available';
};

const STATION_IMAGE_PLACEHOLDER = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600" viewBox="0 0 1200 600" fill="none">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#e5e7eb"/>
        <stop offset="100%" stop-color="#cbd5e1"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="600" fill="url(#bg)"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#475569" font-family="Arial, sans-serif" font-size="52" font-weight="700">EV Station</text>
  </svg>`
)}`;

export const resolveStationImageSrc = (station) => {
  const rawImage = String(station?.image || '').trim();
  const normalizedImage = /^(null|none|undefined)$/i.test(rawImage) ? '' : rawImage;

  if (!normalizedImage) {
    return STATION_IMAGE_PLACEHOLDER;
  }

  if (normalizedImage.startsWith('data:image/')) {
    return normalizedImage;
  }

  const isHttp = normalizedImage.startsWith('http://') || normalizedImage.startsWith('https://');
  if (!isHttp) {
    return STATION_IMAGE_PLACEHOLDER;
  }

  const updatedAt = station?.updatedAt || station?.updated_at;
  if (!updatedAt) {
    return normalizedImage;
  }

  const separator = normalizedImage.includes('?') ? '&' : '?';
  return `${normalizedImage}${separator}v=${encodeURIComponent(String(updatedAt))}`;
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
