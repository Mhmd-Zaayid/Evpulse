/**
 * AI-Based Services for Smart EV Charging Management System
 * 
 * These are rule-based intelligent systems that provide smart recommendations
 * for EV charging users, operators, and administrators.
 */

// Vehicle types and their average battery capacities (kWh)
const vehicleCapacities = {
  'Tesla Model 3': 75,
  'Tesla Model Y': 75,
  'Tesla Model S': 100,
  'Tesla Model X': 100,
  'Nissan Leaf': 62,
  'Chevrolet Bolt': 66,
  'Ford Mustang Mach-E': 88,
  'Hyundai Ioniq 5': 77,
  'Volkswagen ID.4': 82,
  'BMW iX3': 80,
  'Audi e-tron': 95,
  'Porsche Taycan': 93,
  'default': 60,
};

// Charger power outputs (kW)
const chargerPower = {
  'Fast DC': 150,
  'Ultra Fast DC': 350,
  'Normal AC': 22,
  'Slow AC': 7.4,
};

/**
 * Smart Charger Recommendation (AI-Based)
 * Recommends Fast or Normal charging based on battery level and time availability
 * 
 * Rules:
 * - If battery < 30% → Fast charging recommended
 * - If battery < 50% and time available < 2 hours → Fast charging
 * - If time available >= 3 hours → Normal charging (cost-effective)
 * - Default: Based on urgency level
 */
export const getSmartChargerRecommendation = (currentBatteryPercent, timeAvailableMinutes = 60, urgency = 'normal') => {
  let recommendation = {
    type: 'Normal AC',
    reason: '',
    confidence: 0,
    estimatedTime: 0,
    costEfficiency: 'high',
  };

  // Critical battery level - always recommend fast charging
  if (currentBatteryPercent < 20) {
    recommendation = {
      type: 'Fast DC',
      reason: 'Battery level is critically low. Fast charging recommended for safety.',
      confidence: 95,
      costEfficiency: 'medium',
      priority: 'high',
    };
  }
  // Low battery level
  else if (currentBatteryPercent < 30) {
    recommendation = {
      type: 'Fast DC',
      reason: 'Battery level is low. Fast charging will get you back on the road quickly.',
      confidence: 90,
      costEfficiency: 'medium',
      priority: 'high',
    };
  }
  // Medium battery with limited time
  else if (currentBatteryPercent < 50 && timeAvailableMinutes < 120) {
    recommendation = {
      type: 'Fast DC',
      reason: 'Limited time available with medium battery. Fast charging is optimal.',
      confidence: 85,
      costEfficiency: 'medium',
      priority: 'medium',
    };
  }
  // Plenty of time available
  else if (timeAvailableMinutes >= 180) {
    recommendation = {
      type: 'Normal AC',
      reason: 'You have plenty of time. Normal charging is more cost-effective and better for battery health.',
      confidence: 88,
      costEfficiency: 'high',
      priority: 'low',
    };
  }
  // Good battery level with moderate time
  else if (currentBatteryPercent >= 50) {
    recommendation = {
      type: 'Normal AC',
      reason: 'Battery level is adequate. Normal charging recommended for cost savings.',
      confidence: 82,
      costEfficiency: 'high',
      priority: 'low',
    };
  }
  // Default moderate urgency
  else {
    recommendation = {
      type: urgency === 'high' ? 'Fast DC' : 'Normal AC',
      reason: urgency === 'high' 
        ? 'Based on your urgency preference, fast charging is recommended.'
        : 'Normal charging is recommended for balanced cost and time.',
      confidence: 75,
      costEfficiency: urgency === 'high' ? 'medium' : 'high',
      priority: urgency,
    };
  }

  return recommendation;
};

/**
 * Dynamic Slot Duration Estimation (AI-Based)
 * Estimates ideal charging slot duration based on multiple factors
 * 
 * Inputs:
 * - Vehicle type (battery capacity)
 * - Current battery percentage
 * - Target battery percentage
 * - Charger type/power
 */
