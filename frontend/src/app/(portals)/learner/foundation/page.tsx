"use client";
/** @file learner/foundation/page.tsx — AI Foundation School — 12-module + capstone conversion-focused curriculum in 4 phases. */

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  Lock,
  ChevronRight,
  Clock,
  Rocket,
  Trophy,
  Sparkles,
  Target,
  Zap,
  Wrench,
  ArrowRight,
} from "lucide-react";
import {
  FOUNDATION_MODULES,
  CONVERSION_TRIGGERS,
  FOUNDATION_CAPSTONE,
  type FoundationModule,
} from "@/data/foundation-content";

const PHASE_META: Record<number, { title: string; icon: React.ReactNode; color: string }> = {
  1: { title: "Awareness & Direction", icon: <Target className="w-5 h-5" />, color: "brand" },
  2: { title: "Quick Wins & Confidence", icon: <Zap className="w-5 h-5" />, color: "amber" },
  3: { title: "Build Your First AI System", icon: <Wrench className="w-5 h-5" />, color: "violet" },
  4: { title: "Conversion & Direction", icon: <Rocket className="w-5 h-5" />, color: "accent" },
};

export default function FoundationPage() {
  const [completedModules, setCompletedModules] = useState<Set<string>>(
    new Set(["FND-M01", "FND-M02", "FND-M03"])
  );

  const totalModules = FOUNDATION_MODULES.length;
  const totalDone = FOUNDATION_MODULES.filter((m) => completedModules.has(m.id)).length;
  const pct = Math.round((totalDone / totalModules) * 100);
  const allComplete = totalDone === totalModules;

  function getModuleStatus(mod: FoundationModule): "completed" | "in-progress" | "locked" {
    if (completedModules.has(mod.id)) return "completed";
    const idx = FOUNDATION_MODULES.indexOf(mod);
    if (idx === 0) return "in-progress";
    const prev = FOUNDATION_MODULES[idx - 1];
    if (completedModules.has(prev.id)) return "in-progress";
    return "locked";
  }

  const phases = useMemo(() => {
    const grouped = new Map<number, FoundationModule[]>();
    for (const mod of FOUNDATION_MODULES) {
      const list = grouped.get(mod.phase) || [];
      list.push(mod);
      grouped.set(mod.phase, list);
    }
    return grouped;
  }, []);

  function markModule(id: string) {
    setCompletedModules((prev) => new Set([...Array.from(prev), id]));
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-heading-lg text-surface-900">AI Foundation School</h1>
          <p className="text-body-sm text-surface-500 mt-1">
            Free, mandatory curriculum — 4 phases, 12 modules + capstone. Complete all to unlock paid Track Pathways.
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-heading-sm text-brand-600 font-bold">{pct}%</p>
          <p className="text-caption text-surface-500">
            {totalDone}/{totalModules} modules
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2.5 w-full rounded-full bg-surface-200">
        <div
          className="h-2.5 rounded-full bg-brand-600 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Phase sections */}
      {Array.from(phases.entries()).map(([phaseNum, mods]) => {
        const meta = PHASE_META[phaseNum];
        const phaseDone = mods.filter((m) => completedModules.has(m.id)).length;
        const lastModInPhase = mods[mods.length - 1];
        const trigger = CONVERSION_TRIGGERS.find((t) => t.afterModuleId === lastModInPhase.id);
        const showTrigger = trigger && completedModules.has(lastModInPhase.id);

        return (
          <div key={phaseNum} className="space-y-3">
            {/* Phase header */}
            <div className="flex items-center gap-3 px-1">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                {meta.icon}
              </div>
              <div className="flex-1">
                <p className="text-body-sm font-semibold text-surface-900">
                  Phase {phaseNum}: {meta.title}
                </p>
                <p className="text-caption text-surface-400">
                  {phaseDone}/{mods.length} modules complete
                </p>
              </div>
            </div>

            {/* Module cards */}
            <div className="space-y-2">
              {mods.map((mod) => {
                const status = getModuleStatus(mod);
                return (
                  <div
                    key={mod.id}
                    className={`rounded-card border shadow-card overflow-hidden transition-opacity ${
                      status === "locked" ? "border-surface-200 opacity-60" : "border-surface-200"
                    }`}
                  >
                    <div className="flex items-center gap-3 px-4 py-4">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full shrink-0 text-body-sm font-bold ${
                          status === "completed"
                            ? "bg-accent-100 text-accent-700"
                            : status === "in-progress"
                              ? "bg-brand-100 text-brand-700"
                              : "bg-surface-100 text-surface-400"
                        }`}
                      >
                        {status === "completed" ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : status === "locked" ? (
                          <Lock className="w-4 h-4" />
                        ) : (
                          mod.number
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-body-sm font-medium text-surface-900">
                          Module {mod.number}: {mod.title}
                        </p>
                        <p className="text-caption text-surface-500 mt-0.5">{mod.objective}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 text-caption text-surface-400">
                            <Clock className="w-3 h-3" />
                            {mod.duration}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        {status === "completed" && (
                          <span className="text-caption font-medium text-accent-600">Done</span>
                        )}
                        {status === "in-progress" && (
                          <Link
                            href={`/learner/foundation/${mod.id}`}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-caption font-medium text-white hover:bg-brand-700 transition-colors"
                          >
                            Start
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        )}
                        {status === "locked" && (
                          <Lock className="w-4 h-4 text-surface-300" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Conversion trigger banner */}
            {showTrigger && trigger && (
              <div className="rounded-card border border-brand-200 bg-gradient-to-r from-brand-50 to-brand-100 p-5">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-6 h-6 text-brand-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-body-sm font-semibold text-brand-900">
                      {trigger.headline}
                    </p>
                    <p className="text-caption text-brand-700 mt-1">{trigger.description}</p>
                    <Link
                      href={trigger.ctaHref}
                      className="inline-flex items-center gap-1.5 mt-3 rounded-lg bg-brand-600 px-4 py-2 text-caption font-medium text-white hover:bg-brand-700 transition-colors"
                    >
                      {trigger.ctaText}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Capstone section */}
      <div
        className={`rounded-card border shadow-card overflow-hidden ${
          allComplete ? "border-accent-200" : "border-surface-200 opacity-60"
        }`}
      >
        <div className="px-5 py-5 space-y-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full shrink-0 ${
                allComplete ? "bg-accent-100 text-accent-700" : "bg-surface-100 text-surface-400"
              }`}
            >
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <p className="text-body-sm font-semibold text-surface-900">
                {FOUNDATION_CAPSTONE.title}
              </p>
              <p className="text-caption text-surface-500">
                {allComplete ? "Unlocked — build your capstone project" : "Complete all 12 modules to unlock"}
              </p>
            </div>
          </div>

          {allComplete && (
            <>
              <p className="text-body-sm text-surface-700">{FOUNDATION_CAPSTONE.description}</p>
              <div className="space-y-1.5">
                <p className="text-caption font-medium text-surface-600">Project options:</p>
                <ul className="space-y-1 pl-1">
                  {FOUNDATION_CAPSTONE.options.map((opt, i) => (
                    <li key={i} className="flex items-start gap-2 text-caption text-surface-600">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent-500 shrink-0" />
                      <span>{opt}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-1.5">
                <p className="text-caption font-medium text-surface-600">Deliverables:</p>
                <ul className="space-y-1 pl-1">
                  {FOUNDATION_CAPSTONE.deliverables.map((d, i) => (
                    <li key={i} className="flex items-start gap-2 text-caption text-surface-600">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-500 shrink-0" />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-1.5">
                <p className="text-caption font-medium text-surface-600">Assessment criteria:</p>
                <ul className="space-y-1 pl-1">
                  {FOUNDATION_CAPSTONE.assessmentCriteria.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-caption text-surface-600">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {!allComplete && (
            <div className="flex items-center gap-2 text-caption text-surface-400">
              <Lock className="w-3.5 h-3.5" />
              <span>Complete all 12 modules to unlock the capstone project</span>
            </div>
          )}
        </div>
      </div>

      {/* All complete banner */}
      {allComplete && (
        <div className="rounded-card border border-accent-200 bg-accent-50 p-5 text-center">
          <CheckCircle2 className="w-8 h-8 text-accent-600 mx-auto mb-2" />
          <p className="text-body-sm font-medium text-accent-800">AI Foundation School Complete</p>
          <p className="text-caption text-accent-600 mt-1">
            You can now enroll in paid Track Pathways.
          </p>
          <Link
            href="/learner/tracks"
            className="inline-block mt-3 rounded-lg bg-brand-600 px-4 py-2 text-body-sm font-medium text-white hover:bg-brand-700 transition-colors"
          >
            Browse Tracks
          </Link>
        </div>
      )}
    </div>
  );
}
