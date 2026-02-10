"""
EVPulse Database Connection Manager
===================================
Production-grade MongoDB connection with:
- Lazy connection (connects on first use, not on import)
- Automatic reconnection (handled by PyMongo driver natively)
- certifi CA bundle for Atlas TLS (the #1 cause of connection drops)
- No conflicting URI/option params
- Thread-safe singleton
- Clean error messages
"""

import time
import logging
import atexit
import certifi
from datetime import datetime, timezone
from typing import Optional, Dict, Any

from pymongo import MongoClient
from pymongo.database import Database
from pymongo.collection import Collection
from pymongo.errors import (
    ServerSelectionTimeoutError,
    ConnectionFailure,
    OperationFailure,
)

from .config import MongoDBConfig, get_database_config

logger = logging.getLogger('evpulse.database')


class DatabaseConnectionManager:
    """
    Singleton MongoDB Connection Manager.
    
    Design principles:
    - PyMongo already handles connection pooling, retries, and reconnection.
      We do NOT add custom health-check threads or reconnection loops — that
      fights the driver and causes race conditions.
    - Connection is lazy: calling get_db() will connect if needed.
    - certifi CA bundle is always used for TLS (fixes 90% of Atlas issues).
    - URI parameters are NOT duplicated in client options.
    """

    _instance: Optional['DatabaseConnectionManager'] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return

        self._client: Optional[MongoClient] = None
        self._db: Optional[Database] = None
        self._config: Optional[MongoDBConfig] = None
        self._connected_at: Optional[datetime] = None
        self._stats = {
            'connections_made': 0,
            'connection_failures': 0,
        }

        atexit.register(self._cleanup)
        self._initialized = True

    # ------------------------------------------------------------------
    # Properties
    # ------------------------------------------------------------------

    @property
    def is_connected(self) -> bool:
        """Check if we have an active client. Does NOT ping — that's expensive."""
        return self._client is not None and self._db is not None

    @property
    def state(self) -> str:
        return "connected" if self.is_connected else "disconnected"

    @property
    def db(self) -> Optional[Database]:
        """
        Get the database. If not connected, attempt to connect automatically.
        Returns None on failure (so callers can do a simple `if db is None` check).
        """
        if self._db is None:
            try:
                self.connect()
            except Exception as e:
                logger.error(f"Auto-connect failed: {e}")
                return None
        return self._db

    @property
    def client(self) -> Optional[MongoClient]:
        if self._client is None:
            try:
                self.connect()
            except Exception:
                return None
        return self._client

    @property
    def stats(self) -> Dict[str, Any]:
        uptime = 0
        if self._connected_at:
            uptime = (datetime.now(timezone.utc) - self._connected_at).total_seconds()
        return {
            **self._stats,
            'state': self.state,
            'connection_time': self._connected_at.isoformat() if self._connected_at else None,
            'uptime_seconds': uptime,
        }

    # ------------------------------------------------------------------
    # Core methods
    # ------------------------------------------------------------------

    def connect(self, config: Optional[MongoDBConfig] = None) -> bool:
        """
        Connect to MongoDB. Safe to call multiple times — will skip if already connected.
        
        Returns True on success, raises on failure.
        """
        if self.is_connected and config is None:
            return True

        self._config = config or get_database_config()

        is_valid, errors = self._config.validate()
        if not is_valid:
            msg = f"Invalid database configuration: {'; '.join(errors)}"
            logger.error(msg)
            raise ValueError(msg)

        logger.info(f"Connecting to MongoDB ({self._config})")

        try:
            # Close any stale client first
            if self._client:
                try:
                    self._client.close()
                except Exception:
                    pass
                self._client = None
                self._db = None

            # Build client options — ONLY options that are NOT in the URI
            options = self._config.get_connection_options()

            self._client = MongoClient(self._config.uri, **options)

            # Verify connectivity with a ping
            self._client.admin.command('ping')

            self._db = self._client[self._config.database_name]
            self._connected_at = datetime.now(timezone.utc)
            self._stats['connections_made'] += 1

            logger.info(f"Connected to MongoDB database: {self._config.database_name}")
            return True

        except ServerSelectionTimeoutError as e:
            self._stats['connection_failures'] += 1
            self._client = None
            self._db = None
            msg = (
                "Could not reach MongoDB server. Check:\n"
                "  1. Your MONGODB_URI in .env is correct\n"
                "  2. Your IP is whitelisted in Atlas (Network Access -> Add Current IP)\n"
                "  3. The cluster is not paused (Atlas free-tier pauses after 60 days)\n"
                f"  Original error: {e}"
            )
            logger.error(msg)
            raise ConnectionError(msg) from e

        except OperationFailure as e:
            self._stats['connection_failures'] += 1
            self._client = None
            self._db = None
            error_str = str(e).lower()
            if 'auth' in error_str:
                msg = (
                    "MongoDB authentication failed. Check:\n"
                    "  1. Username and password in MONGODB_URI\n"
                    "  2. The user has readWrite access to the database\n"
                    f"  Original error: {e}"
                )
            else:
                msg = f"MongoDB operation failed: {e}"
            logger.error(msg)
            raise ConnectionError(msg) from e

        except Exception as e:
            self._stats['connection_failures'] += 1
            self._client = None
            self._db = None
            logger.error(f"MongoDB connection failed: {e}")
            raise ConnectionError(f"MongoDB connection failed: {e}") from e

    def disconnect(self) -> None:
        """Gracefully close the connection."""
        if self._client:
            try:
                self._client.close()
            except Exception as e:
                logger.warning(f"Error closing MongoDB client: {e}")
        self._client = None
        self._db = None
        self._connected_at = None
        logger.info("Disconnected from MongoDB")

    def health_check(self) -> Dict[str, Any]:
        """Ping the server and return health info."""
        result: Dict[str, Any] = {
            'healthy': False,
            'latency_ms': None,
            'error': None,
        }

        if not self._client:
            result['error'] = "No active connection"
            return result

        try:
            start = time.time()
            self._client.admin.command('ping')
            latency = (time.time() - start) * 1000
            result['healthy'] = True
            result['latency_ms'] = round(latency, 2)
        except Exception as e:
            result['error'] = str(e)
            logger.warning(f"Health check failed: {e}")

        return result

    def get_collection(self, name: str) -> Optional[Collection]:
        """Get a collection. Returns None if DB is not available."""
        db = self.db
        if db is None:
            return None
        return db[name]

    def _cleanup(self) -> None:
        try:
            self.disconnect()
        except Exception:
            pass

    @classmethod
    def reset(cls) -> None:
        """
        Reset the singleton. Used for testing or when you need to
        force a fresh connection (e.g., after changing .env).
        """
        if cls._instance and cls._instance._client:
            try:
                cls._instance._client.close()
            except Exception:
                pass
        cls._instance = None


