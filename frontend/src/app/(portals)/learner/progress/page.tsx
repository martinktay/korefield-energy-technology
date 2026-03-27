/** @file learner/progress/page.tsx — Progress dashboard showing module timeline, certification readiness, and next recommended lesson. */
"use client";

const mockProgress = [
  {
    trackId: "TRK-ai-eng-001",
    trackName: "AI Engineering and Intelligent Systems",
    level: "Beginner",
    completionPct: 33,
    modules: [
      { name: "Python for AI", status: "completed" as const },
      { name: "REST APIs & Data Formats", status: "in-progress" as const },
      { name: "Intro to ML Pipelines", status: "upcoming" as const },
    ],
    nextLesson: "REST API Authentication Patterns",
    capstoneStatus: "locked" as const,
    certConditions: {
      foundationComplete: true,
      levelsComplete: false,
      podDeliverablesComplete: false,
      capstonePass: false,
      assessorApproved: false,
      paymentCleared: true,
    },
  },
];

const moduleStatusColors = {
  completed: "bg-learning-completed",
  "in-progress": "bg-learning-in-progress",
  upcoming: "bg-learning-upcoming",
  locked: "bg-learning-locked",
} as const;

export default function ProgressPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-heading-lg text-surface-900">Progress Dashboard</h1>

      {mockProgress.map((track) => (
        <div key={track.trackId} className="space-y-4">
          {/* Track header */}
          <div className="rounded-card border border-surface-200 bg-surface-0 p-4 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-heading-sm text-surface-900">{track.trackName}</h2>
                <p className="text-body-sm text-surface-500">{track.level} · {track.completionPct}% complete</p>
              </div>
              <span className="text-heading-lg text-brand-600 font-bold">{track.completionPct}%</span>
            </div>
            <div className="mt-3 h-2 w-full rounded-full bg-surface-200">
              <div
                className="h-2 rounded-full bg-brand-600 transition-all"
                style={{ width: `${track.completionPct}%` }}
                role="progressbar"
                aria-valuenow={track.completionPct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${track.trackName} progress`}
              />
            </div>
          </div>

          {/* Module timeline */}
          <section aria-labelledby={`modules-${track.trackId}`}>
            <h3 id={`modules-${track.trackId}`} className="text-body-lg font-medium text-surface-900 mb-2">
              Module Timeline
            </h3>
            <div className="flex gap-2 flex-wrap">
              {track.modules.map((mod) => (
                <div
                  key={mod.name}
                  className="flex items-center gap-2 rounded-lg border border-surface-200 bg-surface-0 px-3 py-2"
                >
                  <span className={`h-3 w-3 rounded-full ${moduleStatusColors[mod.status]}`} aria-hidden="true" />
                  <span className="text-body-sm text-surface-700">{mod.name}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Next lesson */}
          <div className="rounded-card border border-surface-200 bg-surface-0 p-4 shadow-card">
            <p className="text-caption text-surface-400">Next Recommended Lesson</p>
            <p className="text-body-sm font-medium text-surface-900 mt-1">{track.nextLesson}</p>
          </div>

          {/* Certification readiness */}
          <section aria-labelledby={`cert-${track.trackId}`}>
            <h3 id={`cert-${track.trackId}`} className="text-body-lg font-medium text-surface-900 mb-2">
              Certification Readiness
            </h3>
            <div className="rounded-card border border-surface-200 bg-surface-0 p-4 shadow-card">
              <p className="text-caption text-surface-500 mb-2">
                Capstone: <span className="font-medium capitalize">{track.capstoneStatus}</span>
              </p>
              <ul className="space-y-1 text-body-sm" role="list">
                {Object.entries(track.certConditions).map(([key, met]) => (
                  <li key={key} className="flex items-center gap-2">
                    <span className={`text-caption ${met ? "text-status-success" : "text-surface-400"}`}>
                      {met ? "✓" : "○"}
                    </span>
                    <span className={met ? "text-surface-700" : "text-surface-400"}>
                      {key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      ))}
    </div>
  );
}
