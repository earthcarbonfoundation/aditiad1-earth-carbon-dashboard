import { Timestamp } from "firebase/firestore";

export type SchoolStatus = "pledged" | "verified" | "rejected";

export interface School {
    id: string;
    registryId: string;
    schoolName: string;
    name_normalized: string;
    address: string;
    city: string;
    pincode: string;
    place_id: string;
    contactPerson: string;
    phone: string;
    email: string;
    projectId: string;
    status: SchoolStatus;
    consent_verification: boolean;
    consent_public: boolean;
    consent_research: boolean;
    attribution_percentage: number;
    
    // Step 2: Energy
    electricity_kWh_year: number | null;
    fuel_type: "Diesel" | "Petrol" | "LPG" | "Natural Gas" | "None";
    fuel_consumption_litres: number | null;
    renewable_energy_type: "Solar" | "Wind" | "Biogas" | "Small Hydro" | "None";
    renewable_energy_kwh: number | null;
    attribution_pct_energy: number;
    students_count: number;
    reporting_year: string;
    action_id: string;

    // Step 3: Waste & Water
    waste_generated_kg: number | null;
    waste_diverted_kg: number | null;
    recycling_programs: string[]; // Paper, Plastic, Organic, E-waste, None
    water_consumption_m3: number | null;
    attribution_pct_waste: number;
    attribution_pct_water: number;
    calculation_notes: string | null;
    baseline_source: "school_shared" | "sectoral_average" | "estimated" | null;

    // Calculated Impacts (stored in schoolBaselines)
    tco2e_annual: number;
    atmanirbhar_pct: number;
    circularity_pct: number;
    carbon_intensity: number;
    
    energyCo2eKg: number | null;
    fuelCo2eKg: number | null;
    waterCo2eKg: number | null;
    wasteCo2eKg: number | null;

    sha256Hash: string;
    razorpayOrderId: string | null;
    razorpayPaymentId: string | null;
    payment_status: "pending" | "verified";
    userId: string;
    createdAt: string;
    updatedAt: string | null;
    verifiedAt: string | null;
    verifiedBy: string | null;
    adminNotes: string | null;
    lat: number | null;
    lng: number | null;
}

export interface SchoolFormData {
    schoolName: string;
    name_normalized?: string;
    address: string;
    city: string;
    pincode: string;
    place_id: string;
    contactPerson: string;
    phone: string;
    email: string;
    projectId: string;
    
    // Step 2
    electricity_kWh_year: string | number;
    fuel_type: string;
    fuel_consumption_litres: string | number;
    renewable_energy_type: string;
    renewable_energy_kwh: string | number;
    attribution_pct_energy: number;
    students_count: string | number;
    reporting_year: string;
    action_id: string;

    // Step 3
    waste_generated_kg: string | number;
    waste_diverted_kg: string | number;
    recycling_programs: string[];
    water_consumption_m3: string | number;
    attribution_pct_waste: number;
    attribution_pct_water: number;
    calculation_notes: string;
    baseline_source: "school_shared" | "sectoral_average" | "estimated";

    // Step 4
    has_existing_actions: "Yes" | "No";
    action_type?: string;
    installation_date?: string;
    capacity_description?: string;
    photo_file?: File | null;
    planned_action_type?: string;
    target_date?: string;
    
    consent_confirmed: boolean;
    lat: number | null;
    lng: number | null;
}

