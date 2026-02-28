from flask import Blueprint, request, jsonify, g
from database import get_db
from models.booking import Booking
from models.notification import Notification
from bson import ObjectId
from datetime import datetime, time
from pymongo.errors import DuplicateKeyError

from routes.common import role_required, to_object_id, now_utc

bookings_bp = Blueprint('bookings', __name__)

# Available time slots
AVAILABLE_TIME_SLOTS = [
    '08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00',
    '12:00 - 13:00', '13:00 - 14:00', '14:00 - 15:00', '15:00 - 16:00',
    '16:00 - 17:00', '17:00 - 18:00', '18:00 - 19:00', '19:00 - 20:00',
    '20:00 - 21:00'
]


def _normalize_port_id(port_id):
    if port_id is None:
        return None
    try:
        return int(port_id)
    except (TypeError, ValueError):
        return port_id


def _parse_booking_date(date_value):
    if not date_value:
        return None
    try:
        return datetime.strptime(str(date_value), '%Y-%m-%d').date()
    except ValueError:
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


def _humanize_slot_label(time_slot):
    start_time, end_time = _parse_slot_range(time_slot)
    if not start_time or not end_time:
        return str(time_slot)

    start_label = str(int(start_time.strftime('%H')))
    end_label = str(int(end_time.strftime('%H')))
    return f'{start_label}–{end_label}'


def _slot_has_ended(booking_date_str, time_slot, now_dt):
    booking_date = _parse_booking_date(booking_date_str)
    _, slot_end = _parse_slot_range(time_slot)
    if not booking_date or not slot_end:
        return False

    slot_end_dt = datetime.combine(booking_date, slot_end)
    return slot_end_dt <= now_dt


def _ensure_booking_indexes(db):
    db.bookings.create_index(
        [
            ('station_id', 1),
            ('port_id', 1),
            ('date', 1),
            ('time_slot', 1)
        ],
        name='uniq_active_slot_booking',
        unique=True,
        partialFilterExpression={'status': {'$in': ['confirmed', 'pending']}}
    )


def _refresh_elapsed_bookings(db, station_id=None, date=None, port_id=None):
    now_dt = now_utc()
    query = {'status': {'$in': ['confirmed', 'pending']}}
    if station_id is not None:
        query['station_id'] = station_id
    if date:
        query['date'] = date
    if port_id is not None:
        query['port_id'] = _normalize_port_id(port_id)

    active_bookings = list(db.bookings.find(query, {'_id': 1, 'date': 1, 'time_slot': 1}))
    expired_ids = [
        booking['_id']
        for booking in active_bookings
        if _slot_has_ended(booking.get('date'), booking.get('time_slot'), now_dt)
    ]

    if expired_ids:
        db.bookings.update_many(
            {'_id': {'$in': expired_ids}},
            {'$set': {'status': 'completed', 'updated_at': now_utc()}}
        )

def _serialize_bookings(bookings_data, db):
    bookings = []
    for data in bookings_data:
        booking = Booking.from_dict(data)
        station = db.stations.find_one({'_id': to_object_id(booking.station_id)})
        booking_dict = booking.to_response_dict()
        booking_dict['stationName'] = station['name'] if station else 'Unknown Station'
        bookings.append(booking_dict)
    return bookings


@bookings_bp.route('', methods=['GET'])
@role_required('user', 'operator', 'admin')
def get_bookings():
    """Get bookings filtered by role"""
    try:
        db = g.db
        user = g.current_user
        role = user.get('role')

        query = {}
        if role == 'user':
            query['user_id'] = user['_id']
        elif role == 'operator':
            station_ids = [s['_id'] for s in db.stations.find({'operator_id': user['_id']}, {'_id': 1})]
            query['station_id'] = {'$in': station_ids}

        bookings_data = list(db.bookings.find(query).sort('created_at', -1))
        bookings = _serialize_bookings(bookings_data, db)
        return jsonify({'success': True, 'data': bookings})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@bookings_bp.route('/user/<user_id>', methods=['GET'])
@role_required('user', 'operator', 'admin')
def get_user_bookings(user_id):
    """Backward-compatible endpoint delegating to role-scoped bookings"""
    return get_bookings()

