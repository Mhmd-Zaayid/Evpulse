"""
One-time data repair utility for EVPulse charging costs.

What it fixes:
1) Completed sessions with missing/zero/over-limit cost fields
2) Charging transactions with zero/missing/incorrect amount
3) Missing charging transaction records for completed sessions

Usage:
  python scripts/repair_charging_amounts.py
  python scripts/repair_charging_amounts.py --dry-run
"""

import argparse
import math
import os
import sys
from datetime import datetime, timezone

# Add backend root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from database import get_db
from models.transaction import Transaction
from utils.charging import calculate_charging_projection


def to_float(value, default=0.0):
    try:
        if value is None:
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def to_int(value, default=0):
    try:
        if value is None:
            return default
        return int(value)
    except (TypeError, ValueError):
        return default


def derive_duration_minutes(session):
    duration = to_int(session.get('duration'), 0)
    if duration > 0:
        return duration

    start_time = session.get('start_time')
    end_time = session.get('end_time')
    if isinstance(start_time, datetime) and isinstance(end_time, datetime):
        seconds = max(0.0, (end_time - start_time).total_seconds())
        return max(1, math.ceil(seconds / 60.0))

    return 1


def find_port(station, session):
    port_id = str(session.get('port_id'))
    for port in (station or {}).get('ports', []):
        if str(port.get('id')) == port_id:
            return port
    return None


def compute_billing(session, station):
    duration_minutes = derive_duration_minutes(session)

    port = find_port(station, session)
    price_per_kwh = to_float((port or {}).get('price'), 8.0)
    charger_power_kw = max(3.0, to_float((port or {}).get('power'), 22.0))
    progress = to_float(session.get('progress'), 100.0)

    projection = calculate_charging_projection(
        battery_capacity_kwh=session.get('battery_capacity_kwh') or 60,
        current_percentage=session.get('battery_start') or 20,
        target_percentage=session.get('battery_end') or 80,
        duration_minutes=session.get('planned_duration_minutes') or duration_minutes,
        rate_per_kwh=price_per_kwh,
        charger_power_kw=charger_power_kw,
        progress_percentage=progress,
    )

    energy_delivered = projection['deliveredEnergyKwh']
    total_cost = projection['deliveredCost']

    return {
        'duration': duration_minutes,
        'energy_delivered': energy_delivered,
        'cost': total_cost,
        'total_cost': total_cost,
    }


def needs_session_repair(session):
    cost = to_float(session.get('cost'), 0.0)
    total_cost = to_float(session.get('total_cost'), 0.0)
    return (
        session.get('status') == 'completed'
        and (
            cost <= 0
            or total_cost <= 0
            or to_float(session.get('energy_delivered'), 0.0) <= 0
            or to_int(session.get('duration'), 0) <= 0
        )
    )


def main(dry_run=False):
    app = create_app()

    with app.app_context():
        db = get_db()
        if db is None:
            print('❌ Database unavailable. Aborting repair.')
            return 1

        completed_sessions = list(db.sessions.find({'status': 'completed'}))

        repaired_sessions = 0
        repaired_transactions = 0
        created_transactions = 0

        for session in completed_sessions:
            session_id = session['_id']
            station = db.stations.find_one({'_id': session.get('station_id')})
            billing = compute_billing(session, station)

            session_update = {}
            if needs_session_repair(session):
                session_update = {
                    'duration': billing['duration'],
                    'energy_delivered': billing['energy_delivered'],
                    'cost': billing['cost'],
                    'total_cost': billing['total_cost'],
                    'updated_at': datetime.now(timezone.utc),
                }

                if not dry_run:
                    db.sessions.update_one({'_id': session_id}, {'$set': session_update})
                repaired_sessions += 1

            target_amount = billing['cost']
            session_transactions = list(
                db.transactions.find({'type': 'charging', 'session_id': session_id})
            )

            if not session_transactions:
                transaction = Transaction(
                    user_id=session.get('user_id'),
                    amount=target_amount,
                    transaction_type='charging',
                    payment_method=session.get('payment_method', 'Wallet'),
                    description='Charging session at station',
                    session_id=session_id,
                )
                transaction.created_at = datetime.now(timezone.utc)
                transaction.timestamp = datetime.now(timezone.utc)

                if not dry_run:
                    db.transactions.insert_one(transaction.to_dict())
                created_transactions += 1
            else:
                for txn in session_transactions:
                    amount = to_float(txn.get('amount'), 0.0)
                    if abs(amount - target_amount) > 0.009:
                        if not dry_run:
                            db.transactions.update_one(
                                {'_id': txn['_id']},
                                {'$set': {
                                    'amount': target_amount,
                                    'status': txn.get('status', 'completed') or 'completed',
                                    'updated_at': datetime.now(timezone.utc),
                                }}
                            )
                        repaired_transactions += 1

        mode = 'DRY RUN' if dry_run else 'APPLIED'
        print(f'✅ Repair complete ({mode})')
        print(f'   Sessions repaired: {repaired_sessions}')
        print(f'   Transactions repaired: {repaired_transactions}')
        print(f'   Transactions created: {created_transactions}')

    return 0


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Repair charging session and transaction amounts.')
    parser.add_argument('--dry-run', action='store_true', help='Show what would change without writing.')
    args = parser.parse_args()
    raise SystemExit(main(dry_run=args.dry_run))
