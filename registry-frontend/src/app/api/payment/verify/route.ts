import { NextRequest, NextResponse } from "next/server";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { generateActionHash } from "@/lib/hashUtils";
import { calculateImpactPhase2 } from "@/lib/calculationEngine";

const DATABASE_ID = "asia-pacific";

function getProjectId() {
    return process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;
}

function getBaseUrl() {
    return `https://firestore.googleapis.com/v1/projects/${getProjectId()}/databases/${DATABASE_ID}/documents`;
}

function checkAdminCredentials() {
    return !!(process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL);
}

async function incrementCounterAdmin(): Promise<number> {
    const { adminDb } = await import("@/lib/firebaseAdmin");
    const counterRef = adminDb.collection("meta").doc("registryCounter");
    return adminDb.runTransaction(async (tx) => {
        const snap = await tx.get(counterRef);
        const current = snap.exists ? (snap.data()?.count ?? 0) : 0;
        const next = current + 1;
        tx.set(counterRef, { count: next }, { merge: true });
        return next;
    });
}

async function createActionDocAdmin(data: Record<string, unknown>): Promise<string> {
    const { adminDb } = await import("@/lib/firebaseAdmin");
    const docRef = await adminDb.collection("actions").add(data);
    return docRef.id;
}

function toFirestoreValue(value: unknown): Record<string, unknown> {
    if (value === null || value === undefined) return { nullValue: null };
    if (typeof value === "string") return { stringValue: value };
    if (typeof value === "number") return { doubleValue: value };
    if (typeof value === "boolean") return { booleanValue: value };
    if (Array.isArray(value)) {
        return { arrayValue: { values: value.map(toFirestoreValue) } };
    }
    return { stringValue: String(value) };
}

function toFirestoreDoc(data: Record<string, unknown>) {
    const fields: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
        fields[key] = toFirestoreValue(value);
    }
    return { fields };
}

async function incrementCounterREST(bearerToken: string): Promise<number> {
    const PROJECT_ID = getProjectId();
    const commitUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents:commit`;
    const docPath = `projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents/meta/registryCounter`;

    const commitRes = await fetch(commitUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${bearerToken}`,
        },
        body: JSON.stringify({
            writes: [
                {
                    transform: {
                        document: docPath,
                        fieldTransforms: [
                            {
                                fieldPath: "count",
                                increment: { integerValue: "1" },
                            },
                        ],
                    },
                },
            ],
        }),
    });

    if (!commitRes.ok) {
        const err = await commitRes.json();
        throw new Error(err.error?.message || "Counter increment failed");
    }

    const commitData = await commitRes.json();
    const newValue =
        commitData.writeResults?.[0]?.transformResults?.[0]?.integerValue;
    if (newValue == null) {
        throw new Error("Counter increment returned no value");
    }
    return Number(newValue);
}

