export const calculateEnergySavings = (kwhSaved: number, state: string = 'Gujarat') => {
    const rates: Record<string, { tariff: number; currency: string; unit: string }> = {
        'Gujarat': { tariff: 7.00, currency: 'INR', unit: 'per kWh' },
        'Maharashtra': { tariff: 8.50, currency: 'INR', unit: 'per kWh' },
        'Karnataka': { tariff: 8.15, currency: 'INR', unit: 'per kWh' },
        // Default fallback
        'default': { tariff: 7.00, currency: 'INR', unit: 'per kWh' }
    };

    const rate = rates[state] || rates.default;

    return {
        amount: (kwhSaved * rate.tariff).toFixed(2),
        currency: rate.currency,
        note: 'Estimate based on state averages; actual savings may vary'
    };
};
