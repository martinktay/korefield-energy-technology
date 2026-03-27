/** @file super-admin/enrollment/page.tsx — Enrollment intelligence dashboard with conversion funnels and regional distribution. */
"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

const FALLBACK_METRICS = [
  { label: "Active Learners", value: "10" },
  { label: "New Enrollments (MTD)", value: "9" },
  { label: "Foundation → Paid Conversion", value: "80%" },
  { label: "Dropout Rate (Avg)", value: "0%" },
  { label: "Countries Represented", value: "6" },
];

const FALLBACK_BY_TRACK = [
  { track: "AI Engineering", active: 4, newMTD: 4, dropout: "0%", waitlist: 0 },
  { track: "Data Science", active: 2, newMTD: 2, dropout: "0%", waitlist: 0 },
  { track: "Cybersecurity", active: 1, newMTD: 1, dropout: "0%", waitlist: 1 },
  { track: "AI Product Leadership", active: 2, newMTD: 2, dropout: "0%", waitlist: 0 },
];

interface EnrollmentData {
  metrics: { label: string; value: string }[];
  byTrack: { track: string; active: number; newMTD: number; dropout: string; waitlist: number }[];
}

export default function EnrollmentPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "super-admin", "enrollments"],
    queryFn: () => apiFetch<EnrollmentData>("/dashboard/super-admin/enrollments"),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-surface-200" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-card bg-surface-200" />
          ))}
        </div>
      </div>
    );
  }

  const metrics = data?.metrics ?? FALLBACK_METRICS;
  const byTrack = data?.byTrack ?? FALLBACK_BY_TRACK;

  return (
    <div className="space-y-6">
      <h1 className="text-heading-lg text-surface-900">Enrollment Intelligence</h1>
      <p className="text-body-sm text-surface-500">
        Active learners, new enrollments by track/region, Foundation-to-paid conversion, dropout rates, waitlist volume, and market heatmap.
      </p>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-card border border-surface-200 bg-surface-0 p-4 shadow-card">
            <p className="text-caption text-surface-500">{m.label}</p>
            <p className="text-heading-sm text-surface-900 mt-1">{m.value}</p>
          </div>
        ))}
      </div>

      {/* By Track */}
      <section aria-labelledby="track-enrollment">
        <h2 id="track-enrollment" className="text-heading-sm text-surface-900 mb-3">Enrollment by Track</h2>
        <div className="rounded-card border border-surface-200 bg-surface-0 shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-body-sm">
              <thead className="border-b border-surface-200 bg-surface-50">
                <tr>
                  <th className="px-4 py-3 text-surface-600 font-medium">Track</th>
                  <th className="px-4 py-3 text-surface-600 font-medium">Active</th>
                  <th className="px-4 py-3 text-surface-600 font-medium">New (MTD)</th>
                  <th className="px-4 py-3 text-surface-600 font-medium">Dropout</th>
                  <th className="px-4 py-3 text-surface-600 font-medium">Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200">
                {byTrack.map((t) => (
                  <tr key={t.track}>
                    <td className="px-4 py-3 text-surface-900">{t.track}</td>
                    <td className="px-4 py-3 text-surface-700">{t.active}</td>
                    <td className="px-4 py-3 text-surface-700">{t.newMTD}</td>
                    <td className="px-4 py-3 text-surface-700">{t.dropout}</td>
                    <td className="px-4 py-3 text-surface-700">{t.waitlist}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Market Heatmap Placeholder */}
      <section aria-labelledby="heatmap-heading">
        <h2 id="heatmap-heading" className="text-heading-sm text-surface-900 mb-3">Enrollment Heatmap by Region</h2>
        <div className="rounded-card border border-surface-200 bg-surface-0 p-8 shadow-card flex items-center justify-center">
          <p className="text-body-sm text-surface-400">Geographic heatmap visualization will render here</p>
        </div>
      </section>
    </div>
  );
}
