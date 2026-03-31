/**
 * @file learner-progress-store.property.test.ts — Property-based tests for the
 * learner progress store backend sync. Validates that progress mutations issue
 * the correct HTTP requests and that server/local merge prefers the most recent
 * updated_at timestamp.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fc from "fast-check";

vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn().mockRejectedValue(new Error("no backend in test")),
}));

import { useLearnerProgressStore } from "@/stores/learner-progress-store";

// ─── Generators ─────────────────────────────────────────────────

/** Arbitrary lesson ID in domain-prefixed format. */
const arbLessonId = fc.stringMatching(/^LSN-[a-z0-9]{4,8}$/);

/** Arbitrary active tab value. */
const arbActiveTab = fc.constantFrom<"learn" | "practice" | "apply">(
  "learn",
  "practice",
  "apply",
);

/** Arbitrary progress partial update payload. */
const arbProgressUpdates = fc.record({
  activeTab: arbActiveTab,
  codeValue: fc.option(fc.string({ minLength: 0, maxLength: 200 }), { nil: undefined }),
  practiceInput: fc.option(fc.string({ minLength: 0, maxLength: 200 }), { nil: undefined }),
  deliverableInput: fc.option(fc.string({ minLength: 0, maxLength: 200 }), { nil: undefined }),
  submitted: fc.option(fc.boolean(), { nil: undefined }),
  mcqAnswers: fc.option(
    fc.dictionary(
      fc.integer({ min: 0, max: 9 }).map(String),
      fc.integer({ min: 0, max: 3 }),
    ),
    { nil: undefined },
  ),
});


describe("Learner Progress Store — Property 11: Learner Progress Mutation Sync", () => {
  /**
   * **Validates: Requirements 6.1, 6.2**
   *
   * For any progress mutation (saveProgress, markCompleted), the Learner
   * Progress Store should issue the corresponding HTTP request (POST, PUT)
   * to the backend progress API with the correct lesson ID and payload.
   */

  let mockApiFetch: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.useFakeTimers();
    const apiModule = await import("@/lib/api");
    mockApiFetch = vi.mocked(apiModule.apiFetch);
    mockApiFetch.mockReset();
    mockApiFetch.mockResolvedValue(undefined);

    useLearnerProgressStore.setState({
      progress: {},
      _serverFetched: true,
    });
  });

  afterEach(() => {
    mockApiFetch.mockReset();
    mockApiFetch.mockRejectedValue(new Error("no backend in test"));
    vi.useRealTimers();
  });

  it("saveProgress issues debounced POST /progress/lessons/:lessonId with correct payload", () => {
    fc.assert(
      fc.property(arbLessonId, arbProgressUpdates, (lessonId, updates) => {
        // Reset state and mock for each iteration
        useLearnerProgressStore.setState({
          progress: {},
          _serverFetched: true,
        });
        mockApiFetch.mockReset();
        mockApiFetch.mockResolvedValue(undefined);

        useLearnerProgressStore.getState().saveProgress(lessonId, updates);

        // Advance timers past the 1000ms debounce
        vi.advanceTimersByTime(1100);

        // Verify POST was called with correct endpoint
        expect(mockApiFetch).toHaveBeenCalledWith(
          `/progress/lessons/${lessonId}`,
          expect.objectContaining({
            method: "POST",
          }),
        );

        // Verify the body contains the expected fields
        const call = mockApiFetch.mock.calls.find(
          (c: unknown[]) => c[0] === `/progress/lessons/${lessonId}`,
        );
        expect(call).toBeDefined();
        const body = JSON.parse((call![1] as RequestInit).body as string);
        expect(body.active_tab).toBe(updates.activeTab);
        expect(body.code_value).toBe(updates.codeValue);
        expect(body.practice_input).toBe(updates.practiceInput);
        expect(body.deliverable_input).toBe(updates.deliverableInput);
        expect(body.submitted).toBe(updates.submitted);
        expect(body.mcq_answers).toEqual(updates.mcqAnswers);
      }),
      { numRuns: 100 },
    );
  });

  it("markCompleted issues PUT /progress/lessons/:lessonId/complete", () => {
    fc.assert(
      fc.property(arbLessonId, (lessonId) => {
        // Reset state and mock for each iteration
        useLearnerProgressStore.setState({
          progress: {},
          _serverFetched: true,
        });
        mockApiFetch.mockReset();
        mockApiFetch.mockResolvedValue(undefined);

        useLearnerProgressStore.getState().markCompleted(lessonId);

        // markCompleted calls PUT immediately (no debounce)
        expect(mockApiFetch).toHaveBeenCalledWith(
          `/progress/lessons/${lessonId}/complete`,
          expect.objectContaining({
            method: "PUT",
          }),
        );
      }),
      { numRuns: 100 },
    );
  });
});


describe("Learner Progress Store — Property 12: Progress Merge Prefers Most Recent", () => {
  /**
   * **Validates: Requirements 6.4**
   *
   * For any pair of a server-side progress record and a localStorage progress
   * record for the same lesson, the merge should select the record with the
   * more recent updated_at / updatedAt timestamp.
   */

  let mockApiFetch: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    const apiModule = await import("@/lib/api");
    mockApiFetch = vi.mocked(apiModule.apiFetch);
    mockApiFetch.mockReset();

    useLearnerProgressStore.setState({
      progress: {},
      _serverFetched: false,
    });
  });

  afterEach(() => {
    mockApiFetch.mockReset();
    mockApiFetch.mockRejectedValue(new Error("no backend in test"));
  });

  it("merge selects the record with the more recent timestamp", async () => {
    await fc.assert(
      fc.asyncProperty(
        arbLessonId,
        arbActiveTab,
        fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
        arbActiveTab,
        fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
        // Two distinct timestamps — one for server, one for local
        fc.integer({ min: 1_600_000_000_000, max: 1_700_000_000_000 }),
        fc.integer({ min: 1_600_000_000_000, max: 1_700_000_000_000 }),
        async (
          lessonId,
          serverTab,
          serverCode,
          localTab,
          localCode,
          serverTs,
          localTs,
        ) => {
          // Ensure timestamps are distinct so there's a clear winner
          if (serverTs === localTs) return;

          const serverUpdatedAt = new Date(serverTs).toISOString();

          // Set up local progress
          useLearnerProgressStore.setState({
            progress: {
              [lessonId]: {
                activeTab: localTab,
                codeValue: localCode,
                updatedAt: localTs,
              },
            },
            _serverFetched: false,
          });

          // Mock server response — resolve immediately
          mockApiFetch.mockReset();
          mockApiFetch.mockResolvedValue([
            {
              lesson_id: lessonId,
              active_tab: serverTab,
              code_value: serverCode,
              updated_at: serverUpdatedAt,
            },
          ]);

          // Trigger server sync
          useLearnerProgressStore.getState()._syncFromServer();

          // Flush the microtask queue so the .then() handler runs
          await vi.waitFor(() => {
            const result =
              useLearnerProgressStore.getState().progress[lessonId];
            expect(result).toBeDefined();

            if (serverTs > localTs) {
              expect(result.activeTab).toBe(serverTab);
              expect(result.codeValue).toBe(serverCode);
              expect(result.updatedAt).toBe(serverTs);
            } else {
              expect(result.activeTab).toBe(localTab);
              expect(result.codeValue).toBe(localCode);
              expect(result.updatedAt).toBe(localTs);
            }
          });
        },
      ),
      { numRuns: 100 },
    );
  });
});
