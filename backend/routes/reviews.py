from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import get_db
from models.review import Review
from bson import ObjectId
from datetime import datetime

reviews_bp = Blueprint('reviews', __name__)

DB_UNAVAILABLE = {'success': False, 'error': 'Database connection unavailable. Please try again later.'}

@reviews_bp.route('/station/<station_id>', methods=['GET'])
def get_station_reviews(station_id):
    """Get all reviews for a station"""
    try:
        db = get_db()
        if db is None:
            return jsonify(DB_UNAVAILABLE), 503
        
        reviews_data = list(db.reviews.find({'station_id': station_id}).sort('timestamp', -1))
        reviews = [Review.from_dict(data).to_response_dict() for data in reviews_data]
        
        return jsonify({'success': True, 'data': reviews})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@reviews_bp.route('', methods=['POST'])
@jwt_required()
def create_review():
    """Create a new review"""
    try:
        db = get_db()
        if db is None:
            return jsonify(DB_UNAVAILABLE), 503
        
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Get user info
        user = db.users.find_one({'_id': ObjectId(user_id)})
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        # Check if user already reviewed this station
        existing = db.reviews.find_one({
            'station_id': data['stationId'],
            'user_id': user_id
        })
        
        if existing:
            return jsonify({'success': False, 'error': 'You have already reviewed this station'}), 400
        
        review = Review(
            station_id=data['stationId'],
            user_id=user_id,
            user_name=user['name'],
            rating=data['rating'],
            comment=data.get('comment', '')
        )
        
        result = db.reviews.insert_one(review.to_dict())
        review.id = str(result.inserted_id)
        
        # Update station rating
        _update_station_rating(station_id=data['stationId'])
        
        return jsonify({'success': True, 'data': review.to_response_dict()}), 201
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@reviews_bp.route('/user/<user_id>', methods=['GET'])
@jwt_required()
def get_user_reviews(user_id):
    """Get all reviews by a user"""
    try:
        db = get_db()
        if db is None:
            return jsonify(DB_UNAVAILABLE), 503
        
        reviews_data = list(db.reviews.find({'user_id': user_id}).sort('timestamp', -1))
        
        reviews = []
        for data in reviews_data:
            review = Review.from_dict(data)
            station = db.stations.find_one({'_id': ObjectId(review.station_id)})
            
            review_dict = review.to_response_dict()
            review_dict['stationName'] = station['name'] if station else 'Unknown Station'
            reviews.append(review_dict)
        
        return jsonify({'success': True, 'data': reviews})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@reviews_bp.route('/<review_id>/helpful', methods=['POST'])
@jwt_required()
def mark_helpful(review_id):
    """Mark a review as helpful"""
    try:
        db = get_db()
        if db is None:
            return jsonify(DB_UNAVAILABLE), 503
        
        result = db.reviews.update_one(
            {'_id': ObjectId(review_id)},
            {'$inc': {'helpful': 1}}
        )
        
        if result.modified_count == 0:
            return jsonify({'success': False, 'error': 'Review not found'}), 404
        
        return jsonify({'success': True, 'message': 'Marked as helpful'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@reviews_bp.route('/<review_id>', methods=['DELETE'])
@jwt_required()
def delete_review(review_id):
    """Delete a review"""
    try:
        db = get_db()
        if db is None:
            return jsonify(DB_UNAVAILABLE), 503
        
        user_id = get_jwt_identity()
        
        review = db.reviews.find_one({'_id': ObjectId(review_id)})
        if not review:
            return jsonify({'success': False, 'error': 'Review not found'}), 404
        
        # Check authorization
        user = db.users.find_one({'_id': ObjectId(user_id)})
        if review['user_id'] != user_id and user.get('role') != 'admin':
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        station_id = review['station_id']
        db.reviews.delete_one({'_id': ObjectId(review_id)})
        
        # Update station rating
        _update_station_rating(station_id)
        
        return jsonify({'success': True, 'message': 'Review deleted'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

def _update_station_rating(station_id):
    """Helper to update station's average rating"""
    try:
        db = get_db()
        if db is None:
            return
        
        reviews = list(db.reviews.find({'station_id': station_id}))
        
        if reviews:
            avg_rating = sum(r['rating'] for r in reviews) / len(reviews)
            db.stations.update_one(
                {'_id': ObjectId(station_id)},
                {'$set': {
                    'rating': round(avg_rating, 1),
                    'total_reviews': len(reviews)
                }}
            )
        else:
            db.stations.update_one(
                {'_id': ObjectId(station_id)},
                {'$set': {'rating': 0, 'total_reviews': 0}}
            )
    except Exception as e:
        print(f"Error updating station rating: {e}")
