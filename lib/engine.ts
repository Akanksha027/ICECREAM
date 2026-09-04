// ─── Non-AI Safety Layer (Rule-Checker) ──────────────────────────────────────
// This is INTENTIONALLY not AI-driven. It's a deterministic hard-stop that runs
// BETWEEN the LLM suggestion and anything reaching the customer or Razorpay.
// It cannot be overridden by LLM output.

export interface PolicyConfig {
  maxDiscountPct: number;       // e.g. 20 — max allowed discount %
  minMarginFloor: number;       // e.g. 35 — never let margin drop below this
  dailyTotalCap: number;        // e.g. 5000 — total ₹ budget for discounts today
  perCustomerCap: number;       // e.g. 500 — max ₹ discount per customer per day
  perCategoryCap: number;       // e.g. 2000 — max ₹ per category per day
  aggressiveMode: boolean;      // looser margin floor tolerance
  confidenceThreshold: number;  // e.g. 55 — force escalate if AI confidence below this
}

export const DEFAULT_POLICY: PolicyConfig = {
  maxDiscountPct: 20,
  minMarginFloor: 35,
  dailyTotalCap: 5000,
  perCustomerCap: 500,
  perCategoryCap: 2000,
  aggressiveMode: false,
  confidenceThreshold: 55,
};

// ─── Sanity Check (Hard-coded, absolute limits) ─────────────────────────────

export interface SanityCheckResult {
  passed: boolean;
  reason: string;
  caughtAnomaly: boolean;
}

export function runSanityCheck(
  proposedDiscountPct: number,
  proposedDiscount: number,
  margin: number,
  policy: PolicyConfig,
  budgetRemaining: number
): SanityCheckResult {
  // ① Absolute hard ceiling — no AI should ever propose >50%
  if (proposedDiscountPct > 50) {
    return {
      passed: false,
      caughtAnomaly: true,
      reason: `ANOMALY CAUGHT: Proposed ${proposedDiscountPct}% discount exceeds the absolute hard ceiling of 50%. This appears to be an AI hallucination or adversarial input. Action blocked before Razorpay API call.`,
    };
  }

  // ② Never sell below cost price
  const postDiscountMargin = margin - proposedDiscountPct;
  if (postDiscountMargin < 0) {
    return {
      passed: false,
      caughtAnomaly: true,
      reason: `ANOMALY CAUGHT: Proposed discount results in negative margin (${postDiscountMargin.toFixed(1)}%). Selling below cost price is forbidden. Blocked at deterministic sanity layer.`,
    };
  }

  // ③ Absolute minimum margin (stricter than policy floor)
  if (postDiscountMargin < 20) {
    return {
      passed: false,
      caughtAnomaly: true,
      reason: `ANOMALY CAUGHT: Post-discount margin of ${postDiscountMargin.toFixed(1)}% is dangerously low. Absolute hard floor: 20%. Blocked before reaching Razorpay.`,
    };
  }

  // ④ Budget overflow
  if (proposedDiscount > budgetRemaining + 50) {
    return {
      passed: false,
      caughtAnomaly: false,
      reason: `Budget insufficient: ₹${proposedDiscount} requested, ₹${budgetRemaining} remaining.`,
    };
  }

  return { passed: true, caughtAnomaly: false, reason: "All sanity checks passed." };
}

// ─── Policy Check (Merchant-configurable rules) ─────────────────────────────

export interface PolicyCheckResult {
  autoApprove: boolean;
  escalate: boolean;
  reject: boolean;
  reason: string;
}

export function runPolicyCheck(
  proposedDiscountPct: number,
  proposedDiscount: number,
  margin: number,
  policy: PolicyConfig,
  budgetUsed: number,
  customerDailyDiscount: number
): PolicyCheckResult {
  const postDiscountMargin = margin - proposedDiscountPct;
  const budgetRemaining = policy.dailyTotalCap - budgetUsed;

  // Daily budget cap exceeded → REJECT
  if (budgetRemaining < proposedDiscount) {
    return {
      autoApprove: false,
      escalate: false,
      reject: true,
      reason: `Daily budget cap reached. ₹${proposedDiscount} needed, ₹${Math.max(0, budgetRemaining).toFixed(0)} available.`,
    };
  }

  // Per-customer cap exceeded → ESCALATE
  if (customerDailyDiscount + proposedDiscount > policy.perCustomerCap) {
    return {
      autoApprove: false,
      escalate: true,
      reject: false,
      reason: `Per-customer daily cap of ₹${policy.perCustomerCap} would be exceeded (current: ₹${customerDailyDiscount}). Escalated for merchant sign-off.`,
    };
  }

  // Below margin floor → ESCALATE (or approve in aggressive mode)
  if (postDiscountMargin < policy.minMarginFloor) {
    if (policy.aggressiveMode && postDiscountMargin >= policy.minMarginFloor - 5) {
      return {
        autoApprove: true,
        escalate: false,
        reject: false,
        reason: `Aggressive mode: margin (${postDiscountMargin.toFixed(1)}%) is slightly below the ${policy.minMarginFloor}% floor. Approved given operating mode.`,
      };
    }
    return {
      autoApprove: false,
      escalate: true,
      reject: false,
      reason: `Post-discount margin (${postDiscountMargin.toFixed(1)}%) is below the minimum floor of ${policy.minMarginFloor}%. Escalated for human judgment.`,
    };
  }

  // Discount % > max allowed → ESCALATE
  if (proposedDiscountPct > policy.maxDiscountPct) {
    return {
      autoApprove: false,
      escalate: true,
      reject: false,
      reason: `Proposed ${proposedDiscountPct}% exceeds max discount policy of ${policy.maxDiscountPct}%. Escalated for human approval before any Razorpay call.`,
    };
  }

  // All clear → AUTO-APPROVE
  return {
    autoApprove: true,
    escalate: false,
    reject: false,
    reason: `Within all policy bounds. Margin: ${postDiscountMargin.toFixed(1)}% > ${policy.minMarginFloor}% floor. Budget: ₹${proposedDiscount} / ₹${budgetRemaining.toFixed(0)} remaining.`,
  };
}

