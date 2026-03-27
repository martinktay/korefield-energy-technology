/** @file admin/curriculum/page.tsx — Curriculum management page for tracks, levels, and module administration. */
"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface TrackRow {
  id: string; name: string; modules: number; available: boolean; gateThreshold: number;
}

const INITIAL_TRACKS: TrackRow[] = [
  { id: "TRK-ai-eng-001", name: "AI Engineering and Intelligent Systems", modules: 18, available: true, gateThreshold: 70 },
  { id: "TRK-ds-001", name: "Data Science and Decision Intelligence", modules: 18, available: true, gateThreshold: 70 },
  { id: "TRK-cyber-001", name: "Cybersecurity and AI Security", modules: 18, available: true, gateThreshold: 70 },
  { id: "TRK-prod-001", name: "AI Product and Project Leadership", modules: 18, available: false, gateThreshold: 65 },
];

const TRACK_NAMES = [
  "AI Engineering and Intelligent Systems",
  "Data Science and Decision Intelligence",
  "Cybersecurity and AI Security",
  "AI Product and Project Leadership",
];

function generateModuleId(): string {
  return `TRK-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

export default function CurriculumPage() {
  const [tracks, setTracks] = useState<TrackRow[]>(INITIAL_TRACKS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", track: TRACK_NAMES[0], gateThreshold: "70" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function openDialog() {
    setForm({ title: "", track: TRACK_NAMES[0], gateThreshold: "70" });
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

    const newTrack: TrackRow = {
      id: generateModuleId(),
      name: form.title.trim(),
      modules: 0,
      available: false,
      gateThreshold: parseInt(form.gateThreshold, 10),
    };
    setTracks((prev) => [newTrack, ...prev]);
    setDialogOpen(false);
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
          <div className="relative w-full max-w-lg mx-4 rounded-card border border-surface-200 bg-surface-0 shadow-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
              <h2 className="text-heading-sm text-surface-900">Create New Module</h2>
              <button onClick={() => setDialogOpen(false)} className="p-1 rounded-lg text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-colors" aria-label="Close dialog">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label htmlFor="mod-title" className="block text-body-sm font-medium text-surface-700 mb-1.5">Title <span className="text-status-error">*</span></label>
                <input id="mod-title" type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Advanced RAG Pipelines" className="w-full rounded-lg border border-surface-300 px-3.5 py-2.5 text-body-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors" aria-invalid={!!errors.title} />
                {errors.title && <p className="mt-1 text-caption text-status-error">{errors.title}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="mod-track" className="block text-body-sm font-medium text-surface-700 mb-1.5">Track</label>
                  <select id="mod-track" value={form.track} onChange={(e) => setForm((f) => ({ ...f, track: e.target.value }))} className="w-full rounded-lg border border-surface-300 px-3.5 py-2.5 text-body-sm text-surface-900 bg-surface-0 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors">
                    {TRACK_NAMES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="mod-gate" className="block text-body-sm font-medium text-surface-700 mb-1.5">Gate Threshold (%) <span className="text-status-error">*</span></label>
                  <input id="mod-gate" type="number" min={1} max={100} value={form.gateThreshold} onChange={(e) => setForm((f) => ({ ...f, gateThreshold: e.target.value }))} className="w-full rounded-lg border border-surface-300 px-3.5 py-2.5 text-body-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors" aria-invalid={!!errors.gateThreshold} />
                  {errors.gateThreshold && <p className="mt-1 text-caption text-status-error">{errors.gateThreshold}</p>}
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setDialogOpen(false)} className="rounded-lg border border-surface-300 px-4 py-2.5 text-body-sm font-medium text-surface-700 hover:bg-surface-100 transition-colors">Cancel</button>
                <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2.5 text-body-sm font-medium text-white hover:bg-brand-700 transition-colors">Create Module</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
