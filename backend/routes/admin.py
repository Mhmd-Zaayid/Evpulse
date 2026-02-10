from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import get_db
from models.user import User
from bson import ObjectId
from datetime import datetime, timedelta

admin_bp = Blueprint('admin', __name__)

DB_UNAVAILABLE = {'success': False, 'error': 'Database connection unavailable. Please try again later.'}

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
        
        # Recent activity
        recent_activity = [
            {'id': 1, 'action': 'New station registered', 'user': 'GreenTech Inc.', 'timestamp': '2 mins ago'},
            {'id': 2, 'action': 'User complaint resolved', 'user': 'Support Team', 'timestamp': '15 mins ago'},
            {'id': 3, 'action': 'Payment processed', 'user': 'System', 'timestamp': '32 mins ago'},
            {'id': 4, 'action': 'Maintenance scheduled', 'user': 'PowerGrid Station', 'timestamp': '1 hour ago'},
            {'id': 5, 'action': 'New operator approved', 'user': 'Admin', 'timestamp': '2 hours ago'},
        ]
        
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
            query['station_id'] = station_id
        
        reviews_data = list(db.reviews.find(query).sort('timestamp', -1))
        reviews = [Review.from_dict(data).to_response_dict() for data in reviews_data]
        
        return jsonify({'success': True, 'data': reviews})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
