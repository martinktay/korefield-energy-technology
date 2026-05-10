import { describe, expect, it } from "vitest";

import {
  AI_NATIVE_FEATURE_FLAGS,
  FEATURE_FLAG_ENV_KEYS,
  getFeatureFlag,
  getFeatureFlags,
} from "../feature-flags";

describe("AI-native feature flags", () => {
  it("defaults every AI-native capability to off", () => {
    const flags = getFeatureFlags({});

    expect(Object.keys(flags)).toEqual([...AI_NATIVE_FEATURE_FLAGS]);
    expect(Object.values(flags)).toEqual(AI_NATIVE_FEATURE_FLAGS.map(() => false));
  });

  it("parses explicit truthy and falsey environment values", () => {
    expect(
      getFeatureFlag("ai_lesson_tutor", {
        [FEATURE_FLAG_ENV_KEYS.ai_lesson_tutor]: "true",
      }),
    ).toBe(true);
    expect(
      getFeatureFlag("ai_submission_feedback", {
        [FEATURE_FLAG_ENV_KEYS.ai_submission_feedback]: "1",
      }),
    ).toBe(true);
    expect(
      getFeatureFlag("ai_adaptive_recommendations", {
        [FEATURE_FLAG_ENV_KEYS.ai_adaptive_recommendations]: "yes",
      }),
    ).toBe(true);
    expect(
      getFeatureFlag("ai_instructor_insights", {
        [FEATURE_FLAG_ENV_KEYS.ai_instructor_insights]: "on",
      }),
    ).toBe(true);
    expect(
      getFeatureFlag("ai_corporate_cohort_insights", {
        [FEATURE_FLAG_ENV_KEYS.ai_corporate_cohort_insights]: "false",
      }),
    ).toBe(false);
    expect(
      getFeatureFlag("offline_progress_sync", {
        [FEATURE_FLAG_ENV_KEYS.offline_progress_sync]: "0",
      }),
    ).toBe(false);
  });

  it("treats misspelled or unsupported values as safely off", () => {
    expect(
      getFeatureFlag("ai_diagnostic_onboarding", {
        [FEATURE_FLAG_ENV_KEYS.ai_diagnostic_onboarding]: "enabled",
      }),
    ).toBe(false);
    expect(
      getFeatureFlag("low_data_mode", {
        [FEATURE_FLAG_ENV_KEYS.low_data_mode]: "maybe",
      }),
    ).toBe(false);
  });
});
