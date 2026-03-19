interface EligibilityProject {
    ownership: string | null;
    baseline_type: string | null;
    commissioning_date: string;
}

interface EligibilityResult {
    status: "yes" | "no" | "conditional";
    reason: string;
}

export function evaluateEligibility(project: EligibilityProject): EligibilityResult {
    const nowDateTime = new Date().toISOString();
    const nowDate = new Date(nowDateTime.split("T")[0]);

    if (!project.ownership || !project.baseline_type) {
        return {
            status: "conditional",
            reason: "Missing required fields",
        };
    }

    if (new Date(project.commissioning_date) < nowDate) {
        return {
            status: "no",
            reason: "Commission date to be in the past",
        };
    }

    return {
        status: "yes",
        reason: "Project is eligible for carbon credits",
    };
}
