from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import get_db
from models.user import User
from bson import ObjectId
from datetime import datetime, timedelta
from models.booking import Booking
from models.session import Session
from models.transaction import Transaction
from routes.common import to_object_id

admin_bp = Blueprint('admin', __name__)

DB_UNAVAILABLE = {'success': False, 'error': 'Database connection unavailable. Please try again later.'}


def _build_user_name_map(db, user_ids):
    valid_ids = []
    for user_id in user_ids:
        oid = to_object_id(user_id)
        if oid:
            valid_ids.append(oid)

    if not valid_ids:
        return {}

    users = list(db.users.find(
        {'_id': {'$in': valid_ids}},
        {'name': 1, 'email': 1}
    ))
    return {
        str(user['_id']): user.get('name') or user.get('email') or 'Unknown User'
        for user in users
    }


def _build_station_meta_map(db, station_ids):
    valid_ids = []
    for station_id in station_ids:
        oid = to_object_id(station_id)
        if oid:
            valid_ids.append(oid)

    if not valid_ids:
        return {}

    stations = list(db.stations.find(
        {'_id': {'$in': valid_ids}},
        {'name': 1, 'operator_id': 1}
    ))
    return {
        str(station['_id']): {
            'name': station.get('name') or 'Unknown Station',
            'operatorId': str(station.get('operator_id')) if station.get('operator_id') else None,
        }
        for station in stations
    }

def require_admin():
    """Check admin role. Returns (is_admin, db) tuple."""
    db = get_db()
    if db is None:
        return False, None
    user_id = get_jwt_identity()
    user = db.users.find_one({'_id': ObjectId(user_id)})
    is_admin = user and user.get('role') == 'admin'
    return is_admin, db

@admin_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_admin_stats():
    """Get admin dashboard statistics"""
    try:
        is_admin, db = require_admin()
        if db is None:
            return jsonify(DB_UNAVAILABLE), 503
        if not is_admin:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        # Get counts
        total_users = db.users.count_documents({'role': 'user'})
        total_operators = db.users.count_documents({'role': 'operator'})
        total_stations = db.stations.count_documents({})
        active_chargers = db.stations.aggregate([
            {'$unwind': '$ports'},
            {'$match': {'ports.status': {'$ne': 'offline'}}},
            {'$count': 'total'}
        ])
        active_chargers_count = list(active_chargers)
        active_chargers_count = active_chargers_count[0]['total'] if active_chargers_count else 0
        
        # Calculate revenue
        transactions = list(db.transactions.find({'type': 'charging', 'status': 'completed'}))
        total_revenue = sum(t.get('amount', 0) for t in transactions)
        
        # Calculate total energy
        sessions = list(db.sessions.find({'status': 'completed'}))
        total_energy = sum(s.get('energy_delivered', 0) for s in sessions)
        
        # Monthly growth calculations (simplified)
        month_ago = datetime.utcnow() - timedelta(days=30)
        two_months_ago = datetime.utcnow() - timedelta(days=60)
        
        recent_users = db.users.count_documents({
            'created_at': {'$gte': month_ago}
        })
        prev_users = db.users.count_documents({
            'created_at': {'$gte': two_months_ago, '$lt': month_ago}
        })
        user_growth = ((recent_users - prev_users) / max(prev_users, 1)) * 100
        
        # Revenue by month
        revenue_by_month = []
        for i in range(6):
            start = datetime.utcnow() - timedelta(days=30 * (6 - i))
            end = datetime.utcnow() - timedelta(days=30 * (5 - i))
            month_trans = db.transactions.find({
                'timestamp': {'$gte': start, '$lt': end},
                'type': 'charging'
            })
            month_revenue = sum(t.get('amount', 0) for t in month_trans)
            revenue_by_month.append({
                'month': start.strftime('%b'),
                'revenue': round(month_revenue, 2)
            })
        
        # Stations by city
        stations_by_city = list(db.stations.aggregate([
            {'$group': {'_id': '$city', 'count': {'$sum': 1}}},
            {'$sort': {'count': -1}},
            {'$limit': 6}
        ]))
        stations_by_city = [{'city': s['_id'], 'count': s['count']} for s in stations_by_city]
        
        # Recent activity from DB
        recent_activity = []

        latest_users = list(db.users.find({}).sort('created_at', -1).limit(3))
        latest_stations = list(db.stations.find({}).sort('created_at', -1).limit(3))
        latest_transactions = list(db.transactions.find({}).sort('timestamp', -1).limit(3))

        for user in latest_users:
            recent_activity.append({
                'id': f"user-{user['_id']}",
                'action': 'New user registered',
                'user': user.get('name', user.get('email', 'Unknown')),
                'timestamp': user.get('created_at').isoformat() if user.get('created_at') else None
            })

        for station in latest_stations:
            recent_activity.append({
                'id': f"station-{station['_id']}",
                'action': 'New station registered',
                'user': station.get('name', 'Unknown Station'),
                'timestamp': station.get('created_at').isoformat() if station.get('created_at') else None
            })

        for transaction in latest_transactions:
            recent_activity.append({
                'id': f"transaction-{transaction['_id']}",
                'action': 'Payment processed',
                'user': 'System',
                'timestamp': transaction.get('timestamp').isoformat() if transaction.get('timestamp') else None
            })

        recent_activity = sorted(
            recent_activity,
            key=lambda item: item.get('timestamp') or '',
            reverse=True
        )[:8]
        
        stats = {
            'totalUsers': total_users,
            'totalOperators': total_operators,
            'totalStations': total_stations,
            'totalRevenue': round(total_revenue, 2),
            'activeChargers': active_chargers_count,
            'totalEnergy': round(total_energy, 1),
            'monthlyGrowth': {
                'users': round(user_growth, 1),
                'revenue': 18.3,
                'stations': 8.7,
                'energy': 15.2
            },
            'revenueByMonth': revenue_by_month,
            'stationsByCity': stations_by_city,
            'recentActivity': recent_activity
        }
        
        return jsonify({'success': True, 'data': stats})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@admin_bp.route('/bookings', methods=['GET'])
