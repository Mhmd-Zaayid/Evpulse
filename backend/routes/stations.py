from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import get_db
from models.station import Station
from bson import ObjectId
from datetime import datetime
import math

stations_bp = Blueprint('stations', __name__)

def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two coordinates in km using Haversine formula"""
    R = 6371  # Earth's radius in km
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return round(R * c, 1)

@stations_bp.route('', methods=['GET'])
def get_all_stations():
    """Get all stations with optional filters"""
    try:
        db = get_db()
        if db is None:
            return jsonify({'success': False, 'error': 'Database connection unavailable. Please try again later.'}), 503
        
        # Get query parameters
        status = request.args.get('status')
        charging_type = request.args.get('chargingType')
        max_distance = request.args.get('maxDistance', type=float)
        sort_by = request.args.get('sortBy', 'distance')
        user_lat = request.args.get('lat', 37.7749, type=float)
        user_lng = request.args.get('lng', -122.4194, type=float)
        city = request.args.get('city')
        
        # Build query
        query = {}
        if status and status != 'all':
            query['status'] = status
        if city:
            query['city'] = city
        
        # Fetch from MongoDB database
        stations_data = list(db.stations.find(query))
        stations = []
        
        for data in stations_data:
            station = Station.from_dict(data)
            
            # Calculate distance
            distance = calculate_distance(
                user_lat, user_lng,
                station.coordinates.get('lat', 0),
                station.coordinates.get('lng', 0)
            )
            
            # Filter by max distance
            if max_distance and distance > max_distance:
                continue
            
            # Filter by charging type
            if charging_type and charging_type != 'all':
                has_type = any(
                    charging_type.lower() in p.get('type', '').lower()
                    for p in station.ports
                )
                if not has_type:
                    continue
            
            stations.append(station.to_response_dict(distance=distance))
        
        # Sort results
        if sort_by == 'distance':
            stations.sort(key=lambda x: x.get('distance', float('inf')))
        elif sort_by == 'rating':
            stations.sort(key=lambda x: x.get('rating', 0), reverse=True)
        
        return jsonify({'success': True, 'data': stations})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@stations_bp.route('/<station_id>', methods=['GET'])
def get_station_by_id(station_id):
    """Get a specific station by ID"""
    try:
        db = get_db()
        if db is None:
            return jsonify({'success': False, 'error': 'Database connection unavailable. Please try again later.'}), 503
        
        station_data = db.stations.find_one({'_id': ObjectId(station_id)})
        
        if not station_data:
            return jsonify({'success': False, 'error': 'Station not found'}), 404
        
        station = Station.from_dict(station_data)
        return jsonify({'success': True, 'data': station.to_response_dict()})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@stations_bp.route('/operator/<operator_id>', methods=['GET'])
def get_stations_by_operator(operator_id):
    """Get all stations for a specific operator"""
    try:
        db = get_db()
        if db is None:
            return jsonify({'success': False, 'error': 'Database connection unavailable. Please try again later.'}), 503
        
        stations_data = list(db.stations.find({'operator_id': operator_id}))
        stations = [Station.from_dict(data).to_response_dict() for data in stations_data]
        
        return jsonify({'success': True, 'data': stations})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@stations_bp.route('', methods=['POST'])
@jwt_required()
def create_station():
    """Create a new station (operator/admin only)"""
    try:
        db = get_db()
        if db is None:
            return jsonify({'success': False, 'error': 'Database connection unavailable. Please try again later.'}), 503
        
        user_id = get_jwt_identity()
        user_data = db.users.find_one({'_id': ObjectId(user_id)})
        
        if not user_data or user_data.get('role') not in ['operator', 'admin']:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        
        station = Station(
            name=data['name'],
            address=data['address'],
            city=data['city'],
            coordinates=data.get('coordinates', {}),
            operator_id=user_id,
            amenities=data.get('amenities', []),
            operating_hours=data.get('operatingHours', '24/7'),
            ports=data.get('ports', []),
            pricing=data.get('pricing', {}),
            peak_hours=data.get('peakHours'),
            image=data.get('image')
        )
        
        result = db.stations.insert_one(station.to_dict())
        station.id = str(result.inserted_id)
        
        return jsonify({'success': True, 'data': station.to_response_dict()}), 201
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@stations_bp.route('/<station_id>', methods=['PUT'])
@jwt_required()
def update_station(station_id):
    """Update a station"""
    try:
        db = get_db()
        if db is None:
            return jsonify({'success': False, 'error': 'Database connection unavailable. Please try again later.'}), 503
        
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Verify ownership or admin
        station_data = db.stations.find_one({'_id': ObjectId(station_id)})
        if not station_data:
            return jsonify({'success': False, 'error': 'Station not found'}), 404
        
        user_data = db.users.find_one({'_id': ObjectId(user_id)})
        if station_data.get('operator_id') != user_id and user_data.get('role') != 'admin':
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        # Update allowed fields
        allowed_fields = ['name', 'address', 'city', 'status', 'amenities', 
                         'operating_hours', 'ports', 'pricing', 'peak_hours', 'image']
        update_data = {k: v for k, v in data.items() if k in allowed_fields}
        update_data['updated_at'] = datetime.utcnow()
        
        db.stations.update_one(
            {'_id': ObjectId(station_id)},
            {'$set': update_data}
        )
        
        updated_station = db.stations.find_one({'_id': ObjectId(station_id)})
        station = Station.from_dict(updated_station)
        
        return jsonify({'success': True, 'data': station.to_response_dict()})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@stations_bp.route('/<station_id>/status', methods=['PUT'])
@jwt_required()
def update_station_status(station_id):
    """Update station status"""
    try:
        db = get_db()
        if db is None:
            return jsonify({'success': False, 'error': 'Database connection unavailable. Please try again later.'}), 503
        
        user_id = get_jwt_identity()
        data = request.get_json()
        new_status = data.get('status')
        
        if new_status not in ['available', 'busy', 'offline']:
            return jsonify({'success': False, 'error': 'Invalid status'}), 400
        
        result = db.stations.update_one(
            {'_id': ObjectId(station_id)},
            {'$set': {'status': new_status, 'updated_at': datetime.utcnow()}}
        )
        
        if result.modified_count == 0:
            return jsonify({'success': False, 'error': 'Station not found'}), 404
        
        return jsonify({'success': True, 'message': 'Station status updated'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@stations_bp.route('/<station_id>/ports/<port_id>/status', methods=['PUT'])
@jwt_required()
def update_port_status(station_id, port_id):
    """Update a specific port status"""
    try:
        db = get_db()
        if db is None:
            return jsonify({'success': False, 'error': 'Database connection unavailable. Please try again later.'}), 503
        
        data = request.get_json()
        new_status = data.get('status')
        
        if new_status not in ['available', 'busy', 'offline']:
            return jsonify({'success': False, 'error': 'Invalid status'}), 400
        
        result = db.stations.update_one(
            {'_id': ObjectId(station_id), 'ports.id': int(port_id)},
            {'$set': {'ports.$.status': new_status, 'updated_at': datetime.utcnow()}}
        )
        
        if result.modified_count == 0:
            return jsonify({'success': False, 'error': 'Station or port not found'}), 404
        
        return jsonify({'success': True, 'message': 'Port status updated'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
