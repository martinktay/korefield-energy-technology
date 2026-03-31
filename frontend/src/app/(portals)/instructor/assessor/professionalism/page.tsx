"use client";
/** @file assessor/professionalism/page.tsx - Professionalism coaching dashboard tracking 5 discipline dimensions with expandable coaching notes. */

import { useState, Fragment } from "react";
import { Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";

const dimensions = ["Communication", "Accountability", "Collaboration", "Documentation", "Learning Discipline"];

const mockScores = [
  { id: "LRN-001", name: "Ngozi Eze", pod: "Pod Zambezi", scores: [4, 5, 4, 3, 4] },
  { id: "LRN-002", name: "Tendai Moyo", pod: "Pod Zambezi", scores: [3, 3, 4, 4, 3] },
  { id: "LRN-003", name: "Aisha Diallo", pod: "Pod Limpopo", scores: [5, 4, 3, 4, 5] },
  { id: "LRN-004", name: "Kofi Mensah", pod: "Pod Limpopo", scores: [2, 2, 3, 2, 3] },
];

export default function ProfessionalismPage() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [coachingNotes, setCoachingNotes] = useState<Record<string, Record<string, string>>>({});
  const [editingCoachingNote, setEditingCoachingNote] = useState<{ learnerId: string; dimension: string } | null>(null);
  const [editCoachingNoteValue, setEditCoachingNoteValue] = useState("");
  const [addingCoachingNote, setAddingCoachingNote] = useState<{ learnerId: string; dimension: string } | null>(null);
  const [addCoachingNoteValue, setAddCoachingNoteValue] = useState("");

  return (
    <div className="space-y-6">
      <h1 className="text-heading-lg text-surface-900">Professionalism Scoring</h1>
      <p className="text-body-sm text-surface-500">
        Score learners across five dimensions: Communication, Accountability, Collaboration, Documentation, and Learning Discipline.
      </p>
      <div className="rounded-card border border-surface-200 bg-surface-0 shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-body-sm">
            <thead className="border-b border-surface-200 bg-surface-50">
              <tr>
                <th className="px-4 py-3 w-8"></th>
                <th className="px-4 py-3 text-surface-600 font-medium">Learner</th>
                <th className="px-4 py-3 text-surface-600 font-medium">Pod</th>
                {dimensions.map((d) => (<th key={d} className="px-4 py-3 text-surface-600 font-medium">{d}</th>))}
                <th className="px-4 py-3 text-surface-600 font-medium">Avg</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200">
              {mockScores.map((learner) => {
                const avg = (learner.scores.reduce((a, b) => a + b, 0) / learner.scores.length).toFixed(1);
                const isExpanded = expanded === learner.id;
                return (
                  <Fragment key={learner.id}>
                    <tr>
                      <td className="px-4 py-3">
                        <button onClick={() => setExpanded(isExpanded ? null : learner.id)} className="p-0.5 rounded text-surface-400 hover:text-surface-600 transition-colors" aria-label={isExpanded ? "Collapse coaching notes" : "Expand coaching notes"}>
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-surface-900">{learner.name}</td>
                      <td className="px-4 py-3 text-surface-700">{learner.pod}</td>
                      {learner.scores.map((score, i) => (<td key={i} className={`px-4 py-3 ${score <= 2 ? "text-red-600" : "text-surface-700"}`}>{score}/5</td>))}
                      <td className="px-4 py-3 font-medium text-surface-900">{avg}</td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={dimensions.length + 4} className="px-4 py-4 bg-surface-50">
                          <div className="space-y-3">
                            <p className="text-body-sm font-medium text-surface-700">Coaching Notes</p>
                            {dimensions.map((dim) => {
                              const noteText = coachingNotes[learner.id]?.[dim];
                              const isAdding = addingCoachingNote?.learnerId === learner.id && addingCoachingNote.dimension === dim;
                              const isEditing = editingCoachingNote?.learnerId === learner.id && editingCoachingNote.dimension === dim;
                              return (
                                <div key={dim} className="flex items-start gap-3">
                                  <p className="text-body-sm font-medium text-surface-600 w-40 shrink-0">{dim}</p>
                                  <div className="flex-1">
                                    {isAdding ? (
                                      <div className="flex gap-2 items-center">
                                        <input type="text" value={addCoachingNoteValue} onChange={(e) => setAddCoachingNoteValue(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { const v = addCoachingNoteValue.trim(); if (v) { setCoachingNotes((p) => ({ ...p, [learner.id]: { ...p[learner.id], [dim]: v } })); } setAddingCoachingNote(null); setAddCoachingNoteValue(""); } }} className="flex-1 rounded-lg border border-brand-300 bg-white px-3 py-1.5 text-body-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20" autoFocus placeholder="Enter coaching note..." />
                                        <button onClick={() => { const v = addCoachingNoteValue.trim(); if (v) { setCoachingNotes((p) => ({ ...p, [learner.id]: { ...p[learner.id], [dim]: v } })); } setAddingCoachingNote(null); setAddCoachingNoteValue(""); }} className="rounded-lg bg-brand-600 px-3 py-1.5 text-caption font-medium text-white hover:bg-brand-700 transition-all">Save</button>
                                        <button onClick={() => { setAddingCoachingNote(null); setAddCoachingNoteValue(""); }} className="rounded-lg border border-surface-200 px-3 py-1.5 text-caption text-surface-500 hover:bg-surface-100 transition-all">Cancel</button>
                                      </div>
                                    ) : isEditing ? (
                                      <div className="flex gap-2 items-center">
                                        <input type="text" value={editCoachingNoteValue} onChange={(e) => setEditCoachingNoteValue(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { const v = editCoachingNoteValue.trim(); if (v) { setCoachingNotes((p) => ({ ...p, [learner.id]: { ...p[learner.id], [dim]: v } })); } setEditingCoachingNote(null); setEditCoachingNoteValue(""); } }} className="flex-1 rounded-lg border border-brand-300 bg-white px-3 py-1.5 text-body-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20" autoFocus />
                                        <button onClick={() => { const v = editCoachingNoteValue.trim(); if (v) { setCoachingNotes((p) => ({ ...p, [learner.id]: { ...p[learner.id], [dim]: v } })); } setEditingCoachingNote(null); setEditCoachingNoteValue(""); }} className="rounded-lg bg-brand-600 px-3 py-1.5 text-caption font-medium text-white hover:bg-brand-700 transition-all">Save</button>
                                        <button onClick={() => { setEditingCoachingNote(null); setEditCoachingNoteValue(""); }} className="rounded-lg border border-surface-200 px-3 py-1.5 text-caption text-surface-500 hover:bg-surface-100 transition-all">Cancel</button>
                                      </div>
                                    ) : noteText ? (
                                      <div className="flex items-start gap-2 group">
                                        <p className="flex-1 text-body-sm text-surface-600">{noteText}</p>
                                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button onClick={() => { setEditingCoachingNote({ learnerId: learner.id, dimension: dim }); setEditCoachingNoteValue(noteText); }} className="rounded-md p-1 text-surface-400 hover:text-brand-600 hover:bg-brand-50 transition-all" aria-label="Edit note"><Pencil className="h-3.5 w-3.5" /></button>
                                          <button onClick={() => setCoachingNotes((p) => { const updated = { ...p, [learner.id]: { ...p[learner.id] } }; delete updated[learner.id][dim]; return updated; })} className="rounded-md p-1 text-surface-400 hover:text-red-600 hover:bg-red-50 transition-all" aria-label="Delete note"><Trash2 className="h-3.5 w-3.5" /></button>
                                        </div>
                                      </div>
                                    ) : (
                                      <button onClick={() => { setAddingCoachingNote({ learnerId: learner.id, dimension: dim }); setAddCoachingNoteValue(""); }} className="text-body-sm text-brand-600 hover:text-brand-700 font-medium transition-colors">Add Note</button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
