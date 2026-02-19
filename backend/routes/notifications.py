from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import get_db
from models.notification import Notification
from bson import ObjectId
from datetime import datetime
from routes.common import to_object_id

notifications_bp = Blueprint('notifications', __name__)

DB_UNAVAILABLE = {'success': False, 'error': 'Database connection unavailable. Please try again later.'}


def _normalize_user_id(user_id):
    if isinstance(user_id, ObjectId):
        return str(user_id)
    return str(user_id) if user_id is not None else None


def _is_admin(db, user_id):
    user_oid = to_object_id(user_id)
    if not user_oid:
        return False
    user = db.users.find_one({'_id': user_oid})
    return bool(user and user.get('role') == 'admin')


def _build_user_match(user_id):
    user_oid = to_object_id(user_id)
    values = [str(user_id)]
    if user_oid:
        values.append(user_oid)
        values.append(str(user_oid))
    deduped = []
    seen = set()
    for value in values:
        key = f"{type(value).__name__}:{value}"
        if key not in seen:
            deduped.append(value)
            seen.add(key)
    return {'$in': deduped}

@notifications_bp.route('/user/<user_id>', methods=['GET'])
@jwt_required()
def get_user_notifications(user_id):
    """Get all notifications for a user"""
    try:
        db = get_db()
        if db is None:
            return jsonify(DB_UNAVAILABLE), 503
        
        current_user_id = get_jwt_identity()
        if _normalize_user_id(current_user_id) != _normalize_user_id(user_id) and not _is_admin(db, current_user_id):
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403

        notifications_data = list(
            db.notifications.find({'user_id': _build_user_match(user_id)}).sort('timestamp', -1)
        )
        notifications = [Notification.from_dict(data).to_response_dict() for data in notifications_data]
        
        return jsonify({'success': True, 'data': notifications})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@notifications_bp.route('/<notification_id>/read', methods=['PUT'])
@jwt_required()
def mark_as_read(notification_id):
    """Mark a notification as read"""
    try:
        db = get_db()
        if db is None:
            return jsonify(DB_UNAVAILABLE), 503
        
        current_user_id = get_jwt_identity()
        notification_oid = to_object_id(notification_id)
        if not notification_oid:
            return jsonify({'success': False, 'error': 'Invalid notification id'}), 400

        notification = db.notifications.find_one({'_id': notification_oid})
        if not notification:
            return jsonify({'success': False, 'error': 'Notification not found'}), 404

        if _normalize_user_id(notification.get('user_id')) != _normalize_user_id(current_user_id) and not _is_admin(db, current_user_id):
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403

        result = db.notifications.update_one(
            {'_id': notification_oid},
            {'$set': {'read': True}}
        )
        
        if result.modified_count == 0:
            return jsonify({'success': False, 'error': 'Notification not found'}), 404
        
        return jsonify({'success': True, 'message': 'Notification marked as read'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@notifications_bp.route('/user/<user_id>/read-all', methods=['PUT'])
@jwt_required()
def mark_all_as_read(user_id):
    """Mark all notifications as read for a user"""
    try:
        db = get_db()
        if db is None:
            return jsonify(DB_UNAVAILABLE), 503
        
        current_user_id = get_jwt_identity()
        if _normalize_user_id(current_user_id) != _normalize_user_id(user_id) and not _is_admin(db, current_user_id):
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403

        db.notifications.update_many(
            {'user_id': _build_user_match(user_id), 'read': False},
            {'$set': {'read': True}}
        )
        
        return jsonify({'success': True, 'message': 'All notifications marked as read'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@notifications_bp.route('/<notification_id>', methods=['DELETE'])
@jwt_required()
def delete_notification(notification_id):
    """Delete a notification"""
    try:
        db = get_db()
        if db is None:
            return jsonify(DB_UNAVAILABLE), 503
        
        user_id = get_jwt_identity()
        notification_oid = to_object_id(notification_id)
        if not notification_oid:
            return jsonify({'success': False, 'error': 'Invalid notification id'}), 400

        notification = db.notifications.find_one({'_id': notification_oid})
        if not notification:
            return jsonify({'success': False, 'error': 'Notification not found'}), 404

        if _normalize_user_id(notification.get('user_id')) != _normalize_user_id(user_id) and not _is_admin(db, user_id):
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403

        db.notifications.delete_one({'_id': notification_oid})
        
        return jsonify({'success': True, 'message': 'Notification deleted'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@notifications_bp.route('/user/<user_id>/unread-count', methods=['GET'])
@jwt_required()
def get_unread_count(user_id):
    """Get count of unread notifications"""
    try:
        db = get_db()
        if db is None:
            return jsonify(DB_UNAVAILABLE), 503
        
        current_user_id = get_jwt_identity()
        if _normalize_user_id(current_user_id) != _normalize_user_id(user_id) and not _is_admin(db, current_user_id):
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403

        count = db.notifications.count_documents({
            'user_id': _build_user_match(user_id),
            'read': False
        })
        
        return jsonify({'success': True, 'data': {'count': count}})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
