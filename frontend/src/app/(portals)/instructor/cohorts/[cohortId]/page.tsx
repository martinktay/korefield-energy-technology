/** @file instructor/cohorts/[cohortId]/page.tsx — Cohort detail page with learner roster and progress tracking. */
"use client";

import { useParams } from "next/navigation";

const mockLearners = [
  { id: "LRN-001", name: "Ngozi Eze", progress: 67, pod: "Pod Zambezi", lastActive: "2025-02-15" },
  { id: "LRN-002", name: "Tendai Moyo", progress: 45, pod: "Pod Zambezi", lastActive: "2025-02-14" },
  { id: "LRN-003", name: "Aisha Diallo", progress: 82, pod: "Pod Limpopo", lastActive: "2025-02-15" },
  { id: "LRN-004", name: "Kofi Mensah", progress: 30, pod: "Pod Limpopo", lastActive: "2025-02-10" },
];

export default function CohortDetailPage() {
  const params = useParams();

  return (
    <div className="space-y-6">
      <h1 className="text-heading-lg text-surface-900">Cohort: {params.cohortId}</h1>
      <p className="text-body-sm text-surface-500">
        Learner list, performance overview, and pod information for this cohort.
      </p>

      {/* Cohort Metrics */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-card border border-surface-200 bg-surface-0 p-4 shadow-card">
          <p className="text-caption text-surface-500">Learners</p>
          <p className="text-heading-sm text-surface-900 mt-1">{mockLearners.length}</p>
        </div>
        <div className="rounded-card border border-surface-200 bg-surface-0 p-4 shadow-card">
          <p className="text-caption text-surface-500">Avg Progress</p>
          <p className="text-heading-sm text-surface-900 mt-1">56%</p>
        </div>
        <div className="rounded-card border border-surface-200 bg-surface-0 p-4 shadow-card">
          <p className="text-caption text-surface-500">At-Risk Learners</p>
          <p className="text-heading-sm text-surface-900 mt-1">1</p>
        </div>
      </div>

      {/* Learner Table */}
      <div className="rounded-card border border-surface-200 bg-surface-0 shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-body-sm">
            <thead className="border-b border-surface-200 bg-surface-50">
              <tr>
                <th className="px-4 py-3 text-surface-600 font-medium">Learner</th>
                <th className="px-4 py-3 text-surface-600 font-medium">Pod</th>
                <th className="px-4 py-3 text-surface-600 font-medium">Progress</th>
                <th className="px-4 py-3 text-surface-600 font-medium">Last Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200">
              {mockLearners.map((learner) => (
                <tr key={learner.id}>
                  <td className="px-4 py-3 text-surface-900">{learner.name}</td>
                  <td className="px-4 py-3 text-surface-700">{learner.pod}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-20 rounded-full bg-surface-200">
                        <div
                          className="h-2 rounded-full bg-brand-600"
                          style={{ width: `${learner.progress}%` }}
                        />
                      </div>
                      <span className="text-caption text-surface-500">{learner.progress}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-surface-500">{learner.lastActive}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
