"""
EVPulse Flask Application
=========================
Main Flask application with MongoDB database integration.
"""

import os
import logging
from datetime import datetime
from flask import Flask, jsonify, request
import requests
import json
from flask_cors import CORS
from flask_jwt_extended import JWTManager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('evpulse')

# Initialize JWT
jwt = JWTManager()


def create_app(config_name: str = None) -> Flask:
    """
    Application factory for creating Flask app.
    """
    from dotenv import load_dotenv
    load_dotenv()

    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')

    app = Flask(__name__)

    # Load configuration
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 86400))
    app.config['JWT_TOKEN_LOCATION'] = ['headers']
    app.config['JWT_HEADER_NAME'] = 'Authorization'
    app.config['JWT_HEADER_TYPE'] = 'Bearer'

    # Initialize CORS
    CORS(app, origins=['http://localhost:5173', 'http://localhost:5175', 'http://localhost:3000'], supports_credentials=True)

    # Initialize JWT
    jwt.init_app(app)

    # Initialize database connection
    db_initialized = _initialize_database(app)
    app.config['DATABASE_INITIALIZED'] = db_initialized

    # Register blueprints
    _register_blueprints(app)

    # Register routes
    _register_routes(app)

    return app


def _initialize_database(app: Flask) -> bool:
    """
    Initialize database connection.
    Non-fatal: the app starts even if DB is down (get_db() will retry later).
    """
    logger.info("=" * 50)
    logger.info("Initializing EVPulse Database Connection")
    logger.info("=" * 50)

    try:
        from database import init_db, get_database_config

        config = get_database_config()
        is_valid, errors = config.validate()
        if not is_valid:
            for error in errors:
                logger.error(f"  Config error: {error}")
            return False

        logger.info(f"Config: {config}")

        manager = init_db(config)

        if manager.is_connected:
            db = manager.db
            collections = db.list_collection_names()
            logger.info(f"Database: {config.database_name}")
            logger.info(f"Collections: {collections}")
            _initialize_sample_data(manager)
            app.config['DB_MANAGER'] = manager
            logger.info("Database connection established successfully")
            return True
        else:
            logger.warning("Database not connected — will retry on first request")
            return False

    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        logger.warning("App will start without DB — get_db() will auto-retry on requests")
        return False


def _initialize_sample_data(manager) -> None:
    """
    Initialize database with sample data if collections are empty.
    
    Args:
        manager: Database connection manager
    """
    try:
        db = manager.db
        
        # Check if users exist
        user_count = db.users.count_documents({})
        
        if user_count == 0:
            logger.info("🌱 Database is empty, seeding with sample data...")
            
            # Try to run the seeder script
            try:
                import sys
                import os
                sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'scripts'))
                from seed_db import seed_database
                seed_database()
                logger.info("✅ Sample data seeded successfully!")
            except ImportError:
                logger.warning("⚠️ Seeder script not found, creating basic users...")
                _create_basic_users(db)
            except Exception as e:
                logger.warning(f"⚠️ Seeder failed: {e}, creating basic users...")
                _create_basic_users(db)
        else:
            logger.info(f"✅ Database already contains {user_count} user(s)")
            
    except Exception as e:
        logger.warning(f"⚠️ Sample data initialization failed: {e}")