export const estimateSlotDuration = (
  vehicleType = 'default',
  currentBatteryPercent = 20,
  targetBatteryPercent = 80,
  chargerType = 'Normal AC'
) => {
  // Get vehicle battery capacity
  const batteryCapacity = vehicleCapacities[vehicleType] || vehicleCapacities.default;
  
  // Calculate energy needed (kWh)
  const energyNeeded = (batteryCapacity * (targetBatteryPercent - currentBatteryPercent)) / 100;
  
  // Get charger power
  const power = chargerPower[chargerType] || 22;
  
  // Calculate base charging time (hours)
  let chargingTimeHours = energyNeeded / power;
  
  // Apply efficiency factor (85% average efficiency)
  chargingTimeHours = chargingTimeHours / 0.85;
  
  // Convert to minutes
  const chargingTimeMinutes = Math.ceil(chargingTimeHours * 60);
  
  // Add buffer time (10% for setup and unplugging)
  const totalMinutes = Math.ceil(chargingTimeMinutes * 1.1);
  
  // Round to nearest 15 minutes for slot booking
  const recommendedSlotMinutes = Math.ceil(totalMinutes / 15) * 15;
  
  return {
    estimatedChargingTime: chargingTimeMinutes,
    recommendedSlotDuration: recommendedSlotMinutes,
    energyRequired: Math.round(energyNeeded * 10) / 10,
    batteryCapacity,
    chargerPower: power,
    breakdown: {
      baseTime: Math.round((energyNeeded / power) * 60),
      efficiencyAdjustment: Math.round(((energyNeeded / power) * 60) * 0.15),
      bufferTime: Math.round(chargingTimeMinutes * 0.1),
    },
    confidence: chargerType.includes('DC') ? 92 : 88,
  };
};

/**
 * AI-Based Waiting Time Estimation
 * Predicts waiting time before charging starts based on station queue and patterns
 * 
 * Factors:
 * - Current queue length
 * - Average session duration
 * - Time of day patterns
 * - Day of week patterns
 */
export const estimateWaitingTime = (
  stationId,
  currentQueueLength = 0,
  busyPorts = 0,
  totalPorts = 4,
  currentHour = new Date().getHours()
) => {
  // Base waiting time per person in queue (minutes)
  const baseWaitPerPerson = 25;
  
  // Peak hour multipliers (higher during peak times)
  const peakHourMultipliers = {
    6: 1.0, 7: 1.2, 8: 1.4, 9: 1.3, 10: 1.1,
    11: 1.0, 12: 1.2, 13: 1.3, 14: 1.1, 15: 1.0,
    16: 1.2, 17: 1.5, 18: 1.8, 19: 1.7, 20: 1.4,
    21: 1.2, 22: 1.0, 23: 0.8,
    0: 0.6, 1: 0.5, 2: 0.5, 3: 0.5, 4: 0.6, 5: 0.8,
  };
  
  // Get hour multiplier
  const hourMultiplier = peakHourMultipliers[currentHour] || 1.0;
  
  // Calculate port availability factor
  const availablePorts = totalPorts - busyPorts;
  const portFactor = availablePorts > 0 ? 1 / availablePorts : 2;
  
  // Calculate estimated wait time
  let estimatedMinutes = 0;
  
  if (availablePorts > 0 && currentQueueLength === 0) {
    // Port available, no queue
    estimatedMinutes = 0;
  } else if (availablePorts > 0) {
    // Ports available but some queue
    estimatedMinutes = Math.ceil(currentQueueLength * baseWaitPerPerson * portFactor * hourMultiplier / totalPorts);
  } else {
    // All ports busy
    estimatedMinutes = Math.ceil((currentQueueLength + 1) * baseWaitPerPerson * hourMultiplier);
  }
  
  // Determine status
  let status = 'low';
  let statusText = 'No wait expected';
  
  if (estimatedMinutes > 30) {
    status = 'high';
    statusText = 'High demand expected';
  } else if (estimatedMinutes > 15) {
    status = 'medium';
    statusText = 'Moderate wait expected';
  } else if (estimatedMinutes > 0) {
    status = 'low';
    statusText = 'Short wait expected';
  }
  
  // Calculate confidence based on data quality
  const confidence = availablePorts > 0 ? 85 : 75;
  
  return {
    estimatedWaitMinutes: estimatedMinutes,
    status,
    statusText,
    peakHourFactor: hourMultiplier,
    availablePorts,
    confidence,
    recommendation: estimatedMinutes > 20 
      ? 'Consider booking a slot in advance or trying a nearby station.'
      : 'Good time to charge! Low waiting time expected.',
  };
};

