/** @file learner/onboarding/page.tsx - flag-gated diagnostic onboarding with rule-based fallback. */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { getFeatureFlag } from "@/lib/feature-flags";
import {
  type DiagnosticOnboardingRequest,
  type DiagnosticOnboardingResponse,
  generateDiagnosticOnboarding,
} from "@/lib/agent-api";

const DRAFT_KEY = "kf_ai_diagnostic_onboarding_v1";
const DEFAULT_LEARNER_ID = "LRN-local-onboarding";

const countries = ["Nigeria", "Kenya", "South Africa", "Ghana", "Egypt", "Rwanda", "Other"];
const backgrounds = ["Student", "Software Developer", "Data Analyst", "Business Professional", "Educator", "Other"];
const goals = [
  "Build AI applications",
  "Transition into data science",
  "Strengthen cybersecurity skills",
  "Lead AI product teams",
  "General AI literacy",
];
const codingBackgrounds = ["New to coding", "Beginner", "Intermediate", "Advanced"];
const aiBackgrounds = ["New to AI", "Some AI basics", "Used AI tools", "Built AI projects"];
const paces = ["Gentle", "Steady", "Fast"];
const diagnosticQuestions = [
  {
    id: "prompting",
    prompt: "Which best describes a useful prompt?",
    options: [
      "A short command with no context",
      "Clear instructions that guide an AI response",
      "A password for an AI tool",
    ],
    answer: "Clear instructions that guide an AI response",
  },
  {
    id: "evaluation",
    prompt: "What should you do before trusting an AI answer?",
    options: [
      "Accept it if it sounds confident",
      "Use data to check whether the answer is reliable",
      "Share it without review",
    ],
    answer: "Use data to check whether the answer is reliable",
  },
  {
    id: "workflow",
    prompt: "What is an AI workflow?",
    options: [
      "A reusable set of instructions and tools",
      "A single social media post",
      "A hardware repair checklist only",
    ],
    answer: "A reusable set of instructions and tools",
  },
];

interface DraftState {
  country: string;
  background: string;
  selectedGoals: string[];
  codingBackground: string;
  aiBackground: string;
  pace: string;
  projectInterest: string;
  diagnosticAnswers: Record<string, string>;
}

function getLearnerId() {
  if (typeof window === "undefined") return DEFAULT_LEARNER_ID;
  return localStorage.getItem("kf_learner_id") || DEFAULT_LEARNER_ID;
}

function pickTrack(selectedGoals: string[], background: string) {
  const text = [...selectedGoals, background].join(" ").toLowerCase();
  if (text.includes("data")) return "Data Science and Decision Intelligence";
  if (text.includes("cybersecurity") || text.includes("security")) return "Cybersecurity and AI Security";
  if (text.includes("product") || text.includes("business") || text.includes("lead")) return "AI Product and Project Leadership";
  return "AI Engineering and Intelligent Systems";
}

function buildFallbackDiagnostic(params: DiagnosticOnboardingRequest): DiagnosticOnboardingResponse {
  const track = pickTrack(params.learning_goals, params.learner_role ?? "");
  const coding = (params.prior_coding_background ?? "").toLowerCase();
  const startingLevel = coding.includes("advanced") || coding.includes("intermediate") ? "foundation" : "beginner";

  return {
    learner_id: params.learner_id,
    starting_level: startingLevel,
    recommended_track: track,
    recommended_path: "AI Foundation School",
    weak_area_tags: ["ai_basics", "practical_problem_framing"],
    rationale: "Based on your answers, Foundation School is the safest starting point before moving into a specialized track.",
    focus_areas: ["AI vocabulary", "Responsible AI habits", "Hands-on practice"],
    confidence: "medium",
    source: "fallback",
    created_at: new Date().toISOString(),
    telemetry: {
      workflow: "diagnostic_onboarding",
      status: "fallback",
    },
  };
}

