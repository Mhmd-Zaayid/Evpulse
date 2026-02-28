from flask import Blueprint, request, jsonify, g
from models.session import Session
from models.notification import Notification
from datetime import datetime, timedelta
import math
from models.transaction import Transaction
from pymongo.errors import DuplicateKeyError

from routes.common import role_required, to_object_id, now_utc

sessions_bp = Blueprint('sessions', __name__)

DB_UNAVAILABLE = {'success': False, 'error': 'Database connection unavailable. Please try again later.'}


def _ensure_active_session_index(db):
    db.sessions.create_index(
        [('user_id', 1), ('status', 1)],
        name='uniq_user_active_session',
        unique=True,
        partialFilterExpression={'status': 'active'}
    )


def _build_user_name_map(db, user_ids):
    valid_ids = []
    for user_id in user_ids:
        oid = to_object_id(user_id)
        if oid:
            valid_ids.append(oid)

    if not valid_ids:
        return {}

    users = list(db.users.find({'_id': {'$in': valid_ids}}, {'name': 1, 'email': 1}))
    return {
        str(user['_id']): user.get('name') or user.get('email') or 'Unknown User'
        for user in users
    }


def _build_station_map(db, station_ids):
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


def _enrich_sessions(db, sessions):
    station_map = _build_station_map(db, [session.get('stationId') for session in sessions])
    user_name_map = _build_user_name_map(db, [session.get('userId') for session in sessions])
    operator_name_map = _build_user_name_map(
        db,
        [station_map.get(session.get('stationId'), {}).get('operatorId') for session in sessions]
    )

    enriched = []
    for session in sessions:
        station_meta = station_map.get(session.get('stationId'), {})
        operator_id = station_meta.get('operatorId')
        enriched.append({
            **session,
            'userName': user_name_map.get(session.get('userId'), 'Unknown User'),
            'stationName': station_meta.get('name', 'Unknown Station'),
            'operatorId': operator_id,
            'operatorName': operator_name_map.get(operator_id, 'Unknown Operator') if operator_id else 'Unknown Operator',
        })

    return enriched


def _to_number(value):
    try:
        if value is None:
            return None
        return float(value)
    except (TypeError, ValueError):
        return None


def _to_amount(value):
    try:
        if value is None:
            return 0.0
        return round(float(value), 2)
    except (TypeError, ValueError):
        return 0.0


def _resolve_transaction_amount(db, transaction):
    amount = _to_amount(transaction.get('amount'))
    if amount > 0:
        return amount

    session_id = transaction.get('session_id')
    session_oid = to_object_id(session_id)
    if not session_oid:
        return 0.0

    session = db.sessions.find_one({'_id': session_oid}, {'cost': 1, 'total_cost': 1})
    if not session:
        return 0.0

    return _to_amount(session.get('cost') or session.get('total_cost'))