@jwt_required()
def get_all_bookings():
    """Get all bookings for admin"""
    try:
        is_admin, db = require_admin()
        if db is None:
            return jsonify(DB_UNAVAILABLE), 503
        if not is_admin:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403

        bookings_data = list(db.bookings.find({}).sort('created_at', -1))
        bookings = [Booking.from_dict(data).to_response_dict() for data in bookings_data]
        return jsonify({'success': True, 'data': bookings})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@admin_bp.route('/sessions', methods=['GET'])
@jwt_required()
def get_all_sessions():
    """Get all sessions for admin"""
    try:
        is_admin, db = require_admin()
        if db is None:
            return jsonify(DB_UNAVAILABLE), 503
        if not is_admin:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403

        sessions_data = list(db.sessions.find({}).sort('start_time', -1))
        sessions = [Session.from_dict(data).to_response_dict() for data in sessions_data]
        user_name_map = _build_user_name_map(db, [session.get('userId') for session in sessions])
        station_meta_map = _build_station_meta_map(db, [session.get('stationId') for session in sessions])
        operator_name_map = _build_user_name_map(
            db,
            [station_meta_map.get(session.get('stationId'), {}).get('operatorId') for session in sessions]
        )

        for session in sessions:
            station_meta = station_meta_map.get(session.get('stationId'), {})
            operator_id = station_meta.get('operatorId')
            session['userName'] = user_name_map.get(session.get('userId'), 'Unknown User')
            session['stationName'] = station_meta.get('name', 'Unknown Station')
            session['operatorId'] = operator_id
            session['operatorName'] = operator_name_map.get(operator_id, 'Unknown Operator') if operator_id else 'Unknown Operator'

        return jsonify({'success': True, 'data': sessions})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@admin_bp.route('/transactions', methods=['GET'])
@jwt_required()
def get_all_transactions():
    """Get all transactions for admin"""
    try:
        is_admin, db = require_admin()
        if db is None:
            return jsonify(DB_UNAVAILABLE), 503
        if not is_admin:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403

        transactions_data = list(db.transactions.find({}).sort('timestamp', -1))
        transactions = [Transaction.from_dict(data).to_response_dict() for data in transactions_data]
        user_name_map = _build_user_name_map(db, [txn.get('userId') for txn in transactions])

        for txn in transactions:
            txn['userName'] = user_name_map.get(txn.get('userId'), 'Unknown User')

        return jsonify({'success': True, 'data': transactions})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def get_all_users():
    """Get all users"""
    try:
        is_admin, db = require_admin()
        if db is None:
            return jsonify(DB_UNAVAILABLE), 503
        if not is_admin:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        role_filter = request.args.get('role')
        query = {}
        if role_filter:
            query['role'] = role_filter
        
        users_data = list(db.users.find(query))
        users = [User.from_dict(data).to_safe_dict() for data in users_data]
        
        return jsonify({'success': True, 'data': users})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@admin_bp.route('/stations', methods=['GET'])
