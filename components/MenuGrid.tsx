"use client";

import { useState, MouseEvent, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { runSanityCheck, runPolicyCheck, DEFAULT_POLICY } from "@/lib/engine";
import { auditStore, useAuditStore, genId, type AuditEntry, type DecisionStatus } from "@/lib/auditStore";

// ─── Menu Items ──────────────────────────────────────────────────────────────

const ITEMS = [
  { name: "Waffle Cone Classic", price: 6.50, priceLabel: "$6.50", kind: "Ice cream", image: "/img9.jpeg", margin: 62 },
  { name: "Double Choc Chunk", price: 4.00, priceLabel: "$4.00", kind: "Cookie", image: "/img10.jpeg", margin: 58 },
  { name: "Mint Pistachio Cup", price: 7.00, priceLabel: "$7.00", kind: "Ice cream", image: "/img11.jpeg", margin: 65 },
  { name: "Salted Honey Stack", price: 5.50, priceLabel: "$5.50", kind: "Cookie", image: "/img12.jpeg", margin: 55 },
  { name: "Raspberry Ripple Tub", price: 9.00, priceLabel: "$9.00", kind: "Ice cream", image: "/img13.jpeg", margin: 60 },
  { name: "Brown Butter Chip", price: 4.00, priceLabel: "$4.00", kind: "Cookie", image: "/img14.jpeg", margin: 58 },
];

type MenuItem = (typeof ITEMS)[number];
type CartItem = MenuItem & { id: string };

// ─── Checkout Mode ───────────────────────────────────────────────────────────

type CheckoutMode = "normal" | "simulate_outage" | "bad_ai" | "villain";

// ─── Polaroid Card ───────────────────────────────────────────────────────────

function PolaroidCard({
  item, i, onAdd, onBuy,
}: {
  item: MenuItem; i: number;
  onAdd: (item: MenuItem) => void;
  onBuy: (item: MenuItem) => void;
}) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  function handleMove(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -10, y: px * 10 });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotate: i % 2 === 0 ? -3 : 3 }}
      whileInView={{ opacity: 1, y: 0, rotate: i % 2 === 0 ? -2 : 2 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.55, delay: (i % 3) * 0.08, ease: "easeOut" }}
      onMouseMove={handleMove}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      style={{ transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
      className="group relative rounded-md border border-border bg-polaroid p-3 pb-5 shadow-md transition-shadow hover:shadow-2xl flex flex-col justify-between"
    >
      <div>
        <div className="relative overflow-hidden rounded-sm">
          <img src={item.image} alt={item.name} className="h-56 w-full object-cover transition-transform duration-500 group-hover:scale-110" />
          <span className="absolute left-2 top-2 rounded-full bg-cream/90 px-3 py-1 text-[11px] font-semibold tracking-wide text-brown">{item.kind}</span>
        </div>
        <div className="flex items-baseline justify-between px-1 pt-4">
          <h3 className="font-script text-2xl text-brown">{item.name}</h3>
          <span className="font-display font-semibold text-bright-raspberry">{item.priceLabel}</span>
        </div>
      </div>
      <div className="mt-5 flex gap-2">
        <button onClick={() => onAdd(item)} className="flex-1 rounded-full border-2 border-[#E390A1] text-[#DA758C] hover:bg-[#E390A1] hover:text-white py-2 text-xs font-bold transition-all">
          Add to Cart
        </button>
        <button onClick={() => onBuy(item)} className="flex-1 rounded-full bg-[#DA758C] text-white py-2 text-xs font-bold hover:bg-[#c9637a] shadow-sm transition-all">
          Buy Now
        </button>
      </div>
    </motion.div>
  );
}

// ─── Checkout Flow (the real pipeline) ───────────────────────────────────────

type FlowState =
  | "idle"
  | "ai_thinking"
  | "rule_checking"
  | "offer"
  | "escalated"
  | "anomaly_caught"
  | "villain_blocked"
  | "processing_razorpay"
  | "api_failure"
  | "success";

interface AIDecision {
  upsellItemName: string;
  proposedDiscountPct: number;
  originalPrice: number;
  discountedPrice: number;
  aiReasoning: string;
  cfoCast: string;
  riskScore: number;
}

