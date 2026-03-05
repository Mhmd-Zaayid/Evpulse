from flask import Blueprint, request, jsonify, g
from database import get_db
from models.booking import Booking
from models.notification import Notification
from bson import ObjectId
from datetime import datetime, timedelta
from pymongo.errors import DuplicateKeyError
from utils.charging import calculate_charging_projection

from routes.common import role_required, to_object_id, now_utc

bookings_bp = Blueprint('bookings', __name__)

SLOT_START_MINUTES = 6 * 60   # 06:00
SLOT_END_MINUTES = 24 * 60    # 24:00 (shown as 00:00)


def _is_fast_charger(port_type):
    label = str(port_type or '').strip().lower()
    return 'fast' in label or 'dc' in label


def _format_minutes(total_minutes):
    normalized = int(total_minutes) % (24 * 60)
    hours = normalized // 60
    minutes = normalized % 60
    return f'{hours:02d}:{minutes:02d}'


def _generate_time_slots(charging_type='normal'):
    is_fast = _is_fast_charger(charging_type)
    interval_minutes = 30 if is_fast else 60
    buffer_minutes = 5 if is_fast else 0

    slots = []
    cursor = SLOT_START_MINUTES
    while cursor + interval_minutes <= SLOT_END_MINUTES:
        slot_start = _format_minutes(cursor)
        slot_end = _format_minutes(cursor + interval_minutes)
        slots.append(f'{slot_start} - {slot_end}')
        cursor += interval_minutes + buffer_minutes

    return slots


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


def _slot_start_datetime(booking_date_str, time_slot):
    booking_date = _parse_booking_date(booking_date_str)
    slot_start, _ = _parse_slot_range(time_slot)
    if not booking_date or not slot_start:
        return None
    return datetime.combine(booking_date, slot_start)


def _slot_has_ended(booking_date_str, time_slot, now_dt):
    booking_date = _parse_booking_date(booking_date_str)
    slot_start, slot_end = _parse_slot_range(time_slot)
    if not booking_date or not slot_start or not slot_end:
        return False

    slot_start_dt = datetime.combine(booking_date, slot_start)
    slot_end_dt = datetime.combine(booking_date, slot_end)
    # Handle slots that wrap over midnight (e.g., 23:00 - 00:00)
    if slot_end_dt <= slot_start_dt:
        slot_end_dt += timedelta(days=1)

    return slot_end_dt <= now_dt


def _send_upcoming_booking_reminders(db, user_id=None):
    now_dt = now_utc()
    look_ahead = now_dt + timedelta(minutes=30)

    query = {
        'status': {'$in': ['confirmed', 'pending']},
        'reminder_sent_30m': {'$ne': True},
    }
    if user_id is not None:
        query['user_id'] = user_id

    upcoming = list(db.bookings.find(query, {'_id': 1, 'user_id': 1, 'station_id': 1, 'date': 1, 'time_slot': 1}))
    if not upcoming:
        return

    station_ids = {
        booking.get('station_id')
        for booking in upcoming
        if booking.get('station_id') is not None
    }
    station_docs = list(db.stations.find({'_id': {'$in': list(station_ids)}}, {'_id': 1, 'name': 1})) if station_ids else []
    station_name_map = {station['_id']: station.get('name') or 'Unknown Station' for station in station_docs}

    reminder_ids = []
    for booking in upcoming:
        start_dt = _slot_start_datetime(booking.get('date'), booking.get('time_slot'))
        if not start_dt:
            continue

        if now_dt <= start_dt <= look_ahead:
            station_name = station_name_map.get(booking.get('station_id'), 'Unknown Station')
            _create_notification(
                db,
                booking.get('user_id'),
                'reminder',
                'Booking Reminder',
                f'Your charging slot starts in 30 minutes at {station_name}. Please arrive on time.',
                '/user/bookings'
            )
            reminder_ids.append(booking.get('_id'))

    if reminder_ids:
        db.bookings.update_many(
            {'_id': {'$in': reminder_ids}},
            {'$set': {'reminder_sent_30m': True, 'updated_at': now_utc()}}
        )


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

    active_bookings = list(
        db.bookings.find(query, {'_id': 1, 'user_id': 1, 'station_id': 1, 'date': 1, 'time_slot': 1})
    )
    expired_bookings = [
        booking
        for booking in active_bookings
        if _slot_has_ended(booking.get('date'), booking.get('time_slot'), now_dt)
    ]

    if expired_bookings:
        expired_ids = [booking['_id'] for booking in expired_bookings]
        db.bookings.update_many(
            {'_id': {'$in': expired_ids}},
            {'$set': {'status': 'missed_charging', 'updated_at': now_utc()}}
        )

        station_ids = {
            booking.get('station_id')
            for booking in expired_bookings
            if booking.get('station_id') is not None
        }
        station_docs = list(db.stations.find({'_id': {'$in': list(station_ids)}}, {'_id': 1, 'name': 1, 'operator_id': 1})) if station_ids else []
        station_map = {station['_id']: station for station in station_docs}

        for booking in expired_bookings:
            booking_station = station_map.get(booking.get('station_id'))
            station_name = (booking_station or {}).get('name') or 'Unknown Station'
            slot_label = _humanize_slot_label(booking.get('time_slot'))

            _create_notification(
                db,
                booking.get('user_id'),
                'reminder',
                'Missed Charging',
                'You have missed your booking.',
                '/user/bookings'
            )
            _create_notification(
                db,
                (booking_station or {}).get('operator_id'),
                'reminder',
                'Missed Charging Session',
                f'User missed {slot_label} at {station_name} on {booking.get("date")}.',
                '/operator/stations'
            )
            _notify_admins(
                db,
                'reminder',
                'Missed Charging Session',
                f'Missed session recorded for {station_name} on {booking.get("date")} ({slot_label}).',
                '/admin/bookings'
            )


