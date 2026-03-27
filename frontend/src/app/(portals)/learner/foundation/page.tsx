/**
 * @file learner/foundation/page.tsx
 * Foundation School — 5-module mandatory free curriculum.
 * Learners complete all modules before accessing paid Track Pathways.
 */
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { BookOpen, CheckCircle2, Lock, Play, ChevronDown, ChevronRight } from "lucide-react";

interface Lesson { id: string; title: string; durationMin: number; }
interface FModule { id: string; number: number; title: string; description: string; lessons: Lesson[]; }

const MODULES: FModule[] = [
  { id: "FND-001", number: 1, title: "AI Literacy and Future of Work", description: "What AI is, predictive vs generative AI, human-AI collaboration, and the future of work.", lessons: [
    { id: "FND-001-L1", title: "What Is Artificial Intelligence?", durationMin: 25 },
    { id: "FND-001-L2", title: "Predictive vs Generative AI", durationMin: 30 },
    { id: "FND-001-L3", title: "Human-AI Collaboration", durationMin: 35 },
    { id: "FND-001-L4", title: "AI and the Future of Work in Africa", durationMin: 20 },
  ]},
  { id: "FND-002", number: 2, title: "AI Fluency and Prompt Intelligence", description: "Zero-shot, few-shot, role prompting, chain-of-thought reasoning.", lessons: [
    { id: "FND-002-L1", title: "Introduction to Prompt Engineering", durationMin: 25 },
    { id: "FND-002-L2", title: "Zero-Shot and Few-Shot Prompting", durationMin: 30 },
    { id: "FND-002-L3", title: "Role Prompting and Persona Design", durationMin: 30 },
    { id: "FND-002-L4", title: "Chain-of-Thought Reasoning", durationMin: 35 },
  ]},
  { id: "FND-003", number: 3, title: "Systems Awareness", description: "APIs, cloud basics, data pipelines, databases, and cybersecurity awareness.", lessons: [
    { id: "FND-003-L1", title: "APIs and How Systems Communicate", durationMin: 30 },
    { id: "FND-003-L2", title: "Cloud Computing Basics", durationMin: 25 },
    { id: "FND-003-L3", title: "Data Pipelines and Databases", durationMin: 35 },
  ]},
  { id: "FND-004", number: 4, title: "Governance and Responsible AI", description: "Bias, fairness, privacy, GDPR, NDPR, responsible AI, and hallucination awareness.", lessons: [
    { id: "FND-004-L1", title: "Bias and Fairness in AI", durationMin: 30 },
    { id: "FND-004-L2", title: "Privacy: GDPR, NDPR, and CCPA", durationMin: 35 },
    { id: "FND-004-L3", title: "Responsible AI and Hallucination Awareness", durationMin: 30 },
  ]},
  { id: "FND-005", number: 5, title: "Professional Discipline", description: "Communication, accountability, collaboration, documentation, and learning discipline.", lessons: [
    { id: "FND-005-L1", title: "Professional Communication", durationMin: 25 },
    { id: "FND-005-L2", title: "Accountability and Collaboration", durationMin: 30 },
    { id: "FND-005-L3", title: "Documentation and Learning Discipline", durationMin: 25 },
  ]},
];

