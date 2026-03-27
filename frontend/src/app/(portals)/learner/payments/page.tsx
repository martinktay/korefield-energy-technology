/** @file learner/payments/page.tsx — Payment management page showing installment schedule, grace period alerts, and payment actions. */
"use client";

import { useState } from "react";
import { X } from "lucide-react";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

const FALLBACK_PLAN = {
  id: "PAY-abc123",
  track: "AI Engineering and Intelligent Systems",
  plan: "3-pay" as const,
  totalAmount: "₦450,000",
  currency: "NGN",
  installments: [
    { id: "IST-001", amount: "₦180,000", dueDate: "2025-01-15", status: "paid" as const },
    { id: "IST-002", amount: "₦135,000", dueDate: "2025-04-15", status: "pending" as const },
    { id: "IST-003", amount: "₦135,000", dueDate: "2025-07-15", status: "pending" as const },
  ],
  gracePeriodActive: false,
  accessPaused: false,
};

const statusStyles = {
  paid: "bg-accent-100 text-accent-700",
  pending: "bg-surface-100 text-surface-600",
  overdue: "bg-red-50 text-status-error",
  paused: "bg-surface-200 text-surface-500",
} as const;

interface PaymentPlan {
  id: string;
  track: string;
  plan: string;
  totalAmount: string;
  currency: string;
  installments: { id: string; amount: string; dueDate: string; status: keyof typeof statusStyles }[];
  gracePeriodActive: boolean;
  accessPaused: boolean;
}

