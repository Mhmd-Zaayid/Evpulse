from flask import Blueprint, request, jsonify, g
from database import get_db
from models.station import Station
from bson import ObjectId
from datetime import datetime
import math
import re

from routes.common import role_required, to_object_id, now_utc

stations_bp = Blueprint('stations', __name__)


def _build_user_name_map(db, user_ids):
    valid_ids = []
    for user_id in user_ids:
        oid = to_object_id(user_id)
        if oid:
            valid_ids.append(oid)

    if not valid_ids:
        return {}

    users = list(db.users.find(
        {'_id': {'$in': valid_ids}},
        {'name': 1, 'email': 1}
    ))
    return {
        str(user['_id']): user.get('name') or user.get('email') or 'Unknown Operator'
        for user in users
    }

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
            query['city'] = {'$regex': re.escape(city), '$options': 'i'}
        
        # Fetch from MongoDB database
        stations_data = list(db.stations.find(query))
        operator_name_map = _build_user_name_map(db, [data.get('operator_id') for data in stations_data])
        stations = []
        
        for data in stations_data:
            station = Station.from_dict(data)

            station_lat = station.coordinates.get('lat') if isinstance(station.coordinates, dict) else None
            station_lng = station.coordinates.get('lng') if isinstance(station.coordinates, dict) else None
            has_valid_coords = (
                isinstance(station_lat, (int, float)) and
                isinstance(station_lng, (int, float)) and
                not (station_lat == 0 and station_lng == 0)
            )

            distance = None
            if has_valid_coords:
                distance = calculate_distance(user_lat, user_lng, station_lat, station_lng)
                if max_distance and distance > max_distance:
                    continue
            
            ports = station.ports if isinstance(station.ports, list) else []

            # Filter by charging type
            if charging_type and charging_type != 'all':
                has_type = any(
                    charging_type.lower() in p.get('type', '').lower()
                    for p in ports
                )
                if not has_type:
                    continue
            
            station_response = station.to_response_dict(distance=distance)
            station_response['operatorName'] = operator_name_map.get(
                station_response.get('operatorId'),
                'Unknown Operator'
            )
            stations.append(station_response)
        
        # Sort results
        if sort_by == 'distance':
            stations.sort(key=lambda x: x.get('distance') if x.get('distance') is not None else float('inf'))
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
        station_response = station.to_response_dict()
        operator_name_map = _build_user_name_map(db, [station_response.get('operatorId')])
        station_response['operatorName'] = operator_name_map.get(
            station_response.get('operatorId'),
            'Unknown Operator'
        )
        return jsonify({'success': True, 'data': station_response})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@stations_bp.route('/operator/<operator_id>', methods=['GET'])
def get_stations_by_operator(operator_id):
    """Get all stations for a specific operator"""
    try:
        db = get_db()
        if db is None:
            return jsonify({'success': False, 'error': 'Database connection unavailable. Please try again later.'}), 503
        
        op_oid = to_object_id(operator_id)
        if not op_oid:
            return jsonify({'success': False, 'error': 'Invalid operator id'}), 400

        stations_data = list(db.stations.find({'operator_id': op_oid}))
        operator_name_map = _build_user_name_map(db, [data.get('operator_id') for data in stations_data])
        stations = []
        for data in stations_data:
            station_response = Station.from_dict(data).to_response_dict()
            station_response['operatorName'] = operator_name_map.get(
                station_response.get('operatorId'),
                'Unknown Operator'
            )
            stations.append(station_response)
        
        return jsonify({'success': True, 'data': stations})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@stations_bp.route('', methods=['POST'])
