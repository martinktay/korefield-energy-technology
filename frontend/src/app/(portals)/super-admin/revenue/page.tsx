/** @file super-admin/revenue/page.tsx — Revenue intelligence dashboard with track-level breakdown and payment analytics. */
"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

const FALLBACK_BY_TRACK = [
  { track: "AI Engineering", revenue: "₦4,200,000", enrollments: 4, overdueRate: "0%" },
  { track: "Data Science", revenue: "₦1,800,000", enrollments: 2, overdueRate: "0%" },
  { track: "Cybersecurity", revenue: "$1,200 / KES 45,000", enrollments: 2, overdueRate: "0%" },
  { track: "AI Product Leadership", revenue: "GHS 8,500 / ₦950,000", enrollments: 2, overdueRate: "5%" },
];

const FALLBACK_BY_REGION = [
  { region: "Nigeria (NGN)", revenue: "₦6,950,000", share: "45%" },
  { region: "Ghana (GHS)", revenue: "GHS 12,800", share: "20%" },
  { region: "Kenya (KES)", revenue: "KES 45,000", share: "12%" },
  { region: "Senegal (XOF)", revenue: "XOF 380,000", share: "10%" },
  { region: "Zimbabwe (USD)", revenue: "$850", share: "8%" },
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
        <div className="h-8 w-48 animate-pulse rounded bg-surface-200" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-card bg-surface-200" />
          ))}
        </div>
      </div>
    );
  }

  const revenueByTrack = data?.revenueByTrack ?? FALLBACK_BY_TRACK;
  const revenueByRegion = data?.revenueByRegion ?? FALLBACK_BY_REGION;

  return (
    <div className="space-y-6">
      <h1 className="text-heading-lg text-surface-900">Revenue Intelligence</h1>
      <p className="text-body-sm text-surface-500">
        Aggregated revenue by day/week/month/year, by region, by track. Overdue balances and installment completion rates. Pre-aggregated metrics from batch analytics.
      </p>

      {/* Revenue by Track */}
      <section aria-labelledby="track-revenue">
        <h2 id="track-revenue" className="text-heading-sm text-surface-900 mb-3">Revenue by Track</h2>
        <div className="rounded-card border border-surface-200 bg-surface-0 shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-body-sm">
              <thead className="border-b border-surface-200 bg-surface-50">
                <tr>
                  <th className="px-4 py-3 text-surface-600 font-medium">Track</th>
                  <th className="px-4 py-3 text-surface-600 font-medium">Revenue</th>
                  <th className="px-4 py-3 text-surface-600 font-medium">Enrollments</th>
                  <th className="px-4 py-3 text-surface-600 font-medium">Overdue Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200">
                {revenueByTrack.map((r) => (
                  <tr key={r.track}>
                    <td className="px-4 py-3 text-surface-900">{r.track}</td>
                    <td className="px-4 py-3 text-surface-700">{r.revenue}</td>
                    <td className="px-4 py-3 text-surface-700">{r.enrollments}</td>
                    <td className="px-4 py-3 text-surface-700">{r.overdueRate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Revenue by Region */}
      <section aria-labelledby="region-revenue">
        <h2 id="region-revenue" className="text-heading-sm text-surface-900 mb-3">Revenue by Region</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {revenueByRegion.map((r) => (
            <div key={r.region} className="rounded-card border border-surface-200 bg-surface-0 p-4 shadow-card">
              <p className="text-caption text-surface-500">{r.region}</p>
              <p className="text-heading-sm text-surface-900 mt-1">{r.revenue}</p>
              <p className="text-caption text-surface-500 mt-1">{r.share} of total</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
