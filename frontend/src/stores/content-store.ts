/**
 * @file content-store.ts — Zustand store for unified content data layer.
 * Single source of truth for tracks, modules, and lessons consumed by
 * the instructor content page, learner lessons page, learner lesson viewer,
 * and admin curriculum page. Initializes from static data files and exposes
 * CRUD operations with optimistic local updates synced to the backend API.
 * Persists mutations to localStorage so edits survive page refreshes.
 * Includes conflict resolution state for HTTP 409 optimistic locking conflicts.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { TrackLesson } from "@/data/ai-engineering-content";
import type { FoundationModule } from "@/data/foundation-content";
import { AI_ENGINEERING_LESSONS } from "@/data/ai-engineering-content";
import { DATA_SCIENCE_LESSONS } from "@/data/data-science-content";
import { CYBERSECURITY_LESSONS } from "@/data/cybersecurity-content";
import { AI_PRODUCT_LESSONS } from "@/data/ai-product-content";
import { FOUNDATION_MODULES } from "@/data/foundation-content";
import { apiFetch, ApiError } from "@/lib/api";

// ─── Derived View Types ─────────────────────────────────────────

/** Metadata placeholder for a module that has no lessons yet. */
export interface EmptyModule {
  moduleId: string;
  moduleName: string;
  trackName: string;
  levelTier: string;
}

/** Used by the admin curriculum page. */
export interface TrackSummary {
  id: string;
  name: string;
  modules: number;
  lessons: number;
  available: boolean;
  gateThreshold: number;
}

/** Used by the instructor content page. */
export interface ModuleView {
  id: string;
  name: string;
  trackName: string;
  levelTier: string;
  lessonCount: number;
  lessons: LessonSummary[];
}

/** Simplified lesson info for instructor list view. */
export interface LessonSummary {
  id: string;
  title: string;
  lessonType: string;
  sequence: number;
}

// ─── Conflict Resolution Types ──────────────────────────────────

/** Data held when an HTTP 409 conflict is detected during content update. */
export interface ConflictData {
  /** The lesson ID that had a conflict */
  lessonId: string;
  /** The local version the user was trying to save */
  localVersion: Partial<TrackLesson>;
  /** The current server version returned in the 409 response */
  serverVersion: TrackLesson;
  /** The server's current version number */
  serverVersionNumber: number;
}

// ─── Content State Interface ────────────────────────────────────

export interface ContentState {
  // Core data
  lessons: TrackLesson[];
  foundationModules: FoundationModule[];
  emptyModules: EmptyModule[];

  // Conflict resolution state
  conflictData: ConflictData | null;

  // Derived selectors
  getTracks: () => TrackSummary[];
  getAllModules: () => ModuleView[];
  getModulesForTrack: (trackName: string) => ModuleView[];
  getLessonById: (id: string) => TrackLesson | undefined;
  getLessonsForModule: (moduleId: string) => TrackLesson[];
  getTrackNames: () => string[];

  // Mutations
  addLesson: (lesson: Omit<TrackLesson, "id" | "prevLessonId" | "nextLessonId">) => string;
  updateLesson: (
    id: string,
    updates: Partial<
      Pick<
        TrackLesson,
        | "title"
        | "lessonType"
        | "content"
        | "duration"
        | "objectives"
        | "starterCode"
        | "language"
        | "mcqQuestions"
        | "dragDropPairs"
        | "practicePrompt"
        | "deliverable"
        | "reviewQuestions"
      >
    >,
    version?: number,
  ) => void;
  deleteLesson: (id: string) => void;
  addModule: (trackName: string, levelTier: string, moduleName: string) => string;

  // Conflict resolution actions
  resolveConflict: (strategy: "accept-server" | "force-local") => void;
}

// ─── Helpers ────────────────────────────────────────────────────

const TRACK_PREFIX_MAP: Record<string, string> = {
  "AI Engineering and Intelligent Systems": "aie",
  "Data Science and Decision Intelligence": "ds",
  "Cybersecurity and AI Security": "cs",
  "AI Product and Project Leadership": "ap",
};

function trackPrefix(trackName: string): string {
  return TRACK_PREFIX_MAP[trackName] ?? "gen";
}

function randomSuffix(): string {
  return Math.random().toString(36).substring(2, 8);
}

// ─── Store ──────────────────────────────────────────────────────

