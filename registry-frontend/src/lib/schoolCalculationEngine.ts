import { SCHOOL_EMISSION_FACTORS, SCHOOL_FALLBACK_CONSTANTS, SCHOOL_CALCULATION_VERSION } from "./constants/schoolConstants";

export interface SchoolImpactInput {
    electricity_kWh_year: number | null;
    fuel_type: "Diesel" | "Petrol" | "LPG" | "Natural Gas" | "None";
    fuel_consumption_litres: number | null;
    renewable_energy_type: "Solar" | "Wind" | "Biogas" | "Small Hydro" | "None";
    renewable_energy_kwh: number | null;
    attribution_pct_energy: number;
    students_count: number;
    
    waste_generated_kg: number | null;
    waste_diverted_kg: number | null;
    water_consumption_m3: number | null;
    attribution_pct_waste: number;
    attribution_pct_water: number;
}

export interface SchoolImpactResult {
    tco2e_annual: number;
    atmanirbhar_pct: number;
    circularity_pct: number;
    carbon_intensity: number;
    
    energyCo2eKg: number;
    fuelCo2eKg: number;
    waterCo2eKg: number;
    wasteCo2eKg: number;
    
    calculationVersion: string;
}

export function calculateSchoolImpact(input: SchoolImpactInput): SchoolImpactResult {
    const {
        electricity_kWh_year,
        fuel_type,
        fuel_consumption_litres,
        renewable_energy_type,
        renewable_energy_kwh,
        attribution_pct_energy,
        students_count,
        waste_generated_kg,
        waste_diverted_kg,
        water_consumption_m3,
        attribution_pct_waste,
        attribution_pct_water
    } = input;

    if (students_count <= 0) {
        throw new Error("Students count must be at least 1 for calculations.");
    }

    // Energy Calculation
    const eKwh = electricity_kWh_year ?? (SCHOOL_FALLBACK_CONSTANTS.ELECTRICITY_KWH_PER_STUDENT * students_count);
    const rKwh = renewable_energy_type !== "None" ? (renewable_energy_kwh ?? 0) : 0;
    const netElectricity = Math.max(0, eKwh - rKwh);
    
    const fuelFactor = {
        Diesel: SCHOOL_EMISSION_FACTORS.DIESEL,
        Petrol: SCHOOL_EMISSION_FACTORS.PETROL,
        LPG: SCHOOL_EMISSION_FACTORS.LPG,
        "Natural Gas": SCHOOL_EMISSION_FACTORS.NATURAL_GAS,
        None: 0
    }[fuel_type] || 0;
    
    const fLitres = fuel_consumption_litres ?? 0;
    
    const energyCo2eKg = netElectricity * SCHOOL_EMISSION_FACTORS.ELECTRICITY * (attribution_pct_energy / 100);
    const fuelCo2eKg = fLitres * fuelFactor * (attribution_pct_energy / 100);

    // Water Calculation
    const wM3 = water_consumption_m3 ?? (SCHOOL_FALLBACK_CONSTANTS.WATER_M3_PER_STUDENT_PER_YEAR * students_count);
    const waterCo2eKg = wM3 * SCHOOL_EMISSION_FACTORS.WATER_SUPPLY * (attribution_pct_water / 100);

    // Waste Calculation
    const wsGenKg = waste_generated_kg ?? (SCHOOL_FALLBACK_CONSTANTS.WASTE_KG_PER_STUDENT_PER_YEAR * students_count);
    const wasteCo2eKg = wsGenKg * SCHOOL_EMISSION_FACTORS.WASTE_LANDFILL * (attribution_pct_waste / 100);

    const totalEmissionsKg = Math.max(0, energyCo2eKg + fuelCo2eKg + waterCo2eKg + wasteCo2eKg);
    const tco2e_annual = totalEmissionsKg / 1000;

    // Additional Indices
    const atmanirbhar_pct = eKwh > 0 ? Math.min(100, (rKwh / eKwh) * 100) : 0;
    const circularity_pct = wsGenKg > 0 ? Math.min(100, ((waste_diverted_kg || 0) / wsGenKg) * 100) : 0;
    const carbon_intensity = tco2e_annual / students_count;

    return {
        tco2e_annual: Math.round(tco2e_annual * 100) / 100,
        atmanirbhar_pct: Math.round(atmanirbhar_pct * 10) / 10,
        circularity_pct: Math.round(circularity_pct * 10) / 10,
        carbon_intensity: Math.round(carbon_intensity * 100) / 100,
        energyCo2eKg: Math.round(energyCo2eKg),
        fuelCo2eKg: Math.round(fuelCo2eKg),
        waterCo2eKg: Math.round(waterCo2eKg),
        wasteCo2eKg: Math.round(wasteCo2eKg),
        calculationVersion: SCHOOL_CALCULATION_VERSION
    };
}
