export const calculateWasteSavings = (kgDiverted: number, wasteType: string = 'organic', state: string = 'Gujarat') => {
    // Simplified: landfill cost avoidance + compost value
    const baseAvoidedCost = 2.5; // ₹/kg landfill tipping fee avoidance
    const compostValue = wasteType === 'organic' ? 1.2 : 0; // ₹/kg if composted

    // We can use the state variable in the future to map specific local landfill charges
    // const stateAvoidedCosts = { 'Gujarat': 2.5, ... }

    return {
        amount: (kgDiverted * (baseAvoidedCost + compostValue)).toFixed(2),
        currency: 'INR',
        breakdown: {
            avoided_landfill_cost: (kgDiverted * baseAvoidedCost).toFixed(2),
            compost_value: (kgDiverted * compostValue).toFixed(2)
        },
        note: 'Conservative estimate; actual savings depend on local waste management contracts'
    };
};
