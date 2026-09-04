import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

/** In-memory idempotency map for demo (receipt → order). */
const receiptCache = new Map<string, { id: string; amount: number; status: string; createdAt: number }>();

export async function POST(req: NextRequest) {
  try {
    const { amount, simulateFailure, notes, receipt, idempotent } = await req.json();

    if (simulateFailure) {
      return NextResponse.json({
        success: false,
        error:
          "Gateway timeout after 4,000ms. No charge created. Safe to retry with the same receipt.",
        shouldRetry: true,
        receipt: receipt || null,
      });
    }

    const safeReceipt = String(receipt || `receipt_sd_${Date.now()}`).slice(0, 40);

    // Idempotent retry: same receipt returns the same order (no double charge)
    if (idempotent !== false && receiptCache.has(safeReceipt)) {
      const cached = receiptCache.get(safeReceipt)!;
      return NextResponse.json({
        success: true,
        id: cached.id,
        amount: cached.amount,
        status: cached.status,
        keyId: process.env.RAZORPAY_KEY_ID || "",
        shouldRetry: false,
        idempotentReplay: true,
        receipt: safeReceipt,
      });
    }

    const order = await razorpay.orders.create({
      amount: amount,
      currency: "INR",
      receipt: safeReceipt,
      notes: {
        source: "profit_pilot_sweetdrip",
        type: "upsell_order",
        ...notes,
      },
    });

    receiptCache.set(safeReceipt, {
      id: order.id,
      amount: order.amount as number,
      status: order.status,
      createdAt: Date.now(),
    });

    // Cap cache
    if (receiptCache.size > 80) {
      const first = receiptCache.keys().next().value;
      if (first) receiptCache.delete(first);
    }

    return NextResponse.json({
      success: true,
      id: order.id,
      amount: order.amount,
      status: order.status,
      keyId: process.env.RAZORPAY_KEY_ID || "",
      shouldRetry: false,
      idempotentReplay: false,
      receipt: safeReceipt,
    });
  } catch (error: any) {
    console.error("Razorpay order error:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Razorpay order creation failed",
      shouldRetry: true,
    });
  }
}
