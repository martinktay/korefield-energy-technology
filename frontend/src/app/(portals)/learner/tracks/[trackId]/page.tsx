/** @file learner/tracks/[trackId]/page.tsx — Track detail page with curriculum outline, pricing, and enrollment action. */
"use client";

import { useState, useCallback } from "react";

import { useParams } from "next/navigation";

const mockCurriculum = [
  { level: "Beginner", modules: ["Python for AI", "REST APIs & Data Formats", "Intro to ML Pipelines"] },
  { level: "Intermediate", modules: ["RAG Pipelines", "Multi-Agent Systems", "Cloud Deployment"] },
  { level: "Advanced", modules: ["Production AI Architecture", "Capstone Project"] },
];

export default function TrackDetailPage() {
  const params = useParams<{ trackId: string }>();
  const [enrollState, setEnrollState] = useState<"idle" | "enrolling" | "enrolled">("idle");
  const [waitlistState, setWaitlistState] = useState<"idle" | "joining" | "joined">("idle");

  const handleEnroll = useCallback(() => {
    if (enrollState !== "idle") return;
    setEnrollState("enrolling");
    setTimeout(() => setEnrollState("enrolled"), 1000);
  }, [enrollState]);

  const handleWaitlist = useCallback(() => {
    if (waitlistState !== "idle") return;
    setWaitlistState("joining");
    setTimeout(() => setWaitlistState("joined"), 1000);
  }, [waitlistState]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-caption text-surface-400">{params.trackId}</p>
        <h1 className="text-heading-lg text-surface-900">Track Detail</h1>
        <p className="mt-1 text-body-sm text-surface-500">
          Full pathway enrollment — Beginner through Advanced. Certification on completion.
        </p>
      </div>

      {/* Curriculum Outline */}
      <section aria-labelledby="curriculum-heading">
        <h2 id="curriculum-heading" className="text-heading-sm text-surface-900 mb-3">
          Curriculum Outline
        </h2>
        <div className="space-y-4">
          {mockCurriculum.map((level) => (
            <div
              key={level.level}
              className="rounded-card border border-surface-200 bg-surface-0 p-4 shadow-card"
            >
              <h3 className="text-body-lg font-medium text-surface-900">{level.level}</h3>
              <ul className="mt-2 space-y-1" role="list">
                {level.modules.map((mod) => (
                  <li key={mod} className="text-body-sm text-surface-600">
                    • {mod}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleEnroll}
          disabled={enrollState !== "idle"}
          className={`rounded-lg px-4 py-2 text-body-sm font-medium transition-colors ${
            enrollState === "enrolled"
              ? "bg-green-600 text-white cursor-default"
              : enrollState === "enrolling"
              ? "bg-brand-400 text-white cursor-wait"
              : "bg-brand-600 text-white hover:bg-brand-700"
          }`}
        >
          {enrollState === "enrolling" ? "Enrolling..." : enrollState === "enrolled" ? "Enrolled ✓" : "Enroll Now"}
        </button>
        <button
          type="button"
          onClick={handleWaitlist}
          disabled={waitlistState !== "idle"}
          className={`rounded-lg border px-4 py-2 text-body-sm transition-colors ${
            waitlistState === "joined"
              ? "border-green-300 bg-green-50 text-green-700 cursor-default"
              : waitlistState === "joining"
              ? "border-surface-300 text-surface-400 cursor-wait"
              : "border-surface-300 text-surface-700 hover:bg-surface-100"
          }`}
        >
          {waitlistState === "joining" ? "Joining..." : waitlistState === "joined" ? "On Waitlist ✓" : "Join Waitlist"}
        </button>
      </div>
    </div>
  );
}
