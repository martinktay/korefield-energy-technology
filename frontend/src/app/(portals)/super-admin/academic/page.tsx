/** @file super-admin/academic/page.tsx — Academic performance dashboard with gate pass rates and dropout risk metrics. */
"use client";

const mockGatePassRates = [
  { track: "AI Engineering", beginner: "89%", intermediate: "76%", advanced: "68%" },
  { track: "Data Science", beginner: "85%", intermediate: "72%", advanced: "64%" },
  { track: "Cybersecurity", beginner: "91%", intermediate: "78%", advanced: "71%" },
  { track: "AI Product Leadership", beginner: "87%", intermediate: "74%", advanced: "66%" },
];

const mockAcademicKPIs = [
  { label: "Avg Gate Pass Rate", value: "78%" },
  { label: "Remediation Count (MTD)", value: "47" },
  { label: "Certifications (MTD)", value: "34" },
  { label: "Pod Productivity (Avg)", value: "82%" },
  { label: "Assessor Workload (Avg)", value: "24 learners" },
];

export default function AcademicPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-heading-lg text-surface-900">Academic Intelligence</h1>
      <p className="text-body-sm text-surface-500">
        Performance gate pass rates, remediation counts, certification volume, pod productivity, and assessor workload metrics.
      </p>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {mockAcademicKPIs.map((m) => (
          <div key={m.label} className="rounded-card border border-surface-200 bg-surface-0 p-4 shadow-card">
            <p className="text-caption text-surface-500">{m.label}</p>
            <p className="text-heading-sm text-surface-900 mt-1">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Gate Pass Rates by Track/Level */}
      <section aria-labelledby="gate-rates">
        <h2 id="gate-rates" className="text-heading-sm text-surface-900 mb-3">Performance Gate Pass Rates</h2>
        <div className="rounded-card border border-surface-200 bg-surface-0 shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-body-sm">
              <thead className="border-b border-surface-200 bg-surface-50">
                <tr>
                  <th className="px-4 py-3 text-surface-600 font-medium">Track</th>
                  <th className="px-4 py-3 text-surface-600 font-medium">Beginner</th>
                  <th className="px-4 py-3 text-surface-600 font-medium">Intermediate</th>
                  <th className="px-4 py-3 text-surface-600 font-medium">Advanced</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200">
                {mockGatePassRates.map((r) => (
                  <tr key={r.track}>
                    <td className="px-4 py-3 text-surface-900">{r.track}</td>
                    <td className="px-4 py-3 text-surface-700">{r.beginner}</td>
                    <td className="px-4 py-3 text-surface-700">{r.intermediate}</td>
                    <td className="px-4 py-3 text-surface-700">{r.advanced}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
