from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import get_db
from models.transaction import Transaction
from bson import ObjectId
from datetime import datetime

transactions_bp = Blueprint('transactions', __name__)

@transactions_bp.route('/user/<user_id>', methods=['GET'])
@jwt_required()
def get_user_transactions(user_id):
    """Get all transactions for a user"""
    try:
        db = get_db()
        if db is None:
            return jsonify({'success': False, 'error': 'Database connection unavailable. Please try again later.'}), 503
        
        transactions_data = list(db.transactions.find({'user_id': user_id}).sort('timestamp', -1))
        transactions = [Transaction.from_dict(data).to_response_dict() for data in transactions_data]
        
        return jsonify({'success': True, 'data': transactions})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@transactions_bp.route('/process', methods=['POST'])
@jwt_required()
def process_payment():
    """Process a payment"""
    try:
        db = get_db()
        if db is None:
            return jsonify({'success': False, 'error': 'Database connection unavailable. Please try again later.'}), 503
        
        user_id = get_jwt_identity()
        data = request.get_json()
        
        transaction = Transaction(
            user_id=user_id,
            amount=data['amount'],
            transaction_type=data.get('type', 'charging'),
            payment_method=data.get('paymentMethod', 'Card'),
            description=data.get('description', 'Payment'),
            session_id=data.get('sessionId'),
            card_last4=data.get('cardLast4')
        )
        
        result = db.transactions.insert_one(transaction.to_dict())
        transaction.id = str(result.inserted_id)
        
        return jsonify({'success': True, 'data': transaction.to_response_dict()}), 201
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@transactions_bp.route('/wallet/balance/<user_id>', methods=['GET'])
@jwt_required()
def get_wallet_balance(user_id):
    """Get wallet balance for a user"""
    try:
        db = get_db()
        if db is None:
            return jsonify({'success': False, 'error': 'Database connection unavailable. Please try again later.'}), 503
        
        # Calculate balance from transactions
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
        
        balance = round(total_topup - total_spent, 2)
        
        return jsonify({'success': True, 'data': {'balance': max(0, balance)}})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@transactions_bp.route('/wallet/topup', methods=['POST'])
@jwt_required()
def topup_wallet():
    """Top up wallet balance"""
    try:
        db = get_db()
        if db is None:
            return jsonify({'success': False, 'error': 'Database connection unavailable. Please try again later.'}), 503
        
        user_id = get_jwt_identity()
        data = request.get_json()
        
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
@jwt_required()
def get_transaction_summary(user_id):
    """Get transaction summary for a user"""
    try:
        db = get_db()
        if db is None:
            return jsonify({'success': False, 'error': 'Database connection unavailable. Please try again later.'}), 503
        
        transactions = list(db.transactions.find({'user_id': user_id}))
        
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
