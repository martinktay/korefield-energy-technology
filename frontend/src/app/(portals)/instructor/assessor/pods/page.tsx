/** @file assessor/pods/page.tsx — Detailed pod supervision view with member roles and deliverable tracking. */
"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

interface SupervisionNote {
  id: string;
  text: string;
  timestamp: string;
}

const mockPodDetails = [
  {
    id: "Pod Zambezi", members: [
      { name: "Ngozi Eze", role: "AI Engineer", contribution: 85, lastActive: "2025-02-15" },
      { name: "Tendai Moyo", role: "Data Scientist", contribution: 72, lastActive: "2025-02-14" },
      { name: "Yemi Adeyemi", role: "PM", contribution: 90, lastActive: "2025-02-15" },
    ],
    communicationFreq: "High", healthStatus: "Healthy",
  },
  {
    id: "Pod Limpopo", members: [
      { name: "Aisha Diallo", role: "Security", contribution: 60, lastActive: "2025-02-13" },
      { name: "Kofi Mensah", role: "AI Engineer", contribution: 45, lastActive: "2025-02-10" },
    ],
    communicationFreq: "Low", healthStatus: "At Risk",
  },
];

export default function PodsPage() {
  const [supervisionNotes, setSupervisionNotes] = useState<Record<string, SupervisionNote[]>>({});
  const [editingSupNote, setEditingSupNote] = useState<{ podId: string; noteId: string } | null>(null);
  const [editSupNoteValue, setEditSupNoteValue] = useState("");
  const [addingSupNote, setAddingSupNote] = useState<string | null>(null);
  const [addSupNoteValue, setAddSupNoteValue] = useState("");

  return (
    <div className="space-y-6">
      <h1 className="text-heading-lg text-surface-900">Pod Monitoring</h1>
      <p className="text-body-sm text-surface-500">
        Activity logs, communication frequency, task contribution per member, and early warning indicators.
      </p>

      {mockPodDetails.map((pod) => (
        <section key={pod.id} className="rounded-card border border-surface-200 bg-surface-0 p-4 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-body-lg font-medium text-surface-900">{pod.id}</h2>
            <span className={`rounded-full px-2 py-0.5 text-caption ${
              pod.healthStatus === "Healthy" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}>
              {pod.healthStatus}
            </span>
          </div>
          <p className="text-caption text-surface-500 mb-3">Communication: {pod.communicationFreq}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-body-sm">
              <thead className="border-b border-surface-200">
                <tr>
                  <th className="px-3 py-2 text-surface-600 font-medium">Member</th>
                  <th className="px-3 py-2 text-surface-600 font-medium">Role</th>
                  <th className="px-3 py-2 text-surface-600 font-medium">Contribution</th>
                  <th className="px-3 py-2 text-surface-600 font-medium">Last Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200">
                {pod.members.map((m) => (
                  <tr key={m.name}>
                    <td className="px-3 py-2 text-surface-900">{m.name}</td>
                    <td className="px-3 py-2 text-surface-700">{m.role}</td>
                    <td className="px-3 py-2 text-surface-700">{m.contribution}%</td>
                    <td className="px-3 py-2 text-surface-500">{m.lastActive}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Supervision Notes */}
          <div className="mt-4 border-t border-surface-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-body-sm font-medium text-surface-700">Supervision Notes</p>
              {addingSupNote !== pod.id && (
                <button onClick={() => { setAddingSupNote(pod.id); setAddSupNoteValue(""); }} className="text-body-sm text-brand-600 hover:text-brand-700 font-medium transition-colors">Add Note</button>
              )}
            </div>
            {addingSupNote === pod.id && (
              <div className="flex gap-2 items-center mb-3">
                <input type="text" value={addSupNoteValue} onChange={(e) => setAddSupNoteValue(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { const v = addSupNoteValue.trim(); if (v) { const note: SupervisionNote = { id: Date.now().toString(), text: v, timestamp: new Date().toLocaleString() }; setSupervisionNotes((p) => ({ ...p, [pod.id]: [note, ...(p[pod.id] || [])] })); } setAddingSupNote(null); setAddSupNoteValue(""); } }} className="flex-1 rounded-lg border border-brand-300 bg-white px-3 py-1.5 text-body-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20" autoFocus placeholder="Enter supervision note..." />
                <button onClick={() => { const v = addSupNoteValue.trim(); if (v) { const note: SupervisionNote = { id: Date.now().toString(), text: v, timestamp: new Date().toLocaleString() }; setSupervisionNotes((p) => ({ ...p, [pod.id]: [note, ...(p[pod.id] || [])] })); } setAddingSupNote(null); setAddSupNoteValue(""); }} className="rounded-lg bg-brand-600 px-3 py-1.5 text-caption font-medium text-white hover:bg-brand-700 transition-all">Save</button>
                <button onClick={() => { setAddingSupNote(null); setAddSupNoteValue(""); }} className="rounded-lg border border-surface-200 px-3 py-1.5 text-caption text-surface-500 hover:bg-surface-100 transition-all">Cancel</button>
              </div>
            )}
            {(supervisionNotes[pod.id] || []).length === 0 && addingSupNote !== pod.id && (
              <p className="text-body-sm text-surface-400 italic">No supervision notes yet.</p>
            )}
            <div className="space-y-2">
              {(supervisionNotes[pod.id] || []).map((note) => (
                <div key={note.id} className="flex items-start gap-2 bg-surface-50 rounded-lg p-3 group">
                  {editingSupNote?.podId === pod.id && editingSupNote.noteId === note.id ? (
                    <div className="flex-1 flex gap-2">
                      <input type="text" value={editSupNoteValue} onChange={(e) => setEditSupNoteValue(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { const v = editSupNoteValue.trim(); if (v) { setSupervisionNotes((p) => ({ ...p, [pod.id]: (p[pod.id] || []).map((n) => n.id === note.id ? { ...n, text: v } : n) })); } setEditingSupNote(null); setEditSupNoteValue(""); } }} className="flex-1 rounded-lg border border-brand-300 bg-white px-3 py-1.5 text-body-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20" autoFocus />
                      <button onClick={() => { const v = editSupNoteValue.trim(); if (v) { setSupervisionNotes((p) => ({ ...p, [pod.id]: (p[pod.id] || []).map((n) => n.id === note.id ? { ...n, text: v } : n) })); } setEditingSupNote(null); setEditSupNoteValue(""); }} className="rounded-lg bg-brand-600 px-3 py-1.5 text-caption font-medium text-white hover:bg-brand-700 transition-all">Save</button>
                      <button onClick={() => { setEditingSupNote(null); setEditSupNoteValue(""); }} className="rounded-lg border border-surface-200 px-3 py-1.5 text-caption text-surface-500 hover:bg-surface-100 transition-all">Cancel</button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1">
                        <span className="text-caption text-surface-400 mr-2">{note.timestamp}</span>
                        <span className="text-body-sm text-surface-600">{note.text}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingSupNote({ podId: pod.id, noteId: note.id }); setEditSupNoteValue(note.text); }} className="rounded-md p-1 text-surface-400 hover:text-brand-600 hover:bg-brand-50 transition-all" aria-label="Edit note"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setSupervisionNotes((p) => ({ ...p, [pod.id]: (p[pod.id] || []).filter((n) => n.id !== note.id) }))} className="rounded-md p-1 text-surface-400 hover:text-red-600 hover:bg-red-50 transition-all" aria-label="Delete note"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
