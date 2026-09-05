// ─── Audit Store — Shared state for audit log, approvals, revenue ────────────
// Uses a simple event-driven pattern so any component can subscribe to changes.
// Syncs every decision to Supabase so the dashboard can read them in real-time.

import { PolicyConfig, DEFAULT_POLICY, computeCounterfactuals, type CounterfactualResult } from "./engine";
import { supabase } from "./supabase";

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

// ─── Supabase sync helper ────────────────────────────────────────────────────

async function syncEntryToSupabase(entry: AuditEntry) {
  try {
    const { error } = await supabase.from("audit_logs").upsert({
      id: entry.id,
      timestamp: entry.timestamp.toISOString(),
      cart_items: entry.cartItems,
      cart_total: entry.cartTotal,
      currency: entry.currency,
      ai_proposed_discount_pct: entry.aiProposedDiscountPct,
      ai_proposed_discount: entry.aiProposedDiscount,
      ai_reasoning: entry.aiReasoning,
      ai_cfo_cast: entry.aiCfoCast,
      ai_risk_score: entry.aiRiskScore,
      ai_confidence: entry.aiConfidence,
      ai_cost_inr: entry.aiCostInr,
      upsell_item: entry.upsellItem,
      upsell_original_inr: entry.upsellOriginalInr ?? null,
      sanity_result: entry.sanityResult,
      policy_result: entry.policyResult,
      confidence_result: entry.confidenceResult ?? null,
      rule_checker_verdict: entry.ruleCheckerVerdict,
      which_rule_triggered: entry.whichRuleTriggered,
      status: entry.status,
      razorpay_order_id: entry.razorpayOrderId ?? null,
      razorpay_amount: entry.razorpayAmount ?? null,
      failure_reason: entry.failureReason ?? null,
      is_anomaly: entry.isAnomaly,
      is_villain: entry.isVillain ?? false,
      webhook_fired: entry.webhookFired ?? false,
    });
    if (error) console.error("[Supabase sync] Insert error:", error.message);
    else console.log("[Supabase sync] ✅ Synced entry", entry.id);
  } catch (err) {
    console.error("[Supabase sync] Network error:", err);
  }
}

async function syncPolicyToSupabase(policy: PolicyConfig) {
  try {
    const { error } = await supabase.from("policies").upsert({
      id: "default",
      margin_floor_pct: policy.minMarginFloor,
      daily_total_cap: policy.dailyTotalCap,
      max_discount_per_customer: policy.perCustomerCap,
      max_discount_pct: policy.maxDiscountPct,
      confidence_threshold: policy.confidenceThreshold,
      updated_at: new Date().toISOString(),
    });
    if (error) console.error("[Supabase sync] Policy update error:", error.message);
  } catch (err) {
    console.error("[Supabase sync] Policy network error:", err);
  }
}

async function fetchPolicyFromSupabase(): Promise<Partial<PolicyConfig> | null> {
  try {
    const { data, error } = await supabase
      .from("policies")
      .select("*")
      .eq("id", "default")
      .single();
    if (error || !data) return null;
    return {
      minMarginFloor: data.margin_floor_pct,
      dailyTotalCap: data.daily_total_cap,
      perCustomerCap: data.max_discount_per_customer,
      maxDiscountPct: data.max_discount_pct,
      confidenceThreshold: data.confidence_threshold,
    };
  } catch {
    return null;
  }
}

