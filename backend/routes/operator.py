from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import get_db
from models.station import Station
from bson import ObjectId
from datetime import datetime, timedelta

from routes.common import to_object_id, now_utc

operator_bp = Blueprint('operator', __name__)

DB_UNAVAILABLE = {'success': False, 'error': 'Database connection unavailable. Please try again later.'}


def _to_float(value, default=0.0):
    try:
        if value is None:
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def _resolve_station_pricing(payload, station):
    if isinstance(payload.get('pricing'), dict) and payload.get('pricing'):
        pricing = payload.get('pricing', {})
        normal = pricing.get('normal', {}) if isinstance(pricing.get('normal'), dict) else {}
        fast = pricing.get('fast', {}) if isinstance(pricing.get('fast'), dict) else {}
        normal_base = _to_float(normal.get('base'), _to_float(station.get('pricing', {}).get('normal', {}).get('base'), 0.0))
        normal_peak = _to_float(normal.get('peak'), normal_base)
        fast_base = _to_float(fast.get('base'), _to_float(station.get('pricing', {}).get('fast', {}).get('base'), normal_base))
        fast_peak = _to_float(fast.get('peak'), fast_base)
    else:
        normal_base = _to_float(payload.get('normalBase'), _to_float(station.get('pricing', {}).get('normal', {}).get('base'), 0.0))
        normal_peak = _to_float(payload.get('normalPeak'), normal_base)
        fast_base = _to_float(payload.get('fastBase'), _to_float(station.get('pricing', {}).get('fast', {}).get('base'), normal_base))
        fast_peak = _to_float(payload.get('fastPeak'), fast_base)

    return {
        'normal': {'base': round(normal_base, 2), 'peak': round(normal_peak, 2)},
        'fast': {'base': round(fast_base, 2), 'peak': round(fast_peak, 2)},
    }


def _resolve_peak_hours(payload, station):
    raw_peak_hours = payload.get('peakHours') if isinstance(payload.get('peakHours'), dict) else None
    current_peak = station.get('peak_hours') or {}
    return {
        'start': (raw_peak_hours or {}).get('start') or payload.get('peakStart') or current_peak.get('start') or '18:00',
        'end': (raw_peak_hours or {}).get('end') or payload.get('peakEnd') or current_peak.get('end') or '22:00',
    }


def _sync_port_prices(ports, pricing):
    updated_ports = []
    for port in ports or []:
        current_port = dict(port)
        port_type = str(current_port.get('type') or '').lower()
        is_fast = 'fast' in port_type or 'dc' in port_type
        current_port['price'] = pricing['fast']['base'] if is_fast else pricing['normal']['base']
        updated_ports.append(current_port)
    return updated_ports


def _to_datetime(value):
    if isinstance(value, datetime):
        return value
    if value is None:
        return None
    try:
        raw = str(value).strip()
        if not raw:
            return None
        if raw.endswith('Z'):
            raw = raw[:-1] + '+00:00'
        return datetime.fromisoformat(raw)
    except (TypeError, ValueError):
        return None


def _parse_slot_range(time_slot):
    if not time_slot or '-' not in str(time_slot):
        return None, None

    start_raw, end_raw = [piece.strip() for piece in str(time_slot).split('-', 1)]
    try:
        start_time = datetime.strptime(start_raw, '%H:%M').time()
        end_time = datetime.strptime(end_raw, '%H:%M').time()
        return start_time, end_time
    except ValueError:
        return None, None


def _is_booking_active_now(booking, now_dt):
    status = (booking.get('status') or '').lower()
    if status not in {'confirmed', 'pending'}:
        return False

    booking_date_raw = booking.get('date')
    if not booking_date_raw:
        return False

    try:
        booking_date = datetime.strptime(str(booking_date_raw), '%Y-%m-%d').date()
    except ValueError:
        return False

    slot_start, slot_end = _parse_slot_range(booking.get('time_slot'))
    if not slot_start or not slot_end:
        return False

    slot_start_dt = datetime.combine(booking_date, slot_start)
    slot_end_dt = datetime.combine(booking_date, slot_end)
    return slot_start_dt <= now_dt <= slot_end_dt


