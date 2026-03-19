// src/lib/constants/emissionFactors.ts

/**
 * AUTHORITATIVE EMISSION FACTORS - Phase 2
 * Source: Earth Carbon Foundation Proprietary Calculation Methodologies
 * © 2024 Earth Carbon Foundation. All rights reserved.
 * 
 * DO NOT MODIFY WITHOUT CLIENT APPROVAL
 */

export const EMISSION_FACTORS_PHASE2 = {
    // Grid Electricity
    GRID_ELECTRICITY: {
        factor: 0.82, // kg CO2e per kWh
        unit: 'kWh',
        source: 'CEA India 2023-24',
    },

    // Borewell Water
    BOREWELL_WATER: {
        factor: 0.67, // kg CO2e per kL
        unit: 'kL',
        source: 'Pumping 150m depth',
    },

    // Municipal Water
    MUNICIPAL_WATER: {
        factor: 1.69, // kg CO2e per kL
        unit: 'kL',
        source: 'Treatment + distribution',
    },

    // Solar Rooftop
    SOLAR_ROOFTOP: {
        factor: 1.23, // tCO2e per year per kW
        unit: 'kW',
        source: '1500 kWh × 0.82 kg',
        annualGeneration: 1500, // kWh per kW per year
    },

    // Refrigerator Upgrade (2→5 Star)
    REFRIGERATOR_UPGRADE: {
        factor: 100, // kg per year
        unit: '2→5 Star',
        source: 'BEE data',
    },

    // Geyser Temperature Reduction (60°C → 40°C)
    GEYSER_TEMP_REDUCTION: {
        factor: 172, // kg per year
        unit: '60→40°C',
        source: 'User data',
    },

    // LED vs ICL Bulb (100W → 5W, 2hrs/day)
    LED_VS_ICL: {
        factor: 57, // kg per year
        unit: '100W→5W',
        source: '2 hrs/day',
    },

    // Rainwater Harvesting
    RAINWATER_HARVESTING: {
        factorMin: 0.67, // kg per kL (if replacing borewell)
        factorMax: 1.69, // kg per kL (if replacing municipal)
        unit: 'kL',
        source: 'Displaced source',
    },

    // Biogas Plant (2m³)
    BIOGAS_PLANT: {
        factor: 1.2, // tCO2e per year
        unit: '1 plant',
        source: 'Methane avoidance',
    },

    // Composting
    COMPOSTING: {
        factor: 0.45, // kg per kg waste
        unit: 'kg waste',
        source: 'Landfill methane',
    },

    // Plastic Recycling
    PLASTIC_RECYCLING: {
        factor: 1.5, // kg per kg plastic
        unit: 'kg',
        source: 'Virgin production',
    },
} as const;
