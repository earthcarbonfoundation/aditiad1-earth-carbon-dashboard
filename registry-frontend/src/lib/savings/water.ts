export const calculateWaterSavings = (litersSaved: number, state: string = 'Gujarat') => {
    const rates: Record<string, { tariff: number; currency: string; unit: string }> = {
        'Gujarat': { tariff: 0.03, currency: 'INR', unit: 'per liter' }, // ₹0.03/L avg municipal cost
        'Maharashtra': { tariff: 0.04, currency: 'INR', unit: 'per liter' },
        'Karnataka': { tariff: 0.035, currency: 'INR', unit: 'per liter' },
        // Default fallback
        'default': { tariff: 0.03, currency: 'INR', unit: 'per liter' }
    };

    const rate = rates[state] || rates.default;

    return {
        amount: (litersSaved * rate.tariff).toFixed(2),
        currency: rate.currency,
        note: 'Based on avg. municipal water tariff; industrial rates vary'
    };
};
