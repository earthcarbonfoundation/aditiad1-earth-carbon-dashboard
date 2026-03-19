import { NextResponse } from "next/server";
import { createRazorpayOrder } from "@/lib/razorpay";
import { PAYMENT_AMOUNT_PAISE } from "@/lib/constants";

export async function POST() {
    const isSimulation = process.env.RAZORPAY_SIMULATION_MODE === "true";

    try {
        if (isSimulation) {
            return NextResponse.json({
                orderId: `order_SCH_SIM_${Date.now()}`,
                amount: PAYMENT_AMOUNT_PAISE,
                currency: "INR",
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                simulated: true,
            });
        }

        const order = await createRazorpayOrder(PAYMENT_AMOUNT_PAISE);

        // Note: The createRazorpayOrder function in razorpay.ts doesn't support notes in its current signature.
        // However, the spec says "Add notes to the Razorpay order body: { type: 'school_onboarding' }".
        // Since I must NOT modify razorpay.ts, I will rely on the fact that createRazorpayOrder returns the order.
        // If I needed to pass notes, I would have had to modify razorpay.ts, but the spec says "reuse without modification".
        // Wait, let me check razorpay.ts again.
        
        return NextResponse.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            simulated: false,
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to create order";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
