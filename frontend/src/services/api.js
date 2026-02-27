const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthToken = () => localStorage.getItem('evpulse_token');

const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || 'Request failed');
  }
  return payload;
};

const safeError = (error) => ({ success: false, error: error.message || 'Request failed' });

export const authAPI = {
  async login(email, password) {
    try {
      const response = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (response?.token) {
        localStorage.setItem('evpulse_token', response.token);
      }
      return response;
    } catch (error) {
      return safeError(error);
    }
  },

  async register(userData) {
    try {
      const response = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      if (response?.token) {
        localStorage.setItem('evpulse_token', response.token);
      }
      return response;
    } catch (error) {
      return safeError(error);
    }
  },

  async getCurrentUser() {
    try {
      return await apiRequest('/auth/profile');
    } catch (error) {
      return safeError(error);
    }
  },

  async updateProfile(data) {
    try {
      return await apiRequest('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (error) {
      return safeError(error);
    }
  },

  async changePassword(currentPassword, newPassword) {
    try {
      return await apiRequest('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
    } catch (error) {
      return safeError(error);
    }
  },

  logout() {
    localStorage.removeItem('evpulse_token');
    localStorage.removeItem('evpulse_user');
  },
};

export const stationsAPI = {
  async getAll(filters = {}) {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value);
        }
      });
      return await apiRequest(`/stations${params.toString() ? `?${params.toString()}` : ''}`);
    } catch (error) {
      return safeError(error);
    }
  },

  async getById(id) {
    try {
      return await apiRequest(`/stations/${id}`);
    } catch (error) {
      return safeError(error);
    }
  },

  async getByOperator(operatorId) {
    try {
      return await apiRequest(`/stations/operator/${operatorId}`);
    } catch (error) {
      return safeError(error);
    }
  },

  async create(stationData) {
    try {
      return await apiRequest('/stations', {
        method: 'POST',
        body: JSON.stringify(stationData),
      });
    } catch (error) {
      return safeError(error);
    }
  },

  async update(stationId, stationData) {
    try {
      return await apiRequest(`/stations/${stationId}`, {
        method: 'PUT',
        body: JSON.stringify(stationData),
      });
    } catch (error) {
      return safeError(error);
    }
  },

  async updateStatus(stationId, status) {
    try {
      return await apiRequest(`/stations/${stationId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
    } catch (error) {
      return safeError(error);
    }
  },
};

export const sessionsAPI = {
  async getByUser() {
    try {
      return await apiRequest('/sessions');
    } catch (error) {
      return safeError(error);
    }
  },

  async getActive(userId) {
    try {
      return await apiRequest(`/sessions/active/${userId}`);
    } catch (error) {
      return safeError(error);
    }
  },

  async startSession(sessionData) {
    try {
      return await apiRequest('/sessions/start', {
        method: 'POST',
        body: JSON.stringify(sessionData),
      });
    } catch (error) {
      return safeError(error);
    }
  },

  async stopSession(sessionId, payload = null) {
    try {
      return await apiRequest(`/sessions/stop/${sessionId}`, {
        method: 'POST',
        body: payload ? JSON.stringify(payload) : undefined,
      });
    } catch (error) {
      return safeError(error);
    }
  },

  async getByStation(stationId) {
    try {
      return await apiRequest(`/sessions/station/${stationId}`);
    } catch (error) {
      return safeError(error);
    }
  },
};

export const bookingsAPI = {
  async getByUser() {
    try {
      return await apiRequest('/bookings');
    } catch (error) {
      return safeError(error);
    }
  },

  async create(bookingData) {
    try {
      return await apiRequest('/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData),
      });
    } catch (error) {
      return safeError(error);
    }
  },

  async cancel(bookingId) {
    try {
      return await apiRequest(`/bookings/${bookingId}/cancel`, { method: 'POST' });
    } catch (error) {
      return safeError(error);
    }
  },

  async getAvailableSlots(stationId, date, portId) {
    try {
      const params = new URLSearchParams({ stationId, date });
      if (portId !== undefined && portId !== null) {
        params.append('portId', portId);
      }
      return await apiRequest(`/bookings/available-slots?${params.toString()}`);
    } catch (error) {
      return safeError(error);
    }
  },

  async getByStation(stationId) {
    try {
      return await apiRequest(`/bookings/station/${stationId}`);
    } catch (error) {
      return safeError(error);
    }
  },
};

export const transactionsAPI = {
  async getByUser() {
    try {
      return await apiRequest('/transactions');
    } catch (error) {
      return safeError(error);
    }
  },

  async processPayment(paymentData) {
    try {
      return await apiRequest('/transactions/process', {
        method: 'POST',
        body: JSON.stringify(paymentData),
      });
    } catch (error) {
      return safeError(error);
    }
  },

  async getWalletBalance(userId) {
    try {
      return await apiRequest(`/transactions/wallet/balance/${userId}`);
    } catch (error) {
      return safeError(error);
    }
  },

  async topUpWallet(amount, paymentMethod) {
    try {
      return await apiRequest('/transactions/wallet/topup', {
        method: 'POST',
        body: JSON.stringify({ amount, paymentMethod }),
      });
    } catch (error) {
      return safeError(error);
    }
  },

  async getSummary(userId) {
    try {
      return await apiRequest(`/transactions/summary/${userId}`);
    } catch (error) {
      return safeError(error);
    }
  },
};

export const adminAPI = {
  async getStats() {
    try {
      return await apiRequest('/admin/stats');
    } catch (error) {
      return safeError(error);
    }
  },

  async getAllUsers(role) {
    try {
      const params = role ? `?role=${role}` : '';
      return await apiRequest(`/admin/users${params}`);
    } catch (error) {
      return safeError(error);
    }
  },

  async getAllStations() {
    try {
      return await apiRequest('/admin/stations');
    } catch (error) {
      return safeError(error);
    }
  },

  async getAllBookings() {
    try {
      return await apiRequest('/admin/bookings');
    } catch (error) {
      return safeError(error);
    }
  },

  async getAllSessions() {
    try {
      return await apiRequest('/admin/sessions');
    } catch (error) {
      return safeError(error);
    }
  },

  async getAllTransactions() {
    try {
      return await apiRequest('/admin/transactions');
    } catch (error) {
      return safeError(error);
    }
  },

  async updateUserStatus(userId, status) {
    try {
      return await apiRequest(`/admin/users/${userId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
    } catch (error) {
      return safeError(error);
    }
  },

  async updateStationStatus(stationId, status) {
    try {
      return await apiRequest(`/admin/stations/${stationId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
    } catch (error) {
      return safeError(error);
    }
  },
};

export const operatorAPI = {
  async getStats() {
    try {
      const response = await apiRequest('/operator/stats');
      return response.data || {};
    } catch (error) {
      return {};
    }
  },

  async getStations() {
    try {
      return await apiRequest('/operator/stations');
    } catch (error) {
      return safeError(error);
    }
  },

  async updatePricing(stationId, pricing) {
    try {
      return await apiRequest(`/operator/pricing/${stationId}`, {
        method: 'PUT',
        body: JSON.stringify(pricing),
      });
    } catch (error) {
      return safeError(error);
    }
  },

  async updatePortStatus(stationId, portId, status) {
    try {
      return await apiRequest(`/operator/port-status/${stationId}/${portId}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
    } catch (error) {
      return safeError(error);
    }
  },

  async getMaintenanceAlerts() {
    try {
      return await apiRequest('/operator/maintenance-alerts');
    } catch (error) {
      return safeError(error);
    }
  },

  async resolveAlert(alertId) {
    try {
      return await apiRequest(`/operator/resolve-alert/${alertId}`, { method: 'POST' });
    } catch (error) {
      return safeError(error);
    }
  },

  async getFeedback() {
    try {
      const response = await apiRequest('/operator/feedback');
      const stations = response.data || [];
      const totalReviews = stations.reduce((sum, s) => sum + (s.totalReviews || 0), 0);
      const weightedRating = stations.reduce((sum, s) => sum + ((s.averageRating || 0) * (s.totalReviews || 0)), 0);
      const averageRating = totalReviews ? Number((weightedRating / totalReviews).toFixed(1)) : 0;
      const positiveReviews = totalReviews
        ? Math.round((stations.reduce((sum, s) => sum + ((s.ratingBreakdown?.[5] || 0) + (s.ratingBreakdown?.[4] || 0)), 0) / totalReviews) * 100)
        : 0;

      const reviews = stations.flatMap((station) =>
        (station.recentReviews || []).map((review, index) => ({
          id: `${station.stationId}-${index}`,
          stationId: station.stationId,
          stationName: station.stationName,
          userName: review.userName || 'User',
          rating: review.rating || 0,
          comment: review.comment || '',
          createdAt: review.date || null,
          status: 'pending',
        }))
      );

      const ratingDistribution = {
        5: stations.reduce((sum, s) => sum + (s.ratingBreakdown?.[5] || 0), 0),
        4: stations.reduce((sum, s) => sum + (s.ratingBreakdown?.[4] || 0), 0),
        3: stations.reduce((sum, s) => sum + (s.ratingBreakdown?.[3] || 0), 0),
        2: stations.reduce((sum, s) => sum + (s.ratingBreakdown?.[2] || 0), 0),
        1: stations.reduce((sum, s) => sum + (s.ratingBreakdown?.[1] || 0), 0),
      };

      return {
        stats: {
          averageRating,
          totalReviews,
          thisMonthReviews: reviews.length,
          positiveReviews,
          resolvedIssues: 0,
          pendingIssues: reviews.length,
          ratingDistribution,
        },
        reviews,
        ratingDistribution,
      };
    } catch (error) {
      return {
        stats: { averageRating: 0, totalReviews: 0, thisMonthReviews: 0, positiveReviews: 0, resolvedIssues: 0, pendingIssues: 0, ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } },
        reviews: [],
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      };
    }
  },
};

export const reviewsAPI = {
  async getByStation(stationId) {
    try {
      return await apiRequest(`/reviews/station/${stationId}`);
    } catch (error) {
      return safeError(error);
    }
  },

  async create(reviewData) {
    try {
      return await apiRequest('/reviews', {
        method: 'POST',
        body: JSON.stringify(reviewData),
      });
    } catch (error) {
      return safeError(error);
    }
  },

  async getByUser(userId) {
    try {
      return await apiRequest(`/reviews/user/${userId}`);
    } catch (error) {
      return safeError(error);
    }
  },

  async markHelpful(reviewId) {
    try {
      return await apiRequest(`/reviews/${reviewId}/helpful`, { method: 'POST' });
    } catch (error) {
      return safeError(error);
    }
  },
};

export const historyAPI = {
  async getByUser(userId) {
    try {
      return await apiRequest(`/sessions/history/${userId}`);
    } catch (error) {
      return safeError(error);
    }
  },

  async getStats(userId) {
    try {
      return await apiRequest(`/sessions/stats/${userId}`);
    } catch (error) {
      return safeError(error);
    }
  },
};

export const notificationsAPI = {
  async getByUser(userId) {
    try {
      return await apiRequest(`/notifications/user/${userId}`);
    } catch (error) {
      return safeError(error);
    }
  },

  async markAsRead(notificationId) {
    try {
      return await apiRequest(`/notifications/${notificationId}/read`, { method: 'PUT' });
    } catch (error) {
      return safeError(error);
    }
  },

  async markAllAsRead(userId) {
    try {
      return await apiRequest(`/notifications/user/${userId}/read-all`, { method: 'PUT' });
    } catch (error) {
      return safeError(error);
    }
  },

  async getUnreadCount(userId) {
    try {
      return await apiRequest(`/notifications/user/${userId}/unread-count`);
    } catch (error) {
      return safeError(error);
    }
  },
};

export const adminFeedbackAPI = {
  async getAll() {
    try {
      const [statsRes, reviewsRes, stationsRes] = await Promise.all([
        apiRequest('/admin/feedback/stats'),
        apiRequest('/admin/feedback/reviews'),
        apiRequest('/admin/stations'),
      ]);

      const stats = statsRes.data || {};
      const reviews = reviewsRes.data || [];
      const stations = stationsRes.data || [];
      const stationOperatorMap = Object.fromEntries(
        stations.map((station) => [
          station.id,
          station.operatorName || 'Unknown Operator',
        ])
      );

      const topStations = [...stations]
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 5)
        .map((s) => ({
          id: s.id,
          name: s.name,
          operatorName: s.operatorName || 'Unknown Operator',
          rating: s.rating || 0,
          reviewCount: s.totalReviews || 0,
        }));

      const lowRatedStations = [...stations]
        .filter((s) => (s.rating || 0) > 0)
        .sort((a, b) => (a.rating || 0) - (b.rating || 0))
        .slice(0, 5)
        .map((s) => ({
          id: s.id,
          name: s.name,
          operatorName: s.operatorName || 'Unknown Operator',
          rating: s.rating || 0,
          reviewCount: s.totalReviews || 0,
        }));

      const normalizedReviews = reviews.map((review) => ({
        ...review,
        stationName: review.stationName || review.stationId,
        operatorName: review.operatorName || stationOperatorMap[review.stationId] || 'Unknown Operator',
        status: review.status || 'pending',
        createdAt: review.timestamp,
      }));

      return {
        stats: {
          platformRating: stats.averageRating || 0,
          totalReviews: stats.totalReviews || 0,
          thisWeekReviews: stats.reviewsThisMonth || 0,
          pendingReviews: normalizedReviews.filter((r) => (r.status || '') === 'pending').length,
          flaggedReviews: normalizedReviews.filter((r) => (r.rating || 0) <= 2).length,
          satisfactionRate: stats.averageRating ? Math.min(100, Math.round((stats.averageRating / 5) * 100)) : 0,
        },
        topStations,
        lowRatedStations,
        reviews: normalizedReviews,
      };
    } catch (error) {
      return {
        stats: { platformRating: 0, totalReviews: 0, thisWeekReviews: 0, pendingReviews: 0, flaggedReviews: 0, satisfactionRate: 0 },
        topStations: [],
        lowRatedStations: [],
        reviews: [],
      };
    }
  },

  async getStats() {
    try {
      return await apiRequest('/admin/feedback/stats');
    } catch (error) {
      return safeError(error);
    }
  },

  async getAllReviews(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.rating) params.append('rating', filters.rating);
      if (filters.stationId) params.append('stationId', filters.stationId);
      return await apiRequest(`/admin/feedback/reviews${params.toString() ? `?${params.toString()}` : ''}`);
    } catch (error) {
      return safeError(error);
    }
  },
};

export const usersAPI = {
  async getById(userId) {
    try {
      return await apiRequest(`/users/${userId}`);
    } catch (error) {
      return safeError(error);
    }
  },

  async update(userId, data) {
    try {
      return await apiRequest(`/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (error) {
      return safeError(error);
    }
  },

  async search(query, role) {
    try {
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (role) params.append('role', role);
      return await apiRequest(`/users/search${params.toString() ? `?${params.toString()}` : ''}`);
    } catch (error) {
      return safeError(error);
    }
  },
};