def _create_basic_users(db) -> None:
    """
    Create basic test users.
    
    Args:
        db: Database instance
    """
    import bcrypt
    from bson import ObjectId
    
    users = [
        {
            '_id': ObjectId(),
            'email': 'admin@evpulse.com',
            'password': bcrypt.hashpw('admin123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
            'name': 'Admin User',
            'role': 'admin',
            'phone': '+1234567890',
            'is_active': True,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        },
        {
            '_id': ObjectId(),
            'email': 'operator@evpulse.com',
            'password': bcrypt.hashpw('operator123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
            'name': 'Station Operator',
            'role': 'operator',
            'phone': '+1234567891',
            'company': 'EV Solutions Inc',
            'is_active': True,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        },
        {
            '_id': ObjectId(),
            'email': 'user@evpulse.com',
            'password': bcrypt.hashpw('user123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
            'name': 'Test User',
            'role': 'user',
            'phone': '+1234567892',
            'vehicle': {'make': 'Tesla', 'model': 'Model 3', 'batteryCapacity': 75},
            'is_active': True,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
    ]
    
    db.users.insert_many(users)
    
    logger.info("✅ Created test users:")
    logger.info("   📧 admin@evpulse.com / admin123")
    logger.info("   📧 operator@evpulse.com / operator123")
    logger.info("   📧 user@evpulse.com / user123")


def _register_blueprints(app: Flask) -> None:
    """
    Register all Flask blueprints.
    
    Args:
        app: Flask application instance
    """
    try:
        from routes.auth import auth_bp
        from routes.stations import stations_bp
        from routes.sessions import sessions_bp
        from routes.bookings import bookings_bp
        from routes.transactions import transactions_bp
        from routes.reviews import reviews_bp
        from routes.notifications import notifications_bp
        from routes.admin import admin_bp
        from routes.operator import operator_bp
        from routes.users import users_bp
        
        app.register_blueprint(auth_bp, url_prefix='/api/auth')
        app.register_blueprint(stations_bp, url_prefix='/api/stations')
        app.register_blueprint(sessions_bp, url_prefix='/api/sessions')
        app.register_blueprint(bookings_bp, url_prefix='/api/bookings')
        app.register_blueprint(transactions_bp, url_prefix='/api/transactions')
        app.register_blueprint(reviews_bp, url_prefix='/api/reviews')
        app.register_blueprint(notifications_bp, url_prefix='/api/notifications')
        app.register_blueprint(admin_bp, url_prefix='/api/admin')
        app.register_blueprint(operator_bp, url_prefix='/api/operator')
        app.register_blueprint(users_bp, url_prefix='/api/users')
        
        logger.info("✅ All blueprints registered successfully")
        
    except ImportError as e:
        logger.error(f"❌ Failed to import blueprints: {e}")
        raise


def _register_routes(app: Flask) -> None:
    """
    Register application routes (health check, etc.).
    
    Args:
        app: Flask application instance
    """
    
    @app.route('/api/health')
    def health_check():
        """Health check endpoint with database status"""
        try:
            from database import get_database_manager
            
            manager = get_database_manager()
            
            if manager.is_connected:
                health = manager.health_check()
                stats = manager.stats
                
                # Get collection counts
                db = manager.db
                collection_stats = {}
                for collection in ['users', 'stations', 'sessions', 'bookings', 'transactions']:
                    try:
                        collection_stats[collection] = db[collection].count_documents({})
                    except:
                        collection_stats[collection] = 0
                
                return jsonify({
                    'status': 'healthy',
                    'message': 'EVPulse API is running',
                    'database': {
                        'status': 'connected',
                        'healthy': health.get('healthy', False),
                        'latency_ms': health.get('latency_ms'),
                        'state': manager.state,
                    },
                    'collections': collection_stats,
                    'stats': {
                        'uptime_seconds': stats.get('uptime_seconds', 0),
                        'queries_executed': stats.get('queries_executed', 0),
                        'reconnections': stats.get('reconnections', 0),
                    },
                    'timestamp': datetime.now().isoformat()
                })
            else:
                return jsonify({
                    'status': 'degraded',
                    'message': 'EVPulse API running but database not connected',
                    'database': {
                        'status': 'disconnected',
                        'state': manager.state,
                    },
                    'timestamp': datetime.now().isoformat()
                }), 503
                
        except Exception as e:
            return jsonify({
                'status': 'error',
                'message': str(e),
                'database': {'status': 'error'},
                'timestamp': datetime.now().isoformat()
            }), 500
    
    @app.route('/api/test')
    def test_endpoint():
        """Simple test endpoint"""
        return jsonify({
            'success': True,
            'message': 'EVPulse API test endpoint',
            'timestamp': datetime.now().isoformat()
        })
    
    @app.route('/api/db/status')
    def db_status():
        """Detailed database status endpoint"""
        try:
            from database import get_database_manager
            
            manager = get_database_manager()
            
            return jsonify({
                'connected': manager.is_connected,
                'state': manager.state,
                'stats': manager.stats,
                'health': manager.health_check() if manager.is_connected else None,
                'timestamp': datetime.now().isoformat()
            })
        except Exception as e:
            return jsonify({
                'connected': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }), 500
    
    @app.route('/api/db/diagnostics')
    def db_diagnostics():
        """Run database diagnostics"""
        try:
            from database import run_diagnostics
            results = run_diagnostics()
            return jsonify(results)
        except Exception as e:
            return jsonify({
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }), 500

    # AI proxy endpoint to keep API keys server-side
    @app.route('/api/ai/optimize', methods=['POST'])
    def ai_optimize():
        """Proxy endpoint that forwards optimization requests to the configured generative API using the server-side API key."""
        try:
            body = request.get_json() or {}

            AI_API_KEY = os.getenv('AI_API_KEY')
            if not AI_API_KEY:
                return jsonify({'success': False, 'error': 'Server AI API key not configured.'}), 500

            # Build a simple prompt from provided params (keep concise)
            vehicleType = body.get('vehicleType', 'Car')
            batteryCapacity = body.get('batteryCapacity', 60)
            currentPercentage = body.get('currentPercentage', 35)
            targetPercentage = body.get('targetPercentage', 80)
            chargerType = body.get('chargerType', 'Fast')
            chargerPower = body.get('chargerPower', 150)
            costPerKwh = body.get('costPerKwh', 8)
            peakHours = body.get('peakHours', '6 PM – 10 PM')

            prompt = f"""You are an advanced AI-powered EV Charging Optimization Engine.

Vehicle Type: {vehicleType}
Battery Capacity (kWh): {batteryCapacity}
Current Battery Level (%): {currentPercentage}
Target Battery Level (%): {targetPercentage}
Charger Type: {chargerType}
Charger Power Output (kW): {chargerPower}
Electricity Cost per kWh (₹): {costPerKwh}
Peak Hours: {peakHours}

Analyze the above and provide a clear, well-formatted charging optimization report. Include:
1. Energy Required (kWh)
2. Estimated Charging Time
3. Estimated Cost (₹)
4. Peak Hour Analysis
5. Optimization Level (Low / Moderate / Highly Optimized)
6. Smart Recommendation for battery health and cost savings

Keep it concise, professional, and easy to read. Use plain text with clear headings. Do NOT use markdown code blocks or JSON format.""" 

            AI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

            payload = {
                'contents': [
                    {
                        'parts': [
                            {
                                'text': prompt
                            }
                        ]
                    }
                ],
                'generationConfig': {
                    'temperature': 0.7,
                    'topK': 40,
                    'topP': 0.95,
                    'maxOutputTokens': 2048,
                }
            }

            resp = requests.post(f"{AI_API_URL}?key={AI_API_KEY}", json=payload, headers={'Content-Type': 'application/json'}, timeout=30)
            if resp.status_code != 200:
                try:
                    err = resp.json()
                except Exception:
                    err = {'status': resp.status_code, 'text': resp.text}
                return jsonify({'success': False, 'error': f'AI service error: {err}'}), 502

            data = resp.json()
            textContent = None
            try:
                textContent = data.get('candidates', [])[0].get('content', {}).get('parts', [])[0].get('text')
            except Exception:
                textContent = None

            if not textContent:
                return jsonify({'success': False, 'error': 'No content returned from AI service.'}), 502

            # Return raw text directly — no JSON parsing needed
            return jsonify({'success': True, 'data': {'text': textContent}})

        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500


# Mock data flag (set to False to use real database)
USE_MOCK_DATA = False


if __name__ == '__main__':
    app = create_app()

    print("\n" + "=" * 50)
    print("Starting EVPulse API Server")
    print("=" * 50)
    print("Server: http://localhost:5000")
    print("Health: http://localhost:5000/api/health")
    print("DB Status: http://localhost:5000/api/db/status")
    print("=" * 50 + "\n")

    app.run(debug=True, port=5000, host='0.0.0.0', use_reloader=False)
