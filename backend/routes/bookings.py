from flask import Blueprint, request, jsonify, g
from database import get_db
from models.booking import Booking
from models.notification import Notification
from bson import ObjectId
from datetime import datetime

from routes.common import role_required, to_object_id, now_utc

bookings_bp = Blueprint('bookings', __name__)

# Available time slots
AVAILABLE_TIME_SLOTS = [
    '08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00',
    '12:00 - 13:00', '13:00 - 14:00', '14:00 - 15:00', '15:00 - 16:00',
    '16:00 - 17:00', '17:00 - 18:00', '18:00 - 19:00', '19:00 - 20:00',
    '20:00 - 21:00'
]

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
        
        # Check if slot is available
        existing = db.bookings.find_one({
            'station_id': station_id,
            'port_id': data['portId'],
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
            port_id=data['portId'],
            date=data['date'],
            time_slot=data['timeSlot'],
            charging_type=charging_type,
            estimated_cost=estimated_cost
        )
        booking.created_at = now_utc()
        booking.updated_at = now_utc()
        
        result = db.bookings.insert_one(booking.to_dict())
        booking.id = str(result.inserted_id)
        
        # Create notification
        notification = Notification(
            user_id=str(user_id),
            notification_type='booking_confirmed',
            title='Booking Confirmed',
            message=f'Your booking at {station["name"]} for {data["date"]}, {data["timeSlot"]} has been confirmed.',
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
        
        # Find booked slots
        query = {
            'station_id': station_oid,
            'date': date,
            'status': {'$in': ['confirmed', 'pending']}
        }
        if port_id:
            query['port_id'] = int(port_id)
        
        booked = list(db.bookings.find(query))
        booked_slots = [b['time_slot'] for b in booked]
        
        # Return available slots
        available = [slot for slot in AVAILABLE_TIME_SLOTS if slot not in booked_slots]
        
        return jsonify({'success': True, 'data': available})
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
