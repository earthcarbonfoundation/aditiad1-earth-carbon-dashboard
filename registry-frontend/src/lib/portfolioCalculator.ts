import { Action } from "@/types/action";
import { ACTION_PILLAR_MAP } from "./constants";

export interface PillarMetrics {
    tCO2e: number;
    atmanirbharAvg: number;
    actions: Action[];
}

export interface PortfolioMetrics {
    totalTCO2e: number;
    totalAtmanirbharPercent: number;
    energy: PillarMetrics;
    water: PillarMetrics;
    waste: PillarMetrics;
    other: PillarMetrics;
}

/**
 * Calculates holistic portfolio metrics across 3 main pillars (Energy, Water, Waste)
 * based on the verified actions in a user's portfolio.
 */
export function calculatePortfolioMetrics(actions: Action[]): PortfolioMetrics {
    // Only aggregate actions that have been verified by an admin
    const verifiedActions = actions.filter(a => a.status === "verified");

    const getPillarActions = (pillar: "energy" | "water" | "waste" | "other") =>
        verifiedActions.filter(a => ACTION_PILLAR_MAP[a.actionType] === pillar);

    const energyActions = getPillarActions("energy");
    const waterActions = getPillarActions("water");
    const wasteActions = getPillarActions("waste");
    const otherActions = getPillarActions("other");

    const calculatePillarAvg = (pillarActions: Action[]) => {
        if (pillarActions.length === 0) return 0;
        const total = pillarActions.reduce((sum, action) => sum + (action.atmanirbharPercent || 0), 0);
        return Math.round((total / pillarActions.length) * 10) / 10;
    };

    const calculatePillarCO2e = (pillarActions: Action[]) => {
        const totalKg = pillarActions.reduce((sum, action) => sum + (action.co2eKg || 0), 0);
        return Math.round((totalKg / 1000) * 1000) / 1000; // Convert kg to tonnes, round 3 decimals
    };

    const energy: PillarMetrics = {
        actions: energyActions,
        tCO2e: calculatePillarCO2e(energyActions),
        atmanirbharAvg: calculatePillarAvg(energyActions)
    };

    const water: PillarMetrics = {
        actions: waterActions,
        tCO2e: calculatePillarCO2e(waterActions),
        atmanirbharAvg: calculatePillarAvg(waterActions)
    };

    const waste: PillarMetrics = {
        actions: wasteActions,
        tCO2e: calculatePillarCO2e(wasteActions),
        atmanirbharAvg: calculatePillarAvg(wasteActions)
    };

    const other: PillarMetrics = {
        actions: otherActions,
        tCO2e: calculatePillarCO2e(otherActions),
        atmanirbharAvg: calculatePillarAvg(otherActions)
    };

    // Client Requirement: Total Atmanirbhar % should represent the actual self-reliance.
    // To prevent the score from being divided by 3 when a user lacks actions in a pillar,
    // we only average across active pillars.
    let activePillars = 0;
    if (energy.actions.length > 0) activePillars++;
    if (water.actions.length > 0) activePillars++;
    if (waste.actions.length > 0) activePillars++;

    const divisor = activePillars > 0 ? activePillars : 1;
    const sumPillarAverages = energy.atmanirbharAvg + water.atmanirbharAvg + waste.atmanirbharAvg;
    const totalAtmanirbharPercent = Math.round((sumPillarAverages / divisor) * 10) / 10;

    // Client Requirement: Total tCO2e = Energy + Water + Waste (plus any 'other' actions like trees to avoid losing impact)
    const totalTCO2eRaw = energy.tCO2e + water.tCO2e + waste.tCO2e + other.tCO2e;
    const totalTCO2e = Math.round(totalTCO2eRaw * 1000) / 1000;

    return {
        totalTCO2e,
        totalAtmanirbharPercent,
        energy,
        water,
        waste,
        other
    };
}
