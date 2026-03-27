/**
 * @file assessment-builder.tsx
 * Assessment question builder for instructors/admins.
 * Supports: Multiple Choice, Coding Exercise, Drag & Drop matching.
 * Used inside module/lesson creation dialogs.
 */
"use client";

import { useState } from "react";
import { Plus, Trash2, GripVertical, CheckCircle2, Code, Move } from "lucide-react";

export type QuestionType = "multiple-choice" | "coding" | "drag-drop";

export interface MCOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface MCQuestion {
  type: "multiple-choice";
  id: string;
  question: string;
  options: MCOption[];
  explanation: string;
}

export interface CodingQuestion {
  type: "coding";
  id: string;
  question: string;
  starterCode: string;
  language: string;
  testCases: string;
}

export interface DragDropQuestion {
  type: "drag-drop";
  id: string;
  question: string;
  pairs: { id: string; left: string; right: string }[];
}

export type Question = MCQuestion | CodingQuestion | DragDropQuestion;

let nextId = 1;
function genId() { return `Q-${nextId++}`; }
function genOptId() { return `OPT-${nextId++}`; }
function genPairId() { return `PAIR-${nextId++}`; }

interface Props {
  questions: Question[];
  onChange: (questions: Question[]) => void;
}

export function AssessmentBuilder({ questions, onChange }: Props) {
  const [addMenuOpen, setAddMenuOpen] = useState(false);

  function addQuestion(type: QuestionType) {
    const id = genId();
    let q: Question;
    if (type === "multiple-choice") {
      q = { type, id, question: "", options: [
        { id: genOptId(), text: "", isCorrect: true },
        { id: genOptId(), text: "", isCorrect: false },
        { id: genOptId(), text: "", isCorrect: false },
        { id: genOptId(), text: "", isCorrect: false },
      ], explanation: "" };
    } else if (type === "coding") {
      q = { type, id, question: "", starterCode: "# Write your solution here\n", language: "python", testCases: "# Test cases\nassert solution() == expected" };
    } else {
      q = { type, id, question: "", pairs: [
        { id: genPairId(), left: "", right: "" },
        { id: genPairId(), left: "", right: "" },
        { id: genPairId(), left: "", right: "" },
      ] };
    }
    onChange([...questions, q]);
    setAddMenuOpen(false);
  }

  function removeQuestion(id: string) {
    onChange(questions.filter((q) => q.id !== id));
  }

  function updateQuestion(id: string, updates: Partial<Question>) {
    onChange(questions.map((q) => q.id === id ? { ...q, ...updates } as Question : q));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-body-sm font-medium text-surface-900">Assessment Questions ({questions.length})</h3>
        <div className="relative">
          <button type="button" onClick={() => setAddMenuOpen(!addMenuOpen)} className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-caption font-medium text-white hover:bg-brand-700 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Question
          </button>
          {addMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-surface-200 bg-surface-0 shadow-lg z-10">
              <button type="button" onClick={() => addQuestion("multiple-choice")} className="flex items-center gap-2 w-full px-3 py-2 text-body-sm text-surface-700 hover:bg-surface-50 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-brand-600" /> Multiple Choice
              </button>
              <button type="button" onClick={() => addQuestion("coding")} className="flex items-center gap-2 w-full px-3 py-2 text-body-sm text-surface-700 hover:bg-surface-50 transition-colors">
                <Code className="w-4 h-4 text-accent-600" /> Coding Exercise
              </button>
              <button type="button" onClick={() => addQuestion("drag-drop")} className="flex items-center gap-2 w-full px-3 py-2 text-body-sm text-surface-700 hover:bg-surface-50 transition-colors">
                <Move className="w-4 h-4 text-purple-600" /> Drag & Drop
              </button>
            </div>
          )}
        </div>
      </div>

      {questions.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-surface-300 py-8 text-center">
          <p className="text-body-sm text-surface-500">No questions added yet.</p>
          <p className="text-caption text-surface-400 mt-1">Click "Add Question" to create assessments for this module.</p>
        </div>
      )}

      {questions.map((q, idx) => (
        <div key={q.id} className="rounded-lg border border-surface-200 bg-surface-0 overflow-hidden">
          {/* Question header */}
          <div className="flex items-center gap-2 px-4 py-2 bg-surface-50 border-b border-surface-200">
            <GripVertical className="w-4 h-4 text-surface-300 cursor-grab" />
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
              q.type === "multiple-choice" ? "bg-brand-50 text-brand-600" :
              q.type === "coding" ? "bg-accent-50 text-accent-600" :
              "bg-purple-50 text-purple-600"
            }`}>
              {q.type === "multiple-choice" ? "MCQ" : q.type === "coding" ? "CODE" : "D&D"}
            </span>
            <span className="text-caption font-medium text-surface-700">Question {idx + 1}</span>
            <button type="button" onClick={() => removeQuestion(q.id)} className="ml-auto p-1 rounded text-surface-400 hover:text-status-error hover:bg-red-50 transition-colors" aria-label="Remove question">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 space-y-3">
            {/* Question text (all types) */}
            <div>
              <label className="block text-caption font-medium text-surface-600 mb-1">Question</label>
              <textarea
                value={q.question}
                onChange={(e) => updateQuestion(q.id, { question: e.target.value })}
                placeholder="Enter the question..."
                rows={2}
                className="w-full rounded-lg border border-surface-300 px-3 py-2 text-body-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none"
              />
            </div>

            {/* ── Multiple Choice ── */}
            {q.type === "multiple-choice" && (
              <>
                <div>
                  <label className="block text-caption font-medium text-surface-600 mb-1">Options (select the correct answer)</label>
                  <div className="space-y-2">
                    {q.options.map((opt) => (
                      <div key={opt.id} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = q.options.map((o) => ({ ...o, isCorrect: o.id === opt.id }));
                            updateQuestion(q.id, { options: updated });
                          }}
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                            opt.isCorrect ? "border-accent-500 bg-accent-500" : "border-surface-300 hover:border-brand-400"
                          }`}
                          aria-label={opt.isCorrect ? "Correct answer" : "Mark as correct"}
                        >
                          {opt.isCorrect && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </button>
                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => {
                            const updated = q.options.map((o) => o.id === opt.id ? { ...o, text: e.target.value } : o);
                            updateQuestion(q.id, { options: updated });
                          }}
                          placeholder={`Option ${q.options.indexOf(opt) + 1}`}
                          className={`flex-1 rounded-lg border px-3 py-1.5 text-body-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors ${
                            opt.isCorrect ? "border-accent-300 bg-accent-50" : "border-surface-300"
                          }`}
                        />
                        {q.options.length > 2 && (
                          <button type="button" onClick={() => {
                            const updated = q.options.filter((o) => o.id !== opt.id);
                            if (opt.isCorrect && updated.length > 0) updated[0].isCorrect = true;
                            updateQuestion(q.id, { options: updated });
                          }} className="p-1 text-surface-400 hover:text-status-error transition-colors">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {q.options.length < 6 && (
                    <button type="button" onClick={() => {
                      updateQuestion(q.id, { options: [...q.options, { id: genOptId(), text: "", isCorrect: false }] });
                    }} className="mt-2 text-caption text-brand-600 hover:text-brand-700 transition-colors">
                      + Add option
                    </button>
                  )}
                </div>
                <div>
                  <label className="block text-caption font-medium text-surface-600 mb-1">Explanation (shown after answering)</label>
                  <input type="text" value={q.explanation} onChange={(e) => updateQuestion(q.id, { explanation: e.target.value })} placeholder="Why this is the correct answer..." className="w-full rounded-lg border border-surface-300 px-3 py-1.5 text-body-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
                </div>
              </>
            )}

            {/* ── Coding Exercise ── */}
            {q.type === "coding" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-caption font-medium text-surface-600 mb-1">Language</label>
                    <select value={q.language} onChange={(e) => updateQuestion(q.id, { language: e.target.value })} className="w-full rounded-lg border border-surface-300 px-3 py-1.5 text-body-sm text-surface-900 bg-surface-0 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20">
                      <option value="python">Python</option>
                      <option value="javascript">JavaScript</option>
                      <option value="sql">SQL</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-caption font-medium text-surface-600 mb-1">Starter Code</label>
                  <textarea
                    value={q.starterCode}
                    onChange={(e) => updateQuestion(q.id, { starterCode: e.target.value })}
                    rows={4}
                    className="w-full rounded-lg border border-surface-300 px-3 py-2 font-mono text-caption text-surface-900 bg-surface-950 text-accent-400 placeholder:text-surface-600 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none"
                    placeholder="# Starter code for the learner..."
                  />
                </div>
                <div>
                  <label className="block text-caption font-medium text-surface-600 mb-1">Test Cases</label>
                  <textarea
                    value={q.testCases}
                    onChange={(e) => updateQuestion(q.id, { testCases: e.target.value })}
                    rows={3}
                    className="w-full rounded-lg border border-surface-300 px-3 py-2 font-mono text-caption text-surface-900 bg-surface-950 text-accent-400 placeholder:text-surface-600 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none"
                    placeholder="assert greet('World') == 'Hello, World!'"
                  />
                </div>
              </>
            )}

            {/* ── Drag & Drop ── */}
            {q.type === "drag-drop" && (
              <div>
                <label className="block text-caption font-medium text-surface-600 mb-1">Match Pairs (left → right)</label>
                <div className="space-y-2">
                  {q.pairs.map((pair, pi) => (
                    <div key={pair.id} className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-surface-300 shrink-0" />
                      <input
                        type="text"
                        value={pair.left}
                        onChange={(e) => {
                          const updated = q.pairs.map((p) => p.id === pair.id ? { ...p, left: e.target.value } : p);
                          updateQuestion(q.id, { pairs: updated });
                        }}
                        placeholder={`Item ${pi + 1}`}
                        className="flex-1 rounded-lg border border-surface-300 px-3 py-1.5 text-body-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                      />
                      <span className="text-surface-400">→</span>
                      <input
                        type="text"
                        value={pair.right}
                        onChange={(e) => {
                          const updated = q.pairs.map((p) => p.id === pair.id ? { ...p, right: e.target.value } : p);
                          updateQuestion(q.id, { pairs: updated });
                        }}
                        placeholder={`Match ${pi + 1}`}
                        className="flex-1 rounded-lg border border-surface-300 px-3 py-1.5 text-body-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                      />
                      {q.pairs.length > 2 && (
                        <button type="button" onClick={() => {
                          updateQuestion(q.id, { pairs: q.pairs.filter((p) => p.id !== pair.id) });
                        }} className="p-1 text-surface-400 hover:text-status-error transition-colors">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {q.pairs.length < 8 && (
                  <button type="button" onClick={() => {
                    updateQuestion(q.id, { pairs: [...q.pairs, { id: genPairId(), left: "", right: "" }] });
                  }} className="mt-2 text-caption text-brand-600 hover:text-brand-700 transition-colors">
                    + Add pair
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
