from datetime import datetime
from bson import ObjectId

class Review:
    """Review model for MongoDB"""
    
    collection_name = 'reviews'
    
    def __init__(self, station_id, user_id, user_name, rating, comment=''):
        self.station_id = station_id
        self.user_id = user_id
        self.user_name = user_name
        self.rating = rating  # 1-5
        self.comment = comment
        self.helpful = 0
        self.timestamp = datetime.utcnow()
        self.created_at = datetime.utcnow()
    
    def to_dict(self):
        """Convert to dictionary for MongoDB insertion"""
        return {
            'station_id': self.station_id,
            'user_id': self.user_id,
            'user_name': self.user_name,
            'rating': self.rating,
            'comment': self.comment,
            'helpful': self.helpful,
            'timestamp': self.timestamp,
            'created_at': self.created_at
        }
    
    @staticmethod
    def from_dict(data):
        """Create Review instance from dictionary"""
        review = Review.__new__(Review)
        review.id = str(data.get('_id', ''))
        review.station_id = data.get('station_id')
        review.user_id = data.get('user_id')
        review.user_name = data.get('user_name')
        review.rating = data.get('rating', 0)
        review.comment = data.get('comment', '')
        review.helpful = data.get('helpful', 0)
        review.timestamp = data.get('timestamp')
        review.created_at = data.get('created_at')
        return review
    
    def to_response_dict(self):
        """Convert to API response format"""
        return {
            'id': self.id if hasattr(self, 'id') else None,
            'stationId': str(self.station_id) if self.station_id else None,
            'userId': str(self.user_id) if self.user_id else None,
            'userName': self.user_name,
            'rating': self.rating,
            'comment': self.comment,
            'helpful': self.helpful,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }
