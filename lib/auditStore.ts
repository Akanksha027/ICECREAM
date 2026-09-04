// ─── Audit Store — Shared state for audit log, approvals, revenue ────────────
// Uses a simple event-driven pattern so any component can subscribe to changes.

import { PolicyConfig, DEFAULT_POLICY } from "./engine";

export type DecisionStatus =
  | "auto_approved"
  | "escalated"
  | "pending_approval"
  | "approved_by_human"
  | "rejected"
  | "caught_anomaly"
  | "api_failure"
  | "villain_blocked";

export interface AuditEntry {
  id: string;
  timestamp: Date;
  // Cart context
  cartItems: string[];
  cartTotal: number;
  currency: string;
  // AI decision
  aiProposedDiscountPct: number;
  aiProposedDiscount: number;
  aiReasoning: string;
  aiCfoCast: string;
  aiRiskScore: number;
  upsellItem: string;
  // Rule-checker verdict
  sanityResult: string;
  policyResult: string;
  ruleCheckerVerdict: "passed" | "escalated" | "blocked";
  whichRuleTriggered: string;
  // Outcome
  status: DecisionStatus;
  razorpayOrderId?: string;
  razorpayAmount?: number;
  // Failure details
  failureReason?: string;
  isAnomaly: boolean;
  isVillain?: boolean;
}

type Listener = () => void;

class AuditStore {
  private entries: AuditEntry[] = [];
  private listeners: Set<Listener> = new Set();
  private _budgetUsed: number = 0;
  private _customerDiscounts: Map<string, number> = new Map();
  private _policy: PolicyConfig = { ...DEFAULT_POLICY };
  private _trustScore: number = 80; // starts at 80

  // ─── Policy ──────────────────────────────────────────────────────────
  get policy() { return this._policy; }
  setPolicy(p: Partial<PolicyConfig>) {
    this._policy = { ...this._policy, ...p };
    this.notify();
  }

  // ─── Budget ──────────────────────────────────────────────────────────
  get budgetUsed() { return this._budgetUsed; }
  get budgetRemaining() { return this._policy.dailyTotalCap - this._budgetUsed; }

  getCustomerDiscount(customerId: string) {
    return this._customerDiscounts.get(customerId) || 0;
  }

  // ─── Trust Score ─────────────────────────────────────────────────────
  get trustScore() { return this._trustScore; }

  // ─── Revenue ─────────────────────────────────────────────────────────
  get revenueRecovered(): number {
    return this.entries
      .filter(e => e.status === "auto_approved" || e.status === "approved_by_human")
      .reduce((sum, e) => sum + (e.razorpayAmount || 0), 0);
  }

  get totalDecisions() { return this.entries.length; }

  get stats() {
    const approved = this.entries.filter(e => e.status === "auto_approved" || e.status === "approved_by_human").length;
    const escalated = this.entries.filter(e => e.status === "escalated" || e.status === "pending_approval").length;
    const blocked = this.entries.filter(e => e.status === "caught_anomaly" || e.status === "rejected" || e.status === "villain_blocked").length;
    const failed = this.entries.filter(e => e.status === "api_failure").length;
    return { approved, escalated, blocked, failed, total: this.entries.length };
  }

  // ─── Entries ─────────────────────────────────────────────────────────
  getEntries(): AuditEntry[] {
    return [...this.entries].reverse(); // newest first
  }

  getPendingApprovals(): AuditEntry[] {
    return this.entries.filter(e => e.status === "pending_approval");
  }

  addEntry(entry: AuditEntry) {
    this.entries.push(entry);

    // Update budget tracking
    if (entry.status === "auto_approved" || entry.status === "approved_by_human") {
      this._budgetUsed += entry.aiProposedDiscount;
      // Trust score goes up
      this._trustScore = Math.min(100, this._trustScore + 2);
    }

    // Track per-customer discounts
    const custKey = "session_customer";
    const current = this._customerDiscounts.get(custKey) || 0;
    if (entry.status === "auto_approved" || entry.status === "approved_by_human") {
      this._customerDiscounts.set(custKey, current + entry.aiProposedDiscount);
    }

    // Trust score changes for escalations/blocks
    if (entry.status === "escalated" || entry.status === "pending_approval") {
      this._trustScore = Math.max(0, this._trustScore - 3);
    }
    if (entry.status === "caught_anomaly" || entry.status === "villain_blocked") {
      this._trustScore = Math.max(0, this._trustScore - 8);
    }

    this.notify();
  }

  approveEntry(id: string) {
    const entry = this.entries.find(e => e.id === id);
    if (entry && entry.status === "pending_approval") {
      entry.status = "approved_by_human";
      this._budgetUsed += entry.aiProposedDiscount;
      this._trustScore = Math.min(100, this._trustScore + 1);
      this.notify();
    }
  }

  rejectEntry(id: string) {
    const entry = this.entries.find(e => e.id === id);
    if (entry && entry.status === "pending_approval") {
      entry.status = "rejected";
      this._trustScore = Math.max(0, this._trustScore - 2);
      this.notify();
    }
  }

  // ─── Subscription ───────────────────────────────────────────────────
  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private _version = 0;
  get version() { return this._version; }

  private notify() {
    this._version++;
    this.listeners.forEach(l => l());
  }
}

// Singleton
export const auditStore = new AuditStore();

// React hook
import { useSyncExternalStore, useCallback } from "react";

export function useAuditStore() {
  const subscribe = useCallback((cb: () => void) => auditStore.subscribe(cb), []);
  const getSnapshot = useCallback(() => auditStore.version, []);

  useSyncExternalStore(subscribe, getSnapshot);

  // Return a getter-style object (reads are always fresh since we re-render on version change)
  return {
    entries: auditStore.getEntries(),
    pendingApprovals: auditStore.getPendingApprovals(),
    stats: auditStore.stats,
    budgetUsed: auditStore.budgetUsed,
    budgetRemaining: auditStore.budgetRemaining,
    revenueRecovered: auditStore.revenueRecovered,
    trustScore: auditStore.trustScore,
    policy: auditStore.policy,
    totalDecisions: auditStore.totalDecisions,
  };
}

export function genId() {
  return "dec_" + Math.random().toString(36).substr(2, 9) + "_" + Date.now().toString(36);
}

