/** @file instructor/content/page.tsx — Content management page for modules with create dialog, versioning, and publish status. */
"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { AssessmentBuilder, type Question } from "@/components/content";

interface Module {
  id: string;
  title: string;
  track: string;
  level: string;
  version: string;
  status: string;
  lessons: number;
  description: string;
}

const INITIAL_MODULES: Module[] = [
  { id: "MOD-001", title: "Introduction to AI Systems", track: "AI Engineering", level: "Beginner", version: "v2.1", status: "Published", lessons: 8, description: "Foundational concepts of AI systems architecture." },
  { id: "MOD-002", title: "Data Pipeline Fundamentals", track: "Data Science", level: "Beginner", version: "v1.3", status: "Draft", lessons: 6, description: "Building reliable data pipelines for analytics." },
  { id: "MOD-003", title: "Neural Network Architecture", track: "AI Engineering", level: "Intermediate", version: "v1.0", status: "In Review", lessons: 10, description: "Deep dive into neural network design patterns." },
];

const TRACKS = [
  "AI Engineering and Intelligent Systems",
  "Data Science and Decision Intelligence",
  "Cybersecurity and AI Security",
  "AI Product and Project Leadership",
];

const LEVELS = ["Beginner", "Intermediate", "Advanced"];

function generateModuleId(): string {
  return `MOD-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

export default function ContentPage() {
  const [modules, setModules] = useState<Module[]>(INITIAL_MODULES);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    track: TRACKS[0],
    level: LEVELS[0],
    description: "",
    lessons: "",
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function openDialog() {
    setForm({ title: "", track: TRACKS[0], level: LEVELS[0], description: "", lessons: "" });
    setQuestions([]);
    setErrors({});
    setDialogOpen(true);
  }

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = "Module title is required";
    if (form.title.trim().length < 5) errs.title = "Title must be at least 5 characters";
    if (!form.description.trim()) errs.description = "Description is required";
    const lessonCount = parseInt(form.lessons, 10);
    if (!form.lessons || isNaN(lessonCount) || lessonCount < 1) errs.lessons = "Enter a valid number of lessons (1+)";
    return errs;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const newModule: Module = {
      id: generateModuleId(),
      title: form.title.trim(),
      track: form.track.split(" and ")[0].split(" ")[0], // Short name
      level: form.level,
      version: "v1.0",
      status: "Draft",
      lessons: parseInt(form.lessons, 10),
      description: form.description.trim(),
    };

    setModules((prev) => [newModule, ...prev]);
    setDialogOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-heading-lg text-surface-900">Content Authoring</h1>
        <button
          onClick={openDialog}
          className="rounded-lg bg-brand-600 px-4 py-2 text-body-sm font-medium text-white hover:bg-brand-700 transition-colors"
        >
          Create Module
        </button>
      </div>
      <p className="text-body-sm text-surface-500">
        Create and manage modules, lessons, labs, and assessments. Supports text, video, interactive code exercises, quizzes, and downloadable resources.
      </p>

      {/* Module table */}
      <div className="rounded-card border border-surface-200 bg-surface-0 shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-body-sm">
            <thead className="border-b border-surface-200 bg-surface-50">
              <tr>
                <th className="px-4 py-3 text-surface-600 font-medium">Module</th>
                <th className="px-4 py-3 text-surface-600 font-medium">Track</th>
                <th className="px-4 py-3 text-surface-600 font-medium">Level</th>
                <th className="px-4 py-3 text-surface-600 font-medium">Lessons</th>
                <th className="px-4 py-3 text-surface-600 font-medium">Version</th>
                <th className="px-4 py-3 text-surface-600 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200">
              {modules.map((mod) => (
                <tr key={mod.id} className="hover:bg-surface-50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-surface-900 font-medium">{mod.title}</p>
                      <p className="text-caption text-surface-400">{mod.id}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-surface-700">{mod.track}</td>
                  <td className="px-4 py-3 text-surface-700">{mod.level}</td>
                  <td className="px-4 py-3 text-surface-700">{mod.lessons}</td>
                  <td className="px-4 py-3 text-surface-500">{mod.version}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-caption ${
                      mod.status === "Published" ? "bg-green-100 text-green-700" :
                      mod.status === "Draft" ? "bg-surface-100 text-surface-600" :
                      "bg-amber-100 text-amber-700"
                    }`}>
                      {mod.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Create Module Dialog ── */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-surface-950/50" onClick={() => setDialogOpen(false)} />
          <div className="relative w-full max-w-lg mx-4 max-h-[90vh] flex flex-col rounded-card border border-surface-200 bg-surface-0 shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
              <h2 className="text-heading-sm text-surface-900">Create New Module</h2>
              <button onClick={() => setDialogOpen(false)} className="p-1 rounded-lg text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-colors" aria-label="Close dialog">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 overflow-y-auto">
              {/* Title */}
              <div>
                <label htmlFor="mod-title" className="block text-body-sm font-medium text-surface-700 mb-1.5">
                  Module Title <span className="text-status-error">*</span>
                </label>
                <input
                  id="mod-title"
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Introduction to Machine Learning"
                  className="w-full rounded-lg border border-surface-300 px-3.5 py-2.5 text-body-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors"
                  aria-invalid={!!errors.title}
                />
                {errors.title && <p className="mt-1 text-caption text-status-error">{errors.title}</p>}
              </div>

              {/* Track + Level row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="mod-track" className="block text-body-sm font-medium text-surface-700 mb-1.5">Track</label>
                  <select
                    id="mod-track"
                    value={form.track}
                    onChange={(e) => setForm((f) => ({ ...f, track: e.target.value }))}
                    className="w-full rounded-lg border border-surface-300 px-3.5 py-2.5 text-body-sm text-surface-900 bg-surface-0 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors"
                  >
                    {TRACKS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="mod-level" className="block text-body-sm font-medium text-surface-700 mb-1.5">Level</label>
                  <select
                    id="mod-level"
                    value={form.level}
                    onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
                    className="w-full rounded-lg border border-surface-300 px-3.5 py-2.5 text-body-sm text-surface-900 bg-surface-0 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors"
                  >
                    {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="mod-desc" className="block text-body-sm font-medium text-surface-700 mb-1.5">
                  Description <span className="text-status-error">*</span>
                </label>
                <textarea
                  id="mod-desc"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description of what this module covers..."
                  rows={3}
                  className="w-full rounded-lg border border-surface-300 px-3.5 py-2.5 text-body-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors resize-none"
                  aria-invalid={!!errors.description}
                />
                {errors.description && <p className="mt-1 text-caption text-status-error">{errors.description}</p>}
              </div>

              {/* Planned lessons */}
              <div>
                <label htmlFor="mod-lessons" className="block text-body-sm font-medium text-surface-700 mb-1.5">
                  Planned Lessons <span className="text-status-error">*</span>
                </label>
                <input
                  id="mod-lessons"
                  type="number"
                  min={1}
                  max={50}
                  value={form.lessons}
                  onChange={(e) => setForm((f) => ({ ...f, lessons: e.target.value }))}
                  placeholder="e.g. 8"
                  className="w-full rounded-lg border border-surface-300 px-3.5 py-2.5 text-body-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors"
                  aria-invalid={!!errors.lessons}
                />
                {errors.lessons && <p className="mt-1 text-caption text-status-error">{errors.lessons}</p>}
              </div>

              {/* Assessment Questions */}
              <div className="border-t border-surface-200 pt-4">
                <AssessmentBuilder questions={questions} onChange={setQuestions} />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDialogOpen(false)}
                  className="rounded-lg border border-surface-300 px-4 py-2.5 text-body-sm font-medium text-surface-700 hover:bg-surface-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-brand-600 px-4 py-2.5 text-body-sm font-medium text-white hover:bg-brand-700 transition-colors"
                >
                  Create Module
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