def _port_key(raw_port_id):
    if raw_port_id is None:
        return None
    try:
        return int(raw_port_id)
    except (TypeError, ValueError):
        return str(raw_port_id)


def _resolve_range_start(range_key):
    now_dt = now_utc()
    range_map = {
        'week': 7,
        'month': 30,
        'quarter': 90,
        'year': 365,
    }
    return now_dt - timedelta(days=range_map.get(range_key, 30))

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

        requested_range = (request.args.get('range') or 'month').lower()

        # Get operator's stations
        stations = list(db.stations.find({'operator_id': user_id}))
        station_ids = [s['_id'] for s in stations]
        station_ids_str = [str(station_id) for station_id in station_ids]
        station_id_filter = {'$in': station_ids + station_ids_str}
        
        total_stations = len(stations)
        total_ports = sum(len(s.get('ports', [])) for s in stations)
        now_dt = now_utc()
        today_start = now_dt.replace(hour=0, minute=0, second=0, microsecond=0)
        range_start = _resolve_range_start(requested_range)
        
        all_operator_sessions = list(db.sessions.find({'station_id': station_id_filter}))
        active_session_docs = [s for s in all_operator_sessions if (s.get('status') or '').lower() == 'active']
        active_sessions = len(active_session_docs)

        def _session_timestamp(session):
            return (
                _to_datetime(session.get('start_time'))
                or _to_datetime(session.get('end_time'))
                or _to_datetime(session.get('created_at'))
                or _to_datetime(session.get('updated_at'))
            )

        today_sessions = [
            s for s in all_operator_sessions
            if (_session_timestamp(s) is not None and _session_timestamp(s) >= today_start)
        ]

        range_sessions = [
            s for s in all_operator_sessions
            if (_session_timestamp(s) is not None and _session_timestamp(s) >= range_start)
        ]

        completed_sessions = [
            s for s in all_operator_sessions
            if (s.get('status') or '').lower() == 'completed'
        ]

        today_revenue = sum(_to_float(s.get('cost') or s.get('total_cost')) for s in today_sessions)
        today_energy = sum(_to_float(s.get('energy_delivered', s.get('energyDelivered', 0))) for s in today_sessions)
        monthly_revenue = sum(_to_float(s.get('cost') or s.get('total_cost')) for s in range_sessions)
        monthly_energy = sum(_to_float(s.get('energy_delivered', s.get('energyDelivered', 0))) for s in range_sessions)
        avg_duration = (
            sum(_to_float(s.get('duration'), 0) for s in completed_sessions) / max(len(completed_sessions), 1)
        )

        station_name_map = {str(station['_id']): station.get('name', 'Unknown Station') for station in stations}
        active_session_ports_by_station = {}
        for session in active_session_docs:
            station_key = str(session.get('station_id')) if session.get('station_id') is not None else None
            if not station_key:
                continue
            session_port = _port_key(session.get('port_id'))
            if session_port is None:
                session_port = f"session:{str(session.get('_id') or '')}"
            if station_key not in active_session_ports_by_station:
                active_session_ports_by_station[station_key] = set()
            active_session_ports_by_station[station_key].add(session_port)

        active_bookings = list(db.bookings.find({
            'station_id': station_id_filter,
            'status': {'$in': ['confirmed', 'pending']}
        }))
        active_booking_ports_by_station = {}
        for booking in active_bookings:
            if not _is_booking_active_now(booking, now_dt):
                continue
            station_key = str(booking.get('station_id')) if booking.get('station_id') is not None else None
            if not station_key:
                continue
            booking_port = _port_key(booking.get('port_id'))
            if booking_port is None:
                booking_port = f"booking:{str(booking.get('_id') or '')}"
            if station_key not in active_booking_ports_by_station:
                active_booking_ports_by_station[station_key] = set()
            active_booking_ports_by_station[station_key].add(booking_port)

        station_utilization = []
        total_booked_slots = 0
        total_available_slots = 0
        for station in stations:
            station_key = str(station.get('_id'))
            station_slots = len(station.get('ports', []))
            occupied_port_ids = set()
            occupied_port_ids.update(active_session_ports_by_station.get(station_key, set()))
            occupied_port_ids.update(active_booking_ports_by_station.get(station_key, set()))
            booked_slots = min(
                station_slots,
                len(occupied_port_ids)
            )
            available_slots = max(station_slots - booked_slots, 0)
            utilization = round((booked_slots / station_slots) * 100) if station_slots > 0 else 0

            total_booked_slots += booked_slots
            total_available_slots += available_slots
            station_utilization.append({
                'stationId': station_key,
                'station': station_name_map.get(station_key, 'Unknown Station'),
                'totalSlots': station_slots,
                'bookedSlots': booked_slots,
                'availableSlots': available_slots,
                'utilization': utilization,
            })

        port_utilization = round((total_booked_slots / max(total_ports, 1)) * 100) if total_ports > 0 else 0
        
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
            station_sessions = [
                s for s in range_sessions
                if s.get('station_id') in (station['_id'], str(station['_id']))
            ]
            station_revenue = sum(_to_float(s.get('cost') or s.get('total_cost')) for s in station_sessions)
            revenue_by_station.append({
                'station': station['name'],
                'revenue': round(station_revenue, 2),
                'sessions': len(station_sessions),
            })
        
        # Sessions by hour (live data from selected range)
        sessions_by_hour_map = {hour: 0 for hour in range(24)}
        for session in range_sessions:
            session_dt = _session_timestamp(session)
            if not session_dt:
                continue
            hour_value = session_dt.hour if hasattr(session_dt, 'hour') else None
            if hour_value is None:
                continue
            sessions_by_hour_map[hour_value] = sessions_by_hour_map.get(hour_value, 0) + 1

        sessions_by_hour = []
        for hour, total in sorted(sessions_by_hour_map.items(), key=lambda item: item[0]):
            hour_dt = datetime(now_dt.year, now_dt.month, now_dt.day, hour, 0)
            sessions_by_hour.append({
                'hour': hour_dt.strftime('%I%p').lstrip('0'),
                'sessions': int(total),
            })
        
        stats = {
            'totalStations': total_stations,
            'totalPorts': total_ports,
            'activeSessions': active_sessions,
            'todayRevenue': round(today_revenue, 2),
            'todayEnergy': round(today_energy, 1),
            'monthlyRevenue': round(monthly_revenue, 2),
            'monthlyEnergy': round(monthly_energy, 1),
            'portUtilization': port_utilization,
            'averageSessionDuration': round(avg_duration),
            'maintenanceAlerts': alerts,
            'revenueByStation': revenue_by_station,
            'sessionsByHour': sessions_by_hour,
            'stationUtilization': station_utilization,
            'totalSlots': total_ports,
            'bookedSlots': total_booked_slots,
            'availableSlots': total_available_slots,
            'totalSessions': len(range_sessions),
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
        current_user = db.users.find_one({'_id': user_id}, {'name': 1, 'email': 1})
        operator_name = (current_user or {}).get('name') or (current_user or {}).get('email') or 'Unknown Operator'

        stations = []
        for data in stations_data:
            station_response = Station.from_dict(data).to_response_dict()
            station_response['operatorName'] = operator_name
            stations.append(station_response)
        
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
        
        data = request.get_json() or {}

        pricing = _resolve_station_pricing(data, station)
        peak_hours = _resolve_peak_hours(data, station)
        updated_ports = _sync_port_prices(station.get('ports', []), pricing)

        db.stations.update_one(
            {'_id': ObjectId(station_id)},
            {'$set': {
                'pricing': pricing,
                'peak_hours': peak_hours,
                'ports': updated_ports,
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
