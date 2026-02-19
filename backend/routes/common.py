from functools import wraps
from datetime import datetime
from bson import ObjectId
from flask import jsonify, g
from flask_jwt_extended import jwt_required, get_jwt_identity

from database import get_db


DB_UNAVAILABLE = {
    'success': False,
    'error': 'Database connection unavailable. Please try again later.'
}


def to_object_id(value):
    if isinstance(value, ObjectId):
        return value
    if value is None:
        return None
    try:
        return ObjectId(str(value))
    except Exception:
        return None


def as_string_id(value):
    if isinstance(value, ObjectId):
        return str(value)
    return value


def now_utc():
    return datetime.utcnow()


def role_required(*roles):
    def decorator(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            db = get_db()
            if db is None:
                return jsonify(DB_UNAVAILABLE), 503

            identity = get_jwt_identity()
            user_id = to_object_id(identity)
            if not user_id:
                return jsonify({'success': False, 'error': 'Invalid token identity'}), 401

            user = db.users.find_one({'_id': user_id})
            if not user:
                return jsonify({'success': False, 'error': 'User not found'}), 404

            if roles and user.get('role') not in roles:
                return jsonify({'success': False, 'error': 'Unauthorized'}), 403

            g.db = db
            g.current_user = user
            g.current_user_id = user_id
            return fn(*args, **kwargs)

        return wrapper

    return decorator


def owner_or_admin(target_user_id, current_user):
    target_oid = to_object_id(target_user_id)
    if not target_oid:
        return False
    if current_user.get('role') == 'admin':
        return True
    return target_oid == current_user.get('_id')
