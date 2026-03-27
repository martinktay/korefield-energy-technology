/** @file super-admin/page.tsx — Executive dashboard with platform-wide KPIs using pre-aggregated metrics. */
"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

const FALLBACK_KPIS = [
  { label: "Total Revenue (MTD)", value: "$12,450", change: "+18%" },
  { label: "Active Learners", value: "10", change: "6 countries" },
  { label: "Certifications (YTD)", value: "1", change: "Zara Mwangi" },
  { label: "Platform Uptime", value: "99.97%", change: "" },
  { label: "AI Agent Workflows", value: "347", change: "+22%" },
  { label: "Foundation Conversion", value: "80%", change: "8 of 10" },
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
        <div className="h-8 w-48 animate-pulse rounded bg-surface-200" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-card bg-surface-200" />
          ))}
        </div>
      </div>
    );
  }

  const kpis = data ?? FALLBACK_KPIS;

  return (
    <div className="space-y-6">
      <h1 className="text-heading-lg text-surface-900">Super Admin Dashboard</h1>
      <p className="text-body-sm text-surface-500">
        Executive overview across revenue, enrollment, academic, platform, AI, and market intelligence.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-card border border-surface-200 bg-surface-0 p-4 shadow-card">
            <p className="text-caption text-surface-500">{kpi.label}</p>
            <p className="text-heading-sm text-surface-900 mt-1">{kpi.value}</p>
            {kpi.change && <p className="text-caption text-green-600 mt-1">{kpi.change} vs last period</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
