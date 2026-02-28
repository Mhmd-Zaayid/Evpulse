from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from database import get_db
from models.user import User
from bson import ObjectId
from datetime import datetime, timedelta
from models.booking import Booking
from models.session import Session
from models.transaction import Transaction
from routes.common import to_object_id, now_utc

admin_bp = Blueprint('admin', __name__)

DB_UNAVAILABLE = {'success': False, 'error': 'Database connection unavailable. Please try again later.'}


def _to_amount(value):
    try:
        if value is None:
            return 0.0
        return round(float(value), 2)
    except (TypeError, ValueError):
        return 0.0


def _to_float(value):
    try:
        if value is None:
            return 0.0
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def _to_datetime(value):
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value.replace('Z', '+00:00')).replace(tzinfo=None)
        except ValueError:
            return None
    return None


def _in_range(value, start, end):
    parsed = _to_datetime(value)
    return bool(parsed and start <= parsed < end)


def _id_to_string(value):
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, str):
        stripped = value.strip()
        return stripped or None
    return None


def _resolve_charging_amounts_for_admin(db, transactions_data):
    charging_session_ids = []
    for txn in transactions_data:
        if txn.get('type') == 'charging' and _to_amount(txn.get('amount')) <= 0 and txn.get('session_id'):
            charging_session_ids.append(txn.get('session_id'))

    if not charging_session_ids:
        return transactions_data

    sessions = list(db.sessions.find(
        {'_id': {'$in': charging_session_ids}},
        {'cost': 1, 'total_cost': 1}
    ))
    session_cost_map = {
        s['_id']: _to_amount(s.get('cost') or s.get('total_cost'))
        for s in sessions
    }

    for txn in transactions_data:
        if txn.get('type') != 'charging':
            continue
        if _to_amount(txn.get('amount')) > 0:
            continue
        session_id = txn.get('session_id')
        resolved_amount = session_cost_map.get(session_id, 0.0)
        if resolved_amount > 0:
            txn['amount'] = resolved_amount
            if txn.get('_id'):
                db.transactions.update_one(
                    {'_id': txn['_id']},
                    {'$set': {'amount': resolved_amount, 'updated_at': now_utc()}}
                )

    return transactions_data


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