export default function PaymentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "learner", "payments"],
    queryFn: () => apiFetch<PaymentPlan | null>("/dashboard/learner/payments"),
  });
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [payProcessing, setPayProcessing] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);
  const [pauseConfirmed, setPauseConfirmed] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-surface-200" />
        <div className="h-40 animate-pulse rounded-card bg-surface-200" />
        <div className="h-48 animate-pulse rounded-card bg-surface-200" />
      </div>
    );
  }

  const paymentPlan = data ?? FALLBACK_PLAN;

  return (
    <div className="space-y-6">
      <h1 className="text-heading-lg text-surface-900">Payments</h1>

      {/* Payment summary */}
      <div className="rounded-card border border-surface-200 bg-surface-0 p-4 shadow-card">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-heading-sm text-surface-900">{paymentPlan.track}</h2>
            <p className="text-body-sm text-surface-500 mt-1">
              Plan: {paymentPlan.plan === "3-pay" ? "3 installments (40/30/30)" : paymentPlan.plan} · Total: {paymentPlan.totalAmount}
            </p>
          </div>
          <span className="text-caption text-surface-400">{paymentPlan.id}</span>
        </div>

        {paymentPlan.gracePeriodActive && (
          <div className="mt-3 rounded-lg bg-yellow-50 border border-yellow-200 px-3 py-2 text-body-sm text-yellow-800" role="alert">
            Grace period active — please complete your payment to maintain access.
          </div>
        )}

        {paymentPlan.accessPaused && (
          <div className="mt-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-body-sm text-status-error" role="alert">
            Access paused due to overdue payment. Your progress is preserved.
          </div>
        )}
      </div>

      {/* Installment schedule */}
      <section aria-labelledby="installments-heading">
        <h2 id="installments-heading" className="text-heading-sm text-surface-900 mb-3">
          Installment Schedule
        </h2>
        <div className="rounded-card border border-surface-200 bg-surface-0 shadow-card overflow-hidden">
          <table className="w-full text-body-sm">
            <thead>
              <tr className="border-b border-surface-200 bg-surface-50">
                <th className="px-4 py-2 text-left text-caption font-medium text-surface-600">Installment</th>
                <th className="px-4 py-2 text-left text-caption font-medium text-surface-600">Amount</th>
                <th className="px-4 py-2 text-left text-caption font-medium text-surface-600">Due Date</th>
                <th className="px-4 py-2 text-left text-caption font-medium text-surface-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200">
              {paymentPlan.installments.map((inst, i) => (
                <tr key={inst.id}>
                  <td className="px-4 py-3 text-surface-700">Payment {i + 1}</td>
                  <td className="px-4 py-3 text-surface-900 font-medium">{inst.amount}</td>
                  <td className="px-4 py-3 text-surface-600">{inst.dueDate}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-caption ${statusStyles[inst.status] ?? "bg-surface-100 text-surface-600"}`}>
                      {inst.status.charAt(0).toUpperCase() + inst.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Actions */}
      <div className="flex gap-3">
        <button type="button" onClick={() => { setPayDialogOpen(true); setPayProcessing(false); setPaySuccess(false); }} className="rounded-lg bg-brand-600 px-4 py-2 text-body-sm font-medium text-white hover:bg-brand-700 transition-colors">
          Make Payment
        </button>
        <button type="button" onClick={() => { setPauseDialogOpen(true); setPauseConfirmed(false); }} className="rounded-lg border border-surface-300 px-4 py-2 text-body-sm text-surface-700 hover:bg-surface-100 transition-colors">
          Pause Payments
        </button>
      </div>

      {/* ── Make Payment Dialog ── */}
      {payDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-surface-950/50" onClick={() => setPayDialogOpen(false)} />
          <div className="relative w-full max-w-md mx-4 rounded-card border border-surface-200 bg-surface-0 shadow-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
              <h2 className="text-heading-sm text-surface-900">Make Payment</h2>
              <button onClick={() => setPayDialogOpen(false)} className="p-1 rounded-lg text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-colors" aria-label="Close dialog">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {paySuccess ? (
                <div className="text-center py-4">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-3">
                    <span className="text-xl text-green-600">✓</span>
                  </div>
                  <p className="text-body-sm font-medium text-surface-900">Payment successful</p>
                  <p className="mt-1 text-caption text-surface-500">Your payment has been processed.</p>
                  <button type="button" onClick={() => setPayDialogOpen(false)} className="mt-4 rounded-lg bg-brand-600 px-4 py-2.5 text-body-sm font-medium text-white hover:bg-brand-700 transition-colors">Done</button>
                </div>
              ) : (
                <>
                  <p className="text-body-sm text-surface-600">Select a payment method for your next installment.</p>
                  <fieldset className="space-y-2">
                    <legend className="text-body-sm font-medium text-surface-700 mb-1.5">Payment Method</legend>
                    <label className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${paymentMethod === "card" ? "border-brand-500 bg-brand-50" : "border-surface-200"}`}>
                      <input type="radio" name="pay-method" value="card" checked={paymentMethod === "card"} onChange={() => setPaymentMethod("card")} className="accent-brand-600" />
                      <span className="text-body-sm text-surface-900">Card ending in ****1234</span>
                    </label>
                    <label className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${paymentMethod === "bank" ? "border-brand-500 bg-brand-50" : "border-surface-200"}`}>
                      <input type="radio" name="pay-method" value="bank" checked={paymentMethod === "bank"} onChange={() => setPaymentMethod("bank")} className="accent-brand-600" />
                      <span className="text-body-sm text-surface-900">Bank transfer</span>
                    </label>
                  </fieldset>
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button type="button" onClick={() => setPayDialogOpen(false)} className="rounded-lg border border-surface-300 px-4 py-2.5 text-body-sm font-medium text-surface-700 hover:bg-surface-100 transition-colors">Cancel</button>
                    <button type="button" disabled={payProcessing} onClick={() => { setPayProcessing(true); setTimeout(() => { setPayProcessing(false); setPaySuccess(true); }, 1500); }} className="rounded-lg bg-brand-600 px-4 py-2.5 text-body-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
                      {payProcessing ? "Processing..." : "Confirm Payment"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Pause Payments Dialog ── */}
      {pauseDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-surface-950/50" onClick={() => setPauseDialogOpen(false)} />
          <div className="relative w-full max-w-md mx-4 rounded-card border border-surface-200 bg-surface-0 shadow-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
              <h2 className="text-heading-sm text-surface-900">Pause Payments</h2>
              <button onClick={() => setPauseDialogOpen(false)} className="p-1 rounded-lg text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-colors" aria-label="Close dialog">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {pauseConfirmed ? (
                <div className="text-center py-4">
                  <p className="text-body-sm font-medium text-surface-900">Payments paused</p>
                  <p className="mt-1 text-caption text-surface-500">Your access will be limited until payments resume.</p>
                  <button type="button" onClick={() => setPauseDialogOpen(false)} className="mt-4 rounded-lg bg-brand-600 px-4 py-2.5 text-body-sm font-medium text-white hover:bg-brand-700 transition-colors">Done</button>
                </div>
              ) : (
                <>
                  <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3 text-body-sm text-yellow-800">
                    Are you sure you want to pause? Your access will be limited.
                  </div>
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button type="button" onClick={() => setPauseDialogOpen(false)} className="rounded-lg border border-surface-300 px-4 py-2.5 text-body-sm font-medium text-surface-700 hover:bg-surface-100 transition-colors">Cancel</button>
                    <button type="button" onClick={() => setPauseConfirmed(true)} className="rounded-lg bg-red-600 px-4 py-2.5 text-body-sm font-medium text-white hover:bg-red-700 transition-colors">Confirm Pause</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
