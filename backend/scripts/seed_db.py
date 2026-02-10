"""
Database seeder script for EVPulse
Run this script to populate the database with initial data
"""

import os
import sys
from datetime import datetime, timedelta
from bson import ObjectId

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from database import get_db
from models.user import User
from models.station import Station
from models.session import Session
from models.booking import Booking
from models.transaction import Transaction
from models.review import Review
from models.notification import Notification

def seed_database():
    """Seed the database with initial data"""
    app = create_app()
    
    with app.app_context():
        print("🌱 Starting database seeding...")
        
        db = get_db()
        if db is None:
            print("❌ Failed to connect to database. Aborting seed.")
            return
        
        # Clear existing data
        print("🗑️  Clearing existing data...")
        db.users.delete_many({})
        db.stations.delete_many({})
        db.sessions.delete_many({})
        db.bookings.delete_many({})
        db.transactions.delete_many({})
        db.reviews.delete_many({})
        db.notifications.delete_many({})
        
        # Create users
        print("👤 Creating users...")
        users_data = [
            {
                'email': 'user@evpulse.com',
                'password': 'user123',
                'name': 'John Doe',
                'role': 'user',
                'phone': '+1 234 567 8900',
                'vehicle': {
                    'make': 'Tesla',
                    'model': 'Model 3',
                    'batteryCapacity': 75,
                    'range': 350
                }
            },
            {
                'email': 'operator@evpulse.com',
                'password': 'operator123',
                'name': 'Sarah Wilson',
                'role': 'operator',
                'phone': '+1 234 567 8901',
                'company': 'GreenCharge Inc.'
            },
            {
                'email': 'admin@evpulse.com',
                'password': 'admin123',
                'name': 'Mike Anderson',
                'role': 'admin',
                'phone': '+1 234 567 8902',
                'department': 'Operations'
            }
        ]
        
        user_ids = {}
        for user_data in users_data:
            user = User(
                email=user_data['email'],
                password=user_data['password'],
                name=user_data['name'],
                role=user_data['role'],
                phone=user_data.get('phone'),
                vehicle=user_data.get('vehicle'),
                company=user_data.get('company'),
                department=user_data.get('department')
            )
            result = db.users.insert_one(user.to_dict())
            user_ids[user_data['role']] = str(result.inserted_id)
            print(f"   ✓ Created {user_data['role']}: {user_data['email']}")
        
        # Create stations
        print("⚡ Creating charging stations...")
        stations_data = [
            {
                'name': 'GreenCharge Hub',
                'address': '123 Electric Ave, Downtown',
                'city': 'San Francisco',
                'coordinates': {'lat': 37.7749, 'lng': -122.4194},
                'status': 'available',
                'amenities': ['WiFi', 'Restroom', 'Cafe', 'Parking'],
                'operating_hours': '24/7',
                'ports': [
                    {'id': 1, 'type': 'Fast DC', 'power': 150, 'status': 'available', 'price': 0.35},
                    {'id': 2, 'type': 'Fast DC', 'power': 150, 'status': 'busy', 'price': 0.35},
                    {'id': 3, 'type': 'Normal AC', 'power': 22, 'status': 'available', 'price': 0.25},
                    {'id': 4, 'type': 'Normal AC', 'power': 22, 'status': 'offline', 'price': 0.25}
                ],
                'pricing': {'normal': {'base': 0.25, 'peak': 0.32}, 'fast': {'base': 0.35, 'peak': 0.45}},
                'peak_hours': {'start': '18:00', 'end': '21:00'},
                'image': 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=400',
                'rating': 4.8,
                'total_reviews': 256
            },
            {
                'name': 'PowerGrid Station',
                'address': '456 Volt Street, Tech Park',
                'city': 'San Francisco',
                'coordinates': {'lat': 37.7849, 'lng': -122.4094},
                'status': 'available',
                'amenities': ['WiFi', 'Parking', 'Shop'],
                'operating_hours': '6:00 AM - 11:00 PM',
                'ports': [
                    {'id': 5, 'type': 'Fast DC', 'power': 350, 'status': 'available', 'price': 0.45},
                    {'id': 6, 'type': 'Fast DC', 'power': 350, 'status': 'available', 'price': 0.45},
                    {'id': 7, 'type': 'Normal AC', 'power': 22, 'status': 'busy', 'price': 0.22}
                ],
                'pricing': {'normal': {'base': 0.22, 'peak': 0.28}, 'fast': {'base': 0.45, 'peak': 0.55}},
                'peak_hours': {'start': '17:00', 'end': '20:00'},
                'image': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
                'rating': 4.6,
                'total_reviews': 189
            },
            {
                'name': 'EcoCharge Plaza',
                'address': '789 Green Road, Mall Center',
                'city': 'San Francisco',
                'coordinates': {'lat': 37.7649, 'lng': -122.4294},
                'status': 'busy',
                'amenities': ['WiFi', 'Restroom', 'Mall Access', 'Food Court'],
                'operating_hours': '8:00 AM - 10:00 PM',
                'ports': [
                    {'id': 8, 'type': 'Fast DC', 'power': 150, 'status': 'busy', 'price': 0.38},
                    {'id': 9, 'type': 'Fast DC', 'power': 150, 'status': 'busy', 'price': 0.38},
                    {'id': 10, 'type': 'Normal AC', 'power': 11, 'status': 'busy', 'price': 0.20},
                    {'id': 11, 'type': 'Normal AC', 'power': 11, 'status': 'available', 'price': 0.20}
                ],
                'pricing': {'normal': {'base': 0.20, 'peak': 0.26}, 'fast': {'base': 0.38, 'peak': 0.48}},
                'peak_hours': {'start': '18:00', 'end': '21:00'},
                'image': 'https://images.unsplash.com/photo-1647166545674-ce28ce93bdca?w=400',
                'rating': 4.4,
                'total_reviews': 142
            },
            {
                'name': 'QuickCharge Express',
                'address': '321 Highway Junction',
                'city': 'Oakland',
                'coordinates': {'lat': 37.8044, 'lng': -122.2712},
                'status': 'available',
                'amenities': ['Restroom', 'Vending Machine'],
                'operating_hours': '24/7',
                'ports': [
                    {'id': 12, 'type': 'Fast DC', 'power': 250, 'status': 'available', 'price': 0.42},
                    {'id': 13, 'type': 'Fast DC', 'power': 250, 'status': 'available', 'price': 0.42}
                ],
                'pricing': {'fast': {'base': 0.42, 'peak': 0.52}},
                'peak_hours': {'start': '17:00', 'end': '20:00'},
                'image': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
                'rating': 4.2,
                'total_reviews': 98
            },
            {
                'name': 'City Center Charge',
                'address': '555 Main Street',
                'city': 'San Francisco',
                'coordinates': {'lat': 37.7899, 'lng': -122.4014},
                'status': 'offline',
                'amenities': ['Parking'],
                'operating_hours': '7:00 AM - 9:00 PM',
                'ports': [
                    {'id': 14, 'type': 'Normal AC', 'power': 22, 'status': 'offline', 'price': 0.24},
                    {'id': 15, 'type': 'Normal AC', 'power': 22, 'status': 'offline', 'price': 0.24}
                ],
                'pricing': {'normal': {'base': 0.24, 'peak': 0.30}},
                'peak_hours': {'start': '18:00', 'end': '21:00'},
                'image': 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=400',
                'rating': 4.0,
                'total_reviews': 67
            }
        ]
        
        station_ids = []
        for station_data in stations_data:
            station_doc = {
                'name': station_data['name'],
                'address': station_data['address'],
                'city': station_data['city'],
                'coordinates': station_data['coordinates'],
                'operator_id': user_ids['operator'],
                'status': station_data['status'],
                'rating': station_data['rating'],
                'total_reviews': station_data['total_reviews'],
                'amenities': station_data['amenities'],
                'operating_hours': station_data['operating_hours'],
                'ports': station_data['ports'],
                'pricing': station_data['pricing'],
                'peak_hours': station_data['peak_hours'],
                'image': station_data['image'],
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }
            result = db.stations.insert_one(station_doc)
            station_ids.append(str(result.inserted_id))
            print(f"   ✓ Created station: {station_data['name']}")
        
        # Create sample sessions
        print("🔌 Creating charging sessions...")
        sessions_data = [
            {
                'station_id': station_ids[0],
                'port_id': 1,
                'duration': 45,
                'energy_delivered': 35.5,
                'cost': 12.43,
                'status': 'completed',
                'charging_type': 'Fast DC',
                'payment_method': 'Card',
                'start_time': datetime.utcnow() - timedelta(days=1, hours=14)
            },
            {
                'station_id': station_ids[1],
                'port_id': 5,
                'duration': 45,
                'energy_delivered': 42.0,
                'cost': 18.90,
                'status': 'completed',
                'charging_type': 'Fast DC',
                'payment_method': 'Wallet',
                'start_time': datetime.utcnow() - timedelta(days=2, hours=10)
            },
            {
                'station_id': station_ids[2],
                'port_id': 10,
                'duration': 180,
                'energy_delivered': 28.5,
                'cost': 5.70,
                'status': 'completed',
                'charging_type': 'Normal AC',
                'payment_method': 'UPI',
                'start_time': datetime.utcnow() - timedelta(days=3, hours=15)
            }
        ]
        
        for session_data in sessions_data:
            session_doc = {
                'order_id': f"ORD-2026-{ObjectId()}",
                'user_id': user_ids['user'],
                'station_id': session_data['station_id'],
                'port_id': session_data['port_id'],
                'start_time': session_data['start_time'],
                'end_time': session_data['start_time'] + timedelta(minutes=session_data['duration']),
                'duration': session_data['duration'],
                'energy_delivered': session_data['energy_delivered'],
                'cost': session_data['cost'],
                'status': session_data['status'],
                'charging_type': session_data['charging_type'],
                'payment_method': session_data['payment_method'],
                'progress': 100,
                'created_at': session_data['start_time'],
                'updated_at': datetime.utcnow()
            }
            db.sessions.insert_one(session_doc)
        print(f"   ✓ Created {len(sessions_data)} charging sessions")
        
        # Create sample bookings
        print("📅 Creating bookings...")
        bookings_data = [
            {
                'station_id': station_ids[1],
                'port_id': 5,
                'date': (datetime.utcnow() + timedelta(days=1)).strftime('%Y-%m-%d'),
                'time_slot': '15:00 - 16:00',
                'charging_type': 'Fast DC',
                'status': 'confirmed',
                'estimated_cost': 15.75
            },
            {
                'station_id': station_ids[0],
                'port_id': 3,
                'date': (datetime.utcnow() + timedelta(days=2)).strftime('%Y-%m-%d'),
                'time_slot': '10:00 - 13:00',
                'charging_type': 'Normal AC',
                'status': 'pending',
                'estimated_cost': 8.25
            }
        ]
        
        for booking_data in bookings_data:
            booking_doc = {
                'user_id': user_ids['user'],
                'station_id': booking_data['station_id'],
                'port_id': booking_data['port_id'],
                'date': booking_data['date'],
                'time_slot': booking_data['time_slot'],
                'charging_type': booking_data['charging_type'],
                'status': booking_data['status'],
                'estimated_cost': booking_data['estimated_cost'],
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }
            db.bookings.insert_one(booking_doc)
        print(f"   ✓ Created {len(bookings_data)} bookings")
        
        # Create sample transactions
        print("💳 Creating transactions...")
        transactions_data = [
            {'amount': 12.43, 'type': 'charging', 'payment_method': 'Card', 'description': 'Charging at GreenCharge Hub'},
            {'amount': 18.90, 'type': 'charging', 'payment_method': 'Wallet', 'description': 'Charging at PowerGrid Station'},
            {'amount': 5.70, 'type': 'charging', 'payment_method': 'UPI', 'description': 'Charging at EcoCharge Plaza'},
            {'amount': 50.00, 'type': 'wallet_topup', 'payment_method': 'Card', 'description': 'Wallet Top-up'},
            {'amount': 100.00, 'type': 'wallet_topup', 'payment_method': 'UPI', 'description': 'Wallet Top-up'}
        ]
        
        for i, trans_data in enumerate(transactions_data):
            trans_doc = {
                'user_id': user_ids['user'],
                'amount': trans_data['amount'],
                'type': trans_data['type'],
                'payment_method': trans_data['payment_method'],
                'status': 'completed',
                'description': trans_data['description'],
                'timestamp': datetime.utcnow() - timedelta(days=i),
                'created_at': datetime.utcnow() - timedelta(days=i)
            }
            db.transactions.insert_one(trans_doc)
        print(f"   ✓ Created {len(transactions_data)} transactions")
        
        # Create sample reviews
        print("⭐ Creating reviews...")
        reviews_data = [
            {'station_id': station_ids[0], 'rating': 5, 'comment': 'Excellent charging station! Fast charging and clean facilities.'},
            {'station_id': station_ids[0], 'rating': 4, 'comment': 'Great location and good amenities. Sometimes gets busy during peak hours.'},
            {'station_id': station_ids[1], 'rating': 4, 'comment': 'Fast charging speeds. WiFi could be better.'},
            {'station_id': station_ids[2], 'rating': 3, 'comment': 'Decent station but limited parking space.'},
            {'station_id': station_ids[0], 'rating': 5, 'comment': 'Best charging station in the area. Highly recommend!'}
        ]
        
        for review_data in reviews_data:
            review_doc = {
                'station_id': review_data['station_id'],
                'user_id': user_ids['user'],
                'user_name': 'John Doe',
                'rating': review_data['rating'],
                'comment': review_data['comment'],
                'helpful': 0,
                'timestamp': datetime.utcnow() - timedelta(days=len(reviews_data)),
                'created_at': datetime.utcnow()
            }
            db.reviews.insert_one(review_doc)
        print(f"   ✓ Created {len(reviews_data)} reviews")
        
        # Create sample notifications
        print("🔔 Creating notifications...")
        notifications_data = [
            {'type': 'booking_confirmed', 'title': 'Booking Confirmed', 'message': 'Your booking at PowerGrid Station for tomorrow at 3:00 PM has been confirmed.', 'action_url': '/user/bookings'},
            {'type': 'charging_complete', 'title': 'Charging Complete', 'message': 'Your vehicle has finished charging at GreenCharge Hub. Total: $12.43', 'action_url': '/user/history'},
            {'type': 'payment_success', 'title': 'Payment Successful', 'message': 'Payment of $12.43 for charging session completed successfully.', 'action_url': '/user/payments'},
            {'type': 'promotion', 'title': 'Weekend Special!', 'message': '20% off on all Normal AC charging this weekend. Use code: WEEKEND20', 'action_url': None},
            {'type': 'reminder', 'title': 'Upcoming Booking', 'message': 'Reminder: You have a booking tomorrow at PowerGrid Station, 3:00 PM.', 'action_url': '/user/bookings'}
        ]
        
        for notif_data in notifications_data:
            notif_doc = {
                'user_id': user_ids['user'],
                'type': notif_data['type'],
                'title': notif_data['title'],
                'message': notif_data['message'],
                'action_url': notif_data['action_url'],
                'read': False,
                'timestamp': datetime.utcnow(),
                'created_at': datetime.utcnow()
            }
            db.notifications.insert_one(notif_doc)
        print(f"   ✓ Created {len(notifications_data)} notifications")
        
        print("\n✅ Database seeding completed successfully!")
        print("\n📋 Login credentials:")
        print("   User:     user@evpulse.com / user123")
        print("   Operator: operator@evpulse.com / operator123")
        print("   Admin:    admin@evpulse.com / admin123")

if __name__ == '__main__':
    seed_database()
