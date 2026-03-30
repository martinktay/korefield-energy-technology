/** @file learner/pods/[podId]/page.tsx — Pod detail page with member roster, roles, and collaboration workspace. */
"use client";

import { useState } from "react";
import { X } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

/** Pod members with their assigned multidisciplinary roles */
const mockMembers = [
  { id: "PDM-001", name: "Amara Okafor", role: "Product Manager" },
  { id: "PDM-002", name: "Kwame Asante", role: "AI Engineer" },
  { id: "PDM-003", name: "Fatima Bello", role: "Data Scientist" },
  { id: "PDM-004", name: "Chidi Nwosu", role: "Cybersecurity Specialist" },
  { id: "PDM-005", name: "Zara Mwangi", role: "Industry Specialist" },
];

const mockDeliverables = [
  { name: "Working Prototype", status: "in-progress" },
  { name: "Documentation", status: "not-started" },
  { name: "Governance Checklist", status: "not-started" },
  { name: "Sprint Reviews", status: "in-progress" },
  { name: "Final Presentation", status: "not-started" },
];

/** Recent collaboration activity within this pod */
const mockActivity = [
  { id: "1", text: "Kwame Asante submitted peer review for Fatima Bello", time: "2 hours ago" },
  { id: "2", text: "Amara Okafor uploaded sprint review notes", time: "1 day ago" },
  { id: "3", text: "Pod meeting completed", time: "2 days ago" },
];

