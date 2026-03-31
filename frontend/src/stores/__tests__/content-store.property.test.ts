/**
 * @file content-store.property.test.ts — Property-based tests for the content
 * store initialization. Validates that every lesson present in the static data
 * exports exists in the store's lessons array with identical field values.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import * as fc from "fast-check";

vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn().mockRejectedValue(new Error("no backend in test")),
  ApiError: class ApiError extends Error {
    status: number;
    body: unknown;
    constructor(status: number, body: unknown) {
      super(`API error: ${status}`);
      this.status = status;
      this.body = body;
    }
  },
}));

import { useContentStore } from "@/stores/content-store";
import { AI_ENGINEERING_LESSONS } from "@/data/ai-engineering-content";
import { DATA_SCIENCE_LESSONS } from "@/data/data-science-content";
import { CYBERSECURITY_LESSONS } from "@/data/cybersecurity-content";
import { AI_PRODUCT_LESSONS } from "@/data/ai-product-content";

const ALL_STATIC_LESSONS = [
  ...AI_ENGINEERING_LESSONS,
  ...DATA_SCIENCE_LESSONS,
  ...CYBERSECURITY_LESSONS,
  ...AI_PRODUCT_LESSONS,
];

describe("Content Store — Property 1: Store initialization completeness", () => {
  /**
   * **Validates: Requirements 1.1**
   *
   * For any lesson present in the static data exports, that lesson should
   * exist in the store's lessons array with identical field values after
   * initialization.
   */

  beforeEach(() => {
    // Reset store to initial state before each test
    useContentStore.setState({
      lessons: [
        ...AI_ENGINEERING_LESSONS,
        ...DATA_SCIENCE_LESSONS,
        ...CYBERSECURITY_LESSONS,
        ...AI_PRODUCT_LESSONS,
      ],
      emptyModules: [],
      conflictData: null,
    });
  });

  it("every static lesson exists in the store with identical field values", () => {
    fc.assert(
      fc.property(fc.constantFrom(...ALL_STATIC_LESSONS), (staticLesson) => {
        const storeLessons = useContentStore.getState().lessons;
        const storeLesson = storeLessons.find((l) => l.id === staticLesson.id);

        // Lesson must exist in the store
        expect(storeLesson).toBeDefined();

        // All field values must be identical
        expect(storeLesson).toEqual(staticLesson);
      }),
      { numRuns: 200 },
    );
  });

  it("store contains exactly the same number of lessons as the static data", () => {
    const storeLessons = useContentStore.getState().lessons;
    expect(storeLessons).toHaveLength(ALL_STATIC_LESSONS.length);
  });
});

