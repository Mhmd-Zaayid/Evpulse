from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import get_db
from models.user import User
from bson import ObjectId
from datetime import datetime

users_bp = Blueprint('users', __name__)

@users_bp.route('/<user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    """Get user by ID"""
    try:
        db = get_db()
        if db is None:
            return jsonify({'success': False, 'error': 'Database connection unavailable. Please try again later.'}), 503
        
        user_data = db.users.find_one({'_id': ObjectId(user_id)})
        
        if not user_data:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        user = User.from_dict(user_data)
        return jsonify({'success': True, 'data': user.to_safe_dict()})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@users_bp.route('/<user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    """Update user profile"""
    try:
        db = get_db()
        if db is None:
            return jsonify({'success': False, 'error': 'Database connection unavailable. Please try again later.'}), 503
        
        current_user_id = get_jwt_identity()
        
        # Check authorization
        if current_user_id != user_id:
            current_user = db.users.find_one({'_id': ObjectId(current_user_id)})
            if current_user.get('role') != 'admin':
                return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        
        # Fields that can be updated
        allowed_fields = ['name', 'phone', 'avatar', 'vehicle', 'company', 'department']
        update_data = {k: v for k, v in data.items() if k in allowed_fields}
        update_data['updated_at'] = datetime.utcnow()
        
        result = db.users.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': update_data}
        )
        
        if result.modified_count == 0:
            return jsonify({'success': False, 'error': 'User not found or no changes made'}), 404
        
        # Get updated user
        user_data = db.users.find_one({'_id': ObjectId(user_id)})
        user = User.from_dict(user_data)
        
        return jsonify({'success': True, 'data': user.to_safe_dict()})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@users_bp.route('/<user_id>/status', methods=['PUT'])
@jwt_required()
def update_user_status(user_id):
    """Update user status (admin only)"""
    try:
        db = get_db()
        if db is None:
            return jsonify({'success': False, 'error': 'Database connection unavailable. Please try again later.'}), 503
        
        current_user_id = get_jwt_identity()
        current_user = db.users.find_one({'_id': ObjectId(current_user_id)})
        
        if current_user.get('role') != 'admin':
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        is_active = data.get('isActive')
        
        if is_active is None:
            return jsonify({'success': False, 'error': 'isActive field is required'}), 400
        
        result = db.users.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {'is_active': is_active, 'updated_at': datetime.utcnow()}}
        )
        
        if result.modified_count == 0:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        return jsonify({'success': True, 'message': 'User status updated'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@users_bp.route('/search', methods=['GET'])
@jwt_required()
def search_users():
    """Search users (admin only)"""
    try:
        db = get_db()
        if db is None:
            return jsonify({'success': False, 'error': 'Database connection unavailable. Please try again later.'}), 503
        
        current_user_id = get_jwt_identity()
        current_user = db.users.find_one({'_id': ObjectId(current_user_id)})
        
        if current_user.get('role') != 'admin':
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        query = request.args.get('q', '')
        role = request.args.get('role')
        
        search_query = {}
        if query:
            search_query['$or'] = [
                {'name': {'$regex': query, '$options': 'i'}},
                {'email': {'$regex': query, '$options': 'i'}}
            ]
        if role:
            search_query['role'] = role
        
        users_data = list(db.users.find(search_query).limit(50))
        users = [User.from_dict(data).to_safe_dict() for data in users_data]
        
        return jsonify({'success': True, 'data': users})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
