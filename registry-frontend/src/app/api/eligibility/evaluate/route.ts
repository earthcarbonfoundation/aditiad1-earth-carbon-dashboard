import { NextRequest, NextResponse } from "next/server";
import { evaluateEligibility } from "@/lib/eligibility";
import { adminDb } from "@/lib/firebaseAdmin";

export async function POST(request: NextRequest) {
    try {
        const { projectId } = await request.json();

        if (!projectId) {
            return NextResponse.json(
                { error: "Project ID is required" },
                { status: 400 },
            );
        }

        const projectRef = adminDb.collection("projects").doc(projectId);
        const projectDoc = await projectRef.get();

        if (!projectDoc.exists) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        const projectData = projectDoc.data();
        if (!projectData) {
            return NextResponse.json({ error: "Project data is empty" }, { status: 404 });
        }

        const result = evaluateEligibility({
            ownership: projectData.ownership || null,
            baseline_type: projectData.baseline_type || null,
            commissioning_date: projectData.commissioning_date || "",
        });

        await adminDb.collection("eligibility_status").add({
            project_id: projectId,
            status: result.status,
            reason: result.reason,
            evaluation_date: new Date(),
            created_at: new Date(),
            updated_at: new Date(),
        });

        return NextResponse.json(
            { success: true, message: "Eligibility evaluated successfully", result },
            { status: 200 },
        );
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Error evaluating eligibility";
        return NextResponse.json(
            { success: false, message: "Error evaluating eligibility", error: message },
            { status: 500 },
        );
    }
}
