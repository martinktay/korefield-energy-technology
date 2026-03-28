/** @file instructor/grading/page.tsx — Grading queue showing pending submissions for performance gates and labs. */
"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

const mockSubmissions = [
  { id: "SUB-001", learner: "Ngozi Eze", type: "Performance Gate", module: "Module 2", submitted: "2025-02-14", status: "Pending" },
  { id: "SUB-002", learner: "Tendai Moyo", type: "Lab Submission", module: "Module 3", submitted: "2025-02-13", status: "Pending" },
  { id: "SUB-003", learner: "Aisha Diallo", type: "Quiz", module: "Module 1", submitted: "2025-02-12", status: "Pending" },
  { id: "SUB-004", learner: "Kofi Mensah", type: "Performance Gate", module: "Module 4", submitted: "2025-02-11", status: "In Review" },
];

export default function GradingPage() {
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [editingFeedback, setEditingFeedback] = useState<string | null>(null);
  const [editFeedbackValue, setEditFeedbackValue] = useState("");
  const [addingFeedback, setAddingFeedback] = useState<string | null>(null);
  const [addFeedbackValue, setAddFeedbackValue] = useState("");

  return (
    <div className="space-y-6">
      <h1 className="text-heading-lg text-surface-900">Grading Queue</h1>
      <p className="text-body-sm text-surface-500">
        Review and grade learner submissions. AI Feedback Agent results are displayed alongside each submission for reference.
      </p>

      <div className="rounded-card border border-surface-200 bg-surface-0 shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-body-sm">
            <thead className="border-b border-surface-200 bg-surface-50">
              <tr>
                <th className="px-4 py-3 text-surface-600 font-medium">Learner</th>
                <th className="px-4 py-3 text-surface-600 font-medium">Type</th>
                <th className="px-4 py-3 text-surface-600 font-medium">Module</th>
                <th className="px-4 py-3 text-surface-600 font-medium">Submitted</th>
                <th className="px-4 py-3 text-surface-600 font-medium">Status</th>
                <th className="px-4 py-3 text-surface-600 font-medium">Feedback</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200">
              {mockSubmissions.map((sub) => (
                <tr key={sub.id}>
                  <td className="px-4 py-3 text-surface-900">{sub.learner}</td>
                  <td className="px-4 py-3 text-surface-700">{sub.type}</td>
                  <td className="px-4 py-3 text-surface-700">{sub.module}</td>
                  <td className="px-4 py-3 text-surface-500">{sub.submitted}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-caption text-amber-700">
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {addingFeedback === sub.id ? (
                      <div className="flex gap-2 items-center">
                        <input type="text" value={addFeedbackValue} onChange={(e) => setAddFeedbackValue(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { const v = addFeedbackValue.trim(); if (v) { setFeedback((p) => ({ ...p, [sub.id]: v })); } setAddingFeedback(null); setAddFeedbackValue(""); } }} className="flex-1 rounded-lg border border-brand-300 bg-white px-3 py-1.5 text-body-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20" autoFocus placeholder="Enter feedback..." />
                        <button onClick={() => { const v = addFeedbackValue.trim(); if (v) { setFeedback((p) => ({ ...p, [sub.id]: v })); } setAddingFeedback(null); setAddFeedbackValue(""); }} className="rounded-lg bg-brand-600 px-3 py-1.5 text-caption font-medium text-white hover:bg-brand-700 transition-all">Save</button>
                        <button onClick={() => { setAddingFeedback(null); setAddFeedbackValue(""); }} className="rounded-lg border border-surface-200 px-3 py-1.5 text-caption text-surface-500 hover:bg-surface-100 transition-all">Cancel</button>
                      </div>
                    ) : editingFeedback === sub.id ? (
                      <div className="flex gap-2 items-center">
                        <input type="text" value={editFeedbackValue} onChange={(e) => setEditFeedbackValue(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { const v = editFeedbackValue.trim(); if (v) { setFeedback((p) => ({ ...p, [sub.id]: v })); } setEditingFeedback(null); setEditFeedbackValue(""); } }} className="flex-1 rounded-lg border border-brand-300 bg-white px-3 py-1.5 text-body-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20" autoFocus />
                        <button onClick={() => { const v = editFeedbackValue.trim(); if (v) { setFeedback((p) => ({ ...p, [sub.id]: v })); } setEditingFeedback(null); setEditFeedbackValue(""); }} className="rounded-lg bg-brand-600 px-3 py-1.5 text-caption font-medium text-white hover:bg-brand-700 transition-all">Save</button>
                        <button onClick={() => { setEditingFeedback(null); setEditFeedbackValue(""); }} className="rounded-lg border border-surface-200 px-3 py-1.5 text-caption text-surface-500 hover:bg-surface-100 transition-all">Cancel</button>
                      </div>
                    ) : feedback[sub.id] ? (
                      <div className="flex items-start gap-2 group">
                        <p className="flex-1 text-body-sm text-surface-600">{feedback[sub.id]}</p>
                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingFeedback(sub.id); setEditFeedbackValue(feedback[sub.id]); }} className="rounded-md p-1 text-surface-400 hover:text-brand-600 hover:bg-brand-50 transition-all" aria-label="Edit feedback"><Pencil className="h-3.5 w-3.5" /></button>
                          <button onClick={() => setFeedback((p) => { const n = { ...p }; delete n[sub.id]; return n; })} className="rounded-md p-1 text-surface-400 hover:text-red-600 hover:bg-red-50 transition-all" aria-label="Delete feedback"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => { setAddingFeedback(sub.id); setAddFeedbackValue(""); }} className="text-body-sm text-brand-600 hover:text-brand-700 font-medium transition-colors">Add Feedback</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