export default function PodWorkspacePage() {
  const params = useParams<{ podId: string }>();
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([
    { id: "m1", sender: "Kwame Asante", text: "Has anyone started on the prototype?", time: "10:32 AM" },
    { id: "m2", sender: "Amara Okafor", text: "I pushed the initial wireframes yesterday.", time: "10:45 AM" },
  ]);
  const [inCall, setInCall] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({ member: mockMembers[0].id, rating: "5", feedback: "" });
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-caption text-surface-400">{params.podId}</p>
        <h1 className="text-heading-lg text-surface-900">Pod Workspace</h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Members */}
        <section aria-labelledby="members-heading" className="rounded-card border border-surface-200 bg-surface-0 p-4 shadow-card">
          <h2 id="members-heading" className="text-heading-sm text-surface-900 mb-3">Members</h2>
          <ul className="space-y-2" role="list">
            {mockMembers.map((m) => (
              <li key={m.id} className="flex items-center justify-between text-body-sm">
                <span className="text-surface-900">{m.name}</span>
                <span className="text-caption text-surface-500">{m.role}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Deliverables */}
        <section aria-labelledby="deliverables-heading" className="rounded-card border border-surface-200 bg-surface-0 p-4 shadow-card">
          <h2 id="deliverables-heading" className="text-heading-sm text-surface-900 mb-3">Deliverables</h2>
          <ul className="space-y-2" role="list">
            {mockDeliverables.map((d) => (
              <li key={d.name} className="flex items-center justify-between text-body-sm">
                <span className="text-surface-700">{d.name}</span>
                <span className={`rounded-full px-2 py-0.5 text-caption ${
                  d.status === "in-progress"
                    ? "bg-brand-50 text-brand-700"
                    : "bg-surface-100 text-surface-500"
                }`}>
                  {d.status === "in-progress" ? "In Progress" : "Not Started"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Recent Activity */}
      <section aria-labelledby="activity-heading">
        <h2 id="activity-heading" className="text-heading-sm text-surface-900 mb-3">Recent Activity</h2>
        <div className="rounded-card border border-surface-200 bg-surface-0 shadow-card">
          <ul className="divide-y divide-surface-200" role="list">
            {mockActivity.map((a) => (
              <li key={a.id} className="flex items-center justify-between px-4 py-3">
                <span className="text-body-sm text-surface-700">{a.text}</span>
                <span className="text-caption text-surface-400">{a.time}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Collaboration tools */}
      <div className="flex gap-3">
        <Link href={`/learner/pods/${params.podId}/chat`} className={`rounded-lg px-4 py-2 text-body-sm font-medium transition-colors bg-brand-600 text-white hover:bg-brand-700`}>
          Team Chat
        </Link>
        {inCall ? (
          <button type="button" onClick={() => setInCall(false)} className="rounded-lg bg-red-600 px-4 py-2 text-body-sm font-medium text-white hover:bg-red-700 transition-colors">
            Leave Call
          </button>
        ) : (
          <button type="button" onClick={() => setInCall(true)} className="rounded-lg border border-surface-300 px-4 py-2 text-body-sm text-surface-700 hover:bg-surface-100 transition-colors">
            Join Video Call
          </button>
        )}
        <button type="button" onClick={() => { setReviewDialogOpen(true); setReviewSubmitted(false); setReviewForm({ member: mockMembers[0].id, rating: "5", feedback: "" }); }} className="rounded-lg border border-surface-300 px-4 py-2 text-body-sm text-surface-700 hover:bg-surface-100 transition-colors">
          Submit Peer Review
        </button>
      </div>

      {/* In-call indicator */}
      {inCall && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
          </span>
          <span className="text-body-sm text-green-800">In Call... Connected to pod video session</span>
        </div>
      )}

      {/* Inline chat panel */}
      {chatOpen && (
        <div className="rounded-card border border-surface-200 bg-surface-0 shadow-card">
          <div className="px-4 py-3 border-b border-surface-200">
            <h3 className="text-body-sm font-medium text-surface-900">Pod Chat</h3>
          </div>
          <div className="px-4 py-3 space-y-3 max-h-60 overflow-y-auto">
            {chatMessages.map((msg) => (
              <div key={msg.id}>
                <div className="flex items-baseline gap-2">
                  <span className="text-caption font-medium text-surface-900">{msg.sender}</span>
                  <span className="text-caption text-surface-400">{msg.time}</span>
                </div>
                <p className="text-body-sm text-surface-700">{msg.text}</p>
              </div>
            ))}
          </div>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (!chatInput.trim()) return;
            setChatMessages((prev) => [...prev, { id: `m${prev.length + 1}`, sender: "You", text: chatInput.trim(), time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
            setChatInput("");
          }} className="px-4 py-3 border-t border-surface-200 flex gap-2">
            <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Type a message..." className="flex-1 rounded-lg border border-surface-300 px-3 py-2 text-body-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors" aria-label="Chat message" />
            <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-body-sm font-medium text-white hover:bg-brand-700 transition-colors">Send</button>
          </form>
        </div>
      )}

      {/* ── Peer Review Dialog ── */}
      {reviewDialogOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto py-6">
          <div className="relative w-full max-w-lg mx-4 rounded-card border border-surface-200 bg-surface-0 shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
              <h2 className="text-heading-sm text-surface-900">Submit Peer Review</h2>
              <button onClick={() => setReviewDialogOpen(false)} className="p-1 rounded-lg text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-colors" aria-label="Close dialog">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {reviewSubmitted ? (
                <div className="text-center py-4">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-3">
                    <span className="text-xl text-green-600">✓</span>
                  </div>
                  <p className="text-body-sm font-medium text-surface-900">Review submitted</p>
                  <p className="mt-1 text-caption text-surface-500">Your peer review has been recorded.</p>
                  <button type="button" onClick={() => setReviewDialogOpen(false)} className="mt-4 rounded-lg bg-brand-600 px-4 py-2.5 text-body-sm font-medium text-white hover:bg-brand-700 transition-colors">Done</button>
                </div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); if (!reviewForm.feedback.trim()) return; setReviewSubmitted(true); }} className="space-y-4">
                  <div>
                    <label htmlFor="review-member" className="block text-body-sm font-medium text-surface-700 mb-1.5">Team Member</label>
                    <select id="review-member" value={reviewForm.member} onChange={(e) => setReviewForm((f) => ({ ...f, member: e.target.value }))} className="w-full rounded-lg border border-surface-300 px-3.5 py-2.5 text-body-sm text-surface-900 bg-surface-0 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors">
                      {mockMembers.map((m) => <option key={m.id} value={m.id}>{m.name} — {m.role}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="review-rating" className="block text-body-sm font-medium text-surface-700 mb-1.5">Rating (1–5)</label>
                    <select id="review-rating" value={reviewForm.rating} onChange={(e) => setReviewForm((f) => ({ ...f, rating: e.target.value }))} className="w-full rounded-lg border border-surface-300 px-3.5 py-2.5 text-body-sm text-surface-900 bg-surface-0 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors">
                      {[1, 2, 3, 4, 5].map((n) => <option key={n} value={String(n)}>{n}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="review-feedback" className="block text-body-sm font-medium text-surface-700 mb-1.5">Feedback <span className="text-status-error">*</span></label>
                    <textarea id="review-feedback" value={reviewForm.feedback} onChange={(e) => setReviewForm((f) => ({ ...f, feedback: e.target.value }))} placeholder="Share constructive feedback about their contribution..." rows={4} className="w-full rounded-lg border border-surface-300 px-3.5 py-2.5 text-body-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors resize-none" />
                  </div>
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button type="button" onClick={() => setReviewDialogOpen(false)} className="rounded-lg border border-surface-300 px-4 py-2.5 text-body-sm font-medium text-surface-700 hover:bg-surface-100 transition-colors">Cancel</button>
                    <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2.5 text-body-sm font-medium text-white hover:bg-brand-700 transition-colors">Submit Review</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