@jwt_required()
def get_all_stations():
    """Get all stations for admin"""
    try:
        is_admin, db = require_admin()
        if db is None:
            return jsonify(DB_UNAVAILABLE), 503
        if not is_admin:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        from models.station import Station
        
        stations_data = list(db.stations.find({}))
        stations = [Station.from_dict(data).to_response_dict() for data in stations_data]
        operator_name_map = _build_user_name_map(db, [station.get('operatorId') for station in stations])

        for station in stations:
            station['operatorName'] = operator_name_map.get(
                station.get('operatorId'),
                'Unknown Operator'
            )
        
        return jsonify({'success': True, 'data': stations})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@admin_bp.route('/users/<user_id>/status', methods=['PUT'])
@jwt_required()
def update_user_status(user_id):
    """Update user status"""
    try:
        is_admin, db = require_admin()
        if db is None:
            return jsonify(DB_UNAVAILABLE), 503
        if not is_admin:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        status = data.get('status')
        
        result = db.users.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {'is_active': status == 'active', 'updated_at': datetime.utcnow()}}
        )
        
        if result.modified_count == 0:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        return jsonify({'success': True, 'message': 'User status updated'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@admin_bp.route('/stations/<station_id>/status', methods=['PUT'])
@jwt_required()
def update_station_status(station_id):
    """Update station status"""
    try:
        is_admin, db = require_admin()
        if db is None:
            return jsonify(DB_UNAVAILABLE), 503
        if not is_admin:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        status = data.get('status')
        
        if status not in ['available', 'busy', 'offline']:
            return jsonify({'success': False, 'error': 'Invalid status'}), 400
        
        result = db.stations.update_one(
            {'_id': ObjectId(station_id)},
            {'$set': {'status': status, 'updated_at': datetime.utcnow()}}
        )
        
        if result.modified_count == 0:
            return jsonify({'success': False, 'error': 'Station not found'}), 404
        
        return jsonify({'success': True, 'message': 'Station status updated'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@admin_bp.route('/feedback/stats', methods=['GET'])
@jwt_required()
def get_feedback_stats():
    """Get feedback statistics"""
    try:
        is_admin, db = require_admin()
        if db is None:
            return jsonify(DB_UNAVAILABLE), 503
        if not is_admin:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        reviews = list(db.reviews.find({}))
        
        total_reviews = len(reviews)
        avg_rating = sum(r.get('rating', 0) for r in reviews) / max(total_reviews, 1)
        
        # Reviews this month
        month_ago = datetime.utcnow() - timedelta(days=30)
        reviews_this_month = len([r for r in reviews if r.get('timestamp', datetime.min) >= month_ago])
        
        # Top rated stations
        stations = list(db.stations.find({}).sort('rating', -1).limit(3))
        top_rated = [{'id': str(s['_id']), 'name': s['name'], 'rating': s.get('rating', 0), 'reviews': s.get('total_reviews', 0)} for s in stations]
        
        # Low rated stations
        low_stations = list(db.stations.find({'rating': {'$lt': 3.5}}).sort('rating', 1).limit(3))
        low_rated = [{'id': str(s['_id']), 'name': s['name'], 'rating': s.get('rating', 0), 'reviews': s.get('total_reviews', 0)} for s in low_stations]
        
        stats = {
            'totalReviews': total_reviews,
            'averageRating': round(avg_rating, 1),
            'reviewsThisMonth': reviews_this_month,
            'ratingTrend': '+0.2',
            'topRatedStations': top_rated,
            'lowRatedStations': low_rated
        }
        
        return jsonify({'success': True, 'data': stats})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@admin_bp.route('/feedback/reviews', methods=['GET'])
@jwt_required()
def get_all_reviews():
    """Get all reviews with filters"""
    try:
        is_admin, db = require_admin()
        if db is None:
            return jsonify(DB_UNAVAILABLE), 503
        if not is_admin:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        from models.review import Review
        
        rating_filter = request.args.get('rating', type=int)
        station_id = request.args.get('stationId')
        
        query = {}
        if rating_filter:
            query['rating'] = rating_filter
        if station_id:
            station_oid = to_object_id(station_id)
            if not station_oid:
                return jsonify({'success': False, 'error': 'Invalid stationId'}), 400
            query['station_id'] = station_oid
        
        reviews_data = list(db.reviews.find(query).sort('timestamp', -1))
        reviews = [Review.from_dict(data).to_response_dict() for data in reviews_data]
        
        return jsonify({'success': True, 'data': reviews})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
