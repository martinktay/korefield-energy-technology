"use client";
/** @file admin/curriculum/page.tsx — Curriculum management page for tracks, levels, and module administration. */

import { useState } from "react";
import { X, Pencil, Trash2, Plus, Info, ChevronDown } from "lucide-react";
import { useContentStore } from "@/stores/content-store";
import { CustomSelect } from "@/components/ui/custom-select";
import { useToastStore } from "@/components/ui/toast";

export default function CurriculumPage() {
  const store = useContentStore();
  const storeTracks = store.getTracks();
  const trackNames = store.getTrackNames();

  // Local state for availability and gate threshold overrides (admin-specific concerns)
  const [availabilityOverrides, setAvailabilityOverrides] = useState<Record<string, boolean>>({});
  const [gateOverrides, setGateOverrides] = useState<Record<string, number>>({});

  // Merge store data with local overrides
  const tracks = storeTracks.map((t) => ({
    ...t,
    available: availabilityOverrides[t.id] ?? t.available,
    gateThreshold: gateOverrides[t.id] ?? t.gateThreshold,
  }));

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", track: trackNames[0] ?? "", level: "Beginner" as string, gateThreshold: "70", description: "", defaultLessonType: "video_text" as string });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [annotations, setAnnotations] = useState<Record<string, string>>({});
  const [editingAnnotation, setEditingAnnotation] = useState<string | null>(null);
  const [editAnnotationValue, setEditAnnotationValue] = useState("");
  const [addingAnnotation, setAddingAnnotation] = useState<string | null>(null);
  const [addAnnotationValue, setAddAnnotationValue] = useState("");

  function openDialog() {
    setForm({ title: "", track: trackNames[0] ?? "", level: "Beginner", gateThreshold: "70", description: "", defaultLessonType: "video_text" });
    setErrors({});
    setDialogOpen(true);
  }

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = "Module title is required";
    const threshold = parseInt(form.gateThreshold, 10);
    if (isNaN(threshold) || threshold < 1 || threshold > 100) errs.gateThreshold = "Threshold must be 1–100";
    return errs;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    store.addModule(
      form.track,
      form.level,
      form.title.trim(),
    );
    setDialogOpen(false);
    useToastStore.getState().addToast("Module created successfully");
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-heading-lg text-surface-900">Curriculum Controls</h1>
        <button
          className="rounded-lg bg-brand-600 px-4 py-2 text-body-sm text-white hover:bg-brand-700 transition-colors"
          onClick={openDialog}
        >
          Create Module
        </button>
      </div>
      <p className="text-body-sm text-surface-500">
        Manage track availability, module sequencing, performance gate thresholds, and content publishing status.
      </p>

      <div className="rounded-card border border-surface-200 bg-surface-0 shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-body-sm">
            <thead className="border-b border-surface-200 bg-surface-50">
              <tr>
                <th className="px-4 py-3 text-surface-600 font-medium">Track</th>
                <th className="px-4 py-3 text-surface-600 font-medium">Modules</th>
                <th className="px-4 py-3 text-surface-600 font-medium">Gate Threshold</th>
                <th className="px-4 py-3 text-surface-600 font-medium">Available</th>
                <th className="px-4 py-3 text-surface-600 font-medium">Annotations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200">
              {tracks.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-3 text-surface-900">{t.name}</td>
                  <td className="px-4 py-3 text-surface-700">{t.modules}</td>
                  <td className="px-4 py-3 text-surface-700">{t.gateThreshold}%</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-caption ${
                      t.available ? "bg-green-100 text-green-700" : "bg-surface-100 text-surface-600"
                    }`}>
                      {t.available ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {addingAnnotation === t.id ? (
                      <div className="flex gap-2 items-center">
                        <input type="text" value={addAnnotationValue} onChange={(e) => setAddAnnotationValue(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { const v = addAnnotationValue.trim(); if (v) { setAnnotations((p) => ({ ...p, [t.id]: v })); } setAddingAnnotation(null); setAddAnnotationValue(""); } }} className="flex-1 rounded-lg border border-brand-300 bg-white px-3 py-1.5 text-body-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20" autoFocus placeholder="Enter annotation..." />
                        <button onClick={() => { const v = addAnnotationValue.trim(); if (v) { setAnnotations((p) => ({ ...p, [t.id]: v })); } setAddingAnnotation(null); setAddAnnotationValue(""); }} className="rounded-lg bg-brand-600 px-3 py-1.5 text-caption font-medium text-white hover:bg-brand-700 transition-all">Save</button>
                        <button onClick={() => { setAddingAnnotation(null); setAddAnnotationValue(""); }} className="rounded-lg border border-surface-200 px-3 py-1.5 text-caption text-surface-500 hover:bg-surface-100 transition-all">Cancel</button>
                      </div>
                    ) : editingAnnotation === t.id ? (
                      <div className="flex gap-2 items-center">
                        <input type="text" value={editAnnotationValue} onChange={(e) => setEditAnnotationValue(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { const v = editAnnotationValue.trim(); if (v) { setAnnotations((p) => ({ ...p, [t.id]: v })); } setEditingAnnotation(null); setEditAnnotationValue(""); } }} className="flex-1 rounded-lg border border-brand-300 bg-white px-3 py-1.5 text-body-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20" autoFocus />
                        <button onClick={() => { const v = editAnnotationValue.trim(); if (v) { setAnnotations((p) => ({ ...p, [t.id]: v })); } setEditingAnnotation(null); setEditAnnotationValue(""); }} className="rounded-lg bg-brand-600 px-3 py-1.5 text-caption font-medium text-white hover:bg-brand-700 transition-all">Save</button>
                        <button onClick={() => { setEditingAnnotation(null); setEditAnnotationValue(""); }} className="rounded-lg border border-surface-200 px-3 py-1.5 text-caption text-surface-500 hover:bg-surface-100 transition-all">Cancel</button>
                      </div>
                    ) : annotations[t.id] ? (
                      <div className="flex items-start gap-2 group">
                        <p className="flex-1 text-body-sm text-surface-600">{annotations[t.id]}</p>
                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingAnnotation(t.id); setEditAnnotationValue(annotations[t.id]); }} className="rounded-md p-1 text-surface-400 hover:text-brand-600 hover:bg-brand-50 transition-all" aria-label="Edit annotation"><Pencil className="h-3.5 w-3.5" /></button>
                          <button onClick={() => setAnnotations((p) => { const n = { ...p }; delete n[t.id]; return n; })} className="rounded-md p-1 text-surface-400 hover:text-red-600 hover:bg-red-50 transition-all" aria-label="Delete annotation"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => { setAddingAnnotation(t.id); setAddAnnotationValue(""); }} className="text-body-sm text-brand-600 hover:text-brand-700 font-medium transition-colors">Add Note</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Create Module Dialog ── */}
      {dialogOpen && (
        <>
          <div className="fixed inset-0 z-[59]" onClick={() => setDialogOpen(false)} aria-hidden="true" />
          <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[10vh]">
            <div className="relative w-full max-w-lg mx-4 rounded-2xl border border-surface-200 bg-surface-0 shadow-2xl animate-in fade-in zoom-in-95 duration-200" role="dialog" aria-modal="true" aria-labelledby="create-module-title">
              <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
                <div>
                  <h2 id="create-module-title" className="text-heading-sm text-surface-900">Create New Module</h2>
                  <p className="text-caption text-surface-400 mt-0.5">Add a module to an existing track pathway</p>
                </div>
                <button onClick={() => setDialogOpen(false)} className="p-1.5 rounded-lg text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-colors" aria-label="Close dialog">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                <div>
                  <label htmlFor="mod-title" className="block text-body-sm font-medium text-surface-700 mb-1.5">Module Title <span className="text-status-error">*</span></label>
                  <input id="mod-title" type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Advanced RAG Pipelines" className="w-full rounded-xl border border-surface-200 px-3.5 py-2.5 text-body-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all" aria-invalid={!!errors.title} autoFocus />
                  {errors.title && <p className="mt-1 text-caption text-status-error">{errors.title}</p>}
                </div>

                <div>
                  <label htmlFor="mod-desc" className="block text-body-sm font-medium text-surface-700 mb-1.5">Description <span className="text-caption text-surface-400 font-normal">(optional)</span></label>
                  <textarea id="mod-desc" rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Brief description of what learners will cover in this module" className="w-full rounded-xl border border-surface-200 px-3.5 py-2.5 text-body-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all resize-none" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="mod-track" className="block text-body-sm font-medium text-surface-700 mb-1.5">Track</label>
                    <CustomSelect id="mod-track" value={form.track} onChange={(v) => setForm((f) => ({ ...f, track: v }))} options={trackNames.map((t) => ({ value: t, label: t }))} />
                  </div>
                  <div>
                    <label htmlFor="mod-level" className="block text-body-sm font-medium text-surface-700 mb-1.5">Level Tier</label>
                    <CustomSelect id="mod-level" value={form.level} onChange={(v) => setForm((f) => ({ ...f, level: v }))} options={[{ value: "Beginner", label: "Beginner" }, { value: "Intermediate", label: "Intermediate" }, { value: "Advanced", label: "Advanced" }]} />
                  </div>
                </div>

                <div>
                  <label htmlFor="mod-content-type" className="block text-body-sm font-medium text-surface-700 mb-1.5">Default Content Type</label>
                  <CustomSelect id="mod-content-type" value={form.defaultLessonType} onChange={(v) => setForm((f) => ({ ...f, defaultLessonType: v }))} options={[{ value: "video_text", label: "Video + Text" }, { value: "coding_lab", label: "Coding Lab" }, { value: "mcq", label: "Multiple Choice Quiz" }, { value: "drag_drop", label: "Drag & Drop" }, { value: "quiz", label: "Mixed Quiz" }]} />
                  <p className="mt-1 text-caption text-surface-400">Lessons added to this module will default to this type</p>
                </div>

                <div>
                  <label htmlFor="mod-gate" className="block text-body-sm font-medium text-surface-700 mb-1.5">Performance Gate Threshold <span className="text-status-error">*</span></label>
                  <div className="flex items-center gap-3">
                    <input id="mod-gate" type="range" min={1} max={100} value={form.gateThreshold} onChange={(e) => setForm((f) => ({ ...f, gateThreshold: e.target.value }))} className="flex-1 h-2 rounded-full appearance-none bg-surface-200 accent-brand-600 cursor-pointer" />
                    <span className="w-12 text-center text-body-sm font-semibold text-surface-900 tabular-nums">{form.gateThreshold}%</span>
                  </div>
                  {errors.gateThreshold && <p className="mt-1 text-caption text-status-error">{errors.gateThreshold}</p>}
                  <p className="mt-1 text-caption text-surface-400">Minimum score learners must achieve to pass this module&apos;s performance gate</p>
                </div>

                <div className="flex items-start gap-2.5 rounded-xl border border-brand-200 bg-brand-50/50 p-3">
                  <Info className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
                  <p className="text-caption text-brand-700">New modules are created as unpublished drafts. Add lessons and activate from the curriculum table when ready.</p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-100">
                  <button type="button" onClick={() => setDialogOpen(false)} className="rounded-xl border border-surface-200 px-4 py-2.5 text-body-sm font-medium text-surface-700 hover:bg-surface-50 transition-colors">Cancel</button>
                  <button type="submit" className="rounded-xl bg-brand-600 px-5 py-2.5 text-body-sm font-medium text-white hover:bg-brand-700 active:bg-brand-800 transition-colors flex items-center gap-2 shadow-sm">
                    <Plus className="w-4 h-4" /> Create Module
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
