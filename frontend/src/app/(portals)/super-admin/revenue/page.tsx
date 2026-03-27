"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { DollarSign, TrendingUp, AlertCircle, ArrowUpRight } from "lucide-react";

const FALLBACK_BY_TRACK = [
  { track: "AI Engineering", revenue: "₦4,200,000", enrollments: 4, overdueRate: "0%", avgPerLearner: "₦1,050,000" },
  { track: "Data Science", revenue: "₦1,800,000", enrollments: 2, overdueRate: "0%", avgPerLearner: "₦900,000" },
  { track: "Cybersecurity", revenue: "$1,200 / KES 45,000", enrollments: 2, overdueRate: "0%", avgPerLearner: "$600" },
  { track: "AI Product Leadership", revenue: "GHS 8,500 / ₦950,000", enrollments: 2, overdueRate: "5%", avgPerLearner: "GHS 4,250" },
];

const FALLBACK_BY_REGION = [
  { region: "Nigeria (NGN)", revenue: "₦6,950,000", share: "45%", learners: 6, currency: "NGN" },
  { region: "Ghana (GHS)", revenue: "GHS 12,800", share: "20%", learners: 2, currency: "GHS" },
  { region: "Kenya (KES)", revenue: "KES 45,000", share: "12%", learners: 1, currency: "KES" },
  { region: "Senegal (XOF)", revenue: "XOF 380,000", share: "10%", learners: 1, currency: "XOF" },
  { region: "Zimbabwe (USD)", revenue: "$850", share: "8%", learners: 1, currency: "USD" },
  { region: "South Africa (ZAR)", revenue: "ZAR 4,200", share: "5%", learners: 1, currency: "ZAR" },
];

const FALLBACK_PAYMENT_HEALTH = [
  { metric: "Total Outstanding", value: "$3,600", status: "warning" },
  { metric: "Overdue (>30 days)", value: "$800", status: "error" },
  { metric: "Collection Rate", value: "94%", status: "success" },
  { metric: "Avg Days to Payment", value: "12 days", status: "success" },
  { metric: "Installment Completion", value: "88%", status: "success" },
  { metric: "Scholarship Utilization", value: "$1,200 / $5,000", status: "info" },
];

const FALLBACK_PLAN_BREAKDOWN = [
  { plan: "Full Payment", count: 4, revenue: "$4,320", share: "35%" },
  { plan: "2-Pay Installment", count: 3, revenue: "$3,990", share: "32%" },
  { plan: "3-Pay Installment", count: 3, revenue: "$4,140", share: "33%" },
];

const FALLBACK_MONTHLY = [
  { month: "Oct 2025", revenue: 2400, newEnrollments: 2, payments: 3 },
  { month: "Nov 2025", revenue: 3100, newEnrollments: 1, payments: 4 },
  { month: "Dec 2025", revenue: 4800, newEnrollments: 3, payments: 6 },
  { month: "Jan 2026", revenue: 6200, newEnrollments: 2, payments: 5 },
  { month: "Feb 2026", revenue: 9800, newEnrollments: 4, payments: 8 },
  { month: "Mar 2026", revenue: 12450, newEnrollments: 3, payments: 10 },
];

interface RevenueData {
  revenueByTrack: { track: string; revenue: string; enrollments: number; overdueRate: string }[];
  revenueByRegion: { region: string; revenue: string; share: string }[];
}

