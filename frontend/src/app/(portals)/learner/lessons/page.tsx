"use client";
/**
 * @file learner/lessons/page.tsx
 * Lessons hub — modules grouped by track, each lesson tagged as either
 * "video" (AI avatar tutorial) or "lab" (interactive code editor).
 * Video lessons show a thumbnail + Mark Complete button.
 * Lab lessons show a code icon and link to the code editor.
 * "Up Next" highlights the first incomplete lesson.
 * Completion counts feed into progress metrics.
 */

import { useState, useMemo } from "react";
import { Bot, Code, CheckCircle2, Play, ChevronDown, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useContentStore } from "@/stores/content-store";

export default function LessonsPage() {
  const store = useContentStore();
  const allModules = store.getAllModules();

  // Derive track sections from the store's module views
  const trackSections = useMemo(() => {
    const trackMap = new Map<string, { level: string; modules: typeof allModules }>();
    for (const mod of allModules) {
      let entry = trackMap.get(mod.trackName);
      if (!entry) {
        entry = { level: mod.levelTier, modules: [] };
        trackMap.set(mod.trackName, entry);
      }
      entry.modules.push(mod);
    }
    return Array.from(trackMap.entries()).map(([track, data]) => ({
      track,
      level: data.level,
      modules: data.modules,
    }));
  }, [allModules]);

  // Local completion state keyed by lesson ID
  const [completed, setCompleted] = useState<Set<string>>(() => new Set());

  // Auto-expand modules that have incomplete lessons
  const [expandedModules, setExpandedModules] = useState<Set<string>>(() => {
    const expanded = new Set<string>();
    for (const section of trackSections) {
      for (const mod of section.modules) {
        if (mod.lessons.some((l) => !completed.has(l.id))) expanded.add(mod.id);
      }
    }
    return expanded;
  });

  // Flatten all lessons for stats and "Up Next"
  const allLessons = useMemo(
    () => trackSections.flatMap((t) => t.modules.flatMap((m) => m.lessons)),
    [trackSections],
  );

  // Find the first incomplete lesson across all tracks (the "Up Next")
  const upNextId = useMemo(() => {
    for (const section of trackSections) {
      for (const mod of section.modules) {
        const next = mod.lessons.find((l) => !completed.has(l.id));
        if (next) return next.id;
      }
    }
    return null;
  }, [trackSections, completed]);

  // Overall stats
  const totalCompleted = allLessons.filter((l) => completed.has(l.id)).length;
  const totalLessons = allLessons.length;
  const progressPct = totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0;

  function toggleModule(moduleId: string) {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId); else next.add(moduleId);
      return next;
    });
  }

  function markComplete(lessonId: string) {
    setCompleted((prev) => new Set(prev).add(lessonId));
  }

  /** Map store lessonType to a display category for the UI */
  function lessonDisplayType(lessonType: string): "video" | "lab" | "quiz" {
    if (lessonType === "video_text") return "video";
    if (lessonType === "coding_lab") return "lab";
    return "quiz";
  }

  return (
    <div className="space-y-6">
      {/* Header + overall progress */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-heading-lg text-surface-900">My Lessons</h1>
          <p className="text-body-sm text-surface-500 mt-1">
            Video tutorials and coding labs across your enrolled tracks.
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-heading-sm text-brand-600 font-bold">{progressPct}%</p>
          <p className="text-caption text-surface-500">{totalCompleted}/{totalLessons} completed</p>
        </div>
      </div>

      {/* Overall progress bar */}
      <div className="h-2 w-full rounded-full bg-surface-200">
        <div className="h-2 rounded-full bg-brand-600 transition-all" style={{ width: `${progressPct}%` }} role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100} aria-label="Overall lesson progress" />
      </div>

      {/* Up Next banner */}
      {upNextId && (() => {
        const lesson = allLessons.find((l) => l.id === upNextId);
        if (!lesson) return null;
        const displayType = lessonDisplayType(lesson.lessonType);
        return (
          <Link href={`/learner/lessons/${lesson.id}?mode=${displayType}`} className="flex items-center gap-4 rounded-card border border-brand-200 bg-brand-50 p-4 shadow-card hover:border-brand-300 transition-colors">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl shrink-0 ${displayType === "video" ? "bg-brand-600" : "bg-accent-600"}`}>
              {displayType === "video" ? <Play className="w-6 h-6 text-white" /> : <Code className="w-6 h-6 text-white" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-caption font-medium text-brand-600 uppercase tracking-wide">Up Next</p>
              <p className="text-body-sm font-medium text-surface-900 truncate">{lesson.title}</p>
              <p className="text-caption text-surface-500">
                {displayType === "video" ? "Video Tutorial" : "Coding Lab"}
              </p>
            </div>
            <span className="text-body-sm font-medium text-brand-600 shrink-0">Continue →</span>
          </Link>
        );
      })()}

      {/* Track sections */}
      {trackSections.map((track) => {
        const trackLessons = track.modules.flatMap((m) => m.lessons);
        const trackCompleted = trackLessons.filter((l) => completed.has(l.id)).length;
        const trackTotal = trackLessons.length;

        return (
          <section key={track.track} className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-heading-sm text-surface-900">{track.track}</h2>
                <p className="text-caption text-surface-500">{track.level} · {trackCompleted}/{trackTotal} lessons completed</p>
              </div>
              <div className="h-1.5 w-24 rounded-full bg-surface-200">
                <div className="h-1.5 rounded-full bg-brand-600 transition-all" style={{ width: `${trackTotal > 0 ? (trackCompleted / trackTotal) * 100 : 0}%` }} />
              </div>
            </div>

            {track.modules.map((mod) => {
              const modCompleted = mod.lessons.filter((l) => completed.has(l.id)).length;
              const isExpanded = expandedModules.has(mod.id);

              return (
                <div key={mod.id} className="rounded-card border border-surface-200 bg-surface-0 shadow-card overflow-hidden">
                  {/* Module header */}
                  <button onClick={() => toggleModule(mod.id)} className="flex items-center gap-3 w-full px-4 py-3 hover:bg-surface-50 transition-colors text-left">
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-surface-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-surface-400 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm font-medium text-surface-900">{mod.name}</p>
                      <p className="text-caption text-surface-400">{modCompleted}/{mod.lessons.length} completed</p>
                    </div>
                    {modCompleted === mod.lessons.length && mod.lessons.length > 0 && (
                      <CheckCircle2 className="w-5 h-5 text-accent-500 shrink-0" />
                    )}
                  </button>

                  {/* Lesson list */}
                  {isExpanded && (
                    <ul className="border-t border-surface-200 divide-y divide-surface-100">
                      {mod.lessons.map((lesson) => {
                        const isUpNext = lesson.id === upNextId;
                        const isCompleted = completed.has(lesson.id);
                        const displayType = lessonDisplayType(lesson.lessonType);
                        return (
                          <li key={lesson.id} className={`flex items-center gap-3 px-4 py-3 ${isUpNext ? "bg-brand-50/50" : ""}`}>
                            {/* Type icon */}
                            <div className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${
                              isCompleted
                                ? "bg-accent-100"
                                : displayType === "video"
                                ? "bg-brand-100"
                                : "bg-purple-100"
                            }`}>
                              {isCompleted ? (
                                <CheckCircle2 className="w-4 h-4 text-accent-600" />
                              ) : displayType === "video" ? (
                                <Bot className="w-4 h-4 text-brand-600" />
                              ) : (
                                <Code className="w-4 h-4 text-purple-600" />
                              )}
                            </div>

                            {/* Lesson info */}
                            <Link href={`/learner/lessons/${lesson.id}?mode=${displayType}`} className="flex-1 min-w-0 group">
                              <div className="flex items-center gap-2">
                                <p className={`text-body-sm group-hover:text-brand-600 transition-colors truncate ${isCompleted ? "text-surface-500" : "text-surface-900 font-medium"}`}>
                                  {lesson.title}
                                </p>
                                {isUpNext && <span className="shrink-0 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase">Up Next</span>}
                              </div>
                              <div className="flex items-center gap-2 text-caption text-surface-400 mt-0.5">
                                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${displayType === "video" ? "bg-brand-50 text-brand-600" : "bg-purple-50 text-purple-600"}`}>
                                  {displayType === "video" ? "VIDEO" : "LAB"}
                                </span>
                              </div>
                            </Link>

                            {/* Action */}
                            {isCompleted ? (
                              <span className="text-caption text-accent-600 shrink-0">Completed</span>
                            ) : (
                              <button
                                onClick={() => markComplete(lesson.id)}
                                className="shrink-0 rounded-lg border border-surface-300 px-3 py-1.5 text-caption font-medium text-surface-600 hover:bg-surface-100 hover:text-surface-900 transition-colors"
                              >
                                Mark Complete
                              </button>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}
