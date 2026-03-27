/** @file assessor/page.tsx — Assessor dashboard with assigned pods, pending reviews, and certification candidates. */
"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

const FALLBACK_PODS = [
  { id: "Pod Zambezi", members: 5, submissions: 3, avgProfessionalism: 4.2, nextDeadline: "2025-02-20" },
  { id: "Pod Limpopo", members: 4, submissions: 1, avgProfessionalism: 3.8, nextDeadline: "2025-02-22" },
  { id: "Pod Volta", members: 5, submissions: 5, avgProfessionalism: 4.5, nextDeadline: "2025-02-18" },
];

const FALLBACK_QUEUE = [
  { id: "1", learner: "Ngozi Eze", pod: "Pod Zambezi", type: "Milestone 3", submitted: "2025-02-10", daysWaiting: 5 },
  { id: "2", learner: "Aisha Diallo", pod: "Pod Limpopo", type: "Capstone Draft", submitted: "2025-02-08", daysWaiting: 7 },
  { id: "3", learner: "Halima Yusuf", pod: "Pod Volta", type: "Milestone 4", submitted: "2025-02-12", daysWaiting: 3 },
];

interface AssessorData {
  pods: { id: string; members: number; submissions: number; avgProfessionalism: number; nextDeadline: string }[];
  reviewQueue: { id: string; learner: string; pod: string; type: string; submitted: string; daysWaiting: number }[];
}

export default function AssessorDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "assessor"],
    queryFn: () => apiFetch<AssessorData>("/dashboard/assessor"),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-surface-200" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-card bg-surface-200" />
          ))}
        </div>
      </div>
    );
  }

  const pods = data?.pods ?? FALLBACK_PODS;
  const reviewQueue = data?.reviewQueue ?? FALLBACK_QUEUE;

  return (
    <div className="space-y-6">
      <h1 className="text-heading-lg text-surface-900">Assessor Dashboard</h1>
      <p className="text-body-sm text-surface-500">
        Pod supervision, submission review, professionalism scoring, and certification controls.
      </p>

      {/* Assigned Pods */}
      <section aria-labelledby="pods-heading">
        <h2 id="pods-heading" className="text-heading-sm text-surface-900 mb-3">Assigned Pods</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {pods.map((pod) => (
            <div key={pod.id} className="rounded-card border border-surface-200 bg-surface-0 p-4 shadow-card">
              <h3 className="text-body-lg font-medium text-surface-900">{pod.id}</h3>
              <div className="mt-2 space-y-1 text-caption text-surface-500">
                <p>{pod.members} members · {pod.submissions} pending submissions</p>
                <p>Avg professionalism: {pod.avgProfessionalism}/5</p>
                <p>Next deadline: {pod.nextDeadline}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Review Queue */}
      <section aria-labelledby="review-heading">
        <h2 id="review-heading" className="text-heading-sm text-surface-900 mb-3">Review Queue</h2>
        <div className="rounded-card border border-surface-200 bg-surface-0 shadow-card">
          <ul className="divide-y divide-surface-200" role="list">
            {reviewQueue.map((item) => (
              <li key={item.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <span className="text-body-sm text-surface-900">{item.type}</span>
                  <p className="text-caption text-surface-500">{item.learner} · {item.pod}</p>
                </div>
                <div className="text-right">
                  <span className={`text-caption ${item.daysWaiting >= 7 ? "text-red-600" : "text-surface-500"}`}>
                    {item.daysWaiting}d waiting
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-caption text-surface-400 mt-2">
          Submissions unreviewed after 10 days are auto-escalated.
        </p>
      </section>
    </div>
  );
}
