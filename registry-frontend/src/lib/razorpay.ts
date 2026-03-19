import crypto from "crypto";

export interface RazorpayOrder {
    id: string;
    amount: number;
    currency: string;
}

export async function createRazorpayOrder(
    amountInPaise: number
): Promise<RazorpayOrder> {
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";
    const keySecret = process.env.RAZORPAY_KEY_SECRET || "";
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

    const response = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify({
            amount: amountInPaise,
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.description || "Failed to create Razorpay order");
    }

    const data = await response.json();
    return {
        id: data.id,
        amount: data.amount,
        currency: data.currency,
    };
}

export function verifyRazorpaySignature(
    orderId: string,
    paymentId: string,
    signature: string
): boolean {
    // Read at runtime — same reason as above
    const keySecret = process.env.RAZORPAY_KEY_SECRET || "";
    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(body)
        .digest("hex");

    return expectedSignature === signature;
}
