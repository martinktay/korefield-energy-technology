"use client";

/**
 * @file register/page.tsx
 * Multi-step onboarding wizard for new learners.
 * Step 1: Account Creation (name, email, password, confirm password)
 * Step 2: Profile Setup (country, professional background, learning goals)
 * Step 3: Track Recommendation (based on selections, show recommended tracks)
 * Renders outside the sidebar layout (excluded in learner/layout.tsx).
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/* ── Constants ── */

const COUNTRIES = [
  "Nigeria", "South Africa", "Kenya", "Ghana", "Egypt", "Tanzania",
  "Ethiopia", "Rwanda", "Uganda", "Senegal", "Cameroon", "Morocco",
  "Côte d'Ivoire", "Mozambique", "Zambia", "Zimbabwe", "Botswana",
  "Namibia", "Mauritius", "United Kingdom", "United States", "Canada",
  "Germany", "France", "India", "United Arab Emirates", "Other",
];

const BACKGROUNDS = [
  "Student",
  "Working Professional",
  "Career Changer",
  "Educator",
  "Other",
] as const;

const LEARNING_GOALS = [
  "Build AI products",
  "Transition to AI career",
  "Upskill in current role",
  "Academic research",
  "Start a business",
] as const;

type Background = (typeof BACKGROUNDS)[number];
type LearningGoal = (typeof LEARNING_GOALS)[number];

interface Track {
  id: string;
  name: string;
  description: string;
  emoji: string;
  match: string;
}

const ALL_TRACKS: Track[] = [
  {
    id: "ai-engineering",
    name: "AI Engineering and Intelligent Systems",
    description: "Build production-grade AI systems, from model training to deployment pipelines.",
    emoji: "🤖",
    match: "Best for builders and engineers",
  },
  {
    id: "data-science",
    name: "Data Science and Decision Intelligence",
    description: "Turn raw data into actionable insights with statistical modeling and ML.",
    emoji: "📊",
    match: "Best for analysts and researchers",
  },
  {
    id: "cybersecurity",
    name: "Cybersecurity and AI Security",
    description: "Defend intelligent systems against adversarial attacks and emerging threats.",
    emoji: "🛡️",
    match: "Best for security-minded professionals",
  },
  {
    id: "ai-product",
    name: "AI Product and Project Leadership",
    description: "Lead AI-powered product teams from ideation through delivery and governance.",
    emoji: "🚀",
    match: "Best for leaders and entrepreneurs",
  },
];

/* ── Validation Types ── */

interface Step1Errors {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
}

interface Step2Errors {
  country?: string;
  background?: string;
  goals?: string;
}

/* ── Track Recommendation Logic ── */

function getRecommendedTracks(
  background: Background | "",
  goals: LearningGoal[]
): Track[] {
  const scores: Record<string, number> = {
    "ai-engineering": 0,
    "data-science": 0,
    "cybersecurity": 0,
    "ai-product": 0,
  };

  // Score by background
  if (background === "Student") {
    scores["ai-engineering"] += 2;
    scores["data-science"] += 2;
  } else if (background === "Working Professional") {
    scores["ai-engineering"] += 2;
    scores["cybersecurity"] += 1;
  } else if (background === "Career Changer") {
    scores["ai-engineering"] += 1;
    scores["data-science"] += 1;
    scores["ai-product"] += 1;
  } else if (background === "Educator") {
    scores["ai-product"] += 2;
    scores["data-science"] += 1;
  }

  // Score by goals
  goals.forEach((goal) => {
    if (goal === "Build AI products") {
      scores["ai-engineering"] += 3;
      scores["ai-product"] += 1;
    }
    if (goal === "Transition to AI career") {
      scores["ai-engineering"] += 1;
      scores["data-science"] += 1;
      scores["ai-product"] += 1;
    }
    if (goal === "Upskill in current role") {
      scores["cybersecurity"] += 2;
      scores["ai-engineering"] += 1;
    }
    if (goal === "Academic research") {
      scores["data-science"] += 3;
    }
    if (goal === "Start a business") {
      scores["ai-product"] += 3;
      scores["ai-engineering"] += 1;
    }
  });

  // Sort by score descending, return all (top ones first)
  return ALL_TRACKS.slice().sort(
    (a, b) => scores[b.id] - scores[a.id]
  );
}

/* ── Step Indicator ── */

function StepIndicator({ current }: { current: number }) {
  const steps = [
    { num: 1, label: "Account" },
    { num: 2, label: "Profile" },
    { num: 3, label: "Tracks" },
  ];

  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((step, i) => {
        const isCompleted = current > step.num;
        const isActive = current === step.num;

        return (
          <div key={step.num} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-body-sm font-semibold transition-colors ${
                  isCompleted
                    ? "bg-accent-600 text-white"
                    : isActive
                    ? "bg-brand-600 text-white"
                    : "bg-surface-200 text-surface-500"
                }`}
              >
                {isCompleted ? "✓" : step.num}
              </div>
              <span
                className={`mt-1.5 text-caption ${
                  isActive ? "text-brand-600 font-medium" : "text-surface-400"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`mx-3 h-0.5 w-12 sm:w-16 rounded-full transition-colors -mt-5 ${
                  current > step.num ? "bg-accent-600" : "bg-surface-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
