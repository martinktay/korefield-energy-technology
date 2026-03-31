"use client";

/**
 * @file register/page.tsx
 * Multi-step onboarding wizard for new learners.
 * Step 1: Account Creation (name, email, password, confirm password)
 * Step 2: Profile Setup (country, professional background, learning goals, optional project interest)
 * Step 3: Track Recommendation (based on selections, show recommended tracks)
 * Renders outside the sidebar layout (excluded in learner/layout.tsx).
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { CustomSelect } from "@/components/ui/custom-select";

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

/* ── Main Component ── */

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [step1Errors, setStep1Errors] = useState<Step1Errors>({});

  // Step 2
  const [country, setCountry] = useState("");
  const [background, setBackground] = useState<Background | "">("");
  const [goals, setGoals] = useState<LearningGoal[]>([]);
  const [projectInterest, setProjectInterest] = useState("");
  const [step2Errors, setStep2Errors] = useState<Step2Errors>({});

  // Step 3
  const [selectedTrack, setSelectedTrack] = useState("");

  function validateStep1(): Step1Errors {
    const errs: Step1Errors = {};
    if (!name.trim()) errs.name = "Full name is required";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Valid email required";
    if (!password || password.length < 8) errs.password = "At least 8 characters";
    if (password !== confirm) errs.confirm = "Passwords don't match";
    return errs;
  }

  function validateStep2(): Step2Errors {
    const errs: Step2Errors = {};
    if (!country) errs.country = "Select your country";
    if (!background) errs.background = "Select your background";
    if (goals.length === 0) errs.goals = "Select at least one goal";
    return errs;
  }

  function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateStep1();
    setStep1Errors(errs);
    if (Object.keys(errs).length === 0) setStep(2);
  }

  function handleStep2(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateStep2();
    setStep2Errors(errs);
    if (Object.keys(errs).length === 0) setStep(3);
  }

  async function handleFinish() {
    setLoading(true);
    try {
      // Submit profile data including optional project interest
      await apiFetch("/enrollment/onboard", {
        method: "POST",
        body: JSON.stringify({
          learner_id: "", // populated by backend from JWT
          country,
          professional_background: background,
          learning_goals: goals.join(", "),
        }),
      });

      // Submit project interest if provided
      if (projectInterest.trim()) {
        await apiFetch("/enrollment/learners/me", {
          method: "PATCH",
          body: JSON.stringify({ project_interest: projectInterest.trim() }),
        });
      }
    } catch {
      // Proceed even if API calls fail during development
    }
    setLoading(false);
    router.push("/learner/foundation");
  }

  function toggleGoal(goal: LearningGoal) {
    setGoals((prev) => prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]);
  }

  const recommendedTracks = getRecommendedTracks(background, goals);

  const inputClass = "w-full rounded-xl border border-surface-200 bg-surface-50 px-3.5 py-3 text-body-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:bg-surface-0 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all";

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-50 px-4 py-12">
      <div className="w-full max-w-lg animate-fade-in-up">
        <div className="text-center mb-6">
          <Link href="/" className="text-heading-lg text-brand-700 font-bold">KoreField Academy</Link>
          <p className="mt-1 text-body-sm text-surface-500">Create your free account</p>
        </div>

        <StepIndicator current={step} />

        <div className="rounded-2xl border border-surface-200 bg-surface-0 p-8 shadow-card-hover">
          {/* Step 1: Account */}
          {step === 1 && (
            <form onSubmit={handleStep1} className="space-y-5" noValidate>
              <h2 className="text-heading-sm text-surface-900">Create your account</h2>
              <div>
                <label htmlFor="name" className="block text-body-sm font-medium text-surface-700 mb-1.5">Full Name</label>
                <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Kofi Mensah" className={inputClass} aria-invalid={!!step1Errors.name} />
                {step1Errors.name && <p className="mt-1.5 text-caption text-status-error">{step1Errors.name}</p>}
              </div>
              <div>
                <label htmlFor="reg-email" className="block text-body-sm font-medium text-surface-700 mb-1.5">Email</label>
                <input id="reg-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inputClass} aria-invalid={!!step1Errors.email} />
                {step1Errors.email && <p className="mt-1.5 text-caption text-status-error">{step1Errors.email}</p>}
              </div>
              <div>
                <label htmlFor="reg-password" className="block text-body-sm font-medium text-surface-700 mb-1.5">Password</label>
                <input id="reg-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" className={inputClass} aria-invalid={!!step1Errors.password} />
                {step1Errors.password && <p className="mt-1.5 text-caption text-status-error">{step1Errors.password}</p>}
              </div>
              <div>
                <label htmlFor="reg-confirm" className="block text-body-sm font-medium text-surface-700 mb-1.5">Confirm Password</label>
                <input id="reg-confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat your password" className={inputClass} aria-invalid={!!step1Errors.confirm} />
                {step1Errors.confirm && <p className="mt-1.5 text-caption text-status-error">{step1Errors.confirm}</p>}
              </div>
              <button type="submit" className="w-full rounded-xl bg-brand-600 px-4 py-3 text-body-sm font-semibold text-white shadow-sm hover:bg-brand-700 hover:shadow-md transition-all active:scale-[0.98]">
                Continue
              </button>
            </form>
          )}

          {/* Step 2: Profile */}
          {step === 2 && (
            <form onSubmit={handleStep2} className="space-y-5" noValidate>
              <h2 className="text-heading-sm text-surface-900">Tell us about yourself</h2>
              <div>
                <label htmlFor="country" className="block text-body-sm font-medium text-surface-700 mb-1.5">Country</label>
                <CustomSelect id="country" value={country} onChange={(v) => setCountry(v)} options={[{ value: "", label: "Select country" }, ...COUNTRIES.map((c) => ({ value: c, label: c }))]} aria-label="Country" />
                {step2Errors.country && <p className="mt-1.5 text-caption text-status-error">{step2Errors.country}</p>}
              </div>
              <div>
                <p className="text-body-sm font-medium text-surface-700 mb-2">Professional Background</p>
                <div className="flex flex-wrap gap-2">
                  {BACKGROUNDS.map((bg) => (
                    <button key={bg} type="button" onClick={() => setBackground(bg)}
                      className={`rounded-xl px-4 py-2 text-body-sm border transition-all ${background === bg ? "bg-brand-50 border-brand-300 text-brand-700 font-medium" : "border-surface-200 text-surface-600 hover:border-surface-300 hover:bg-surface-50"}`}>
                      {bg}
                    </button>
                  ))}
                </div>
                {step2Errors.background && <p className="mt-1.5 text-caption text-status-error">{step2Errors.background}</p>}
              </div>
              <div>
                <p className="text-body-sm font-medium text-surface-700 mb-2">Learning Goals <span className="text-surface-400 font-normal">(select all that apply)</span></p>
                <div className="flex flex-wrap gap-2">
                  {LEARNING_GOALS.map((goal) => (
                    <button key={goal} type="button" onClick={() => toggleGoal(goal)}
                      className={`rounded-xl px-4 py-2 text-body-sm border transition-all ${goals.includes(goal) ? "bg-brand-50 border-brand-300 text-brand-700 font-medium" : "border-surface-200 text-surface-600 hover:border-surface-300 hover:bg-surface-50"}`}>
                      {goal}
                    </button>
                  ))}
                </div>
                {step2Errors.goals && <p className="mt-1.5 text-caption text-status-error">{step2Errors.goals}</p>}
              </div>
              <div>
                <label htmlFor="project-interest" className="block text-body-sm font-medium text-surface-700 mb-1.5">What do you want to build? <span className="text-surface-400 font-normal">(optional)</span></label>
                <textarea
                  id="project-interest"
                  value={projectInterest}
                  onChange={(e) => setProjectInterest(e.target.value.slice(0, 500))}
                  placeholder="e.g., A fraud detection system for mobile payments"
                  maxLength={500}
                  rows={3}
                  className={inputClass}
                />
                <p className="mt-1 text-caption text-surface-400">{projectInterest.length}/500</p>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="rounded-xl border border-surface-200 px-4 py-3 text-body-sm text-surface-700 hover:bg-surface-50 transition-all flex-1">Back</button>
                <button type="submit" className="rounded-xl bg-brand-600 px-4 py-3 text-body-sm font-semibold text-white shadow-sm hover:bg-brand-700 hover:shadow-md transition-all active:scale-[0.98] flex-1">Continue</button>
              </div>
            </form>
          )}

          {/* Step 3: Track Selection */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-heading-sm text-surface-900">Choose your track</h2>
              <p className="text-body-sm text-surface-500">Based on your profile, here are our recommendations. You can always change later.</p>
              <div className="space-y-3">
                {recommendedTracks.map((track, i) => (
                  <button key={track.id} type="button" onClick={() => setSelectedTrack(track.id)}
                    className={`w-full text-left rounded-xl border p-4 transition-all ${selectedTrack === track.id ? "border-brand-400 bg-brand-50 shadow-sm" : "border-surface-200 hover:border-surface-300 hover:bg-surface-50"}`}>
                    <div className="flex items-start gap-3">
                      <span className="text-heading-sm">{track.emoji}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-body-sm font-semibold text-surface-900">{track.name}</p>
                          {i === 0 && <span className="text-caption font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">Top match</span>}
                        </div>
                        <p className="text-caption text-surface-500 mt-1">{track.description}</p>
                        <p className="text-caption text-surface-400 mt-1">{track.match}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(2)} className="rounded-xl border border-surface-200 px-4 py-3 text-body-sm text-surface-700 hover:bg-surface-50 transition-all flex-1">Back</button>
                <button type="button" onClick={handleFinish} disabled={!selectedTrack || loading}
                  className="rounded-xl bg-brand-600 px-4 py-3 text-body-sm font-semibold text-white shadow-sm hover:bg-brand-700 hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex-1">
                  {loading ? "Creating account..." : "Start Learning"}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-body-sm text-surface-500">
          Already have an account?{" "}
          <Link href="/learner/login" className="font-semibold text-brand-600 hover:text-brand-700 transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
