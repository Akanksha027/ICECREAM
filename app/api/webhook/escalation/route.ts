import { NextRequest, NextResponse } from "next/server";

// In-memory stub log so the demo can show "merchant got pinged"
const recent: Array<{
  id: string;
  receivedAt: string;
  payload: unknown;
  endpoint: string;
}> = [];

const STUB_ENDPOINT =
  process.env.ESCALATION_WEBHOOK_URL ||
  "https://hooks.slack.com/services/DEMO/PROFIT/PILOT";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const id = "wh_" + Math.random().toString(36).slice(2, 9);

    // Stub: we don't call a real Slack URL — we log and return success
    // so judges can see the ops workflow without needing Slack credentials.
    const entry = {
      id,
      receivedAt: new Date().toISOString(),
      payload,
      endpoint: STUB_ENDPOINT,
    };
    recent.unshift(entry);
    if (recent.length > 40) recent.pop();

    console.log("[escalation-webhook-stub]", JSON.stringify(entry, null, 2));

    return NextResponse.json({
      success: true,
      stubbed: true,
      id,
      endpoint: STUB_ENDPOINT,
      message: "Merchant notification stubbed — payload captured for demo.",
      deliveredAt: entry.receivedAt,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Webhook failed" },
      { status: 400 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    endpoint: STUB_ENDPOINT,
    count: recent.length,
    recent,
  });
}
