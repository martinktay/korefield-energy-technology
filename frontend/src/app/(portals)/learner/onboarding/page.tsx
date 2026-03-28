/** @file learner/onboarding/page.tsx — 3-step onboarding wizard collecting country, background, and learning goals for track recommendations. */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const countries = ["Nigeria", "Kenya", "South Africa", "Ghana", "Egypt", "Rwanda", "Other"];
const backgrounds = ["Student", "Software Developer", "Data Analyst", "Business Professional", "Educator", "Other"];
const goals = [
  "Build AI applications",
  "Transition into data science",
  "Strengthen cybersecurity skills",
  "Lead AI product teams",
  "General AI literacy",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [country, setCountry] = useState("");
  const [background, setBackground] = useState("");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [complete, setComplete] = useState(false);

  function toggleGoal(goal: string) {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  }

  function handleNext() {
    if (step < 2) {
      setStep(step + 1);
    } else {
      setComplete(true);
    }
  }

  const canProceed =
    (step === 0 && country !== "") ||
    (step === 1 && background !== "") ||
    (step === 2 && selectedGoals.length > 0);

  if (complete) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface-50 px-4 text-center">
        <div className="w-full max-w-md rounded-card border border-surface-200 bg-surface-0 p-8 shadow-card">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-100">
            <span className="text-heading-sm text-accent-600">✓</span>
          </div>
          <h1 className="mt-4 text-heading-lg text-surface-900">You&apos;re all set!</h1>
          <p className="mt-2 text-body-sm text-surface-500">
            Based on your goals, we recommend starting with the AI Foundation School.
            You&apos;ll be auto-enrolled now.
          </p>
          <button
            type="button"
            onClick={() => router.push("/learner/foundation")}
            className="mt-6 rounded-lg bg-brand-600 px-6 py-2.5 text-body-sm font-medium text-white hover:bg-brand-700 transition-colors"
          >
            Start AI Foundation School
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-heading-lg text-brand-700 font-semibold">
            KoreField Academy
          </Link>
        </div>
        <div className="rounded-card border border-surface-200 bg-surface-0 p-8 shadow-card space-y-6">
          <div>
            <h1 className="text-heading-sm text-surface-900">Welcome to KoreField</h1>
            <p className="mt-1 text-body-sm text-surface-500">
              Step {step + 1} of 3 — Tell us about yourself
            </p>
            {/* Progress indicator */}
            <div className="mt-3 flex gap-1.5">
              {[0, 1, 2].map((i) => (
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
          <legend className="text-body-sm font-medium text-surface-700 mb-2">
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
          <legend className="text-body-sm font-medium text-surface-700 mb-2">
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
          <legend className="text-body-sm font-medium text-surface-700 mb-2">
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

          <div className="flex gap-3">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="rounded-lg border border-surface-300 px-4 py-2 text-body-sm text-surface-700 hover:bg-surface-100 transition-colors"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed}
              className="rounded-lg bg-brand-600 px-4 py-2 text-body-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {step === 2 ? "Complete" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
