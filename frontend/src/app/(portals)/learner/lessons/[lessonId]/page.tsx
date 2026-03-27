/** @file learner/lessons/[lessonId]/page.tsx — Full Lab Layout with AI Avatar, Code Editor, and Assessment panels. */
"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { runPython, runShellCommand } from "@/lib/pyodide-runner";
import {
  ArrowLeft,
  Save,
  Play,
  Send,
  GraduationCap,
  MessageSquare,
  Bot,
  Code,
  Terminal,
  Database,
  FileText,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  Upload,
  CheckCircle2,
  BookOpen,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Clock,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────

interface LessonData {
  id: string;
  title: string;
  trackName: string;
  levelTier: string;
  moduleName: string;
  contentType: string;
  objectives: string[];
  moduleOutline: { id: string; title: string; completed: boolean }[];
}

const contentTabs = ["Learn", "Practice", "Apply"] as const;
type ContentTab = (typeof contentTabs)[number];

const practiceModes = ["Script", "Notebook", "SQL", "Terminal"] as const;
type PracticeMode = (typeof practiceModes)[number];

const bottomTabs = ["Console", "Test Results", "Logs"] as const;
type BottomTab = (typeof bottomTabs)[number];

// ─── Mock Data ──────────────────────────────────────────────────

const MOCK_LESSON: LessonData = {
  id: "LSN-py-002",
  title: "Control Flow and Functions",
  trackName: "AI Engineering and Intelligent Systems",
  levelTier: "Beginner",
  moduleName: "Python for AI",
  contentType: "interactive_code",
  objectives: [
    "Understand if/elif/else conditional statements",
    "Write functions with parameters and return values",
    "Use loops to iterate over sequences",
    "Apply control flow patterns to solve problems",
  ],
  moduleOutline: [
    { id: "LSN-py-001", title: "Variables and Data Types", completed: true },
    { id: "LSN-py-002", title: "Control Flow and Functions", completed: false },
    { id: "LSN-py-003", title: "Working with Lists and Dictionaries", completed: false },
  ],
};


// ─── Data Fetching ──────────────────────────────────────────────

async function fetchLesson(lessonId: string): Promise<LessonData> {
  try {
    const res = await fetch(`/dashboard/learner/lessons/${lessonId}`);
    if (!res.ok) throw new Error("Failed to fetch lesson");
    return res.json();
  } catch {
    return { ...MOCK_LESSON, id: lessonId };
  }
}

// ─── Left Sidebar ───────────────────────────────────────────────

function LeftSidebar({
  lesson,
  collapsed,
  onToggle,
}: {
  lesson: LessonData;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const [outlineOpen, setOutlineOpen] = useState(true);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [filesOpen, setFilesOpen] = useState(false);

  if (collapsed) {
    return (
      <aside className="hidden lg:flex flex-col items-center w-sidebar-collapsed border-r border-surface-200 bg-surface-0 py-4 gap-4">
        <button onClick={onToggle} className="p-2 rounded-lg hover:bg-surface-100 text-surface-500" aria-label="Expand sidebar">
          <PanelLeftOpen className="w-5 h-5" />
        </button>
        <BookOpen className="w-5 h-5 text-surface-400" />
        <FileText className="w-5 h-5 text-surface-400" />
        <FolderOpen className="w-5 h-5 text-surface-400" />
      </aside>
    );
  }

  return (
    <aside className="hidden lg:flex flex-col w-sidebar border-r border-surface-200 bg-surface-0 overflow-y-auto">
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200">
        <span className="text-body-sm font-medium text-surface-700">Navigation</span>
        <button onClick={onToggle} className="p-1 rounded hover:bg-surface-100 text-surface-400" aria-label="Collapse sidebar">
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* Module Outline */}
      <div className="border-b border-surface-200">
        <button onClick={() => setOutlineOpen(!outlineOpen)} className="flex items-center gap-2 w-full px-4 py-3 text-body-sm font-medium text-surface-700 hover:bg-surface-50">
          {outlineOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <BookOpen className="w-4 h-4" />
          Module Outline
        </button>
        {outlineOpen && (
          <ul className="px-4 pb-3 space-y-1">
            {lesson.moduleOutline.map((item) => (
              <li key={item.id} className={`flex items-center gap-2 px-2 py-1.5 rounded text-body-sm ${item.id === lesson.id ? "bg-brand-50 text-brand-700 font-medium" : item.completed ? "text-accent-600" : "text-surface-500"}`}>
                {item.completed ? <CheckCircle className="w-3.5 h-3.5 text-accent-500 shrink-0" /> : <div className="w-3.5 h-3.5 rounded-full border-2 border-surface-300 shrink-0" />}
                <span className="truncate">{item.title}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Resources */}
      <div className="border-b border-surface-200">
        <button onClick={() => setResourcesOpen(!resourcesOpen)} className="flex items-center gap-2 w-full px-4 py-3 text-body-sm font-medium text-surface-700 hover:bg-surface-50">
          {resourcesOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <FileText className="w-4 h-4" />
          Resources
        </button>
        {resourcesOpen && (
          <div className="px-4 pb-3">
            <p className="text-caption text-surface-400">No resources for this lesson.</p>
          </div>
        )}
      </div>

      {/* Files */}
      <div>
        <button onClick={() => setFilesOpen(!filesOpen)} className="flex items-center gap-2 w-full px-4 py-3 text-body-sm font-medium text-surface-700 hover:bg-surface-50">
          {filesOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <FolderOpen className="w-4 h-4" />
          Files
        </button>
        {filesOpen && (
          <div className="px-4 pb-3">
            <p className="text-caption text-surface-400">No files attached.</p>
          </div>
        )}
      </div>
    </aside>
  );
}


// ─── Learn Tab (AI Avatar) ──────────────────────────────────────

function LearnPanel({ lesson }: { lesson: LessonData }) {
  const [tutorInput, setTutorInput] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto p-4">
      {/* AI Avatar Video Player */}
      <div className="rounded-card border border-surface-200 bg-surface-900 shadow-card overflow-hidden">
        <div className="relative aspect-video flex items-center justify-center bg-gradient-to-br from-brand-950 via-surface-900 to-surface-950">
          {/* Avatar placeholder */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-24 h-24 rounded-full bg-brand-800/50 border-2 border-brand-500/30 flex items-center justify-center">
              <Bot className="w-12 h-12 text-brand-300" />
            </div>
            <div className="text-center">
              <p className="text-body-sm font-medium text-white">AI Tutor — {lesson.moduleName}</p>
              <p className="text-caption text-surface-400 mt-1">{lesson.title}</p>
            </div>
            {/* Play button overlay */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-body-sm font-medium text-white hover:bg-brand-500 transition-colors shadow-lg"
            >
              {isPlaying ? (
                <>
                  <div className="flex gap-1">
                    <div className="w-1 h-4 bg-white rounded-full" />
                    <div className="w-1 h-4 bg-white rounded-full" />
                  </div>
                  Pause Lesson
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  {lesson.moduleOutline.find((m) => m.id === lesson.id)?.completed ? "Replay Lesson" : "Start Lesson"}
                </>
              )}
            </button>
          </div>
          {/* Progress bar at bottom of video */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-800">
            <div className="h-full bg-brand-500 transition-all" style={{ width: isPlaying ? "35%" : "0%" }} />
          </div>
        </div>
        {/* Video controls bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-surface-950 text-caption text-surface-400">
          <span>{isPlaying ? "Playing..." : "Ready"}</span>
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>12:45 / 30:00</span>
          </div>
        </div>
      </div>

      {/* Module Lessons — Watched / Unwatched */}
      <div className="rounded-card border border-surface-200 bg-surface-0 p-4 shadow-card">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-5 h-5 text-brand-600" />
          <h2 className="text-heading-sm text-surface-900">Module Lessons</h2>
          <span className="ml-auto text-caption text-surface-400">
            {lesson.moduleOutline.filter((m) => m.completed).length}/{lesson.moduleOutline.length} watched
          </span>
        </div>
        <ul className="space-y-2">
          {lesson.moduleOutline.map((item, idx) => (
            <li key={item.id}>
              <a
                href={`/learner/lessons/${item.id}`}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                  item.id === lesson.id
                    ? "bg-brand-50 border border-brand-200"
                    : "hover:bg-surface-50 border border-transparent"
                }`}
              >
                {/* Status icon */}
                {item.completed ? (
                  <CheckCircle className="w-5 h-5 text-accent-500 shrink-0" />
                ) : item.id === lesson.id ? (
                  <div className="w-5 h-5 rounded-full bg-brand-600 flex items-center justify-center shrink-0">
                    <Play className="w-3 h-3 text-white" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-surface-300 shrink-0" />
                )}
                {/* Lesson info */}
                <div className="flex-1 min-w-0">
                  <p className={`text-body-sm truncate ${
                    item.id === lesson.id ? "font-medium text-brand-700" : item.completed ? "text-surface-600" : "text-surface-700"
                  }`}>
                    {idx + 1}. {item.title}
                  </p>
                  <p className="text-caption text-surface-400">
                    {item.completed ? "Watched" : item.id === lesson.id ? "Now playing" : "Not started"}
                  </p>
                </div>
                {/* Duration */}
                <span className="text-caption text-surface-400 shrink-0">~30 min</span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Objectives */}
      <div className="rounded-card border border-surface-200 bg-surface-0 p-4 shadow-card">
        <div className="flex items-center gap-2 mb-3">
          <GraduationCap className="w-5 h-5 text-brand-600" />
          <h2 className="text-heading-sm text-surface-900">Lesson Objectives</h2>
        </div>
        <ul className="space-y-2">
          {lesson.objectives.map((obj, i) => (
            <li key={i} className="flex items-start gap-2 text-body-sm text-surface-600">
              <CheckCircle className="w-4 h-4 text-accent-400 mt-0.5 shrink-0" />
              {obj}
            </li>
          ))}
        </ul>
      </div>

      {/* AI Avatar Content Area */}
      <div className="flex-1 rounded-card border border-surface-200 bg-surface-0 shadow-card flex flex-col min-h-[300px]">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-surface-200">
          <Bot className="w-5 h-5 text-brand-600" />
          <h2 className="text-heading-sm text-surface-900">AI Tutor</h2>
        </div>
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {/* Tutor message */}
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-brand-600" />
            </div>
            <div className="rounded-lg bg-surface-50 px-4 py-3 text-body-sm text-surface-700 max-w-[85%]">
              <p className="font-medium text-surface-900 mb-1">Welcome to {lesson.title}!</p>
              <p>In this lesson, we will explore control flow statements and how to define reusable functions in Python. Let us start with conditional statements — the building blocks of decision-making in code.</p>
            </div>
          </div>
          {/* Learner message example */}
          <div className="flex gap-3 justify-end">
            <div className="rounded-lg bg-brand-50 px-4 py-3 text-body-sm text-brand-800 max-w-[85%]">
              Can you show me an example of an if/else statement?
            </div>
          </div>
          {/* Tutor response */}
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-brand-600" />
            </div>
            <div className="rounded-lg bg-surface-50 px-4 py-3 text-body-sm text-surface-700 max-w-[85%]">
              <p className="mb-2">Of course! Here is a simple example:</p>
              <pre className="bg-surface-900 text-accent-400 rounded-lg p-3 font-mono text-caption overflow-x-auto">
{`age = 18
if age >= 18:
    print("You are an adult")
else:
    print("You are a minor")`}
              </pre>
              <p className="mt-2">The <code className="bg-surface-100 px-1 rounded text-brand-700">if</code> keyword checks a condition. If it evaluates to <code className="bg-surface-100 px-1 rounded text-brand-700">True</code>, the indented block runs. Otherwise, the <code className="bg-surface-100 px-1 rounded text-brand-700">else</code> block executes.</p>
            </div>
          </div>
        </div>

        {/* Ask AI Tutor Input */}
        <div className="border-t border-surface-200 p-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                type="text"
                value={tutorInput}
                onChange={(e) => setTutorInput(e.target.value)}
                placeholder="Ask AI Tutor a question..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-surface-200 bg-surface-50 text-body-sm text-surface-700 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
            <button onClick={() => toast.info("AI Tutor response coming soon", { description: "The Tutor Agent integration is under development." })} className="px-4 py-2 rounded-lg bg-brand-600 text-white text-body-sm font-medium hover:bg-brand-700 transition-colors shrink-0">
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


// ─── Practice Tab (Code Editor) ─────────────────────────────────

function PracticePanel() {
  const [mode, setMode] = useState<PracticeMode>("Script");
  const [bottomTab, setBottomTab] = useState<BottomTab>("Console");
  const [running, setRunning] = useState(false);
  const [scriptOutput, setScriptOutput] = useState("");
  const [scriptError, setScriptError] = useState<string | null>(null);
  const [execTime, setExecTime] = useState<number | null>(null);
  const [code, setCode] = useState(`def greet(name: str) -> str:
    """Return a greeting message for the given name."""
    # TODO: Implement this function
    pass


def is_even(n: int) -> bool:
    """Return True if n is even, False otherwise."""
    # TODO: Implement this function
    pass`);
  const [sqlQuery, setSqlQuery] = useState(`-- Query the learner progress table
SELECT learner_id, track_name, completion_pct
FROM learner_progress
WHERE completion_pct > 50
ORDER BY completion_pct DESC
LIMIT 10;`);
  const [terminalHistory, setTerminalHistory] = useState<string[]>([
    "$ python --version",
    "Python 3.11.7",
    "$ pip list | head -5",
    "Package    Version",
    "---------- -------",
    "numpy      1.26.2",
    "pandas     2.1.4",
    "scikit-learn 1.3.2",
  ]);
  const [terminalInput, setTerminalInput] = useState("");
  const [notebookCells, setNotebookCells] = useState<{ id: number; type: "code" | "markdown" | "magic"; content: string; output: string | null; editing: boolean }[]>([
    { id: 1, type: "markdown", content: "# Control Flow in Python\nThis notebook explores conditional statements and loops.", output: null, editing: false },
    { id: 2, type: "code", content: "# Define a simple function\ndef greet(name):\n    return f\"Hello, {name}!\"", output: null, editing: false },
    { id: 3, type: "code", content: "# Test the function\nprint(greet(\"KoreField\"))", output: "Hello, KoreField!", editing: false },
    { id: 4, type: "magic", content: "%%timeit\nsum(range(1000))", output: "4.2 µs ± 120 ns per loop (mean ± std. dev. of 7 runs, 100,000 loops each)", editing: false },
    { id: 5, type: "code", content: "# TODO: Implement is_even\ndef is_even(n):\n    pass", output: null, editing: false },
  ]);

  const modeIcons: Record<PracticeMode, React.ReactNode> = {
    Script: <Code className="w-4 h-4" />,
    Notebook: <FileText className="w-4 h-4" />,
    SQL: <Database className="w-4 h-4" />,
    Terminal: <Terminal className="w-4 h-4" />,
  };

  function handleTerminalSubmit() {
    if (!terminalInput.trim()) return;
    const cmd = terminalInput.trim();
    setTerminalInput("");
    setTerminalHistory((prev) => [...prev, `$ ${cmd}`]);

    if (cmd === "clear") {
      setTerminalHistory([]);
      return;
    }

    runShellCommand(cmd).then((output) => {
      if (output === "__CLEAR__") {
        setTerminalHistory([]);
      } else {
        setTerminalHistory((prev) => [...prev, output]);
      }
    });
  }

  async function handleRunScript() {
    setRunning(true);
    setScriptOutput("");
    setScriptError(null);
    setExecTime(null);
    setBottomTab("Console");

    const result = await runPython(code);
    setScriptOutput(result.stdout + result.stderr);
    setScriptError(result.error);
    setExecTime(result.executionTimeMs);
    setRunning(false);
  }

  async function runNotebookCell(cellId: number) {
    const cell = notebookCells.find((c) => c.id === cellId);
    if (!cell || cell.type === "markdown") return;

    setNotebookCells((prev) =>
      prev.map((c) => c.id === cellId ? { ...c, output: "Running..." } : c)
    );

    const result = await runPython(cell.content);
    const output = result.error
      ? `Error: ${result.error}`
      : (result.stdout + result.stderr).trim() || "(no output)";

    setNotebookCells((prev) =>
      prev.map((c) => c.id === cellId ? { ...c, output } : c)
    );
  }

  function changeCellType(cellId: number, newType: "code" | "markdown" | "magic") {
    setNotebookCells((prev) =>
      prev.map((c) => c.id === cellId ? { ...c, type: newType, output: null } : c)
    );
  }

  function updateCellContent(cellId: number, content: string) {
    setNotebookCells((prev) =>
      prev.map((c) => c.id === cellId ? { ...c, content } : c)
    );
  }

  function toggleCellEdit(cellId: number) {
    setNotebookCells((prev) =>
      prev.map((c) => c.id === cellId ? { ...c, editing: !c.editing } : c)
    );
  }

  function deleteCell(cellId: number) {
    setNotebookCells((prev) => prev.filter((c) => c.id !== cellId));
  }

  function addCellAfter(afterId: number, type: "code" | "markdown" | "magic") {
    const newId = Math.max(...notebookCells.map((c) => c.id)) + 1;
    const idx = notebookCells.findIndex((c) => c.id === afterId);
    const defaultContent = type === "markdown" ? "# New section" : type === "magic" ? "%%time\n# Magic command" : "# New code cell";
    setNotebookCells((prev) => [
      ...prev.slice(0, idx + 1),
      { id: newId, type, content: defaultContent, output: null, editing: true },
      ...prev.slice(idx + 1),
    ]);
  }

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mode Selector */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-surface-200 bg-surface-50">
          {practiceModes.map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-caption font-medium transition-colors ${
                mode === m ? "bg-brand-600 text-white" : "text-surface-500 hover:bg-surface-100 hover:text-surface-700"
              }`}
            >
              {modeIcons[m]}
              {m}
            </button>
          ))}
          {mode === "Script" && (
            <button
              onClick={handleRunScript}
              disabled={running}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-600 text-white text-caption font-medium hover:bg-accent-700 disabled:opacity-50 transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              {running ? "Running..." : "Run"}
            </button>
          )}
        </div>

        {/* ── Script Mode ── */}
        {mode === "Script" && (
          <>
            <div className="flex-1 bg-surface-950 overflow-auto min-h-[200px]">
              <div className="flex font-mono text-caption">
                <div className="select-none text-right pr-3 pl-4 py-4 text-surface-500 bg-surface-900/50 border-r border-surface-800">
                  {code.split("\n").map((_, i) => (<div key={i} className="leading-6">{i + 1}</div>))}
                </div>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  spellCheck={false}
                  className="flex-1 bg-transparent text-accent-400 py-4 px-4 resize-none focus:outline-none leading-6 min-h-full"
                  style={{ tabSize: 4 }}
                />
              </div>
            </div>
            <div className="border-t border-surface-700 bg-surface-900">
              <div className="px-4 py-2 border-b border-surface-800 flex items-center justify-between">
                <span className="text-caption font-medium text-surface-400">Output</span>
                {execTime !== null && <span className="text-caption text-surface-500">{execTime}ms</span>}
              </div>
              <div className="px-4 py-3 min-h-[60px] max-h-[200px] overflow-y-auto font-mono text-caption">
                {running ? (
                  <span className="text-brand-400 animate-pulse">Running...</span>
                ) : scriptError ? (
                  <pre className="text-status-error whitespace-pre-wrap">{scriptError}</pre>
                ) : scriptOutput ? (
                  <pre className="text-accent-300 whitespace-pre-wrap">{scriptOutput}</pre>
                ) : (
                  <span className="text-surface-500">&gt;&gt;&gt; Click Run to execute your code</span>
                )}
              </div>
            </div>
          </>
        )}

        {/* ── Notebook Mode ── */}
        {mode === "Notebook" && (
          <div className="flex-1 overflow-y-auto bg-surface-50">
            {/* Notebook toolbar */}
            <div className="sticky top-0 z-10 flex items-center gap-2 px-4 py-2 bg-surface-0 border-b border-surface-200">
              <button onClick={() => addCellAfter(notebookCells[notebookCells.length - 1]?.id ?? 0, "code")} className="flex items-center gap-1 px-2 py-1 rounded text-caption text-surface-600 hover:bg-surface-100 transition-colors">
                <Code className="w-3.5 h-3.5" /> + Code
              </button>
              <button onClick={() => addCellAfter(notebookCells[notebookCells.length - 1]?.id ?? 0, "markdown")} className="flex items-center gap-1 px-2 py-1 rounded text-caption text-surface-600 hover:bg-surface-100 transition-colors">
                <FileText className="w-3.5 h-3.5" /> + Markdown
              </button>
              <button onClick={() => addCellAfter(notebookCells[notebookCells.length - 1]?.id ?? 0, "magic")} className="flex items-center gap-1 px-2 py-1 rounded text-caption text-surface-600 hover:bg-surface-100 transition-colors">
                <Lightbulb className="w-3.5 h-3.5" /> + Magic
              </button>
              <span className="ml-auto text-caption text-surface-400">Python 3.11 · Kernel idle</span>
            </div>

            <div className="p-4 space-y-2">
              {notebookCells.map((cell, idx) => (
                <div key={cell.id} className={`group rounded-lg border overflow-hidden transition-colors ${cell.editing ? "border-brand-300 ring-1 ring-brand-200" : "border-surface-200"} bg-surface-0`}>
                  {/* Cell toolbar */}
                  <div className="flex items-center gap-1 px-2 py-1 bg-surface-50 border-b border-surface-200 text-caption">
                    <span className="font-mono text-surface-400 w-14 shrink-0">
                      {cell.type === "code" ? `[${idx}]:` : cell.type === "magic" ? "[✦]:" : "[M]:"}
                    </span>
                    {/* Type selector */}
                    <select
                      value={cell.type}
                      onChange={(e) => changeCellType(cell.id, e.target.value as "code" | "markdown" | "magic")}
                      className="px-1.5 py-0.5 rounded border border-surface-200 bg-surface-0 text-caption text-surface-600 focus:outline-none focus:ring-1 focus:ring-brand-400"
                    >
                      <option value="code">Code</option>
                      <option value="markdown">Markdown</option>
                      <option value="magic">Magic</option>
                    </select>
                    {/* Actions */}
                    <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {cell.type !== "markdown" && (
                        <button onClick={() => runNotebookCell(cell.id)} className="flex items-center gap-1 px-1.5 py-0.5 rounded text-accent-600 hover:bg-accent-50 transition-colors">
                          <Play className="w-3 h-3" /> Run
                        </button>
                      )}
                      <button onClick={() => toggleCellEdit(cell.id)} className="px-1.5 py-0.5 rounded text-surface-500 hover:bg-surface-100 transition-colors">
                        {cell.editing ? "Done" : "Edit"}
                      </button>
                      <button onClick={() => deleteCell(cell.id)} className="px-1.5 py-0.5 rounded text-status-error/60 hover:bg-red-50 hover:text-status-error transition-colors">
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Cell content */}
                  {cell.type === "markdown" ? (
                    cell.editing ? (
                      <textarea
                        value={cell.content}
                        onChange={(e) => updateCellContent(cell.id, e.target.value)}
                        rows={Math.max(3, cell.content.split("\n").length)}
                        className="w-full px-4 py-3 font-mono text-caption text-surface-700 bg-surface-0 resize-none focus:outline-none"
                        placeholder="# Markdown content..."
                      />
                    ) : (
                      <div className="px-4 py-3 text-body-sm text-surface-700 cursor-pointer" onClick={() => toggleCellEdit(cell.id)}>
                        {cell.content.split("\n").map((line, li) => {
                          if (line.startsWith("# ")) return <h1 key={li} className="text-heading-sm text-surface-900 mb-1">{line.slice(2)}</h1>;
                          if (line.startsWith("## ")) return <h2 key={li} className="text-body-lg font-medium text-surface-900 mb-1">{line.slice(3)}</h2>;
                          if (line.startsWith("- ")) return <li key={li} className="ml-4 text-surface-600">{line.slice(2)}</li>;
                          return <p key={li} className="text-surface-600">{line || "\u00A0"}</p>;
                        })}
                      </div>
                    )
                  ) : cell.type === "magic" ? (
                    <>
                      <div className="bg-purple-950/90 px-4 py-3 font-mono text-caption">
                        {cell.editing ? (
                          <textarea
                            value={cell.content}
                            onChange={(e) => updateCellContent(cell.id, e.target.value)}
                            rows={Math.max(2, cell.content.split("\n").length)}
                            className="w-full bg-transparent text-purple-300 resize-none focus:outline-none"
                          />
                        ) : (
                          <pre className="whitespace-pre-wrap">
                            {cell.content.split("\n").map((line, li) => (
                              <span key={li} className={line.startsWith("%%") ? "text-purple-400 font-bold" : "text-purple-300"}>
                                {line}{"\n"}
                              </span>
                            ))}
                          </pre>
                        )}
                      </div>
                      {cell.output && (
                        <div className="border-t border-purple-800/30 bg-purple-950/50 px-4 py-2 font-mono text-caption">
                          <span className="text-purple-400/60">Out: </span>
                          <span className="text-purple-300">{cell.output}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="bg-surface-950 px-4 py-3 font-mono text-caption">
                        {cell.editing ? (
                          <textarea
                            value={cell.content}
                            onChange={(e) => updateCellContent(cell.id, e.target.value)}
                            rows={Math.max(3, cell.content.split("\n").length)}
                            className="w-full bg-transparent text-accent-400 resize-none focus:outline-none"
                          />
                        ) : (
                          <pre className="whitespace-pre-wrap text-accent-400">{cell.content}</pre>
                        )}
                      </div>
                      {cell.output && (
                        <div className="border-t border-surface-200 bg-surface-0 px-4 py-2 font-mono text-caption">
                          <span className="text-surface-400">Out [{idx}]: </span>
                          <span className="text-brand-600">{cell.output}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SQL Mode ── */}
        {mode === "SQL" && (
          <div className="flex-1 flex overflow-hidden">
            {/* Schema sidebar */}
            <div className="hidden md:flex flex-col w-56 border-r border-surface-200 bg-surface-0 overflow-y-auto">
              <div className="px-3 py-2 border-b border-surface-200">
                <div className="flex items-center gap-2 text-body-sm font-medium text-surface-700">
                  <Database className="w-4 h-4 text-brand-600" />
                  korefield_db
                </div>
              </div>
              <div className="p-2 space-y-1">
                {[
                  { name: "learner_progress", cols: ["learner_id", "track_name", "completion_pct", "last_activity"] },
                  { name: "enrollments", cols: ["id", "learner_id", "track_id", "status", "enrolled_at"] },
                  { name: "payments", cols: ["id", "learner_id", "amount", "currency", "status", "due_date"] },
                  { name: "certificates", cols: ["id", "learner_id", "verification_code", "issued_at"] },
                  { name: "modules", cols: ["id", "track_id", "title", "level", "sequence_order"] },
                  { name: "lessons", cols: ["id", "module_id", "title", "content_type", "duration_min"] },
                ].map((table) => (
                  <details key={table.name} className="group">
                    <summary className="flex items-center gap-2 px-2 py-1.5 rounded text-caption text-surface-600 hover:bg-surface-50 cursor-pointer list-none">
                      <ChevronRight className="w-3 h-3 group-open:rotate-90 transition-transform" />
                      <Database className="w-3 h-3 text-surface-400" />
                      {table.name}
                    </summary>
                    <ul className="ml-7 mt-0.5 space-y-0.5">
                      {table.cols.map((col) => (
                        <li key={col} className="text-caption text-surface-400 px-1 py-0.5 hover:text-surface-600 cursor-pointer" onClick={() => setSqlQuery((prev) => prev + ` ${col}`)}>
                          {col}
                        </li>
                      ))}
                    </ul>
                  </details>
                ))}
              </div>
            </div>

            {/* SQL editor + results */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Toolbar */}
              <div className="flex items-center gap-2 px-4 py-2 bg-surface-50 border-b border-surface-200">
                <button onClick={() => {
                  runPython(`
import sqlite3, json
conn = sqlite3.connect(":memory:")
c = conn.cursor()
c.execute("CREATE TABLE learner_progress (learner_id TEXT, track_name TEXT, completion_pct INTEGER, last_activity TEXT)")
c.execute("INSERT INTO learner_progress VALUES ('LRN-7f3a2b','AI Engineering',85,'2026-03-20')")
c.execute("INSERT INTO learner_progress VALUES ('LRN-a1b2c3','Data Science',72,'2026-03-19')")
c.execute("INSERT INTO learner_progress VALUES ('LRN-d4e5f6','Cybersecurity',58,'2026-03-18')")
c.execute("INSERT INTO learner_progress VALUES ('LRN-g7h8i9','AI Product',45,'2026-03-17')")
c.execute("INSERT INTO learner_progress VALUES ('LRN-j0k1l2','AI Engineering',92,'2026-03-21')")
try:
    c.execute("""${sqlQuery.replace(/"/g, '\\"').replace(/\n/g, " ")}""")
    rows = c.fetchall()
    cols = [d[0] for d in c.description] if c.description else []
    print(json.dumps({"cols": cols, "rows": [list(r) for r in rows]}))
except Exception as e:
    print(json.dumps({"error": str(e)}))
conn.close()
`).then((result) => {
                    if (result.stdout) {
                      try {
                        const data = JSON.parse(result.stdout.trim());
                        if (data.error) {
                          toast.error(`SQL Error: ${data.error}`);
                        } else {
                          toast.success(`Query returned ${data.rows.length} rows`);
                        }
                      } catch { /* ignore parse errors */ }
                    }
                    if (result.error) toast.error(result.error);
                  });
                }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-600 text-white text-caption font-medium hover:bg-accent-700 transition-colors">
                  <Play className="w-3.5 h-3.5" /> Run Query
                </button>
                <button onClick={() => toast.info("Query formatted")} className="px-2 py-1.5 rounded text-caption text-surface-500 hover:bg-surface-100 transition-colors">
                  Format
                </button>
                <button onClick={() => toast.info("Results exported")} className="px-2 py-1.5 rounded text-caption text-surface-500 hover:bg-surface-100 transition-colors">
                  Export CSV
                </button>
                <span className="ml-auto text-caption text-surface-400">PostgreSQL 15 · Connected</span>
              </div>

              {/* Editor */}
              <div className="flex-1 bg-surface-950 overflow-auto min-h-[150px]">
                <div className="flex font-mono text-caption">
                  <div className="select-none text-right pr-3 pl-4 py-4 text-surface-500 bg-surface-900/50 border-r border-surface-800">
                    {sqlQuery.split("\n").map((_, i) => (<div key={i} className="leading-6">{i + 1}</div>))}
                  </div>
                  <textarea
                    value={sqlQuery}
                    onChange={(e) => setSqlQuery(e.target.value)}
                    spellCheck={false}
                    className="flex-1 bg-transparent text-blue-400 py-4 px-4 resize-none focus:outline-none leading-6 min-h-full"
                    style={{ tabSize: 4 }}
                  />
                </div>
              </div>

              {/* Results */}
              <div className="border-t border-surface-700 bg-surface-900">
                <div className="px-4 py-2 border-b border-surface-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-caption font-medium text-surface-300">Results</span>
                    <span className="text-caption text-accent-400">3 rows returned</span>
                  </div>
                  <span className="text-caption text-surface-500">Execution time: 12ms</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full font-mono text-caption">
                    <thead>
                      <tr className="border-b border-surface-800 bg-surface-900/80">
                        <th className="px-4 py-2 text-left text-surface-400 font-medium">#</th>
                        <th className="px-4 py-2 text-left text-surface-400 font-medium">learner_id</th>
                        <th className="px-4 py-2 text-left text-surface-400 font-medium">track_name</th>
                        <th className="px-4 py-2 text-left text-surface-400 font-medium">completion_pct</th>
                      </tr>
                    </thead>
                    <tbody className="text-surface-300">
                      <tr className="border-b border-surface-800/50 hover:bg-surface-800/30"><td className="px-4 py-1.5 text-surface-500">1</td><td className="px-4 py-1.5">LRN-7f3a2b</td><td className="px-4 py-1.5">AI Engineering</td><td className="px-4 py-1.5 text-accent-400">85</td></tr>
                      <tr className="border-b border-surface-800/50 hover:bg-surface-800/30"><td className="px-4 py-1.5 text-surface-500">2</td><td className="px-4 py-1.5">LRN-a1b2c3</td><td className="px-4 py-1.5">Data Science</td><td className="px-4 py-1.5 text-accent-400">72</td></tr>
                      <tr className="hover:bg-surface-800/30"><td className="px-4 py-1.5 text-surface-500">3</td><td className="px-4 py-1.5">LRN-d4e5f6</td><td className="px-4 py-1.5">Cybersecurity</td><td className="px-4 py-1.5 text-accent-400">58</td></tr>
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-1.5 border-t border-surface-800 text-caption text-surface-500">
                  Showing 3 of 3 rows · Query completed successfully
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Terminal Mode ── */}
        {mode === "Terminal" && (
          <div className="flex-1 flex flex-col bg-surface-950">
            {/* Title bar */}
            <div className="flex items-center gap-2 px-4 py-2 bg-surface-900 border-b border-surface-800">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <span className="text-caption text-surface-400 font-mono ml-2">bash — sandbox</span>
              <div className="ml-auto flex items-center gap-2">
                <button onClick={() => { setTerminalHistory(["Welcome to KoreField Sandbox Terminal", "Python 3.11.7 | Bash 5.2 | Git 2.43", "Type 'help' for available commands.", ""]); toast.success("Terminal cleared"); }} className="px-2 py-0.5 rounded text-caption text-surface-500 hover:bg-surface-800 hover:text-surface-300 transition-colors">
                  Clear
                </button>
                <span className="text-caption text-surface-600">|</span>
                <span className="text-caption text-accent-400">● Connected</span>
              </div>
            </div>

            {/* Terminal output */}
            <div className="flex-1 overflow-y-auto px-4 py-3 font-mono text-caption space-y-0.5">
              {terminalHistory.length === 0 && (
                <div className="text-surface-500">
                  <p>Welcome to KoreField Sandbox Terminal</p>
                  <p>Python 3.11.7 | Bash 5.2 | Git 2.43</p>
                  <p>Type &apos;help&apos; for available commands.</p>
                  <p>&nbsp;</p>
                </div>
              )}
              {terminalHistory.map((line, i) => (
                <div key={i} className={
                  line.startsWith("$") ? "text-accent-400" :
                  line.startsWith("Error") || line.startsWith("error") ? "text-status-error" :
                  line.startsWith(">>>") ? "text-brand-400" :
                  line === "" ? "h-3" :
                  "text-surface-400"
                }>
                  {line || "\u00A0"}
                </div>
              ))}
            </div>

            {/* Input area */}
            <div className="border-t border-surface-800">
              <div className="px-4 py-1 text-caption text-surface-600 bg-surface-900/50 border-b border-surface-800/50">
                sandbox:~/lesson $ <span className="text-surface-500">Time/memory limits: 10s / 256MB</span>
              </div>
              <div className="px-4 py-2 flex items-center gap-2 bg-surface-950">
                <span className="text-accent-400 font-mono text-caption shrink-0">$</span>
                <input
                  type="text"
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleTerminalSubmit();
                    if (e.key === "l" && e.ctrlKey) {
                      e.preventDefault();
                      setTerminalHistory([]);
                    }
                  }}
                  placeholder="Type a command... (python, pip, git, ls, cat, echo)"
                  className="flex-1 bg-transparent text-surface-200 font-mono text-caption placeholder:text-surface-600 focus:outline-none"
                  autoFocus
                />
              </div>
            </div>
          </div>
        )}

        {/* Bottom Tabs (Script mode only) */}
        {mode === "Script" && (
          <div className="border-t border-surface-700 bg-surface-900">
            <div className="flex border-b border-surface-800">
              {bottomTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setBottomTab(tab)}
                  className={`px-4 py-2 text-caption font-medium transition-colors ${
                    bottomTab === tab ? "text-brand-400 border-b-2 border-brand-400" : "text-surface-500 hover:text-surface-300"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="px-4 py-3 min-h-[80px] font-mono text-caption text-surface-400">
              {bottomTab === "Console" && <p>&gt;&gt; Execution output will appear here...</p>}
              {bottomTab === "Test Results" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-accent-500" />
                    <span className="text-accent-400">Test 1: greet returns correct greeting</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-status-warning" />
                    <span className="text-status-warning">Test 2: is_even — not yet implemented</span>
                  </div>
                </div>
              )}
              {bottomTab === "Logs" && <p>No execution logs yet.</p>}
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar — AI Tutor + Debug + Rubric */}
      <div className="hidden xl:flex flex-col w-72 border-l border-surface-200 bg-surface-0 overflow-y-auto">
        <div className="border-b border-surface-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-status-warning" />
            <h3 className="text-body-sm font-medium text-surface-900">AI Tutor Hints</h3>
          </div>
          <div className="space-y-2">
            <div className="rounded-lg bg-surface-50 p-3 text-caption text-surface-600">
              <p className="font-medium text-surface-700 mb-1">Hint 1</p>
              <p>Remember that <code className="bg-surface-200 px-1 rounded">greet()</code> should return a formatted string, not print it.</p>
            </div>
            <div className="rounded-lg bg-surface-50 p-3 text-caption text-surface-600">
              <p className="font-medium text-surface-700 mb-1">Hint 2</p>
              <p>The modulo operator <code className="bg-surface-200 px-1 rounded">%</code> is useful for checking even/odd numbers.</p>
            </div>
          </div>
        </div>
        <div className="border-b border-surface-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-status-error" />
            <h3 className="text-body-sm font-medium text-surface-900">Debug</h3>
          </div>
          <div className="rounded-lg bg-status-error/5 border border-status-error/20 p-3 text-caption text-surface-600">
            <p className="text-status-error font-medium mb-1">No errors detected</p>
            <p>Run your code to check for issues.</p>
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-4 h-4 text-accent-600" />
            <h3 className="text-body-sm font-medium text-surface-900">Checklist</h3>
          </div>
          <ul className="space-y-2">
            {[
              { label: "Implement greet() function", done: false },
              { label: "Implement is_even() function", done: false },
              { label: "All test cases pass", done: false },
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-caption">
                {item.done ? (
                  <CheckCircle className="w-4 h-4 text-accent-500 shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded border-2 border-surface-300 shrink-0" />
                )}
                <span className={item.done ? "text-accent-600" : "text-surface-600"}>{item.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}



// ─── Apply Tab (Assessment) ─────────────────────────────────────

function ApplyPanel() {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto p-4">
      {/* Instructions */}
      <div className="rounded-card border border-surface-200 bg-surface-0 p-4 shadow-card">
        <div className="flex items-center gap-2 mb-3">
          <GraduationCap className="w-5 h-5 text-brand-600" />
          <h2 className="text-heading-sm text-surface-900">Assessment Instructions</h2>
        </div>
        <div className="space-y-3 text-body-sm text-surface-600">
          <p>Complete the following tasks to demonstrate your understanding of control flow and functions in Python:</p>
          <ol className="list-decimal list-inside space-y-2 ml-2">
            <li>Implement the <code className="bg-surface-100 px-1 rounded text-brand-700">greet()</code> function that returns a formatted greeting string.</li>
            <li>Implement the <code className="bg-surface-100 px-1 rounded text-brand-700">is_even()</code> function using the modulo operator.</li>
            <li>Ensure all test cases pass before submitting.</li>
          </ol>
          <div className="mt-4 rounded-lg bg-status-info/5 border border-status-info/20 p-3">
            <p className="text-status-info text-caption font-medium">Note: You have 2 attempts for this assessment. Your highest score will be recorded.</p>
          </div>
        </div>
      </div>

      {/* Submission Area */}
      <div className="rounded-card border border-surface-200 bg-surface-0 p-4 shadow-card">
        <div className="flex items-center gap-2 mb-3">
          <Upload className="w-5 h-5 text-brand-600" />
          <h2 className="text-heading-sm text-surface-900">Submit Your Solution</h2>
        </div>
        <div className="space-y-4">
          <div className="rounded-lg bg-surface-50 border border-dashed border-surface-300 p-6 text-center">
            <Upload className="w-8 h-8 text-surface-400 mx-auto mb-2" />
            <p className="text-body-sm text-surface-500">Your code from the Practice tab will be submitted automatically.</p>
            <p className="text-caption text-surface-400 mt-1">Make sure all changes are saved before submitting.</p>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-body-sm text-surface-600">
              I confirm this is my own work and I am ready to submit for grading.
            </span>
          </label>

          <button
            disabled={!confirmed}
            onClick={() => toast.success("Solution submitted", { description: "Your solution has been queued for grading." })}
            className={`flex items-center justify-center gap-2 w-full py-3 rounded-lg text-body-sm font-medium transition-colors ${
              confirmed
                ? "bg-brand-600 text-white hover:bg-brand-700"
                : "bg-surface-200 text-surface-400 cursor-not-allowed"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            Submit Solution
          </button>
        </div>
      </div>
    </div>
  );
}


// ─── Mobile Sidebar Drawer ──────────────────────────────────────

function MobileSidebar({
  lesson,
  open,
  onClose,
}: {
  lesson: LessonData;
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-surface-950/50" onClick={onClose} />
      <aside className="absolute left-0 top-0 bottom-0 w-72 bg-surface-0 shadow-card-hover overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200">
          <span className="text-body-sm font-medium text-surface-700">Navigation</span>
          <button onClick={onClose} className="p-1 rounded hover:bg-surface-100 text-surface-400" aria-label="Close sidebar">
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-surface-600" />
            <span className="text-body-sm font-medium text-surface-700">Module Outline</span>
          </div>
          <ul className="space-y-1">
            {lesson.moduleOutline.map((item) => (
              <li key={item.id} className={`flex items-center gap-2 px-2 py-1.5 rounded text-body-sm ${item.id === lesson.id ? "bg-brand-50 text-brand-700 font-medium" : item.completed ? "text-accent-600" : "text-surface-500"}`}>
                {item.completed ? <CheckCircle className="w-3.5 h-3.5 text-accent-500 shrink-0" /> : <div className="w-3.5 h-3.5 rounded-full border-2 border-surface-300 shrink-0" />}
                <span className="truncate">{item.title}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}

// ─── Main Page Component ────────────────────────────────────────

export default function LessonPage() {
  const params = useParams<{ lessonId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const [activeTab, setActiveTab] = useState<ContentTab>(mode === "lab" ? "Practice" : "Learn");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const { data: lesson } = useQuery({
    queryKey: ["lesson", params.lessonId],
    queryFn: () => fetchLesson(params.lessonId),
    initialData: { ...MOCK_LESSON, id: params.lessonId },
  });

  const progress = Math.round(
    (lesson.moduleOutline.filter((l) => l.completed).length / lesson.moduleOutline.length) * 100
  );

  return (
    <div className="flex flex-col h-screen bg-surface-50">
      {/* ── Top Bar ── */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-surface-200 bg-surface-0 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile sidebar toggle */}
          <button onClick={() => setMobileSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-surface-100 text-surface-500" aria-label="Open navigation">
            <PanelLeftOpen className="w-5 h-5" />
          </button>
          {/* Back button */}
          <button onClick={() => router.push("/learner/lessons")} className="p-2 rounded-lg hover:bg-surface-100 text-surface-500 shrink-0" aria-label="Go back">
            <ArrowLeft className="w-5 h-5" />
          </button>
          {/* Title + context */}
          <div className="min-w-0">
            <h1 className="text-body-sm font-medium text-surface-900 truncate">{lesson.title}</h1>
            <p className="text-caption text-surface-400 truncate">{lesson.trackName} · {lesson.levelTier} · {lesson.moduleName}</p>
          </div>
        </div>

        {/* Action buttons + timer + progress */}
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => toast.success("Progress saved")} className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-surface-200 text-body-sm text-surface-600 hover:bg-surface-50 transition-colors">
            <Save className="w-4 h-4" /> Save
          </button>
          <button onClick={() => { setActiveTab("Practice"); toast.success("Switched to Practice — use the Run button in the editor"); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-600 text-white text-body-sm font-medium hover:bg-accent-700 transition-colors">
            <Play className="w-4 h-4" /> Run
          </button>
          <button onClick={() => toast.info("Submitting...", { description: "Assessment submission is under development." })} className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 text-white text-body-sm font-medium hover:bg-brand-700 transition-colors">
            <Send className="w-4 h-4" /> Submit
          </button>
          {/* Timer */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-caption text-surface-500">
            <Clock className="w-4 h-4" />
            <span>12:45</span>
          </div>
          {/* Progress */}
          <div className="hidden md:flex items-center gap-2">
            <div className="w-20 h-1.5 rounded-full bg-surface-200 overflow-hidden">
              <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-caption text-surface-500">{progress}%</span>
          </div>
        </div>
      </header>

      {/* ── Content Tabs ── */}
      <div className="flex items-center border-b border-surface-200 bg-surface-0 px-4 shrink-0" role="tablist" aria-label="Lesson sections">
        {contentTabs.map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            aria-controls={`panel-${tab}`}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-body-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-surface-500 hover:text-surface-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Main Content Area ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar (desktop) */}
        <LeftSidebar
          lesson={lesson}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Mobile Sidebar Drawer */}
        <MobileSidebar
          lesson={lesson}
          open={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
        />

        {/* Tab Panels */}
        <main className="flex-1 overflow-auto" id={`panel-${activeTab}`} role="tabpanel" aria-label={activeTab}>
          {activeTab === "Learn" && <LearnPanel lesson={lesson} />}
          {activeTab === "Practice" && <PracticePanel />}
          {activeTab === "Apply" && <ApplyPanel />}
        </main>
      </div>
    </div>
  );
}
