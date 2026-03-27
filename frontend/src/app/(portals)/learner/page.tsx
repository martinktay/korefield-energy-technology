/**
 * @file learner/page.tsx
 * Learner Dashboard — the default landing page for authenticated learners.
 * Displays enrolled track progress with visual progress bars, upcoming activities
 * (labs, performance gates, pod reviews), and quick navigation to key sections.
 */
"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

const FALLBACK_TRACKS = [
  { id: "TRK-ai-eng-001", name: "AI Engineering and Intelligent Systems", level: "Beginner", module: "Module 2 of 6", progress: 33 },
  { id: "TRK-ds-001", name: "Data Science and Decision Intelligence", level: "Beginner", module: "Module 1 of 6", progress: 10 },
];

const FALLBACK_ACTIVITIES = [
  { id: "1", label: "Lab Session: REST API Design", date: "2025-02-15", type: "lab" },
  { id: "2", label: "Performance Gate: Module 2", date: "2025-02-18", type: "gate" },
  { id: "3", label: "Pod Sprint Review", date: "2025-02-20", type: "pod" },
];

const quickLinks = [
  { label: "Foundation School", href: "/learner/foundation", icon: "📚" },
  { label: "My Pods", href: "/learner/pods", icon: "👥" },
  { label: "Lessons", href: "/learner/lessons", icon: "🎓" },
  { label: "Certificates", href: "/learner/certificates", icon: "📜" },
];

interface LearnerData {
  tracks: { id: string; name: string; level: string; module: string; progress: number }[];
  activities: { id: string; label: string; date: string; type: string }[];
}

export default function LearnerDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "learner"],
    queryFn: () => apiFetch<LearnerData>("/dashboard/learner"),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-surface-200" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-card bg-surface-200" />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-card bg-surface-200" />
          ))}
        </div>
      </div>
    );
  }

  const tracks = data?.tracks ?? FALLBACK_TRACKS;
  const activities = data?.activities ?? FALLBACK_ACTIVITIES;

  return (
    <div className="space-y-6">
      <h1 className="text-heading-lg text-surface-900">Dashboard</h1>

      {/* Quick Navigation */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex flex-col items-center gap-1.5 rounded-card border border-surface-200 bg-surface-0 p-3 shadow-card hover:border-brand-300 hover:shadow-card-hover transition-all text-center"
          >
            <span className="text-heading-sm">{link.icon}</span>
            <span className="text-caption font-medium text-surface-700">{link.label}</span>
          </Link>
        ))}
      </div>

      {/* Progress Overview */}
      <section aria-labelledby="progress-heading">
        <h2 id="progress-heading" className="text-heading-sm text-surface-900 mb-3">
          My Tracks
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {tracks.map((track) => (
            <Link
              key={track.id}
              href={`/learner/tracks/${track.id}`}
              className="block rounded-card border border-surface-200 bg-surface-0 p-4 shadow-card hover:border-brand-300 transition-colors"
            >
              <h3 className="text-body-lg font-medium text-surface-900">{track.name}</h3>
              <p className="text-body-sm text-surface-500 mt-1">
                {track.level} · {track.module}
              </p>
              <div className="mt-3">
                <div className="flex items-center justify-between text-caption text-surface-600 mb-1">
                  <span>Progress</span>
                  <span>{track.progress}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-surface-200">
                  <div
                    className="h-2 rounded-full bg-brand-600 transition-all"
                    style={{ width: `${track.progress}%` }}
                    role="progressbar"
                    aria-valuenow={track.progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${track.name} progress`}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Upcoming Activities */}
      <section aria-labelledby="activities-heading">
        <h2 id="activities-heading" className="text-heading-sm text-surface-900 mb-3">
          Upcoming Activities
        </h2>
        <div className="rounded-card border border-surface-200 bg-surface-0 shadow-card">
          <ul className="divide-y divide-surface-200" role="list">
            {activities.map((activity) => (
              <li key={activity.id} className="flex items-center justify-between px-4 py-3">
                <span className="text-body-sm text-surface-900">{activity.label}</span>
                <span className="text-caption text-surface-500">{activity.date}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
