from flask import Blueprint, request, jsonify, g
from models.transaction import Transaction

from routes.common import role_required, to_object_id, now_utc

transactions_bp = Blueprint('transactions', __name__)

@transactions_bp.route('', methods=['GET'])
@role_required('user', 'operator', 'admin')
def get_transactions():
    """Get transactions filtered by role"""
    try:
        db = g.db
        user = g.current_user

        query = {}
        if user.get('role') == 'user':
            query['user_id'] = user.get('_id')
        elif user.get('role') == 'operator':
            station_ids = [s['_id'] for s in db.stations.find({'operator_id': user.get('_id')}, {'_id': 1})]
            sessions = db.sessions.find({'station_id': {'$in': station_ids}}, {'_id': 1})
            session_ids = [s['_id'] for s in sessions]
            query['session_id'] = {'$in': session_ids}

        transactions_data = list(db.transactions.find(query).sort('timestamp', -1))
        transactions = [Transaction.from_dict(data).to_response_dict() for data in transactions_data]
        
        return jsonify({'success': True, 'data': transactions})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@transactions_bp.route('/user/<user_id>', methods=['GET'])
@role_required('user', 'operator', 'admin')
def get_user_transactions(user_id):
    """Backward-compatible endpoint delegating to role-scoped transaction listing"""
    return get_transactions()

@transactions_bp.route('/process', methods=['POST'])
@role_required('user')
def process_payment():
    """Process a payment"""
    try:
        db = g.db
        user_id = g.current_user_id
        data = request.get_json() or {}

        amount = data.get('amount')
        if amount is None or amount <= 0:
            return jsonify({'success': False, 'error': 'amount must be greater than 0'}), 400

        session_oid = None
        if data.get('sessionId'):
            session_oid = to_object_id(data.get('sessionId'))
            if not session_oid:
                return jsonify({'success': False, 'error': 'Invalid sessionId'}), 400
        
        transaction = Transaction(
            user_id=user_id,
            amount=data['amount'],
            transaction_type=data.get('type', 'charging'),
            payment_method=data.get('paymentMethod', 'Card'),
            description=data.get('description', 'Payment'),
            session_id=session_oid,
            card_last4=data.get('cardLast4')
        )
        transaction.created_at = now_utc()
        transaction.timestamp = now_utc()
        
        result = db.transactions.insert_one(transaction.to_dict())
        transaction.id = str(result.inserted_id)
        
        return jsonify({
            'success': True,
            'message': 'Transaction processed successfully',
            'data': transaction.to_response_dict()
        }), 201
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@transactions_bp.route('/wallet/balance/<user_id>', methods=['GET'])
@role_required('user', 'admin')
def get_wallet_balance(user_id):
    """Get wallet balance for a user"""
    try:
        db = g.db
        current = g.current_user
        target_user_id = to_object_id(user_id)
        if not target_user_id:
            return jsonify({'success': False, 'error': 'Invalid user id'}), 400

        if current.get('role') != 'admin' and current.get('_id') != target_user_id:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        # Calculate balance from transactions
        topups = list(db.transactions.find({
            'user_id': target_user_id,
            'type': 'wallet_topup',
            'status': 'completed'
        }))
        
        wallet_payments = list(db.transactions.find({
            'user_id': target_user_id,
            'payment_method': 'Wallet',
            'type': 'charging',
            'status': 'completed'
        }))
        
        total_topup = sum(t.get('amount', 0) for t in topups)
        total_spent = sum(t.get('amount', 0) for t in wallet_payments)
        
        balance = round(total_topup - total_spent, 2)
        
        return jsonify({'success': True, 'data': {'balance': max(0, balance)}})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@transactions_bp.route('/wallet/topup', methods=['POST'])
@role_required('user')
def topup_wallet():
    """Top up wallet balance"""
    try:
        db = g.db
        user_id = g.current_user_id
        data = request.get_json() or {}
        
        amount = data.get('amount', 0)
        if amount <= 0:
            return jsonify({'success': False, 'error': 'Amount must be positive'}), 400
        
        transaction = Transaction(
            user_id=user_id,
            amount=amount,
            transaction_type='wallet_topup',
            payment_method=data.get('paymentMethod', 'Card'),
            description='Wallet Top-up',
            card_last4=data.get('cardLast4')
        )
        transaction.created_at = now_utc()
        transaction.timestamp = now_utc()
        
        result = db.transactions.insert_one(transaction.to_dict())
        
        # Get new balance
        topups = list(db.transactions.find({
            'user_id': user_id,
            'type': 'wallet_topup',
            'status': 'completed'
        }))
        
        wallet_payments = list(db.transactions.find({
            'user_id': user_id,
            'payment_method': 'Wallet',
            'type': 'charging',
            'status': 'completed'
        }))
        
        total_topup = sum(t.get('amount', 0) for t in topups)
        total_spent = sum(t.get('amount', 0) for t in wallet_payments)
        new_balance = round(total_topup - total_spent, 2)
        
        return jsonify({
            'success': True, 
            'data': {
                'newBalance': new_balance,
                'transactionId': str(result.inserted_id)
            }
        }), 201
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@transactions_bp.route('/summary/<user_id>', methods=['GET'])
@role_required('user', 'admin')
def get_transaction_summary(user_id):
    """Get transaction summary for a user"""
    try:
        db = g.db
        current = g.current_user
        target_user_id = to_object_id(user_id)
        if not target_user_id:
            return jsonify({'success': False, 'error': 'Invalid user id'}), 400

        if current.get('role') != 'admin' and current.get('_id') != target_user_id:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403

        transactions = list(db.transactions.find({'user_id': target_user_id}))
        
        charging_total = sum(t.get('amount', 0) for t in transactions if t.get('type') == 'charging')
        topup_total = sum(t.get('amount', 0) for t in transactions if t.get('type') == 'wallet_topup')
        
        # Group by month
        monthly = {}
        for t in transactions:
            if t.get('type') == 'charging' and t.get('timestamp'):
                month_key = t['timestamp'].strftime('%Y-%m')
                monthly[month_key] = monthly.get(month_key, 0) + t.get('amount', 0)
        
        return jsonify({
            'success': True,
            'data': {
                'totalCharging': round(charging_total, 2),
                'totalTopup': round(topup_total, 2),
                'transactionCount': len(transactions),
                'monthlySpending': monthly
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