@bookings_bp.route('', methods=['POST'])
@role_required('user')
def create_booking():
    """Create a new booking"""
    try:
        db = g.db
        user_id = g.current_user_id
        data = request.get_json() or {}
        
        # Validate required fields
        required_fields = ['stationId', 'portId', 'date', 'timeSlot']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'success': False, 'error': f'{field} is required'}), 400

        station_id = to_object_id(data.get('stationId'))
        if not station_id:
            return jsonify({'success': False, 'error': 'Invalid stationId'}), 400

        requested_date = _parse_booking_date(data.get('date'))
        if not requested_date:
            return jsonify({'success': False, 'error': 'Invalid date format. Use YYYY-MM-DD'}), 400

        slot_start, slot_end = _parse_slot_range(data.get('timeSlot'))
        if not slot_start or not slot_end:
            return jsonify({'success': False, 'error': 'Invalid time slot format'}), 400

        now_dt = now_utc()
        slot_start_dt = datetime.combine(requested_date, slot_start)
        slot_end_dt = datetime.combine(requested_date, slot_end)
        if slot_end_dt <= now_dt:
            return jsonify({'success': False, 'error': 'Cannot book a slot that has already ended'}), 400

        normalized_port_id = _normalize_port_id(data.get('portId'))

        _ensure_booking_indexes(db)
        _refresh_elapsed_bookings(
            db,
            station_id=station_id,
            date=data.get('date'),
            port_id=normalized_port_id
        )
        
        # Check if slot is available
        existing = db.bookings.find_one({
            'station_id': station_id,
            'port_id': normalized_port_id,
            'date': data['date'],
            'time_slot': data['timeSlot'],
            'status': {'$in': ['confirmed', 'pending']}
        })
        
        if existing:
            return jsonify({'success': False, 'error': 'Time slot is already booked'}), 400
        
        # Get station for pricing estimate
        station = db.stations.find_one({'_id': station_id})
        if not station:
            return jsonify({'success': False, 'error': 'Station not found'}), 404
        charging_type = data.get('chargingType', 'Normal AC')
        
        # Estimate cost based on slot duration (1 hour)
        rate = 0.35 if 'fast' in charging_type.lower() else 0.25
        estimated_cost = round(rate * 30, 2)  # ~30 kWh for 1 hour
        
        booking = Booking(
            user_id=user_id,
            station_id=station_id,
            port_id=normalized_port_id,
            date=data['date'],
            time_slot=data['timeSlot'],
            charging_type=charging_type,
            estimated_cost=estimated_cost
        )
        booking.created_at = now_utc()
        booking.updated_at = now_utc()

        try:
            result = db.bookings.insert_one(booking.to_dict())
        except DuplicateKeyError:
            return jsonify({'success': False, 'error': 'Time slot is already booked'}), 400

        booking.id = str(result.inserted_id)
        
        # Create notification
        notification = Notification(
            user_id=str(user_id),
            notification_type='booking_confirmed',
            title='Booking Confirmed',
            message=f'You have booked {_humanize_slot_label(data["timeSlot"])} slot at {station["name"]} on {data["date"]}.',
            action_url='/user/bookings'
        )
        db.notifications.insert_one(notification.to_dict())
        
        booking_dict = booking.to_response_dict()
        booking_dict['stationName'] = station['name'] if station else 'Unknown Station'
        
        return jsonify({
            'success': True,
            'message': 'Booking created successfully',
            'data': booking_dict
        }), 201
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bookings_bp.route('/<booking_id>/cancel', methods=['POST'])
@role_required('user', 'admin')
def cancel_booking(booking_id):
    """Cancel a booking"""
    try:
        db = g.db
        user = g.current_user

        booking_oid = to_object_id(booking_id)
        if not booking_oid:
            return jsonify({'success': False, 'error': 'Invalid booking id'}), 400

        booking_data = db.bookings.find_one({'_id': booking_oid})
        
        if not booking_data:
            return jsonify({'success': False, 'error': 'Booking not found'}), 404
        
        if user.get('role') != 'admin' and booking_data.get('user_id') != user.get('_id'):
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        if booking_data['status'] == 'cancelled':
            return jsonify({'success': False, 'error': 'Booking is already cancelled'}), 400
        
        db.bookings.update_one(
            {'_id': booking_oid},
            {'$set': {'status': 'cancelled', 'updated_at': now_utc()}}
        )
        
        return jsonify({'success': True, 'message': 'Booking cancelled successfully'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bookings_bp.route('/available-slots', methods=['GET'])
def get_available_slots():
    """Get available time slots for a station on a date"""
    try:
        # Check if database is available
        db = get_db()
        if db is None:
            return jsonify({'success': False, 'error': 'Database connection unavailable. Please try again later.'}), 503
        
        station_id = request.args.get('stationId')
        date = request.args.get('date')
        port_id = request.args.get('portId')
        
        if not station_id or not date:
            return jsonify({'success': False, 'error': 'stationId and date are required'}), 400

        station_oid = to_object_id(station_id)
        if not station_oid:
            return jsonify({'success': False, 'error': 'Invalid stationId'}), 400

        _ensure_booking_indexes(db)
        normalized_port_id = _normalize_port_id(port_id)
        _refresh_elapsed_bookings(
            db,
            station_id=station_oid,
            date=date,
            port_id=normalized_port_id
        )
        
        # Find booked slots
        query = {
            'station_id': station_oid,
            'date': date,
            'status': {'$in': ['confirmed', 'pending']}
        }
        if normalized_port_id is not None:
            query['port_id'] = normalized_port_id
        
        booked = list(db.bookings.find(query))
        booked_slots = [b['time_slot'] for b in booked]

        slot_statuses = [
            {
                'slot': slot,
                'status': 'booked' if slot in booked_slots else 'available',
                'isBooked': slot in booked_slots,
            }
            for slot in AVAILABLE_TIME_SLOTS
        ]
        available = [entry['slot'] for entry in slot_statuses if entry['status'] == 'available']

        return jsonify({'success': True, 'data': slot_statuses, 'availableSlots': available})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bookings_bp.route('/station/<station_id>', methods=['GET'])
@role_required('operator', 'admin')
def get_station_bookings(station_id):
    """Get all bookings for a station (operator view)"""
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

        bookings_data = list(db.bookings.find({'station_id': station_oid}).sort('created_at', -1))
        bookings = _serialize_bookings(bookings_data, db)
        
        return jsonify({'success': True, 'data': bookings})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
