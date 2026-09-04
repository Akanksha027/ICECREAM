// ─── Audit Store — Shared state for audit log, approvals, revenue ────────────
// Uses a simple event-driven pattern so any component can subscribe to changes.

import { PolicyConfig, DEFAULT_POLICY, computeCounterfactuals, type CounterfactualResult } from "./engine";

export type DecisionStatus =
  | "auto_approved"
  | "escalated"
  | "pending_approval"
  | "approved_by_human"
  | "rejected"
  | "caught_anomaly"
  | "api_failure"
  | "villain_blocked";

export interface WebhookEvent {
  id: string;
  timestamp: Date;
  decisionId: string;
  channel: "slack" | "webhook";
  endpoint: string;
  payload: string;
  status: "delivered" | "stubbed";
}

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
  aiConfidence: number;
  aiCostInr: number;
  upsellItem: string;
  upsellOriginalInr?: number;
  // Rule-checker verdict
  sanityResult: string;
  policyResult: string;
  confidenceResult?: string;
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
  webhookFired?: boolean;
}

type Listener = () => void;

class AuditStore {
  private entries: AuditEntry[] = [];
  private listeners: Set<Listener> = new Set();
  private _budgetUsed: number = 0;
  private _customerDiscounts: Map<string, number> = new Map();
  private _policy: PolicyConfig = { ...DEFAULT_POLICY };
  private _trustScore: number = 80;
  private _aiCostSpent: number = 0;
  private _webhookLog: WebhookEvent[] = [];
  private _policySyncedAt: Date | null = null;

  // ─── Policy ──────────────────────────────────────────────────────────
  get policy() { return this._policy; }
  get policySyncedAt() { return this._policySyncedAt; }
  setPolicy(p: Partial<PolicyConfig>, synced = false) {
    this._policy = { ...this._policy, ...p };
    if (synced) this._policySyncedAt = new Date();
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

  // ─── Revenue / AI cost ───────────────────────────────────────────────
  get revenueRecovered(): number {
    return this.entries
      .filter(e => e.status === "auto_approved" || e.status === "approved_by_human")
      .reduce((sum, e) => sum + (e.razorpayAmount || 0), 0);
  }

  get aiCostSpent() { return this._aiCostSpent; }

  get totalDecisions() { return this.entries.length; }

  get webhookLog() { return [...this._webhookLog]; }

  get stats() {
    const approved = this.entries.filter(e => e.status === "auto_approved" || e.status === "approved_by_human").length;
    const escalated = this.entries.filter(e => e.status === "escalated" || e.status === "pending_approval").length;
    const blocked = this.entries.filter(e => e.status === "caught_anomaly" || e.status === "rejected" || e.status === "villain_blocked").length;
    const failed = this.entries.filter(e => e.status === "api_failure").length;
    return { approved, escalated, blocked, failed, total: this.entries.length };
  }

  // ─── Entries ─────────────────────────────────────────────────────────
  getEntries(): AuditEntry[] {
    return [...this.entries].reverse();
  }

  getPendingApprovals(): AuditEntry[] {
    return this.entries.filter(e => e.status === "pending_approval");
  }

  getCounterfactual(entry: AuditEntry): CounterfactualResult {
    return computeCounterfactuals({
      proposedDiscountPct: entry.aiProposedDiscountPct,
      proposedDiscountInr: entry.aiProposedDiscount,
      cartValueInr: Math.round(entry.cartTotal * 83),
      upsellOriginalInr: entry.upsellOriginalInr || Math.round((entry.aiProposedDiscount / Math.max(1, entry.aiProposedDiscountPct)) * 100),
      status: entry.status,
      razorpayAmountInr: entry.razorpayAmount,
      isAnomaly: entry.isAnomaly,
    });
  }

  addEntry(entry: AuditEntry) {
    this.entries.push(entry);
    this._aiCostSpent += entry.aiCostInr || 0;

    if (entry.status === "auto_approved" || entry.status === "approved_by_human") {
      this._budgetUsed += entry.aiProposedDiscount;
      this._trustScore = Math.min(100, this._trustScore + 2);
    }

    const custKey = "session_customer";
    const current = this._customerDiscounts.get(custKey) || 0;
    if (entry.status === "auto_approved" || entry.status === "approved_by_human") {
      this._customerDiscounts.set(custKey, current + entry.aiProposedDiscount);
    }

    if (entry.status === "escalated" || entry.status === "pending_approval") {
      this._trustScore = Math.max(0, this._trustScore - 3);
    }
    if (entry.status === "caught_anomaly" || entry.status === "villain_blocked") {
      this._trustScore = Math.max(0, this._trustScore - 8);
    }

    this.notify();
  }

  pushWebhook(event: Omit<WebhookEvent, "id" | "timestamp"> & { id?: string; timestamp?: Date }) {
    this._webhookLog.unshift({
      id: event.id || "wh_" + Math.random().toString(36).slice(2, 9),
      timestamp: event.timestamp || new Date(),
      decisionId: event.decisionId,
      channel: event.channel,
      endpoint: event.endpoint,
      payload: event.payload,
      status: event.status,
    });
    this._webhookLog = this._webhookLog.slice(0, 30);
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
  // Required for Next.js static prerender / SSR — must be stable & match initial client state
  const getServerSnapshot = useCallback(() => 0, []);

  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Return a getter-style object (reads are always fresh since we re-render on version change)
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
  };
}

export function genId() {
  return "dec_" + Math.random().toString(36).substr(2, 9) + "_" + Date.now().toString(36);
}

/** Fire escalation webhook stub (Slack-style ping). */
export async function fireEscalationWebhook(opts: {
  decisionId: string;
  title: string;
  reason: string;
  confidence: number;
  discountPct: number;
}) {
  const payload = {
    channel: "#merchant-approvals",
    username: "Profit Pilot",
    text: `⚠️ Escalation needs your approval\n• ${opts.title}\n• ${opts.discountPct}% off\n• Confidence: ${opts.confidence}%\n• Why: ${opts.reason}`,
    decisionId: opts.decisionId,
    ts: new Date().toISOString(),
  };

  try {
    const res = await fetch("/api/webhook/escalation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    auditStore.pushWebhook({
      decisionId: opts.decisionId,
      channel: "slack",
      endpoint: data.endpoint || "/api/webhook/escalation",
      payload: JSON.stringify(payload, null, 2),
      status: data.success ? "stubbed" : "stubbed",
    });
    return true;
  } catch {
    auditStore.pushWebhook({
      decisionId: opts.decisionId,
      channel: "webhook",
      endpoint: "/api/webhook/escalation",
      payload: JSON.stringify(payload, null, 2),
      status: "stubbed",
    });
    return false;
  }
}
