/** @file assessor/pods/page.tsx — Detailed pod supervision view with member roles and deliverable tracking. */
"use client";

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
        </section>
      ))}
    </div>
  );
}
