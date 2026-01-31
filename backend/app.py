import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_pymongo import PyMongo
from flask_jwt_extended import JWTManager
from config import config

# Initialize extensions
mongo = PyMongo()
jwt = JWTManager()

def create_app(config_name=None):
    """Application factory"""
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')
    
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    CORS(app, origins=['http://localhost:5173', 'http://localhost:3000'], supports_credentials=True)
    
    # Try to initialize MongoDB
    try:
        mongo.init_app(app)
        # Test the connection
        with app.app_context():
            mongo.db.command('ping')
            print("✅ MongoDB connected successfully!")
    except Exception as e:
        print(f"⚠️ MongoDB connection failed: {e}")
        print("Running in mock mode - database operations will use mock data")
    
    jwt.init_app(app)
    
    # Register blueprints
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
    
    # Health check endpoint
    @app.route('/api/health')
    def health_check():
        return {'status': 'healthy', 'message': 'EVPulse API is running'}
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