// ─── Confidence Check (independent safety axis — not a policy re-skin) ───────
// Even when numbers pass, low AI self-confidence forces human review.

export interface ConfidenceCheckResult {
  escalate: boolean;
  reason: string;
}

export function runConfidenceCheck(
  confidence: number,
  threshold: number
): ConfidenceCheckResult {
  if (confidence < threshold) {
    return {
      escalate: true,
      reason: `AI confidence ${confidence}% is below the ${threshold}% threshold. Forced escalation — the model itself is uncertain, independent of whether policy numbers would have passed.`,
    };
  }
  return {
    escalate: false,
    reason: `AI confidence ${confidence}% ≥ ${threshold}% threshold. No confidence-based escalation.`,
  };
}

// ─── Counterfactuals (what a naive system would have done) ───────────────────

export interface CounterfactualLane {
  label: string;
  action: "approve" | "reject" | "escalate" | "block";
  discountCostInr: number;
  recoveredRevenueInr: number;
  note: string;
}

export interface CounterfactualResult {
  alwaysApprove: CounterfactualLane;
  flat10: CounterfactualLane;
  actual: CounterfactualLane;
  savingsVsAlwaysApprove: number;
  savingsVsFlat10: number;
}

export function computeCounterfactuals(opts: {
  proposedDiscountPct: number;
  proposedDiscountInr: number;
  cartValueInr: number;
  upsellOriginalInr: number;
  status: string;
  razorpayAmountInr?: number;
  isAnomaly?: boolean;
}): CounterfactualResult {
  const {
    proposedDiscountPct,
    proposedDiscountInr,
    cartValueInr,
    upsellOriginalInr,
    status,
    razorpayAmountInr = 0,
    isAnomaly = false,
  } = opts;

  const flat10Cost = Math.round(upsellOriginalInr * 0.1);
  const flat10Revenue = cartValueInr + Math.round(upsellOriginalInr * 0.9);

  const alwaysApprove: CounterfactualLane = {
    label: "Always approve",
    action: isAnomaly ? "approve" : "approve",
    discountCostInr: proposedDiscountInr,
    recoveredRevenueInr: cartValueInr + (upsellOriginalInr - proposedDiscountInr),
    note: isAnomaly
      ? `Naive system would have APPROVED the ${proposedDiscountPct}% offer — including this anomaly. Cost: ₹${proposedDiscountInr}.`
      : `Would auto-approve every AI proposal at ${proposedDiscountPct}%. Discount cost ₹${proposedDiscountInr}; assumed order ₹${cartValueInr + (upsellOriginalInr - proposedDiscountInr)}.`,
  };

  const flat10: CounterfactualLane = {
    label: "Flat 10%",
    action: "approve",
    discountCostInr: flat10Cost,
    recoveredRevenueInr: flat10Revenue,
    note: `Blind 10% on every upsell. Cost ₹${flat10Cost}; assumed order ₹${flat10Revenue}. No margin/budget/confidence gating.`,
  };

  const approved =
    status === "auto_approved" ||
    status === "approved_by_human" ||
    status === "approved";
  const escalated =
    status === "escalated" || status === "pending_approval";
  const blocked =
    status === "caught_anomaly" ||
    status === "rejected" ||
    status === "villain_blocked";

  let actualAction: CounterfactualLane["action"] = "approve";
  if (escalated) actualAction = "escalate";
  else if (blocked) actualAction = "block";
  else if (!approved) actualAction = "reject";

  const actual: CounterfactualLane = {
    label: "Profit Pilot",
    action: actualAction,
    discountCostInr: approved ? proposedDiscountInr : 0,
    recoveredRevenueInr: approved ? razorpayAmountInr || cartValueInr : 0,
    note: approved
      ? `Engine approved. Discount cost ₹${proposedDiscountInr}; recovered ₹${razorpayAmountInr || cartValueInr}.`
      : escalated
      ? `Held for human review — no Razorpay call until approved. Avoided automatic ₹${proposedDiscountInr} spend.`
      : `Blocked before payment. Avoided ₹${proposedDiscountInr} loss that naive systems would have spent.`,
  };

  return {
    alwaysApprove,
    flat10,
    actual,
    savingsVsAlwaysApprove:
      alwaysApprove.discountCostInr - actual.discountCostInr,
    savingsVsFlat10: flat10.discountCostInr - actual.discountCostInr,
  };
}

/** Estimate Gemini 2.5 Flash cost in INR from token usage. */
export function estimateGeminiCostInr(
  promptTokens = 800,
  completionTokens = 250
): number {
  const inputUsd = (promptTokens / 1_000_000) * 0.15;
  const outputUsd = (completionTokens / 1_000_000) * 0.6;
  const inr = (inputUsd + outputUsd) * 83;
  return Math.max(0.01, Math.round(inr * 100) / 100);
}
