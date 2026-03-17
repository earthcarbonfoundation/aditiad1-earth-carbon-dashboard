interface ActionInput {
    actionType: string;
    quantity: number;
    baselineEnergyKwh?: number;
    baselineWaterM3?: number;
    baselineWasteKg?: number;
    commissioningYear?: number;
}

export function calculateCo2eEnhanced(input: ActionInput): number | null {
    const { actionType, quantity, baselineEnergyKwh, baselineWaterM3, baselineWasteKg } = input;

    const currentYear = new Date().getFullYear();
    const years = input.commissioningYear
        ? Math.max(1, currentYear - input.commissioningYear + 1)
        : 1;

    let co2eKg = 0;

    switch (actionType) {
        case "solar_rooftop": {
            const generationPerYear = quantity * 1500;
            const actualSavings = baselineEnergyKwh && baselineEnergyKwh > 0
                ? Math.min(generationPerYear, baselineEnergyKwh)
                : generationPerYear;
            co2eKg = actualSavings * 0.82 * years;
            break;
        }
        case "swh":
            co2eKg = (quantity / 100) * 1500 * 0.82 * years;
            break;
        case "rwh": {
            const waterSavings = baselineWaterM3 && baselineWaterM3 > 0
                ? Math.min(quantity, baselineWaterM3)
                : quantity;
            co2eKg = waterSavings * 0.5 * 0.82 * years;
            break;
        }
        case "biogas": {
            const wasteProcessed = baselineWasteKg && baselineWasteKg > 0
                ? Math.min(quantity, baselineWasteKg)
                : quantity;
            co2eKg = wasteProcessed * 0.1 * 1.3 * years;
            break;
        }
        case "waterless_urinal":
            co2eKg = quantity * 150 * 0.5 * 0.82 * years;
            break;
        case "wastewater_recycling":
            co2eKg = quantity * 365 * 0.8 * 0.82 * years;
            break;
        case "led_replacement":
            co2eKg = quantity * 0.04 * 10 * 365 * 0.82 * years;
            break;
        case "tree_plantation":
            co2eKg = quantity * 22 * years;
            break;
        default:
            return null;
    }

    return Math.round(co2eKg * 1000) / 1000;
}

export function calculateCo2e(
    actionType: string,
    quantity: number,
    years: number = 1
): number | null {
    return calculateCo2eEnhanced({
        actionType,
        quantity,
        commissioningYear: new Date().getFullYear() - years + 1,
    });
}
