import { NextRequest, NextResponse } from "next/server";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { generateSchoolHash } from "@/lib/hashUtils";
import { calculateSchoolImpact } from "@/lib/schoolCalculationEngine";
import { adminDb, adminStorage } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: NextRequest) {
    const isSimulation = process.env.RAZORPAY_SIMULATION_MODE === "true";
    
    try {
        const formData = await request.formData();
        
        const razorpay_order_id = formData.get("razorpay_order_id") as string;
        const razorpay_payment_id = formData.get("razorpay_payment_id") as string;
        const razorpay_signature = formData.get("razorpay_signature") as string;
        const userId = formData.get("userId") as string;
        const photoFile = formData.get("photo_file") as File | null;

        // Verify Signature
        if (!isSimulation) {
            const isValid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
            if (!isValid) return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
        }

        // Feature 3: Atomic Counter
        const counterRef = adminDb.collection("counters").doc("schoolId");
        const nextValue = await adminDb.runTransaction(async (tx) => {
            const snap = await tx.get(counterRef);
            const current = snap.exists ? (snap.data()?.current_value ?? 0) : 0;
            const next = current + 1;
            tx.set(counterRef, { 
                current_value: next, 
                prefix: "ECF-SCH-", 
                last_updated: FieldValue.serverTimestamp() 
            }, { merge: true });
            return next;
        });

        const registryId = `ECF-SCH-${String(nextValue).padStart(4, "0")}`;
        const now = new Date().toISOString();

        // Calculate Impact
        const impact = calculateSchoolImpact({
            electricity_kWh_year: formData.get("electricity_kWh_year") ? Number(formData.get("electricity_kWh_year")) : null,
            fuel_type: (formData.get("fuel_type") as any) || "None",
            fuel_consumption_litres: formData.get("fuel_consumption_litres") ? Number(formData.get("fuel_consumption_litres")) : null,
            renewable_energy_type: (formData.get("renewable_energy_type") as any) || "None",
            renewable_energy_kwh: formData.get("renewable_energy_kwh") ? Number(formData.get("renewable_energy_kwh")) : null,
            attribution_pct_energy: Number(formData.get("attribution_pct_energy")) || 100,
            students_count: Number(formData.get("students_count")) || 1,
            waste_generated_kg: formData.get("waste_generated_kg") ? Number(formData.get("waste_generated_kg")) : null,
            waste_diverted_kg: formData.get("waste_diverted_kg") ? Number(formData.get("waste_diverted_kg")) : null,
            water_consumption_m3: formData.get("water_consumption_m3") ? Number(formData.get("water_consumption_m3")) : null,
            attribution_pct_waste: Number(formData.get("attribution_pct_waste")) || 100,
            attribution_pct_water: Number(formData.get("attribution_pct_water")) || 100,
        });

        const sha256Hash = generateSchoolHash({
            registryId,
            schoolName: formData.get("schoolName") as string,
            address: formData.get("address") as string,
            userId,
            createdAt: now,
        });

        // Feature 8: Split Collections
        // Collection 1: schools (publicly readable identity)
        const schoolDocData = {
            registryId,
            schoolName: formData.get("schoolName"),
            address: formData.get("address"),
            city: formData.get("city"),
            pincode: formData.get("pincode"),
            place_id: formData.get("place_id"),
            contactPerson: formData.get("contactPerson"),
            phone: formData.get("phone"),
            email: formData.get("email"),
            projectId: formData.get("projectId"),
            status: "pledged",
            // Feature 10: 3 Consent Flags
            consent_verification: true,
            consent_public: true,
            consent_research: true,
            attribution_percentage: Number(formData.get("attribution_pct_energy")) || 100,
            tco2e_annual: impact.tco2e_annual,
            atmanirbhar_pct: impact.atmanirbhar_pct,
            circularity_pct: impact.circularity_pct,
            carbon_intensity: impact.carbon_intensity,
            sha256Hash,
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            payment_status: "verified",
            userId,
            createdAt: now,
            updatedAt: null,
            verifiedAt: null,
            verifiedBy: null,
            lat: formData.get("lat") ? Number(formData.get("lat")) : null,
            lng: formData.get("lng") ? Number(formData.get("lng")) : null,
        };

        // Collection 2: schoolBaselines (admin only, raw data + impact)
        const baselineDocData = {
            ...impact,
            electricity_kWh_year: formData.get("electricity_kWh_year") ? Number(formData.get("electricity_kWh_year")) : null,
            fuel_type: formData.get("fuel_type"),
            fuel_consumption_litres: formData.get("fuel_consumption_litres") ? Number(formData.get("fuel_consumption_litres")) : null,
            renewable_energy_type: formData.get("renewable_energy_type"),
            renewable_energy_kwh: formData.get("renewable_energy_kwh") ? Number(formData.get("renewable_energy_kwh")) : null,
            students_count: Number(formData.get("students_count")),
            reporting_year: formData.get("reporting_year"),
            action_id: formData.get("action_id"),
            waste_generated_kg: formData.get("waste_generated_kg") ? Number(formData.get("waste_generated_kg")) : null,
            waste_diverted_kg: formData.get("waste_diverted_kg") ? Number(formData.get("waste_diverted_kg")) : null,
            recycling_programs: JSON.parse(formData.get("recycling_programs") as string || "[]"),
            water_consumption_m3: formData.get("water_consumption_m3") ? Number(formData.get("water_consumption_m3")) : null,
            attribution_pct_energy: Number(formData.get("attribution_pct_energy")),
            attribution_pct_waste: Number(formData.get("attribution_pct_waste")),
            attribution_pct_water: Number(formData.get("attribution_pct_water")),
            calculation_notes: formData.get("calculation_notes"),
            baseline_source: formData.get("baseline_source"),
            last_calculated: now,
        };

        const schoolRef = adminDb.collection("schools").doc();
        const schoolId = schoolRef.id;

        // Feature 9: Photo Upload
        let photoUrl = null;
        if (photoFile) {
            const buffer = Buffer.from(await photoFile.arrayBuffer());
            const bucket = adminStorage.bucket();
            const actionId = formData.get("action_id") || "initial";
            const filePath = `school-actions/${schoolId}/${actionId}/photo.jpg`;
            const file = bucket.file(filePath);
            await file.save(buffer, { contentType: "image/jpeg" });
            photoUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
        }

        // Add action if provided
        const actionData = {
            schoolId,
            projectId: formData.get("projectId"),
            action_id: formData.get("action_id"),
            has_existing_actions: formData.get("has_existing_actions"),
            action_type: formData.get("action_type"),
            installation_date: formData.get("installation_date"),
            capacity_description: formData.get("capacity_description"),
            photo_url: photoUrl,
            planned_action_type: formData.get("planned_action_type"),
            target_date: formData.get("target_date"),
            createdAt: now,
        };

        const batch = adminDb.batch();
        batch.set(schoolRef, schoolDocData);
        batch.set(adminDb.collection("schoolBaselines").doc(schoolId), baselineDocData);
        batch.set(adminDb.collection("schoolActions").doc(), actionData);
        await batch.commit();

        return NextResponse.json({
            registryId,
            schoolId,
            impact,
            sha256Hash,
        });
    } catch (error: unknown) {
        console.error("Payment Verification Error:", error);
        const message = error instanceof Error ? error.message : "Payment verification failed";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

