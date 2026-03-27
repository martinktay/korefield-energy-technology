"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import {
  BookOpen,
  Users,
  GraduationCap,
  Award,
  ArrowRight,
  Calendar,
  Zap,
  Target,
} from "lucide-react";

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
  { label: "Foundation School", href: "/learner/foundation", Icon: BookOpen, color: "text-brand-600", bg: "bg-brand-50", hoverBg: "group-hover:bg-brand-100" },
  { label: "My Pods", href: "/learner/pods", Icon: Users, color: "text-accent-600", bg: "bg-accent-50", hoverBg: "group-hover:bg-accent-100" },
  { label: "Lessons", href: "/learner/lessons", Icon: GraduationCap, color: "text-purple-600", bg: "bg-purple-50", hoverBg: "group-hover:bg-purple-100" },
  { label: "Certificates", href: "/learner/certificates", Icon: Award, color: "text-amber-600", bg: "bg-amber-50", hoverBg: "group-hover:bg-amber-100" },
];

const ACTIVITY_ICONS: Record<string, { Icon: typeof Calendar; color: string }> = {
  lab: { Icon: Zap, color: "text-brand-500" },
  gate: { Icon: Target, color: "text-amber-500" },
  pod: { Icon: Users, color: "text-accent-500" },
};

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
        <div className="h-8 w-48 skeleton" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 skeleton rounded-xl" />)}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => <div key={i} className="h-36 skeleton rounded-xl" />)}
        </div>
      </div>
    );
  }

  const tracks = data?.tracks ?? FALLBACK_TRACKS;
  const activities = data?.activities ?? FALLBACK_ACTIVITIES;

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="text-display-sm text-surface-900">Welcome back, Kofi</h1>
        <p className="mt-1 text-body-lg text-surface-500">Pick up where you left off.</p>
      </div>

      {/* Quick Navigation */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 stagger-children">
        {quickLinks.map((link) => {
          const Icon = link.Icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="group flex flex-col items-center gap-2.5 rounded-xl border border-surface-200 bg-surface-0 p-4 shadow-card hover:shadow-card-hover hover:border-surface-300 transition-all text-center"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${link.bg} ${link.hoverBg} transition-colors`}>
                <Icon className={`h-5 w-5 ${link.color}`} aria-hidden="true" />
              </div>
              <span className="text-body-sm font-medium text-surface-700 group-hover:text-surface-900 transition-colors">{link.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Progress Overview */}
      <section aria-labelledby="progress-heading">
        <div className="flex items-center justify-between mb-4">
          <h2 id="progress-heading" className="text-heading-sm text-surface-900">My Tracks</h2>
          <Link href="/learner/tracks" className="flex items-center gap-1 text-body-sm text-brand-600 hover:text-brand-700 transition-colors font-medium">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 stagger-children">
          {tracks.map((track) => (
            <Link
              key={track.id}
              href={`/learner/tracks/${track.id}`}
              className="group block rounded-xl border border-surface-200 bg-surface-0 p-5 shadow-card hover:shadow-card-hover hover:border-brand-200 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-body-lg font-semibold text-surface-900 group-hover:text-brand-700 transition-colors">{track.name}</h3>
                  <p className="text-body-sm text-surface-500 mt-1">{track.level} · {track.module}</p>
                </div>
                <span className="text-heading-sm font-bold text-brand-600">{track.progress}%</span>
              </div>
              <div className="mt-4">
                <div className="h-2 w-full rounded-full bg-surface-100 overflow-hidden">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all duration-500"
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
        <h2 id="activities-heading" className="text-heading-sm text-surface-900 mb-4">Upcoming Activities</h2>
        <div className="rounded-xl border border-surface-200 bg-surface-0 shadow-card overflow-hidden">
          <ul className="divide-y divide-surface-100" role="list">
            {activities.map((activity) => {
              const activityMeta = ACTIVITY_ICONS[activity.type] || ACTIVITY_ICONS.lab;
              const Icon = activityMeta.Icon;
              return (
                <li key={activity.id} className="flex items-center gap-3 px-5 py-4 hover:bg-surface-50 transition-colors">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-50">
                    <Icon className={`h-4 w-4 ${activityMeta.color}`} aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-medium text-surface-900 truncate">{activity.label}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-caption text-surface-400">
                    <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                    {activity.date}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </div>
  );
}