async function createActionDocREST(data: Record<string, unknown>, bearerToken: string): Promise<string> {
    const res = await fetch(`${getBaseUrl()}/actions`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${bearerToken}`,
        },
        body: JSON.stringify(toFirestoreDoc(data)),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || "Firestore write failed");
    }
    const result = await res.json();
    const nameParts = result.name?.split("/") || [];
    return nameParts[nameParts.length - 1];
}

async function incrementCounter(bearerToken?: string): Promise<number> {
    if (checkAdminCredentials()) {
        return incrementCounterAdmin();
    }
    return incrementCounterREST(bearerToken!);
}

async function createActionDoc(data: Record<string, unknown>, bearerToken?: string): Promise<string> {
    if (checkAdminCredentials()) {
        return createActionDocAdmin(data);
    }
    return createActionDocREST(data, bearerToken!);
}

export async function POST(request: NextRequest) {
    // Read all env vars at runtime — server-only vars are NOT available at build time
    // on Firebase App Hosting, so module-level reads would be empty strings.
    const isSimulation = process.env.RAZORPAY_SIMULATION_MODE === "true";
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";
    const hasSecret = !!process.env.RAZORPAY_KEY_SECRET;
    const hasAdminCredentials = checkAdminCredentials();
    console.log("[verify] Starting. isSimulation:", isSimulation, "keyId:", keyId, "hasSecret:", hasSecret, "hasAdminCreds:", hasAdminCredentials);

    try {
        if (!isSimulation && !hasSecret) {
            console.error("[verify] Config guard blocked: missing RAZORPAY_KEY_SECRET");
            return NextResponse.json(
                { error: "Payment configuration error: RAZORPAY_KEY_SECRET is missing" },
                { status: 500 }
            );
        }

        const body = await request.json();
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            userIdToken,
            formData,
        } = body;

        console.log("[verify] Body received. orderId:", razorpay_order_id, "paymentId:", razorpay_payment_id, "hasSignature:", !!razorpay_signature, "hasToken:", !!userIdToken);

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            console.error("[verify] Missing payment details");
            return NextResponse.json(
                { error: "Missing payment details" },
                { status: 400 }
            );
        }

        if (!isSimulation) {
            const isValid = verifyRazorpaySignature(
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature
            );
            console.log("[verify] Signature valid:", isValid);
            if (!isValid) {
                return NextResponse.json(
                    { error: "Invalid payment signature" },
                    { status: 400 }
                );
            }
        }

        console.log("[verify] Incrementing counter...");
        const counterNext = await incrementCounter(userIdToken);
        console.log("[verify] Counter incremented to:", counterNext);
        const registryId = `ECF-${String(counterNext).padStart(4, "0")}`;
        const now = new Date().toISOString();
        const impact = calculateImpactPhase2({
            actionType: formData.actionType,
            quantity: Number(formData.quantity),
            unit: formData.unit,
            localPercent: formData.localPercent ? Number(formData.localPercent) : undefined,
            indigenousPercent: formData.indigenousPercent ? Number(formData.indigenousPercent) : undefined,
            communityPercent: formData.communityPercent ? Number(formData.communityPercent) : undefined,
            jobsCreated: formData.jobsCreated ? Number(formData.jobsCreated) : undefined,
        });

        const co2eKg = impact.tCO2e * 1000;
        const atmanirbharPercent = impact.atmanirbharScore;

        const sha256Hash = generateActionHash({
            registryId,
            actionType: formData.actionType,
            quantity: Number(formData.quantity),
            unit: formData.unit,
            address: formData.address,
            userId: formData.userId,
            createdAt: now,
        });

        const actionData: Record<string, unknown> = {
            registryId,
            institutionId: formData.institutionId || null,
            actionType: formData.actionType,
            quantity: Number(formData.quantity),
            unit: formData.unit,
            address: formData.address,
            lat: formData.lat || null,
            lng: formData.lng || null,
            userId: formData.userId,
            userEmail: formData.userEmail,
            actorType: formData.actorType,
            actorName: formData.actorName,
            contactPerson: formData.contactPerson,
            phone: formData.phone,
            email: formData.email,
            status: "pending",
            co2eKg,
            atmanirbharPercent,
            sha256Hash,
            meterPhotos: (formData.meterPhotos || []).filter(Boolean),
            sitePhoto: formData.sitePhoto || null,
            commissioningDate: formData.commissioningDate || null,
            localPercent: Number(formData.localPercent) || null,
            indigenousPercent: Number(formData.indigenousPercent) || null,
            communityPercent: Number(formData.communityPercent) || null,
            jobsCreated: Number(formData.jobsCreated) || null,
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            calculationVersion: impact.calculationVersion,
            calculationMethodology: impact.methodology,
            emissionFactorUsed: impact.emissionFactorUsed || null,
            createdAt: now,
        };

        console.log("[verify] Creating action doc...");
        const actionId = await createActionDoc(actionData, userIdToken);
        console.log("[verify] Action doc created:", actionId, "registryId:", registryId);

        return NextResponse.json({
            registryId,
            actionId,
            co2eKg,
            atmanirbharPercent,
            sha256Hash,
        });
    } catch (error: unknown) {
        const message =
            error instanceof Error ? error.message : "Payment verification failed";
        console.error("[verify] CAUGHT ERROR:", message, error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
