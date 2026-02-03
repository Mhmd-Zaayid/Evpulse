// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function to get auth token
const getAuthToken = () => localStorage.getItem('evpulse_token');

// Helper function for API requests
const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'An error occurred');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Auth API
export const authAPI = {
  login: async (email, password) => {
    try {
      const response = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      if (response.success && response.token) {
        localStorage.setItem('evpulse_token', response.token);
      }
      
      return response;
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  register: async (userData) => {
    try {
      const response = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      
      if (response.success && response.token) {
        localStorage.setItem('evpulse_token', response.token);
      }
      
      return response;
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  getCurrentUser: async () => {
    try {
      return await apiRequest('/auth/me');
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  updateProfile: async (data) => {
    try {
      return await apiRequest('/auth/update-profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    try {
      return await apiRequest('/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  logout: () => {
    localStorage.removeItem('evpulse_token');
    localStorage.removeItem('evpulse_user');
  },
};

// Stations API
export const stationsAPI = {
  getAll: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.chargingType) params.append('chargingType', filters.chargingType);
      if (filters.maxDistance) params.append('maxDistance', filters.maxDistance);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.lat) params.append('lat', filters.lat);
      if (filters.lng) params.append('lng', filters.lng);
      if (filters.city) params.append('city', filters.city);
      
      const queryString = params.toString();
      return await apiRequest(`/stations${queryString ? `?${queryString}` : ''}`);
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  getById: async (id) => {
    try {
      const response = await apiRequest(`/stations/${id}`);
      if (response.success && response.data) {
        return response;
      }
      // Fallback to mock data if API fails
      const { chargingStations } = await import('./mockData');
      const station = chargingStations.find(s => s.id === parseInt(id));
      return { success: !!station, data: station || null };
    } catch (error) {
      // Fallback to mock data on error
      try {
        const { chargingStations } = await import('./mockData');
        const station = chargingStations.find(s => s.id === parseInt(id));
        return { success: !!station, data: station || null };
      } catch (e) {
        return { success: false, error: error.message };
      }
    }
  },

  getByOperator: async (operatorId) => {
    try {
      const response = await apiRequest(`/stations/operator/${operatorId}`);
      if (response.success && response.data) {
        return response;
      }
      // Fallback to mock data
      const { chargingStations } = await import('./mockData');
      const stations = chargingStations.filter(s => s.operatorId === parseInt(operatorId) || operatorId);
      return { success: true, data: stations };
    } catch (error) {
      // Fallback to mock data on error
      try {
        const { chargingStations } = await import('./mockData');
        const stations = chargingStations.filter(s => s.operatorId === parseInt(operatorId) || operatorId);
        return { success: true, data: stations };
      } catch (e) {
        return { success: false, error: error.message };
      }
    }
  },

  create: async (stationData) => {
    try {
      return await apiRequest('/stations', {
        method: 'POST',
        body: JSON.stringify(stationData),
      });
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  update: async (stationId, stationData) => {
    try {
      return await apiRequest(`/stations/${stationId}`, {
        method: 'PUT',
        body: JSON.stringify(stationData),
      });
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  updateStatus: async (stationId, status) => {
    try {
      return await apiRequest(`/stations/${stationId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};

// Sessions API
export const sessionsAPI = {
  getByUser: async (userId) => {
    try {
      return await apiRequest(`/sessions/user/${userId}`);
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  getActive: async (userId) => {
    try {
      return await apiRequest(`/sessions/active/${userId}`);
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  startSession: async (sessionData) => {
    try {
      return await apiRequest('/sessions/start', {
        method: 'POST',
        body: JSON.stringify(sessionData),
      });
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  stopSession: async (sessionId) => {
    try {
      return await apiRequest(`/sessions/stop/${sessionId}`, {
        method: 'POST',
      });
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  getByStation: async (stationId) => {
    try {
      return await apiRequest(`/sessions/station/${stationId}`);
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};

// Bookings API
export const bookingsAPI = {
  getByUser: async (userId) => {
    try {
      const response = await apiRequest(`/bookings/user/${userId}`);
      if (response.success && response.data) {
        return response;
      }
      // Fallback to mock data
      const { bookings } = await import('./mockData');
      const userBookings = bookings.filter(booking => booking.userId === parseInt(userId));
      return { success: true, data: userBookings };
    } catch (error) {
      // Fallback to mock data on error
      try {
        const { bookings } = await import('./mockData');
        const userBookings = bookings.filter(booking => booking.userId === parseInt(userId));
        return { success: true, data: userBookings };
      } catch (e) {
        return { success: false, error: error.message, data: [] };
      }
    }
  },

  create: async (bookingData) => {
    try {
      return await apiRequest('/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData),
      });
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  cancel: async (bookingId) => {
    try {
      return await apiRequest(`/bookings/${bookingId}/cancel`, {
        method: 'POST',
      });
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  getAvailableSlots: async (stationId, date, portId) => {
    try {
      const params = new URLSearchParams({ stationId, date });
      if (portId) params.append('portId', portId);
      return await apiRequest(`/bookings/available-slots?${params.toString()}`);
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  getByStation: async (stationId) => {
    try {
      return await apiRequest(`/bookings/station/${stationId}`);
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};

// Transactions API
export const transactionsAPI = {
  getByUser: async (userId) => {
    try {
      return await apiRequest(`/transactions/user/${userId}`);
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  processPayment: async (paymentData) => {
    try {
      return await apiRequest('/transactions/process', {
        method: 'POST',
        body: JSON.stringify(paymentData),
      });
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  getWalletBalance: async (userId) => {
    try {
      return await apiRequest(`/transactions/wallet/balance/${userId}`);
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  topUpWallet: async (amount, paymentMethod) => {
    try {
      return await apiRequest('/transactions/wallet/topup', {
        method: 'POST',
        body: JSON.stringify({ amount, paymentMethod }),
      });
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  getSummary: async (userId) => {
    try {
      return await apiRequest(`/transactions/summary/${userId}`);
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};

// Admin API
export const adminAPI = {
  getStats: async () => {
    try {
      const response = await apiRequest('/admin/stats');
      if (response.success && response.data) {
        return response;
      }
      // Return mock data fallback
      return {
        success: true,
        data: {
          totalUsers: 3456,
          totalOperators: 48,
          totalStations: 165,
          totalEnergy: 76380,
          totalRevenue: 115200,
          activeChargers: 145,
          todayRevenue: 8450,
          todayEnergy: 5680,
          newUsersThisMonth: 342,
          pendingOperators: 5,
        },
      };
    } catch (error) {
      return {
        success: true,
        data: {
          totalUsers: 3456,
          totalOperators: 48,
          totalStations: 165,
          totalEnergy: 76380,
          totalRevenue: 115200,
          activeChargers: 145,
          todayRevenue: 8450,
          todayEnergy: 5680,
          newUsersThisMonth: 342,
          pendingOperators: 5,
        },
      };
    }
  },

  getAllUsers: async (role) => {
    try {
      const params = role ? `?role=${role}` : '';
      const response = await apiRequest(`/admin/users${params}`);
      if (response.success && response.data) {
        return response;
      }
      // Return mock data fallback
      return {
        success: true,
        data: [
          { id: 1, name: 'John Smith', email: 'john@example.com', role: 'user', status: 'active', createdAt: '2026-01-15', totalSessions: 45, totalSpent: 245.50 },
          { id: 2, name: 'Sarah Johnson', email: 'sarah@example.com', role: 'user', status: 'active', createdAt: '2026-01-10', totalSessions: 32, totalSpent: 189.00 },
          { id: 3, name: 'Mike Williams', email: 'mike@example.com', role: 'operator', status: 'active', createdAt: '2026-01-05', totalStations: 5, totalRevenue: 12500 },
          { id: 4, name: 'Emily Brown', email: 'emily@example.com', role: 'user', status: 'suspended', createdAt: '2025-12-20', totalSessions: 8, totalSpent: 45.00 },
          { id: 5, name: 'David Lee', email: 'david@example.com', role: 'operator', status: 'pending', createdAt: '2026-01-20', totalStations: 0, totalRevenue: 0 },
        ],
      };
    } catch (error) {
      return {
        success: true,
        data: [],
      };
    }
  },

  getAllStations: async () => {
    try {
      const response = await apiRequest('/admin/stations');
      if (response.success && response.data) {
        return response;
      }
      // Fallback to mock data
      const { chargingStations } = await import('./mockData');
      return { success: true, data: chargingStations };
    } catch (error) {
      try {
        const { chargingStations } = await import('./mockData');
        return { success: true, data: chargingStations };
      } catch (e) {
        return { success: true, data: [] };
      }
    }
  },

  updateUserStatus: async (userId, status) => {
    try {
      return await apiRequest(`/admin/users/${userId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
    } catch (error) {
      // Return mock success
      return { success: true };
    }
  },

  updateStationStatus: async (stationId, status) => {
    try {
      return await apiRequest(`/admin/stations/${stationId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
    } catch (error) {
      // Return mock success
      return { success: true };
    }
  },
};

// Operator API
export const operatorAPI = {
  getStats: async (operatorId) => {
    try {
      const response = await apiRequest('/operator/stats');
      if (response.success && response.data) {
        return response.data;
      }
      // Return mock data fallback
      return {
        totalStations: 5,
        activeSessions: 12,
        todayRevenue: 1245.50,
        todayEnergy: 856.3,
        portUtilization: 68,
        totalPorts: 24,
        revenueByStation: [
          { station: 'Downtown Hub', revenue: 450 },
          { station: 'Mall Parking', revenue: 320 },
          { station: 'Tech Park', revenue: 280 },
          { station: 'Highway Rest', revenue: 195.5 },
        ],
        sessionsByHour: [
          { hour: '8AM', sessions: 5 },
          { hour: '10AM', sessions: 8 },
          { hour: '12PM', sessions: 12 },
          { hour: '2PM', sessions: 10 },
          { hour: '4PM', sessions: 15 },
          { hour: '6PM', sessions: 18 },
          { hour: '8PM', sessions: 8 },
        ],
        maintenanceAlerts: [
          { id: 1, stationId: 3, portId: 2, message: 'Port offline - needs inspection', priority: 'high' },
          { id: 2, stationId: 1, portId: 4, message: 'Scheduled maintenance due', priority: 'medium' },
        ],
      };
    } catch (error) {
      // Return mock data on error
      return {
        success: true,
        data: {
          totalStations: 5,
          activeSessions: 12,
          todayRevenue: 1245.50,
          todayEnergy: 856.3,
          portUtilization: 68,
          totalPorts: 24,
          revenueByStation: [
            { station: 'Downtown Hub', revenue: 450 },
            { station: 'Mall Parking', revenue: 320 },
            { station: 'Tech Park', revenue: 280 },
            { station: 'Highway Rest', revenue: 195.5 },
          ],
          sessionsByHour: [
            { hour: '8AM', sessions: 5 },
            { hour: '10AM', sessions: 8 },
            { hour: '12PM', sessions: 12 },
            { hour: '2PM', sessions: 10 },
            { hour: '4PM', sessions: 15 },
            { hour: '6PM', sessions: 18 },
            { hour: '8PM', sessions: 8 },
          ],
          maintenanceAlerts: [],
        },
      };
    }
  },

  getStations: async () => {
    try {
      const response = await apiRequest('/operator/stations');
      if (response.success && response.data) {
        return response;
      }
      // Fallback to mock data
      const { chargingStations } = await import('./mockData');
      return { success: true, data: chargingStations.slice(0, 3) };
    } catch (error) {
      // Fallback to mock data on error
      try {
        const { chargingStations } = await import('./mockData');
        return { success: true, data: chargingStations.slice(0, 3) };
      } catch (e) {
        return { success: false, error: error.message };
      }
    }
  },

  updatePricing: async (stationId, pricing) => {
    try {
      return await apiRequest(`/operator/pricing/${stationId}`, {
        method: 'PUT',
        body: JSON.stringify(pricing),
      });
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  updatePortStatus: async (stationId, portId, status) => {
    try {
      return await apiRequest(`/operator/port-status/${stationId}/${portId}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  getMaintenanceAlerts: async (operatorId) => {
    try {
      const response = await apiRequest('/operator/maintenance-alerts');
      if (response.success && response.data) {
        return response;
      }
      // Return mock data fallback
      return {
        success: true,
        data: [
          {
            id: 1,
            stationId: 3,
            portId: 2,
            type: 'offline',
            message: 'Port offline - needs inspection',
            priority: 'high',
            timestamp: new Date().toISOString(),
            status: 'pending',
          },
          {
            id: 2,
            stationId: 1,
            portId: 4,
            type: 'maintenance',
            message: 'Scheduled maintenance due',
            priority: 'medium',
            timestamp: new Date().toISOString(),
            status: 'pending',
          },
        ],
      };
    } catch (error) {
      return {
        success: true,
        data: [
          {
            id: 1,
            stationId: 3,
            portId: 2,
            type: 'offline',
            message: 'Port offline - needs inspection',
            priority: 'high',
            timestamp: new Date().toISOString(),
            status: 'pending',
          },
        ],
      };
    }
  },

  resolveAlert: async (alertId) => {
    try {
      return await apiRequest(`/operator/resolve-alert/${alertId}`, {
        method: 'POST',
      });
    } catch (error) {
      // Return success for mock purposes
      return { success: true };
    }
  },

  getFeedback: async (operatorId) => {
    try {
      const response = await apiRequest('/operator/feedback');
      if (response.success && response.data) {
        return response.data;
      }
      // Return mock data fallback with correct structure
      return {
        stats: {
          averageRating: 4.3,
          totalReviews: 48,
          thisMonthReviews: 12,
          positiveReviews: 85,
          resolvedIssues: 15,
          pendingIssues: 3,
        },
        reviews: [
          {
            id: 1,
            stationId: 1,
            stationName: 'Downtown EV Hub',
            userId: 1,
            userName: 'John Doe',
            rating: 5,
            comment: 'Excellent charging experience! Fast and reliable.',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            status: 'resolved',
          },
          {
            id: 2,
            stationId: 2,
            stationName: 'Mall Parking Station',
            userId: 2,
            userName: 'Jane Smith',
            rating: 4,
            comment: 'Good location, but could use more ports during peak hours.',
            createdAt: new Date(Date.now() - 172800000).toISOString(),
            status: 'acknowledged',
          },
          {
            id: 3,
            stationId: 1,
            stationName: 'Downtown EV Hub',
            userId: 3,
            userName: 'Mike Williams',
            rating: 2,
            comment: 'Station was offline when I arrived. Disappointed.',
            createdAt: new Date(Date.now() - 259200000).toISOString(),
            status: 'pending',
          },
        ],
        ratingDistribution: [
          { rating: 5, count: 20 },
          { rating: 4, count: 15 },
          { rating: 3, count: 8 },
          { rating: 2, count: 3 },
          { rating: 1, count: 2 },
        ],
      };
    } catch (error) {
      return {
        stats: {
          averageRating: 0,
          totalReviews: 0,
          thisMonthReviews: 0,
          positiveReviews: 0,
          resolvedIssues: 0,
          pendingIssues: 0,
        },
        reviews: [],
        ratingDistribution: [],
      };
    }
  },
};

// Reviews API
export const reviewsAPI = {
  getByStation: async (stationId) => {
    try {
      const response = await apiRequest(`/reviews/station/${stationId}`);
      if (response.success && response.data) {
        return response;
      }
      // Return mock data fallback
      return {
        success: true,
        data: [
          { id: 1, userId: 1, userName: 'John Smith', rating: 5, comment: 'Great charging experience!', createdAt: new Date(Date.now() - 86400000).toISOString(), helpful: 12 },
          { id: 2, userId: 2, userName: 'Sarah Johnson', rating: 4, comment: 'Fast charging, good location.', createdAt: new Date(Date.now() - 172800000).toISOString(), helpful: 8 },
          { id: 3, userId: 3, userName: 'Mike Williams', rating: 5, comment: 'Best station in the area!', createdAt: new Date(Date.now() - 259200000).toISOString(), helpful: 5 },
        ],
      };
    } catch (error) {
      return {
        success: true,
        data: [],
      };
    }
  },

  create: async (reviewData) => {
    try {
      return await apiRequest('/reviews', {
        method: 'POST',
        body: JSON.stringify(reviewData),
      });
    } catch (error) {
      // Return mock success
      return { success: true, data: { id: Date.now(), ...reviewData } };
    }
  },

  getByUser: async (userId) => {
    try {
      return await apiRequest(`/reviews/user/${userId}`);
    } catch (error) {
      return { success: true, data: [] };
    }
  },

  markHelpful: async (reviewId) => {
    try {
      return await apiRequest(`/reviews/${reviewId}/helpful`, {
        method: 'POST',
      });
    } catch (error) {
      return { success: true };
    }
  },
};

// Charging History API
export const historyAPI = {
  getByUser: async (userId) => {
    try {
      const response = await apiRequest(`/sessions/history/${userId}`);
      if (response.success && response.data) {
        return response;
      }
      // Return mock data fallback
      const { chargingSessions } = await import('./mockData');
      return { success: true, data: chargingSessions };
    } catch (error) {
      try {
        const { chargingSessions } = await import('./mockData');
        return { success: true, data: chargingSessions };
      } catch (e) {
        return { success: true, data: [] };
      }
    }
  },

  getStats: async (userId) => {
    try {
      const response = await apiRequest(`/sessions/stats/${userId}`);
      if (response.success && response.data) {
        return response;
      }
      // Return mock data fallback
      return {
        success: true,
        data: {
          totalSessions: 45,
          totalEnergy: 856.3,
          totalCost: 245.50,
          totalTime: 1845,
          favoriteStation: 'Downtown EV Hub',
          averageChargingTime: 41,
          carbonSaved: 128.5,
        },
      };
    } catch (error) {
      return {
        success: true,
        data: {
          totalSessions: 45,
          totalEnergy: 856.3,
          totalCost: 245.50,
          totalTime: 1845,
          favoriteStation: 'Downtown EV Hub',
          averageChargingTime: 41,
          carbonSaved: 128.5,
        },
      };
    }
  },
};

// User Notifications API
export const notificationsAPI = {
  getByUser: async (userId) => {
    try {
      const response = await apiRequest(`/notifications/user/${userId}`);
      if (response.success && response.data) {
        return response;
      }
      // Return mock data fallback
      return {
        success: true,
        data: [
          { id: 1, type: 'charging_complete', title: 'Charging Complete', message: 'Your charging session has completed.', read: false, createdAt: new Date().toISOString() },
          { id: 2, type: 'payment', title: 'Payment Received', message: 'Your payment of $24.50 was successful.', read: true, createdAt: new Date(Date.now() - 3600000).toISOString() },
        ],
      };
    } catch (error) {
      return { success: true, data: [] };
    }
  },

  markAsRead: async (notificationId) => {
    try {
      return await apiRequest(`/notifications/${notificationId}/read`, {
        method: 'PUT',
      });
    } catch (error) {
      return { success: true };
    }
  },

  markAllAsRead: async (userId) => {
    try {
      return await apiRequest(`/notifications/user/${userId}/read-all`, {
        method: 'PUT',
      });
    } catch (error) {
      return { success: true };
    }
  },

  getUnreadCount: async (userId) => {
    try {
      const response = await apiRequest(`/notifications/user/${userId}/unread-count`);
      if (response.success) {
        return response;
      }
      return { success: true, data: { count: 0 } };
    } catch (error) {
      return { success: true, data: { count: 0 } };
    }
  },
};

// Admin Feedback API
export const adminFeedbackAPI = {
  getAll: async () => {
    // Return mock data for admin feedback dashboard
    return {
      stats: {
        platformRating: 4.5,
        totalReviews: 2456,
        thisWeekReviews: 87,
        pendingReviews: 12,
        flaggedReviews: 3,
        satisfactionRate: 89,
      },
      topStations: [
        { id: 1, name: 'Downtown Hub', operatorName: 'GreenCharge Inc', rating: 4.9, reviewCount: 256 },
        { id: 2, name: 'Airport Terminal', operatorName: 'FastCharge Co', rating: 4.8, reviewCount: 412 },
        { id: 3, name: 'Mall Parking A', operatorName: 'EV Charge Inc', rating: 4.7, reviewCount: 198 },
        { id: 4, name: 'Tech Park', operatorName: 'GreenCharge Inc', rating: 4.6, reviewCount: 156 },
        { id: 5, name: 'City Hospital', operatorName: 'MedCharge', rating: 4.5, reviewCount: 89 },
      ],
      lowRatedStations: [
        { id: 6, name: 'Highway Rest Stop', operatorName: 'FastCharge Co', rating: 2.8, reviewCount: 45 },
        { id: 7, name: 'University Campus', operatorName: 'EV Charge Inc', rating: 3.1, reviewCount: 67 },
        { id: 8, name: 'City Center', operatorName: 'QuickCharge', rating: 3.3, reviewCount: 34 },
      ],
      commonIssues: [
        { issue: 'Slow Charging', count: 156, severity: 'medium', trend: 'down' },
        { issue: 'Station Offline', count: 89, severity: 'high', trend: 'up' },
        { issue: 'Payment Issues', count: 67, severity: 'medium', trend: 'down' },
        { issue: 'Dirty Facilities', count: 45, severity: 'low', trend: 'down' },
      ],
      reviews: [
        { id: 1, userName: 'John Smith', stationName: 'Downtown Hub', operatorName: 'GreenCharge Inc', rating: 5, comment: 'Excellent charging station! Fast and reliable.', status: 'approved', createdAt: '2026-01-25' },
        { id: 2, userName: 'Sarah Johnson', stationName: 'Mall Parking A', operatorName: 'EV Charge Inc', rating: 4, comment: 'Good experience overall. Could use more ports.', status: 'approved', createdAt: '2026-01-24' },
        { id: 3, userName: 'Mike Williams', stationName: 'Highway Rest Stop', operatorName: 'FastCharge Co', rating: 2, comment: 'Station was often offline. Very frustrating.', status: 'flagged', createdAt: '2026-01-23' },
        { id: 4, userName: 'Emily Brown', stationName: 'Airport Terminal', operatorName: 'FastCharge Co', rating: 5, comment: 'Perfect location and super fast charging!', status: 'approved', createdAt: '2026-01-22' },
        { id: 5, userName: 'David Lee', stationName: 'Tech Park', operatorName: 'GreenCharge Inc', rating: 3, comment: 'Average experience. Pricing could be better.', status: 'pending', createdAt: '2026-01-21' },
      ],
    };
  },

  getStats: async () => {
    try {
      return await apiRequest('/admin/feedback/stats');
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  getAllReviews: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.rating) params.append('rating', filters.rating);
      if (filters.stationId) params.append('stationId', filters.stationId);
      
      const queryString = params.toString();
      return await apiRequest(`/admin/feedback/reviews${queryString ? `?${queryString}` : ''}`);
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};

// Users API
export const usersAPI = {
  getById: async (userId) => {
    try {
      return await apiRequest(`/users/${userId}`);
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  update: async (userId, data) => {
    try {
      return await apiRequest(`/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  search: async (query, role) => {
    try {
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (role) params.append('role', role);
      return await apiRequest(`/users/search?${params.toString()}`);
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};