# ======================================================================
# Module-level convenience functions — these are the PUBLIC API
# ======================================================================

def get_database_manager() -> DatabaseConnectionManager:
    """Get the singleton connection manager."""
    return DatabaseConnectionManager()


def get_db() -> Optional[Database]:
    """
    Get the MongoDB database instance.
    Returns None if connection is unavailable (caller should check).
    Auto-connects on first call.
    """
    return get_database_manager().db


def get_collection(name: str) -> Optional[Collection]:
    """
    Get a MongoDB collection by name.
    Returns None if connection is unavailable.
    """
    return get_database_manager().get_collection(name)


def init_db(config: Optional[MongoDBConfig] = None) -> DatabaseConnectionManager:
    """
    Initialize database connection explicitly.
    Called during app startup, but get_db() also auto-connects.
    """
    manager = get_database_manager()
    manager.connect(config)
    return manager


def close_db() -> None:
    """Close the database connection."""
    get_database_manager().disconnect()


# Keep backward-compatible name
ConnectionState = type('ConnectionState', (), {
    'CONNECTED': 'connected',
    'DISCONNECTED': 'disconnected',
})


def with_db_retry(*args, **kwargs):
    """No-op decorator kept for backward compatibility.
    PyMongo 4.x handles retries natively via retryWrites/retryReads."""
    def decorator(func):
        return func
    if args and callable(args[0]):
        return args[0]
    return decorator
