from datetime import datetime
from bson import ObjectId


def _iso_utc(dt):
    if not dt:
        return None
    iso = dt.isoformat()
    if dt.tzinfo is None:
        return f'{iso}Z'
    return iso

class Notification:
    """Notification model for MongoDB"""
    
    collection_name = 'notifications'
    
    def __init__(self, user_id, notification_type, title, message, action_url=None):
        self.user_id = user_id
        self.type = notification_type  # 'booking_confirmed', 'charging_complete', 'payment_success', 'promotion', 'reminder'
        self.title = title
        self.message = message
        self.action_url = action_url
        self.read = False
        self.timestamp = datetime.utcnow()
        self.created_at = datetime.utcnow()
    
    def to_dict(self):
        """Convert to dictionary for MongoDB insertion"""
        return {
            'user_id': self.user_id,
            'type': self.type,
            'title': self.title,
            'message': self.message,
            'action_url': self.action_url,
            'read': self.read,
            'timestamp': self.timestamp,
            'created_at': self.created_at
        }
    
    @staticmethod
    def from_dict(data):
        """Create Notification instance from dictionary"""
        notif = Notification.__new__(Notification)
        notif.id = str(data.get('_id', ''))
        notif.user_id = data.get('user_id')
        notif.type = data.get('type')
        notif.title = data.get('title')
        notif.message = data.get('message')
        notif.action_url = data.get('action_url')
        notif.read = data.get('read', False)
        notif.timestamp = data.get('timestamp')
        notif.created_at = data.get('created_at')
        return notif
    
    def to_response_dict(self):
        """Convert to API response format"""
        return {
            'id': self.id if hasattr(self, 'id') else None,
            'userId': self.user_id,
            'type': self.type,
            'title': self.title,
            'message': self.message,
            'actionUrl': self.action_url,
            'read': self.read,
            'timestamp': _iso_utc(self.timestamp),
            'createdAt': _iso_utc(self.created_at),
        }
