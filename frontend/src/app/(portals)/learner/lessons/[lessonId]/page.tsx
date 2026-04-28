"use client";
/** @file learner/lessons/[lessonId]/page.tsx — Track lesson viewer with Learn/Practice/Apply tabs. Supports video_text, coding_lab, mcq, and drag_drop lesson types. Persists progress via learner-progress-store. */

import { useState, useCallback, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Clock,
  Play,
  Video,
  PenTool,
  Upload,
  Send,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Code,
  GripVertical,
  Loader2,
  Save,
} from "lucide-react";
import type { McqQuestion, DragDropPair } from "@/data/ai-engineering-content";
import type { ContentSection } from "@/data/foundation-content";
import { useContentStore } from "@/stores/content-store";
import { useLearnerProgressStore } from "@/stores/learner-progress-store";
import { runPython } from "@/lib/pyodide-runner";
import CloudflareStreamPlayer from "@/components/content/cloudflare-stream-player";

type TabId = "learn" | "practice" | "apply";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "learn", label: "Learn", icon: <BookOpen className="w-4 h-4" /> },
  { id: "practice", label: "Practice", icon: <PenTool className="w-4 h-4" /> },
  { id: "apply", label: "Apply", icon: <Upload className="w-4 h-4" /> },
];

// ─── Content Renderer ───────────────────────────────────────────

function renderSection(section: ContentSection, index: number) {
  switch (section.type) {
    case "heading":
      return <h2 key={index} className="text-heading-sm text-surface-900 mt-8 mb-3 first:mt-0">{section.text as string}</h2>;
    case "paragraph":
      return <p key={index} className="text-body-sm text-surface-700 leading-relaxed mb-4">{section.text as string}</p>;
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

// ─── MCQ Component ──────────────────────────────────────────────

function McqAssessment({ questions, initialAnswers, initialShowResults, onStateChange }: {
  questions: McqQuestion[];
  initialAnswers?: Record<number, number>;
  initialShowResults?: boolean;
  onStateChange?: (answers: Record<number, number>, showResults: boolean, score: number) => void;
}) {
  const [answers, setAnswers] = useState<Record<number, number>>(initialAnswers ?? {});
  const [showResults, setShowResults] = useState(initialShowResults ?? false);
  const score = questions.filter((q, i) => answers[i] === q.correctIndex).length;

  function handleSelectAnswer(qi: number, oi: number) {
    if (showResults) return;
    const next = { ...answers, [qi]: oi };
    setAnswers(next);
    const newScore = questions.filter((q, i) => next[i] === q.correctIndex).length;
    onStateChange?.(next, false, newScore);
  }

  function handleSubmit() {
    setShowResults(true);
    onStateChange?.(answers, true, score);
  }

  return (
    <div className="space-y-6">
      {questions.map((q, qi) => {
        const selected = answers[qi];
        const isCorrect = selected === q.correctIndex;
        return (
          <div key={qi} className="rounded-card border border-surface-200 bg-white p-5 space-y-3">
            <p className="text-body-sm font-medium text-surface-900">{qi + 1}. {q.question}</p>
            <div className="space-y-2">
              {q.options.map((opt, oi) => {
                const letter = String.fromCharCode(65 + oi);
                const isSelected = selected === oi;
                const isCorrectOpt = oi === q.correctIndex;
                let border = "border-surface-200 hover:border-brand-300";
                let bg = "bg-white hover:bg-surface-50";
                if (isSelected && !showResults) { border = "border-brand-500 ring-1 ring-brand-500"; bg = "bg-brand-50"; }
                else if (showResults && isCorrectOpt) { border = "border-green-500"; bg = "bg-green-50"; }
                else if (showResults && isSelected && !isCorrect) { border = "border-red-500"; bg = "bg-red-50"; }
                return (
                  <button key={oi} type="button" disabled={showResults}
                    onClick={() => handleSelectAnswer(qi, oi)}
                    className={`w-full flex items-center gap-3 rounded-lg border px-4 py-2.5 text-left text-body-sm transition-colors ${border} ${bg} disabled:cursor-default`}>
                    <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full border border-surface-300 text-caption font-medium text-surface-600">{letter}</span>
                    <span className="text-surface-700">{opt}</span>
                    {showResults && isCorrectOpt && <CheckCircle2 className="ml-auto w-4 h-4 text-green-600 shrink-0" />}
                    {showResults && isSelected && !isCorrect && <XCircle className="ml-auto w-4 h-4 text-red-500 shrink-0" />}
                  </button>
                );
              })}
            </div>
            {showResults && <div className={`rounded-lg px-4 py-3 text-body-sm ${isCorrect ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>{q.explanation}</div>}
          </div>
        );
      })}
      {!showResults && Object.keys(answers).length === questions.length && (
        <div className="flex justify-center">
          <button type="button" onClick={handleSubmit} className="rounded-lg bg-brand-600 px-6 py-3 text-body-sm font-medium text-white hover:bg-brand-700 transition-colors">Submit Assessment</button>
        </div>
      )}
      {showResults && (
        <div className="rounded-card border border-surface-200 bg-surface-50 p-5 text-center">
          <p className="text-heading-sm text-surface-900">Score: {score}/{questions.length}</p>
          <p className="text-body-sm text-surface-500 mt-1">{score / questions.length >= 0.7 ? "You passed the performance gate!" : "You need 70% to pass. Review and try again."}</p>
        </div>
      )}
    </div>
  );
}


// ─── Drag & Drop Component ──────────────────────────────────────

function DragDropExercise({ pairs, initialMatches, initialChecked, onStateChange }: {
  pairs: DragDropPair[];
  initialMatches?: Record<string, string>;
  initialChecked?: boolean;
  onStateChange?: (matches: Record<string, string>, checked: boolean, correctCount: number) => void;
}) {
  const shuffledDefs = useMemo(() => [...pairs.map(p => p.definition)].sort(() => Math.random() - 0.5), [pairs]);
  const [matches, setMatches] = useState<Record<string, string>>(initialMatches ?? {});
  const [checked, setChecked] = useState(initialChecked ?? false);

  function handleSelect(term: string, def: string) {
    if (checked) return;
    const next = { ...matches, [term]: def };
    setMatches(next);
    onStateChange?.(next, false, pairs.filter(p => next[p.term] === p.definition).length);
  }

  const allMatched = Object.keys(matches).length === pairs.length;
  const correctCount = pairs.filter(p => matches[p.term] === p.definition).length;

  return (
    <div className="space-y-6">
      <p className="text-body-sm text-surface-600">Select a definition for each term. Click a term, then click the matching definition.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <p className="text-caption font-medium text-surface-500 mb-2">Terms</p>
          {pairs.map(p => {
            const matched = matches[p.term];
            const isCorrect = checked && matched === p.definition;
            const isWrong = checked && matched && matched !== p.definition;
            return (
              <div key={p.term} className={`rounded-lg border px-4 py-3 text-body-sm transition-colors ${isCorrect ? "border-green-500 bg-green-50" : isWrong ? "border-red-500 bg-red-50" : matched ? "border-brand-500 bg-brand-50" : "border-surface-200 bg-white"}`}>
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-surface-300 shrink-0" />
                  <span className="font-medium text-surface-900">{p.term}</span>
                </div>
                {matched && <p className="text-caption text-surface-500 mt-1 pl-6">→ {matched}</p>}
              </div>
            );
          })}
        </div>
        <div className="space-y-2">
          <p className="text-caption font-medium text-surface-500 mb-2">Definitions</p>
          {shuffledDefs.map(def => {
            const isUsed = Object.values(matches).includes(def);
            const unmatched = pairs.find(p => !matches[p.term]);
            return (
              <button key={def} type="button" disabled={checked || isUsed}
                onClick={() => { if (unmatched) handleSelect(unmatched.term, def); }}
                className={`w-full text-left rounded-lg border px-4 py-3 text-body-sm transition-colors ${isUsed ? "border-surface-200 bg-surface-100 text-surface-400" : "border-surface-200 bg-white hover:border-brand-300 hover:bg-brand-50 cursor-pointer"} disabled:cursor-default`}>
                {def}
              </button>
            );
          })}
        </div>
      </div>
      {!checked && allMatched && (
        <div className="flex justify-center">
          <button type="button" onClick={() => { setChecked(true); onStateChange?.(matches, true, correctCount); }} className="rounded-lg bg-brand-600 px-6 py-3 text-body-sm font-medium text-white hover:bg-brand-700 transition-colors">Check Matches</button>
        </div>
      )}
      {checked && (
        <div className="rounded-card border border-surface-200 bg-surface-50 p-5 text-center">
          <p className="text-heading-sm text-surface-900">{correctCount}/{pairs.length} correct</p>
          {correctCount < pairs.length && (
            <button type="button" onClick={() => { setMatches({}); setChecked(false); onStateChange?.({}, false, 0); }} className="mt-3 rounded-lg border border-surface-200 px-4 py-2 text-body-sm text-surface-600 hover:bg-surface-100 transition-colors">Try Again</button>
          )}
        </div>
      )}
    </div>
  );
}


// ─── Review Questions (reused from Foundation) ──────────────────

function ReviewQuestions({ questions, initialAnswers, initialShowResults, onStateChange }: {
  questions: { question: string; options: string[]; correctIndex: number; explanation: string }[];
  initialAnswers?: Record<number, number>;
  initialShowResults?: boolean;
  onStateChange?: (answers: Record<number, number>, showResults: boolean, score: number) => void;
}) {
  const [answers, setAnswers] = useState<Record<number, number>>(initialAnswers ?? {});
  const [showResults, setShowResults] = useState(initialShowResults ?? false);
  if (questions.length === 0) return null;
  const score = questions.filter((q, i) => answers[i] === q.correctIndex).length;

  function handleSelectAnswer(qi: number, oi: number) {
    if (showResults) return;
    const next = { ...answers, [qi]: oi };
    setAnswers(next);
    onStateChange?.(next, false, questions.filter((q, i) => next[i] === q.correctIndex).length);
  }

  function handleCheckAnswers() {
    setShowResults(true);
    onStateChange?.(answers, true, score);
  }
  return (
    <div className="space-y-6">
      <div className="h-px bg-surface-200" />
      <div className="flex items-center gap-2">
        <HelpCircle className="w-5 h-5 text-brand-600" />
        <h2 className="text-heading-sm text-surface-900">Review Questions</h2>
      </div>
      {questions.map((q, qi) => {
        const selected = answers[qi];
        const isCorrect = selected === q.correctIndex;
        return (
          <div key={qi} className="rounded-card border border-surface-200 bg-white p-5 space-y-3">
            <p className="text-body-sm font-medium text-surface-900">{qi + 1}. {q.question}</p>
            <div className="space-y-2">
              {q.options.map((opt, oi) => {
                const letter = String.fromCharCode(65 + oi);
                const isSelected = selected === oi;
                const isCorrectOpt = oi === q.correctIndex;
                let border = "border-surface-200 hover:border-brand-300";
                let bg = "bg-white hover:bg-surface-50";
                if (isSelected && !showResults) { border = "border-brand-500 ring-1 ring-brand-500"; bg = "bg-brand-50"; }
                else if (showResults && isCorrectOpt) { border = "border-green-500"; bg = "bg-green-50"; }
                else if (showResults && isSelected && !isCorrect) { border = "border-red-500"; bg = "bg-red-50"; }
                return (
                  <button key={oi} type="button" disabled={showResults}
                    onClick={() => handleSelectAnswer(qi, oi)}
                    className={`w-full flex items-center gap-3 rounded-lg border px-4 py-2.5 text-left text-body-sm transition-colors ${border} ${bg} disabled:cursor-default`}>
                    <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full border border-surface-300 text-caption font-medium text-surface-600">{letter}</span>
                    <span className="text-surface-700">{opt}</span>
                    {showResults && isCorrectOpt && <CheckCircle2 className="ml-auto w-4 h-4 text-green-600 shrink-0" />}
                    {showResults && isSelected && !isCorrect && <XCircle className="ml-auto w-4 h-4 text-red-500 shrink-0" />}
                  </button>
                );
              })}
            </div>
            {showResults && <div className={`rounded-lg px-4 py-3 text-body-sm ${isCorrect ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>{q.explanation}</div>}
          </div>
        );
      })}
      {!showResults && Object.keys(answers).length === questions.length && (
        <div className="flex justify-center">
          <button type="button" onClick={handleCheckAnswers} className="rounded-lg bg-brand-600 px-6 py-3 text-body-sm font-medium text-white hover:bg-brand-700 transition-colors">Check Answers</button>
        </div>
      )}
      {showResults && (
        <div className="rounded-card border border-surface-200 bg-surface-50 p-5 text-center">
          <p className="text-heading-sm text-surface-900">Review Score: {score}/{questions.length}</p>
          <p className="text-body-sm text-surface-500 mt-1">{score === questions.length ? "All correct — great understanding!" : `${score}/${questions.length} correct. Review the explanations above.`}</p>
        </div>
      )}
    </div>
  );
}


// ─── Main Page Component ────────────────────────────────────────

export default function TrackLessonPage() {
  const params = useParams<{ lessonId: string }>();
  const store = useContentStore();
  const progressStore = useLearnerProgressStore();
  const lesson = store.getLessonById(params.lessonId);
  const saved = progressStore.getProgress(params.lessonId);

  // Restore saved state or use defaults
  const [activeTab, setActiveTab] = useState<TabId>(saved?.activeTab ?? "learn");
  const [codeValue, setCodeValue] = useState(saved?.codeValue ?? "");
  const [codeOutput, setCodeOutput] = useState(saved?.codeOutput ?? "");
  const [codeRunning, setCodeRunning] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [practiceInput, setPracticeInput] = useState(saved?.practiceInput ?? "");
  const [deliverableInput, setDeliverableInput] = useState(saved?.deliverableInput ?? "");
  const [submitted, setSubmitted] = useState(saved?.submitted ?? false);
  const [saveIndicator, setSaveIndicator] = useState<"idle" | "saving" | "saved">("idle");

  // MCQ, drag-drop, and review question state (lifted for progress persistence)
  const [mcqAnswers, setMcqAnswers] = useState<Record<number, number>>(saved?.mcqAnswers ?? {});
  const [mcqShowResults, setMcqShowResults] = useState(saved?.mcqShowResults ?? false);
  const [mcqScore, setMcqScore] = useState<number>(0);
  const [dragDropMatches, setDragDropMatches] = useState<Record<string, string>>(saved?.dragDropMatches ?? {});
  const [dragDropChecked, setDragDropChecked] = useState(saved?.dragDropChecked ?? false);
  const [reviewAnswers, setReviewAnswers] = useState<Record<number, number>>(saved?.reviewAnswers ?? {});
  const [reviewShowResults, setReviewShowResults] = useState(saved?.reviewShowResults ?? false);

  // Initialize code editor with starter code if no saved progress
  const starterCode = lesson?.starterCode ?? "";
  useEffect(() => {
    if (lesson?.lessonType === "coding_lab" && !codeValue && starterCode && !saved?.codeValue) {
      setCodeValue(starterCode);
    }
  }, [lesson?.lessonType, starterCode, codeValue, saved?.codeValue]);

  // Auto-save progress on changes (debounced)
  useEffect(() => {
    if (!lesson) return;
    const timer = setTimeout(() => {
      setSaveIndicator("saving");
      progressStore.saveProgress(params.lessonId, {
        activeTab,
        codeValue: codeValue || undefined,
        codeOutput: codeOutput || undefined,
        practiceInput: practiceInput || undefined,
        deliverableInput: deliverableInput || undefined,
        submitted,
        mcqAnswers: Object.keys(mcqAnswers).length > 0 ? mcqAnswers : undefined,
        mcqShowResults: mcqShowResults || undefined,
        dragDropMatches: Object.keys(dragDropMatches).length > 0 ? dragDropMatches : undefined,
        dragDropChecked: dragDropChecked || undefined,
        reviewAnswers: Object.keys(reviewAnswers).length > 0 ? reviewAnswers : undefined,
        reviewShowResults: reviewShowResults || undefined,
      });
      setSaveIndicator("saved");
      setTimeout(() => setSaveIndicator("idle"), 1500);
    }, 1000);
    return () => clearTimeout(timer);
  }, [activeTab, codeValue, codeOutput, practiceInput, deliverableInput, submitted, mcqAnswers, mcqShowResults, dragDropMatches, dragDropChecked, reviewAnswers, reviewShowResults, params.lessonId, lesson, progressStore]);

  const handleRunCode = useCallback(async () => {
    if (codeRunning) return;
    setCodeRunning(true);
    setCodeError(null);
    setCodeOutput("");

    try {
      const result = await runPython(codeValue);
      if (result.error) {
        setCodeError(result.error);
        setCodeOutput(result.stderr || result.error);
      } else {
        setCodeOutput(result.stdout || "(no output)");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Code execution failed";
      setCodeError(msg);
      setCodeOutput(`Error: ${msg}`);
    } finally {
      setCodeRunning(false);
    }
  }, [codeValue, codeRunning]);

  if (!lesson) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <BookOpen className="w-12 h-12 text-surface-300 mb-4" />
        <h1 className="text-heading-sm text-surface-900 mb-2">Lesson Not Found</h1>
        <p className="text-body-sm text-surface-500 mb-6">The lesson you are looking for does not exist or has been moved.</p>
        <Link href="/learner/lessons" className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-body-sm font-medium text-white hover:bg-brand-700 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Lessons
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-caption text-surface-400">
        <Link href="/learner/lessons" className="hover:text-brand-600 transition-colors">Lessons</Link>
        <span>/</span>
        <span className="text-surface-500">{lesson.trackName}</span>
        <span>/</span>
        <span className="text-surface-500">{lesson.levelTier}</span>
        <span>/</span>
        <span className="text-surface-500">{lesson.moduleName}</span>
      </div>

      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-heading-lg text-surface-900">{lesson.title}</h1>
          {saveIndicator !== "idle" && (
            <span className="flex items-center gap-1.5 text-caption text-surface-400 animate-in fade-in">
              {saveIndicator === "saving" && <><Loader2 className="w-3 h-3 animate-spin" /> Saving...</>}
              {saveIndicator === "saved" && <><Save className="w-3 h-3 text-accent-500" /> Saved</>}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 mt-2 flex-wrap">
          <span className="flex items-center gap-1 text-caption text-surface-500"><Clock className="w-3.5 h-3.5" />{lesson.duration}</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-100 px-2.5 py-0.5 text-caption font-medium text-surface-600">
            {lesson.lessonType === "video_text" && <><Video className="w-3 h-3" /> Video + Text</>}
            {lesson.lessonType === "coding_lab" && <><Code className="w-3 h-3" /> Coding Lab</>}
            {lesson.lessonType === "mcq" && <><HelpCircle className="w-3 h-3" /> Assessment</>}
            {lesson.lessonType === "drag_drop" && <><GripVertical className="w-3 h-3" /> Matching</>}
          </span>
        </div>
        {lesson.objectives.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {lesson.objectives.map((obj, i) => (
              <span key={i} className="rounded-full bg-brand-50 px-3 py-1 text-caption text-brand-700">{obj}</span>
            ))}
          </div>
        )}
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 rounded-lg bg-surface-100 p-1">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-body-sm font-medium transition-colors ${activeTab === tab.id ? "bg-white text-brand-600 shadow-sm" : "text-surface-500 hover:text-surface-700"}`}>
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      <div className="h-px bg-surface-200" />

      {/* ─── Learn Tab ─── */}
      {activeTab === "learn" && (
        <div className="space-y-6">
          {/* Cloudflare Stream Player or Placeholder */}
          {lesson.video_url ? (
            <CloudflareStreamPlayer videoId={lesson.video_url} />
          ) : (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface-900 via-surface-800 to-brand-950 aspect-video flex items-center justify-center group cursor-pointer">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-600/10 via-transparent to-transparent" />
              <div className="relative flex flex-col items-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20 group-hover:bg-white/20 group-hover:scale-110 transition-all">
                  <Play className="w-7 h-7 text-white ml-1" />
                </div>
                <div className="text-center">
                  <p className="text-body-sm font-medium text-white">AI Avatar Lesson</p>
                  <p className="text-caption text-surface-300 mt-0.5">Video will be available when Cloudflare Stream is configured</p>
                </div>
              </div>
              <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-surface-400" />
                <span className="text-caption text-surface-400">{lesson.duration}</span>
              </div>
              <div className="absolute bottom-3 right-3">
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-medium text-surface-300 border border-white/10">Coming Soon</span>
              </div>
            </div>
          )}

          {/* Content sections */}
          <article>{lesson.content.map((section, i) => renderSection(section, i))}</article>

          {/* Review Questions */}
          <ReviewQuestions
            questions={lesson.reviewQuestions}
            initialAnswers={reviewAnswers}
            initialShowResults={reviewShowResults}
            onStateChange={(answers, show) => { setReviewAnswers(answers); setReviewShowResults(show); }}
          />
        </div>
      )}

      {/* ─── Practice Tab ─── */}
      {activeTab === "practice" && (
        <div className="space-y-6">
          {/* video_text: textarea prompt */}
          {lesson.lessonType === "video_text" && lesson.practicePrompt && (
            <div className="rounded-card border border-surface-200 bg-white p-5 space-y-4">
              <div className="flex items-center gap-2">
                <PenTool className="w-5 h-5 text-brand-600" />
                <h2 className="text-heading-sm text-surface-900">Practice Task</h2>
              </div>
              <p className="text-body-sm text-surface-700">{lesson.practicePrompt}</p>
              <textarea value={practiceInput} onChange={e => setPracticeInput(e.target.value)}
                placeholder="Write your response here..." rows={8}
                className="w-full rounded-lg border border-surface-300 bg-white px-4 py-3 text-body-sm text-surface-700 placeholder:text-surface-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none resize-y" />
              <div className="flex justify-end">
                <button type="button" disabled={!practiceInput.trim()}
                  className="rounded-lg bg-brand-600 px-5 py-2.5 text-body-sm font-medium text-white hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Save Practice Work</button>
              </div>
            </div>
          )}

          {/* coding_lab: code editor */}
          {lesson.lessonType === "coding_lab" && (
            <div className="rounded-card border border-surface-200 bg-white overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200 bg-surface-50">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-brand-600" />
                  <span className="text-body-sm font-medium text-surface-900">Code Editor</span>
                  <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-medium text-brand-700">{lesson.language ?? "python"}</span>
                </div>
                <button type="button" onClick={handleRunCode} disabled={codeRunning}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-accent-600 px-3 py-1.5 text-caption font-medium text-white hover:bg-accent-700 transition-colors disabled:opacity-60">
                  {codeRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />} {codeRunning ? "Running..." : "Run"}
                </button>
              </div>
              <textarea value={codeValue} onChange={e => setCodeValue(e.target.value)}
                spellCheck={false}
                className="w-full min-h-[320px] bg-surface-900 px-4 py-3 font-mono text-body-sm text-green-400 outline-none resize-y" />
              {codeOutput && (
                <div className={`border-t px-4 py-3 ${codeError ? "border-red-300 bg-red-950" : "border-surface-200 bg-surface-950"}`}>
                  <p className={`text-caption font-medium mb-1 ${codeError ? "text-red-400" : "text-surface-400"}`}>
                    {codeError ? "Error" : "Output"}
                  </p>
                  <pre className={`font-mono text-body-sm whitespace-pre-wrap ${codeError ? "text-red-300" : "text-green-300"}`}>{codeOutput}</pre>
                </div>
              )}
            </div>
          )}

          {/* mcq: assessment */}
          {lesson.lessonType === "mcq" && lesson.mcqQuestions && (
            <McqAssessment
              questions={lesson.mcqQuestions}
              initialAnswers={mcqAnswers}
              initialShowResults={mcqShowResults}
              onStateChange={(answers, show, score) => { setMcqAnswers(answers); setMcqShowResults(show); setMcqScore(score); }}
            />
          )}

          {/* drag_drop: matching */}
          {lesson.lessonType === "drag_drop" && lesson.dragDropPairs && (
            <DragDropExercise
              pairs={lesson.dragDropPairs}
              initialMatches={dragDropMatches}
              initialChecked={dragDropChecked}
              onStateChange={(m, c) => { setDragDropMatches(m); setDragDropChecked(c); }}
            />
          )}
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
              <p className="text-body-sm text-surface-700">{lesson.deliverable}</p>
            </div>
            {!submitted ? (
              <>
                <textarea value={deliverableInput} onChange={e => setDeliverableInput(e.target.value)}
                  placeholder="Paste or type your deliverable here..." rows={8}
                  className="w-full rounded-lg border border-surface-300 bg-white px-4 py-3 text-body-sm text-surface-700 placeholder:text-surface-400 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none resize-y" />
                <div className="flex items-center justify-between">
                  <p className="text-caption text-surface-400">You can also upload a file if preferred</p>
                  <button type="button" disabled={!deliverableInput.trim()} onClick={() => setSubmitted(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-accent-600 px-5 py-2.5 text-body-sm font-medium text-white hover:bg-accent-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    <Send className="w-4 h-4" /> Submit Deliverable
                  </button>
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-accent-200 bg-accent-50 px-4 py-4 text-center">
                <CheckCircle2 className="w-8 h-8 text-accent-600 mx-auto mb-2" />
                <p className="text-body-sm font-medium text-accent-800">Deliverable Submitted</p>
                <p className="text-caption text-accent-600 mt-1">Your submission is being reviewed.</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="h-px bg-surface-200" />

      {/* Previous / Next Navigation */}
      <div className="flex items-center justify-between gap-4 pt-2">
        {lesson.prevLessonId ? (
          <Link href={`/learner/lessons/${lesson.prevLessonId}`}
            className="flex items-center gap-2 rounded-lg border border-surface-200 px-4 py-2.5 text-body-sm text-surface-600 hover:bg-surface-50 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Previous Lesson
          </Link>
        ) : <div />}
        {lesson.nextLessonId ? (
          <Link href={`/learner/lessons/${lesson.nextLessonId}`}
            className="flex items-center gap-2 rounded-lg border border-surface-200 px-4 py-2.5 text-body-sm text-surface-600 hover:bg-surface-50 transition-colors">
            Next Lesson <ArrowRight className="w-4 h-4" />
          </Link>
        ) : <div />}
      </div>
    </div>
  );
}
