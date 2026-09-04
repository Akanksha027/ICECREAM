"use client";

import { useEffect, useState } from "react";
import { auditStore } from "@/lib/auditStore";
import { useAuditStore } from "@/lib/useAuditStore";
import type { PolicyConfig } from "@/lib/engine";
import { useDemoMode } from "@/hooks/useDemoMode";

const POLICY_MSG = "PROFIT_PILOT_POLICY";

/**
 * Listens for live policy updates from:
 * 1. postMessage (dashboard iframe parent)
 * 2. BroadcastChannel (same-browser dual-tab demo)
 * 3. Polling /api/policy (when dashboard POSTs to sweetdrip)
 *
 * Badge UI is demo-only — sync always runs for the merchant dashboard.
 */
export default function PolicySyncListener() {
  const store = useAuditStore();
  const demo = useDemoMode();
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    function applyPolicy(patch: Partial<PolicyConfig>) {
      auditStore.setPolicy(patch, true);
      setFlash(true);
      setTimeout(() => setFlash(false), 1800);
    }

    function onMessage(event: MessageEvent) {
      const data = event.data;
      if (!data || data.type !== POLICY_MSG || !data.policy) return;
      applyPolicy(data.policy as Partial<PolicyConfig>);
    }

    window.addEventListener("message", onMessage);

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("profit-pilot-policy");
      bc.onmessage = (ev) => {
        if (ev.data?.policy) applyPolicy(ev.data.policy);
      };
    } catch {
      /* BroadcastChannel unavailable */
    }

    const poll = setInterval(async () => {
      try {
        const res = await fetch("/api/policy", { cache: "no-store" });
        const data = await res.json();
        if (!data.success || !data.policy) return;
        const cur = auditStore.policy;
        const p = data.policy as PolicyConfig;
        const changed =
          p.minMarginFloor !== cur.minMarginFloor ||
          p.dailyTotalCap !== cur.dailyTotalCap ||
          p.perCustomerCap !== cur.perCustomerCap ||
          p.maxDiscountPct !== cur.maxDiscountPct ||
          p.confidenceThreshold !== cur.confidenceThreshold ||
          p.aggressiveMode !== cur.aggressiveMode;
        if (changed) applyPolicy(p);
      } catch {
        /* ignore poll errors */
      }
    }, 2000);

    return () => {
      window.removeEventListener("message", onMessage);
      bc?.close();
      clearInterval(poll);
    };
  }, []);

  if (!demo) return null;

  const p = store.policy;

  return (
    <div
      className={`fixed top-20 right-4 z-40 max-w-xs rounded-xl border px-3 py-2 text-[10px] shadow-lg transition-all ${
        flash
          ? "border-green-400 bg-green-50 text-green-800 scale-[1.02]"
          : "border-brown/10 bg-white/95 text-brown/70"
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="font-bold uppercase tracking-wider">
          {flash ? "Policy synced ✓" : "Live policy"}
        </span>
        {store.policySyncedAt && (
          <span className="opacity-60">
            {store.policySyncedAt.toLocaleTimeString()}
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 font-mono">
        <span>Floor {p.minMarginFloor}%</span>
        <span>Max disc {p.maxDiscountPct}%</span>
        <span>Budget ₹{p.dailyTotalCap}</span>
        <span>Cust ₹{p.perCustomerCap}</span>
        <span className="col-span-2">Confidence ≥ {p.confidenceThreshold}%</span>
      </div>
    </div>
  );
}
