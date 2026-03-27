/**
 * @file learner/lessons/page.tsx
 * Lessons hub — modules grouped by track, each lesson tagged as either
 * "video" (AI avatar tutorial) or "lab" (interactive code editor).
 * Video lessons show a thumbnail + Mark Complete button.
 * Lab lessons show a code icon and link to the code editor.
 * "Up Next" highlights the first incomplete lesson.
 * Completion counts feed into progress metrics.
 */
"use client";

import { useState, useMemo } from "react";
import { Bot, Code, CheckCircle2, Play, Clock, ChevronDown, ChevronRight } from "lucide-react";
import Link from "next/link";

type LessonType = "video" | "lab";

interface Lesson {
  id: string;
  title: string;
  type: LessonType;
  duration: string;
  completed: boolean;
}

interface ModuleGroup {
  id: string;
  name: string;
  lessons: Lesson[];
}

interface TrackSection {
  track: string;
  level: string;
  modules: ModuleGroup[];
}

const INITIAL_DATA: TrackSection[] = [
  {
    track: "Foundation School",
    level: "Required",
    modules: [
      {
        id: "MOD-F01", name: "AI Literacy",
        lessons: [
          { id: "LSN-F01-01", title: "What is Artificial Intelligence?", type: "video", duration: "18 min", completed: true },
          { id: "LSN-F01-02", title: "History and Evolution of AI", type: "video", duration: "22 min", completed: true },
          { id: "LSN-F01-03", title: "AI in Everyday Life", type: "video", duration: "15 min", completed: false },
        ],
      },
      {
        id: "MOD-F02", name: "Prompt Engineering",
        lessons: [
          { id: "LSN-F02-01", title: "Introduction to Prompts", type: "video", duration: "20 min", completed: false },
          { id: "LSN-F02-02", title: "Crafting Effective Prompts", type: "lab", duration: "30 min", completed: false },
          { id: "LSN-F02-03", title: "Advanced Prompt Techniques", type: "lab", duration: "35 min", completed: false },
        ],
      },
    ],
  },
  {
    track: "AI Engineering and Intelligent Systems",
    level: "Beginner",
    modules: [
      {
        id: "MOD-AI01", name: "Python for AI",
        lessons: [
          { id: "LSN-py-001", title: "Variables and Data Types", type: "video", duration: "30 min", completed: true },
          { id: "LSN-py-002", title: "Control Flow and Functions", type: "lab", duration: "35 min", completed: false },
          { id: "LSN-py-003", title: "Working with Lists and Dictionaries", type: "lab", duration: "28 min", completed: false },
        ],
      },
      {
        id: "MOD-AI02", name: "REST APIs and Data Formats",
        lessons: [
          { id: "LSN-api-001", title: "HTTP Fundamentals", type: "video", duration: "25 min", completed: false },
          { id: "LSN-api-002", title: "REST API Design Patterns", type: "video", duration: "30 min", completed: false },
          { id: "LSN-api-003", title: "Building Your First API", type: "lab", duration: "40 min", completed: false },
        ],
      },
    ],
  },
];