export default function OnboardingPage() {
  const router = useRouter();
  const diagnosticEnabled = getFeatureFlag("ai_diagnostic_onboarding");
  const [step, setStep] = useState(0);
  const [country, setCountry] = useState("");
  const [background, setBackground] = useState("");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [codingBackground, setCodingBackground] = useState("");
  const [aiBackground, setAiBackground] = useState("");
  const [pace, setPace] = useState("");
  const [projectInterest, setProjectInterest] = useState("");
  const [diagnosticAnswers, setDiagnosticAnswers] = useState<Record<string, string>>({});
  const [complete, setComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticOnboardingResponse | null>(null);

  useEffect(() => {
    if (!diagnosticEnabled || typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as Partial<DraftState>;
      setCountry(draft.country ?? "");
      setBackground(draft.background ?? "");
      setSelectedGoals(draft.selectedGoals ?? []);
      setCodingBackground(draft.codingBackground ?? "");
      setAiBackground(draft.aiBackground ?? "");
      setPace(draft.pace ?? "");
      setProjectInterest(draft.projectInterest ?? "");
      setDiagnosticAnswers(draft.diagnosticAnswers ?? {});
    } catch {
      localStorage.removeItem(DRAFT_KEY);
    }
  }, [diagnosticEnabled]);

  useEffect(() => {
    if (!diagnosticEnabled || typeof window === "undefined") return;
    const draft: DraftState = {
      country,
      background,
      selectedGoals,
      codingBackground,
      aiBackground,
      pace,
      projectInterest,
      diagnosticAnswers,
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [
    diagnosticEnabled,
    country,
    background,
    selectedGoals,
    codingBackground,
    aiBackground,
    pace,
    projectInterest,
    diagnosticAnswers,
  ]);

  function toggleGoal(goal: string) {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  }

  function setDiagnosticAnswer(questionId: string, answer: string) {
    setDiagnosticAnswers((prev) => ({ ...prev, [questionId]: answer }));
  }

  const diagnosticRequest = useMemo<DiagnosticOnboardingRequest>(() => ({
    learner_id: getLearnerId(),
    country,
    learner_role: background,
    prior_coding_background: codingBackground,
    prior_ai_background: aiBackground,
    learning_goals: selectedGoals,
    project_interest: projectInterest.trim() || null,
    preferred_pace: pace,
    diagnostic_answers: Object.entries(diagnosticAnswers).map(([question_id, answer]) => ({
      question_id,
      answer,
    })),
  }), [country, background, codingBackground, aiBackground, selectedGoals, projectInterest, pace, diagnosticAnswers]);

  async function persistDiagnosticResult(result: DiagnosticOnboardingResponse) {
    try {
      await apiFetch("/enrollment/diagnostic-results", {
        method: "POST",
        body: JSON.stringify({
          ...diagnosticRequest,
          starting_level: result.starting_level,
          recommended_track: result.recommended_track,
          recommended_path: result.recommended_path,
          weak_area_tags: result.weak_area_tags,
          rationale: result.rationale,
          focus_areas: result.focus_areas,
          confidence: result.confidence,
          source: result.source,
          telemetry: result.telemetry,
        }),
        timeout: 8_000,
        retries: 0,
      });
    } catch {
      // Onboarding must not be blocked by persistence failures.
    }
  }

  async function completeDiagnostic() {
    setSubmitting(true);
    let result: DiagnosticOnboardingResponse;
    try {
      result = await generateDiagnosticOnboarding(
        diagnosticRequest,
        "learner",
        diagnosticRequest.learner_id,
        { timeoutMs: 20_000, maxRetries: 0 },
      );
    } catch {
      result = buildFallbackDiagnostic(diagnosticRequest);
    }

    setDiagnosticResult(result);
    await persistDiagnosticResult(result);
    setSubmitting(false);
    setComplete(true);
  }

  function handleNext() {
    if (!diagnosticEnabled) {
      if (step < 2) {
        setStep(step + 1);
      } else {
        setComplete(true);
      }
      return;
    }

    if (step < 4) {
      setStep(step + 1);
    } else {
      void completeDiagnostic();
    }
  }

  const maxStep = diagnosticEnabled ? 4 : 2;
  const canProceed =
    (step === 0 && country !== "") ||
    (step === 1 && background !== "") ||
    (step === 2 && selectedGoals.length > 0) ||
    (diagnosticEnabled && step === 3 && codingBackground !== "" && aiBackground !== "" && pace !== "") ||
    (diagnosticEnabled && step === 4 && diagnosticQuestions.every((q) => diagnosticAnswers[q.id]));

  if (complete) {
    if (diagnosticEnabled && diagnosticResult) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-surface-50 px-4 py-8 text-center">
          <div className="w-full max-w-md rounded-card border border-surface-200 bg-surface-0 p-6 shadow-card">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-100">
              <span className="text-heading-sm text-accent-600">OK</span>
            </div>
            <h1 className="mt-4 text-heading-lg text-surface-900">Your recommended starting point</h1>
            <p className="mt-2 text-heading-sm text-brand-700">{diagnosticResult.recommended_path}</p>
            <div className="mt-5 space-y-4 text-left">
              <section>
                <h2 className="text-body-sm font-semibold text-surface-900">Why this path fits you</h2>
                <p className="mt-1 text-body-sm text-surface-600">{diagnosticResult.rationale}</p>
              </section>
              <section>
                <h2 className="text-body-sm font-semibold text-surface-900">What to focus on first</h2>
                <ul className="mt-2 space-y-1 text-body-sm text-surface-600">
                  {diagnosticResult.focus_areas.map((area) => (
                    <li key={area}>- {area}</li>
                  ))}
                </ul>
              </section>
              <p className="text-caption text-surface-500">
                Recommended track: {diagnosticResult.recommended_track}. Confidence: {diagnosticResult.confidence}.
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/learner/foundation")}
              className="mt-6 rounded-lg bg-brand-600 px-6 py-2.5 text-body-sm font-medium text-white transition-colors hover:bg-brand-700"
            >
              Start AI Foundation School
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface-50 px-4 text-center">
        <div className="w-full max-w-md rounded-card border border-surface-200 bg-surface-0 p-8 shadow-card">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-100">
            <span className="text-heading-sm text-accent-600">OK</span>
          </div>
          <h1 className="mt-4 text-heading-lg text-surface-900">You&apos;re all set!</h1>
          <p className="mt-2 text-body-sm text-surface-500">
            Based on your goals, we recommend starting with the AI Foundation School.
            You&apos;ll be auto-enrolled now.
          </p>
          <button
            type="button"
            onClick={() => router.push("/learner/foundation")}
            className="mt-6 rounded-lg bg-brand-600 px-6 py-2.5 text-body-sm font-medium text-white transition-colors hover:bg-brand-700"
          >
            Start AI Foundation School
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="text-heading-lg font-semibold text-brand-700">
            KoreField Academy
          </Link>
        </div>
        <div className="space-y-6 rounded-card border border-surface-200 bg-surface-0 p-6 shadow-card sm:p-8">
          <div>
            <h1 className="text-heading-sm text-surface-900">Welcome to KoreField</h1>
            <p className="mt-1 text-body-sm text-surface-500">
              {diagnosticEnabled
                ? `Diagnostic step ${step + 1} of 5 - Tell us about yourself`
                : `Step ${step + 1} of 3 - Tell us about yourself`}
            </p>
            <div className="mt-3 flex gap-1.5">
              {Array.from({ length: maxStep + 1 }, (_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    i <= step ? "bg-brand-600" : "bg-surface-200"
                  }`}
                />
              ))}
            </div>
          </div>

          {step === 0 && (
            <fieldset>
              <legend className="mb-2 text-body-sm font-medium text-surface-700">
                Where are you based?
              </legend>
              <div className="space-y-2">
                {countries.map((c) => (
                  <label key={c} className="flex items-center gap-2 text-body-sm text-surface-700">
                    <input
                      type="radio"
                      name="country"
                      value={c}
                      checked={country === c}
                      onChange={() => setCountry(c)}
                      className="accent-brand-600"
                    />
                    {c}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {step === 1 && (
            <fieldset>
              <legend className="mb-2 text-body-sm font-medium text-surface-700">
                What is your professional background?
              </legend>
              <div className="space-y-2">
                {backgrounds.map((b) => (
                  <label key={b} className="flex items-center gap-2 text-body-sm text-surface-700">
                    <input
                      type="radio"
                      name="background"
                      value={b}
                      checked={background === b}
                      onChange={() => setBackground(b)}
                      className="accent-brand-600"
                    />
                    {b}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {step === 2 && (
            <fieldset>
              <legend className="mb-2 text-body-sm font-medium text-surface-700">
                What are your learning goals? (select all that apply)
              </legend>
              <div className="space-y-2">
                {goals.map((g) => (
                  <label key={g} className="flex items-center gap-2 text-body-sm text-surface-700">
                    <input
                      type="checkbox"
                      checked={selectedGoals.includes(g)}
                      onChange={() => toggleGoal(g)}
                      className="accent-brand-600"
                    />
                    {g}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {diagnosticEnabled && step === 3 && (
            <div className="space-y-5">
              <fieldset>
                <legend className="mb-2 text-body-sm font-medium text-surface-700">
                  Prior coding background
                </legend>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {codingBackgrounds.map((item) => (
                    <label key={item} className="flex items-center gap-2 text-body-sm text-surface-700">
                      <input
                        type="radio"
                        name="coding-background"
                        checked={codingBackground === item}
                        onChange={() => setCodingBackground(item)}
                        className="accent-brand-600"
                      />
                      {item}
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="mb-2 text-body-sm font-medium text-surface-700">
                  Prior AI background
                </legend>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {aiBackgrounds.map((item) => (
                    <label key={item} className="flex items-center gap-2 text-body-sm text-surface-700">
                      <input
                        type="radio"
                        name="ai-background"
                        checked={aiBackground === item}
                        onChange={() => setAiBackground(item)}
                        className="accent-brand-600"
                      />
                      {item}
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="mb-2 text-body-sm font-medium text-surface-700">
                  Preferred learning pace
                </legend>
                <div className="grid grid-cols-3 gap-2">
                  {paces.map((item) => (
                    <label key={item} className="flex items-center gap-2 text-body-sm text-surface-700">
                      <input
                        type="radio"
                        name="learning-pace"
                        checked={pace === item}
                        onChange={() => setPace(item)}
                        className="accent-brand-600"
                      />
                      {item}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div>
                <label htmlFor="project-interest" className="mb-1.5 block text-body-sm font-medium text-surface-700">
                  What do you want to build? <span className="font-normal text-surface-400">(optional)</span>
                </label>
                <textarea
                  id="project-interest"
                  rows={3}
                  maxLength={500}
                  value={projectInterest}
                  onChange={(event) => setProjectInterest(event.target.value.slice(0, 500))}
                  className="w-full rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-body-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:bg-surface-0 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  placeholder="e.g., A farm advisory assistant for smallholder farmers"
                />
                <p className="mt-1 text-caption text-surface-400">{projectInterest.length}/500</p>
              </div>
            </div>
          )}

          {diagnosticEnabled && step === 4 && (
            <fieldset>
              <legend className="mb-3 text-body-sm font-medium text-surface-700">
                Short skill diagnostic
              </legend>
              <div className="space-y-5">
                {diagnosticQuestions.map((question) => (
                  <div key={question.id}>
                    <p className="text-body-sm font-medium text-surface-700">{question.prompt}</p>
                    <div className="mt-2 space-y-2">
                      {question.options.map((option) => (
                        <label key={option} className="flex items-start gap-2 text-body-sm text-surface-700">
                          <input
                            type="radio"
                            name={question.id}
                            checked={diagnosticAnswers[question.id] === option}
                            onChange={() => setDiagnosticAnswer(question.id, option)}
                            className="mt-1 accent-brand-600"
                          />
                          {option}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </fieldset>
          )}

          <div className="flex gap-3">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="rounded-lg border border-surface-300 px-4 py-2 text-body-sm text-surface-700 transition-colors hover:bg-surface-100"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed || submitting}
              className="rounded-lg bg-brand-600 px-4 py-2 text-body-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {diagnosticEnabled && step === 4
                ? submitting ? "Checking..." : "Complete diagnostic"
                : step === maxStep ? "Complete" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
