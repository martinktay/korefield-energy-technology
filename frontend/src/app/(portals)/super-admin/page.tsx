"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import {
  DollarSign,
  Users,
  GraduationCap,
  TrendingUp,
  Activity,
  Globe,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

const FALLBACK_KPIS = [
  { label: "Total Revenue (MTD)", value: "$12,450", change: "+18%", trend: "up", Icon: DollarSign, color: "text-accent-600", bg: "bg-accent-50" },
  { label: "Active Learners", value: "10", change: "+3 this week", trend: "up", Icon: Users, color: "text-brand-600", bg: "bg-brand-50" },
  { label: "Certifications (YTD)", value: "1", change: "100% pass rate", trend: "up", Icon: GraduationCap, color: "text-purple-600", bg: "bg-purple-50" },
  { label: "Foundation Conversion", value: "80%", change: "+5% vs last month", trend: "up", Icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50" },
  { label: "Platform Uptime", value: "99.97%", change: "0 incidents", trend: "up", Icon: Activity, color: "text-accent-600", bg: "bg-accent-50" },
  { label: "Countries Reached", value: "6", change: "+2 this quarter", trend: "up", Icon: Globe, color: "text-brand-600", bg: "bg-brand-50" },
];

const FALLBACK_FINANCIAL = {
  revenueToday: "$1,240",
  revenueWeek: "$4,850",
  revenueMonth: "$12,450",
  revenueQuarter: "$34,200",
  outstandingBalance: "$3,600",
  overdueAmount: "$800",
  collectionRate: "94%",
  avgRevenuePerLearner: "$1,245",
  scholarshipDiscounts: "$1,200",
  installmentCompletionRate: "88%",
};

const FALLBACK_BUSINESS = [
  { metric: "Customer Acquisition Cost", value: "$0", note: "Organic only (no paid ads)" },
  { metric: "Lifetime Value (LTV)", value: "$1,245", note: "Avg revenue per enrolled learner" },
  { metric: "Churn Rate", value: "5%", note: "Learners who paused or dropped" },
  { metric: "Net Promoter Score", value: "—", note: "Survey not yet deployed" },
  { metric: "Time to First Certification", value: "9 months", note: "Avg across all tracks" },
  { metric: "Pod Completion Rate", value: "78%", note: "Pods that delivered all milestones" },
];

const FALLBACK_REVENUE_TREND = [
  { period: "Oct 2025", revenue: 2400 },
  { period: "Nov 2025", revenue: 3100 },
  { period: "Dec 2025", revenue: 4800 },
  { period: "Jan 2026", revenue: 6200 },
  { period: "Feb 2026", revenue: 9800 },
  { period: "Mar 2026", revenue: 12450 },
];

const quickLinks = [
  { label: "Revenue", href: "/super-admin/revenue" },
  { label: "Enrollment", href: "/super-admin/enrollment" },
  { label: "Academic", href: "/super-admin/academic" },
  { label: "Platform", href: "/super-admin/platform" },
  { label: "AI Agents", href: "/super-admin/ai" },
  { label: "Market", href: "/super-admin/market" },
];

interface KPI {
  label: string; value: string; change: string;
}

export default function SuperAdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "super-admin"],
    queryFn: () => apiFetch<KPI[]>("/dashboard/super-admin"),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 skeleton rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-28 skeleton rounded-xl" />)}
        </div>
      </div>
    );
  }

  const financial = FALLBACK_FINANCIAL;
  const business = FALLBACK_BUSINESS;
  const revenueTrend = FALLBACK_REVENUE_TREND;
  const maxRevenue = Math.max(...revenueTrend.map((r) => r.revenue));

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-display-sm text-surface-900">Executive Dashboard</h1>
          <p className="mt-1 text-body-lg text-surface-500">Platform-wide KPIs, financial analytics, and business performance.</p>
        </div>
      </div>

      {/* Quick Nav */}
      <div className="flex flex-wrap gap-2">
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href} className="rounded-xl border border-surface-200 px-3 py-1.5 text-caption font-medium text-surface-600 hover:bg-surface-50 hover:border-surface-300 transition-all">
            {link.label}
          </Link>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
        {FALLBACK_KPIS.map((kpi) => {
          const Icon = kpi.Icon;
          return (
            <div key={kpi.label} className="rounded-xl border border-surface-200 bg-surface-0 p-5 shadow-card hover:shadow-card-hover transition-all">
              <div className="flex items-center justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${kpi.bg}`}>
                  <Icon className={`h-5 w-5 ${kpi.color}`} aria-hidden="true" />
                </div>
                {kpi.change && (
                  <span className="flex items-center gap-0.5 text-caption font-medium text-accent-600">
                    {kpi.trend === "up" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {kpi.change}
                  </span>
                )}
              </div>
              <p className="mt-3 text-heading-sm font-bold text-surface-900">{kpi.value}</p>
              <p className="text-caption text-surface-500 mt-0.5">{kpi.label}</p>
            </div>
          );
        })}
      </div>

      {/* Financial Analytics */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-heading-sm text-surface-900">Financial Analytics</h2>
          <Link href="/super-admin/revenue" className="flex items-center gap-1 text-body-sm text-brand-600 hover:text-brand-700 transition-colors font-medium">
            Full report <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Today", value: financial.revenueToday },
            { label: "This Week", value: financial.revenueWeek },
            { label: "This Month", value: financial.revenueMonth },
            { label: "This Quarter", value: financial.revenueQuarter },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-surface-200 bg-surface-0 p-4 shadow-card">
              <p className="text-caption text-surface-400">{item.label}</p>
              <p className="text-heading-sm font-bold text-surface-900 mt-1">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Revenue Trend (bar chart) */}
        <div className="mt-4 rounded-xl border border-surface-200 bg-surface-0 p-5 shadow-card">
          <p className="text-body-sm font-medium text-surface-900 mb-4">Revenue Trend (6 months)</p>
          <div className="flex items-end gap-3" style={{ height: 160 }}>
            {revenueTrend.map((r) => {
              const barHeight = Math.max(4, (r.revenue / maxRevenue) * 140);
              return (
                <div key={r.period} className="flex-1 flex flex-col items-center justify-end h-full">
                  <span className="text-caption text-surface-500 mb-1">${(r.revenue / 1000).toFixed(1)}k</span>
                  <div className="w-full rounded-t-lg bg-brand-500 transition-all" style={{ height: barHeight }} />
                  <span className="text-[10px] text-surface-400 mt-1">{r.period.split(" ")[0]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Financial Health Metrics */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Outstanding Balance", value: financial.outstandingBalance, color: "text-amber-600" },
            { label: "Overdue Amount", value: financial.overdueAmount, color: "text-status-error" },
            { label: "Collection Rate", value: financial.collectionRate, color: "text-accent-600" },
            { label: "Avg Revenue / Learner", value: financial.avgRevenuePerLearner, color: "text-brand-600" },
            { label: "Scholarship Discounts", value: financial.scholarshipDiscounts, color: "text-purple-600" },
            { label: "Installment Completion", value: financial.installmentCompletionRate, color: "text-accent-600" },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-surface-200 bg-surface-0 p-4 shadow-card">
              <p className="text-caption text-surface-400">{item.label}</p>
              <p className={`text-heading-sm font-bold mt-1 ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Business Performance */}
      <section>
        <h2 className="text-heading-sm text-surface-900 mb-4">Business Performance</h2>
        <div className="rounded-xl border border-surface-200 bg-surface-0 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-body-sm">
              <thead className="border-b border-surface-200 bg-surface-50">
                <tr>
                  <th className="px-5 py-3 text-surface-600 font-medium">Metric</th>
                  <th className="px-5 py-3 text-surface-600 font-medium">Value</th>
                  <th className="px-5 py-3 text-surface-600 font-medium">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {business.map((b) => (
                  <tr key={b.metric} className="hover:bg-surface-50 transition-colors">
                    <td className="px-5 py-3 text-surface-900 font-medium">{b.metric}</td>
                    <td className="px-5 py-3 text-surface-900 font-bold">{b.value}</td>
                    <td className="px-5 py-3 text-surface-500">{b.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