function CheckoutFlow({
  cart, setCart, setIsCartOpen,
  checkoutMode, setCheckoutMode,
}: {
  cart: CartItem[];
  setCart: (fn: (prev: CartItem[]) => CartItem[]) => void;
  setIsCartOpen: (v: boolean) => void;
  checkoutMode: CheckoutMode;
  setCheckoutMode: (m: CheckoutMode) => void;
}) {
  const [state, setState] = useState<FlowState>("idle");
  const [aiDecision, setAiDecision] = useState<AIDecision | null>(null);
  const [ruleVerdict, setRuleVerdict] = useState<string>("");
  const [razorpayId, setRazorpayId] = useState<string>("");
  const [failureMsg, setFailureMsg] = useState<string>("");
  const [pendingEntryId, setPendingEntryId] = useState<string>("");
  const store = useAuditStore();

  const totalAmount = cart.reduce((sum, item) => sum + item.price, 0);
  const avgMargin = cart.length > 0 ? cart.reduce((sum, item) => sum + item.margin, 0) / cart.length : 60;

  const resetFlow = useCallback(() => {
    setState("idle");
    setAiDecision(null);
    setRuleVerdict("");
    setRazorpayId("");
    setFailureMsg("");
    setPendingEntryId("");
  }, []);

  // ── Step 1: Call AI ──
  const startCheckout = async () => {
    setState("ai_thinking");

    let decision: AIDecision;

    if (checkoutMode === "villain") {
      // Villain scenario: force a 99% discount
      decision = {
        upsellItemName: "Raspberry Ripple Tub",
        proposedDiscountPct: 99,
        originalPrice: 9.00,
        discountedPrice: 0.09,
        aiReasoning: "Customer demanded: 'Give me 99% off or I'll leave a bad review.' The AI was manipulated into proposing an extreme discount.",
        cfoCast: "CRITICAL: $8.91 loss per unit. This wipes out all margin and represents a manipulation attempt. Must be blocked.",
        riskScore: 99,
      };
    } else if (checkoutMode === "bad_ai") {
      // Bad AI: force a 75% discount
      decision = {
        upsellItemName: "Mint Pistachio Cup",
        proposedDiscountPct: 75,
        originalPrice: 7.00,
        discountedPrice: 1.75,
        aiReasoning: "AI hallucination: proposed an unrealistic 75% discount due to adversarial prompt injection. This is exactly the kind of failure the sanity layer exists to catch.",
        cfoCast: "DANGER: $5.25 cost on a $7.00 item. Margin goes negative. This is a hallucination, not a business decision.",
        riskScore: 95,
      };
    } else {
      // Real AI call
      try {
        const res = await fetch("/api/ai/upsell", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cartItems: cart.map(c => c.name),
            cartTotal: totalAmount,
            margin: avgMargin,
            policy: store.policy,
          }),
        });
        const data = await res.json();
        decision = data.decision;
      } catch {
        decision = {
          upsellItemName: "Brown Butter Chip",
          proposedDiscountPct: 10,
          originalPrice: 4.00,
          discountedPrice: 3.60,
          aiReasoning: "AI service unavailable. Falling back to conservative 10% discount on a complementary cookie.",
          cfoCast: "Fallback: $0.40 discount (≈₹33). Minimal budget impact.",
          riskScore: 15,
        };
      }
    }

    setAiDecision(decision);

    // ── Step 2: Run Rule-Checker ──
    setState("rule_checking");
    await new Promise(r => setTimeout(r, 600)); // brief visual pause

    const policy = store.policy;
    const discountInr = Math.round(decision.proposedDiscountPct * decision.originalPrice * 83 / 100);

    // Sanity check (hard limits)
    const sanity = runSanityCheck(
      decision.proposedDiscountPct,
      discountInr,
      avgMargin,
      policy,
      auditStore.budgetRemaining
    );

    if (!sanity.passed) {
      // ── BLOCKED by sanity layer ──
      const entryStatus: DecisionStatus = checkoutMode === "villain" ? "villain_blocked" : "caught_anomaly";
      setRuleVerdict(sanity.reason);
      setState(checkoutMode === "villain" ? "villain_blocked" : "anomaly_caught");

      auditStore.addEntry({
        id: genId(),
        timestamp: new Date(),
        cartItems: cart.map(c => c.name),
        cartTotal: totalAmount,
        currency: "USD",
        aiProposedDiscountPct: decision.proposedDiscountPct,
        aiProposedDiscount: discountInr,
        aiReasoning: decision.aiReasoning,
        aiCfoCast: decision.cfoCast,
        aiRiskScore: decision.riskScore,
        upsellItem: decision.upsellItemName,
        sanityResult: sanity.reason,
        policyResult: "N/A — blocked at sanity layer",
        ruleCheckerVerdict: "blocked",
        whichRuleTriggered: sanity.reason.split(":")[0] || "Sanity check",
        status: entryStatus,
        isAnomaly: sanity.caughtAnomaly,
        isVillain: checkoutMode === "villain",
      });
      return;
    }

    // Policy check (merchant rules)
    const policyResult = runPolicyCheck(
      decision.proposedDiscountPct,
      discountInr,
      avgMargin,
      policy,
      auditStore.budgetUsed,
      auditStore.getCustomerDiscount("session_customer")
    );

    if (policyResult.reject) {
      setRuleVerdict(policyResult.reason);
      setState("anomaly_caught");

      auditStore.addEntry({
        id: genId(),
        timestamp: new Date(),
        cartItems: cart.map(c => c.name),
        cartTotal: totalAmount,
        currency: "USD",
        aiProposedDiscountPct: decision.proposedDiscountPct,
        aiProposedDiscount: discountInr,
        aiReasoning: decision.aiReasoning,
        aiCfoCast: decision.cfoCast,
        aiRiskScore: decision.riskScore,
        upsellItem: decision.upsellItemName,
        sanityResult: sanity.reason,
        policyResult: policyResult.reason,
        ruleCheckerVerdict: "blocked",
        whichRuleTriggered: policyResult.reason,
        status: "rejected",
        isAnomaly: false,
      });
      return;
    }

    if (policyResult.escalate) {
      // ── ESCALATED — needs human approval ──
      setRuleVerdict(policyResult.reason);
      setState("escalated");

      const entryId = genId();
      setPendingEntryId(entryId);

      auditStore.addEntry({
        id: entryId,
        timestamp: new Date(),
        cartItems: cart.map(c => c.name),
        cartTotal: totalAmount,
        currency: "USD",
        aiProposedDiscountPct: decision.proposedDiscountPct,
        aiProposedDiscount: discountInr,
        aiReasoning: decision.aiReasoning,
        aiCfoCast: decision.cfoCast,
        aiRiskScore: decision.riskScore,
        upsellItem: decision.upsellItemName,
        sanityResult: sanity.reason,
        policyResult: policyResult.reason,
        ruleCheckerVerdict: "escalated",
        whichRuleTriggered: policyResult.reason,
        status: "pending_approval",
        isAnomaly: false,
      });
      return;
    }

    // ── AUTO-APPROVED — show offer ──
    setRuleVerdict(policyResult.reason);
    setState("offer");
  };

  // ── Step 3: Process Razorpay order ──
  const processRazorpayOrder = async (accepted: boolean) => {
    const decision = aiDecision!;
    setState("processing_razorpay");

    const discountInr = Math.round(decision.proposedDiscountPct * decision.originalPrice * 83 / 100);
    const orderAmountPaise = Math.round(totalAmount * 83 * 100); // USD → INR → paise

    try {
      const res = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: orderAmountPaise,
          simulateFailure: checkoutMode === "simulate_outage",
          notes: {
            cart_items: cart.map(c => c.name).join(", "),
            upsell: accepted ? decision.upsellItemName : "none",
            discount_pct: decision.proposedDiscountPct,
          },
        }),
      });

      const data = await res.json();

      if (!data.success) {
        // ── API FAILURE ──
        setFailureMsg(data.error || "Razorpay API unreachable");
        setState("api_failure");

        auditStore.addEntry({
          id: genId(),
          timestamp: new Date(),
          cartItems: cart.map(c => c.name),
          cartTotal: totalAmount,
          currency: "USD",
          aiProposedDiscountPct: decision.proposedDiscountPct,
          aiProposedDiscount: discountInr,
          aiReasoning: decision.aiReasoning,
          aiCfoCast: decision.cfoCast,
          aiRiskScore: decision.riskScore,
          upsellItem: decision.upsellItemName,
          sanityResult: "Passed",
          policyResult: ruleVerdict,
          ruleCheckerVerdict: "passed",
          whichRuleTriggered: "None — all checks passed",
          status: "api_failure",
          failureReason: data.error,
          isAnomaly: false,
        });
        return;
      }

      // ── SUCCESS ──
      setRazorpayId(data.id);
      setState("success");

      if (accepted) {
        setCart(prev => [
          ...prev,
          {
            ...ITEMS.find(i => i.name === decision.upsellItemName)!,
            id: Math.random().toString(36).substr(2, 9),
            price: decision.discountedPrice,
            priceLabel: `$${decision.discountedPrice.toFixed(2)}`,
          },
        ]);
      }

      auditStore.addEntry({
        id: genId(),
        timestamp: new Date(),
        cartItems: cart.map(c => c.name),
        cartTotal: totalAmount,
        currency: "USD",
        aiProposedDiscountPct: decision.proposedDiscountPct,
        aiProposedDiscount: discountInr,
        aiReasoning: decision.aiReasoning,
        aiCfoCast: decision.cfoCast,
        aiRiskScore: decision.riskScore,
        upsellItem: accepted ? decision.upsellItemName : "Declined by customer",
        sanityResult: "Passed",
        policyResult: ruleVerdict,
        ruleCheckerVerdict: "passed",
        whichRuleTriggered: "None — all checks passed",
        status: "auto_approved",
        razorpayOrderId: data.id,
        razorpayAmount: Math.round(totalAmount * 83),
        isAnomaly: false,
      });

      setTimeout(() => {
        setCart(() => []);
        setIsCartOpen(false);
        resetFlow();
      }, 4000);
    } catch (err: any) {
      setFailureMsg(err.message || "Network error");
      setState("api_failure");
    }
  };

  // ── Approve escalated entry ──
  const handleApproveEscalated = () => {
    if (pendingEntryId) {
      auditStore.approveEntry(pendingEntryId);
    }
    processRazorpayOrder(true);
  };

  const handleRejectEscalated = () => {
    if (pendingEntryId) {
      auditStore.rejectEntry(pendingEntryId);
    }
    resetFlow();
  };

  // ─── Render States ────────────────────────────────────────────────────────

  if (state === "idle") {
    return (
      <div className="space-y-3">
        {/* Mode toggles */}
        <div className="flex flex-wrap gap-1.5">
          {(["normal", "simulate_outage", "bad_ai", "villain"] as CheckoutMode[]).map((mode) => {
            const labels: Record<CheckoutMode, string> = {
              normal: "✓ Normal",
              simulate_outage: "⚡ Outage",
              bad_ai: "🤖 Bad AI",
              villain: "😈 Villain",
            };
            return (
              <button
                key={mode}
                onClick={() => setCheckoutMode(mode)}
                className={`rounded-full px-3 py-1 text-[10px] font-bold transition-all ${
                  checkoutMode === mode
                    ? "bg-brown text-white"
                    : "bg-white text-brown/60 border border-brown/10 hover:border-brown/30"
                }`}
              >
                {labels[mode]}
              </button>
            );
          })}
        </div>

        <button
          disabled={cart.length === 0}
          className="w-full rounded-full bg-[#DA758C] text-white py-4 font-bold tracking-wide hover:bg-[#c9637a] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          onClick={startCheckout}
        >
          Checkout{checkoutMode !== "normal" ? ` (${checkoutMode.replace("_", " ")})` : ""}
        </button>
      </div>
    );
  }

  if (state === "ai_thinking") {
    return (
      <div className="w-full rounded-2xl bg-blue-50 py-4 flex flex-col items-center justify-center gap-2 border border-blue-100 text-brown">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span></span>
          <span className="text-sm font-medium">Profit Pilot AI is analyzing your order...</span>
        </div>
        <p className="text-[10px] text-brown/40">Calling Gemini AI for upsell reasoning</p>
      </div>
    );
  }

  if (state === "rule_checking") {
    return (
      <div className="w-full rounded-2xl bg-yellow-50 py-4 flex flex-col items-center justify-center gap-2 border border-yellow-100 text-brown">
        <div className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          <span className="text-sm font-medium">Running safety checks...</span>
        </div>
        <p className="text-[10px] text-brown/40">Non-AI rule-checker: margin floor, budget cap, discount limits</p>
      </div>
    );
  }

  if (state === "offer" && aiDecision) {
    return (
      <div className="w-full rounded-2xl bg-blue-50 p-4 border border-blue-100 shadow-inner space-y-3">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-blue-500" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">AI Offer — Auto-Approved ✓</span>
        </div>
        <p className="text-sm font-medium text-brown leading-snug">
          Add <span className="font-bold">{aiDecision.upsellItemName}</span> for{" "}
          <span className="line-through text-brown/40">${aiDecision.originalPrice.toFixed(2)}</span>{" "}
          <span className="font-bold text-bright-raspberry">${aiDecision.discountedPrice.toFixed(2)}</span>
        </p>
        <p className="text-[10px] text-brown/60 leading-relaxed italic">"{aiDecision.aiReasoning}"</p>
        <p className="text-[10px] text-brown/40 bg-white/60 rounded-lg p-2">
          <span className="font-bold">Rule-checker:</span> {ruleVerdict}
        </p>
        <div className="flex gap-2">
          <button onClick={() => processRazorpayOrder(false)} className="flex-1 rounded-full bg-white text-brown py-2 text-xs font-bold border border-brown/20 hover:bg-gray-50 transition-all">
            No thanks
          </button>
          <button onClick={() => processRazorpayOrder(true)} className="flex-1 rounded-full bg-blue-500 text-white py-2 text-xs font-bold hover:bg-blue-600 shadow-sm transition-all">
            Add to Order
          </button>
        </div>
      </div>
    );
  }

  if (state === "escalated" && aiDecision) {
    return (
      <div className="w-full rounded-2xl bg-orange-50 p-4 border border-orange-200 shadow-inner space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-orange-500 text-lg">⚠️</span>
          <span className="text-xs font-bold uppercase tracking-wider text-orange-600">Escalated — Merchant Approval Needed</span>
        </div>
        <p className="text-sm font-medium text-brown">
          AI wants to offer <span className="font-bold">{aiDecision.upsellItemName}</span> at{" "}
          <span className="font-bold text-bright-raspberry">{aiDecision.proposedDiscountPct}% off</span>
        </p>
        <p className="text-[10px] text-brown/60 italic">"{aiDecision.aiReasoning}"</p>
        <div className="text-[10px] text-orange-700 bg-orange-100 rounded-lg p-2 font-medium">
          <span className="font-bold">Why escalated:</span> {ruleVerdict}
        </div>
        <div className="flex gap-2">
          <button onClick={handleRejectEscalated} className="flex-1 rounded-full bg-red-500 text-white py-2 text-xs font-bold hover:bg-red-600 transition-all">
            ✕ Reject
          </button>
          <button onClick={handleApproveEscalated} className="flex-1 rounded-full bg-green-500 text-white py-2 text-xs font-bold hover:bg-green-600 shadow-sm transition-all">
            ✓ Approve & Process
          </button>
        </div>
      </div>
    );
  }

  if ((state === "anomaly_caught" || state === "villain_blocked") && aiDecision) {
    return (
      <div className="w-full rounded-2xl bg-red-50 p-4 border border-red-200 shadow-inner space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-red-500 text-lg">{state === "villain_blocked" ? "🛡️" : "🚨"}</span>
          <span className="text-xs font-bold uppercase tracking-wider text-red-600">
            {state === "villain_blocked" ? "Manipulation Attempt Blocked" : "Anomaly Caught — Decision Blocked"}
          </span>
        </div>
        <p className="text-sm font-medium text-brown">
          AI proposed <span className="font-bold text-red-600">{aiDecision.proposedDiscountPct}% off</span> on {aiDecision.upsellItemName}
        </p>
        <p className="text-[10px] text-brown/60 italic">"{aiDecision.aiReasoning}"</p>
        <div className="text-[10px] text-red-700 bg-red-100 rounded-lg p-2 font-medium">
          <span className="font-bold">Blocked by:</span> {ruleVerdict}
        </div>
        <p className="text-[10px] text-brown/40">No Razorpay call was made. No charge created. Logged to audit trail.</p>
        <button onClick={resetFlow} className="w-full rounded-full bg-brown text-white py-2 text-xs font-bold hover:bg-brown/90 transition-all">
          Dismiss
        </button>
      </div>
    );
  }

  if (state === "processing_razorpay") {
    return (
      <div className="w-full rounded-2xl bg-gray-50 py-4 flex flex-col items-center justify-center gap-2 border border-gray-200 text-brown">
        <div className="flex items-center gap-2">
          <svg className="animate-spin h-5 w-5 text-[#DA758C]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          <span className="text-sm font-medium">Creating Razorpay order...</span>
        </div>
        <p className="text-[10px] text-brown/40">Real test-mode API call in progress</p>
      </div>
    );
  }

  if (state === "api_failure") {
    return (
      <div className="w-full rounded-2xl bg-gray-100 p-4 border border-gray-300 shadow-inner space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-lg">⚡</span>
          <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Razorpay API Failure — Order Held Safely</span>
        </div>
        <p className="text-xs text-brown/70">{failureMsg}</p>
        <p className="text-[10px] text-brown/40">No charge was created. The customer was not billed. Safe to retry.</p>
        <button onClick={resetFlow} className="w-full rounded-full bg-brown text-white py-2 text-xs font-bold hover:bg-brown/90 transition-all">
          Dismiss
        </button>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="w-full rounded-2xl bg-green-50 p-4 border border-green-200 shadow-inner space-y-2">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
          <span className="text-sm font-bold text-green-700">Order Created Successfully!</span>
        </div>
        <p className="text-xs font-mono text-blue-600">Razorpay Order: {razorpayId}</p>
        <p className="text-[10px] text-brown/40">Logged to audit trail. Cart will clear shortly.</p>
      </div>
    );
  }

  return null;
}