def _get_wallet_balance(db, user_id):
    topups = list(db.transactions.find({
        'user_id': user_id,
        'type': 'wallet_topup',
        'status': 'completed'
    }))

    wallet_payments = list(db.transactions.find({
        'user_id': user_id,
        'payment_method': 'Wallet',
        'type': 'charging',
        'status': 'completed'
    }))

    total_topup = sum(_to_amount(txn.get('amount')) for txn in topups)
    total_spent = sum(_resolve_transaction_amount(db, txn) for txn in wallet_payments)
    return round(max(0.0, total_topup - total_spent), 2)

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
        sessions = _enrich_sessions(db, sessions)
        
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
            enriched = _enrich_sessions(db, [session.to_response_dict()])
            return jsonify({'success': True, 'data': enriched[0] if enriched else None})
        
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

        station = db.stations.find_one({'_id': station_id}, {'name': 1, 'ports': 1})
        if not station:
            return jsonify({'success': False, 'error': 'Station not found'}), 404

        _ensure_active_session_index(db)
        
        # Check if user already has an active session
        existing = db.sessions.find_one({
            'user_id': user_id,
            'status': 'active'
        })
        
        if existing:
            return jsonify({
                'success': False, 
                'error': 'You already have an active charging session.'
            }), 400
        
        payment_method = data.get('paymentMethod', 'Wallet')
        if str(payment_method).lower() == 'wallet':
            wallet_balance = _get_wallet_balance(db, user_id)
            if wallet_balance <= 0:
                return jsonify({
                    'success': False,
                    'error': 'Insufficient wallet balance'
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
            payment_method=payment_method,
            station_name=station.get('name')
        )
        session.battery_start = data.get('batteryStart', 20)
        session.estimated_completion = now_utc() + timedelta(minutes=45)
        session.created_at = now_utc()
        session.updated_at = now_utc()
        
        try:
            result = db.sessions.insert_one(session.to_dict())
        except DuplicateKeyError:
            return jsonify({
                'success': False,
                'error': 'You already have an active charging session.'
            }), 400
        session.id = str(result.inserted_id)
        
        return jsonify({
            'success': True,
            'message': 'Charging session started successfully.',
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
        payload = request.get_json(silent=True) or {}
        
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
        duration_minutes = max(1, math.ceil(duration_seconds / 60))

        requested_duration = _to_number(payload.get('durationMinutes'))
        if requested_duration is not None and requested_duration > 0:
            duration_minutes = max(1, int(round(requested_duration)))

        # Resolve active port metadata for realistic billing
        selected_port = None
        for port in (station or {}).get('ports', []):
            if str(port.get('id')) == str(session_data.get('port_id')):
                selected_port = port
                break

        energy_rate = float((selected_port or {}).get('price') or 8.0)
        charger_power_kw = float((selected_port or {}).get('power') or 22.0)
        charger_power_kw = max(3.0, charger_power_kw)

        # Prefer client telemetry when provided; otherwise estimate conservatively
        requested_energy = _to_number(payload.get('energyDelivered'))
        if requested_energy is not None and requested_energy > 0:
            energy_delivered = round(float(requested_energy), 1)
        else:
            estimated_energy = (duration_minutes / 60.0) * charger_power_kw * 0.15
            energy_delivered = round(max(0.1, estimated_energy), 1)

        requested_cost = _to_number(payload.get('totalCost'))
        if requested_cost is not None and requested_cost >= 0:
            total_cost = float(requested_cost)
        else:
            total_cost = energy_delivered * energy_rate

        total_cost = round(max(0.0, total_cost), 2)
        
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
        
        transaction_payload = {
            'user_id': session_data['user_id'],
            'session_id': session_oid,
            'amount': total_cost,
            'type': 'charging',
            'payment_method': session_data.get('payment_method', 'Wallet'),
            'status': 'completed',
            'description': 'Charging session at station',
            'timestamp': now_utc(),
            'updated_at': now_utc(),
        }
        existing_transaction = db.transactions.find_one({
            'session_id': session_oid,
            'type': 'charging'
        })
        if existing_transaction:
            db.transactions.update_one(
                {'_id': existing_transaction['_id']},
                {
                    '$set': transaction_payload,
                    '$setOnInsert': {'created_at': now_utc()}
                }
            )
        else:
            transaction = Transaction(
                user_id=session_data['user_id'],
                amount=total_cost,
                transaction_type='charging',
                payment_method=session_data.get('payment_method', 'Wallet'),
                description='Charging session at station',
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
            message=f'Your vehicle has finished charging. Total: ₹{total_cost}',
            action_url='/user/history'
        )
        db.notifications.insert_one(notification.to_dict())
        
        # Get updated session
        updated_session = db.sessions.find_one({'_id': session_oid})
        session = Session.from_dict(updated_session)
        enriched = _enrich_sessions(db, [session.to_response_dict()])

        return jsonify({'success': True, 'data': enriched[0] if enriched else None})
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
        sessions = _enrich_sessions(db, sessions)
        
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
        user_name_map = _build_user_name_map(db, [target_user_id])
        station_map = _build_station_map(db, [data.get('station_id') for data in sessions_data])
        operator_name_map = _build_user_name_map(
            db,
            [station_map.get(str(data.get('station_id')), {}).get('operatorId') for data in sessions_data]
        )

        for data in sessions_data:
            session = Session.from_dict(data)
            history_item = session.to_response_dict()
            station_meta = station_map.get(history_item.get('stationId'), {})
            operator_id = station_meta.get('operatorId')

            history_item['stationName'] = station_meta.get('name', 'Unknown Station')
            history_item['userName'] = user_name_map.get(str(target_user_id), current.get('name') or 'Unknown User')
            history_item['operatorName'] = operator_name_map.get(operator_id, 'Unknown Operator') if operator_id else 'Unknown Operator'
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
