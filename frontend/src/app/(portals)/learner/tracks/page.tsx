/** @file learner/tracks/page.tsx — Track catalog page showing all 4 learning pathways with availability status. */
"use client";

import Link from "next/link";

const tracks = [
  {
    id: "TRK-ai-eng-001",
    name: "AI Engineering and Intelligent Systems",
    description: "Build production AI systems — from RAG pipelines to multi-agent architectures.",
    levels: 3,
    duration: "12 months",
    status: "available" as const,
  },
  {
    id: "TRK-ds-001",
    name: "Data Science and Decision Intelligence",
    description: "Master data analysis, ML engineering, and decision systems for real-world impact.",
    levels: 3,
    duration: "12 months",
    status: "available" as const,
  },
  {
    id: "TRK-cyber-001",
    name: "Cybersecurity and AI Security",
    description: "Defend intelligent systems — IAM, SIEM, AI threat modeling, and security architecture.",
    levels: 3,
    duration: "12 months",
    status: "waitlisted" as const,
  },
  {
    id: "TRK-prod-001",
    name: "AI Product and Project Leadership",
    description: "Lead AI product teams — discovery, governance, lifecycle management, and transformation.",
    levels: 3,
    duration: "10 months",
    status: "available" as const,
  },
];

export default function TrackCatalogPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-heading-lg text-surface-900">Track Catalog</h1>
        <p className="mt-1 text-body-sm text-surface-500">
          Browse available learning pathways. Complete Foundation School to enroll.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {tracks.map((track) => (
          <Link
            key={track.id}
            href={`/learner/tracks/${track.id}`}
            className="block rounded-card border border-surface-200 bg-surface-0 p-4 shadow-card hover:shadow-card-hover transition-shadow"
          >
            <div className="flex items-start justify-between">
              <h3 className="text-body-lg font-medium text-surface-900">{track.name}</h3>
              <span
                className={`shrink-0 ml-2 rounded-full px-2 py-0.5 text-caption ${
                  track.status === "available"
                    ? "bg-accent-100 text-accent-700"
                    : "bg-surface-200 text-surface-600"
                }`}
              >
                {track.status === "available" ? "Available" : "Waitlisted"}
              </span>
            </div>
            <p className="mt-2 text-body-sm text-surface-500">{track.description}</p>
            <div className="mt-3 flex gap-4 text-caption text-surface-400">
              <span>{track.levels} levels</span>
              <span>{track.duration}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