// ─── Main MenuGrid ───────────────────────────────────────────────────────────

export default function MenuGrid() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutMode, setCheckoutMode] = useState<CheckoutMode>("normal");

  const handleAdd = (item: MenuItem) => {
    setCart(prev => [...prev, { ...item, id: Math.random().toString(36).substr(2, 9) }]);
  };

  const handleBuy = (item: MenuItem) => {
    handleAdd(item);
    setIsCartOpen(true);
  };

  const removeItem = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const totalAmount = cart.reduce((acc, item) => acc + item.price, 0);

  return (
    <section id="menu" className="relative bg-blush/40 pt-12 pb-24 md:pt-16 md:pb-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-14 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="font-script text-2xl text-coral mb-1">the menu board</p>
            <h2 className="font-display text-4xl md:text-5xl font-semibold text-brown">Today's cases</h2>
          </div>
          <p className="max-w-sm text-sm text-muted-brown">
            Everything below is made that morning. When a tray sells out, it comes off the board until the next bake.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {ITEMS.map((item, i) => (
            <PolaroidCard key={item.name} item={item} i={i} onAdd={handleAdd} onBuy={handleBuy} />
          ))}
        </div>
      </div>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <button
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#DA758C] text-white shadow-xl hover:scale-105 transition-transform"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" />
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
          </svg>
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400 text-[10px] font-bold text-brown">
            {cart.length}
          </span>
        </button>
      )}

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCartOpen(false)} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm border-l border-white/20 bg-[#FDF6F5] p-6 shadow-2xl overflow-y-auto flex flex-col"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-2xl font-semibold text-brown">Your Cart</h2>
                <button onClick={() => setIsCartOpen(false)} className="rounded-full bg-white p-2 text-brown shadow-sm hover:bg-gray-50">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60">
                  <p className="text-sm font-medium text-brown">Your cart is currently empty.</p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col gap-3">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm border border-black/5">
                      <img src={item.image} alt={item.name} className="h-14 w-14 rounded-md object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-brown text-sm truncate">{item.name}</p>
                        <p className="font-semibold text-bright-raspberry text-xs mt-0.5">${item.price.toFixed(2)}</p>
                      </div>
                      <button onClick={() => removeItem(item.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-auto pt-5 border-t border-brown/10">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-medium text-brown">Total</span>
                  <span className="font-display font-semibold text-2xl text-bright-raspberry">${totalAmount.toFixed(2)}</span>
                </div>
                <CheckoutFlow
                  cart={cart}
                  setCart={setCart}
                  setIsCartOpen={setIsCartOpen}
                  checkoutMode={checkoutMode}
                  setCheckoutMode={setCheckoutMode}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}
