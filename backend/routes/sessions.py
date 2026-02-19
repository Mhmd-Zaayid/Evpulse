from flask import Blueprint, request, jsonify, g
from models.session import Session
from models.notification import Notification
from datetime import datetime, timedelta
from models.transaction import Transaction

from routes.common import role_required, to_object_id, now_utc

sessions_bp = Blueprint('sessions', __name__)

DB_UNAVAILABLE = {'success': False, 'error': 'Database connection unavailable. Please try again later.'}

@sessions_bp.route('', methods=['GET'])
@role_required('user', 'operator', 'admin')
def get_sessions():
    """Get sessions filtered by role"""
    try:
        db = g.db
        user = g.current_user

        query = {}
        if user.get('role') == 'user':
            query['user_id'] = user.get('_id')
        elif user.get('role') == 'operator':
            station_ids = [s['_id'] for s in db.stations.find({'operator_id': user.get('_id')}, {'_id': 1})]
            query['station_id'] = {'$in': station_ids}

        sessions_data = list(db.sessions.find(query).sort('start_time', -1))
        sessions = [Session.from_dict(data).to_response_dict() for data in sessions_data]
        
        return jsonify({'success': True, 'data': sessions})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@sessions_bp.route('/user/<user_id>', methods=['GET'])
@role_required('user', 'operator', 'admin')
def get_user_sessions(user_id):
    """Backward-compatible endpoint delegating to role-scoped sessions"""
    return get_sessions()

@sessions_bp.route('/active/<user_id>', methods=['GET'])
@role_required('user', 'admin')
def get_active_session(user_id):
    """Get active session for a user"""
    try:
        db = g.db
        current = g.current_user
        target_user_id = to_object_id(user_id)
        if not target_user_id:
            return jsonify({'success': False, 'error': 'Invalid user id'}), 400

        if current.get('role') != 'admin' and current.get('_id') != target_user_id:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403

        session_data = db.sessions.find_one({
            'user_id': target_user_id,
            'status': 'active'
        })
        
        if session_data:
            session = Session.from_dict(session_data)
            return jsonify({'success': True, 'data': session.to_response_dict()})
        
        return jsonify({'success': True, 'data': None})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@sessions_bp.route('/start', methods=['POST'])
@role_required('user')
def start_session():
    """Start a new charging session"""
    try:
        db = g.db
        user_id = g.current_user_id
        data = request.get_json() or {}

        required_fields = ['stationId', 'portId']
        for field in required_fields:
            if data.get(field) is None:
                return jsonify({'success': False, 'error': f'{field} is required'}), 400

        station_id = to_object_id(data.get('stationId'))
        if not station_id:
            return jsonify({'success': False, 'error': 'Invalid stationId'}), 400
        
        # Check if user already has an active session
        existing = db.sessions.find_one({
            'user_id': user_id,
            'status': 'active'
        })
        
        if existing:
            return jsonify({
                'success': False, 
                'error': 'You already have an active charging session'
            }), 400
        
        # Update port status to busy
        db.stations.update_one(
            {'_id': station_id, 'ports.id': data['portId']},
            {'$set': {'ports.$.status': 'busy'}}
        )
        
        # Create new session
        session = Session(
            user_id=user_id,
            station_id=station_id,
            port_id=data['portId'],
            charging_type=data.get('chargingType', 'Normal AC'),
            payment_method=data.get('paymentMethod', 'Wallet')
        )
        session.battery_start = data.get('batteryStart', 20)
        session.estimated_completion = now_utc() + timedelta(minutes=45)
        session.created_at = now_utc()
        session.updated_at = now_utc()
        
        result = db.sessions.insert_one(session.to_dict())
        session.id = str(result.inserted_id)
        
        return jsonify({
            'success': True,
            'message': 'Charging session started',
            'data': session.to_response_dict()
        }), 201
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@sessions_bp.route('/stop/<session_id>', methods=['POST'])
@role_required('user', 'operator', 'admin')
def stop_session(session_id):
    """Stop a charging session"""
    try:
        db = g.db
        current_user = g.current_user

        session_oid = to_object_id(session_id)
        if not session_oid:
            return jsonify({'success': False, 'error': 'Invalid session id'}), 400

        session_data = db.sessions.find_one({'_id': session_oid})
        
        if not session_data:
            return jsonify({'success': False, 'error': 'Session not found'}), 404

        station = db.stations.find_one({'_id': to_object_id(session_data.get('station_id'))})

        if current_user.get('role') == 'user' and session_data.get('user_id') != current_user.get('_id'):
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403

        if current_user.get('role') == 'operator':
            if not station or station.get('operator_id') != current_user.get('_id'):
                return jsonify({'success': False, 'error': 'Unauthorized'}), 403

        if session_data.get('status') != 'active':
            return jsonify({'success': False, 'error': 'Session is not active'}), 400
        
        # Calculate duration and cost
        start_time = session_data['start_time']
        end_time = now_utc()
        duration_seconds = (end_time - start_time).total_seconds()
        duration_minutes = int(duration_seconds / 60)
        
        # Calculate cost (simplified pricing)
        energy_rate = 0.35 if 'fast' in session_data.get('charging_type', '').lower() else 0.25
        energy_delivered = round(duration_minutes * 0.8, 1)  # Approximate kWh
        total_cost = round(energy_delivered * energy_rate, 2)
        
        # Update session
        db.sessions.update_one(
            {'_id': session_oid},
            {'$set': {
                'status': 'completed',
                'end_time': end_time,
                'duration': duration_minutes,
                'energy_delivered': energy_delivered,
                'cost': total_cost,
                'total_cost': total_cost,
                'progress': 100,
                'updated_at': now_utc()
            }}
        )
        
        # Update port status back to available
        db.stations.update_one(
            {'_id': to_object_id(session_data['station_id']), 'ports.id': session_data['port_id']},
            {'$set': {'ports.$.status': 'available'}}
        )
        
        transaction = Transaction(
            user_id=session_data['user_id'],
            amount=total_cost,
            transaction_type='charging',
            payment_method=session_data.get('payment_method', 'Wallet'),
            description=f"Charging session at station",
            session_id=session_oid
        )
        transaction.created_at = now_utc()
        transaction.timestamp = now_utc()
        db.transactions.insert_one(transaction.to_dict())
        
        # Create notification
        notification = Notification(
            user_id=str(session_data['user_id']),
            notification_type='charging_complete',
            title='Charging Complete',
            message=f'Your vehicle has finished charging. Total: ${total_cost}',
            action_url='/user/history'
        )
        db.notifications.insert_one(notification.to_dict())
        
        # Get updated session
        updated_session = db.sessions.find_one({'_id': session_oid})
        session = Session.from_dict(updated_session)
        
        return jsonify({'success': True, 'data': session.to_response_dict()})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@sessions_bp.route('/station/<station_id>', methods=['GET'])
