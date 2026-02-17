import { useState, useEffect } from 'react';
import { useAuth, useNotifications } from '../../context';
import { operatorAPI } from '../../services';
import { formatDateTime } from '../../utils';
import { Button, Badge, Modal, Input, Select, EmptyState, LoadingSpinner } from '../../components';
import {
  AlertTriangle,
  Wrench,
  CheckCircle,
  Clock,
  Filter,
  Plus,
  X,
  AlertCircle,
} from 'lucide-react';

const Maintenance = () => {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [resolution, setResolution] = useState('');

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await operatorAPI.getMaintenanceAlerts(user.id);
      // Add some mock data for demonstration
      const apiData = response?.data || [];
      setAlerts([
        ...apiData,
        {
          id: 3,
          stationId: 2,
          portId: 6,
          type: 'warning',
          message: 'Charging speed below optimal threshold',
          priority: 'low',
          timestamp: '2026-01-24T10:00:00',
          status: 'resolved',
        },
        {
          id: 4,
          stationId: 1,
          portId: 3,
          type: 'scheduled',
          message: 'Scheduled maintenance - cable replacement',
          priority: 'medium',
          timestamp: '2026-01-28T09:00:00',
          status: 'scheduled',
        },
      ]);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveAlert = async () => {
    if (!resolution.trim()) {
      showToast({ type: 'error', message: 'Please enter resolution notes' });
      return;
    }

    try {
      await operatorAPI.resolveAlert(selectedAlert.id);
      setAlerts(prev => prev.map(a => 
        a.id === selectedAlert.id ? { ...a, status: 'resolved' } : a
      ));
      showToast({ type: 'success', message: 'Alert resolved successfully!' });
      setShowResolveModal(false);
      setSelectedAlert(null);
      setResolution('');
    } catch (error) {
      showToast({ type: 'error', message: 'Failed to resolve alert' });
    }
  };

  const getAlertIcon = (type, priority) => {
    if (type === 'offline') return AlertCircle;
    if (type === 'maintenance' || type === 'scheduled') return Wrench;
    if (priority === 'high') return AlertTriangle;
    return AlertCircle;
  };

  const getAlertColor = (priority, status) => {
    if (status === 'resolved') return 'bg-green-50 border-green-200';
    if (priority === 'high') return 'bg-red-50 border-red-200';
    if (priority === 'medium') return 'bg-amber-50 border-amber-200';
    return 'bg-blue-50 border-blue-200';
  };

  const getIconColor = (priority, status) => {
    if (status === 'resolved') return 'text-green-500';
    if (priority === 'high') return 'text-red-500';
    if (priority === 'medium') return 'text-amber-500';
    return 'text-blue-500';
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'active') return alert.status !== 'resolved';
    if (filter === 'resolved') return alert.status === 'resolved';
    if (filter === 'high') return alert.priority === 'high' && alert.status !== 'resolved';
    return true;
  });

  const activeAlerts = alerts.filter(a => a.status !== 'resolved');
  const highPriorityAlerts = alerts.filter(a => a.priority === 'high' && a.status !== 'resolved');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 ml-4">Maintenance & Alerts</h1>
          <p className="text-secondary-500 mt-1 ml-4">Monitor and resolve station issues</p>
        </div>
        <Button icon={Plus}>
          Schedule Maintenance
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-900">{activeAlerts.length}</p>
              <p className="text-sm text-secondary-500">Active Alerts</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-900">{highPriorityAlerts.length}</p>
              <p className="text-sm text-secondary-500">High Priority</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Wrench className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-900">
                {alerts.filter(a => a.type === 'scheduled').length}
              </p>
              <p className="text-sm text-secondary-500">Scheduled</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-900">
                {alerts.filter(a => a.status === 'resolved').length}
              </p>
              <p className="text-sm text-secondary-500">Resolved</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: 'all', label: 'All Alerts' },
          { value: 'active', label: 'Active' },
          { value: 'high', label: 'High Priority' },
          { value: 'resolved', label: 'Resolved' },
        ].map((item) => (
          <button
            key={item.value}
            onClick={() => setFilter(item.value)}
            className={`px-4 py-2 rounded-xl font-medium transition-colors ${
              filter === item.value
                ? 'bg-primary-500 text-white'
                : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      {filteredAlerts.length > 0 ? (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => {
            const Icon = getAlertIcon(alert.type, alert.priority);
            return (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border-2 ${getAlertColor(alert.priority, alert.status)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${
                      alert.status === 'resolved' ? 'bg-green-100' :
                      alert.priority === 'high' ? 'bg-red-100' :
                      alert.priority === 'medium' ? 'bg-amber-100' : 'bg-blue-100'
                    }`}>
                      <Icon className={`w-6 h-6 ${getIconColor(alert.priority, alert.status)}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-secondary-900">{alert.message}</h3>
                        <Badge 
                          variant={
                            alert.status === 'resolved' ? 'success' :
                            alert.priority === 'high' ? 'danger' :
                            alert.priority === 'medium' ? 'warning' : 'info'
                          }
                          size="sm"
                        >
                          {alert.status === 'resolved' ? 'Resolved' : alert.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-secondary-600">
                        Station #{alert.stationId} • Port #{alert.portId}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-sm text-secondary-500">
                        <Clock className="w-4 h-4" />
                        <span>{formatDateTime(alert.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                  {alert.status !== 'resolved' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedAlert(alert);
                        setShowResolveModal(true);
                      }}
                    >
                      Resolve
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={CheckCircle}
          title="No alerts found"
          description="All systems are running smoothly"
        />
      )}

      {/* Resolve Modal */}
      <Modal
        isOpen={showResolveModal}
        onClose={() => {
          setShowResolveModal(false);
          setSelectedAlert(null);
          setResolution('');
        }}
        title="Resolve Alert"
        size="md"
      >
        <div className="space-y-4">
          {selectedAlert && (
            <div className="p-4 bg-secondary-50 rounded-xl">
              <p className="font-medium text-secondary-900">{selectedAlert.message}</p>
              <p className="text-sm text-secondary-500 mt-1">
                Station #{selectedAlert.stationId} • Port #{selectedAlert.portId}
              </p>
            </div>
          )}

          <div>
            <label className="input-label">Resolution Notes</label>
            <textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="Describe the actions taken to resolve this issue..."
              rows={4}
              className="input-field resize-none"
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                setShowResolveModal(false);
                setSelectedAlert(null);
                setResolution('');
              }}
            >
              Cancel
            </Button>
            <Button fullWidth onClick={handleResolveAlert}>
              Mark as Resolved
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Maintenance;
