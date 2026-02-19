from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import get_db
from models.station import Station
from bson import ObjectId
from datetime import datetime, timedelta

from routes.common import to_object_id, now_utc

operator_bp = Blueprint('operator', __name__)

DB_UNAVAILABLE = {'success': False, 'error': 'Database connection unavailable. Please try again later.'}

def require_operator():
    """Check operator role. Returns (is_operator, db) tuple."""
    db = get_db()
    if db is None:
        return False, None
    user_id = get_jwt_identity()
    user = db.users.find_one({'_id': ObjectId(user_id)})
    is_op = user and user.get('role') in ['operator', 'admin']
    return is_op, db

@operator_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_operator_stats():
    """Get operator dashboard statistics"""
    try:
        is_op, db = require_operator()
        if db is None:
            return jsonify(DB_UNAVAILABLE), 503
        if not is_op:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403

        user_id = to_object_id(get_jwt_identity())
        if not user_id:
            return jsonify({'success': False, 'error': 'Invalid user id'}), 401

        # Get operator's stations
        stations = list(db.stations.find({'operator_id': user_id}))
        station_ids = [s['_id'] for s in stations]
        
        total_stations = len(stations)
        total_ports = sum(len(s.get('ports', [])) for s in stations)
        
        # Get active sessions
        active_sessions = db.sessions.count_documents({
            'station_id': {'$in': station_ids},
            'status': 'active'
        })
        
        # Today's stats
        today = now_utc().replace(hour=0, minute=0, second=0, microsecond=0)
        today_sessions = list(db.sessions.find({
            'station_id': {'$in': station_ids},
            'start_time': {'$gte': today}
        }))
        
        today_revenue = sum(s.get('cost', 0) or 0 for s in today_sessions)
        today_energy = sum(s.get('energy_delivered', 0) for s in today_sessions)
        
        # Monthly stats
        month_ago = now_utc() - timedelta(days=30)
        month_sessions = list(db.sessions.find({
            'station_id': {'$in': station_ids},
            'start_time': {'$gte': month_ago}
        }))
        
        monthly_revenue = sum(s.get('cost', 0) or 0 for s in month_sessions)
        monthly_energy = sum(s.get('energy_delivered', 0) for s in month_sessions)
        
        # Port utilization
        total_active_ports = sum(
            1 for s in stations 
            for p in s.get('ports', []) 
            if p.get('status') != 'offline'
        )
        busy_ports = sum(
            1 for s in stations 
            for p in s.get('ports', []) 
            if p.get('status') == 'busy'
        )
        port_utilization = (busy_ports / max(total_active_ports, 1)) * 100
        
        # Average session duration
        completed_sessions = list(db.sessions.find({
            'station_id': {'$in': station_ids},
            'status': 'completed'
        }))
        avg_duration = sum(s.get('duration', 0) for s in completed_sessions) / max(len(completed_sessions), 1)
        
        # Maintenance alerts
        alerts = []
        for station in stations:
            for port in station.get('ports', []):
                if port.get('status') == 'offline':
                    alerts.append({
                        'id': f"{station['_id']}-{port['id']}",
                        'stationId': str(station['_id']),
                        'portId': port['id'],
                        'type': 'offline',
                        'message': f"Port {port['id']} is offline",
                        'priority': 'high',
                        'timestamp': now_utc().isoformat()
                    })
        
        # Revenue by station
        revenue_by_station = []
        for station in stations:
            station_sessions = [s for s in month_sessions if s.get('station_id') == station['_id']]
            station_revenue = sum(s.get('cost', 0) or 0 for s in station_sessions)
            revenue_by_station.append({
                'station': station['name'],
                'revenue': round(station_revenue, 2)
            })
        
        # Sessions by hour (live data from today)
        sessions_by_hour_map = {}
        for session in today_sessions:
            start_time = session.get('start_time')
            if not start_time:
                continue
            hour_value = start_time.hour if hasattr(start_time, 'hour') else None
            if hour_value is None:
                continue
            hour_label = start_time.strftime('%I%p').lstrip('0')
            sessions_by_hour_map[hour_value] = {
                'hour': hour_label,
                'sessions': sessions_by_hour_map.get(hour_value, {}).get('sessions', 0) + 1
            }

        sessions_by_hour = [
            value
            for _, value in sorted(sessions_by_hour_map.items(), key=lambda item: item[0])
        ]
        
        stats = {
            'totalStations': total_stations,
            'totalPorts': total_ports,
            'activeSessions': active_sessions,
            'todayRevenue': round(today_revenue, 2),
            'todayEnergy': round(today_energy, 1),
            'monthlyRevenue': round(monthly_revenue, 2),
            'monthlyEnergy': round(monthly_energy, 1),
            'portUtilization': round(port_utilization),
            'averageSessionDuration': round(avg_duration),
            'maintenanceAlerts': alerts,
            'revenueByStation': revenue_by_station,
            'sessionsByHour': sessions_by_hour
        }
        
        return jsonify({'success': True, 'data': stats})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@operator_bp.route('/stations', methods=['GET'])
@jwt_required()
def get_operator_stations():
    """Get operator's stations"""
    try:
        is_op, db = require_operator()
        if db is None:
            return jsonify(DB_UNAVAILABLE), 503
        if not is_op:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403

        user_id = to_object_id(get_jwt_identity())
        if not user_id:
            return jsonify({'success': False, 'error': 'Invalid user id'}), 401
        stations_data = list(db.stations.find({'operator_id': user_id}))
        stations = [Station.from_dict(data).to_response_dict() for data in stations_data]
        
        return jsonify({'success': True, 'data': stations})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@operator_bp.route('/pricing/<station_id>', methods=['PUT'])
