import { useState, useEffect } from 'react';
import { useAuth, useNotifications } from '../../context';
import { stationsAPI, operatorAPI } from '../../services';
import { formatCurrency, getStatusColor, getStatusText } from '../../utils';
import { Button, Badge, Modal, Input, Select, Table, EmptyState, LoadingSpinner } from '../../components';
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  MapPin,
  Zap,
  DollarSign,
  MoreVertical,
  Power,
} from 'lucide-react';

const Stations = () => {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStation, setSelectedStation] = useState(null);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [creatingStation, setCreatingStation] = useState(false);

  const [addData, setAddData] = useState({
    name: '',
    address: '',
    city: '',
    operatingHours: '24/7',
    image: '',
    portCount: 2,
    basePrice: 12,
    peakPrice: 15,
  });
  
  const [pricingData, setPricingData] = useState({
    normalBase: '',
    normalPeak: '',
    fastBase: '',
    fastPeak: '',
    peakStart: '',
    peakEnd: '',
  });

  const [editData, setEditData] = useState({
    name: '',
    address: '',
    operatingHours: '',
    status: '',
  });

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      const response = await stationsAPI.getByOperator(user.id);
      setStations(response.data);
    } catch (error) {
      console.error('Failed to fetch stations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditPricing = (station) => {
    setSelectedStation(station);
    setPricingData({
      normalBase: station.pricing.normal?.base || '',
      normalPeak: station.pricing.normal?.peak || '',
      fastBase: station.pricing.fast?.base || '',
      fastPeak: station.pricing.fast?.peak || '',
      peakStart: station.peakHours?.start || '',
      peakEnd: station.peakHours?.end || '',
    });
    setShowPricingModal(true);
  };

  const resetAddData = () => {
    setAddData({
      name: '',
      address: '',
      city: '',
      operatingHours: '24/7',
      image: '',
      portCount: 2,
      basePrice: 12,
      peakPrice: 15,
    });
  };

  const handleCreateStation = async () => {
    if (!addData.name.trim() || !addData.address.trim() || !addData.city.trim()) {
      showToast({ type: 'error', message: 'Name, address, and city are required' });
      return;
    }

    setCreatingStation(true);
    try {
      const portCount = Math.max(1, Number(addData.portCount) || 1);
      const basePrice = Number(addData.basePrice) || 0;
      const peakPrice = Number(addData.peakPrice) || basePrice;

      const ports = Array.from({ length: portCount }, (_, index) => ({
        id: index + 1,
        type: index % 2 === 0 ? 'fast' : 'normal',
        power: index % 2 === 0 ? 60 : 22,
        status: 'available',
        price: index % 2 === 0 ? peakPrice : basePrice,
      }));

      const payload = {
        name: addData.name.trim(),
        address: addData.address.trim(),
        city: addData.city.trim(),
        coordinates: {},
        operatingHours: addData.operatingHours?.trim() || '24/7',
        image: addData.image?.trim() || null,
        amenities: [],
        status: 'available',
        ports,
        pricing: {
          normal: { base: basePrice, peak: peakPrice },
          fast: { base: peakPrice, peak: peakPrice },
        },
        peakHours: { start: '18:00', end: '22:00' },
      };

      const response = await stationsAPI.create(payload);
      if (response?.success) {
        showToast({ type: 'success', message: 'Station added successfully!' });
        setShowAddModal(false);
        resetAddData();
        await fetchStations();
      } else {
        showToast({ type: 'error', message: response?.error || 'Failed to add station' });
      }
    } catch (error) {
      showToast({ type: 'error', message: 'Failed to add station' });
    } finally {
      setCreatingStation(false);
    }
  };

  const handleEditStation = (station) => {
    setSelectedStation(station);
    setEditData({
      name: station?.name || '',
      address: station?.address || '',
      operatingHours: station?.operatingHours || '',
      status: station?.status || 'available',
    });
    setShowEditModal(true);
  };

  const handleSaveStation = async () => {
    try {
      // Update local state
      setStations(prev => prev.map(s => 
        s.id === selectedStation.id 
          ? { ...s, ...editData }
          : s
      ));
      showToast({ type: 'success', message: 'Station updated successfully!' });
      setShowEditModal(false);
      setSelectedStation(null);
      setEditData({
        name: '',
        address: '',
        operatingHours: '',
        status: '',
      });
    } catch (error) {
      showToast({ type: 'error', message: 'Failed to update station' });
    }
  };

  const handleSavePricing = async () => {
    try {
      await operatorAPI.updatePricing(selectedStation.id, pricingData);
      showToast({ type: 'success', message: 'Pricing updated successfully!' });
      setShowPricingModal(false);
      fetchStations();
    } catch (error) {
      showToast({ type: 'error', message: 'Failed to update pricing' });
    }
  };

  const handleTogglePort = async (stationId, portId, currentStatus) => {
    const newStatus = currentStatus === 'available' ? 'offline' : 'available';
    try {
      await operatorAPI.updatePortStatus(stationId, portId, newStatus);
      showToast({ type: 'success', message: `Port ${newStatus === 'available' ? 'enabled' : 'disabled'}` });
      fetchStations();
    } catch (error) {
      showToast({ type: 'error', message: 'Failed to update port status' });
    }
  };

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
          <h1 className="text-2xl font-bold text-secondary-900 ml-4">My Stations</h1>
          <p className="text-secondary-500 mt-1 ml-4">Manage your charging stations and ports</p>
        </div>
        <Button icon={Plus} onClick={() => setShowAddModal(true)}>
          Add Station
        </Button>
      </div>

      {/* Stations Grid */}
      {stations.length > 0 ? (
        <div className="space-y-6">
          {stations.map((station) => (
            <div key={station.id} className="card">
              {/* Station Header */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-secondary-100">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-secondary-100 flex-shrink-0">
                    <img
                      src={station.image}
                      alt={station.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/80?text=EV';
                      }}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-secondary-900">{station.name}</h3>
                      <Badge variant={station.status === 'available' ? 'success' : station.status === 'busy' ? 'warning' : 'danger'}>
                        {getStatusText(station.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-secondary-500 text-sm">
                      <MapPin className="w-4 h-4" />
                      <span>{station.address}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="text-secondary-600">
                        <strong>{station.ports.filter(p => p.status === 'available').length}</strong>/{station.ports.length} ports available
                      </span>
                      <span className="text-secondary-600">
                        Operating: <strong>{station.operatingHours}</strong>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    icon={DollarSign}
                    onClick={() => handleEditPricing(station)}
                  >
                    Pricing
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    icon={Edit}
                    onClick={() => handleEditStation(station)}
                  >
                    Edit
                  </Button>
                </div>
              </div>

              {/* Pricing Info */}
              <div className="py-4 border-b border-secondary-100">
                <h4 className="text-sm font-medium text-secondary-700 mb-3">Current Pricing</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {station.pricing.normal && (
                    <>
                      <div className="p-3 bg-secondary-50 rounded-lg">
                        <p className="text-xs text-secondary-500">Normal (Base)</p>
                        <p className="font-semibold text-secondary-900">{formatCurrency(station.pricing.normal.base)}/kWh</p>
                      </div>
                      <div className="p-3 bg-secondary-50 rounded-lg">
                        <p className="text-xs text-secondary-500">Normal (Peak)</p>
                        <p className="font-semibold text-secondary-900">{formatCurrency(station.pricing.normal.peak)}/kWh</p>
                      </div>
                    </>
                  )}
                  {station.pricing.fast && (
                    <>
                      <div className="p-3 bg-primary-50 rounded-lg">
                        <p className="text-xs text-primary-600">Fast (Base)</p>
                        <p className="font-semibold text-secondary-900">{formatCurrency(station.pricing.fast.base)}/kWh</p>
                      </div>
                      <div className="p-3 bg-primary-50 rounded-lg">
                        <p className="text-xs text-primary-600">Fast (Peak)</p>
                        <p className="font-semibold text-secondary-900">{formatCurrency(station.pricing.fast.peak)}/kWh</p>
                      </div>
                    </>
                  )}
                </div>
                {station.peakHours && (
                  <p className="text-xs text-secondary-500 mt-2">
                    Peak Hours: {station.peakHours.start} - {station.peakHours.end}
                  </p>
                )}
              </div>

              {/* Ports Grid */}
              <div className="pt-4">
                <h4 className="text-sm font-medium text-secondary-700 mb-3">Charging Ports</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {station.ports.map((port) => (
                    <div
                      key={port.id}
                      className={`p-4 rounded-xl border-2 ${
                        port.status === 'available' ? 'border-green-200 bg-green-50' :
                        port.status === 'busy' ? 'border-amber-200 bg-amber-50' :
                        'border-secondary-200 bg-secondary-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-secondary-900">Port #{port.id}</span>
                        <Badge 
                          variant={port.status === 'available' ? 'success' : port.status === 'busy' ? 'warning' : 'danger'}
                          size="sm"
                        >
                          {getStatusText(port.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-secondary-600">{port.type}</p>
                      <p className="text-sm text-secondary-600">{port.power}kW • {formatCurrency(port.price)}/kWh</p>
                      <div className="mt-3 flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleTogglePort(station.id, port.id, port.status)}
                        >
                          <Power className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Building2}
          title="No stations yet"
          description="Add your first charging station to get started"
          action={
            <Button icon={Plus} onClick={() => setShowAddModal(true)}>
              Add Station
            </Button>
          }
        />
      )}

      {/* Add Station Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetAddData();
        }}
        title="Add Station"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Station Name"
              value={addData.name}
              onChange={(e) => setAddData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter station name"
            />
            <Input
              label="City"
              value={addData.city}
              onChange={(e) => setAddData(prev => ({ ...prev, city: e.target.value }))}
              placeholder="Enter city"
            />
          </div>
          <Input
            label="Address"
            value={addData.address}
            onChange={(e) => setAddData(prev => ({ ...prev, address: e.target.value }))}
            placeholder="Enter full address"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Operating Hours"
              value={addData.operatingHours}
              onChange={(e) => setAddData(prev => ({ ...prev, operatingHours: e.target.value }))}
              placeholder="e.g., 24/7"
            />
            <Input
              label="Image URL (optional)"
              value={addData.image}
              onChange={(e) => setAddData(prev => ({ ...prev, image: e.target.value }))}
              placeholder="https://..."
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Ports"
              type="number"
              min="1"
              value={addData.portCount}
              onChange={(e) => setAddData(prev => ({ ...prev, portCount: e.target.value }))}
            />
            <Input
              label="Base Price (₹/kWh)"
              type="number"
              step="0.01"
              value={addData.basePrice}
              onChange={(e) => setAddData(prev => ({ ...prev, basePrice: e.target.value }))}
            />
            <Input
              label="Peak Price (₹/kWh)"
              type="number"
              step="0.01"
              value={addData.peakPrice}
              onChange={(e) => setAddData(prev => ({ ...prev, peakPrice: e.target.value }))}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                setShowAddModal(false);
                resetAddData();
              }}
            >
              Cancel
            </Button>
            <Button fullWidth onClick={handleCreateStation} loading={creatingStation}>
              Add Station
            </Button>
          </div>
        </div>
      </Modal>

      {/* Pricing Modal */}
      <Modal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        title={`Edit Pricing - ${selectedStation?.name}`}
        size="md"
      >
        <div className="space-y-6">
          <div>
            <h4 className="font-medium text-secondary-900 mb-3">Normal AC Charging</h4>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Base Rate (₹/kWh)"
                type="number"
                step="0.01"
                value={pricingData.normalBase}
                onChange={(e) => setPricingData(prev => ({ ...prev, normalBase: e.target.value }))}
              />
              <Input
                label="Peak Rate (₹/kWh)"
                type="number"
                step="0.01"
                value={pricingData.normalPeak}
                onChange={(e) => setPricingData(prev => ({ ...prev, normalPeak: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <h4 className="font-medium text-secondary-900 mb-3">Fast DC Charging</h4>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Base Rate (₹/kWh)"
                type="number"
                step="0.01"
                value={pricingData.fastBase}
                onChange={(e) => setPricingData(prev => ({ ...prev, fastBase: e.target.value }))}
              />
              <Input
                label="Peak Rate (₹/kWh)"
                type="number"
                step="0.01"
                value={pricingData.fastPeak}
                onChange={(e) => setPricingData(prev => ({ ...prev, fastPeak: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <h4 className="font-medium text-secondary-900 mb-3">Peak Hours</h4>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Time"
                type="time"
                value={pricingData.peakStart}
                onChange={(e) => setPricingData(prev => ({ ...prev, peakStart: e.target.value }))}
              />
              <Input
                label="End Time"
                type="time"
                value={pricingData.peakEnd}
                onChange={(e) => setPricingData(prev => ({ ...prev, peakEnd: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="secondary" fullWidth onClick={() => setShowPricingModal(false)}>
              Cancel
            </Button>
            <Button fullWidth onClick={handleSavePricing}>
              Save Pricing
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Station Modal */}
      <Modal
        isOpen={showEditModal && selectedStation}
        onClose={() => {
          setShowEditModal(false);
          setSelectedStation(null);
          setEditData({
            name: '',
            address: '',
            operatingHours: '',
            status: '',
          });
        }}
        title={`Edit Station - ${selectedStation?.name}`}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Station Name"
            value={editData.name}
            onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
          />
          <Input
            label="Address"
            value={editData.address}
            onChange={(e) => setEditData(prev => ({ ...prev, address: e.target.value }))}
          />
          <Input
            label="Operating Hours"
            value={editData.operatingHours}
            onChange={(e) => setEditData(prev => ({ ...prev, operatingHours: e.target.value }))}
            placeholder="e.g., 24/7 or 6:00 AM - 11:00 PM"
          />
          <Select
            label="Status"
            value={editData.status}
            onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value }))}
            options={[
              { value: 'available', label: 'Available' },
              { value: 'busy', label: 'Busy' },
              { value: 'offline', label: 'Offline' },
            ]}
          />

          <div className="flex gap-3 pt-4">
            <Button variant="secondary" fullWidth onClick={() => {
              setShowEditModal(false);
              setSelectedStation(null);
              setEditData({
                name: '',
                address: '',
                operatingHours: '',
                status: '',
              });
            }}>
              Cancel
            </Button>
            <Button fullWidth onClick={handleSaveStation}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Stations;
