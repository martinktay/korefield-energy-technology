/** @file corporate/billing/page.tsx — Billing and invoicing for corporate partners. */
"use client";

const mockInvoices = [
  { id: "INV-2026-001", date: "2026-01-15", amount: "$12,500", learners: 5, status: "Paid" },
  { id: "INV-2026-002", date: "2026-02-15", amount: "$12,500", learners: 5, status: "Paid" },
  { id: "INV-2026-003", date: "2026-03-15", amount: "$15,000", learners: 6, status: "Pending" },
];

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-heading-lg text-surface-900">Billing</h1>
      <p className="text-body-sm text-surface-500">View invoices and payment history for your sponsored learner program.</p>
      <div className="rounded-card border border-surface-200 bg-surface-0 shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-body-sm">
            <thead className="border-b border-surface-200 bg-surface-50">
              <tr>
                <th className="px-4 py-3 text-surface-600 font-medium">Invoice</th>
                <th className="px-4 py-3 text-surface-600 font-medium">Date</th>
                <th className="px-4 py-3 text-surface-600 font-medium">Learners</th>
                <th className="px-4 py-3 text-surface-600 font-medium">Amount</th>
                <th className="px-4 py-3 text-surface-600 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200">
              {mockInvoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="px-4 py-3 text-surface-900 font-mono text-caption">{inv.id}</td>
                  <td className="px-4 py-3 text-surface-700">{inv.date}</td>
                  <td className="px-4 py-3 text-surface-700">{inv.learners}</td>
                  <td className="px-4 py-3 text-surface-900 font-medium">{inv.amount}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-caption ${inv.status === "Paid" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                      {inv.status}
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
