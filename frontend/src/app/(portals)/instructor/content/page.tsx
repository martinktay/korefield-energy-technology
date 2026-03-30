"use client";
/** @file instructor/content/page.tsx — Content authoring: modules with expandable lesson lists, lesson CRUD, file upload. */

import { useState, useRef, useEffect } from "react";
import { X, Plus, ChevronDown, ChevronRight, Trash2, FileText, Video, FileVideo, Code, HelpCircle, Download, Save, Loader2, AlertCircle } from "lucide-react";
import { AssessmentBuilder, type Question } from "@/components/content";
import { useContentStore } from "@/stores/content-store";
import type { LessonSummary, ModuleView } from "@/stores/content-store";
import { uploadFile, type UploadProgress, NetworkError, TimeoutError } from "@/lib/api";

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

function contentTypeIcon(type: string) {
  const ct = CONTENT_TYPES.find((c) => c.value === type);
  if (!ct) return FileText;
  return ct.icon;
}

export default function ContentPage() {
  const store = useContentStore();

  // Track filter state — empty string means "All Tracks"
  const [selectedTrack, setSelectedTrack] = useState("");
  const trackNames = store.getTrackNames();
  const modules: ModuleView[] = selectedTrack
    ? store.getModulesForTrack(selectedTrack)
    : store.getAllModules();

  const [expanded, setExpanded] = useState<string | null>(null);
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [lessonDialogOpen, setLessonDialogOpen] = useState<string | null>(null); // module id
  const [editingLesson, setEditingLesson] = useState<LessonSummary | null>(null);

  // Refs for scrolling dialogs into view
  const moduleDialogRef = useRef<HTMLDivElement>(null);
  const lessonDialogRef = useRef<HTMLDivElement>(null);

  // Scroll dialog into view when opened
  useEffect(() => {
    if (moduleDialogOpen && moduleDialogRef.current) {
      moduleDialogRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [moduleDialogOpen]);

  useEffect(() => {
    if (lessonDialogOpen && lessonDialogRef.current) {
      lessonDialogRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [lessonDialogOpen]);

  const [moduleForm, setModuleForm] = useState({ title: "", track: TRACKS[0], level: LEVELS[0], description: "", lessons: "" });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [moduleErrors, setModuleErrors] = useState<Record<string, string>>({});

  const [lessonForm, setLessonForm] = useState({ title: "", content_type: "text", content_body: "", video_url: "", file_url: "", file_name: "", starterCode: "", testCases: "", language: "python" });
  const [lessonErrors, setLessonErrors] = useState<Record<string, string>>({});
  const [lessonQuestions, setLessonQuestions] = useState<Question[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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

    store.addModule(moduleForm.track, moduleForm.level, moduleForm.title.trim());
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

  function openEditLesson(lesson: LessonSummary, moduleId: string) {
    // Retrieve the full lesson from the store for pre-populating the form
    const full = store.getLessonById(lesson.id);
    setLessonForm({
      title: lesson.title,
      content_type: lesson.lessonType,
      content_body: full?.content?.map((s) => s.text).join("\n") ?? "",
      video_url: "",
      file_url: "",
      file_name: "",
      starterCode: full?.starterCode ?? "",
      testCases: "",
      language: full?.language ?? "python",
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
      // Update existing lesson via store
      store.updateLesson(editingLesson.id, {
        title: lessonForm.title.trim(),
        lessonType: lessonForm.content_type as "video_text" | "coding_lab" | "mcq" | "drag_drop",
      });
    } else {
      // Find the module to get trackName and levelTier
      const mod = modules.find((m) => m.id === moduleId);
      if (!mod) return;

      store.addLesson({
        moduleId,
        moduleName: mod.name,
        trackName: mod.trackName,
        levelTier: mod.levelTier,
        title: lessonForm.title.trim(),
        lessonType: lessonForm.content_type as "video_text" | "coding_lab" | "mcq" | "drag_drop",
        duration: "15 min",
        objectives: [],
        content: [],
        reviewQuestions: [],
        deliverable: "",
      });
    }

    setLessonDialogOpen(null);
    setEditingLesson(null);
  }

  function handleDeleteLesson(lessonId: string) {
    store.deleteLesson(lessonId);
  }

  // ── File Upload ──

  const MAX_FILE_SIZE_MB = 50;

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setUploadError(`File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadProgress(null);

    try {
      const result = await uploadFile(file, (progress) => {
        setUploadProgress(progress);
      });
      setLessonForm((f) => ({ ...f, file_url: result.file_url, file_name: file.name }));
    } catch (err) {
      if (err instanceof NetworkError) {
        setUploadError("Upload failed — check your internet connection and try again.");
      } else if (err instanceof TimeoutError) {
        setUploadError("Upload timed out. Try a smaller file or check your connection.");
      } else {
        setUploadError(err instanceof Error ? err.message : "Upload failed. Please try again.");
      }
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-heading-lg text-surface-900">Content Authoring</h1>
        <div className="flex items-center gap-3">
          <select
            value={selectedTrack}
            onChange={(e) => setSelectedTrack(e.target.value)}
            className="rounded-lg border border-surface-300 px-3.5 py-2 text-body-sm text-surface-900 bg-surface-0 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors"
            aria-label="Filter by track"
          >
            <option value="">All Tracks</option>
            {trackNames.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <button onClick={openModuleDialog} className="rounded-lg bg-brand-600 px-4 py-2 text-body-sm font-medium text-white hover:bg-brand-700 transition-colors">
            Create Module
          </button>
        </div>
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
                      <p className="text-body-sm font-medium text-surface-900 truncate">{mod.name}</p>
                    </div>
                    <p className="text-caption text-surface-400">{mod.trackName} · {mod.levelTier} · {mod.lessonCount} lesson{mod.lessonCount !== 1 ? "s" : ""}</p>
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
                        const Icon = contentTypeIcon(lesson.lessonType);
                        return (
                          <li key={lesson.id} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-50 transition-colors group">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-100 shrink-0">
                              <Icon className="w-4 h-4 text-surface-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-body-sm text-surface-900 truncate">{lesson.title}</p>
                              <p className="text-caption text-surface-400">{CONTENT_TYPES.find((c) => c.value === lesson.lessonType)?.label || lesson.lessonType} · #{lesson.sequence}</p>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openEditLesson(lesson, mod.id)} className="p-1.5 rounded-lg text-surface-400 hover:text-brand-600 hover:bg-brand-50 transition-colors" aria-label="Edit lesson">
                                <FileText className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleDeleteLesson(lesson.id)} className="p-1.5 rounded-lg text-surface-400 hover:text-status-error hover:bg-red-50 transition-colors" aria-label="Delete lesson">
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto py-6">
          <div ref={moduleDialogRef} className="relative w-full max-w-3xl mx-4 rounded-card border border-surface-200 border-t-4 border-t-brand-600 bg-surface-0 shadow-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-surface-200 bg-surface-0 rounded-t-card">
              <h2 className="text-heading-sm text-surface-900">Create New Module</h2>
              <button onClick={() => setModuleDialogOpen(false)} className="p-1 rounded-lg text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-colors" aria-label="Close dialog"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateModule} className="px-6 py-5 space-y-5">
              <div>
                <label htmlFor="mod-title" className="block text-body-sm font-medium text-surface-700 mb-1.5">Module Title <span className="text-status-error">*</span></label>
                <input id="mod-title" type="text" value={moduleForm.title} onChange={(e) => setModuleForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Introduction to Machine Learning" className="w-full rounded-lg border border-surface-300 px-3.5 py-2.5 text-body-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors" aria-invalid={!!moduleErrors.title} />
                {moduleErrors.title && <p className="mt-1 text-caption text-status-error">{moduleErrors.title}</p>}
              </div>

              <div className="border-t border-surface-100 pt-4">
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
              </div>

              <div className="border-t border-surface-100 pt-4">
                <label htmlFor="mod-desc" className="block text-body-sm font-medium text-surface-700 mb-1.5">Description <span className="text-status-error">*</span></label>
                <textarea id="mod-desc" value={moduleForm.description} onChange={(e) => setModuleForm((f) => ({ ...f, description: e.target.value }))} placeholder="Brief description of what this module covers..." rows={3} className="w-full rounded-lg border border-surface-300 px-3.5 py-2.5 text-body-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors resize-none" aria-invalid={!!moduleErrors.description} />
                {moduleErrors.description && <p className="mt-1 text-caption text-status-error">{moduleErrors.description}</p>}
                <p className="mt-1.5 text-caption text-surface-400">Describe what learners will achieve in this module</p>
              </div>

              <div className="border-t border-surface-100 pt-4">
                <div className="bg-surface-50 rounded-lg p-4">
                  <h3 className="text-body-sm font-medium text-surface-700 mb-3">Assessment Questions (Optional)</h3>
                  <AssessmentBuilder questions={questions} onChange={setQuestions} />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-100">
                <button type="button" onClick={() => setModuleDialogOpen(false)} className="rounded-lg border border-surface-300 px-4 py-2.5 text-body-sm font-medium text-surface-700 hover:bg-surface-100 transition-colors">Cancel</button>
                <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2.5 text-body-sm font-medium text-white hover:bg-brand-700 transition-colors flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Create Module
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Lesson Create/Edit Dialog ── */}
      {lessonDialogOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto py-6">
          <div ref={lessonDialogRef} className="relative w-full max-w-3xl mx-4 rounded-card border border-surface-200 bg-surface-0 shadow-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-surface-200 bg-surface-0 rounded-t-card">
              <h2 className="text-heading-sm text-surface-900">{editingLesson ? "Edit Lesson" : "Add Lesson"}</h2>
              <button onClick={() => { setLessonDialogOpen(null); setEditingLesson(null); }} className="p-1 rounded-lg text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-colors" aria-label="Close dialog"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveLesson} className="px-6 py-5 space-y-4">
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
                  ) : uploading ? (
                    <div className="rounded-lg border-2 border-brand-300 bg-brand-50/30 p-6">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
                        <span className="text-body-sm text-brand-700">Uploading...</span>
                        {uploadProgress && (
                          <div className="w-full max-w-xs">
                            <div className="h-2 w-full rounded-full bg-surface-200 overflow-hidden">
                              <div className="h-2 rounded-full bg-brand-500 transition-all duration-300" style={{ width: `${uploadProgress.percent}%` }} />
                            </div>
                            <p className="text-caption text-surface-500 text-center mt-1">{uploadProgress.percent}%</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-surface-300 p-6 cursor-pointer hover:border-brand-400 hover:bg-brand-50/30 transition-all">
                      <Download className="w-6 h-6 text-surface-400" />
                      <span className="text-body-sm text-surface-600">Click to upload a file</span>
                      <span className="text-caption text-surface-400">PDF, DOCX, PPTX, ZIP (max {MAX_FILE_SIZE_MB}MB)</span>
                      <input type="file" className="hidden" accept=".pdf,.doc,.docx,.pptx,.zip,.png,.jpg,.jpeg" onChange={handleFileUpload} />
                    </label>
                  )}
                  {uploadError && (
                    <div className="mt-2 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
                      <AlertCircle className="w-4 h-4 text-status-error shrink-0 mt-0.5" />
                      <p className="text-caption text-red-700">{uploadError}</p>
                    </div>
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
