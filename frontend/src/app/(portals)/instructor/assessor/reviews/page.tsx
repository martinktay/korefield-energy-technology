/** @file assessor/reviews/page.tsx — Performance review queue for assessor evaluation of learner submissions. */
"use client";

const mockReviews = [
  { id: "REV-001", learner: "Ngozi Eze", pod: "Pod Zambezi", type: "Milestone 3", submitted: "2025-02-10", daysWaiting: 5, aiScore: 78 },
  { id: "REV-002", learner: "Aisha Diallo", pod: "Pod Limpopo", type: "Capstone Draft", submitted: "2025-02-08", daysWaiting: 7, aiScore: 65 },
  { id: "REV-003", learner: "Halima Yusuf", pod: "Pod Volta", type: "Milestone 4", submitted: "2025-02-12", daysWaiting: 3, aiScore: 85 },
  { id: "REV-004", learner: "Tendai Moyo", pod: "Pod Zambezi", type: "Lab Submission", submitted: "2025-02-05", daysWaiting: 10, aiScore: 72 },
];

export default function ReviewsPage() {
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
