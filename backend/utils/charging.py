from __future__ import annotations

import os


MIN_BATTERY_CAPACITY_KWH = 25
MAX_BATTERY_CAPACITY_KWH = 100
MIN_REALISTIC_ENERGY_KWH = 0
MIN_WALLET_BALANCE_INR = float(os.getenv('MIN_WALLET_BALANCE_INR', 100))
MIN_DURATION_MINUTES = 15
MAX_DURATION_MINUTES = 240


def _to_float(value, default):
    try:
        if value is None:
            return float(default)
        return float(value)
    except (TypeError, ValueError):
        return float(default)


def _clamp(value, minimum, maximum):
    return max(minimum, min(maximum, value))


def calculate_charging_projection(
    battery_capacity_kwh=60,
    current_percentage=20,
    target_percentage=80,
    duration_minutes=60,
    rate_per_kwh=8,
    charger_power_kw=22,
    progress_percentage=100,
):
    battery_capacity = _clamp(
        round(_to_float(battery_capacity_kwh, 60), 1),
        MIN_BATTERY_CAPACITY_KWH,
        MAX_BATTERY_CAPACITY_KWH,
    )
    current = _clamp(_to_float(current_percentage, 20), 0.0, 100.0)
    target = _clamp(_to_float(target_percentage, 80), current, 100.0)
    duration = int(round(_clamp(_to_float(duration_minutes, 60), MIN_DURATION_MINUTES, MAX_DURATION_MINUTES)))
    rate = max(0.1, round(_to_float(rate_per_kwh, 8), 2))
    charger_power = _clamp(_to_float(charger_power_kw, 22), 3.0, 350.0)
    progress = _clamp(_to_float(progress_percentage, 100), 0.0, 100.0)

    requested_energy = battery_capacity * max(0.0, target - current) / 100.0
    duration_limited_energy = charger_power * (duration / 60.0) * 0.9
    projected_energy = min(requested_energy if requested_energy > 0 else duration_limited_energy, duration_limited_energy)
    projected_energy = max(MIN_REALISTIC_ENERGY_KWH, projected_energy)

    projected_total_cost = projected_energy * rate

    delivered_ratio = progress / 100.0
    delivered_energy = projected_energy * delivered_ratio
    delivered_cost = delivered_energy * rate

    return {
        'batteryCapacityKwh': round(battery_capacity, 1),
        'currentPercentage': round(current, 1),
        'targetPercentage': round(target, 1),
        'durationMinutes': duration,
        'ratePerKwh': round(rate, 2),
        'chargerPowerKw': round(charger_power, 1),
        'targetEnergyKwh': round(projected_energy, 1),
        'estimatedTotalCost': round(projected_total_cost, 2),
        'deliveredEnergyKwh': round(delivered_energy, 1),
        'deliveredCost': round(delivered_cost, 2),
        'progressPercentage': round(progress, 1),
    }