@role_required('operator', 'admin')
def get_station_sessions(station_id):
    """Get all sessions for a station"""
    try:
        db = g.db
        user = g.current_user
        station_oid = to_object_id(station_id)
        if not station_oid:
            return jsonify({'success': False, 'error': 'Invalid station id'}), 400

        if user.get('role') == 'operator':
            station = db.stations.find_one({'_id': station_oid})
            if not station or station.get('operator_id') != user.get('_id'):
                return jsonify({'success': False, 'error': 'Unauthorized'}), 403

        sessions_data = list(db.sessions.find({'station_id': station_oid}).sort('start_time', -1))
        sessions = [Session.from_dict(data).to_response_dict() for data in sessions_data]
        
        return jsonify({'success': True, 'data': sessions})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@sessions_bp.route('/history/<user_id>', methods=['GET'])
@role_required('user', 'admin')
def get_charging_history(user_id):
    """Get charging history for a user"""
    try:
        db = g.db
        current = g.current_user
        target_user_id = to_object_id(user_id)
        if not target_user_id:
            return jsonify({'success': False, 'error': 'Invalid user id'}), 400

        if current.get('role') != 'admin' and current.get('_id') != target_user_id:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403

        sessions_data = list(db.sessions.find({
            'user_id': target_user_id,
            'status': 'completed'
        }).sort('start_time', -1))
        
        history = []
        for data in sessions_data:
            session = Session.from_dict(data)
            station = db.stations.find_one({'_id': to_object_id(session.station_id)})
            
            history_item = session.to_response_dict()
            history_item['stationName'] = station['name'] if station else 'Unknown Station'
            history.append(history_item)
        
        return jsonify({'success': True, 'data': history})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@sessions_bp.route('/stats/<user_id>', methods=['GET'])
@role_required('user', 'admin')
def get_user_stats(user_id):
    """Get charging statistics for a user"""
    try:
        db = g.db
        current = g.current_user
        target_user_id = to_object_id(user_id)
        if not target_user_id:
            return jsonify({'success': False, 'error': 'Invalid user id'}), 400

        if current.get('role') != 'admin' and current.get('_id') != target_user_id:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403

        sessions = list(db.sessions.find({
            'user_id': target_user_id,
            'status': 'completed'
        }))
        
        total_energy = sum(s.get('energy_delivered', 0) for s in sessions)
        total_cost = sum(s.get('cost', 0) for s in sessions)
        total_sessions = len(sessions)
        avg_duration = sum(s.get('duration', 0) for s in sessions) / total_sessions if total_sessions > 0 else 0
        
        stats = {
            'totalEnergy': round(total_energy, 1),
            'totalCost': round(total_cost, 2),
            'totalSessions': total_sessions,
            'avgSessionDuration': round(avg_duration),
            'co2Saved': round(total_energy * 0.4, 1)  # kg CO2 saved estimate
        }
        
        return jsonify({'success': True, 'data': stats})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
