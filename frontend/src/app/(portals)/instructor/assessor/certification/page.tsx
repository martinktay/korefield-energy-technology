/** @file assessor/certification/page.tsx — Certification validation page for reviewing eligibility and approving candidates. */
"use client";

const mockCandidates = [
  { id: "LRN-001", name: "Ngozi Eze", track: "AI Engineering", capstoneStatus: "Passed", paymentClear: true, recommendation: "Pending" },
  { id: "LRN-003", name: "Aisha Diallo", track: "Data Science", capstoneStatus: "Passed", paymentClear: true, recommendation: "Approved" },
  { id: "LRN-005", name: "Halima Yusuf", track: "Cybersecurity", capstoneStatus: "In Progress", paymentClear: false, recommendation: "Not Ready" },
  { id: "LRN-006", name: "Yemi Adeyemi", track: "AI Product Leadership", capstoneStatus: "Passed", paymentClear: true, recommendation: "Withheld" },
];

export default function CertificationPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-heading-lg text-surface-900">Certification Controls</h1>
      <p className="text-body-sm text-surface-500">
        Validate capstone readiness, approve or withhold certification, and record formal recommendations. Certification Validation Agent results shown for reference.
      </p>

      <div className="rounded-card border border-surface-200 bg-surface-0 shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-body-sm">
            <thead className="border-b border-surface-200 bg-surface-50">
              <tr>
                <th className="px-4 py-3 text-surface-600 font-medium">Learner</th>
                <th className="px-4 py-3 text-surface-600 font-medium">Track</th>
                <th className="px-4 py-3 text-surface-600 font-medium">Capstone</th>
                <th className="px-4 py-3 text-surface-600 font-medium">Payment</th>
                <th className="px-4 py-3 text-surface-600 font-medium">Recommendation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200">
              {mockCandidates.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 text-surface-900">{c.name}</td>
                  <td className="px-4 py-3 text-surface-700">{c.track}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-caption ${
                      c.capstoneStatus === "Passed" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {c.capstoneStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-caption ${c.paymentClear ? "text-green-600" : "text-red-600"}`}>
                      {c.paymentClear ? "Clear" : "Outstanding"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-caption ${
                      c.recommendation === "Approved" ? "bg-green-100 text-green-700" :
                      c.recommendation === "Withheld" ? "bg-red-100 text-red-700" :
                      c.recommendation === "Not Ready" ? "bg-surface-100 text-surface-600" :
                      "bg-amber-100 text-amber-700"
                    }`}>
                      {c.recommendation}
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
