export interface AtmanirbharInputs {
    localPercent: number;
    indigenousPercent: number;
    communityPercent: number;
    jobsCreated: number;
}

const WEIGHTS = {
    local: 0.4,
    indigenous: 0.3,
    community: 0.2,
    jobs: 0.1,
} as const;

export function calculateAtmanirbhar(inputs: AtmanirbharInputs): number {
    const score =
        inputs.localPercent * WEIGHTS.local +
        inputs.indigenousPercent * WEIGHTS.indigenous +
        inputs.communityPercent * WEIGHTS.community +
        Math.min(inputs.jobsCreated, 100) * WEIGHTS.jobs;

    return Math.round(score * 100) / 100;
}
