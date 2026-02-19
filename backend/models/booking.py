from datetime import datetime
from bson import ObjectId

class Booking:
    """Booking model for MongoDB"""
    
    collection_name = 'bookings'
    
    def __init__(self, user_id, station_id, port_id, date, time_slot, charging_type, estimated_cost=0):
        self.user_id = user_id
        self.station_id = station_id
        self.port_id = port_id
        self.date = date
        self.time_slot = time_slot
        self.charging_type = charging_type
        self.status = 'confirmed'  # 'confirmed', 'pending', 'cancelled', 'completed'
        self.estimated_cost = estimated_cost
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
    
    def to_dict(self):
        """Convert to dictionary for MongoDB insertion"""
        return {
            'user_id': self.user_id,
            'station_id': self.station_id,
            'port_id': self.port_id,
            'date': self.date,
            'time_slot': self.time_slot,
            'charging_type': self.charging_type,
            'status': self.status,
            'estimated_cost': self.estimated_cost,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }
    
    @staticmethod
    def from_dict(data):
        """Create Booking instance from dictionary"""
        booking = Booking.__new__(Booking)
        booking.id = str(data.get('_id', ''))
        booking.user_id = data.get('user_id')
        booking.station_id = data.get('station_id')
        booking.port_id = data.get('port_id')
        booking.date = data.get('date')
        booking.time_slot = data.get('time_slot')
        booking.charging_type = data.get('charging_type')
        booking.status = data.get('status', 'confirmed')
        booking.estimated_cost = data.get('estimated_cost', 0)
        booking.created_at = data.get('created_at')
        booking.updated_at = data.get('updated_at')
        return booking
    
    def to_response_dict(self):
        """Convert to API response format"""
        return {
            'id': self.id if hasattr(self, 'id') else None,
            'userId': str(self.user_id) if self.user_id else None,
            'stationId': str(self.station_id) if self.station_id else None,
            'portId': self.port_id,
            'date': self.date,
            'timeSlot': self.time_slot,
            'chargingType': self.charging_type,
            'status': self.status,
            'estimatedCost': self.estimated_cost,
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }
