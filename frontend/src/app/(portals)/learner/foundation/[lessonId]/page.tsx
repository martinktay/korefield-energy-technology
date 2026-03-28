"use client";
/** @file learner/foundation/[lessonId]/page.tsx — Foundation module viewer with Learn / Practice / Apply tabs. */

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
  BookOpen,
  Clock,
  Play,
  Video,
  PenTool,
  Upload,
  Send,
} from "lucide-react";
import {
  FOUNDATION_MODULES,
  type ContentSection,
  type FoundationModule,
} from "@/data/foundation-content";

type TabId = "learn" | "practice" | "apply";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "learn", label: "Learn", icon: <BookOpen className="w-4 h-4" /> },
  { id: "practice", label: "Practice", icon: <PenTool className="w-4 h-4" /> },
  { id: "apply", label: "Apply", icon: <Upload className="w-4 h-4" /> },
];

function renderSection(section: ContentSection, index: number) {
  switch (section.type) {
    case "heading":
      return (
        <h2 key={index} className="text-heading-sm text-surface-900 mt-8 mb-3 first:mt-0">
          {section.text as string}
        </h2>
      );
    case "paragraph":
      return (
        <p key={index} className="text-body-sm text-surface-700 leading-relaxed mb-4">
          {section.text as string}
        </p>
      );
    case "list":
      return (
        <ul key={index} className="mb-4 space-y-2 pl-1">
          {(section.text as string[]).map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-body-sm text-surface-700">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-brand-500 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    case "callout":
      return (
        <div key={index} className="rounded-card border border-brand-200 bg-brand-50 px-4 py-3 mb-4">
          <p className="text-body-sm text-brand-800">{section.text as string}</p>
        </div>
      );
    case "keyTakeaway":
      return (
        <div key={index} className="rounded-card border border-accent-200 bg-accent-50 px-4 py-3 mb-4">
          <p className="text-caption font-medium text-accent-700 mb-1">Key Takeaway</p>
          <p className="text-body-sm text-accent-800">{section.text as string}</p>
        </div>
      );
    default:
      return null;
  }
}

export default function FoundationModulePage() {
  const params = useParams<{ lessonId: string }>();
  const mod = FOUNDATION_MODULES.find((m) => m.id === params.lessonId);
  const [activeTab, setActiveTab] = useState<TabId>("learn");
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [practiceInput, setPracticeInput] = useState("");
  const [deliverableInput, setDeliverableInput] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!mod) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <BookOpen className="w-12 h-12 text-surface-300 mb-4" />
        <h1 className="text-heading-sm text-surface-900 mb-2">Module Not Found</h1>
        <p className="text-body-sm text-surface-500 mb-6">
          The module you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/learner/foundation"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-body-sm font-medium text-white hover:bg-brand-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to AI Foundation School
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-caption text-surface-400">
        <Link href="/learner/foundation" className="hover:text-brand-600 transition-colors">
          AI Foundation School
        </Link>
        <span>/</span>
        <span className="text-surface-500">
          Phase {mod.phase}: {mod.phaseTitle}
        </span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-heading-lg text-surface-900">
          Module {mod.number}: {mod.title}
        </h1>
        <div className="flex items-center gap-4 mt-2">
          <span className="flex items-center gap-1 text-caption text-surface-500">
            <Clock className="w-3.5 h-3.5" />
            {mod.duration}
          </span>
          <span className="flex items-center gap-1 text-caption text-surface-500">
            <BookOpen className="w-3.5 h-3.5" />
            {mod.objective}
          </span>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 rounded-lg bg-surface-100 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-body-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-white text-brand-600 shadow-sm"
                : "text-surface-500 hover:text-surface-700"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="h-px bg-surface-200" />

      {/* ─── Learn Tab ─── */}
      {activeTab === "learn" && (
        <div className="space-y-6">
          {/* AI Avatar Video Placeholder */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface-900 via-surface-800 to-brand-950 aspect-video flex items-center justify-center group cursor-pointer">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-600/10 via-transparent to-transparent" />
            <div className="relative flex flex-col items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20 group-hover:bg-white/20 group-hover:scale-110 transition-all">
                <Play className="w-7 h-7 text-white ml-1" />
              </div>
              <div className="text-center">
                <p className="text-body-sm font-medium text-white">AI Avatar Lesson</p>
                <p className="text-caption text-surface-300 mt-0.5">
                  Video will be available when Cloudflare Stream is configured
                </p>
              </div>
            </div>
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-surface-400" />
              <span className="text-caption text-surface-400">{mod.duration}</span>
            </div>
            <div className="absolute bottom-3 right-3">
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-medium text-surface-300 border border-white/10">
                Coming Soon
              </span>
            </div>
          </div>

          {/* Content sections */}
          <article className="animate-fade-in-up">
            {mod.content.map((section, i) => renderSection(section, i))}
          </article>

          {/* Review Questions */}
          {mod.reviewQuestions.length > 0 && (
            <div className="space-y-6">
              <div className="h-px bg-surface-200" />
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-brand-600" />
                <h2 className="text-heading-sm text-surface-900">Review Questions</h2>
              </div>

              {mod.reviewQuestions.map((q, qi) => {
                const selected = selectedAnswers[qi];
                const isCorrect = selected === q.correctIndex;

                return (
                  <div key={qi} className="rounded-card border border-surface-200 bg-white p-5 space-y-3">
                    <p className="text-body-sm font-medium text-surface-900">
                      {qi + 1}. {q.question}
                    </p>
                    <div className="space-y-2">
                      {q.options.map((opt, oi) => {
                        const letter = String.fromCharCode(65 + oi);
                        const isSelected = selected === oi;
                        const isCorrectOption = oi === q.correctIndex;

                        let borderClass = "border-surface-200 hover:border-brand-300";
                        let bgClass = "bg-white hover:bg-surface-50";

                        if (isSelected && !showResults) {
                          borderClass = "border-brand-500 ring-1 ring-brand-500";
                          bgClass = "bg-brand-50";
                        } else if (showResults && isCorrectOption) {
                          borderClass = "border-green-500";
                          bgClass = "bg-green-50";
                        } else if (showResults && isSelected && !isCorrect) {
                          borderClass = "border-red-500";
                          bgClass = "bg-red-50";
                        }

                        return (
                          <button
                            key={oi}
                            type="button"
                            disabled={showResults}
                            onClick={() =>
                              setSelectedAnswers((prev) => ({ ...prev, [qi]: oi }))
                            }
                            className={`w-full flex items-center gap-3 rounded-lg border px-4 py-2.5 text-left text-body-sm transition-colors ${borderClass} ${bgClass} disabled:cursor-default`}
                          >
                            <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full border border-surface-300 text-caption font-medium text-surface-600">
                              {letter}
                            </span>
                            <span className="text-surface-700">{opt}</span>
                            {showResults && isCorrectOption && (
                              <CheckCircle2 className="ml-auto w-4 h-4 text-green-600 shrink-0" />
                            )}
                            {showResults && isSelected && !isCorrect && (
                              <XCircle className="ml-auto w-4 h-4 text-red-500 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {showResults && (
                      <div
                        className={`rounded-lg px-4 py-3 text-body-sm ${
                          isCorrect ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
                        }`}
                      >
                        {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}

              {!showResults &&
                Object.keys(selectedAnswers).length === mod.reviewQuestions.length && (
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => setShowResults(true)}
                      className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-3 text-body-sm font-medium text-white hover:bg-brand-700 transition-colors"
                    >
                      Check Answers
                    </button>
                  </div>
                )}

              {showResults && (
                <div className="flex justify-center">
                  <p className="text-body-sm font-medium text-surface-700">
                    You got{" "}
                    <span className="text-brand-600">
                      {mod.reviewQuestions.filter((q, i) => selectedAnswers[i] === q.correctIndex).length}
                    </span>{" "}
                    out of{" "}
                    <span className="text-brand-600">{mod.reviewQuestions.length}</span> correct
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── Practice Tab ─── */}
      {activeTab === "practice" && (
        <div className="space-y-6">
          <div className="rounded-card border border-surface-200 bg-white p-5 space-y-4">
            <div className="flex items-center gap-2">
              <PenTool className="w-5 h-5 text-brand-600" />
              <h2 className="text-heading-sm text-surface-900">Practice Task</h2>
            </div>
            <p className="text-body-sm text-surface-700">{mod.practiceTask.instruction}</p>

            {mod.practiceTask.example && (
              <div className="rounded-lg border border-surface-200 bg-surface-50 px-4 py-3">
                <p className="text-caption font-medium text-surface-600 mb-1">Example</p>
                <p className="text-body-sm text-surface-600">{mod.practiceTask.example}</p>
              </div>
            )}

            {mod.practiceTask.inputType === "textarea" && (
              <textarea
                value={practiceInput}
                onChange={(e) => setPracticeInput(e.target.value)}
                placeholder={mod.practiceTask.placeholder}
                rows={8}
                className="w-full rounded-lg border border-surface-300 bg-white px-4 py-3 text-body-sm text-surface-700 placeholder:text-surface-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none resize-y"
              />
            )}

            {mod.practiceTask.inputType === "text" && (
              <input
                type="text"
                value={practiceInput}
                onChange={(e) => setPracticeInput(e.target.value)}
                placeholder={mod.practiceTask.placeholder}
                className="w-full rounded-lg border border-surface-300 bg-white px-4 py-3 text-body-sm text-surface-700 placeholder:text-surface-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
              />
            )}

            {mod.practiceTask.inputType === "file" && (
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-surface-300 border-dashed rounded-lg cursor-pointer bg-surface-50 hover:bg-surface-100 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 text-surface-400 mb-2" />
                    <p className="text-body-sm text-surface-500">Click to upload your file</p>
                    <p className="text-caption text-surface-400">PDF, DOCX, or images</p>
                  </div>
                  <input type="file" className="hidden" />
                </label>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                disabled={!practiceInput.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-body-sm font-medium text-white hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Practice Work
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Apply Tab ─── */}
      {activeTab === "apply" && (
        <div className="space-y-6">
          <div className="rounded-card border border-surface-200 bg-white p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-accent-600" />
              <h2 className="text-heading-sm text-surface-900">Submit Deliverable</h2>
            </div>
            <div className="rounded-lg border border-surface-200 bg-surface-50 px-4 py-3">
              <p className="text-caption font-medium text-surface-600 mb-1">Expected deliverable</p>
              <p className="text-body-sm text-surface-700">{mod.deliverable}</p>
            </div>
            <div className="rounded-lg border border-surface-200 bg-surface-50 px-4 py-3">
              <p className="text-caption font-medium text-surface-600 mb-1">Assessment method</p>
              <p className="text-body-sm text-surface-700">{mod.assessmentMethod}</p>
            </div>

            {!submitted ? (
              <>
                <textarea
                  value={deliverableInput}
                  onChange={(e) => setDeliverableInput(e.target.value)}
                  placeholder="Paste or type your deliverable here..."
                  rows={8}
                  className="w-full rounded-lg border border-surface-300 bg-white px-4 py-3 text-body-sm text-surface-700 placeholder:text-surface-400 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none resize-y"
                />
                <div className="flex items-center justify-between">
                  <p className="text-caption text-surface-400">
                    You can also upload a file if preferred
                  </p>
                  <button
                    type="button"
                    disabled={!deliverableInput.trim()}
                    onClick={() => setSubmitted(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-accent-600 px-5 py-2.5 text-body-sm font-medium text-white hover:bg-accent-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                    Submit Deliverable
                  </button>
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-accent-200 bg-accent-50 px-4 py-4 text-center">
                <CheckCircle2 className="w-8 h-8 text-accent-600 mx-auto mb-2" />
                <p className="text-body-sm font-medium text-accent-800">Deliverable Submitted</p>
                <p className="text-caption text-accent-600 mt-1">
                  Your submission is being reviewed.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="h-px bg-surface-200" />

      {/* Mark Complete */}
      <div className="flex justify-center">
        <Link
          href="/learner/foundation"
          className="inline-flex items-center gap-2 rounded-lg bg-accent-600 px-6 py-3 text-body-sm font-medium text-white hover:bg-accent-700 transition-colors"
        >
          <CheckCircle2 className="w-4 h-4" />
          Mark Complete
        </Link>
      </div>

      {/* Previous / Next Navigation */}
      <div className="flex items-center justify-between gap-4 pt-2">
        {mod.prevModuleId ? (
          <Link
            href={`/learner/foundation/${mod.prevModuleId}`}
            className="flex items-center gap-2 rounded-lg border border-surface-200 px-4 py-2.5 text-body-sm text-surface-600 hover:bg-surface-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous Module
          </Link>
        ) : (
          <div />
        )}
        {mod.nextModuleId ? (
          <Link
            href={`/learner/foundation/${mod.nextModuleId}`}
            className="flex items-center gap-2 rounded-lg border border-surface-200 px-4 py-2.5 text-body-sm text-surface-600 hover:bg-surface-50 transition-colors"
          >
            Next Module
            <ArrowRight className="w-4 h-4" />
          </Link>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
