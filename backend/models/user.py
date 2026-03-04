from datetime import datetime
from bson import ObjectId
import bcrypt

class User:
    """User model for MongoDB"""
    
    collection_name = 'users'
    
    def __init__(self, email, password, name, role='user', phone=None, avatar=None, 
                 vehicle=None, company=None, stations=None, department=None):
        self.email = email
        self.password = self._hash_password(password)
        self.name = name
        self.role = role  # 'user', 'operator', 'admin'
        self.phone = phone
        self.avatar = avatar
        self.vehicle = vehicle  # For users: {make, model, batteryCapacity, range}
        self.company = company  # For operators
        self.stations = stations or []  # Station IDs for operators
        self.department = department  # For admins
        self.joined_date = datetime.utcnow()
        self.is_active = True
        self.status = 'active'
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
    
    @staticmethod
    def _hash_password(password):
        """Hash password using bcrypt"""
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    @staticmethod
    def check_password(password, hashed):
        """Verify password against hash"""
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    
    def to_dict(self):
        """Convert to dictionary for MongoDB insertion"""
        return {
            'email': self.email,
            'password': self.password,
            'name': self.name,
            'role': self.role,
            'phone': self.phone,
            'avatar': self.avatar,
            'vehicle': self.vehicle,
            'company': self.company,
            'stations': self.stations,
            'department': self.department,
            'joined_date': self.joined_date,
            'is_active': self.is_active,
            'status': self.status,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }
    
    @staticmethod
    def from_dict(data):
        """Create User instance from dictionary"""
        user = User.__new__(User)
        user.id = str(data.get('_id', ''))
        user.email = data.get('email')
        user.password = data.get('password')
        user.name = data.get('name')
        user.role = data.get('role', 'user')
        user.phone = data.get('phone')
        user.avatar = data.get('avatar')
        user.vehicle = data.get('vehicle')
        user.company = data.get('company')
        user.stations = data.get('stations', [])
        user.department = data.get('department')
        user.joined_date = data.get('joined_date')
        user.is_active = data.get('is_active', True)
        user.status = data.get('status') or ('active' if user.is_active else 'inactive')
        user.created_at = data.get('created_at')
        user.updated_at = data.get('updated_at')
        return user
    
    def to_safe_dict(self):
        """Convert to dictionary without sensitive data"""
        return {
            'id': self.id if hasattr(self, 'id') else None,
            'email': self.email,
            'name': self.name,
            'role': self.role,
            'phone': self.phone,
            'avatar': self.avatar,
            'vehicle': self.vehicle,
            'company': self.company,
            'stations': self.stations,
            'department': self.department,
            'joinedDate': self.joined_date.isoformat() if self.joined_date else None,
            'isActive': self.is_active,
            'status': self.status
        }
