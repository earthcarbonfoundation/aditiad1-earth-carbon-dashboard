/**
 * Calculation Engine - Phase 2 Production Version
 * 
 * Uses client-approved emission factors from Earth Carbon Foundation.
 * Structured for easy Phase 3 upgrade without UI changes.
 * 
 * © 2024 Earth Carbon Foundation. Proprietary calculation methodologies.
 */

import { EMISSION_FACTORS_PHASE2 } from './constants/emissionFactors';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface CalculationInput {
    actionType: string;
    quantity: number;
    unit: string;

    // Optional baseline data
    baselineEnergyKwh?: number;
    baselineWaterM3?: number;
    baselineWasteKg?: number;

    // Optional atmanirbhar data
    localPercent?: number;
    indigenousPercent?: number;
    communityPercent?: number;
    jobsCreated?: number;

    // Optional action-specific parameters
    oldStarRating?: number;  // For refrigerator upgrade
    newStarRating?: number;
    oldTempC?: number;        // For geyser temp reduction
    newTempC?: number;
    oldWattage?: number;      // For LED replacement
    newWattage?: number;
    hoursPerDay?: number;
}

export interface CalculationResult {
    tCO2e: number;
    atmanirbharScore: number;
    calculationVersion: string;
    methodology: string;
    emissionFactorUsed?: string;
}

// ============================================
// MAIN CALCULATION FUNCTION
// ============================================

/**
 * Calculate environmental impact using Phase 2 methodology
 */
export function calculateImpactPhase2(input: CalculationInput): CalculationResult {
    const co2eKg = calculateCO2ePhase2(input);
    const atmanirbharScore = calculateAtmanirbharPhase2(input);

    return {
        tCO2e: co2eKg / 1000, // Convert kg to tonnes
        atmanirbharScore,
        calculationVersion: 'v1.0-phase2',
        methodology: 'ECF Simplified Factors',
        emissionFactorUsed: getEmissionFactorDescription(input.actionType),
    };
}

// ============================================
// CO2e CALCULATION (Using Client's Factors)
// ============================================

function calculateCO2ePhase2(input: CalculationInput): number {
    const { actionType, quantity, baselineEnergyKwh, baselineWaterM3, baselineWasteKg } = input;

    let co2eKg = 0;

    switch (actionType) {
        case 'solar_rooftop': {
            // Use client's exact factor: 1.23 tCO2e/yr per kW
            const annualTonnes = quantity * EMISSION_FACTORS_PHASE2.SOLAR_ROOFTOP.factor;
            co2eKg = annualTonnes * 1000; // Convert to kg

            // If baseline energy provided, cap at actual consumption
            if (baselineEnergyKwh && baselineEnergyKwh > 0) {
                const annualGeneration = quantity * EMISSION_FACTORS_PHASE2.SOLAR_ROOFTOP.annualGeneration;
                const actualSavings = Math.min(annualGeneration, baselineEnergyKwh);
                co2eKg = actualSavings * EMISSION_FACTORS_PHASE2.GRID_ELECTRICITY.factor;
            }
            break;
        }

        case 'refrigerator_upgrade': {
            // Use client's factor: 100 kg/yr for 2→5 star upgrade
            co2eKg = EMISSION_FACTORS_PHASE2.REFRIGERATOR_UPGRADE.factor * quantity;
            break;
        }

        case 'geyser_temp_reduction': {
            // Use client's factor: 172 kg/yr for 60→40°C
            co2eKg = EMISSION_FACTORS_PHASE2.GEYSER_TEMP_REDUCTION.factor * quantity;
            break;
        }

        case 'led_replacement': {
            // Use client's factor: 57 kg/yr per bulb (100W→5W, 2hrs/day)
            co2eKg = EMISSION_FACTORS_PHASE2.LED_VS_ICL.factor * quantity;
            break;
        }

        case 'rwh': {
            // Rainwater harvesting - use mid-point of range
            const avgFactor = (EMISSION_FACTORS_PHASE2.RAINWATER_HARVESTING.factorMin +
                EMISSION_FACTORS_PHASE2.RAINWATER_HARVESTING.factorMax) / 2;
            co2eKg = quantity * avgFactor;

            if (baselineWaterM3 && baselineWaterM3 > 0) {
                const actualSavings = Math.min(quantity, baselineWaterM3);
                co2eKg = actualSavings * avgFactor;
            }
            break;
        }

        case 'biogas': {
            // Use client's factor: 1.2 tCO2e/yr per plant
            co2eKg = quantity * EMISSION_FACTORS_PHASE2.BIOGAS_PLANT.factor * 1000;
            break;
        }

        case 'composting': {
            // Use client's factor: 0.45 kg per kg waste
            co2eKg = quantity * EMISSION_FACTORS_PHASE2.COMPOSTING.factor;

            if (baselineWasteKg && baselineWasteKg > 0) {
                const actualWaste = Math.min(quantity, baselineWasteKg);
                co2eKg = actualWaste * EMISSION_FACTORS_PHASE2.COMPOSTING.factor;
            }
            break;
        }

        case 'plastic_recycling': {
            // Use client's factor: 1.5 kg per kg plastic
            co2eKg = quantity * EMISSION_FACTORS_PHASE2.PLASTIC_RECYCLING.factor;
            break;
        }

        // Legacy action types (keep for backward compatibility)
        case 'swh': {
            // Solar water heater: 100L saves ~1500 kWh/year
            const energySavings = (quantity / 100) * 1500;
            co2eKg = energySavings * EMISSION_FACTORS_PHASE2.GRID_ELECTRICITY.factor;
            break;
        }

        case 'waterless_urinal': {
            // Each urinal saves ~150 kL per year
            const waterSavings = quantity * 150;
            co2eKg = waterSavings * EMISSION_FACTORS_PHASE2.BOREWELL_WATER.factor;
            break;
        }

        case 'wastewater_recycling': {
            // quantity = kL/day capacity
            const annualWaterKL = quantity * 365;
            co2eKg = annualWaterKL * EMISSION_FACTORS_PHASE2.MUNICIPAL_WATER.factor;
            break;
        }

        case 'tree_plantation': {
            // Trees - use approximate 22 kg/tree/year (not in client's table)
            co2eKg = quantity * 22;
            break;
        }

        default: {
            // Unknown action type - return 0 (admin will enter manually)
            co2eKg = 0;
        }
    }

    // Round to 3 decimal places
    return Math.round(co2eKg * 1000) / 1000;
}

