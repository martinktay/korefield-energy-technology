"use client";
/** @file assessor/professionalism/page.tsx - Professionalism coaching dashboard tracking 5 discipline dimensions with expandable coaching notes. */

import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight, Pencil, Trash2 } from "lucide-react";

const dimensions = ["Communication", "Accountability", "Collaboration", "Documentation", "Learning Discipline"];
const mockScores = [
  { id: "LRN-001", name: "Ngozi Eze", pod: "Pod Zambezi", scores: [4, 5, 4, 3, 4] },
  { id: "LRN-002", name: "Tendai Moyo", pod: "Pod Zambezi", scores: [3, 3, 4, 4, 3] },
  { id: "LRN-003", name: "Aisha Diallo", pod: "Pod Limpopo", scores: [5, 4, 3, 4, 5] },
  { id: "LRN-004", name: "Kofi Mensah", pod: "Pod Limpopo", scores: [2, 2, 3, 2, 3] },
];

type NoteMap = Record<string, string>;

function noteKey(learnerId: string, dimension: string) {
  return `${learnerId}:${dimension}`;
}

export default function ProfessionalismPage() {
  const [expandedLearners, setExpandedLearners] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<NoteMap>({});
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  function startEdit(key: string, currentValue = "") {
    setEditingKey(key);
    setDraft(currentValue);
  }

  function saveNote() {
    if (!editingKey) return;
    const value = draft.trim();
    setNotes((current) => {
      if (!value) {
        const next = { ...current };
        delete next[editingKey];
        return next;
      }
      return { ...current, [editingKey]: value };
    });
    setEditingKey(null);
    setDraft("");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-heading-lg text-surface-900">Professionalism Coaching</h1>
        <p className="mt-1 text-body-sm text-surface-500">
          Track discipline signals across communication, accountability, collaboration, documentation, and learning habits.
        </p>
      </div>

      <div className="overflow-hidden rounded-card border border-surface-200 bg-surface-0 shadow-card">
        <table className="w-full text-left text-body-sm">
          <thead className="border-b border-surface-200 bg-surface-50">
            <tr>
              <th className="w-12 px-3 py-3" />
              <th className="px-3 py-3 font-medium text-surface-600">Learner</th>
              <th className="px-3 py-3 font-medium text-surface-600">Pod</th>
              {dimensions.map((dimension) => (
                <th key={dimension} className="px-3 py-3 font-medium text-surface-600">
                  {dimension}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-200">
            {mockScores.map((learner) => {
              const expanded = Boolean(expandedLearners[learner.id]);
              return (
                <Fragment key={learner.id}>
                  <tr>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        aria-label="Expand coaching notes"
                        className="rounded-md p-1 text-surface-500 hover:bg-surface-100 hover:text-surface-800"
                        onClick={() => setExpandedLearners((current) => ({ ...current, [learner.id]: !expanded }))}
                      >
                        {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                      </button>
                    </td>
                    <td className="px-3 py-3 font-medium text-surface-900">{learner.name}</td>
                    <td className="px-3 py-3 text-surface-600">{learner.pod}</td>
                    {learner.scores.map((score, index) => (
                      <td key={dimensions[index]} className="px-3 py-3 text-surface-700">
                        {score}/5
                      </td>
                    ))}
                  </tr>
                  {expanded && (
                    <tr>
                      <td colSpan={dimensions.length + 3} className="bg-surface-50 px-5 py-4">
                        <div className="grid gap-3 md:grid-cols-5">
                          {dimensions.map((dimension) => {
                            const key = noteKey(learner.id, dimension);
                            const note = notes[key];
                            const isEditing = editingKey === key;
                            return (
                              <div key={dimension} className="rounded-lg border border-surface-200 bg-white p-3">
                                <p className="text-caption font-semibold uppercase tracking-wide text-surface-500">{dimension}</p>
                                {isEditing ? (
                                  <div className="mt-2 space-y-2">
                                    <input
                                      value={draft}
                                      onChange={(event) => setDraft(event.target.value)}
                                      onKeyDown={(event) => {
                                        if (event.key === "Enter") saveNote();
                                      }}
                                      className="w-full rounded-lg border border-brand-300 px-2 py-1.5 text-body-sm outline-none focus:ring-2 focus:ring-brand-500/20"
                                      placeholder="Enter coaching note..."
                                      autoFocus
                                    />
                                    <div className="flex gap-2">
                                      <button type="button" onClick={saveNote} className="rounded-md bg-brand-600 px-2 py-1 text-caption font-medium text-white hover:bg-brand-700">
                                        Save
                                      </button>
                                      <button type="button" onClick={() => { setEditingKey(null); setDraft(""); }} className="rounded-md border border-surface-200 px-2 py-1 text-caption text-surface-600 hover:bg-surface-100">
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : note ? (
                                  <div className="mt-2 flex items-start gap-2">
                                    <p className="flex-1 text-body-sm text-surface-700">{note}</p>
                                    <button type="button" aria-label="Edit note" onClick={() => startEdit(key, note)} className="rounded-md p-1 text-surface-400 hover:bg-brand-50 hover:text-brand-600">
                                      <Pencil className="size-3.5" />
                                    </button>
                                    <button type="button" aria-label="Delete note" onClick={() => setNotes((current) => {
                                      const next = { ...current };
                                      delete next[key];
                                      return next;
                                    })} className="rounded-md p-1 text-surface-400 hover:bg-red-50 hover:text-red-600">
                                      <Trash2 className="size-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <button type="button" onClick={() => startEdit(key)} className="mt-2 text-body-sm font-medium text-brand-600 hover:text-brand-700">
                                    Add Note
                                  </button>
                                )}
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
  );
}