export default function RevenuePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "super-admin", "revenue"],
    queryFn: () => apiFetch<RevenueData>("/dashboard/super-admin/revenue"),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 skeleton rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-24 skeleton rounded-xl" />)}
        </div>
      </div>
    );
  }

  const revenueByTrack = FALLBACK_BY_TRACK;
  const revenueByRegion = FALLBACK_BY_REGION;
  const paymentHealth = FALLBACK_PAYMENT_HEALTH;
  const planBreakdown = FALLBACK_PLAN_BREAKDOWN;
  const monthly = FALLBACK_MONTHLY;
  const maxMonthly = Math.max(...monthly.map((m) => m.revenue));

  const statusColors: Record<string, string> = {
    success: "text-accent-600",
    warning: "text-amber-600",
    error: "text-status-error",
    info: "text-brand-600",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-display-sm text-surface-900">Revenue Intelligence</h1>
        <p className="mt-1 text-body-lg text-surface-500">Financial performance, payment health, and revenue breakdown by track, region, and payment plan.</p>
      </div>

      {/* Payment Health Cards */}
      <section>
        <h2 className="text-heading-sm text-surface-900 mb-4">Payment Health</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
          {paymentHealth.map((item) => (
            <div key={item.metric} className="rounded-xl border border-surface-200 bg-surface-0 p-4 shadow-card">
              <p className="text-caption text-surface-400">{item.metric}</p>
              <p className={`text-heading-sm font-bold mt-1 ${statusColors[item.status] || "text-surface-900"}`}>{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Monthly Revenue Trend */}
      <section>
        <h2 className="text-heading-sm text-surface-900 mb-4">Monthly Revenue Trend</h2>
        <div className="rounded-xl border border-surface-200 bg-surface-0 p-5 shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-body-sm">
              <thead className="border-b border-surface-200 bg-surface-50">
                <tr>
                  <th className="px-4 py-3 text-surface-600 font-medium">Month</th>
                  <th className="px-4 py-3 text-surface-600 font-medium">Revenue</th>
                  <th className="px-4 py-3 text-surface-600 font-medium">Trend</th>
                  <th className="px-4 py-3 text-surface-600 font-medium">New Enrollments</th>
                  <th className="px-4 py-3 text-surface-600 font-medium">Payments Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {monthly.map((m, i) => {
                  const prev = i > 0 ? monthly[i - 1].revenue : m.revenue;
                  const growth = prev > 0 ? Math.round(((m.revenue - prev) / prev) * 100) : 0;
                  return (
                    <tr key={m.month} className="hover:bg-surface-50 transition-colors">
                      <td className="px-4 py-3 text-surface-900 font-medium">{m.month}</td>
                      <td className="px-4 py-3 text-surface-900 font-bold">${m.revenue.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 rounded-full bg-surface-100 overflow-hidden">
                            <div className="h-1.5 rounded-full bg-brand-500" style={{ width: `${(m.revenue / maxMonthly) * 100}%` }} />
                          </div>
                          {i > 0 && (
                            <span className={`flex items-center gap-0.5 text-caption font-medium ${growth >= 0 ? "text-accent-600" : "text-status-error"}`}>
                              {growth >= 0 ? <ArrowUpRight className="h-3 w-3" /> : null}
                              {growth >= 0 ? "+" : ""}{growth}%
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-surface-700">{m.newEnrollments}</td>
                      <td className="px-4 py-3 text-surface-700">{m.payments}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Payment Plan Breakdown */}
      <section>
        <h2 className="text-heading-sm text-surface-900 mb-4">Payment Plan Distribution</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {planBreakdown.map((p) => (
            <div key={p.plan} className="rounded-xl border border-surface-200 bg-surface-0 p-5 shadow-card">
              <p className="text-body-sm font-medium text-surface-900">{p.plan}</p>
              <p className="text-heading-sm font-bold text-surface-900 mt-2">{p.revenue}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-caption text-surface-400">{p.count} learners</span>
                <span className="text-caption font-medium text-brand-600">{p.share}</span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-surface-100 overflow-hidden">
                <div className="h-1.5 rounded-full bg-brand-500" style={{ width: p.share }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Revenue by Track */}
      <section>
        <h2 className="text-heading-sm text-surface-900 mb-4">Revenue by Track</h2>
        <div className="rounded-xl border border-surface-200 bg-surface-0 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-body-sm">
              <thead className="border-b border-surface-200 bg-surface-50">
                <tr>
                  <th className="px-5 py-3 text-surface-600 font-medium">Track</th>
                  <th className="px-5 py-3 text-surface-600 font-medium">Revenue</th>
                  <th className="px-5 py-3 text-surface-600 font-medium">Enrollments</th>
                  <th className="px-5 py-3 text-surface-600 font-medium">Avg / Learner</th>
                  <th className="px-5 py-3 text-surface-600 font-medium">Overdue Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {revenueByTrack.map((r) => (
                  <tr key={r.track} className="hover:bg-surface-50 transition-colors">
                    <td className="px-5 py-3 text-surface-900 font-medium">{r.track}</td>
                    <td className="px-5 py-3 text-surface-900 font-bold">{r.revenue}</td>
                    <td className="px-5 py-3 text-surface-700">{r.enrollments}</td>
                    <td className="px-5 py-3 text-surface-700">{r.avgPerLearner}</td>
                    <td className="px-5 py-3">
                      <span className={r.overdueRate === "0%" ? "text-accent-600" : "text-amber-600"}>{r.overdueRate}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Revenue by Region */}
      <section>
        <h2 className="text-heading-sm text-surface-900 mb-4">Revenue by Region</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {revenueByRegion.map((r) => (
            <div key={r.region} className="rounded-xl border border-surface-200 bg-surface-0 p-4 shadow-card hover:shadow-card-hover transition-all">
              <div className="flex items-center justify-between">
                <p className="text-body-sm font-medium text-surface-900">{r.region}</p>
                <span className="text-caption font-medium text-brand-600">{r.share}</span>
              </div>
              <p className="text-heading-sm font-bold text-surface-900 mt-2">{r.revenue}</p>
              <p className="text-caption text-surface-400 mt-1">{r.learners} learner{r.learners !== 1 ? "s" : ""}</p>
              <div className="mt-2 h-1.5 w-full rounded-full bg-surface-100 overflow-hidden">
                <div className="h-1.5 rounded-full bg-brand-400" style={{ width: r.share }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