// ─── Store class ─────────────────────────────────────────────────────────────

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
  private _discountEvents: { at: number; pct: number }[] = [];
  private _supabaseInitialized = false;

  constructor() {
    // Initialize policy from Supabase on first load (non-blocking)
    if (typeof window !== "undefined") {
      this.initFromSupabase();
    }
  }

  private async initFromSupabase() {
    if (this._supabaseInitialized) return;
    this._supabaseInitialized = true;

    // 1. Fetch the latest policy from Supabase
    const remotePolicy = await fetchPolicyFromSupabase();
    if (remotePolicy) {
      this._policy = { ...this._policy, ...remotePolicy };
      this._policySyncedAt = new Date();
      this.notify();
      console.log("[Supabase] ✅ Policy loaded from cloud");
    }

    // 2. Subscribe to real-time policy changes from the dashboard
    supabase
      .channel("policy-changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "policies", filter: "id=eq.default" },
        (payload) => {
          const d = payload.new;
          this._policy = {
            ...this._policy,
            minMarginFloor: d.margin_floor_pct,
            dailyTotalCap: d.daily_total_cap,
            perCustomerCap: d.max_discount_per_customer,
            maxDiscountPct: d.max_discount_pct,
            confidenceThreshold: d.confidence_threshold,
          };
          this._policySyncedAt = new Date();
          this.notify();
          console.log("[Supabase] 🔄 Policy updated in real-time from dashboard");
        }
      )
      .subscribe();
  }

  // ─── Policy ──────────────────────────────────────────────────────────
  get policy() { return this._policy; }
  get policySyncedAt() { return this._policySyncedAt; }
  get recentDiscountEvents() {
    const hourAgo = Date.now() - 60 * 60 * 1000;
    return this._discountEvents.filter((e) => e.at >= hourAgo);
  }
  recordDiscountEvent(pct: number) {
    this._discountEvents.push({ at: Date.now(), pct });
    this._discountEvents = this._discountEvents.slice(-40);
  }
  setPolicy(p: Partial<PolicyConfig>, synced = false) {
    this._policy = { ...this._policy, ...p };
    if (synced) this._policySyncedAt = new Date();
    // Sync policy to Supabase so the dashboard can pick it up
    syncPolicyToSupabase(this._policy);
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

  getEntryById(id: string): AuditEntry | undefined {
    return this.entries.find(e => e.id === id);
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
      this._trustScore = Math.min(100, this._trustScore + 3);
      this.recordDiscountEvent(entry.aiProposedDiscountPct);
    }

    const custKey = "session_customer";
    const current = this._customerDiscounts.get(custKey) || 0;
    if (entry.status === "auto_approved" || entry.status === "approved_by_human") {
      this._customerDiscounts.set(custKey, current + entry.aiProposedDiscount);
    }

    if (entry.status === "escalated" || entry.status === "pending_approval") {
      this._trustScore = Math.max(0, this._trustScore - 2);
    }
    if (entry.status === "caught_anomaly" || entry.status === "villain_blocked") {
      this._trustScore = Math.max(0, this._trustScore - 10);
    }
    if (entry.status === "api_failure") {
      this._trustScore = Math.max(0, this._trustScore - 1);
    }

    // ── Sync to Supabase ──
    syncEntryToSupabase(entry);

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
      // Sync updated status to Supabase
      syncEntryToSupabase(entry);
      this.notify();
    }
  }

  rejectEntry(id: string) {
    const entry = this.entries.find(e => e.id === id);
    if (entry && entry.status === "pending_approval") {
      entry.status = "rejected";
      this._trustScore = Math.max(0, this._trustScore - 2);
      // Sync updated status to Supabase
      syncEntryToSupabase(entry);
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

export function genId() {
  return "dec_" + Math.random().toString(36).substr(2, 9) + "_" + Date.now().toString(36);
}

/** Fire escalation webhook stub (Slack-style ping) + mobile approve deep link. */
export async function fireEscalationWebhook(opts: {
  decisionId: string;
  title: string;
  reason: string;
  confidence: number;
  discountPct: number;
}) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const approveUrl = `${origin}/approve/${opts.decisionId}`;
  const payload = {
    channel: "#merchant-approvals",
    username: "Profit Pilot",
    text: `⚠️ Escalation needs your approval\n• ${opts.title}\n• ${opts.discountPct}% off\n• Confidence: ${opts.confidence}%\n• Why: ${opts.reason}\n• Approve on phone: ${approveUrl}`,
    decisionId: opts.decisionId,
    approveUrl,
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