@role_required('operator', 'admin')
def create_station():
    """Create a new station (operator/admin only)"""
    try:
        db = g.db
        user_id = g.current_user_id
        data = request.get_json() or {}

        name = str(data.get('name') or '').strip()
        city = str(data.get('city') or '').strip()
        nearby_landmark = str(data.get('nearbyLandmark') or data.get('address') or '').strip()

        if not name:
            return jsonify({'success': False, 'error': 'name is required'}), 400
        if not city:
            return jsonify({'success': False, 'error': 'city is required'}), 400
        if not nearby_landmark:
            return jsonify({'success': False, 'error': 'nearby landmark is required'}), 400
        
        station = Station(
            name=name,
            address=nearby_landmark,
            city=city,
            coordinates=data.get('coordinates', {}),
            operator_id=user_id,
            amenities=data.get('amenities', []),
            operating_hours=data.get('operatingHours', '24/7'),
            ports=data.get('ports', []),
            pricing=data.get('pricing', {}),
            peak_hours=data.get('peakHours'),
            image=data.get('image'),
            nearby_landmark=nearby_landmark
        )
        station.created_at = now_utc()
        station.updated_at = now_utc()
        
        result = db.stations.insert_one(station.to_dict())
        station.id = str(result.inserted_id)
        
        return jsonify({
            'success': True,
            'message': 'Station created successfully',
            'data': station.to_response_dict()
        }), 201
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@stations_bp.route('/<station_id>', methods=['PUT'])
@role_required('operator', 'admin')
def update_station(station_id):
    """Update a station"""
    try:
        db = g.db
        user = g.current_user
        data = request.get_json() or {}
        
        # Verify ownership or admin
        station_oid = to_object_id(station_id)
        if not station_oid:
            return jsonify({'success': False, 'error': 'Invalid station id'}), 400

        station_data = db.stations.find_one({'_id': station_oid})
        if not station_data:
            return jsonify({'success': False, 'error': 'Station not found'}), 404

        if station_data.get('operator_id') != user.get('_id') and user.get('role') != 'admin':
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        # Update allowed fields
        allowed_fields = ['name', 'address', 'city', 'status', 'amenities', 
                         'operating_hours', 'ports', 'pricing', 'peak_hours', 'image', 'nearby_landmark']
        update_data = {k: v for k, v in data.items() if k in allowed_fields}

        if 'nearbyLandmark' in data:
            update_data['nearby_landmark'] = str(data.get('nearbyLandmark') or '').strip()

        if 'address' in data and 'nearby_landmark' not in update_data:
            update_data['nearby_landmark'] = str(data.get('address') or '').strip()

        if any(key in data for key in ['city', 'address', 'nearbyLandmark', 'nearby_landmark']):
            effective_city = str(update_data.get('city', station_data.get('city', '')) or '').strip()
            effective_landmark = str(
                update_data.get(
                    'nearby_landmark',
                    station_data.get('nearby_landmark') or station_data.get('address') or ''
                )
            ).strip()

            update_data['city'] = effective_city
            update_data['nearby_landmark'] = effective_landmark
            update_data['address'] = Station.format_display_address(effective_city, effective_landmark)

        update_data['updated_at'] = now_utc()
        
        db.stations.update_one(
            {'_id': station_oid},
            {'$set': update_data}
        )
        
        updated_station = db.stations.find_one({'_id': station_oid})
        station = Station.from_dict(updated_station)
        
        return jsonify({'success': True, 'data': station.to_response_dict()})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@stations_bp.route('/<station_id>/status', methods=['PUT'])
@role_required('operator', 'admin')
def update_station_status(station_id):
    """Update station status"""
    try:
        db = g.db
        user = g.current_user
        data = request.get_json() or {}
        new_status = data.get('status')
        
        if new_status not in ['available', 'busy', 'offline']:
            return jsonify({'success': False, 'error': 'Invalid status'}), 400
        
        station_oid = to_object_id(station_id)
        if not station_oid:
            return jsonify({'success': False, 'error': 'Invalid station id'}), 400

        if user.get('role') == 'operator':
            station = db.stations.find_one({'_id': station_oid})
            if not station or station.get('operator_id') != user.get('_id'):
                return jsonify({'success': False, 'error': 'Unauthorized'}), 403

        result = db.stations.update_one(
            {'_id': station_oid},
            {'$set': {'status': new_status, 'updated_at': now_utc()}}
        )
        
        if result.modified_count == 0:
            return jsonify({'success': False, 'error': 'Station not found'}), 404
        
        return jsonify({'success': True, 'message': 'Station status updated'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@stations_bp.route('/<station_id>/ports/<port_id>/status', methods=['PUT'])
@role_required('operator', 'admin')
def update_port_status(station_id, port_id):
    """Update a specific port status"""
    try:
        db = g.db
        user = g.current_user
        data = request.get_json() or {}
        new_status = data.get('status')
        
        if new_status not in ['available', 'busy', 'offline']:
            return jsonify({'success': False, 'error': 'Invalid status'}), 400
        
        station_oid = to_object_id(station_id)
        if not station_oid:
            return jsonify({'success': False, 'error': 'Invalid station id'}), 400

        if user.get('role') == 'operator':
            station = db.stations.find_one({'_id': station_oid})
            if not station or station.get('operator_id') != user.get('_id'):
                return jsonify({'success': False, 'error': 'Unauthorized'}), 403

        result = db.stations.update_one(
            {'_id': station_oid, 'ports.id': int(port_id)},
            {'$set': {'ports.$.status': new_status, 'updated_at': now_utc()}}
        )
        
        if result.modified_count == 0:
            return jsonify({'success': False, 'error': 'Station or port not found'}), 404
        
        return jsonify({'success': True, 'message': 'Port status updated'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
