from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app import mongo
from models.user import User
from bson import ObjectId

auth_bp = Blueprint('auth', __name__)

# Mock users for when MongoDB is not available
MOCK_USERS = {
    'user@evpulse.com': {
        '_id': '507f1f77bcf86cd799439011',
        'email': 'user@evpulse.com',
        'password': 'user123',
        'name': 'John Doe',
        'role': 'user',
        'phone': '+1 (555) 123-4567',
        'vehicle': {'make': 'Tesla', 'model': 'Model 3', 'batteryCapacity': 75}
    },
    'operator@evpulse.com': {
        '_id': '507f1f77bcf86cd799439012',
        'email': 'operator@evpulse.com',
        'password': 'operator123',
        'name': 'Jane Smith',
        'role': 'operator',
        'phone': '+1 (555) 987-6543',
        'company': {'name': 'Green Charge Networks', 'stationCount': 12}
    },
    'admin@evpulse.com': {
        '_id': '507f1f77bcf86cd799439013',
        'email': 'admin@evpulse.com',
        'password': 'admin123',
        'name': 'Admin User',
        'role': 'admin',
        'phone': '+1 (555) 000-0000'
    }
}

def is_db_available():
    """Check if MongoDB is available"""
    try:
        return mongo.db is not None
    except:
        return False

@auth_bp.route('/login', methods=['POST'])
def login():
    """User login endpoint"""
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'success': False, 'error': 'Email and password are required'}), 400
        
        # Check if MongoDB is available
        if is_db_available():
            # Find user by email in database
            user_data = mongo.db.users.find_one({'email': email})
            
            if not user_data:
                return jsonify({'success': False, 'error': 'Invalid email or password'}), 401
            
            # Verify password
            if not User.check_password(password, user_data['password']):
                return jsonify({'success': False, 'error': 'Invalid email or password'}), 401
            
            # Create user object and generate token
            user = User.from_dict(user_data)
            access_token = create_access_token(identity=str(user_data['_id']))
            
            return jsonify({
                'success': True,
                'user': user.to_safe_dict(),
                'token': access_token
            })
        else:
            # Use mock data when DB is not available
            mock_user = MOCK_USERS.get(email)
            
            if not mock_user or mock_user['password'] != password:
                return jsonify({'success': False, 'error': 'Invalid email or password'}), 401
            
            access_token = create_access_token(identity=mock_user['_id'])
            
            # Return user data without password
            user_response = {k: v for k, v in mock_user.items() if k != 'password'}
            user_response['id'] = user_response.pop('_id')
            
            return jsonify({
                'success': True,
                'user': user_response,
                'token': access_token
            })
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@auth_bp.route('/register', methods=['POST'])
def register():
    """User registration endpoint"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['email', 'password', 'name']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'success': False, 'error': f'{field} is required'}), 400
        
        if is_db_available():
            # Check if user already exists
            existing_user = mongo.db.users.find_one({'email': data['email']})
            if existing_user:
                return jsonify({'success': False, 'error': 'Email already registered'}), 400
            
            # Create new user
            user = User(
                email=data['email'],
                password=data['password'],
                name=data['name'],
                role=data.get('role', 'user'),
                phone=data.get('phone'),
                vehicle=data.get('vehicle'),
                company=data.get('company')
            )
            
            result = mongo.db.users.insert_one(user.to_dict())
            user.id = str(result.inserted_id)
            
            # Generate token
            access_token = create_access_token(identity=user.id)
            
            return jsonify({
                'success': True,
                'user': user.to_safe_dict(),
                'token': access_token
            }), 201
        else:
            # Mock registration when DB is not available
            if data['email'] in MOCK_USERS:
                return jsonify({'success': False, 'error': 'Email already registered'}), 400
            
            mock_id = '507f1f77bcf86cd799439099'
            access_token = create_access_token(identity=mock_id)
            
            user_response = {
                'id': mock_id,
                'email': data['email'],
                'name': data['name'],
                'role': data.get('role', 'user'),
                'phone': data.get('phone'),
                'vehicle': data.get('vehicle'),
                'company': data.get('company')
            }
            
            return jsonify({
                'success': True,
                'user': user_response,
                'token': access_token
            }), 201
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current authenticated user"""
    try:
        user_id = get_jwt_identity()
        
        if is_db_available():
            user_data = mongo.db.users.find_one({'_id': ObjectId(user_id)})
            
            if not user_data:
                return jsonify({'success': False, 'error': 'User not found'}), 404
            
            user = User.from_dict(user_data)
            return jsonify({'success': True, 'user': user.to_safe_dict()})
        else:
            # Find user in mock data by ID
            for mock_user in MOCK_USERS.values():
                if mock_user['_id'] == user_id:
                    user_response = {k: v for k, v in mock_user.items() if k != 'password'}
                    user_response['id'] = user_response.pop('_id')
                    return jsonify({'success': True, 'user': user_response})
            
            return jsonify({'success': False, 'error': 'User not found'}), 404
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@auth_bp.route('/update-profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update user profile"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Fields that can be updated
        allowed_fields = ['name', 'phone', 'avatar', 'vehicle', 'company', 'profileImage']
        update_data = {k: v for k, v in data.items() if k in allowed_fields}
        
        if not update_data:
            return jsonify({'success': False, 'error': 'No valid fields to update'}), 400
        
        if is_db_available():
            result = mongo.db.users.update_one(
                {'_id': ObjectId(user_id)},
                {'$set': update_data}
            )
            
            if result.modified_count == 0:
                return jsonify({'success': False, 'error': 'User not found or no changes made'}), 404
            
            # Get updated user
            user_data = mongo.db.users.find_one({'_id': ObjectId(user_id)})
            user = User.from_dict(user_data)
            
            return jsonify({'success': True, 'user': user.to_safe_dict()})
        else:
            # Mock update - just return success
            for mock_user in MOCK_USERS.values():
                if mock_user['_id'] == user_id:
                    user_response = {k: v for k, v in mock_user.items() if k != 'password'}
                    user_response['id'] = user_response.pop('_id')
                    user_response.update(update_data)
                    return jsonify({'success': True, 'user': user_response})
            
            return jsonify({'success': False, 'error': 'User not found'}), 404
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@auth_bp.route('/change-password', methods=['PUT'])
@jwt_required()
def change_password():
    """Change user password"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        current_password = data.get('currentPassword')
        new_password = data.get('newPassword')
        
        if not current_password or not new_password:
            return jsonify({'success': False, 'error': 'Current and new password are required'}), 400
        
        if is_db_available():
            user_data = mongo.db.users.find_one({'_id': ObjectId(user_id)})
            
            if not user_data:
                return jsonify({'success': False, 'error': 'User not found'}), 404
            
            # Verify current password
            if not User.check_password(current_password, user_data['password']):
                return jsonify({'success': False, 'error': 'Current password is incorrect'}), 401
            
            # Update password
            new_hashed = User._hash_password(new_password)
            mongo.db.users.update_one(
                {'_id': ObjectId(user_id)},
                {'$set': {'password': new_hashed}}
            )
            
            return jsonify({'success': True, 'message': 'Password changed successfully'})
        else:
            # Mock mode - just return success
            for mock_user in MOCK_USERS.values():
                if mock_user['_id'] == user_id:
                    if mock_user['password'] != current_password:
                        return jsonify({'success': False, 'error': 'Current password is incorrect'}), 401
                    return jsonify({'success': True, 'message': 'Password changed successfully'})
            
            return jsonify({'success': False, 'error': 'User not found'}), 404
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
