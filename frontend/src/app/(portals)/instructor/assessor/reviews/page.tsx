/** @file assessor/reviews/page.tsx — Performance review queue for assessor evaluation of learner submissions. */
"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

const mockReviews = [
  { id: "REV-001", learner: "Ngozi Eze", pod: "Pod Zambezi", type: "Milestone 3", submitted: "2025-02-10", daysWaiting: 5, aiScore: 78 },
  { id: "REV-002", learner: "Aisha Diallo", pod: "Pod Limpopo", type: "Capstone Draft", submitted: "2025-02-08", daysWaiting: 7, aiScore: 65 },
  { id: "REV-003", learner: "Halima Yusuf", pod: "Pod Volta", type: "Milestone 4", submitted: "2025-02-12", daysWaiting: 3, aiScore: 85 },
  { id: "REV-004", learner: "Tendai Moyo", pod: "Pod Zambezi", type: "Lab Submission", submitted: "2025-02-05", daysWaiting: 10, aiScore: 72 },
];

export default function ReviewsPage() {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editNoteValue, setEditNoteValue] = useState("");
  const [addingNote, setAddingNote] = useState<string | null>(null);
  const [addNoteValue, setAddNoteValue] = useState("");

  return (
    <div className="space-y-6">
      <h1 className="text-heading-lg text-surface-900">Submission Reviews</h1>
      <p className="text-body-sm text-surface-500">
        Grade submissions and record feedback. AI Feedback Agent results shown alongside each submission. Submissions pending 10+ days are auto-escalated.
      </p>

      <div className="rounded-card border border-surface-200 bg-surface-0 shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-body-sm">
            <thead className="border-b border-surface-200 bg-surface-50">
              <tr>
                <th className="px-4 py-3 text-surface-600 font-medium">Learner</th>
                <th className="px-4 py-3 text-surface-600 font-medium">Pod</th>
                <th className="px-4 py-3 text-surface-600 font-medium">Type</th>
                <th className="px-4 py-3 text-surface-600 font-medium">Submitted</th>
                <th className="px-4 py-3 text-surface-600 font-medium">Waiting</th>
                <th className="px-4 py-3 text-surface-600 font-medium">AI Score</th>
                <th className="px-4 py-3 text-surface-600 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200">
              {mockReviews.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 text-surface-900">{r.learner}</td>
                  <td className="px-4 py-3 text-surface-700">{r.pod}</td>
                  <td className="px-4 py-3 text-surface-700">{r.type}</td>
                  <td className="px-4 py-3 text-surface-500">{r.submitted}</td>
                  <td className="px-4 py-3">
                    <span className={`text-caption ${r.daysWaiting >= 10 ? "text-red-600 font-medium" : "text-surface-500"}`}>
                      {r.daysWaiting}d
                    </span>
                  </td>
                  <td className="px-4 py-3 text-surface-700">{r.aiScore}%</td>
                  <td className="px-4 py-3">
                    {addingNote === r.id ? (
                      <div className="flex gap-2 items-center">
                        <input type="text" value={addNoteValue} onChange={(e) => setAddNoteValue(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { const v = addNoteValue.trim(); if (v) { setNotes((p) => ({ ...p, [r.id]: v })); } setAddingNote(null); setAddNoteValue(""); } }} className="flex-1 rounded-lg border border-brand-300 bg-white px-3 py-1.5 text-body-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20" autoFocus placeholder="Enter note..." />
                        <button onClick={() => { const v = addNoteValue.trim(); if (v) { setNotes((p) => ({ ...p, [r.id]: v })); } setAddingNote(null); setAddNoteValue(""); }} className="rounded-lg bg-brand-600 px-3 py-1.5 text-caption font-medium text-white hover:bg-brand-700 transition-all">Save</button>
                        <button onClick={() => { setAddingNote(null); setAddNoteValue(""); }} className="rounded-lg border border-surface-200 px-3 py-1.5 text-caption text-surface-500 hover:bg-surface-100 transition-all">Cancel</button>
                      </div>
                    ) : editingNote === r.id ? (
                      <div className="flex gap-2 items-center">
                        <input type="text" value={editNoteValue} onChange={(e) => setEditNoteValue(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { const v = editNoteValue.trim(); if (v) { setNotes((p) => ({ ...p, [r.id]: v })); } setEditingNote(null); setEditNoteValue(""); } }} className="flex-1 rounded-lg border border-brand-300 bg-white px-3 py-1.5 text-body-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20" autoFocus />
                        <button onClick={() => { const v = editNoteValue.trim(); if (v) { setNotes((p) => ({ ...p, [r.id]: v })); } setEditingNote(null); setEditNoteValue(""); }} className="rounded-lg bg-brand-600 px-3 py-1.5 text-caption font-medium text-white hover:bg-brand-700 transition-all">Save</button>
                        <button onClick={() => { setEditingNote(null); setEditNoteValue(""); }} className="rounded-lg border border-surface-200 px-3 py-1.5 text-caption text-surface-500 hover:bg-surface-100 transition-all">Cancel</button>
                      </div>
                    ) : notes[r.id] ? (
                      <div className="flex items-start gap-2 group">
                        <p className="flex-1 text-body-sm text-surface-600">{notes[r.id]}</p>
                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingNote(r.id); setEditNoteValue(notes[r.id]); }} className="rounded-md p-1 text-surface-400 hover:text-brand-600 hover:bg-brand-50 transition-all" aria-label="Edit note"><Pencil className="h-3.5 w-3.5" /></button>
                          <button onClick={() => setNotes((p) => { const n = { ...p }; delete n[r.id]; return n; })} className="rounded-md p-1 text-surface-400 hover:text-red-600 hover:bg-red-50 transition-all" aria-label="Delete note"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => { setAddingNote(r.id); setAddNoteValue(""); }} className="text-body-sm text-brand-600 hover:text-brand-700 font-medium transition-colors">Add Note</button>
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
