import { NextResponse } from "next/server";
import { createRazorpayOrder } from "@/lib/razorpay";
import { PAYMENT_AMOUNT_PAISE } from "@/lib/constants";

export async function POST() {
    // Read at runtime, not module level — server-only env vars aren't available at build time
    const isSimulation = process.env.RAZORPAY_SIMULATION_MODE === "true";

    try {
        if (isSimulation) {
            return NextResponse.json({
                orderId: `order_SIM_${Date.now()}`,
                amount: PAYMENT_AMOUNT_PAISE,
                currency: "INR",
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                simulated: true,
            });
        }

        const order = await createRazorpayOrder(PAYMENT_AMOUNT_PAISE);

        return NextResponse.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            simulated: false,
        });
    } catch (error: unknown) {
        const message =
            error instanceof Error ? error.message : "Failed to create order";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
