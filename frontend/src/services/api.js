import { users, chargingStations, chargingSessions, bookings, transactions, adminStats, operatorStats, availableTimeSlots } from './mockData';

// Simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Auth API
export const authAPI = {
  login: async (email, password) => {
    await delay(800);
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      return { success: true, user: userWithoutPassword };
    }
    return { success: false, error: 'Invalid email or password' };
  },

  register: async (userData) => {
    await delay(800);
    const exists = users.find(u => u.email === userData.email);
    if (exists) {
      return { success: false, error: 'Email already registered' };
    }
    const newUser = {
      id: users.length + 1,
      ...userData,
      joinedDate: new Date().toISOString().split('T')[0],
    };
    return { success: true, user: newUser };
  },
};

// Stations API
export const stationsAPI = {
  getAll: async (filters = {}) => {
    await delay(500);
    let stations = [...chargingStations];
    
    if (filters.status && filters.status !== 'all') {
      stations = stations.filter(s => s.status === filters.status);
    }
    
    if (filters.chargingType && filters.chargingType !== 'all') {
      stations = stations.filter(s => 
        s.ports.some(p => p.type.toLowerCase().includes(filters.chargingType.toLowerCase()))
      );
    }
    
    if (filters.maxDistance) {
      stations = stations.filter(s => s.distance <= filters.maxDistance);
    }
    
    if (filters.sortBy === 'distance') {
      stations.sort((a, b) => a.distance - b.distance);
    } else if (filters.sortBy === 'rating') {
      stations.sort((a, b) => b.rating - a.rating);
    }
    
    return { success: true, data: stations };
  },

  getById: async (id) => {
    await delay(300);
    const station = chargingStations.find(s => s.id === parseInt(id));
    if (station) {
      return { success: true, data: station };
    }
    return { success: false, error: 'Station not found' };
  },

  getByOperator: async (operatorId) => {
    await delay(400);
    const stations = chargingStations.filter(s => s.operatorId === operatorId);
    return { success: true, data: stations };
  },
};

// Sessions API
export const sessionsAPI = {
  getByUser: async (userId) => {
    await delay(400);
    const sessions = chargingSessions.filter(s => s.userId === userId);
    return { success: true, data: sessions };
  },

  getActive: async (userId) => {
    await delay(300);
    const session = chargingSessions.find(s => s.userId === userId && s.status === 'active');
    return { success: true, data: session };
  },

  startSession: async (sessionData) => {
    await delay(600);
    const newSession = {
      id: chargingSessions.length + 1,
      ...sessionData,
      startTime: new Date().toISOString(),
      status: 'active',
      progress: 0,
    };
    return { success: true, data: newSession };
  },

  stopSession: async (sessionId) => {
    await delay(500);
    return { 
      success: true, 
      data: { 
        ...chargingSessions.find(s => s.id === sessionId),
        status: 'completed',
        endTime: new Date().toISOString(),
      }
    };
  },

  getByStation: async (stationId) => {
    await delay(400);
    const sessions = chargingSessions.filter(s => s.stationId === stationId);
    return { success: true, data: sessions };
  },
};

// Bookings API
export const bookingsAPI = {
  getByUser: async (userId) => {
    await delay(400);
    const userBookings = bookings.filter(b => b.userId === userId);
    return { success: true, data: userBookings };
  },

  create: async (bookingData) => {
    await delay(600);
    const newBooking = {
      id: bookings.length + 1,
      ...bookingData,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };
    return { success: true, data: newBooking };
  },

  cancel: async (bookingId) => {
    await delay(400);
    return { success: true, message: 'Booking cancelled successfully' };
  },

  getAvailableSlots: async (stationId, date) => {
    await delay(300);
    // Simulate some slots being unavailable
    const unavailable = ['12:00 - 13:00', '18:00 - 19:00'];
    const available = availableTimeSlots.filter(slot => !unavailable.includes(slot));
    return { success: true, data: available };
  },
};

// Transactions API
export const transactionsAPI = {
  getByUser: async (userId) => {
    await delay(400);
    const userTransactions = transactions.filter(t => t.userId === userId);
    return { success: true, data: userTransactions };
  },

  processPayment: async (paymentData) => {
    await delay(1000);
    return { 
      success: true, 
      data: {
        id: Date.now(),
        ...paymentData,
        status: 'completed',
        timestamp: new Date().toISOString(),
      }
    };
  },

  getWalletBalance: async (userId) => {
    await delay(300);
    return { success: true, data: { balance: 87.40 } };
  },

  topUpWallet: async (amount, paymentMethod) => {
    await delay(800);
    return { 
      success: true, 
      data: { 
        newBalance: 87.40 + amount,
        transactionId: Date.now(),
      }
    };
  },
};

// Admin API
export const adminAPI = {
  getStats: async () => {
    await delay(500);
    return { success: true, data: adminStats };
  },

  getAllUsers: async () => {
    await delay(400);
    return { success: true, data: users.map(({ password, ...user }) => user) };
  },

  getAllStations: async () => {
    await delay(400);
    return { success: true, data: chargingStations };
  },

  updateUserStatus: async (userId, status) => {
    await delay(500);
    return { success: true, message: 'User status updated' };
  },

  updateStationStatus: async (stationId, status) => {
    await delay(500);
    return { success: true, message: 'Station status updated' };
  },
};

// Operator API
export const operatorAPI = {
  getStats: async (operatorId) => {
    await delay(500);
    return { success: true, data: operatorStats };
  },

  updatePricing: async (stationId, pricing) => {
    await delay(600);
    return { success: true, message: 'Pricing updated successfully' };
  },

  updatePortStatus: async (portId, status) => {
    await delay(400);
    return { success: true, message: 'Port status updated' };
  },

  getMaintenanceAlerts: async (operatorId) => {
    await delay(400);
    return { success: true, data: operatorStats.maintenanceAlerts };
  },

  resolveAlert: async (alertId) => {
    await delay(500);
    return { success: true, message: 'Alert resolved' };
  },
};
