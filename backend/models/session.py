from datetime import datetime
from bson import ObjectId

class Session:
    """Charging Session model for MongoDB"""
    
    collection_name = 'sessions'
    
    def __init__(self, user_id, station_id, port_id, charging_type, payment_method, station_name=None):
        self.order_id = f"ORD-{datetime.utcnow().strftime('%Y')}-{ObjectId()}"
        self.user_id = user_id
        self.station_id = station_id
        self.station_name = station_name
        self.port_id = port_id
        self.start_time = datetime.utcnow()
        self.end_time = None
        self.duration = None
        self.energy_delivered = 0.0
        self.cost = None
        self.status = 'active'  # 'active', 'completed', 'cancelled'
        self.charging_type = charging_type
        self.payment_method = payment_method
        self.progress = 0
        self.estimated_completion = None
        self.battery_start = None
        self.battery_end = None
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
    
    def to_dict(self):
        """Convert to dictionary for MongoDB insertion"""
        return {
            'order_id': self.order_id,
            'user_id': self.user_id,
            'station_id': self.station_id,
            'station_name': self.station_name,
            'port_id': self.port_id,
            'start_time': self.start_time,
            'end_time': self.end_time,
            'duration': self.duration,
            'energy_delivered': self.energy_delivered,
            'cost': self.cost,
            'status': self.status,
            'charging_type': self.charging_type,
            'payment_method': self.payment_method,
            'progress': self.progress,
            'estimated_completion': self.estimated_completion,
            'battery_start': self.battery_start,
            'battery_end': self.battery_end,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }
    
    @staticmethod
    def from_dict(data):
        """Create Session instance from dictionary"""
        session = Session.__new__(Session)
        session.id = str(data.get('_id', ''))
        session.order_id = data.get('order_id')
        session.user_id = data.get('user_id')
        session.station_id = data.get('station_id')
        session.station_name = data.get('station_name')
        session.port_id = data.get('port_id')
        session.start_time = data.get('start_time')
        session.end_time = data.get('end_time')
        session.duration = data.get('duration')
        session.energy_delivered = data.get('energy_delivered', 0.0)
        session.cost = data.get('cost')
        session.status = data.get('status', 'active')
        session.charging_type = data.get('charging_type')
        session.payment_method = data.get('payment_method')
        session.progress = data.get('progress', 0)
        session.estimated_completion = data.get('estimated_completion')
        session.battery_start = data.get('battery_start')
        session.battery_end = data.get('battery_end')
        session.created_at = data.get('created_at')
        session.updated_at = data.get('updated_at')
        return session
    
    def to_response_dict(self):
        """Convert to API response format"""
        return {
            'id': self.id if hasattr(self, 'id') else None,
            'orderId': self.order_id,
            'userId': str(self.user_id) if self.user_id else None,
            'stationId': str(self.station_id) if self.station_id else None,
            'stationName': self.station_name,
            'portId': self.port_id,
            'startTime': self.start_time.isoformat() if self.start_time else None,
            'endTime': self.end_time.isoformat() if self.end_time else None,
            'duration': self.duration,
            'energyDelivered': self.energy_delivered,
            'cost': self.cost,
            'status': self.status,
            'chargingType': self.charging_type,
            'paymentMethod': self.payment_method,
            'progress': self.progress,
            'estimatedCompletion': self.estimated_completion.isoformat() if self.estimated_completion else None,
            'batteryStart': self.battery_start,
            'batteryEnd': self.battery_end
        }
