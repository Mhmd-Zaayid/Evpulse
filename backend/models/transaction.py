from datetime import datetime
from bson import ObjectId

class Transaction:
    """Transaction model for MongoDB"""
    
    collection_name = 'transactions'
    
    def __init__(self, user_id, amount, transaction_type, payment_method, 
                 description='', session_id=None, card_last4=None):
        self.user_id = user_id
        self.session_id = session_id
        self.amount = amount
        self.type = transaction_type  # 'charging', 'wallet_topup', 'refund'
        self.payment_method = payment_method  # 'Card', 'Wallet', 'UPI'
        self.card_last4 = card_last4
        self.status = 'completed'  # 'pending', 'completed', 'failed'
        self.description = description
        self.timestamp = datetime.utcnow()
        self.created_at = datetime.utcnow()
    
    def to_dict(self):
        """Convert to dictionary for MongoDB insertion"""
        return {
            'user_id': self.user_id,
            'session_id': self.session_id,
            'amount': self.amount,
            'type': self.type,
            'payment_method': self.payment_method,
            'card_last4': self.card_last4,
            'status': self.status,
            'description': self.description,
            'timestamp': self.timestamp,
            'created_at': self.created_at
        }
    
    @staticmethod
    def from_dict(data):
        """Create Transaction instance from dictionary"""
        trans = Transaction.__new__(Transaction)
        trans.id = str(data.get('_id', ''))
        trans.user_id = data.get('user_id')
        trans.session_id = data.get('session_id')
        trans.amount = data.get('amount', 0)
        trans.type = data.get('type')
        trans.payment_method = data.get('payment_method')
        trans.card_last4 = data.get('card_last4')
        trans.status = data.get('status', 'completed')
        trans.description = data.get('description', '')
        trans.timestamp = data.get('timestamp')
        trans.created_at = data.get('created_at')
        return trans
    
    def to_response_dict(self):
        """Convert to API response format"""
        return {
            'id': self.id if hasattr(self, 'id') else None,
            'userId': str(self.user_id) if self.user_id else None,
            'sessionId': str(self.session_id) if self.session_id else None,
            'amount': self.amount,
            'type': self.type,
            'paymentMethod': self.payment_method,
            'cardLast4': self.card_last4,
            'status': self.status,
            'description': self.description,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }
