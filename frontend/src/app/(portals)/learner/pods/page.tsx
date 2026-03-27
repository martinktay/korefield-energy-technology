/** @file learner/pods/page.tsx — Pod workspace listing the learner's assigned multidisciplinary delivery teams. */
"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

const FALLBACK_PODS = [
  { id: "POD-001", name: "Pod Zambezi", track: "AI Engineering and Intelligent Systems", members: 5, status: "Active" },
  { id: "POD-002", name: "Pod Limpopo", track: "Data Science and Decision Intelligence", members: 5, status: "Active" },
  { id: "POD-003", name: "Pod Volta", track: "Cybersecurity and AI Security", members: 4, status: "Forming" },
];

interface PodRow {
  id: string; name: string; track: string; members: number; status: string;
}

export default function PodsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "learner", "pods"],
    queryFn: () => apiFetch<PodRow[]>("/dashboard/learner/pods"),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-surface-200" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-card bg-surface-200" />
          ))}
        </div>
      </div>
    );
  }

  const pods = data ?? FALLBACK_PODS;

  return (
    <div className="space-y-6">
      <h1 className="text-heading-lg text-surface-900">My Pods</h1>
      <p className="text-body-sm text-surface-500">
        Your multidisciplinary delivery teams across enrolled tracks.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {pods.map((pod) => (
          <a
            key={pod.id}
            href={`/learner/pods/${pod.id}`}
            className="block rounded-card border border-surface-200 bg-surface-0 p-4 shadow-card hover:border-brand-300 transition-colors"
          >
            <h2 className="text-body-lg font-medium text-surface-900">{pod.name}</h2>
            <p className="text-caption text-surface-400 mt-0.5">{pod.id}</p>
            <p className="text-body-sm text-surface-500 mt-1">
              {pod.track} · {pod.members} members
            </p>
            <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-caption ${
              pod.status === "Active"
                ? "bg-green-100 text-green-700"
                : "bg-brand-50 text-brand-700"
            }`}>
              {pod.status}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
