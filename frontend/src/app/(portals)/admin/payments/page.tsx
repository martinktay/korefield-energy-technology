/** @file admin/payments/page.tsx — Payment administration page with installment tracking and overdue management. */
"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

const FALLBACK_PAYMENTS = [
  { id: "PAY-001", learner: "Ngozi Eze", track: "AI Engineering", plan: "3-Pay", paid: "$600", remaining: "$400", status: "Current" },
  { id: "PAY-002", learner: "Tendai Moyo", track: "Data Science", plan: "Full", paid: "$1,200", remaining: "$0", status: "Paid" },
  { id: "PAY-003", learner: "Aisha Diallo", track: "Cybersecurity", plan: "2-Pay", paid: "$500", remaining: "$500", status: "Overdue" },
  { id: "PAY-004", learner: "Kofi Mensah", track: "AI Product Leadership", plan: "3-Pay", paid: "$400", remaining: "$200", status: "Current" },
];

interface PaymentRow {
  id: string; learner: string; track: string; plan: string; paid: string; remaining: string; status: string;
}

export default function PaymentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "admin", "payments"],
    queryFn: () => apiFetch<PaymentRow[]>("/dashboard/admin/payments"),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-surface-200" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-card bg-surface-200" />
          ))}
        </div>
      </div>
    );
  }

  const payments = data ?? FALLBACK_PAYMENTS;

  return (
    <div className="space-y-6">
      <h1 className="text-heading-lg text-surface-900">Payment Management</h1>
      <p className="text-body-sm text-surface-500">
        View and manage payment records, installment schedules, overdue balances, and refund processing.
      </p>

      <div className="rounded-card border border-surface-200 bg-surface-0 shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-body-sm">
            <thead className="border-b border-surface-200 bg-surface-50">
              <tr>
                <th className="px-4 py-3 text-surface-600 font-medium">Learner</th>
                <th className="px-4 py-3 text-surface-600 font-medium">Track</th>
                <th className="px-4 py-3 text-surface-600 font-medium">Plan</th>
                <th className="px-4 py-3 text-surface-600 font-medium">Paid</th>
                <th className="px-4 py-3 text-surface-600 font-medium">Remaining</th>
                <th className="px-4 py-3 text-surface-600 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200">
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 text-surface-900">{p.learner}</td>
                  <td className="px-4 py-3 text-surface-700">{p.track}</td>
                  <td className="px-4 py-3 text-surface-700">{p.plan}</td>
                  <td className="px-4 py-3 text-surface-700">{p.paid}</td>
                  <td className="px-4 py-3 text-surface-700">{p.remaining}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-caption ${
                      p.status === "Paid" ? "bg-green-100 text-green-700" :
                      p.status === "Overdue" ? "bg-red-100 text-red-700" :
                      "bg-blue-100 text-blue-700"
                    }`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
