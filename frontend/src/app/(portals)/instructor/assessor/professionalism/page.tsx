/** @file assessor/professionalism/page.tsx — Professionalism coaching dashboard tracking 5 discipline dimensions. */
"use client";

const dimensions = ["Communication", "Accountability", "Collaboration", "Documentation", "Learning Discipline"];

const mockScores = [
  { id: "LRN-001", name: "Ngozi Eze", pod: "Pod Zambezi", scores: [4, 5, 4, 3, 4] },
  { id: "LRN-002", name: "Tendai Moyo", pod: "Pod Zambezi", scores: [3, 3, 4, 4, 3] },
  { id: "LRN-003", name: "Aisha Diallo", pod: "Pod Limpopo", scores: [5, 4, 3, 4, 5] },
  { id: "LRN-004", name: "Kofi Mensah", pod: "Pod Limpopo", scores: [2, 2, 3, 2, 3] },
];

export default function ProfessionalismPage() {
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
                <th className="px-4 py-3 text-surface-600 font-medium">Learner</th>
                <th className="px-4 py-3 text-surface-600 font-medium">Pod</th>
                {dimensions.map((d) => (
                  <th key={d} className="px-4 py-3 text-surface-600 font-medium">{d}</th>
                ))}
                <th className="px-4 py-3 text-surface-600 font-medium">Avg</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200">
              {mockScores.map((learner) => {
                const avg = (learner.scores.reduce((a, b) => a + b, 0) / learner.scores.length).toFixed(1);
                return (
                  <tr key={learner.id}>
                    <td className="px-4 py-3 text-surface-900">{learner.name}</td>
                    <td className="px-4 py-3 text-surface-700">{learner.pod}</td>
                    {learner.scores.map((score, i) => (
                      <td key={i} className={`px-4 py-3 ${score <= 2 ? "text-red-600" : "text-surface-700"}`}>
                        {score}/5
                      </td>
                    ))}
                    <td className="px-4 py-3 font-medium text-surface-900">{avg}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