def _shift_month_start(reference_start, delta_months):
    month_index = (reference_start.year * 12 + (reference_start.month - 1)) + delta_months
    year = month_index // 12
    month = (month_index % 12) + 1
    return datetime(year, month, 1)

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
        transactions = _resolve_charging_amounts_for_admin(db, transactions)
        total_revenue = round(sum(_to_amount(t.get('amount')) for t in transactions), 2)
        
        # Calculate total energy
        sessions = list(db.sessions.find({'status': 'completed'}))
        total_energy = round(
            sum(_to_float(s.get('energy_delivered', s.get('energyDelivered', 0))) for s in sessions),
            1
        )
        
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
        
        users_data = list(db.users.find({'role': 'user'}, {'created_at': 1}))

        # Revenue, energy and users by month (last 6 months, calendar-aligned)
        revenue_by_month = []
        current_month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        for i in range(5, -1, -1):
            start = _shift_month_start(current_month_start, -i)
            end = _shift_month_start(start, 1)

            month_trans = [
                t for t in transactions
                if _in_range(t.get('timestamp') or t.get('created_at') or t.get('updated_at'), start, end)
            ]
            month_revenue = round(sum(_to_amount(t.get('amount', 0)) for t in month_trans), 2)

            month_sessions = [
                s for s in sessions
                if _in_range(
                    s.get('end_time') or s.get('updated_at') or s.get('start_time') or s.get('created_at'),
                    start,
                    end
                )
            ]
            month_energy = round(
                sum(_to_float(s.get('energy_delivered', s.get('energyDelivered', 0))) for s in month_sessions),
                1
            )

            month_users = sum(1 for u in users_data if _in_range(u.get('created_at'), start, end))

            revenue_by_month.append({
                'month': start.strftime('%b'),
                'revenue': month_revenue,
                'energy': month_energy,
                'users': int(month_users),
            })
        
        # Stations by city
        stations_by_city_raw = list(db.stations.aggregate([
            {'$group': {'_id': '$city', 'count': {'$sum': 1}}},
            {'$sort': {'count': -1}},
            {'$limit': 6}
        ]))

        station_city_map = {
            str(s['_id']): (s.get('city') or 'Unknown')
            for s in db.stations.find({}, {'city': 1})
        }
        session_station_map = {
            str(s['_id']): _id_to_string(s.get('station_id'))
            for s in db.sessions.find({}, {'station_id': 1})
        }

        now = datetime.utcnow()
        current_period_start = now - timedelta(days=30)
        previous_period_start = now - timedelta(days=60)

        city_revenue_current = {}
        city_revenue_previous = {}

        for txn in transactions:
            session_id = _id_to_string(txn.get('session_id'))
            station_id = session_station_map.get(session_id)
            city = station_city_map.get(station_id, 'Unknown')
            amount = _to_amount(txn.get('amount'))
            txn_dt = _to_datetime(txn.get('timestamp') or txn.get('created_at') or txn.get('updated_at'))

            if not txn_dt:
                continue

            if current_period_start <= txn_dt <= now:
                city_revenue_current[city] = city_revenue_current.get(city, 0.0) + amount
            elif previous_period_start <= txn_dt < current_period_start:
                city_revenue_previous[city] = city_revenue_previous.get(city, 0.0) + amount

        stations_by_city = []
        for item in stations_by_city_raw:
            city_name = item.get('_id') or 'Unknown'
            current_revenue = round(city_revenue_current.get(city_name, 0.0), 2)
            previous_revenue = round(city_revenue_previous.get(city_name, 0.0), 2)

            if previous_revenue > 0:
                growth = round(((current_revenue - previous_revenue) / previous_revenue) * 100, 1)
            elif current_revenue > 0:
                growth = 100.0
            else:
                growth = 0.0

            stations_by_city.append({
                'city': city_name,
                'count': item.get('count', 0),
                'revenue': current_revenue,
                'growth': growth,
            })
        
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
            'totalRevenue': total_revenue,
            'activeChargers': active_chargers_count,
            'totalEnergy': total_energy,
            'monthlyGrowth': {
                'users': round(user_growth, 1),
                'revenue': 18.3,
                'stations': 8.7,
                'energy': 15.2
            },
            'revenueByMonth': revenue_by_month,
            'energyByMonth': [
                {'month': item['month'], 'energy': item['energy']}
                for item in revenue_by_month
            ],
            'userGrowthByMonth': [
                {'month': item['month'], 'users': item['users']}
                for item in revenue_by_month
            ],
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
        transactions_data = _resolve_charging_amounts_for_admin(db, transactions_data)
        transactions = [Transaction.from_dict(data).to_response_dict() for data in transactions_data]
        user_name_map = _build_user_name_map(db, [txn.get('userId') for txn in transactions])

        for txn in transactions:
            txn['userName'] = user_name_map.get(txn.get('userId'), 'Unknown User')

        return jsonify({'success': True, 'data': transactions})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@admin_bp.route('/transactions/<transaction_id>/refund', methods=['POST', 'OPTIONS'])
