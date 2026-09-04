"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function ApprovePage() {
  const params = useParams();
  const id = String(params.id || "");
  const [loading, setLoading] = useState(true);
  const [entry, setEntry] = useState<{
    id: string;
    status: string;
    upsellItem: string;
    discountPct: number;
    confidence: number;
    reason: string;
    cartItems: string[];
  } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState("");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/approvals/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) setError(d.error || "Not found");
        else setEntry(d.entry);
      })
      .catch(() => setError("Could not load decision"))
      .finally(() => setLoading(false));
  }, [id]);

  async function act(action: "approve" | "reject") {
    setBusy(true);
    try {
      const res = await fetch(`/api/approvals/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!data.success) setError(data.error || "Failed");
      else {
        setDone(action === "approve" ? "Approved — offer can proceed." : "Rejected — offer blocked.");
        setEntry((e) => (e ? { ...e, status: data.status } : e));
      }
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#FDF6F5] px-4 py-10 text-brown">
      <div className="mx-auto max-w-md rounded-2xl border border-brown/10 bg-white p-6 shadow-lg">
        <p className="text-[10px] font-bold uppercase tracking-widest text-brown/40">Profit Pilot · Merchant</p>
        <h1 className="mt-1 font-display text-2xl font-semibold">Approval needed</h1>
        <p className="mt-1 text-xs text-brown/50">Phone-friendly sign-off for escalated AI offers.</p>

        {loading && <p className="mt-6 text-sm">Loading…</p>}
        {error && <p className="mt-6 text-sm text-red-600">{error}</p>}
        {entry && (
          <div className="mt-6 space-y-3">
            <div className="rounded-xl bg-blush/50 p-3 text-sm">
              <p className="font-bold">{entry.upsellItem}</p>
              <p className="mt-1">{entry.discountPct}% off · confidence {entry.confidence}%</p>
              <p className="mt-2 text-[11px] text-brown/60">{entry.reason}</p>
              <p className="mt-2 text-[10px] text-brown/40">Cart: {entry.cartItems?.join(", ")}</p>
              <p className="mt-1 text-[10px] font-mono text-brown/30">Status: {entry.status}</p>
            </div>
            {done ? (
              <p className="rounded-xl bg-green-50 p-3 text-sm font-medium text-green-800">{done}</p>
            ) : entry.status === "pending_approval" ? (
              <div className="flex gap-2">
                <button
                  disabled={busy}
                  onClick={() => act("reject")}
                  className="flex-1 rounded-full bg-red-500 py-3 text-sm font-bold text-white disabled:opacity-50"
                >
                  Reject
                </button>
                <button
                  disabled={busy}
                  onClick={() => act("approve")}
                  className="flex-1 rounded-full bg-green-600 py-3 text-sm font-bold text-white disabled:opacity-50"
                >
                  Approve
                </button>
              </div>
            ) : (
              <p className="text-sm text-brown/60">Already resolved.</p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