export const useContentStore = create<ContentState>()(
  persist(
    (set, get) => ({
  // ── Core Data (initialized from static imports) ──
  lessons: [
    ...AI_ENGINEERING_LESSONS,
    ...DATA_SCIENCE_LESSONS,
    ...CYBERSECURITY_LESSONS,
    ...AI_PRODUCT_LESSONS,
  ],
  foundationModules: FOUNDATION_MODULES,
  emptyModules: [],
  conflictData: null,

  // ── Derived Selectors ──

  getTracks: (): TrackSummary[] => {
    const { lessons, emptyModules } = get();
    const trackMap = new Map<string, { moduleIds: Set<string>; lessonCount: number }>();

    for (const lesson of lessons) {
      let entry = trackMap.get(lesson.trackName);
      if (!entry) {
        entry = { moduleIds: new Set(), lessonCount: 0 };
        trackMap.set(lesson.trackName, entry);
      }
      entry.moduleIds.add(lesson.moduleId);
      entry.lessonCount++;
    }

    // Include empty modules in track counts
    for (const em of emptyModules) {
      let entry = trackMap.get(em.trackName);
      if (!entry) {
        entry = { moduleIds: new Set(), lessonCount: 0 };
        trackMap.set(em.trackName, entry);
      }
      entry.moduleIds.add(em.moduleId);
    }

    return Array.from(trackMap.entries()).map(([name, data]) => ({
      id: `TRK-${trackPrefix(name)}`,
      name,
      modules: data.moduleIds.size,
      lessons: data.lessonCount,
      available: true,
      gateThreshold: 70,
    }));
  },

  getAllModules: (): ModuleView[] => {
    const { lessons, emptyModules } = get();
    const moduleMap = new Map<
      string,
      { name: string; trackName: string; levelTier: string; lessons: TrackLesson[] }
    >();

    for (const lesson of lessons) {
      let entry = moduleMap.get(lesson.moduleId);
      if (!entry) {
        entry = {
          name: lesson.moduleName,
          trackName: lesson.trackName,
          levelTier: lesson.levelTier,
          lessons: [],
        };
        moduleMap.set(lesson.moduleId, entry);
      }
      entry.lessons.push(lesson);
    }

    const views: ModuleView[] = Array.from(moduleMap.entries()).map(([id, data]) => {
      const sorted = [...data.lessons].sort((a, b) => {
        const aIdx = lessons.indexOf(a);
        const bIdx = lessons.indexOf(b);
        return aIdx - bIdx;
      });
      return {
        id,
        name: data.name,
        trackName: data.trackName,
        levelTier: data.levelTier,
        lessonCount: sorted.length,
        lessons: sorted.map((l, i) => ({
          id: l.id,
          title: l.title,
          lessonType: l.lessonType,
          sequence: i + 1,
        })),
      };
    });

    // Append empty modules (no lessons yet)
    for (const em of emptyModules) {
      if (!moduleMap.has(em.moduleId)) {
        views.push({
          id: em.moduleId,
          name: em.moduleName,
          trackName: em.trackName,
          levelTier: em.levelTier,
          lessonCount: 0,
          lessons: [],
        });
      }
    }

    return views;
  },

  getModulesForTrack: (trackName: string): ModuleView[] => {
    return get()
      .getAllModules()
      .filter((m) => m.trackName === trackName);
  },

  getLessonById: (id: string): TrackLesson | undefined => {
    return get().lessons.find((l) => l.id === id);
  },

  getLessonsForModule: (moduleId: string): TrackLesson[] => {
    const moduleLessons = get().lessons.filter((l) => l.moduleId === moduleId);
    const allLessons = get().lessons;
    return [...moduleLessons].sort(
      (a, b) => allLessons.indexOf(a) - allLessons.indexOf(b),
    );
  },

  getTrackNames: (): string[] => {
    const names = new Set<string>();
    for (const l of get().lessons) names.add(l.trackName);
    return Array.from(names);
  },

  // ── CRUD Mutations with Backend Sync ──

  addLesson: (lesson): string => {
    const localId = `LSN-${trackPrefix(lesson.trackName)}-${randomSuffix()}`;
    const { lessons, emptyModules } = get();

    // Find existing lessons in this module to determine sequence and nav links
    const moduleLessons = lessons.filter((l) => l.moduleId === lesson.moduleId);
    const lastLesson = moduleLessons.length > 0 ? moduleLessons[moduleLessons.length - 1] : null;

    const newLesson: TrackLesson = {
      ...lesson,
      id: localId,
      prevLessonId: lastLesson ? lastLesson.id : null,
      nextLessonId: null,
    };

    // Update the previously-last lesson's nextLessonId
    const updatedLessons = lastLesson
      ? lessons.map((l) => (l.id === lastLesson.id ? { ...l, nextLessonId: localId } : l))
      : [...lessons];

    // Remove from emptyModules if this module was empty
    const updatedEmptyModules = emptyModules.filter(
      (em) => em.moduleId !== lesson.moduleId,
    );

    // Optimistic local update
    set({
      lessons: [...updatedLessons, newLesson],
      emptyModules: updatedEmptyModules,
    });

    // Backend sync (fire-and-forget, non-blocking)
    apiFetch<TrackLesson>("/content/lessons", {
      method: "POST",
      body: JSON.stringify(lesson),
    })
      .then((serverLesson) => {
        // Replace local ID with server-assigned ID
        const current = get().lessons;
        set({
          lessons: current.map((l) => {
            if (l.id === localId) return { ...l, id: serverLesson.id };
            if (l.nextLessonId === localId) return { ...l, nextLessonId: serverLesson.id };
            if (l.prevLessonId === localId) return { ...l, prevLessonId: serverLesson.id };
            return l;
          }),
        });
      })
      .catch((err) => {
        console.warn("[content-store] Failed to sync addLesson to backend:", err);
      });

    return localId;
  },

  updateLesson: (id, updates, version?): void => {
    const { lessons } = get();
    const idx = lessons.findIndex((l) => l.id === id);
    if (idx === -1) return;

    // Optimistic local update
    const updated = { ...lessons[idx], ...updates };
    const next = [...lessons];
    next[idx] = updated;
    set({ lessons: next });

    // Backend sync with version for optimistic locking
    const payload: Record<string, unknown> = { ...updates };
    if (version !== undefined) payload.version = version;

    apiFetch<TrackLesson>(`/content/lessons/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }).catch((err) => {
      if (err instanceof ApiError && err.status === 409 && err.body) {
        // Conflict detected — store both versions for resolution
        const serverRecord = err.body as TrackLesson & { version?: number };
        set({
          conflictData: {
            lessonId: id,
            localVersion: updates,
            serverVersion: serverRecord,
            serverVersionNumber: serverRecord.version ?? 1,
          },
        });
      } else {
        console.warn("[content-store] Failed to sync updateLesson to backend:", err);
      }
    });
  },

  deleteLesson: (id): void => {
    const { lessons } = get();
    const target = lessons.find((l) => l.id === id);
    if (!target) return;

    const prevId = target.prevLessonId;
    const nextId = target.nextLessonId;

    // Optimistic local remove and fix navigation links
    const updated = lessons
      .filter((l) => l.id !== id)
      .map((l) => {
        let patched = l;
        if (l.nextLessonId === id) {
          patched = { ...patched, nextLessonId: nextId };
        }
        if (l.prevLessonId === id) {
          patched = { ...patched, prevLessonId: prevId };
        }
        return patched;
      });

    set({ lessons: updated });

    // Backend sync
    apiFetch<void>(`/content/lessons/${id}`, { method: "DELETE" }).catch((err) => {
      console.warn("[content-store] Failed to sync deleteLesson to backend:", err);
    });
  },

  addModule: (trackName, levelTier, moduleName): string => {
    const localId = `MOD-${trackPrefix(trackName)}-${randomSuffix()}`;
    const { emptyModules } = get();

    // Optimistic local update
    set({
      emptyModules: [
        ...emptyModules,
        { moduleId: localId, moduleName, trackName, levelTier },
      ],
    });

    // Backend sync
    apiFetch<{ id: string }>("/content/modules", {
      method: "POST",
      body: JSON.stringify({ trackName, levelTier, moduleName }),
    })
      .then((serverModule) => {
        // Replace local ID with server-assigned ID
        const current = get().emptyModules;
        set({
          emptyModules: current.map((em) =>
            em.moduleId === localId ? { ...em, moduleId: serverModule.id } : em,
          ),
        });
      })
      .catch((err) => {
        console.warn("[content-store] Failed to sync addModule to backend:", err);
      });

    return localId;
  },

  // ── Conflict Resolution Actions ──

  resolveConflict: (strategy): void => {
    const { conflictData } = get();
    if (!conflictData) return;

    if (strategy === "accept-server") {
      // Accept the server version — update local state with server data
      const { lessons } = get();
      const idx = lessons.findIndex((l) => l.id === conflictData.lessonId);
      if (idx !== -1) {
        const next = [...lessons];
        next[idx] = { ...next[idx], ...conflictData.serverVersion };
        set({ lessons: next, conflictData: null });
      } else {
        set({ conflictData: null });
      }
    } else {
      // Force local version — re-submit with the current server version number
      const { lessons } = get();
      const lesson = lessons.find((l) => l.id === conflictData.lessonId);
      if (!lesson) {
        set({ conflictData: null });
        return;
      }

      set({ conflictData: null });

      const payload: Record<string, unknown> = {
        ...conflictData.localVersion,
        version: conflictData.serverVersionNumber,
      };

      apiFetch<TrackLesson>(`/content/lessons/${conflictData.lessonId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }).catch((err) => {
        console.warn("[content-store] Failed to force local version:", err);
      });
    }
  },
}),
    {
      name: "kf-content-store",
      version: 1,
      partialize: (state) => ({
        // Only persist mutations — selectors are derived at runtime
        lessons: state.lessons,
        emptyModules: state.emptyModules,
        foundationModules: state.foundationModules,
      }),
    },
  ),
);
