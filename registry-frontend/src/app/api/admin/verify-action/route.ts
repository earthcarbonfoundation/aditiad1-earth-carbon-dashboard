import { NextRequest, NextResponse } from "next/server";

const hasAdminCredentials = !!(
    process.env.FIREBASE_PRIVATE_KEY &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY.includes("BEGIN PRIVATE KEY")
);

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;
const DATABASE_ID = "asia-pacific";

function toFirestoreValue(value: unknown): Record<string, unknown> {
    if (value === null || value === undefined) return { nullValue: null };
    if (typeof value === "string") return { stringValue: value };
    if (typeof value === "number") return { doubleValue: value };
    if (typeof value === "boolean") return { booleanValue: value };
    return { stringValue: String(value) };
}

async function verifyActionAdmin(
    actionId: string,
    data: Record<string, unknown>
): Promise<void> {
    const { adminDb } = await import("@/lib/firebaseAdmin");
    await adminDb.collection("actions").doc(actionId).update(data);
}

async function verifyActionREST(
    actionId: string,
    data: Record<string, unknown>,
    bearerToken: string
): Promise<void> {
    const docPath = `projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents/actions/${actionId}`;

    const fields: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
        fields[key] = toFirestoreValue(value);
    }

    const updateMask = Object.keys(data).map((f) => `updateMask.fieldPaths=${f}`).join("&");

    const res = await fetch(
        `https://firestore.googleapis.com/v1/${docPath}?${updateMask}`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${bearerToken}`,
            },
            body: JSON.stringify({ fields }),
        }
    );

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || "Firestore update failed");
    }
}

export async function POST(request: NextRequest) {
    try {
        const {
            actionId,
            co2eTonnes,
            atmanirbharPercent,
            status,
            adminNotes,
            adminUid,
            adminIdToken,
        } = await request.json();

        if (!actionId || !status || !adminUid) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        if (status !== "verified" && status !== "rejected") {
            return NextResponse.json(
                { error: "Status must be 'verified' or 'rejected'" },
                { status: 400 }
            );
        }

        const updateData: Record<string, unknown> = {
            status,
            adminNotes: adminNotes || null,
            verifiedAt: new Date().toISOString(),
            verifiedBy: adminUid,
            updatedAt: new Date().toISOString(),
        };

        if (status === "verified") {
            if (co2eTonnes == null || atmanirbharPercent == null) {
                return NextResponse.json(
                    { error: "tCO₂e and Atmanirbhar % are required for verification" },
                    { status: 400 }
                );
            }
            updateData.co2eKg = Number(co2eTonnes) * 1000;
            updateData.atmanirbharPercent = Number(atmanirbharPercent);
        }

        if (hasAdminCredentials) {
            await verifyActionAdmin(actionId, updateData);
        } else {
            await verifyActionREST(actionId, updateData, adminIdToken);
        }

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const message =
            error instanceof Error ? error.message : "Verification failed";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