// ============================================
// ATMANIRBHAR CALCULATION
// ============================================

function calculateAtmanirbharPhase2(input: CalculationInput): number {
    const {
        localPercent = 0,
        indigenousPercent = 0,
        communityPercent = 0,
        jobsCreated = 0,
    } = input;

    // If no data provided, return 0
    if (localPercent === 0 && indigenousPercent === 0 &&
        communityPercent === 0 && jobsCreated === 0) {
        return 0;
    }

    // Client-approved weights
    const WEIGHTS = {
        local: 0.4,        // 40%
        indigenous: 0.3,   // 30%
        community: 0.2,    // 20%
        jobs: 0.1,         // 10%
    };

    // Calculate jobs score (capped at 100)
    const jobsScore = Math.min(jobsCreated * 10, 100);

    // Weighted average
    const score =
        localPercent * WEIGHTS.local +
        indigenousPercent * WEIGHTS.indigenous +
        communityPercent * WEIGHTS.community +
        jobsScore * WEIGHTS.jobs;

    // Round to 1 decimal place
    return Math.round(score * 10) / 10;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getEmissionFactorDescription(actionType: string): string {
    const descriptions: Record<string, string> = {
        solar_rooftop: '1.23 tCO2e/yr per kW (1500 kWh × 0.82 kg)',
        refrigerator_upgrade: '100 kg/yr (2→5 Star, BEE data)',
        geyser_temp_reduction: '172 kg/yr (60→40°C)',
        led_replacement: '57 kg/yr (100W→5W, 2hrs/day)',
        rwh: '0.67-1.69 kg/kL (displaced source)',
        biogas: '1.2 tCO2e/yr per plant (methane avoidance)',
        composting: '0.45 kg per kg waste (landfill methane)',
        plastic_recycling: '1.5 kg per kg (virgin production)',
    };

    return descriptions[actionType] || 'Standard emission factor';
}

/**
 * Validate calculation input
 */
export function validateCalculationInput(input: CalculationInput): {
    valid: boolean;
    errors: string[]
} {
    const errors: string[] = [];

    if (!input.actionType) {
        errors.push('Action type is required');
    }

    if (!input.quantity || input.quantity <= 0) {
        errors.push('Quantity must be greater than 0');
    }

    if (!input.unit) {
        errors.push('Unit is required');
    }

    // Validate percentage fields if provided
    const percentFields = [
        { value: input.localPercent, name: 'Local sourcing %' },
        { value: input.indigenousPercent, name: 'Indigenous tech %' },
        { value: input.communityPercent, name: 'Community ownership %' },
    ];

    percentFields.forEach(field => {
        if (field.value !== undefined && (field.value < 0 || field.value > 100)) {
            errors.push(`${field.name} must be between 0 and 100`);
        }
    });

    if (input.jobsCreated !== undefined && input.jobsCreated < 0) {
        errors.push('Jobs created must be 0 or greater');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Get all available action types with their units
 */
export function getAvailableActionTypes(): Array<{ value: string; label: string; unit: string }> {
    return [
        { value: 'solar_rooftop', label: 'Solar Rooftop', unit: 'kW' },
        { value: 'refrigerator_upgrade', label: 'Refrigerator Upgrade (2→5 Star)', unit: 'units' },
        { value: 'geyser_temp_reduction', label: 'Geyser Temperature Reduction (60→40°C)', unit: 'units' },
        { value: 'led_replacement', label: 'LED vs ICL Bulb (100W→5W)', unit: 'bulbs' },
        { value: 'rwh', label: 'Rainwater Harvesting', unit: 'kL' },
        { value: 'biogas', label: 'Biogas Plant (2m³)', unit: 'plants' },
        { value: 'composting', label: 'Composting', unit: 'kg waste' },
        { value: 'plastic_recycling', label: 'Plastic Recycling', unit: 'kg' },
        { value: 'swh', label: 'Solar Water Heater', unit: 'liters' },
        { value: 'waterless_urinal', label: 'Waterless Urinal', unit: 'units' },
        { value: 'wastewater_recycling', label: 'Wastewater Recycling', unit: 'kL/day' },
        { value: 'tree_plantation', label: 'Tree Plantation', unit: 'trees' },
    ];
}
