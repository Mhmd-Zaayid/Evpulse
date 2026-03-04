from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import datetime
from database import get_db
from models.user import User
from bson import ObjectId

auth_bp = Blueprint('auth', __name__)


def _normalize_vehicle_payload(vehicle_data):
    if vehicle_data is None:
        return None, None
    if not isinstance(vehicle_data, dict):
        return None, 'Vehicle data must be an object'

    normalized_vehicle = dict(vehicle_data)
    battery_capacity = normalized_vehicle.get('batteryCapacity')
    if battery_capacity not in (None, ''):
        try:
            normalized_capacity = int(battery_capacity)
        except (TypeError, ValueError):
            return None, 'Battery capacity must be a whole number between 30 and 100 kWh'

        if normalized_capacity < 30 or normalized_capacity > 100:
            return None, 'Battery capacity must be between 30 and 100 kWh'

        normalized_vehicle['batteryCapacity'] = normalized_capacity

    return normalized_vehicle, None

@auth_bp.route('/login', methods=['POST'])
def login():
    """User login endpoint"""
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'success': False, 'error': 'Email and password are required'}), 400
        
        print(f"Login attempt for: {email}")
        
        db = get_db()
        
        # Check if database is available
        if db is None:
            print("   Database connection is None!")
            return jsonify({'success': False, 'error': 'Database connection unavailable. Please try again later.'}), 503
        
        # Find user by email in database
        user_data = db.users.find_one({'email': email})
        
        if not user_data:
            return jsonify({'success': False, 'error': 'Invalid email or password'}), 401
        
        # Verify password
        if not User.check_password(password, user_data['password']):
            return jsonify({'success': False, 'error': 'Invalid email or password'}), 401

        account_status = str(user_data.get('status') or '').strip().lower()
        is_active = user_data.get('is_active', True)
        if account_status == 'suspended' or (is_active is False and account_status != 'pending'):
            return jsonify({'success': False, 'error': 'Your account has been suspended'}), 403
        
        # Create user object and generate token
        user = User.from_dict(user_data)
        access_token = create_access_token(identity=str(user_data['_id']))
        
        return jsonify({
            'success': True,
            'user': user.to_safe_dict(),
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
                return jsonify({'success': False, 'error': f'{field.capitalize()} is required'}), 400
        
        db = get_db()
        # Check if database is available
        if db is None:
            return jsonify({'success': False, 'error': 'Database connection unavailable. Please try again later.'}), 503
        
        # Check if user already exists
        existing_user = db.users.find_one({'email': data['email']})
        if existing_user:
            return jsonify({'success': False, 'error': 'Email already registered'}), 400
        
        vehicle_payload, vehicle_error = _normalize_vehicle_payload(data.get('vehicle'))
        if vehicle_error:
            return jsonify({'success': False, 'error': vehicle_error}), 400

        # Create new user
        user = User(
            email=data['email'],
            password=data['password'],
            name=data['name'],
            role=data.get('role', 'user'),
            phone=data.get('phone'),
            vehicle=vehicle_payload,
            company=data.get('company')
        )
        
        result = db.users.insert_one(user.to_dict())
        user.id = str(result.inserted_id)
        
        # Generate token
        access_token = create_access_token(identity=user.id)
        
        return jsonify({
            'success': True,
            'user': user.to_safe_dict(),
            'token': access_token
        }), 201
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get user profile"""
    try:
        db = get_db()
        # Check if database is available
        if db is None:
            return jsonify({'success': False, 'error': 'Database connection unavailable. Please try again later.'}), 503
        
        user_id = get_jwt_identity()
        user_data = db.users.find_one({'_id': ObjectId(user_id)})
        
        if not user_data:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        user = User.from_dict(user_data)
        return jsonify({
            'success': True,
            'user': user.to_safe_dict()
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update user profile"""
    try:
        db = get_db()
        # Check if database is available
        if db is None:
            return jsonify({'success': False, 'error': 'Database connection unavailable. Please try again later.'}), 503
        
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Find user
        user_data = db.users.find_one({'_id': ObjectId(user_id)})
        if not user_data:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        vehicle_payload, vehicle_error = _normalize_vehicle_payload(data.get('vehicle'))
        if vehicle_error:
            return jsonify({'success': False, 'error': vehicle_error}), 400

        # Update allowed fields
        allowed_fields = ['name', 'phone', 'vehicle', 'company']
        update_data = {k: v for k, v in data.items() if k in allowed_fields}
        if 'vehicle' in update_data:
            update_data['vehicle'] = vehicle_payload
        update_data['updated_at'] = datetime.utcnow()
        
        # Update user in database
        db.users.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': update_data}
        )
        
        # Get updated user data
        updated_user_data = db.users.find_one({'_id': ObjectId(user_id)})
        user = User.from_dict(updated_user_data)
        
        return jsonify({
            'success': True,
            'user': user.to_safe_dict()
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Change user password"""
    try:
        db = get_db()
        # Check if database is available
        if db is None:
            return jsonify({'success': False, 'error': 'Database connection unavailable. Please try again later.'}), 503
        
        user_id = get_jwt_identity()
        data = request.get_json()
        
        current_password = data.get('currentPassword')
        new_password = data.get('newPassword')
        
        if not current_password or not new_password:
            return jsonify({'success': False, 'error': 'Current and new passwords are required'}), 400
        
        # Find user
        user_data = db.users.find_one({'_id': ObjectId(user_id)})
        if not user_data:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        # Verify current password
        if not User.check_password(current_password, user_data['password']):
            return jsonify({'success': False, 'error': 'Current password is incorrect'}), 400
        
        # Hash new password
        hashed_password = User.hash_password(new_password)
        
        # Update password in database
        db.users.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {'password': hashed_password, 'updated_at': datetime.utcnow()}}
        )
        
        return jsonify({
            'success': True,
            'message': 'Password updated successfully'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

