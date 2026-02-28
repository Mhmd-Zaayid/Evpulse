from datetime import datetime
from bson import ObjectId
import re

class Station:
    """Charging Station model for MongoDB"""
    
    collection_name = 'stations'
    
    def __init__(self, name, address, city, coordinates, operator_id, status='available',
                 amenities=None, operating_hours='24/7', ports=None, pricing=None,
                 peak_hours=None, image=None, nearby_landmark=None):
        self.name = name
        self.nearby_landmark = self._clean_text(nearby_landmark) or self._clean_text(address)
        self.address = self.format_display_address(city, self.nearby_landmark)
        self.city = city
        self.coordinates = coordinates  # {lat, lng}
        self.operator_id = operator_id
        self.status = status  # 'available', 'busy', 'offline'
        self.rating = 0.0
        self.total_reviews = 0
        self.amenities = amenities or []
        self.operating_hours = operating_hours
        self.ports = ports or []  # [{id, type, power, status, price}]
        self.pricing = pricing or {}  # {normal: {base, peak}, fast: {base, peak}}
        self.peak_hours = peak_hours  # {start, end}
        self.image = image
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
    
    def to_dict(self):
        """Convert to dictionary for MongoDB insertion"""
        return {
            'name': self.name,
            'address': self.address,
            'nearby_landmark': self.nearby_landmark,
            'city': self.city,
            'coordinates': self.coordinates,
            'operator_id': self.operator_id,
            'status': self.status,
            'rating': self.rating,
            'total_reviews': self.total_reviews,
            'amenities': self.amenities,
            'operating_hours': self.operating_hours,
            'ports': self.ports,
            'pricing': self.pricing,
            'peak_hours': self.peak_hours,
            'image': self.image,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }
    
    @staticmethod
    def from_dict(data):
        """Create Station instance from dictionary"""
        station = Station.__new__(Station)
        station.id = str(data.get('_id', ''))
        station.name = data.get('name')
        station.address = data.get('address')
        station.nearby_landmark = data.get('nearby_landmark') or data.get('nearbyLandmark') or data.get('address')
        station.city = data.get('city')
        station.coordinates = data.get('coordinates', {})
        station.operator_id = data.get('operator_id')
        station.status = data.get('status', 'available')
        station.rating = data.get('rating', 0.0)
        station.total_reviews = data.get('total_reviews', 0)
        station.amenities = data.get('amenities', [])
        station.operating_hours = data.get('operating_hours', '24/7')
        station.ports = data.get('ports', [])
        station.pricing = data.get('pricing', {})
        station.peak_hours = data.get('peak_hours')
        station.image = data.get('image')
        station.created_at = data.get('created_at')
        station.updated_at = data.get('updated_at')
        return station
    
    def to_response_dict(self, distance=None):
        """Convert to API response format"""
        display_address = self.format_display_address(self.city, self.nearby_landmark or self.address)
        result = {
            'id': self.id if hasattr(self, 'id') else None,
            'name': self.name,
            'address': display_address,
            'nearbyLandmark': self._clean_text(self.nearby_landmark),
            'city': self.city,
            'coordinates': self.coordinates,
            'operatorId': str(self.operator_id) if self.operator_id else None,
            'status': self.status,
            'rating': self.rating,
            'totalReviews': self.total_reviews,
            'amenities': self.amenities,
            'operatingHours': self.operating_hours,
            'ports': self.ports,
            'pricing': self.pricing,
            'peakHours': self.peak_hours,
            'image': self.image
        }
        if distance is not None:
            result['distance'] = distance
        return result

    @staticmethod
    def _clean_text(value):
        return str(value or '').strip()

    @staticmethod
    def format_display_address(city, nearby_landmark):
        city_text = Station._clean_text(city)
        landmark_text = Station._clean_text(nearby_landmark)

        if city_text and landmark_text:
            city_prefix_pattern = r'^\s*' + re.escape(city_text) + r'\s*[-,]'
            if re.match(city_prefix_pattern, landmark_text, re.IGNORECASE):
                return landmark_text
            if landmark_text.lower() == city_text.lower():
                return city_text
            return f'{city_text} - {landmark_text}'

        return city_text or landmark_text
