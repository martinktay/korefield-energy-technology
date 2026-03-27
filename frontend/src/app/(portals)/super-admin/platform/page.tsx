/** @file super-admin/platform/page.tsx — Platform health dashboard with system metrics, uptime, and resource utilization. */
"use client";

const mockPlatformMetrics = [
  { label: "Concurrent Users", value: "847" },
  { label: "API Latency (Avg)", value: "142ms" },
  { label: "API Latency (p95)", value: "380ms" },
  { label: "Error Rate", value: "0.12%" },
  { label: "System Uptime", value: "99.97%" },
];

const mockQueueHealth = [
  { queue: "cert-generation", depth: 3, processingRate: "12/min", failed: 0 },
  { queue: "ai-workflows", depth: 8, processingRate: "45/min", failed: 2 },
  { queue: "batch-analytics", depth: 1, processingRate: "6/min", failed: 0 },
  { queue: "email-notifications", depth: 15, processingRate: "120/min", failed: 1 },
];

const mockServiceHealth = [
  { service: "Frontend (Next.js)", status: "Healthy", instances: 3 },
  { service: "Backend API (NestJS)", status: "Healthy", instances: 4 },
  { service: "AI Services (FastAPI)", status: "Healthy", instances: 2 },
  { service: "Workers", status: "Healthy", instances: 3 },
  { service: "Payment Gateway", status: "Healthy", instances: 1 },
  { service: "Cloudflare Stream", status: "Healthy", instances: 1 },
];

export default function PlatformPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-heading-lg text-surface-900">Platform Intelligence</h1>
      <p className="text-body-sm text-surface-500">
        Concurrent users, API latency, queue health, system uptime, video usage, and payment gateway health.
      </p>

      {/* Platform KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {mockPlatformMetrics.map((m) => (
          <div key={m.label} className="rounded-card border border-surface-200 bg-surface-0 p-4 shadow-card">
            <p className="text-caption text-surface-500">{m.label}</p>
            <p className="text-heading-sm text-surface-900 mt-1">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Queue Health */}
      <section aria-labelledby="queue-health">
        <h2 id="queue-health" className="text-heading-sm text-surface-900 mb-3">Queue Health</h2>
        <div className="rounded-card border border-surface-200 bg-surface-0 shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-body-sm">
              <thead className="border-b border-surface-200 bg-surface-50">
                <tr>
                  <th className="px-4 py-3 text-surface-600 font-medium">Queue</th>
                  <th className="px-4 py-3 text-surface-600 font-medium">Depth</th>
                  <th className="px-4 py-3 text-surface-600 font-medium">Processing Rate</th>
                  <th className="px-4 py-3 text-surface-600 font-medium">Failed Jobs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200">
                {mockQueueHealth.map((q) => (
                  <tr key={q.queue}>
                    <td className="px-4 py-3 font-mono text-surface-900">{q.queue}</td>
                    <td className="px-4 py-3 text-surface-700">{q.depth}</td>
                    <td className="px-4 py-3 text-surface-700">{q.processingRate}</td>
                    <td className="px-4 py-3">
                      <span className={q.failed > 0 ? "text-red-600" : "text-green-600"}>{q.failed}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Service Health */}
      <section aria-labelledby="service-health">
        <h2 id="service-health" className="text-heading-sm text-surface-900 mb-3">Service Health</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mockServiceHealth.map((s) => (
            <div key={s.service} className="rounded-card border border-surface-200 bg-surface-0 p-4 shadow-card">
              <div className="flex items-center justify-between">
                <p className="text-body-sm text-surface-900">{s.service}</p>
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-caption text-green-700">{s.status}</span>
              </div>
              <p className="text-caption text-surface-500 mt-1">{s.instances} instance(s)</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
