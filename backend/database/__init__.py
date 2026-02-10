"""
EVPulse Database Package
========================
MongoDB connection module.

Usage:
    from database import get_db
    
    db = get_db()
    if db is None:
        # handle no connection
        pass
    else:
        users = db.users.find({})
"""

from .config import (
    MongoDBConfig,
    get_database_config,
    set_database_config,
    Environment,
)

from .connection import (
    DatabaseConnectionManager,
    get_database_manager,
    get_db,
    get_collection,
    init_db,
    close_db,
    with_db_retry,
    ConnectionState,
)

from .diagnostics import (
    DatabaseDiagnostics,
    DiagnosticResult,
    run_diagnostics,
    quick_test,
)

__all__ = [
    # Config
    'MongoDBConfig',
    'get_database_config',
    'set_database_config',
    'Environment',

    # Connection (primary API)
    'DatabaseConnectionManager',
    'get_database_manager',
    'get_db',
    'get_collection',
    'init_db',
    'close_db',
    'with_db_retry',
    'ConnectionState',

    # Diagnostics
    'DatabaseDiagnostics',
    'DiagnosticResult',
    'run_diagnostics',
    'quick_test',
]

__version__ = '3.0.0'
