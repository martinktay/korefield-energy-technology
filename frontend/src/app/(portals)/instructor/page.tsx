/** @file instructor/page.tsx — Instructor dashboard with cohort overview, grading queue, and upcoming sessions. */
"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

const FALLBACK_COHORTS = [
  { id: "COH-001", name: "AI Engineering — Cohort 3", track: "AI Engineering", level: "Beginner", learners: 24, status: "Active" },
  { id: "COH-002", name: "Data Science — Cohort 1", track: "Data Science", level: "Intermediate", learners: 18, status: "Active" },
];

const FALLBACK_GRADING = [
  { id: "1", learner: "Ngozi Eze", assessment: "Module 2 Performance Gate", submitted: "2025-02-14", status: "Pending" },
  { id: "2", learner: "Tendai Moyo", assessment: "Lab: REST API Design", submitted: "2025-02-13", status: "Pending" },
  { id: "3", learner: "Aisha Diallo", assessment: "Quiz: Neural Networks", submitted: "2025-02-12", status: "Pending" },
];

const FALLBACK_SCHEDULE = [
  { id: "1", session: "Lab: Data Pipelines", date: "2025-02-18", time: "10:00 AM", cohort: "COH-001" },
  { id: "2", session: "Review: Sprint 3", date: "2025-02-20", time: "2:00 PM", cohort: "COH-002" },
];

const FALLBACK_RISK = [
  { id: "1", learner: "Kofi Mensah", track: "AI Product Leadership", metric: "Low scores" },
  { id: "2", learner: "Halima Yusuf", track: "Data Science", metric: "Late submissions" },
  { id: "3", learner: "Samuel Osei", track: "AI Engineering", metric: "Inactivity" },
];

const FALLBACK_PODS = [
  { id: "Pod Zambezi", members: 4, roles: ["AI Engineer", "Software Dev"], recentActivity: "Sprint review completed" },
  { id: "Pod Limpopo", members: 2, roles: ["Data Scientist", "Educator"], recentActivity: "Milestone 3 submitted" },
  { id: "Pod Volta", members: 2, roles: ["Security", "Student"], recentActivity: "Lab session in progress" },
  { id: "Pod Niger", members: 2, roles: ["PM", "Business Pro"], recentActivity: "Capstone planning started" },
];

interface InstructorData {
  cohorts: { id: string; name: string; track: string; level: string; learners: number; status: string }[];
  gradingQueue: { id: string; learner: string; assessment: string; submitted: string; status: string }[];
  schedule: { id: string; session: string; date: string; time: string; cohort: string }[];
  riskFlags: { id: string; learner: string; track: string; metric: string }[];
  pods: { id: string; members: number; roles: string[]; recentActivity: string }[];
}

export default function InstructorDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "instructor"],
    queryFn: () => apiFetch<InstructorData>("/dashboard/instructor"),
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

  const cohorts = data?.cohorts ?? FALLBACK_COHORTS;
  const gradingQueue = data?.gradingQueue ?? FALLBACK_GRADING;
  const schedule = data?.schedule ?? FALLBACK_SCHEDULE;
  const riskFlags = data?.riskFlags ?? FALLBACK_RISK;
  const pods = data?.pods ?? FALLBACK_PODS;

  return (
    <div className="space-y-6">
      <h1 className="text-heading-lg text-surface-900">Instructor Dashboard</h1>

      {/* Assigned Cohorts */}
      <section aria-labelledby="cohorts-heading">
        <h2 id="cohorts-heading" className="text-heading-sm text-surface-900 mb-3">
          Assigned Cohorts
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {cohorts.map((cohort) => (
            <div key={cohort.id} className="rounded-card border border-surface-200 bg-surface-0 p-4 shadow-card">
              <h3 className="text-body-lg font-medium text-surface-900">{cohort.name}</h3>
              <p className="text-body-sm text-surface-500 mt-1">
                {cohort.track} · {cohort.level} · {cohort.learners} learners
              </p>
              <span className="mt-2 inline-block rounded-full bg-green-100 px-2 py-0.5 text-caption text-green-700">
                {cohort.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Grading Queue */}
      <section aria-labelledby="grading-heading">
        <h2 id="grading-heading" className="text-heading-sm text-surface-900 mb-3">
          Grading Queue
        </h2>
        <div className="rounded-card border border-surface-200 bg-surface-0 shadow-card">
          <ul className="divide-y divide-surface-200" role="list">
            {gradingQueue.map((item) => (
              <li key={item.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <span className="text-body-sm text-surface-900">{item.assessment}</span>
                  <p className="text-caption text-surface-500">{item.learner}</p>
                </div>
                <span className="text-caption text-surface-500">{item.submitted}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Upcoming Schedule */}
      <section aria-labelledby="schedule-heading">
        <h2 id="schedule-heading" className="text-heading-sm text-surface-900 mb-3">
          Upcoming Sessions
        </h2>
        <div className="rounded-card border border-surface-200 bg-surface-0 shadow-card">
          <ul className="divide-y divide-surface-200" role="list">
            {schedule.map((session) => (
              <li key={session.id} className="flex items-center justify-between px-4 py-3">
                <span className="text-body-sm text-surface-900">{session.session}</span>
                <span className="text-caption text-surface-500">{session.date} · {session.time}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Learner Risk Flags */}
      <section aria-labelledby="risk-heading">
        <h2 id="risk-heading" className="text-heading-sm text-surface-900 mb-3">
          Learner Risk Flags
        </h2>
        <div className="rounded-card border border-surface-200 bg-surface-0 shadow-card">
          <ul className="divide-y divide-surface-200" role="list">
            {riskFlags.map((flag) => (
              <li key={flag.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <span className="text-body-sm text-surface-900">{flag.learner}</span>
                  <p className="text-caption text-surface-500">{flag.track}</p>
                </div>
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-caption text-red-700">
                  {flag.metric}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Pod Visibility */}
      <section aria-labelledby="pods-heading">
        <h2 id="pods-heading" className="text-heading-sm text-surface-900 mb-3">
          Pod Overview
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {pods.map((pod) => (
            <div key={pod.id} className="rounded-card border border-surface-200 bg-surface-0 p-4 shadow-card">
              <h3 className="text-body-lg font-medium text-surface-900">{pod.id}</h3>
              <p className="text-caption text-surface-500 mt-1">
                {pod.members} members · {pod.recentActivity}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {pod.roles.map((role) => (
                  <span key={role} className="rounded-full bg-surface-100 px-2 py-0.5 text-caption text-surface-600">
                    {role}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
