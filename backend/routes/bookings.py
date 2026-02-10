from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import get_db
from models.booking import Booking
from models.notification import Notification
from bson import ObjectId
from datetime import datetime

bookings_bp = Blueprint('bookings', __name__)

# Available time slots
AVAILABLE_TIME_SLOTS = [
    '08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00',
    '12:00 - 13:00', '13:00 - 14:00', '14:00 - 15:00', '15:00 - 16:00',
    '16:00 - 17:00', '17:00 - 18:00', '18:00 - 19:00', '19:00 - 20:00',
    '20:00 - 21:00'
]

@bookings_bp.route('/user/<user_id>', methods=['GET'])
@jwt_required()
def get_user_bookings(user_id):
    """Get all bookings for a user"""
    try:
        # Check if database is available
        db = get_db()
        if db is None:
            return jsonify({'success': False, 'error': 'Database connection unavailable. Please try again later.'}), 503
        
        bookings_data = list(db.bookings.find({'user_id': user_id}).sort('date', -1))
        
        bookings = []
        for data in bookings_data:
            booking = Booking.from_dict(data)
            station = db.stations.find_one({'_id': ObjectId(booking.station_id)})
            
            booking_dict = booking.to_response_dict()
            booking_dict['stationName'] = station['name'] if station else 'Unknown Station'
            bookings.append(booking_dict)
        
        return jsonify({'success': True, 'data': bookings})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bookings_bp.route('', methods=['POST'])
@jwt_required()
def create_booking():
    """Create a new booking"""
    try:
        # Check if database is available
        db = get_db()
        if db is None:
            return jsonify({'success': False, 'error': 'Database connection unavailable. Please try again later.'}), 503
        
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['stationId', 'portId', 'date', 'timeSlot']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'success': False, 'error': f'{field} is required'}), 400
        
        # Check if slot is available
        existing = db.bookings.find_one({
            'station_id': data['stationId'],
            'port_id': data['portId'],
            'date': data['date'],
            'time_slot': data['timeSlot'],
            'status': {'$in': ['confirmed', 'pending']}
        })
        
        if existing:
            return jsonify({'success': False, 'error': 'Time slot is already booked'}), 400
        
        # Get station for pricing estimate
        station = db.stations.find_one({'_id': ObjectId(data['stationId'])})
        charging_type = data.get('chargingType', 'Normal AC')
        
        # Estimate cost based on slot duration (1 hour)
        rate = 0.35 if 'fast' in charging_type.lower() else 0.25
        estimated_cost = round(rate * 30, 2)  # ~30 kWh for 1 hour
        
        booking = Booking(
            user_id=user_id,
            station_id=data['stationId'],
            port_id=data['portId'],
            date=data['date'],
            time_slot=data['timeSlot'],
            charging_type=charging_type,
            estimated_cost=estimated_cost
        )
        
        result = db.bookings.insert_one(booking.to_dict())
        booking.id = str(result.inserted_id)
        
        # Create notification
        notification = Notification(
            user_id=user_id,
            notification_type='booking_confirmed',
            title='Booking Confirmed',
            message=f'Your booking at {station["name"]} for {data["date"]}, {data["timeSlot"]} has been confirmed.',
            action_url='/user/bookings'
        )
        db.notifications.insert_one(notification.to_dict())
        
        booking_dict = booking.to_response_dict()
        booking_dict['stationName'] = station['name'] if station else 'Unknown Station'
        
        return jsonify({'success': True, 'data': booking_dict}), 201
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bookings_bp.route('/<booking_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_booking(booking_id):
    """Cancel a booking"""
    try:
        # Check if database is available
        db = get_db()
        if db is None:
            return jsonify({'success': False, 'error': 'Database connection unavailable. Please try again later.'}), 503
        
        user_id = get_jwt_identity()
        
        booking_data = db.bookings.find_one({'_id': ObjectId(booking_id)})
        
        if not booking_data:
            return jsonify({'success': False, 'error': 'Booking not found'}), 404
        
        if booking_data['user_id'] != user_id:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        if booking_data['status'] == 'cancelled':
            return jsonify({'success': False, 'error': 'Booking is already cancelled'}), 400
        
        db.bookings.update_one(
            {'_id': ObjectId(booking_id)},
            {'$set': {'status': 'cancelled', 'updated_at': datetime.utcnow()}}
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
        
        # Find booked slots
        query = {
            'station_id': station_id,
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
@jwt_required()
def get_station_bookings(station_id):
    """Get all bookings for a station (operator view)"""
    try:
        # Check if database is available
        db = get_db()
        if db is None:
            return jsonify({'success': False, 'error': 'Database connection unavailable. Please try again later.'}), 503
        
        bookings_data = list(db.bookings.find({'station_id': station_id}).sort('date', -1))
        bookings = [Booking.from_dict(data).to_response_dict() for data in bookings_data]
        
        return jsonify({'success': True, 'data': bookings})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
