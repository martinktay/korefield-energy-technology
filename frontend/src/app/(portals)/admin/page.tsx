/** @file admin/page.tsx — Admin dashboard with platform-wide metrics for users, enrollments, revenue, and certificates. */
"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

const FALLBACK_METRICS = [
  { label: "Total Users", value: "19", change: "+10 learners" },
  { label: "Active Enrollments", value: "10", change: "4 tracks" },
  { label: "Pending Payments", value: "3", change: "2 overdue" },
  { label: "Certificates Issued", value: "1", change: "Zara Mwangi" },
];

const FALLBACK_ACTIVITY = [
  { id: "1", action: "Certificate issued", user: "Zara Mwangi — KFCERT-2025-ZM7K9P", date: "2025-02-10" },
  { id: "2", action: "Enrollment created", user: "Amara Okafor — AI Product Leadership", date: "2025-01-25" },
  { id: "3", action: "New learner registered", user: "Kwame Asante — Ghana", date: "2025-01-22" },
  { id: "4", action: "Payment received (₦)", user: "Ngozi Eze — AI Engineering", date: "2025-01-20" },
  { id: "5", action: "Pod assigned", user: "Fatima Bello → Pod Zambezi", date: "2025-01-20" },
  { id: "6", action: "Instructor onboarded", user: "Dr. Amina Toure", date: "2024-07-10" },
];

interface DashboardData {
  metrics: { label: string; value: string; change: string }[];
  recentActivity: { id: string; action: string; user: string; date: string }[];
}

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "admin"],
    queryFn: () => apiFetch<DashboardData>("/dashboard/admin"),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-surface-200" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-card bg-surface-200" />
          ))}
        </div>
      </div>
    );
  }

  const metrics = data?.metrics ?? FALLBACK_METRICS;
  const recentActivity = data?.recentActivity ?? FALLBACK_ACTIVITY;

  return (
    <div className="space-y-6">
      <h1 className="text-heading-lg text-surface-900">Admin Dashboard</h1>

      {/* KPI Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-card border border-surface-200 bg-surface-0 p-4 shadow-card">
            <p className="text-caption text-surface-500">{m.label}</p>
            <p className="text-heading-sm text-surface-900 mt-1">{m.value}</p>
            {m.change && <p className="text-caption text-green-600 mt-1">{m.change} vs last period</p>}
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <section aria-labelledby="activity-heading">
        <h2 id="activity-heading" className="text-heading-sm text-surface-900 mb-3">Recent Activity</h2>
        <div className="rounded-card border border-surface-200 bg-surface-0 shadow-card">
          <ul className="divide-y divide-surface-200" role="list">
            {recentActivity.map((a) => (
              <li key={a.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <span className="text-body-sm text-surface-900">{a.action}</span>
                  <p className="text-caption text-surface-500">{a.user}</p>
                </div>
                <span className="text-caption text-surface-500">{a.date}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
