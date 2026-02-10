from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import get_db
from models.session import Session
from models.notification import Notification
from bson import ObjectId
from datetime import datetime, timedelta

sessions_bp = Blueprint('sessions', __name__)

DB_UNAVAILABLE = {'success': False, 'error': 'Database connection unavailable. Please try again later.'}

@sessions_bp.route('/user/<user_id>', methods=['GET'])
@jwt_required()
def get_user_sessions(user_id):
    """Get all sessions for a user"""
    try:
        db = get_db()
        if db is None:
            return jsonify(DB_UNAVAILABLE), 503
        
        sessions_data = list(db.sessions.find({'user_id': user_id}).sort('start_time', -1))
        sessions = [Session.from_dict(data).to_response_dict() for data in sessions_data]
        
        return jsonify({'success': True, 'data': sessions})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@sessions_bp.route('/active/<user_id>', methods=['GET'])
@jwt_required()
def get_active_session(user_id):
    """Get active session for a user"""
    try:
        db = get_db()
        if db is None:
            return jsonify(DB_UNAVAILABLE), 503
        
        session_data = db.sessions.find_one({
            'user_id': user_id,
            'status': 'active'
        })
        
        if session_data:
            session = Session.from_dict(session_data)
            return jsonify({'success': True, 'data': session.to_response_dict()})
        
        return jsonify({'success': True, 'data': None})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@sessions_bp.route('/start', methods=['POST'])
@jwt_required()
def start_session():
    """Start a new charging session"""
    try:
        db = get_db()
        if db is None:
            return jsonify(DB_UNAVAILABLE), 503
        
        user_id = get_jwt_identity()
        data = request.get_json()
        
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
            {'_id': ObjectId(data['stationId']), 'ports.id': data['portId']},
            {'$set': {'ports.$.status': 'busy'}}
        )
        
        # Create new session
        session = Session(
            user_id=user_id,
            station_id=data['stationId'],
            port_id=data['portId'],
            charging_type=data.get('chargingType', 'Normal AC'),
            payment_method=data.get('paymentMethod', 'Wallet')
        )
        session.battery_start = data.get('batteryStart', 20)
        session.estimated_completion = datetime.utcnow() + timedelta(minutes=45)
        
        result = db.sessions.insert_one(session.to_dict())
        session.id = str(result.inserted_id)
        
        return jsonify({'success': True, 'data': session.to_response_dict()}), 201
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@sessions_bp.route('/stop/<session_id>', methods=['POST'])
@jwt_required()
def stop_session(session_id):
    """Stop a charging session"""
    try:
        db = get_db()
        if db is None:
            return jsonify(DB_UNAVAILABLE), 503
        
        session_data = db.sessions.find_one({'_id': ObjectId(session_id)})
        
        if not session_data:
            return jsonify({'success': False, 'error': 'Session not found'}), 404
        
        # Calculate duration and cost
        start_time = session_data['start_time']
        end_time = datetime.utcnow()
        duration_seconds = (end_time - start_time).total_seconds()
        duration_minutes = int(duration_seconds / 60)
        
        # Get station for pricing
        station = db.stations.find_one({'_id': ObjectId(session_data['station_id'])})
        
        # Calculate cost (simplified pricing)
        energy_rate = 0.35 if 'fast' in session_data.get('charging_type', '').lower() else 0.25
        energy_delivered = round(duration_minutes * 0.8, 1)  # Approximate kWh
        cost = round(energy_delivered * energy_rate, 2)
        
        # Update session
        db.sessions.update_one(
            {'_id': ObjectId(session_id)},
            {'$set': {
                'status': 'completed',
                'end_time': end_time,
                'duration': duration_minutes,
                'energy_delivered': energy_delivered,
                'cost': cost,
                'progress': 100,
                'updated_at': datetime.utcnow()
            }}
        )
        
        # Update port status back to available
        db.stations.update_one(
            {'_id': ObjectId(session_data['station_id']), 'ports.id': session_data['port_id']},
            {'$set': {'ports.$.status': 'available'}}
        )
        
        # Create transaction record
        from models.transaction import Transaction
        transaction = Transaction(
            user_id=session_data['user_id'],
            amount=cost,
            transaction_type='charging',
            payment_method=session_data.get('payment_method', 'Wallet'),
            description=f"Charging session at station",
            session_id=session_id
        )
        db.transactions.insert_one(transaction.to_dict())
        
        # Create notification
        notification = Notification(
            user_id=session_data['user_id'],
            notification_type='charging_complete',
            title='Charging Complete',
            message=f'Your vehicle has finished charging. Total: ${cost}',
            action_url='/user/history'
        )
        db.notifications.insert_one(notification.to_dict())
        
        # Get updated session
        updated_session = db.sessions.find_one({'_id': ObjectId(session_id)})
        session = Session.from_dict(updated_session)
        
        return jsonify({'success': True, 'data': session.to_response_dict()})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@sessions_bp.route('/station/<station_id>', methods=['GET'])
@jwt_required()
def get_station_sessions(station_id):
    """Get all sessions for a station"""
    try:
        db = get_db()
        if db is None:
            return jsonify(DB_UNAVAILABLE), 503
        
        sessions_data = list(db.sessions.find({'station_id': station_id}).sort('start_time', -1))
        sessions = [Session.from_dict(data).to_response_dict() for data in sessions_data]
        
        return jsonify({'success': True, 'data': sessions})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@sessions_bp.route('/history/<user_id>', methods=['GET'])
@jwt_required()
def get_charging_history(user_id):
    """Get charging history for a user"""
    try:
        db = get_db()
        if db is None:
            return jsonify(DB_UNAVAILABLE), 503
        
        sessions_data = list(db.sessions.find({
            'user_id': user_id,
            'status': 'completed'
        }).sort('start_time', -1))
        
        history = []
        for data in sessions_data:
            session = Session.from_dict(data)
            station = db.stations.find_one({'_id': ObjectId(session.station_id)})
            
            history_item = session.to_response_dict()
            history_item['stationName'] = station['name'] if station else 'Unknown Station'
            history.append(history_item)
        
        return jsonify({'success': True, 'data': history})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@sessions_bp.route('/stats/<user_id>', methods=['GET'])
@jwt_required()
def get_user_stats(user_id):
    """Get charging statistics for a user"""
    try:
        db = get_db()
        if db is None:
            return jsonify(DB_UNAVAILABLE), 503
        
        sessions = list(db.sessions.find({
            'user_id': user_id,
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