def refund_transaction(transaction_id):
    """Refund a completed charging transaction (admin only)"""
    try:
        if request.method == 'OPTIONS':
            return jsonify({'success': True}), 200

        verify_jwt_in_request()

        is_admin, db = require_admin()
        if db is None:
            return jsonify(DB_UNAVAILABLE), 503
        if not is_admin:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403

        txn_oid = to_object_id(transaction_id)
        if not txn_oid:
            return jsonify({'success': False, 'error': 'Invalid transaction id'}), 400

        transaction = db.transactions.find_one({'_id': txn_oid})
        if not transaction:
            return jsonify({'success': False, 'error': 'Transaction not found'}), 404

        if transaction.get('type') != 'charging':
            return jsonify({'success': False, 'error': 'Only charging transactions can be refunded'}), 400

        if transaction.get('status') != 'completed':
            return jsonify({'success': False, 'error': 'Only completed transactions can be refunded'}), 400

        existing_refund = db.transactions.find_one({'reference_transaction_id': txn_oid, 'type': 'refund'})
        if existing_refund:
            return jsonify({'success': False, 'error': 'Transaction is already refunded'}), 400

        refund_amount = _to_amount(transaction.get('amount'))
        if refund_amount <= 0:
            return jsonify({'success': False, 'error': 'Invalid transaction amount for refund'}), 400

        refund_transaction = {
            'user_id': transaction.get('user_id'),
            'session_id': transaction.get('session_id'),
            'amount': refund_amount,
            'type': 'refund',
            'payment_method': transaction.get('payment_method', 'Wallet'),
            'status': 'completed',
            'description': f"Refund for transaction {str(txn_oid)}",
            'reference_transaction_id': txn_oid,
            'timestamp': datetime.utcnow(),
            'created_at': datetime.utcnow(),
            'updated_at': now_utc(),
        }

        db.transactions.insert_one(refund_transaction)
        db.transactions.update_one(
            {'_id': txn_oid},
            {'$set': {'status': 'refunded', 'updated_at': now_utc()}}
        )

        return jsonify({'success': True, 'message': 'Refund processed successfully'})
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


@admin_bp.route('/users/<user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    """Delete a user (admin only)"""
    try:
        is_admin, db = require_admin()
        if db is None:
            return jsonify(DB_UNAVAILABLE), 503
        if not is_admin:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403

        user_oid = to_object_id(user_id)
        if not user_oid:
            return jsonify({'success': False, 'error': 'Invalid user id'}), 400

        current_admin_id = to_object_id(get_jwt_identity())
        if current_admin_id and current_admin_id == user_oid:
            return jsonify({'success': False, 'error': 'You cannot delete your own admin account'}), 400

        target_user = db.users.find_one({'_id': user_oid})
        if not target_user:
            return jsonify({'success': False, 'error': 'User not found'}), 404

        if target_user.get('role') == 'operator':
            owned_stations = db.stations.count_documents({'operator_id': user_oid})
            if owned_stations > 0:
                return jsonify({
                    'success': False,
                    'error': 'Cannot delete operator with assigned stations. Reassign or remove stations first.'
                }), 400

        db.users.delete_one({'_id': user_oid})

        db.bookings.delete_many({'user_id': user_oid})
        db.sessions.delete_many({'user_id': user_oid})
        db.transactions.delete_many({'user_id': user_oid})
        db.notifications.delete_many({'user_id': {'$in': [user_oid, str(user_oid)]}})

        return jsonify({'success': True, 'message': 'User deleted successfully'})
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


@admin_bp.route('/stations/<station_id>', methods=['DELETE'])
@jwt_required()
def delete_station(station_id):
    """Delete a station (admin only)"""
    try:
        is_admin, db = require_admin()
        if db is None:
            return jsonify(DB_UNAVAILABLE), 503
        if not is_admin:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403

        station_oid = to_object_id(station_id)
        if not station_oid:
            return jsonify({'success': False, 'error': 'Invalid station id'}), 400

        station = db.stations.find_one({'_id': station_oid})
        if not station:
            return jsonify({'success': False, 'error': 'Station not found'}), 404

        active_sessions = db.sessions.count_documents({'station_id': station_oid, 'status': 'active'})
        if active_sessions > 0:
            return jsonify({
                'success': False,
                'error': 'Cannot delete station with active charging sessions'
            }), 400

        db.stations.delete_one({'_id': station_oid})
        db.bookings.delete_many({'station_id': station_oid})
        db.sessions.delete_many({'station_id': station_oid})

        return jsonify({'success': True, 'message': 'Station deleted successfully'})
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