@jwt_required()
def update_pricing(station_id):
    """Update station pricing"""
    try:
        is_op, db = require_operator()
        if db is None:
            return jsonify(DB_UNAVAILABLE), 503
        if not is_op:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403

        user_id = to_object_id(get_jwt_identity())
        if not user_id:
            return jsonify({'success': False, 'error': 'Invalid user id'}), 401
        
        # Verify ownership
        station = db.stations.find_one({'_id': ObjectId(station_id)})
        if not station:
            return jsonify({'success': False, 'error': 'Station not found'}), 404
        
        if station.get('operator_id') != user_id:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        
        db.stations.update_one(
            {'_id': ObjectId(station_id)},
            {'$set': {
                'pricing': data.get('pricing', {}),
                'peak_hours': data.get('peakHours'),
                'updated_at': now_utc()
            }}
        )
        
        return jsonify({'success': True, 'message': 'Pricing updated successfully'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@operator_bp.route('/port-status/<station_id>/<port_id>', methods=['PUT'])
@jwt_required()
def update_port_status(station_id, port_id):
    """Update port status"""
    try:
        is_op, db = require_operator()
        if db is None:
            return jsonify(DB_UNAVAILABLE), 503
        if not is_op:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        new_status = data.get('status')
        
        if new_status not in ['available', 'busy', 'offline']:
            return jsonify({'success': False, 'error': 'Invalid status'}), 400
        
        result = db.stations.update_one(
            {'_id': ObjectId(station_id), 'ports.id': int(port_id)},
            {'$set': {'ports.$.status': new_status, 'updated_at': now_utc()}}
        )
        
        if result.modified_count == 0:
            return jsonify({'success': False, 'error': 'Station or port not found'}), 404
        
        return jsonify({'success': True, 'message': 'Port status updated'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@operator_bp.route('/maintenance-alerts', methods=['GET'])
@jwt_required()
def get_maintenance_alerts():
    """Get maintenance alerts for operator's stations"""
    try:
        is_op, db = require_operator()
        if db is None:
            return jsonify(DB_UNAVAILABLE), 503
        if not is_op:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403

        user_id = to_object_id(get_jwt_identity())
        if not user_id:
            return jsonify({'success': False, 'error': 'Invalid user id'}), 401
        stations = list(db.stations.find({'operator_id': user_id}))
        
        alerts = []
        for station in stations:
            for port in station.get('ports', []):
                if port.get('status') == 'offline':
                    alerts.append({
                        'id': f"{station['_id']}-{port['id']}",
                        'stationId': str(station['_id']),
                        'stationName': station['name'],
                        'portId': port['id'],
                        'type': 'offline',
                        'message': f"Port {port['id']} is offline - requires attention",
                        'priority': 'high',
                        'timestamp': now_utc().isoformat()
                    })
        
        return jsonify({'success': True, 'data': alerts})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@operator_bp.route('/feedback', methods=['GET'])
@jwt_required()
def get_operator_feedback():
    """Get feedback for operator's stations"""
    try:
        is_op, db = require_operator()
        if db is None:
            return jsonify(DB_UNAVAILABLE), 503
        if not is_op:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403

        user_id = to_object_id(get_jwt_identity())
        if not user_id:
            return jsonify({'success': False, 'error': 'Invalid user id'}), 401
        stations = list(db.stations.find({'operator_id': user_id}))
        
        feedback = []
        for station in stations:
            reviews = list(db.reviews.find({'station_id': station['_id']}).sort('timestamp', -1).limit(5))
            
            # Rating breakdown
            all_reviews = list(db.reviews.find({'station_id': station['_id']}))
            rating_breakdown = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0}
            for r in all_reviews:
                rating = r.get('rating', 0)
                if rating in rating_breakdown:
                    rating_breakdown[rating] += 1
            
            feedback.append({
                'stationId': str(station['_id']),
                'stationName': station['name'],
                'averageRating': station.get('rating', 0),
                'totalReviews': station.get('total_reviews', 0),
                'recentReviews': [
                    {
                        'rating': r.get('rating'),
                        'comment': r.get('comment'),
                        'date': r.get('timestamp').strftime('%Y-%m-%d') if r.get('timestamp') else None
                    } for r in reviews
                ],
                'ratingBreakdown': rating_breakdown
            })
        
        return jsonify({'success': True, 'data': feedback})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@operator_bp.route('/resolve-alert/<alert_id>', methods=['POST'])
@jwt_required()
def resolve_alert(alert_id):
    """Resolve a maintenance alert"""
    try:
        is_op, db = require_operator()
        if db is None:
            return jsonify(DB_UNAVAILABLE), 503
        if not is_op:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        # Parse alert_id (format: station_id-port_id)
        parts = alert_id.rsplit('-', 1)
        if len(parts) != 2:
            return jsonify({'success': False, 'error': 'Invalid alert ID'}), 400
        
        station_id, port_id = parts
        
        # Update port status to available
        result = db.stations.update_one(
            {'_id': ObjectId(station_id), 'ports.id': int(port_id)},
            {'$set': {'ports.$.status': 'available', 'updated_at': now_utc()}}
        )
        
        if result.modified_count == 0:
            return jsonify({'success': False, 'error': 'Alert not found'}), 404
        
        return jsonify({'success': True, 'message': 'Alert resolved'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
