/** @file instructor/cohorts/page.tsx — Cohort management listing all active and upcoming cohorts. */
"use client";

const mockCohorts = [
  { id: "COH-001", name: "AI Engineering — Cohort 3", track: "AI Engineering", level: "Beginner", learners: 24, status: "Active" },
  { id: "COH-002", name: "Data Science — Cohort 1", track: "Data Science", level: "Intermediate", learners: 18, status: "Active" },
  { id: "COH-003", name: "Cybersecurity — Cohort 2", track: "Cybersecurity", level: "Beginner", learners: 20, status: "Active" },
  { id: "COH-004", name: "AI Product — Cohort 1", track: "AI Product Leadership", level: "Advanced", learners: 12, status: "Completed" },
];

export default function CohortsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-heading-lg text-surface-900">Cohorts</h1>
      <p className="text-body-sm text-surface-500">
        All assigned cohorts across tracks and levels.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {mockCohorts.map((cohort) => (
          <a
            key={cohort.id}
            href={`/instructor/cohorts/${cohort.id}`}
            className="block rounded-card border border-surface-200 bg-surface-0 p-4 shadow-card hover:border-brand-300 transition-colors"
          >
            <h2 className="text-body-lg font-medium text-surface-900">{cohort.name}</h2>
            <p className="text-body-sm text-surface-500 mt-1">
              {cohort.track} · {cohort.level} · {cohort.learners} learners
            </p>
            <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-caption ${
              cohort.status === "Active"
                ? "bg-green-100 text-green-700"
                : "bg-surface-100 text-surface-600"
            }`}>
              {cohort.status}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
