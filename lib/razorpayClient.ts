/** Client-side Razorpay Checkout.js helpers (test mode). */

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (resp: unknown) => void) => void;
    };
  }
}

export function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const existing = document.querySelector('script[src*="checkout.razorpay.com"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export interface CheckoutSuccess {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export async function openRazorpayCheckout(opts: {
  key: string;
  orderId: string;
  amountPaise: number;
  name?: string;
  description?: string;
  prefillName?: string;
  notes?: Record<string, string>;
}): Promise<
  | { ok: true; payment: CheckoutSuccess }
  | { ok: false; reason: "dismissed" | "failed" | "script"; message?: string }
> {
  const loaded = await loadRazorpayScript();
  if (!loaded || !window.Razorpay) {
    return { ok: false, reason: "script", message: "Could not load Razorpay Checkout" };
  }

  return new Promise((resolve) => {
    const rzp = new window.Razorpay!({
      key: opts.key,
      amount: opts.amountPaise,
      currency: "INR",
      name: opts.name || "Sundae & Co.",
      description: opts.description || "Order payment (test mode)",
      order_id: opts.orderId,
      notes: opts.notes || {},
      theme: { color: "#DA758C" },
      prefill: {
        name: opts.prefillName || "Demo Customer",
        email: "demo@sweetdrip.test",
        contact: "9999999999",
      },
      handler: (response: unknown) => {
        resolve({ ok: true, payment: response as CheckoutSuccess });
      },
      modal: {
        ondismiss: () => {
          resolve({ ok: false, reason: "dismissed", message: "Payment window closed" });
        },
      },
    });
    rzp.on("payment.failed", (resp: unknown) => {
      const err = (resp as { error?: { description?: string } })?.error;
      resolve({
        ok: false,
        reason: "failed",
        message: err?.description || "Payment failed",
      });
    });
    rzp.open();
  });
}
