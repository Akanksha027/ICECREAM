"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuditStore, auditStore, type AuditEntry } from "@/lib/auditStore";

function StatusBadge({ status }: { status: AuditEntry["status"] }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    auto_approved: { bg: "bg-green-100", text: "text-green-700", label: "Auto-Approved" },
    approved_by_human: { bg: "bg-blue-100", text: "text-blue-700", label: "Human Approved" },
    escalated: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Escalated" },
    pending_approval: { bg: "bg-orange-100", text: "text-orange-700", label: "Pending Approval" },
    rejected: { bg: "bg-red-100", text: "text-red-700", label: "Rejected" },
    caught_anomaly: { bg: "bg-purple-100", text: "text-purple-700", label: "Anomaly Caught" },
    api_failure: { bg: "bg-gray-100", text: "text-gray-700", label: "API Failure" },
    villain_blocked: { bg: "bg-red-100", text: "text-red-700", label: "Manipulation Blocked" },
  };
  const s = map[status] || map.rejected;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

function TrustMeter({ score }: { score: number }) {
  const color = score >= 70 ? "bg-green-500" : score >= 40 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-bold uppercase tracking-wider text-brown/60">Trust</span>
      <div className="h-2 w-20 rounded-full bg-gray-200 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-bold text-brown">{score}</span>
    </div>
  );
}

function EntryRow({ entry }: { entry: AuditEntry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-black/5 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <StatusBadge status={entry.status} />
            <span className="text-[10px] text-brown/40">
              {entry.timestamp.toLocaleTimeString()}
            </span>
          </div>
          <p className="text-xs font-medium text-brown truncate">
            {entry.upsellItem} — {entry.aiProposedDiscountPct}% off
          </p>
        </div>
        <span className="text-brown/30 text-sm">{expanded ? "▲" : "▼"}</span>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-2 border-t border-black/5 pt-3">
              {/* Cart context */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-brown/40 mb-1">Cart</p>
                <p className="text-xs text-brown">{entry.cartItems.join(", ")} — ${entry.cartTotal.toFixed(2)}</p>
              </div>

              {/* AI reasoning */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-brown/40 mb-1">AI Reasoning</p>
                <p className="text-xs text-brown/80 leading-relaxed">{entry.aiReasoning}</p>
              </div>

              {/* CFO Cast */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-brown/40 mb-1">CFO Analysis</p>
                <p className="text-xs text-brown/80 italic">{entry.aiCfoCast}</p>
              </div>

              {/* Rule-checker verdict */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-brown/40 mb-1">Rule-Checker</p>
                <p className="text-xs text-brown/80">
                  <span className={`font-bold ${entry.ruleCheckerVerdict === "passed" ? "text-green-600" : entry.ruleCheckerVerdict === "escalated" ? "text-yellow-600" : "text-red-600"}`}>
                    {entry.ruleCheckerVerdict.toUpperCase()}
                  </span>
                  {" — "}{entry.whichRuleTriggered}
                </p>
              </div>

              {/* Razorpay ID */}
              {entry.razorpayOrderId && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-brown/40 mb-1">Razorpay Order</p>
                  <p className="text-xs font-mono text-blue-600">{entry.razorpayOrderId}</p>
                </div>
              )}

              {/* Failure */}
              {entry.failureReason && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-brown/40 mb-1">Failure</p>
                  <p className="text-xs text-red-600">{entry.failureReason}</p>
                </div>
              )}

              {/* Risk score */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brown/40">Risk</span>
                <div className="h-1.5 w-16 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${entry.aiRiskScore > 60 ? "bg-red-400" : entry.aiRiskScore > 30 ? "bg-yellow-400" : "bg-green-400"}`}
                    style={{ width: `${entry.aiRiskScore}%` }}
                  />
                </div>
                <span className="text-[10px] text-brown/60">{entry.aiRiskScore}</span>
              </div>

              {/* Approval buttons for pending items */}
              {entry.status === "pending_approval" && (
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); auditStore.approveEntry(entry.id); }}
                    className="flex-1 rounded-full bg-green-500 text-white py-2 text-xs font-bold hover:bg-green-600 transition-all"
                  >
                    ✓ Approve & Process
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); auditStore.rejectEntry(entry.id); }}
                    className="flex-1 rounded-full bg-red-500 text-white py-2 text-xs font-bold hover:bg-red-600 transition-all"
                  >
                    ✕ Reject
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AuditDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const store = useAuditStore();

  return (
    <>
      {/* Floating Audit Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-40 flex items-center gap-2 rounded-full bg-brown text-white px-4 py-3 shadow-xl hover:scale-105 transition-transform text-xs font-bold"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
          <path d="M14 2v6h6" />
          <path d="M16 13H8" />
          <path d="M16 17H8" />
          <path d="M10 9H8" />
        </svg>
        Audit Trail
        {store.totalDecisions > 0 && (
          <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[10px]">
            {store.totalDecisions}
          </span>
        )}
        {store.pendingApprovals.length > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold animate-pulse">
            {store.pendingApprovals.length}
          </span>
        )}
      </button>

      {/* Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-full max-w-md border-r border-white/20 bg-[#FDF6F5] shadow-2xl overflow-y-auto flex flex-col"
            >
              {/* Header */}
              <div className="sticky top-0 z-10 bg-[#FDF6F5] border-b border-brown/10 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-xl font-semibold text-brown">Profit Pilot — Audit Trail</h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="rounded-full bg-white p-2 text-brown shadow-sm hover:bg-gray-50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </button>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                  <div className="rounded-lg bg-green-50 p-2 text-center">
                    <p className="text-lg font-bold text-green-700">{store.stats.approved}</p>
                    <p className="text-[9px] uppercase tracking-wider text-green-600">Approved</p>
                  </div>
                  <div className="rounded-lg bg-yellow-50 p-2 text-center">
                    <p className="text-lg font-bold text-yellow-700">{store.stats.escalated}</p>
                    <p className="text-[9px] uppercase tracking-wider text-yellow-600">Escalated</p>
                  </div>
                  <div className="rounded-lg bg-red-50 p-2 text-center">
                    <p className="text-lg font-bold text-red-700">{store.stats.blocked}</p>
                    <p className="text-[9px] uppercase tracking-wider text-red-600">Blocked</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2 text-center">
                    <p className="text-lg font-bold text-gray-700">{store.stats.failed}</p>
                    <p className="text-[9px] uppercase tracking-wider text-gray-600">Failed</p>
                  </div>
                </div>

                {/* Revenue + Trust */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-brown/40">Revenue Recovered</p>
                    <p className="text-lg font-bold text-green-600">₹{store.revenueRecovered.toLocaleString()}</p>
                  </div>
                  <TrustMeter score={store.trustScore} />
                </div>

                {/* Budget bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-[10px] text-brown/50 mb-1">
                    <span>Budget: ₹{store.budgetUsed.toFixed(0)} / ₹{store.policy.dailyTotalCap}</span>
                    <span>₹{store.budgetRemaining.toFixed(0)} left</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#DA758C] transition-all duration-500"
                      style={{ width: `${Math.min(100, (store.budgetUsed / store.policy.dailyTotalCap) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Entries */}
              <div className="flex-1 p-4 space-y-3">
                {store.entries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-center opacity-50">
                    <p className="text-sm font-medium text-brown">No decisions yet</p>
                    <p className="text-xs text-brown/60 mt-1">Complete a checkout to see the audit trail</p>
                  </div>
                ) : (
                  store.entries.map((entry) => (
                    <EntryRow key={entry.id} entry={entry} />
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
