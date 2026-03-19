import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export async function POST(request: NextRequest) {
    try {
        const { targetUid, newRole, adminUid } = await request.json();

        if (!targetUid || !newRole || !adminUid) {
            return NextResponse.json(
                { error: "targetUid, newRole, and adminUid are required" },
                { status: 400 }
            );
        }

        if (!["admin", "user"].includes(newRole)) {
            return NextResponse.json(
                { error: "newRole must be 'admin' or 'user'" },
                { status: 400 }
            );
        }

        // Verify the requesting user is an admin
        const adminDoc = await adminDb.collection("users").doc(adminUid).get();
        if (!adminDoc.exists || adminDoc.data()?.role !== "admin") {
            return NextResponse.json(
                { error: "Unauthorized — admin access required" },
                { status: 403 }
            );
        }

        // Check if target user is a primary admin (cannot be demoted)
        const targetDoc = await adminDb.collection("users").doc(targetUid).get();
        if (!targetDoc.exists) {
            return NextResponse.json(
                { error: "Target user not found" },
                { status: 404 }
            );
        }

        if (targetDoc.data()?.primaryAdmin === true) {
            return NextResponse.json(
                { error: "Cannot change role of primary admin" },
                { status: 403 }
            );
        }

        // Update the role
        await adminDb.collection("users").doc(targetUid).update({
            role: newRole,
            updatedAt: new Date(),
        });

        return NextResponse.json(
            { success: true, message: `Role updated to ${newRole}` },
            { status: 200 }
        );
    } catch (error: unknown) {
        console.error("Error updating user role:", error);
        const message = error instanceof Error ? error.message : "Failed to update role";
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}
