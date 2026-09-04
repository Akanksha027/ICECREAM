import { NextRequest, NextResponse } from "next/server";
import { auditStore } from "@/lib/auditStore";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const found = auditStore.getEntryById(id);
  if (!found) {
    return NextResponse.json({ success: false, error: "Decision not found" }, { status: 404 });
  }
  return NextResponse.json({
    success: true,
    entry: {
      id: found.id,
      status: found.status,
      upsellItem: found.upsellItem,
      discountPct: found.aiProposedDiscountPct,
      confidence: found.aiConfidence,
      reason: found.whichRuleTriggered || found.policyResult,
      cartItems: found.cartItems,
    },
  });
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const action = body.action === "reject" ? "reject" : "approve";

  if (action === "approve") auditStore.approveEntry(id);
  else auditStore.rejectEntry(id);

  const found = auditStore.getEntryById(id);
  if (!found) {
    return NextResponse.json({ success: false, error: "Decision not found" }, { status: 404 });
  }
  return NextResponse.json({
    success: true,
    status: found.status,
    action,
  });
}
