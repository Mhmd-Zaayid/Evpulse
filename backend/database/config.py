"""
EVPulse Database Configuration Module
=====================================
Clean MongoDB configuration from environment variables.
Key design decisions:
- certifi CA bundle is ALWAYS used (fixes Atlas TLS issues)
- URI params like retryWrites/w are NOT duplicated in client options
- No exotic compressors that might not be installed
"""

import os
import re
import certifi
from dataclasses import dataclass
from typing import Optional, Dict, Any, Tuple, List


@dataclass
class MongoDBConfig:
    """
    MongoDB configuration. All values loaded from environment.
    """
    # Connection URI - REQUIRED
    uri: str = ""

    # Database name
    database_name: str = "evpulse"

    # Connection Pool Settings
    min_pool_size: int = 2
    max_pool_size: int = 20
    max_idle_time_ms: int = 30000

    # Timeout Settings (milliseconds)
    server_selection_timeout_ms: int = 30000
    connect_timeout_ms: int = 20000
    socket_timeout_ms: int = 30000

    # Heartbeat
    heartbeat_frequency_ms: int = 10000

    # Application Name
    app_name: str = "EVPulse"

    @classmethod
    def from_environment(cls) -> 'MongoDBConfig':
        """Create configuration from environment variables."""
        try:
            from dotenv import load_dotenv
            load_dotenv()
        except ImportError:
            pass

        return cls(
            uri=os.getenv('MONGODB_URI', ''),
            database_name=os.getenv('MONGODB_DATABASE', 'evpulse'),
            min_pool_size=int(os.getenv('MONGODB_MIN_POOL_SIZE', '2')),
            max_pool_size=int(os.getenv('MONGODB_MAX_POOL_SIZE', '20')),
            max_idle_time_ms=int(os.getenv('MONGODB_MAX_IDLE_TIME_MS', '30000')),
            server_selection_timeout_ms=int(os.getenv('MONGODB_SERVER_SELECTION_TIMEOUT_MS', '30000')),
            connect_timeout_ms=int(os.getenv('MONGODB_CONNECT_TIMEOUT_MS', '20000')),
            socket_timeout_ms=int(os.getenv('MONGODB_SOCKET_TIMEOUT_MS', '30000')),
            heartbeat_frequency_ms=int(os.getenv('MONGODB_HEARTBEAT_FREQUENCY_MS', '10000')),
            app_name=os.getenv('MONGODB_APP_NAME', 'EVPulse'),
        )

    def get_connection_options(self) -> Dict[str, Any]:
        """
        Build PyMongo MongoClient keyword arguments.
        
        IMPORTANT: We do NOT set retryWrites, w, or other params that are
        already in the connection URI string. Setting them both causes
        PyMongo to throw ConfigurationError or use unexpected values.
        
        We ALWAYS set tlsCAFile=certifi.where() — this is the #1 fix for
        MongoDB Atlas connection drops on Windows/macOS where the system
        CA store doesn't have the Let's Encrypt / ISRG root certs.
        """
        options: Dict[str, Any] = {
            # Pool
            'minPoolSize': self.min_pool_size,
            'maxPoolSize': self.max_pool_size,
            'maxIdleTimeMS': self.max_idle_time_ms,

            # Timeouts
            'serverSelectionTimeoutMS': self.server_selection_timeout_ms,
            'connectTimeoutMS': self.connect_timeout_ms,
            'socketTimeoutMS': self.socket_timeout_ms,

            # Heartbeat
            'heartbeatFrequencyMS': self.heartbeat_frequency_ms,

            # App identity (shows up in Atlas monitoring)
            'appName': self.app_name,

            # TLS — always use certifi's CA bundle.
            # This is the single most important line for Atlas reliability.
            'tlsCAFile': certifi.where(),
        }

        return options

    def validate(self) -> Tuple[bool, List[str]]:
        """Validate configuration. Returns (is_valid, errors)."""
        errors = []

        if not self.uri:
            errors.append("MONGODB_URI environment variable is not set")
        elif not (self.uri.startswith('mongodb://') or self.uri.startswith('mongodb+srv://')):
            errors.append("MONGODB_URI must start with 'mongodb://' or 'mongodb+srv://'")

        if self.min_pool_size < 0:
            errors.append("min_pool_size must be >= 0")

        if self.max_pool_size < self.min_pool_size:
            errors.append("max_pool_size must be >= min_pool_size")

        if self.server_selection_timeout_ms < 1000:
            errors.append("server_selection_timeout_ms should be at least 1000ms")

        return (len(errors) == 0, errors)

    def __repr__(self) -> str:
        masked_uri = self._mask_uri(self.uri)
        return f"MongoDBConfig(uri='{masked_uri}', database='{self.database_name}')"

    @staticmethod
    def _mask_uri(uri: str) -> str:
        if not uri:
            return "<not set>"
        return re.sub(r'(mongodb(?:\+srv)?://[^:]+:)([^@]+)(@.*)', r'\1****\3', uri)


# ======================================================================
# Global config singleton
# ======================================================================

_config: Optional[MongoDBConfig] = None


def get_database_config() -> MongoDBConfig:
    """Get the global database configuration (created from env on first call)."""
    global _config
    if _config is None:
        _config = MongoDBConfig.from_environment()
    return _config


def set_database_config(config: MongoDBConfig) -> None:
    """Override the global database configuration."""
    global _config
    _config = config


# Backward compatibility
class Environment:
    DEVELOPMENT = "development"
    TESTING = "testing"
    PRODUCTION = "production"
