"use client";

import { useSyncExternalStore, useCallback } from "react";
import { auditStore } from "@/lib/auditStore";

/** Client-only hook — keep React imports out of auditStore so API routes can import the store. */
export function useAuditStore() {
  const subscribe = useCallback((cb: () => void) => auditStore.subscribe(cb), []);
  const getSnapshot = useCallback(() => auditStore.version, []);
  const getServerSnapshot = useCallback(() => 0, []);

  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return {
    entries: auditStore.getEntries(),
    pendingApprovals: auditStore.getPendingApprovals(),
    stats: auditStore.stats,
    budgetUsed: auditStore.budgetUsed,
    budgetRemaining: auditStore.budgetRemaining,
    revenueRecovered: auditStore.revenueRecovered,
    aiCostSpent: auditStore.aiCostSpent,
    trustScore: auditStore.trustScore,
    policy: auditStore.policy,
    policySyncedAt: auditStore.policySyncedAt,
    webhookLog: auditStore.webhookLog,
    totalDecisions: auditStore.totalDecisions,
    recentDiscountEvents: auditStore.recentDiscountEvents,
  };
}