export default function FoundationPage() {
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set(["FND-001-L1", "FND-001-L2", "FND-001-L3", "FND-001-L4", "FND-002-L1", "FND-002-L2"]));
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["FND-002"]));

  function getModuleStatus(mod: FModule): "completed" | "in-progress" | "locked" {
    const done = mod.lessons.filter((l) => completedLessons.has(l.id)).length;
    if (done === mod.lessons.length) return "completed";
    const idx = MODULES.indexOf(mod);
    if (idx === 0) return "in-progress";
    const prev = MODULES[idx - 1];
    if (prev.lessons.every((l) => completedLessons.has(l.id))) return "in-progress";
    return "locked";
  }

  const allLessons = MODULES.flatMap((m) => m.lessons);
  const totalDone = allLessons.filter((l) => completedLessons.has(l.id)).length;
  const pct = Math.round((totalDone / allLessons.length) * 100);
  const allComplete = totalDone === allLessons.length;

  function markLesson(id: string) {
    setCompletedLessons((prev) => new Set([...Array.from(prev), id]));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-heading-lg text-surface-900">Foundation School</h1>
          <p className="text-body-sm text-surface-500 mt-1">Free, mandatory curriculum — complete all 5 modules to unlock paid Track Pathways.</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-heading-sm text-brand-600 font-bold">{pct}%</p>
          <p className="text-caption text-surface-500">{totalDone}/{allLessons.length} lessons</p>
        </div>
      </div>

      <div className="h-2 w-full rounded-full bg-surface-200">
        <div className="h-2 rounded-full bg-brand-600 transition-all" style={{ width: `${pct}%` }} />
      </div>

      {allComplete && (
        <div className="rounded-card border border-accent-200 bg-accent-50 p-4 text-center">
          <CheckCircle2 className="w-8 h-8 text-accent-600 mx-auto mb-2" />
          <p className="text-body-sm font-medium text-accent-800">Foundation School Complete</p>
          <p className="text-caption text-accent-600 mt-1">You can now enroll in paid Track Pathways.</p>
          <Link href="/learner/tracks" className="inline-block mt-3 rounded-lg bg-brand-600 px-4 py-2 text-body-sm font-medium text-white hover:bg-brand-700 transition-colors">
            Browse Tracks
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {MODULES.map((mod) => {
          const status = getModuleStatus(mod);
          const isExpanded = expanded.has(mod.id);
          const doneLessons = mod.lessons.filter((l) => completedLessons.has(l.id)).length;

          return (
            <div key={mod.id} className={`rounded-card border shadow-card overflow-hidden ${status === "locked" ? "border-surface-200 opacity-70" : "border-surface-200"}`}>
              <button
                onClick={() => { if (status !== "locked") setExpanded((prev) => { const n = new Set(prev); if (n.has(mod.id)) n.delete(mod.id); else n.add(mod.id); return n; }); }}
                disabled={status === "locked"}
                className="flex items-center gap-3 w-full px-4 py-4 text-left hover:bg-surface-50 transition-colors"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-full shrink-0 text-body-sm font-bold ${
                  status === "completed" ? "bg-accent-100 text-accent-700" :
                  status === "in-progress" ? "bg-brand-100 text-brand-700" :
                  "bg-surface-100 text-surface-400"
                }`}>
                  {status === "completed" ? <CheckCircle2 className="w-5 h-5" /> : status === "locked" ? <Lock className="w-4 h-4" /> : mod.number}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm font-medium text-surface-900">Module {mod.number}: {mod.title}</p>
                  <p className="text-caption text-surface-500 mt-0.5">{mod.description}</p>
                  <p className="text-caption text-surface-400 mt-1">{doneLessons}/{mod.lessons.length} lessons · ~{mod.lessons.reduce((s, l) => s + l.durationMin, 0)} min</p>
                </div>
                {status !== "locked" && (isExpanded ? <ChevronDown className="w-4 h-4 text-surface-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-surface-400 shrink-0" />)}
              </button>

              {isExpanded && status !== "locked" && (
                <ul className="border-t border-surface-200 divide-y divide-surface-100">
                  {mod.lessons.map((lesson) => {
                    const done = completedLessons.has(lesson.id);
                    return (
                      <li key={lesson.id} className="flex items-center gap-3 px-4 py-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${done ? "bg-accent-100" : "bg-brand-100"}`}>
                          {done ? <CheckCircle2 className="w-4 h-4 text-accent-600" /> : <Play className="w-4 h-4 text-brand-600" />}
                        </div>
                        <Link href={`/learner/lessons/${lesson.id}?mode=video`} className="flex-1 min-w-0 group">
                          <p className={`text-body-sm group-hover:text-brand-600 transition-colors ${done ? "text-surface-500" : "text-surface-900 font-medium"}`}>{lesson.title}</p>
                          <p className="text-caption text-surface-400">{lesson.durationMin} min</p>
                        </Link>
                        {done ? (
                          <span className="text-caption text-accent-600 shrink-0">Done</span>
                        ) : (
                          <button onClick={() => markLesson(lesson.id)} className="shrink-0 rounded-lg border border-surface-300 px-3 py-1.5 text-caption font-medium text-surface-600 hover:bg-surface-100 transition-colors">
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
      </div>
    </div>
  );
}
