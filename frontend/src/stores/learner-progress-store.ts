/**
 * @file learner-progress-store.ts — Zustand store for learner lesson progress.
 * Persists code editor content, practice responses, deliverable drafts,
 * quiz answers, and completion status to localStorage with backend sync.
 * On init, fetches server progress and merges with localStorage preferring
 * the most recent updated_at. On sync failure, continues saving locally
 * and retries on the next mutation.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiFetch } from "@/lib/api";

// ─── Types ──────────────────────────────────────────────────────

export interface LessonProgress {
  /** Active tab when learner last visited */
  activeTab: "learn" | "practice" | "apply";
  /** Code editor content for coding_lab lessons */
  codeValue?: string;
  /** Code execution output */
  codeOutput?: string;
  /** Practice task text input */
  practiceInput?: string;
  /** Deliverable text input */
  deliverableInput?: string;
  /** Whether deliverable was submitted */
  submitted?: boolean;
  /** MCQ answers: questionIndex → selectedOptionIndex */
  mcqAnswers?: Record<number, number>;
  /** Whether MCQ results were shown */
  mcqShowResults?: boolean;
  /** Drag-drop matches: term → definition */
  dragDropMatches?: Record<string, string>;
  /** Whether drag-drop was checked */
  dragDropChecked?: boolean;
  /** Review question answers */
  reviewAnswers?: Record<number, number>;
  /** Whether review results were shown */
  reviewShowResults?: boolean;
  /** Last updated timestamp */
  updatedAt: number;
}

/** Server-side progress record shape. */
interface ServerProgress {
  lesson_id: string;
  active_tab?: string;
  code_value?: string;
  practice_input?: string;
  deliverable_input?: string;
  submitted?: boolean;
  mcq_answers?: Record<number, number>;
  mcq_score?: number;
  updated_at: string;
}

interface LearnerProgressState {
  /** Map of lessonId → progress */
  progress: Record<string, LessonProgress>;
  /** Whether initial server fetch has been attempted */
  _serverFetched: boolean;

  /** Get progress for a specific lesson */
  getProgress: (lessonId: string) => LessonProgress | undefined;

  /** Save/update progress for a lesson (merges with existing) */
  saveProgress: (lessonId: string, updates: Partial<LessonProgress>) => void;

  /** Mark a lesson as completed */
  markCompleted: (lessonId: string) => void;

  /** Clear progress for a specific lesson */
  clearProgress: (lessonId: string) => void;

  /** Get count of lessons with saved progress */
  getSavedCount: () => number;

  /** Fetch server progress and merge with local (called on init) */
  _syncFromServer: () => void;
}

// ─── Debounce helper ────────────────────────────────────────────

const _pendingTimers = new Map<string, ReturnType<typeof setTimeout>>();

function debouncedSync(lessonId: string, payload: Record<string, unknown>) {
  const existing = _pendingTimers.get(lessonId);
  if (existing) clearTimeout(existing);

  _pendingTimers.set(
    lessonId,
    setTimeout(() => {
      _pendingTimers.delete(lessonId);
      apiFetch(`/progress/lessons/${lessonId}`, {
        method: "POST",
        body: JSON.stringify(payload),
      }).catch((err) => {
        console.warn("[learner-progress] Failed to sync saveProgress:", err);
      });
    }, 1000),
  );
}

// ─── Store ──────────────────────────────────────────────────────

export const useLearnerProgressStore = create<LearnerProgressState>()(
  persist(
    (set, get) => ({
      progress: {},
      _serverFetched: false,

      getProgress: (lessonId) => get().progress[lessonId],

      saveProgress: (lessonId, updates) => {
        const { progress } = get();
        const existing = progress[lessonId];
        const merged: LessonProgress = {
          ...existing,
          ...updates,
          activeTab: updates.activeTab ?? existing?.activeTab ?? "learn",
          updatedAt: Date.now(),
        };
        set({
          progress: { ...progress, [lessonId]: merged },
        });

        // Debounced POST to backend
        debouncedSync(lessonId, {
          active_tab: merged.activeTab,
          code_value: merged.codeValue,
          practice_input: merged.practiceInput,
          deliverable_input: merged.deliverableInput,
          submitted: merged.submitted,
          mcq_answers: merged.mcqAnswers,
        });
      },

      markCompleted: (lessonId) => {
        const { progress } = get();
        const existing = progress[lessonId];
        const merged: LessonProgress = {
          ...existing,
          activeTab: existing?.activeTab ?? "learn",
          submitted: true,
          updatedAt: Date.now(),
        };
        set({
          progress: { ...progress, [lessonId]: merged },
        });

        // PUT to backend
        apiFetch(`/progress/lessons/${lessonId}/complete`, {
          method: "PUT",
        }).catch((err) => {
          console.warn("[learner-progress] Failed to sync markCompleted:", err);
        });
      },

      clearProgress: (lessonId) => {
        const { progress } = get();
        const next = { ...progress };
        delete next[lessonId];
        set({ progress: next });
      },

      getSavedCount: () => Object.keys(get().progress).length,

      _syncFromServer: () => {
        if (get()._serverFetched) return;
        set({ _serverFetched: true });

        apiFetch<ServerProgress[]>("/progress/lessons")
          .then((serverRecords) => {
            const { progress } = get();
            const merged = { ...progress };

            for (const sr of serverRecords) {
              const serverUpdatedAt = new Date(sr.updated_at).getTime();
              const local = merged[sr.lesson_id];
              const localUpdatedAt = local?.updatedAt ?? 0;

              // Prefer the record with the most recent updated_at
              if (serverUpdatedAt > localUpdatedAt) {
                merged[sr.lesson_id] = {
                  activeTab: (sr.active_tab as LessonProgress["activeTab"]) ?? "learn",
                  codeValue: sr.code_value,
                  practiceInput: sr.practice_input,
                  deliverableInput: sr.deliverable_input,
                  submitted: sr.submitted,
                  mcqAnswers: sr.mcq_answers,
                  updatedAt: serverUpdatedAt,
                };
              }
            }

            set({ progress: merged });
          })
          .catch((err) => {
            // On failure, keep localStorage data and retry on next mutation
            console.warn("[learner-progress] Failed to fetch server progress:", err);
            set({ _serverFetched: false });
          });
      },
    }),
    {
      name: "kf-learner-progress",
      version: 1,
      partialize: (state) => ({
        progress: state.progress,
      }),
      onRehydrateStorage: () => {
        return (_state, error) => {
          if (!error) {
            // After rehydration, attempt server sync
            useLearnerProgressStore.getState()._syncFromServer();
          }
        };
      },
    },
  ),
);
