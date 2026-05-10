/**
 * @file feature-flags.ts — Centralized, production-safe flags for staged AI-native work.
 *
 * All Phase 2+ AI-native capabilities default to OFF. Env values must be
 * intentionally truthy ("true", "1", "yes", or "on") before any caller can
 * treat a capability as enabled.
 */

export const AI_NATIVE_FEATURE_FLAGS = [
  "ai_diagnostic_onboarding",
  "ai_lesson_tutor",
  "ai_submission_feedback",
  "ai_adaptive_recommendations",
  "ai_instructor_insights",
  "ai_corporate_cohort_insights",
  "low_data_mode",
  "offline_progress_sync",
] as const;

export type AiNativeFeatureFlag = (typeof AI_NATIVE_FEATURE_FLAGS)[number];

type FlagEnv = Record<string, string | boolean | number | undefined>;

export const FEATURE_FLAG_ENV_KEYS: Record<AiNativeFeatureFlag, string> = {
  ai_diagnostic_onboarding: "NEXT_PUBLIC_FEATURE_AI_DIAGNOSTIC_ONBOARDING",
  ai_lesson_tutor: "NEXT_PUBLIC_FEATURE_AI_LESSON_TUTOR",
  ai_submission_feedback: "NEXT_PUBLIC_FEATURE_AI_SUBMISSION_FEEDBACK",
  ai_adaptive_recommendations: "NEXT_PUBLIC_FEATURE_AI_ADAPTIVE_RECOMMENDATIONS",
  ai_instructor_insights: "NEXT_PUBLIC_FEATURE_AI_INSTRUCTOR_INSIGHTS",
  ai_corporate_cohort_insights: "NEXT_PUBLIC_FEATURE_AI_CORPORATE_COHORT_INSIGHTS",
  low_data_mode: "NEXT_PUBLIC_FEATURE_LOW_DATA_MODE",
  offline_progress_sync: "NEXT_PUBLIC_FEATURE_OFFLINE_PROGRESS_SYNC",
};

function parseFlagValue(value: string | boolean | number | undefined): boolean {
  if (value === true || value === 1) return true;
  if (typeof value !== "string") return false;

  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes" || normalized === "on";
}

export function getFeatureFlag(
  flag: AiNativeFeatureFlag,
  env: FlagEnv = process.env,
): boolean {
  return parseFlagValue(env[FEATURE_FLAG_ENV_KEYS[flag]]);
}

export function getFeatureFlags(
  env: FlagEnv = process.env,
): Record<AiNativeFeatureFlag, boolean> {
  return AI_NATIVE_FEATURE_FLAGS.reduce(
    (acc, flag) => {
      acc[flag] = getFeatureFlag(flag, env);
      return acc;
    },
    {} as Record<AiNativeFeatureFlag, boolean>,
  );
}

export function isAiNativeFeatureEnabled(flag: AiNativeFeatureFlag): boolean {
  return getFeatureFlag(flag);
}