/**
 * Smart Cost Estimation
 * Calculates charging cost with peak/off-peak consideration
 */
export const estimateChargingCost = (
  energyKwh,
  basePricePerKwh,
  peakPricePerKwh,
  currentHour = new Date().getHours(),
  chargingDurationMinutes = 60,
  peakStartHour = 18,
  peakEndHour = 21
) => {
  // Check if current time is in peak hours
  const isCurrentlyPeak = currentHour >= peakStartHour && currentHour < peakEndHour;
  
  // Calculate how much of charging time falls in peak hours
  let peakMinutes = 0;
  let offPeakMinutes = chargingDurationMinutes;
  
  if (isCurrentlyPeak) {
    const minutesUntilOffPeak = (peakEndHour - currentHour) * 60;
    peakMinutes = Math.min(chargingDurationMinutes, minutesUntilOffPeak);
    offPeakMinutes = chargingDurationMinutes - peakMinutes;
  } else {
    const minutesUntilPeak = currentHour < peakStartHour 
      ? (peakStartHour - currentHour) * 60 
      : (24 - currentHour + peakStartHour) * 60;
    
    if (minutesUntilPeak < chargingDurationMinutes) {
      offPeakMinutes = minutesUntilPeak;
      peakMinutes = Math.min(chargingDurationMinutes - minutesUntilPeak, (peakEndHour - peakStartHour) * 60);
    }
  }
  
  // Calculate energy portions
  const peakEnergy = energyKwh * (peakMinutes / chargingDurationMinutes);
  const offPeakEnergy = energyKwh * (offPeakMinutes / chargingDurationMinutes);
  
  // Calculate costs
  const peakCost = peakEnergy * peakPricePerKwh;
  const offPeakCost = offPeakEnergy * basePricePerKwh;
  const totalCost = peakCost + offPeakCost;
  
  return {
    totalCost: Math.round(totalCost * 100) / 100,
    breakdown: {
      peakCost: Math.round(peakCost * 100) / 100,
      offPeakCost: Math.round(offPeakCost * 100) / 100,
      peakEnergy: Math.round(peakEnergy * 10) / 10,
      offPeakEnergy: Math.round(offPeakEnergy * 10) / 10,
    },
    isPeakTime: isCurrentlyPeak,
    savingTip: isCurrentlyPeak 
      ? `You could save ${formatCurrency((peakEnergy * (peakPricePerKwh - basePricePerKwh)).toFixed(2))} by charging during off-peak hours.`
      : 'Great timing! You\'re charging during off-peak hours.',
  };
};

// Use shared formatter from utils for consistent currency symbol
import { formatCurrency } from '../utils';

/**
 * Get AI-powered insights for a charging session
 */
export const getChargingInsights = (
  vehicleType,
  currentBattery,
  targetBattery,
  stationData
) => {
  const recommendation = getSmartChargerRecommendation(currentBattery);
  const duration = estimateSlotDuration(vehicleType, currentBattery, targetBattery, recommendation.type);
  const waitTime = estimateWaitingTime(
    stationData?.id,
    stationData?.queueLength || 0,
    stationData?.busyPorts || 0,
    stationData?.totalPorts || 4
  );
  
  return {
    recommendation,
    duration,
    waitTime,
    overallConfidence: Math.round((recommendation.confidence + duration.confidence + waitTime.confidence) / 3),
  };
};

export default {
  getSmartChargerRecommendation,
  estimateSlotDuration,
  estimateWaitingTime,
  estimateChargingCost,
  getChargingInsights,
};
