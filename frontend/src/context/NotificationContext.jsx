import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { notificationsAPI } from '../services';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);

  const [toasts, setToasts] = useState([]);

  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setNotifications([]);
      return;
    }

    try {
      const response = await notificationsAPI.getByUser(user.id);
      if (response?.success) {
        setNotifications(response.data || []);
      } else {
        setNotifications([]);
      }
    } catch {
      setNotifications([]);
    }
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notification,
    };
    setNotifications(prev => [newNotification, ...prev]);
  }, []);

  const markAsRead = useCallback(async (id) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );

    try {
      await notificationsAPI.markAsRead(id);
    } catch {
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

    if (!user?.id) {
      return;
    }

    try {
      await notificationsAPI.markAllAsRead(user.id);
    } catch {
    }
  }, [user?.id]);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const showToast = useCallback((toast) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, ...toast }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, toast.duration || 5000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const value = {
    notifications,
    toasts,
    unreadCount,
    addNotification,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
    showToast,
    removeToast,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
