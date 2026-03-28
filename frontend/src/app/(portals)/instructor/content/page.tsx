/** @file instructor/content/page.tsx — Content authoring: modules with expandable lesson lists, lesson CRUD, file upload. */
"use client";

import { useState } from "react";
import { X, Plus, ChevronDown, ChevronRight, Trash2, FileText, Video, FileVideo, Code, HelpCircle, Download, Save, Loader2, CheckCircle2, Move } from "lucide-react";
import { AssessmentBuilder, type Question } from "@/components/content";

interface Lesson {
  id: string;
  title: string;
  content_type: string;
  sequence: number;
  content_body?: string;
  video_url?: string;
  file_url?: string;
  file_name?: string;
}

interface Module {
  id: string;
  title: string;
  track: string;
  level: string;
  version: string;
  status: string;
  description: string;
  lessons: Lesson[];
}

const FALLBACK_MODULES: Module[] = [
  { id: "MOD-001", title: "Introduction to AI Systems", track: "AI Engineering", level: "Beginner", version: "v2.1", status: "Published", description: "Foundational concepts of AI systems architecture.", lessons: [
    { id: "LSN-001", title: "What is AI?", content_type: "text", sequence: 1, content_body: "# What is AI?\n\nArtificial Intelligence is..." },
    { id: "LSN-002", title: "AI System Architecture Overview", content_type: "video", sequence: 2, video_url: "https://stream.cloudflare.com/example" },
    { id: "LSN-003", title: "Your First AI Script", content_type: "interactive_code", sequence: 3 },
  ]},
  { id: "MOD-002", title: "Data Pipeline Fundamentals", track: "Data Science", level: "Beginner", version: "v1.3", status: "Draft", description: "Building reliable data pipelines for analytics.", lessons: [
    { id: "LSN-004", title: "Introduction to Data Pipelines", content_type: "text", sequence: 1 },
    { id: "LSN-005", title: "ETL Concepts", content_type: "text", sequence: 2 },
  ]},
  { id: "MOD-003", title: "Neural Network Architecture", track: "AI Engineering", level: "Intermediate", version: "v1.0", status: "In Review", description: "Deep dive into neural network design patterns.", lessons: [] },
];

const TRACKS = [
  "AI Engineering and Intelligent Systems",
  "Data Science and Decision Intelligence",
  "Cybersecurity and AI Security",
  "AI Product and Project Leadership",
];
const LEVELS = ["Beginner", "Intermediate", "Advanced"];
const CONTENT_TYPES = [
  { value: "text", label: "Text", icon: FileText },
  { value: "video", label: "Video", icon: Video },
  { value: "video_text", label: "Video / Text", icon: FileVideo },
  { value: "interactive_code", label: "Code Exercise", icon: Code },
  { value: "quiz", label: "Quiz", icon: HelpCircle },
  { value: "downloadable", label: "Downloadable", icon: Download },
];

function generateId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

function contentTypeIcon(type: string) {
  const ct = CONTENT_TYPES.find((c) => c.value === type);
  if (!ct) return FileText;
  return ct.icon;
}

