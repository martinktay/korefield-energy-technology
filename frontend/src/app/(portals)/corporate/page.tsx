"use client";

import Link from "next/link";
import { Users, Receipt, TrendingUp, GraduationCap, ArrowRight } from "lucide-react";

const mockMetrics = [
  { label: "Sponsored Learners", value: "6", Icon: Users, color: "text-brand-600", bg: "bg-brand-50" },
  { label: "Active in Tracks", value: "5", Icon: TrendingUp, color: "text-accent-600", bg: "bg-accent-50" },
  { label: "Certifications Earned", value: "1", Icon: GraduationCap, color: "text-purple-600", bg: "bg-purple-50" },
  { label: "Total Invested", value: "$15,000", Icon: Receipt, color: "text-amber-600", bg: "bg-amber-50" },
];

const mockLearners = [
  { id: "LRN-001", name: "Ngozi Eze", track: "AI Engineering", progress: 67, status: "Active" },
  { id: "LRN-002", name: "Tendai Moyo", track: "Data Science", progress: 45, status: "Active" },
  { id: "LRN-003", name: "Aisha Diallo", track: "Cybersecurity", progress: 82, status: "Active" },
  { id: "LRN-004", name: "Kofi Mensah", track: "AI Product Leadership", progress: 30, status: "Active" },
  { id: "LRN-005", name: "Zara Mwangi", track: "AI Engineering", progress: 100, status: "Certified" },
  { id: "LRN-006", name: "Halima Yusuf", track: "Data Science", progress: 12, status: "Paused" },
];

const mockRecentActivity = [
  { id: "1", action: "Zara Mwangi earned certification", track: "AI Engineering", date: "2026-03-15" },
  { id: "2", action: "Aisha Diallo passed Module 4 gate", track: "Cybersecurity", date: "2026-03-12" },
  { id: "3", action: "Invoice INV-2026-003 generated", track: "—", date: "2026-03-10" },
  { id: "4", action: "Halima Yusuf enrollment paused", track: "Data Science", date: "2026-03-08" },
];

export default function CorporateDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-display-sm text-surface-900">Corporate Dashboard</h1>
        <p className="mt-1 text-body-lg text-surface-500">Track your sponsored learners and program ROI.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 stagger-children">
        {mockMetrics.map((m) => {
          const Icon = m.Icon;
          return (
            <div key={m.label} className="rounded-xl border border-surface-200 bg-surface-0 p-5 shadow-card">
              <div className="flex items-center justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${m.bg}`}>
                  <Icon className={`h-5 w-5 ${m.color}`} aria-hidden="true" />
                </div>
                <span className="text-heading-sm font-bold text-surface-900">{m.value}</span>
              </div>
              <p className="mt-3 text-body-sm text-surface-500">{m.label}</p>
            </div>
          );
        })}
      </div>

      {/* Learner Progress Overview */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-heading-sm text-surface-900">Sponsored Learners</h2>
          <Link href="/corporate/learners" className="flex items-center gap-1 text-body-sm text-brand-600 hover:text-brand-700 transition-colors font-medium">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="rounded-xl border border-surface-200 bg-surface-0 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-body-sm">
              <thead className="border-b border-surface-200 bg-surface-50">
                <tr>
                  <th className="px-5 py-3 text-surface-600 font-medium">Learner</th>
                  <th className="px-5 py-3 text-surface-600 font-medium">Track</th>
                  <th className="px-5 py-3 text-surface-600 font-medium">Progress</th>
                  <th className="px-5 py-3 text-surface-600 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {mockLearners.map((l) => (
                  <tr key={l.id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-5 py-3 text-surface-900 font-medium">{l.name}</td>
                    <td className="px-5 py-3 text-surface-600">{l.track}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 rounded-full bg-surface-100 overflow-hidden">
                          <div className="h-1.5 rounded-full bg-brand-500" style={{ width: `${l.progress}%` }} />
                        </div>
                        <span className="text-caption text-surface-500">{l.progress}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-caption font-medium ${
                        l.status === "Active" ? "bg-accent-50 text-accent-700" :
                        l.status === "Certified" ? "bg-brand-50 text-brand-700" :
                        "bg-amber-50 text-amber-700"
                      }`}>{l.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Recent Activity */}
      <section>
        <h2 className="text-heading-sm text-surface-900 mb-4">Recent Activity</h2>
        <div className="rounded-xl border border-surface-200 bg-surface-0 shadow-card overflow-hidden">
          <ul className="divide-y divide-surface-100" role="list">
            {mockRecentActivity.map((a) => (
              <li key={a.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-surface-50 transition-colors">
                <div>
                  <p className="text-body-sm text-surface-900">{a.action}</p>
                  {a.track !== "—" && <p className="text-caption text-surface-400">{a.track}</p>}
                </div>
                <span className="text-caption text-surface-400 shrink-0">{a.date}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
