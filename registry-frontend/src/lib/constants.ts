export const ACTION_TYPES = [
  // From client's emission factors table
  { value: "solar_rooftop", label: "Solar Rooftop", unit: "kW" },
  { value: "refrigerator_upgrade", label: "Refrigerator Upgrade (2→5 Star)", unit: "units" },
  { value: "geyser_temp_reduction", label: "Geyser Temperature Reduction (60→40°C)", unit: "units" },
  { value: "led_replacement", label: "LED vs ICL Bulb (100W→5W)", unit: "bulbs" },
  { value: "rwh", label: "Rainwater Harvesting", unit: "kL" },
  { value: "biogas", label: "Biogas Plant (2m³)", unit: "plants" },
  { value: "composting", label: "Composting", unit: "kg waste" },
  { value: "plastic_recycling", label: "Plastic Recycling", unit: "kg" },

  // Legacy types (kept for backward compatibility)
  { value: "swh", label: "Solar Water Heater", unit: "liters" },
  { value: "waterless_urinal", label: "Waterless Urinal", unit: "units" },
  { value: "wastewater_recycling", label: "Wastewater Recycling", unit: "kL/day" },
  { value: "tree_plantation", label: "Tree Plantation", unit: "trees" },
];

export const ACTION_LABELS: Record<string, string> = ACTION_TYPES.reduce(
  (acc, type) => {
    acc[type.value] = type.label;
    return acc;
  },
  {} as Record<string, string>
);

export const ACTION_UNITS: Record<string, string> = ACTION_TYPES.reduce(
  (acc, type) => {
    acc[type.value] = type.unit;
    return acc;
  },
  {} as Record<string, string>
);

export const ACTOR_TYPES = [
  { value: "individual", label: "Individual" },
  { value: "organization", label: "Organization" },
  { value: "government", label: "Government" },
  { value: "ngo", label: "NGO" },
] as const;

export const ACTION_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
] as const;

export const PIPELINE_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "pipeline", label: "In Pipeline" },
] as const;

export const ACTION_PILLAR_MAP: Record<string, "energy" | "water" | "waste" | "other"> = {
  // Energy
  solar_rooftop: "energy",
  refrigerator_upgrade: "energy",
  geyser_temp_reduction: "energy",
  led_replacement: "energy",
  swh: "energy",

  // Water
  rwh: "water",
  waterless_urinal: "water",
  wastewater_recycling: "water",

  // Waste
  biogas: "waste",
  composting: "waste",
  plastic_recycling: "waste",

  // Other
  tree_plantation: "other",
};

export const PAYMENT_AMOUNT_PAISE = 100;
export const PAYMENT_AMOUNT_DISPLAY = "₹1";

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://climateassetregistry.org";