export default function ContentPage() {
  const [modules, setModules] = useState<Module[]>(FALLBACK_MODULES);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [lessonDialogOpen, setLessonDialogOpen] = useState<string | null>(null); // module id
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  const [moduleForm, setModuleForm] = useState({ title: "", track: TRACKS[0], level: LEVELS[0], description: "", lessons: "" });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [moduleErrors, setModuleErrors] = useState<Record<string, string>>({});

  const [lessonForm, setLessonForm] = useState({ title: "", content_type: "text", content_body: "", video_url: "", file_url: "", file_name: "", starterCode: "", testCases: "", language: "python" });
  const [lessonErrors, setLessonErrors] = useState<Record<string, string>>({});
  const [lessonQuestions, setLessonQuestions] = useState<Question[]>([]);

  // ── Module CRUD ──

  function openModuleDialog() {
    setModuleForm({ title: "", track: TRACKS[0], level: LEVELS[0], description: "", lessons: "" });
    setQuestions([]);
    setModuleErrors({});
    setModuleDialogOpen(true);
  }

  function validateModule(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!moduleForm.title.trim()) errs.title = "Module title is required";
    if (moduleForm.title.trim().length < 5) errs.title = "Title must be at least 5 characters";
    if (!moduleForm.description.trim()) errs.description = "Description is required";
    return errs;
  }

  function handleCreateModule(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateModule();
    setModuleErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const newModule: Module = {
      id: generateId("MOD"),
      title: moduleForm.title.trim(),
      track: moduleForm.track.split(" and ")[0].split(" ")[0],
      level: moduleForm.level,
      version: "v1.0",
      status: "Draft",
      description: moduleForm.description.trim(),
      lessons: [],
    };
    setModules((prev) => [newModule, ...prev]);
    setModuleDialogOpen(false);
  }

  // ── Lesson CRUD ──

  function openLessonDialog(moduleId: string) {
    setLessonForm({ title: "", content_type: "text", content_body: "", video_url: "", file_url: "", file_name: "", starterCode: "", testCases: "", language: "python" });
    setLessonErrors({});
    setLessonQuestions([]);
    setEditingLesson(null);
    setLessonDialogOpen(moduleId);
  }

  function openEditLesson(lesson: Lesson, moduleId: string) {
    setLessonForm({
      title: lesson.title,
      content_type: lesson.content_type,
      content_body: lesson.content_body || "",
      video_url: lesson.video_url || "",
      file_url: lesson.file_url || "",
      file_name: lesson.file_name || "",
      starterCode: "",
      testCases: "",
      language: "python",
    });
    setLessonErrors({});
    setLessonQuestions([]);
    setEditingLesson(lesson);
    setLessonDialogOpen(moduleId);
  }

  function validateLesson(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!lessonForm.title.trim()) errs.title = "Lesson title is required";
    if (lessonForm.content_type === "video" && !lessonForm.video_url.trim()) errs.video_url = "Video URL is required";
    if (lessonForm.content_type === "video_text" && !lessonForm.video_url.trim()) errs.video_url = "Video URL is required";
    return errs;
  }

  function handleSaveLesson(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateLesson();
    setLessonErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const moduleId = lessonDialogOpen!;

    if (editingLesson) {
      // Update existing lesson
      setModules((prev) => prev.map((mod) => {
        if (mod.id !== moduleId) return mod;
        return {
          ...mod,
          lessons: mod.lessons.map((l) =>
            l.id === editingLesson.id
              ? { ...l, title: lessonForm.title, content_type: lessonForm.content_type, content_body: lessonForm.content_body || undefined, video_url: lessonForm.video_url || undefined, file_url: lessonForm.file_url || undefined, file_name: lessonForm.file_name || undefined }
              : l
          ),
        };
      }));
    } else {
      // Create new lesson
      const mod = modules.find((m) => m.id === moduleId);
      const newLesson: Lesson = {
        id: generateId("LSN"),
        title: lessonForm.title.trim(),
        content_type: lessonForm.content_type,
        sequence: (mod?.lessons.length ?? 0) + 1,
        content_body: lessonForm.content_body || undefined,
        video_url: lessonForm.video_url || undefined,
        file_url: lessonForm.file_url || undefined,
        file_name: lessonForm.file_name || undefined,
      };
      setModules((prev) => prev.map((m) => m.id === moduleId ? { ...m, lessons: [...m.lessons, newLesson] } : m));
    }

    setLessonDialogOpen(null);
    setEditingLesson(null);
  }

  function deleteLesson(moduleId: string, lessonId: string) {
    setModules((prev) => prev.map((m) =>
      m.id === moduleId ? { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) } : m
    ));
  }

  // ── File Upload ──

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setSaving(true);
    try {
      // In production, this calls POST /content/upload/presign then uploads to S3
      // For now, simulate with a local file reference
      const fakeUrl = `https://korefield-academy-dev-uploads.s3.amazonaws.com/content/${file.name}`;
      setLessonForm((f) => ({ ...f, file_url: fakeUrl, file_name: file.name }));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-heading-lg text-surface-900">Content Authoring</h1>
        <button onClick={openModuleDialog} className="rounded-lg bg-brand-600 px-4 py-2 text-body-sm font-medium text-white hover:bg-brand-700 transition-colors">
          Create Module
        </button>
      </div>
      <p className="text-body-sm text-surface-500">
        Create and manage modules, lessons, labs, and assessments. Click a module to expand and manage its lessons.
      </p>

      {/* Module list */}
      <div className="space-y-3">
        {modules.map((mod) => {
          const isExpanded = expanded === mod.id;
          return (
            <div key={mod.id} className="rounded-card border border-surface-200 bg-surface-0 shadow-card overflow-hidden">
              {/* Module header */}
              <button onClick={() => setExpanded(isExpanded ? null : mod.id)} className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-surface-50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-surface-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-surface-400 shrink-0" />}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-body-sm font-medium text-surface-900 truncate">{mod.title}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        mod.status === "Published" ? "bg-green-100 text-green-700" :
                        mod.status === "Draft" ? "bg-surface-100 text-surface-600" :
                        "bg-amber-100 text-amber-700"
                      }`}>{mod.status}</span>
                    </div>
                    <p className="text-caption text-surface-400">{mod.track} · {mod.level} · {mod.version} · {mod.lessons.length} lesson{mod.lessons.length !== 1 ? "s" : ""}</p>
                  </div>
                </div>
              </button>

              {/* Expanded: lesson list */}
              {isExpanded && (
                <div className="border-t border-surface-200">
                  {mod.lessons.length === 0 ? (
                    <div className="px-5 py-8 text-center">
                      <p className="text-body-sm text-surface-500">No lessons yet.</p>
                      <p className="text-caption text-surface-400 mt-1">Add your first lesson to this module.</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-surface-100">
                      {mod.lessons.map((lesson) => {
                        const Icon = contentTypeIcon(lesson.content_type);
                        return (
                          <li key={lesson.id} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-50 transition-colors group">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-100 shrink-0">
                              <Icon className="w-4 h-4 text-surface-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-body-sm text-surface-900 truncate">{lesson.title}</p>
                              <p className="text-caption text-surface-400">{CONTENT_TYPES.find((c) => c.value === lesson.content_type)?.label || lesson.content_type} · #{lesson.sequence}</p>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openEditLesson(lesson, mod.id)} className="p-1.5 rounded-lg text-surface-400 hover:text-brand-600 hover:bg-brand-50 transition-colors" aria-label="Edit lesson">
                                <FileText className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => deleteLesson(mod.id, lesson.id)} className="p-1.5 rounded-lg text-surface-400 hover:text-status-error hover:bg-red-50 transition-colors" aria-label="Delete lesson">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  <div className="px-5 py-3 border-t border-surface-100 bg-surface-50">
                    <button onClick={() => openLessonDialog(mod.id)} className="flex items-center gap-1.5 text-body-sm text-brand-600 hover:text-brand-700 font-medium transition-colors">
                      <Plus className="w-4 h-4" /> Add Lesson
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Create Module Dialog ── */}
      {moduleDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-surface-950/50" onClick={() => setModuleDialogOpen(false)} />
          <div className="relative w-full max-w-lg mx-4 max-h-[90vh] flex flex-col rounded-card border border-surface-200 bg-surface-0 shadow-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
              <h2 className="text-heading-sm text-surface-900">Create New Module</h2>
              <button onClick={() => setModuleDialogOpen(false)} className="p-1 rounded-lg text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-colors" aria-label="Close dialog"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateModule} className="px-6 py-5 space-y-4 overflow-y-auto">
              <div>
                <label htmlFor="mod-title" className="block text-body-sm font-medium text-surface-700 mb-1.5">Module Title <span className="text-status-error">*</span></label>
                <input id="mod-title" type="text" value={moduleForm.title} onChange={(e) => setModuleForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Introduction to Machine Learning" className="w-full rounded-lg border border-surface-300 px-3.5 py-2.5 text-body-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors" aria-invalid={!!moduleErrors.title} />
                {moduleErrors.title && <p className="mt-1 text-caption text-status-error">{moduleErrors.title}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="mod-track" className="block text-body-sm font-medium text-surface-700 mb-1.5">Track</label>
                  <select id="mod-track" value={moduleForm.track} onChange={(e) => setModuleForm((f) => ({ ...f, track: e.target.value }))} className="w-full rounded-lg border border-surface-300 px-3.5 py-2.5 text-body-sm text-surface-900 bg-surface-0 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors">
                    {TRACKS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="mod-level" className="block text-body-sm font-medium text-surface-700 mb-1.5">Level</label>
                  <select id="mod-level" value={moduleForm.level} onChange={(e) => setModuleForm((f) => ({ ...f, level: e.target.value }))} className="w-full rounded-lg border border-surface-300 px-3.5 py-2.5 text-body-sm text-surface-900 bg-surface-0 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors">
                    {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="mod-desc" className="block text-body-sm font-medium text-surface-700 mb-1.5">Description <span className="text-status-error">*</span></label>
                <textarea id="mod-desc" value={moduleForm.description} onChange={(e) => setModuleForm((f) => ({ ...f, description: e.target.value }))} placeholder="Brief description of what this module covers..." rows={3} className="w-full rounded-lg border border-surface-300 px-3.5 py-2.5 text-body-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors resize-none" aria-invalid={!!moduleErrors.description} />
                {moduleErrors.description && <p className="mt-1 text-caption text-status-error">{moduleErrors.description}</p>}
              </div>
              <div className="border-t border-surface-200 pt-4">
                <AssessmentBuilder questions={questions} onChange={setQuestions} />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModuleDialogOpen(false)} className="rounded-lg border border-surface-300 px-4 py-2.5 text-body-sm font-medium text-surface-700 hover:bg-surface-100 transition-colors">Cancel</button>
                <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2.5 text-body-sm font-medium text-white hover:bg-brand-700 transition-colors">Create Module</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Lesson Create/Edit Dialog ── */}
      {lessonDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-surface-950/50" onClick={() => { setLessonDialogOpen(null); setEditingLesson(null); }} />
          <div className="relative w-full max-w-lg mx-4 max-h-[90vh] flex flex-col rounded-card border border-surface-200 bg-surface-0 shadow-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
              <h2 className="text-heading-sm text-surface-900">{editingLesson ? "Edit Lesson" : "Add Lesson"}</h2>
              <button onClick={() => { setLessonDialogOpen(null); setEditingLesson(null); }} className="p-1 rounded-lg text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-colors" aria-label="Close dialog"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveLesson} className="px-6 py-5 space-y-4 overflow-y-auto">
              <div>
                <label htmlFor="lsn-title" className="block text-body-sm font-medium text-surface-700 mb-1.5">Lesson Title <span className="text-status-error">*</span></label>
                <input id="lsn-title" type="text" value={lessonForm.title} onChange={(e) => setLessonForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Introduction to Variables" className="w-full rounded-lg border border-surface-300 px-3.5 py-2.5 text-body-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors" aria-invalid={!!lessonErrors.title} />
                {lessonErrors.title && <p className="mt-1 text-caption text-status-error">{lessonErrors.title}</p>}
              </div>

              <div>
                <label className="block text-body-sm font-medium text-surface-700 mb-1.5">Content Type</label>
                <div className="grid grid-cols-6 gap-2">
                  {CONTENT_TYPES.map((ct) => {
                    const Icon = ct.icon;
                    const selected = lessonForm.content_type === ct.value;
                    return (
                      <button key={ct.value} type="button" onClick={() => setLessonForm((f) => ({ ...f, content_type: ct.value }))}
                        className={`flex flex-col items-center gap-1 rounded-lg border p-2.5 text-caption transition-all ${selected ? "border-brand-400 bg-brand-50 text-brand-700" : "border-surface-200 text-surface-500 hover:border-surface-300"}`}>
                        <Icon className="w-4 h-4" />
                        <span className="font-medium">{ct.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Content type specific fields */}
              {lessonForm.content_type === "text" && (
                <div>
                  <label htmlFor="lsn-body" className="block text-body-sm font-medium text-surface-700 mb-1.5">Content Body</label>
                  <textarea id="lsn-body" value={lessonForm.content_body} onChange={(e) => setLessonForm((f) => ({ ...f, content_body: e.target.value }))} placeholder="Write lesson content in markdown..." rows={8} className="w-full rounded-lg border border-surface-300 px-3.5 py-2.5 text-body-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors resize-none font-mono" />
                </div>
              )}

              {lessonForm.content_type === "video" && (
                <div>
                  <label htmlFor="lsn-video" className="block text-body-sm font-medium text-surface-700 mb-1.5">Cloudflare Stream URL <span className="text-status-error">*</span></label>
                  <input id="lsn-video" type="url" value={lessonForm.video_url} onChange={(e) => setLessonForm((f) => ({ ...f, video_url: e.target.value }))} placeholder="https://stream.cloudflare.com/..." className="w-full rounded-lg border border-surface-300 px-3.5 py-2.5 text-body-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors" aria-invalid={!!lessonErrors.video_url} />
                  {lessonErrors.video_url && <p className="mt-1 text-caption text-status-error">{lessonErrors.video_url}</p>}
                  <p className="mt-1 text-caption text-surface-400">Videos are hosted on Cloudflare Stream. Paste the stream URL here.</p>
                </div>
              )}

              {lessonForm.content_type === "video_text" && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="lsn-vt-video" className="block text-body-sm font-medium text-surface-700 mb-1.5">Cloudflare Stream URL <span className="text-status-error">*</span></label>
                    <input id="lsn-vt-video" type="url" value={lessonForm.video_url} onChange={(e) => setLessonForm((f) => ({ ...f, video_url: e.target.value }))} placeholder="https://stream.cloudflare.com/..." className="w-full rounded-lg border border-surface-300 px-3.5 py-2.5 text-body-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors" aria-invalid={!!lessonErrors.video_url} />
                    {lessonErrors.video_url && <p className="mt-1 text-caption text-status-error">{lessonErrors.video_url}</p>}
                    <p className="mt-1 text-caption text-surface-400">Videos are hosted on Cloudflare Stream. Paste the stream URL here.</p>
                  </div>
                  <div>
                    <label htmlFor="lsn-vt-body" className="block text-body-sm font-medium text-surface-700 mb-1.5">Text Content</label>
                    <textarea id="lsn-vt-body" value={lessonForm.content_body} onChange={(e) => setLessonForm((f) => ({ ...f, content_body: e.target.value }))} placeholder="Write accompanying text content in markdown..." rows={6} className="w-full rounded-lg border border-surface-300 px-3.5 py-2.5 text-body-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors resize-none font-mono" />
                  </div>
                </div>
              )}

              {lessonForm.content_type === "downloadable" && (
                <div>
                  <label className="block text-body-sm font-medium text-surface-700 mb-1.5">Upload File</label>
                  {lessonForm.file_name ? (
                    <div className="flex items-center gap-3 rounded-lg border border-surface-200 bg-surface-50 p-3">
                      <Download className="w-5 h-5 text-brand-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-body-sm font-medium text-surface-900 truncate">{lessonForm.file_name}</p>
                      </div>
                      <button type="button" onClick={() => setLessonForm((f) => ({ ...f, file_url: "", file_name: "" }))} className="text-caption text-surface-400 hover:text-status-error transition-colors">Remove</button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-surface-300 p-6 cursor-pointer hover:border-brand-400 hover:bg-brand-50/30 transition-all">
                      <Download className="w-6 h-6 text-surface-400" />
                      <span className="text-body-sm text-surface-600">Click to upload a file</span>
                      <span className="text-caption text-surface-400">PDF, DOCX, PPTX, ZIP (max 50MB)</span>
                      <input type="file" className="hidden" accept=".pdf,.doc,.docx,.pptx,.zip,.png,.jpg,.jpeg" onChange={handleFileUpload} />
                    </label>
                  )}
                </div>
              )}

              {lessonForm.content_type === "interactive_code" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-body-sm font-medium text-surface-700 mb-1.5">Language</label>
                    <select value={lessonForm.language} onChange={(e) => setLessonForm((f) => ({ ...f, language: e.target.value }))} className="w-full rounded-lg border border-surface-300 px-3.5 py-2.5 text-body-sm text-surface-900 bg-surface-0 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors">
                      <option value="python">Python</option>
                      <option value="javascript">JavaScript</option>
                      <option value="sql">SQL</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-body-sm font-medium text-surface-700 mb-1.5">Starter Code</label>
                    <textarea value={lessonForm.starterCode} onChange={(e) => setLessonForm((f) => ({ ...f, starterCode: e.target.value }))} rows={6} placeholder="# Write the starter code learners will see..." className="w-full rounded-lg border border-surface-300 px-3.5 py-2.5 font-mono text-caption text-surface-900 bg-surface-950 text-accent-400 placeholder:text-surface-600 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none" />
                  </div>
                  <div>
                    <label className="block text-body-sm font-medium text-surface-700 mb-1.5">Test Cases</label>
                    <textarea value={lessonForm.testCases} onChange={(e) => setLessonForm((f) => ({ ...f, testCases: e.target.value }))} rows={4} placeholder="assert greet('World') == 'Hello, World!'" className="w-full rounded-lg border border-surface-300 px-3.5 py-2.5 font-mono text-caption text-surface-900 bg-surface-950 text-accent-400 placeholder:text-surface-600 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none" />
                  </div>
                </div>
              )}

              {lessonForm.content_type === "quiz" && (
                <div className="border-t border-surface-200 pt-4">
                  <p className="text-body-sm text-surface-500 mb-3">Build quiz questions below. Supports Multiple Choice, Coding Exercise, and Drag & Drop matching.</p>
                  <AssessmentBuilder questions={lessonQuestions} onChange={setLessonQuestions} />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setLessonDialogOpen(null); setEditingLesson(null); }} className="rounded-lg border border-surface-300 px-4 py-2.5 text-body-sm font-medium text-surface-700 hover:bg-surface-100 transition-colors">Cancel</button>
                <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2.5 text-body-sm font-medium text-white hover:bg-brand-700 transition-colors flex items-center gap-2">
                  <Save className="w-4 h-4" /> {editingLesson ? "Update Lesson" : "Add Lesson"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
