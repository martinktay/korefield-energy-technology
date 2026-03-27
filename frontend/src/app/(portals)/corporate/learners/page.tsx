/** @file corporate/learners/page.tsx — Sponsored learner tracking for corporate partners. */
"use client";

const mockLearners = [
  { id: "LRN-a1b2c3", name: "Ama Darko", track: "AI Engineering", progress: 65, status: "Active" },
  { id: "LRN-d4e5f6", name: "Yaw Boateng", track: "Data Science", progress: 40, status: "Active" },
  { id: "LRN-g7h8i9", name: "Efua Mensah", track: "Cybersecurity", progress: 90, status: "Active" },
  { id: "LRN-j0k1l2", name: "Kwesi Appiah", track: "AI Product Leadership", progress: 15, status: "Paused" },
];

export default function SponsoredLearnersPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-heading-lg text-surface-900">Sponsored Learners</h1>
      <p className="text-body-sm text-surface-500">Track progress and enrollment status of learners sponsored by your organization.</p>
      <div className="rounded-card border border-surface-200 bg-surface-0 shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-body-sm">
            <thead className="border-b border-surface-200 bg-surface-50">
              <tr>
                <th className="px-4 py-3 text-surface-600 font-medium">Learner</th>
                <th className="px-4 py-3 text-surface-600 font-medium">Track</th>
                <th className="px-4 py-3 text-surface-600 font-medium">Progress</th>
                <th className="px-4 py-3 text-surface-600 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200">
              {mockLearners.map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-3 text-surface-900">{l.name}</td>
                  <td className="px-4 py-3 text-surface-700">{l.track}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 rounded-full bg-surface-200">
                        <div className="h-2 rounded-full bg-brand-600" style={{ width: `${l.progress}%` }} />
                      </div>
                      <span className="text-caption text-surface-500">{l.progress}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-caption ${l.status === "Active" ? "bg-green-100 text-green-700" : "bg-surface-100 text-surface-600"}`}>
                      {l.status}
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