export default function LessonsPage() {
  const [data, setData] = useState(INITIAL_DATA);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(() => {
    // Auto-expand modules that have incomplete lessons
    const expanded = new Set<string>();
    data.forEach((t) => t.modules.forEach((m) => {
      if (m.lessons.some((l) => !l.completed)) expanded.add(m.id);
    }));
    return expanded;
  });

  // Find the first incomplete lesson across all tracks (the "Up Next")
  const upNextId = useMemo(() => {
    for (const track of data) {
      for (const mod of track.modules) {
        const next = mod.lessons.find((l) => !l.completed);
        if (next) return next.id;
      }
    }
    return null;
  }, [data]);

  // Overall stats
  const allLessons = data.flatMap((t) => t.modules.flatMap((m) => m.lessons));
  const totalCompleted = allLessons.filter((l) => l.completed).length;
  const totalLessons = allLessons.length;
  const progressPct = Math.round((totalCompleted / totalLessons) * 100);

  function toggleModule(moduleId: string) {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId); else next.add(moduleId);
      return next;
    });
  }

  function markComplete(lessonId: string) {
    setData((prev) =>
      prev.map((track) => ({
        ...track,
        modules: track.modules.map((mod) => ({
          ...mod,
          lessons: mod.lessons.map((l) =>
            l.id === lessonId ? { ...l, completed: true } : l
          ),
        })),
      }))
    );
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
        return (
          <Link href={`/learner/lessons/${lesson.id}?mode=${lesson.type}`} className="flex items-center gap-4 rounded-card border border-brand-200 bg-brand-50 p-4 shadow-card hover:border-brand-300 transition-colors">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl shrink-0 ${lesson.type === "video" ? "bg-brand-600" : "bg-accent-600"}`}>
              {lesson.type === "video" ? <Play className="w-6 h-6 text-white" /> : <Code className="w-6 h-6 text-white" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-caption font-medium text-brand-600 uppercase tracking-wide">Up Next</p>
              <p className="text-body-sm font-medium text-surface-900 truncate">{lesson.title}</p>
              <p className="text-caption text-surface-500">
                {lesson.type === "video" ? "Video Tutorial" : "Coding Lab"} · {lesson.duration}
              </p>
            </div>
            <span className="text-body-sm font-medium text-brand-600 shrink-0">Continue →</span>
          </Link>
        );
      })()}

      {/* Track sections */}
      {data.map((track) => {
        const trackCompleted = track.modules.flatMap((m) => m.lessons).filter((l) => l.completed).length;
        const trackTotal = track.modules.flatMap((m) => m.lessons).length;

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
              const modCompleted = mod.lessons.filter((l) => l.completed).length;
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
                    {modCompleted === mod.lessons.length && (
                      <CheckCircle2 className="w-5 h-5 text-accent-500 shrink-0" />
                    )}
                  </button>

                  {/* Lesson list */}
                  {isExpanded && (
                    <ul className="border-t border-surface-200 divide-y divide-surface-100">
                      {mod.lessons.map((lesson) => {
                        const isUpNext = lesson.id === upNextId;
                        return (
                          <li key={lesson.id} className={`flex items-center gap-3 px-4 py-3 ${isUpNext ? "bg-brand-50/50" : ""}`}>
                            {/* Type icon */}
                            <div className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${
                              lesson.completed
                                ? "bg-accent-100"
                                : lesson.type === "video"
                                ? "bg-brand-100"
                                : "bg-purple-100"
                            }`}>
                              {lesson.completed ? (
                                <CheckCircle2 className="w-4 h-4 text-accent-600" />
                              ) : lesson.type === "video" ? (
                                <Bot className="w-4 h-4 text-brand-600" />
                              ) : (
                                <Code className="w-4 h-4 text-purple-600" />
                              )}
                            </div>

                            {/* Lesson info */}
                            <Link href={`/learner/lessons/${lesson.id}?mode=${lesson.type}`} className="flex-1 min-w-0 group">
                              <div className="flex items-center gap-2">
                                <p className={`text-body-sm group-hover:text-brand-600 transition-colors truncate ${lesson.completed ? "text-surface-500" : "text-surface-900 font-medium"}`}>
                                  {lesson.title}
                                </p>
                                {isUpNext && <span className="shrink-0 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase">Up Next</span>}
                              </div>
                              <div className="flex items-center gap-2 text-caption text-surface-400 mt-0.5">
                                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${lesson.type === "video" ? "bg-brand-50 text-brand-600" : "bg-purple-50 text-purple-600"}`}>
                                  {lesson.type === "video" ? "VIDEO" : "LAB"}
                                </span>
                                <Clock className="w-3 h-3" />
                                <span>{lesson.duration}</span>
                              </div>
                            </Link>

                            {/* Action */}
                            {lesson.completed ? (
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
