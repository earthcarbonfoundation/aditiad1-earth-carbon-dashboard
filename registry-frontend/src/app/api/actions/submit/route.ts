import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const required = [
            "actionType",
            "quantity",
            "unit",
            "address",
            "actorType",
            "actorName",
            "contactPerson",
            "phone",
            "email",
        ];

        const missing = required.filter((field) => !body[field]);
        if (missing.length > 0) {
            return NextResponse.json(
                { valid: false, errors: missing.map((f) => `${f} is required`) },
                { status: 400 }
            );
        }

        if (!/^\d{10}$/.test(body.phone)) {
            return NextResponse.json(
                { valid: false, errors: ["Phone must be a 10-digit number"] },
                { status: 400 }
            );
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(body.email)) {
            return NextResponse.json(
                { valid: false, errors: ["Invalid email format"] },
                { status: 400 }
            );
        }

        if (Number(body.quantity) <= 0) {
            return NextResponse.json(
                { valid: false, errors: ["Quantity must be greater than 0"] },
                { status: 400 }
            );
        }

        return NextResponse.json({ valid: true });
    } catch (error: unknown) {
        const message =
            error instanceof Error ? error.message : "Validation failed";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
