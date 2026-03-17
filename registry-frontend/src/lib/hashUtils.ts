import crypto from "crypto";

export function generateSHA256Hash(canonicalString: string): string {
    return crypto.createHash("sha256").update(canonicalString).digest("hex");
}

export function buildCanonicalString(fields: {
    registryId: string;
    actionType: string;
    quantity: number;
    unit: string;
    address: string;
    userId: string;
    createdAt: string;
}): string {
    return [
        fields.registryId,
        fields.actionType,
        String(fields.quantity),
        fields.unit,
        fields.address,
        fields.userId,
        fields.createdAt,
    ].join("|");
}

export function generateActionHash(fields: {
    registryId: string;
    actionType: string;
    quantity: number;
    unit: string;
    address: string;
    userId: string;
    createdAt: string;
}): string {
    const canonical = buildCanonicalString(fields);
    return generateSHA256Hash(canonical);
}
