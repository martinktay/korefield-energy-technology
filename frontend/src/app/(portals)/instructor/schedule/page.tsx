/** @file instructor/schedule/page.tsx — Session scheduling page for labs and sprint reviews. */
"use client";

import { useState } from "react";
import { X, Check } from "lucide-react";
import { CustomSelect } from "@/components/ui/custom-select";
import { useToastStore } from "@/components/ui/toast";

interface Session {
  id: string; title: string; date: string; time: string; module: string; cohort: string; status: string;
}

const INITIAL_SESSIONS: Session[] = [
  { id: "SES-001", title: "Lab: Data Pipelines", date: "2025-02-18", time: "10:00 AM", module: "Module 3", cohort: "AI Engineering — Cohort 3", status: "Scheduled" },
  { id: "SES-002", title: "Review: Sprint 3 Deliverables", date: "2025-02-20", time: "2:00 PM", module: "Module 4", cohort: "Data Science — Cohort 1", status: "Scheduled" },
  { id: "SES-003", title: "Lab: Model Evaluation", date: "2025-02-22", time: "11:00 AM", module: "Module 5", cohort: "AI Engineering — Cohort 3", status: "Draft" },
];

const MODULES = ["Module 1", "Module 2", "Module 3", "Module 4", "Module 5", "Module 6"];
const COHORTS = ["AI Engineering — Cohort 3", "Data Science — Cohort 1", "Cybersecurity — Cohort 2", "AI Product — Cohort 1"];

function generateSessionId(): string {
  return `SES-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

export default function SchedulePage() {
  const [sessions, setSessions] = useState<Session[]>(INITIAL_SESSIONS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", date: "", time: "", module: MODULES[0], cohort: COHORTS[0] });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [justCreated, setJustCreated] = useState("");

  function openDialog() {
    setForm({ title: "", date: "", time: "", module: MODULES[0], cohort: COHORTS[0] });
    setErrors({});
    setDialogOpen(true);
  }

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = "Session title is required";
    if (!form.date) errs.date = "Date is required";
    if (!form.time) errs.time = "Time is required";
    return errs;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const newSession: Session = {
      id: generateSessionId(),
      title: form.title.trim(),
      date: form.date,
      time: form.time,
      module: form.module,
      cohort: form.cohort,
      status: "Scheduled",
    };
    setSessions((prev) => [newSession, ...prev]);
    setDialogOpen(false);
    useToastStore.getState().addToast("Session scheduled successfully");
    setJustCreated(newSession.id);
    setTimeout(() => setJustCreated(""), 3000);
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-heading-lg text-surface-900">Schedule</h1>
        <button onClick={openDialog} className="rounded-lg bg-brand-600 px-4 py-2 text-body-sm text-white hover:bg-brand-700">
          Schedule Session
        </button>
      </div>
      <p className="text-body-sm text-surface-500">
        Manage lab sessions and review sessions. Learners are notified 48 hours in advance. Recordings available within 24 hours.
      </p>

      <div className="rounded-card border border-surface-200 bg-surface-0 shadow-card">
        <ul className="divide-y divide-surface-200" role="list">
          {sessions.map((session) => (
            <li key={session.id} className="px-4 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-body-sm font-medium text-surface-900">{session.title}</h3>
                  <p className="text-caption text-surface-500 mt-1">
                    {session.cohort} · {session.module}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-body-sm text-surface-700">{session.date}</p>
                  <p className="text-caption text-surface-500">{session.time}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Schedule Session Dialog ── */}
      {dialogOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[10vh]">
          <div className="relative w-full max-w-lg mx-4 rounded-card border border-surface-200 bg-surface-0 shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
              <h2 className="text-heading-sm text-surface-900">Schedule New Session</h2>
              <button onClick={() => setDialogOpen(false)} className="p-1 rounded-lg text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-colors" aria-label="Close dialog">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label htmlFor="ses-title" className="block text-body-sm font-medium text-surface-700 mb-1.5">Title <span className="text-status-error">*</span></label>
                <input id="ses-title" type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Lab: Data Pipelines" className="w-full rounded-lg border border-surface-300 px-3.5 py-2.5 text-body-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors" aria-invalid={!!errors.title} />
                {errors.title && <p className="mt-1 text-caption text-status-error">{errors.title}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ses-date" className="block text-body-sm font-medium text-surface-700 mb-1.5">Date <span className="text-status-error">*</span></label>
                  <input id="ses-date" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="w-full rounded-lg border border-surface-300 px-3.5 py-2.5 text-body-sm text-surface-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors" aria-invalid={!!errors.date} />
                  {errors.date && <p className="mt-1 text-caption text-status-error">{errors.date}</p>}
                </div>
                <div>
                  <label htmlFor="ses-time" className="block text-body-sm font-medium text-surface-700 mb-1.5">Time <span className="text-status-error">*</span></label>
                  <input id="ses-time" type="time" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} className="w-full rounded-lg border border-surface-300 px-3.5 py-2.5 text-body-sm text-surface-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors" aria-invalid={!!errors.time} />
                  {errors.time && <p className="mt-1 text-caption text-status-error">{errors.time}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ses-module" className="block text-body-sm font-medium text-surface-700 mb-1.5">Module</label>
                  <CustomSelect id="ses-module" value={form.module} onChange={(v) => setForm((f) => ({ ...f, module: v }))} options={MODULES.map((m) => ({ value: m, label: m }))} />
                </div>
                <div>
                  <label htmlFor="ses-cohort" className="block text-body-sm font-medium text-surface-700 mb-1.5">Cohort</label>
                  <CustomSelect id="ses-cohort" value={form.cohort} onChange={(v) => setForm((f) => ({ ...f, cohort: v }))} options={COHORTS.map((c) => ({ value: c, label: c }))} />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setDialogOpen(false)} className="rounded-lg border border-surface-300 px-4 py-2.5 text-body-sm font-medium text-surface-700 hover:bg-surface-100 transition-colors">Cancel</button>
                <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2.5 text-body-sm font-medium text-white hover:bg-brand-700 transition-colors">Schedule Session</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
