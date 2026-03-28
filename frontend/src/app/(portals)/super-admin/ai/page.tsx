/** @file super-admin/ai/page.tsx — AI agent ecosystem dashboard with usage metrics, latency, and guardrail trigger rates. */
"use client";

const mockAgentCategories = [
  {
    category: "Learner-Side Agents",
    agents: [
      { name: "Tutor Agent", workflows: 4521, traces: 4521, failures: 12, failRate: "0.27%" },
      { name: "Assignment Feedback Agent", workflows: 2834, traces: 2834, failures: 8, failRate: "0.28%" },
      { name: "Dropout Risk Agent", workflows: 1247, traces: 1247, failures: 3, failRate: "0.24%" },
      { name: "Career Support Agent", workflows: 892, traces: 892, failures: 5, failRate: "0.56%" },
    ],
  },
  {
    category: "Faculty-Side Agents",
    agents: [
      { name: "Instructor Insight Agent", workflows: 456, traces: 456, failures: 2, failRate: "0.44%" },
      { name: "Assessor Support Agent", workflows: 312, traces: 312, failures: 1, failRate: "0.32%" },
      { name: "Certification Validation Agent", workflows: 189, traces: 189, failures: 0, failRate: "0.00%" },
    ],
  },
  {
    category: "Executive-Side Agents",
    agents: [
      { name: "Market Intelligence Agent", workflows: 78, traces: 78, failures: 1, failRate: "1.28%" },
      { name: "Pricing Intelligence Agent", workflows: 124, traces: 124, failures: 0, failRate: "0.00%" },
      { name: "Expansion Opportunity Agent", workflows: 45, traces: 45, failures: 0, failRate: "0.00%" },
      { name: "Academic Performance Agent", workflows: 67, traces: 67, failures: 1, failRate: "1.49%" },
      { name: "Strategy Report Agent", workflows: 34, traces: 34, failures: 0, failRate: "0.00%" },
      { name: "Growth Report Agent", workflows: 29, traces: 29, failures: 1, failRate: "3.45%" },
      { name: "Product Strategy Agent", workflows: 22, traces: 22, failures: 0, failRate: "0.00%" },
      { name: "Workforce Intelligence Agent", workflows: 18, traces: 18, failures: 0, failRate: "0.00%" },
    ],
  },
];

const mockPromptMetrics = [
  { prompt: "tutor/lesson_delivery", version: "v3.2", failRate: "0.3%", avgLatency: "1.2s" },
  { prompt: "feedback/assignment_review", version: "v2.1", failRate: "0.5%", avgLatency: "2.1s" },
  { prompt: "career/guidance", version: "v1.4", failRate: "0.8%", avgLatency: "1.8s" },
];

export default function AIPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-heading-lg text-surface-900">AI Intelligence</h1>
      <p className="text-body-sm text-surface-500">
        Workflow volume, LangSmith trace counts, failure rates by agent and workflow type. Prompt debugging metrics.
      </p>

      {/* Agent Categories */}
      {mockAgentCategories.map((cat) => (
        <section key={cat.category} aria-labelledby={`cat-${cat.category}`}>
          <h2 id={`cat-${cat.category}`} className="text-heading-sm text-surface-900 mb-3">{cat.category}</h2>
          <div className="rounded-card border border-surface-200 bg-surface-0 shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-body-sm">
                <thead className="border-b border-surface-200 bg-surface-50">
                  <tr>
                    <th className="px-4 py-3 text-surface-600 font-medium">Agent</th>
                    <th className="px-4 py-3 text-surface-600 font-medium">Workflows</th>
                    <th className="px-4 py-3 text-surface-600 font-medium">Traces</th>
                    <th className="px-4 py-3 text-surface-600 font-medium">Failures</th>
                    <th className="px-4 py-3 text-surface-600 font-medium">Fail Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-200">
                  {cat.agents.map((a) => (
                    <tr key={a.name}>
                      <td className="px-4 py-3 text-surface-900">{a.name}</td>
                      <td className="px-4 py-3 text-surface-700">{a.workflows.toLocaleString()}</td>
                      <td className="px-4 py-3 text-surface-700">{a.traces.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={a.failures > 0 ? "text-red-600" : "text-green-600"}>{a.failures}</span>
                      </td>
                      <td className="px-4 py-3 text-surface-700">{a.failRate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ))}

      {/* Prompt Debugging */}
      <section aria-labelledby="prompt-debug">
        <h2 id="prompt-debug" className="text-heading-sm text-surface-900 mb-3">Prompt Debugging Metrics</h2>
        <div className="rounded-card border border-surface-200 bg-surface-0 shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-body-sm">
              <thead className="border-b border-surface-200 bg-surface-50">
                <tr>
                  <th className="px-4 py-3 text-surface-600 font-medium">Prompt</th>
                  <th className="px-4 py-3 text-surface-600 font-medium">Version</th>
                  <th className="px-4 py-3 text-surface-600 font-medium">Fail Rate</th>
                  <th className="px-4 py-3 text-surface-600 font-medium">Avg Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200">
                {mockPromptMetrics.map((p) => (
                  <tr key={p.prompt}>
                    <td className="px-4 py-3 font-mono text-surface-900">{p.prompt}</td>
                    <td className="px-4 py-3 text-surface-700">{p.version}</td>
                    <td className="px-4 py-3 text-surface-700">{p.failRate}</td>
                    <td className="px-4 py-3 text-surface-700">{p.avgLatency}</td>
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