def _create_notification(db, user_id, notification_type, title, message, action_url=None):
    if not user_id:
        return
    notification = Notification(
        user_id=str(user_id),
        notification_type=notification_type,
        title=title,
        message=message,
        action_url=action_url
    )
    db.notifications.insert_one(notification.to_dict())


def _notify_admins(db, notification_type, title, message, action_url=None):
    admin_users = list(db.users.find({'role': 'admin'}, {'_id': 1}))
    for admin in admin_users:
        _create_notification(db, admin.get('_id'), notification_type, title, message, action_url)

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

        _refresh_elapsed_bookings(db)
        _send_upcoming_booking_reminders(db, user.get('_id'))

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
        if slot_end_dt <= slot_start_dt:
            slot_end_dt += timedelta(days=1)
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

        selected_port = None
        for port in station.get('ports', []):
            if str(port.get('id')) == str(normalized_port_id):
                selected_port = port
                break

        if not selected_port:
            return jsonify({'success': False, 'error': 'Selected port not found'}), 404

        valid_slots = _generate_time_slots(selected_port.get('type', 'normal'))
        if data.get('timeSlot') not in valid_slots:
            return jsonify({'success': False, 'error': 'Invalid time slot for selected charger type'}), 400

        projection = calculate_charging_projection(
            battery_capacity_kwh=data.get('batteryCapacity', 60),
            current_percentage=data.get('batteryStart', 20),
            target_percentage=data.get('batteryTarget', 80),
            duration_minutes=data.get('durationMinutes', 60),
            rate_per_kwh=(selected_port or {}).get('price') or station.get('pricing', {}).get('perKwh') or 8,
            charger_power_kw=(selected_port or {}).get('power') or 22,
            progress_percentage=100,
        )
        estimated_cost = projection['estimatedTotalCost']
        
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
        booking_dict_for_insert = booking.to_dict()
        booking_dict_for_insert['reminder_sent_30m'] = False

        try:
            result = db.bookings.insert_one(booking_dict_for_insert)
        except DuplicateKeyError:
            return jsonify({'success': False, 'error': 'Time slot is already booked'}), 400

        booking.id = str(result.inserted_id)
        
        # Create notifications for user, operator and admins
        slot_label = _humanize_slot_label(data['timeSlot'])
        _create_notification(
            db,
            user_id,
            'booking_confirmed',
            'Booking Confirmed',
            f'You have booked {slot_label} slot at {station["name"]} on {data["date"]}.',
            '/user/bookings'
        )
        _create_notification(
            db,
            station.get('operator_id'),
            'booking_confirmed',
            'New Booking Received',
            f'New booking for {slot_label} at {station["name"]} on {data["date"]}.',
            '/operator/stations'
        )
        _notify_admins(
            db,
            'booking_confirmed',
            'New Booking Recorded',
            f'Booking created for {station["name"]} on {data["date"]} ({slot_label}).',
            '/admin/bookings'
        )
        
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

        station = db.stations.find_one({'_id': booking_data.get('station_id')}, {'name': 1, 'operator_id': 1})
        station_name = (station or {}).get('name') or 'Unknown Station'
        slot_label = _humanize_slot_label(booking_data.get('time_slot'))

        _create_notification(
            db,
            booking_data.get('user_id'),
            'reminder',
            'Booking Cancelled',
            f'Your booking for {slot_label} at {station_name} on {booking_data.get("date")} was cancelled.',
            '/user/bookings'
        )
        _create_notification(
            db,
            (station or {}).get('operator_id'),
            'reminder',
            'Booking Cancelled',
            f'A booking for {slot_label} at {station_name} on {booking_data.get("date")} was cancelled.',
            '/operator/stations'
        )
        _notify_admins(
            db,
            'reminder',
            'Booking Cancelled',
            f'Booking cancelled for {station_name} on {booking_data.get("date")} ({slot_label}).',
            '/admin/bookings'
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
        charging_mode = str(request.args.get('chargingMode') or '').strip().lower()
        charger_type_hint = request.args.get('chargerType')
        
        if not station_id or not date:
            return jsonify({'success': False, 'error': 'stationId and date are required'}), 400

        station_oid = to_object_id(station_id)
        if not station_oid:
            return jsonify({'success': False, 'error': 'Invalid stationId'}), 400

        station = db.stations.find_one({'_id': station_oid}, {'ports': 1})
        if not station:
            return jsonify({'success': False, 'error': 'Station not found'}), 404

        selected_port = None
        normalized_port_id = _normalize_port_id(port_id)
        if normalized_port_id is not None:
            for port in station.get('ports', []):
                if _normalize_port_id(port.get('id')) == normalized_port_id:
                    selected_port = port
                    break

        selected_type = (selected_port or {}).get('type', 'normal')
        if charging_mode == 'fast':
            selected_type = 'fast'
        elif charging_mode == 'normal':
            selected_type = 'normal'
        elif charger_type_hint:
            selected_type = charger_type_hint
        time_slots = _generate_time_slots(selected_type)

        _ensure_booking_indexes(db)
        _refresh_elapsed_bookings(
            db,
            station_id=station_oid,
            date=date,
            port_id=normalized_port_id
        )
        _send_upcoming_booking_reminders(db)
        
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
            for slot in time_slots
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

        _refresh_elapsed_bookings(db, station_id=station_oid)
        _send_upcoming_booking_reminders(db)

        bookings_data = list(db.bookings.find({'station_id': station_oid}).sort('created_at', -1))
        bookings = _serialize_bookings(bookings_data, db)
        
        return jsonify({'success': True, 'data': bookings})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
