/** @file instructor/grading/page.tsx — Grading queue showing pending submissions for performance gates and labs. */
"use client";

const mockSubmissions = [
  { id: "SUB-001", learner: "Ngozi Eze", type: "Performance Gate", module: "Module 2", submitted: "2025-02-14", status: "Pending" },
  { id: "SUB-002", learner: "Tendai Moyo", type: "Lab Submission", module: "Module 3", submitted: "2025-02-13", status: "Pending" },
  { id: "SUB-003", learner: "Aisha Diallo", type: "Quiz", module: "Module 1", submitted: "2025-02-12", status: "Pending" },
  { id: "SUB-004", learner: "Kofi Mensah", type: "Performance Gate", module: "Module 4", submitted: "2025-02-11", status: "In Review" },
];

export default function GradingPage() {
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