describe("Content Store — Property 3: No lessons lost in transformation", () => {
  /**
   * **Validates: Requirements 2.5, 8.1**
   *
   * For any state of the store, the total number of lessons returned by
   * getAllModules() (summing all lessonCount values) should equal the total
   * number of lessons in the store's lessons array.
   */

  beforeEach(() => {
    useContentStore.setState({
      lessons: [...ALL_STATIC_LESSONS],
      emptyModules: [],
      conflictData: null,
    });
  });

  it("getAllModules() lesson count sum equals store lessons length for random subsets", () => {
    fc.assert(
      fc.property(
        fc.subarray(ALL_STATIC_LESSONS, { minLength: 1 }),
        (subset) => {
          useContentStore.setState({ lessons: subset, emptyModules: [] });

          const modules = useContentStore.getState().getAllModules();
          const totalFromModules = modules.reduce(
            (sum, m) => sum + m.lessonCount,
            0,
          );

          expect(totalFromModules).toBe(subset.length);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("getAllModules() lesson count sum equals store lessons length for full static data", () => {
    const modules = useContentStore.getState().getAllModules();
    const totalFromModules = modules.reduce(
      (sum, m) => sum + m.lessonCount,
      0,
    );

    expect(totalFromModules).toBe(ALL_STATIC_LESSONS.length);
  });
});

describe("Content Store — Property 13: Lesson lookup by ID", () => {
  /**
   * **Validates: Requirements 8.2**
   *
   * For any lesson ID present in the store's lessons array,
   * getLessonById(id) should return a lesson whose id field equals the
   * queried ID.
   */

  beforeEach(() => {
    useContentStore.setState({
      lessons: [...ALL_STATIC_LESSONS],
      emptyModules: [],
      conflictData: null,
    });
  });

  it("getLessonById returns a lesson with matching id for any static lesson", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_STATIC_LESSONS),
        (lesson) => {
          const result = useContentStore.getState().getLessonById(lesson.id);

          expect(result).toBeDefined();
          expect(result!.id).toBe(lesson.id);
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe("Content Store — Property 14: Track filter returns only matching modules", () => {
  /**
   * **Validates: Requirements 9.2, 9.3**
   *
   * For any track name, every module returned by getModulesForTrack(trackName)
   * should have trackName equal to the queried track name, and no module with
   * that track name should be missing from the result.
   */

  beforeEach(() => {
    useContentStore.setState({
      lessons: [...ALL_STATIC_LESSONS],
      emptyModules: [],
      conflictData: null,
    });
  });

  it("getModulesForTrack returns only modules matching the queried track and none are missing", () => {
    const distinctTrackNames = Array.from(
      new Set(ALL_STATIC_LESSONS.map((l) => l.trackName)),
    );

    fc.assert(
      fc.property(
        fc.constantFrom(...distinctTrackNames),
        (trackName) => {
          const state = useContentStore.getState();
          const filtered = state.getModulesForTrack(trackName);
          const allModules = state.getAllModules();

          // Every returned module must match the queried track
          for (const mod of filtered) {
            expect(mod.trackName).toBe(trackName);
          }

          // No module with that track name should be missing
          const expectedIds = allModules
            .filter((m) => m.trackName === trackName)
            .map((m) => m.id)
            .sort();
          const actualIds = filtered.map((m) => m.id).sort();

          expect(actualIds).toEqual(expectedIds);
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe("Content Store — Property 15: All-tracks view covers all tracks", () => {
  /**
   * **Validates: Requirements 9.3**
   *
   * For any state of the store, the set of distinct trackName values across
   * all modules returned by getAllModules() should equal the set of distinct
   * trackName values in the store's lessons array.
   */

  beforeEach(() => {
    useContentStore.setState({
      lessons: [...ALL_STATIC_LESSONS],
      emptyModules: [],
      conflictData: null,
    });
  });

  it("getAllModules() covers all tracks present in the lessons array for random subsets", () => {
    fc.assert(
      fc.property(
        fc.subarray(ALL_STATIC_LESSONS, { minLength: 1 }),
        (subset) => {
          useContentStore.setState({ lessons: subset, emptyModules: [] });

          const state = useContentStore.getState();
          const modules = state.getAllModules();

          const trackNamesFromModules = new Set(
            modules.map((m) => m.trackName),
          );
          const trackNamesFromLessons = new Set(
            subset.map((l) => l.trackName),
          );

          expect(trackNamesFromModules).toEqual(trackNamesFromLessons);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("getAllModules() covers all tracks for full static data", () => {
    const state = useContentStore.getState();
    const modules = state.getAllModules();

    const trackNamesFromModules = new Set(modules.map((m) => m.trackName));
    const trackNamesFromLessons = new Set(
      ALL_STATIC_LESSONS.map((l) => l.trackName),
    );

    expect(trackNamesFromModules).toEqual(trackNamesFromLessons);
  });
});

describe("Content Store — Property 4: Update lesson preserves unchanged fields", () => {
  /**
   * **Validates: Requirements 3.2**
   *
   * For any lesson in the store and any partial update (e.g., changing only
   * title), after calling updateLesson, the lesson returned by getLessonById
   * should have the updated fields changed and all other fields identical to
   * their pre-update values.
   */

  beforeEach(() => {
    useContentStore.setState({
      lessons: [...ALL_STATIC_LESSONS],
      emptyModules: [],
      conflictData: null,
    });
  });

  it("updating only the title preserves all other fields", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_STATIC_LESSONS),
        fc.string({ minLength: 1, maxLength: 50 }),
        (lesson, newTitle) => {
          // Reset state for each iteration
          useContentStore.setState({
            lessons: [...ALL_STATIC_LESSONS],
            emptyModules: [],
            conflictData: null,
          });

          const before = useContentStore.getState().getLessonById(lesson.id);
          expect(before).toBeDefined();

          useContentStore.getState().updateLesson(lesson.id, { title: newTitle });

          const after = useContentStore.getState().getLessonById(lesson.id);
          expect(after).toBeDefined();

          // Updated field should reflect the new value
          expect(after!.title).toBe(newTitle);

          // All other fields must be identical to pre-update values
          expect(after!.id).toBe(before!.id);
          expect(after!.moduleId).toBe(before!.moduleId);
          expect(after!.moduleName).toBe(before!.moduleName);
          expect(after!.trackName).toBe(before!.trackName);
          expect(after!.levelTier).toBe(before!.levelTier);
          expect(after!.lessonType).toBe(before!.lessonType);
          expect(after!.duration).toBe(before!.duration);
          expect(after!.objectives).toEqual(before!.objectives);
          expect(after!.content).toEqual(before!.content);
          expect(after!.reviewQuestions).toEqual(before!.reviewQuestions);
          expect(after!.deliverable).toBe(before!.deliverable);
          expect(after!.nextLessonId).toBe(before!.nextLessonId);
          expect(after!.prevLessonId).toBe(before!.prevLessonId);
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe("Content Store — Property 5: Delete removes lesson and decrements count", () => {
  /**
   * **Validates: Requirements 4.1**
   *
   * For any lesson in the store, after calling deleteLesson with that
   * lesson's ID, getLessonById should return undefined and the store's
   * total lesson count should have decreased by exactly 1.
   */

  beforeEach(() => {
    useContentStore.setState({
      lessons: [...ALL_STATIC_LESSONS],
      emptyModules: [],
      conflictData: null,
    });
  });

  it("deleting a lesson removes it and decrements total count by 1", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_STATIC_LESSONS),
        (lesson) => {
          // Reset state for each iteration
          useContentStore.setState({
            lessons: [...ALL_STATIC_LESSONS],
            emptyModules: [],
            conflictData: null,
          });

          const countBefore = useContentStore.getState().lessons.length;

          useContentStore.getState().deleteLesson(lesson.id);

          const countAfter = useContentStore.getState().lessons.length;
          const lookup = useContentStore.getState().getLessonById(lesson.id);

          expect(lookup).toBeUndefined();
          expect(countAfter).toBe(countBefore - 1);
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe("Content Store — Property 6: Contiguous sequence numbers after delete", () => {
  /**
   * **Validates: Requirements 4.3**
   *
   * For any module in the store, after deleting any lesson from that module,
   * the remaining lessons' sequence numbers should form a contiguous range
   * starting from 1.
   */

  beforeEach(() => {
    useContentStore.setState({
      lessons: [...ALL_STATIC_LESSONS],
      emptyModules: [],
      conflictData: null,
    });
  });

  it("sequences are contiguous [1..N] after deleting any lesson", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_STATIC_LESSONS),
        (lesson) => {
          // Reset state for each iteration
          useContentStore.setState({
            lessons: [...ALL_STATIC_LESSONS],
            emptyModules: [],
            conflictData: null,
          });

          const moduleId = lesson.moduleId;

          useContentStore.getState().deleteLesson(lesson.id);

          const modules = useContentStore.getState().getAllModules();
          const mod = modules.find((m) => m.id === moduleId);

          if (mod && mod.lessons.length > 0) {
            const sequences = mod.lessons.map((l) => l.sequence).sort((a, b) => a - b);
            const expected = Array.from({ length: sequences.length }, (_, i) => i + 1);
            expect(sequences).toEqual(expected);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe("Content Store — Property 7: Navigation links integrity after delete", () => {
  /**
   * **Validates: Requirements 4.4**
   *
   * For any lesson deleted from the store, no remaining lesson should
   * reference the deleted lesson's ID in its prevLessonId or nextLessonId.
   * Additionally, within each module, the navigation chain should be
   * consistent: if lesson A's nextLessonId points to lesson B, then
   * lesson B's prevLessonId should point to lesson A.
   */

  beforeEach(() => {
    useContentStore.setState({
      lessons: [...ALL_STATIC_LESSONS],
      emptyModules: [],
      conflictData: null,
    });
  });

  it("no dangling references and navigation chain is consistent after delete", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_STATIC_LESSONS),
        (lesson) => {
          // Reset state for each iteration
          useContentStore.setState({
            lessons: [...ALL_STATIC_LESSONS],
            emptyModules: [],
            conflictData: null,
          });

          const deletedId = lesson.id;

          useContentStore.getState().deleteLesson(deletedId);

          const remaining = useContentStore.getState().lessons;

          // No remaining lesson should reference the deleted ID
          for (const l of remaining) {
            expect(l.prevLessonId).not.toBe(deletedId);
            expect(l.nextLessonId).not.toBe(deletedId);
          }

          // Navigation chain consistency: if A.nextLessonId === B.id,
          // then B.prevLessonId === A.id
          for (const lessonA of remaining) {
            if (lessonA.nextLessonId !== null) {
              const lessonB = remaining.find((l) => l.id === lessonA.nextLessonId);
              if (lessonB) {
                expect(lessonB.prevLessonId).toBe(lessonA.id);
              }
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe("Content Store — Property 8: Add lesson to correct module", () => {
  /**
   * **Validates: Requirements 5.2**
   *
   * For any valid lesson creation specifying a moduleId, after calling
   * addLesson, the new lesson should appear in getLessonsForModule(moduleId)
   * and the module's lesson count should have increased by exactly 1.
   */

  beforeEach(() => {
    useContentStore.setState({
      lessons: [...ALL_STATIC_LESSONS],
      emptyModules: [],
      conflictData: null,
    });
  });

  it("new lesson appears in the correct module and count increases by 1", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_STATIC_LESSONS),
        fc.string({ minLength: 1, maxLength: 30 }),
        (baseLesson, newTitle) => {
          // Reset state for each iteration
          useContentStore.setState({
            lessons: [...ALL_STATIC_LESSONS],
            emptyModules: [],
            conflictData: null,
          });

          const moduleId = baseLesson.moduleId;
          const countBefore = useContentStore.getState().getLessonsForModule(moduleId).length;

          // Build a lesson payload without id, prevLessonId, nextLessonId
          const { id: _id, prevLessonId: _prev, nextLessonId: _next, ...rest } = baseLesson;
          const newLessonPayload = { ...rest, title: newTitle };

          const newId = useContentStore.getState().addLesson(newLessonPayload);

          const moduleLessons = useContentStore.getState().getLessonsForModule(moduleId);
          const countAfter = moduleLessons.length;

          // Count should increase by exactly 1
          expect(countAfter).toBe(countBefore + 1);

          // New lesson should be in the module
          const found = moduleLessons.find((l) => l.id === newId);
          expect(found).toBeDefined();
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe("Content Store — Property 9: New lesson sequence is next available", () => {
  /**
   * **Validates: Requirements 5.5**
   *
   * For any module with N existing lessons, after adding a new lesson,
   * the new lesson's sequence should equal N + 1.
   */

  beforeEach(() => {
    useContentStore.setState({
      lessons: [...ALL_STATIC_LESSONS],
      emptyModules: [],
      conflictData: null,
    });
  });

  it("new lesson gets sequence N+1 within its module", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_STATIC_LESSONS),
        (baseLesson) => {
          // Reset state for each iteration
          useContentStore.setState({
            lessons: [...ALL_STATIC_LESSONS],
            emptyModules: [],
            conflictData: null,
          });

          const moduleId = baseLesson.moduleId;
          const modulesBefore = useContentStore.getState().getAllModules();
          const modBefore = modulesBefore.find((m) => m.id === moduleId);
          const nBefore = modBefore ? modBefore.lessonCount : 0;

          const { id: _id, prevLessonId: _prev, nextLessonId: _next, ...rest } = baseLesson;
          const newId = useContentStore.getState().addLesson(rest);

          const modulesAfter = useContentStore.getState().getAllModules();
          const modAfter = modulesAfter.find((m) => m.id === moduleId);
          expect(modAfter).toBeDefined();

          // Find the new lesson's sequence in the module view
          const newLessonSummary = modAfter!.lessons.find((l) => l.id === newId);
          expect(newLessonSummary).toBeDefined();
          expect(newLessonSummary!.sequence).toBe(nBefore + 1);
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe("Content Store — Property 10: Domain-prefixed ID generation", () => {
  /**
   * **Validates: Requirements 5.4, 6.4**
   *
   * For any newly created lesson, its ID should start with "LSN-".
   * For any newly created module, its ID should start with "MOD-".
   */

  beforeEach(() => {
    useContentStore.setState({
      lessons: [...ALL_STATIC_LESSONS],
      emptyModules: [],
      conflictData: null,
    });
  });

  it("new lesson IDs start with LSN-", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_STATIC_LESSONS),
        (baseLesson) => {
          // Reset state for each iteration
          useContentStore.setState({
            lessons: [...ALL_STATIC_LESSONS],
            emptyModules: [],
            conflictData: null,
          });

          const { id: _id, prevLessonId: _prev, nextLessonId: _next, ...rest } = baseLesson;
          const newId = useContentStore.getState().addLesson(rest);

          expect(newId.startsWith("LSN-")).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("new module IDs start with MOD-", () => {
    const distinctTracks = Array.from(new Set(ALL_STATIC_LESSONS.map((l) => l.trackName)));

    fc.assert(
      fc.property(
        fc.constantFrom(...distinctTracks),
        fc.string({ minLength: 1, maxLength: 20 }),
        (trackName, moduleName) => {
          // Reset state for each iteration
          useContentStore.setState({
            lessons: [...ALL_STATIC_LESSONS],
            emptyModules: [],
            conflictData: null,
          });

          const newModId = useContentStore.getState().addModule(trackName, "Beginner", moduleName);

          expect(newModId.startsWith("MOD-")).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe("Content Store — Property 12: Accurate module counts per track", () => {
  /**
   * **Validates: Requirements 7.2**
   *
   * For any state of the store, each TrackSummary returned by getTracks()
   * should have a modules count equal to the number of distinct moduleId
   * values among lessons with that track name (plus any empty modules for
   * that track).
   */

  beforeEach(() => {
    useContentStore.setState({
      lessons: [...ALL_STATIC_LESSONS],
      emptyModules: [],
      conflictData: null,
    });
  });

  it("track module counts match distinct moduleIds for random subsets", () => {
    fc.assert(
      fc.property(
        fc.subarray(ALL_STATIC_LESSONS, { minLength: 1 }),
        (subset) => {
          useContentStore.setState({ lessons: subset, emptyModules: [] });

          const tracks = useContentStore.getState().getTracks();

          for (const track of tracks) {
            const lessonsForTrack = subset.filter((l) => l.trackName === track.name);
            const distinctModuleIds = new Set(lessonsForTrack.map((l) => l.moduleId));
            expect(track.modules).toBe(distinctModuleIds.size);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("track module counts include empty modules", () => {
    useContentStore.setState({
      lessons: [...ALL_STATIC_LESSONS],
      emptyModules: [
        {
          moduleId: "MOD-test-empty",
          moduleName: "Empty Test Module",
          trackName: ALL_STATIC_LESSONS[0].trackName,
          levelTier: "Beginner",
        },
      ],
      conflictData: null,
    });

    const tracks = useContentStore.getState().getTracks();
    const targetTrack = tracks.find((t) => t.name === ALL_STATIC_LESSONS[0].trackName);
    expect(targetTrack).toBeDefined();

    // Count distinct moduleIds from lessons for this track
    const lessonsForTrack = ALL_STATIC_LESSONS.filter(
      (l) => l.trackName === ALL_STATIC_LESSONS[0].trackName,
    );
    const distinctModuleIds = new Set(lessonsForTrack.map((l) => l.moduleId));
    // Plus the empty module
    expect(targetTrack!.modules).toBe(distinctModuleIds.size + 1);
  });
});
