/** @file super-admin/market/page.tsx — Market intelligence dashboard with competitor pricing and expansion opportunity analysis. */
"use client";

const mockCompetitorPricing = [
  { competitor: "Platform A", aiEngineering: "$1,500", dataScience: "$1,200", cyber: "$1,400" },
  { competitor: "Platform B", aiEngineering: "$2,000", dataScience: "$1,800", cyber: "$1,600" },
  { competitor: "KoreField", aiEngineering: "$1,200", dataScience: "$1,000", cyber: "$1,100" },
];

const mockDemandSignals = [
  { track: "AI Engineering", searchVolume: "High ↑", waitlistGrowth: "+23%", inquiries: 145 },
  { track: "Data Science", searchVolume: "Medium →", waitlistGrowth: "+12%", inquiries: 98 },
  { track: "Cybersecurity", searchVolume: "High ↑", waitlistGrowth: "+31%", inquiries: 167 },
  { track: "AI Product Leadership", searchVolume: "Medium ↑", waitlistGrowth: "+8%", inquiries: 72 },
];

const mockAlerts = [
  { id: "1", title: "Nigeria NDPR enforcement update", type: "Regulation", date: "2025-02-14", priority: "High" },
  { id: "2", title: "AI Engineer demand surge in East Africa", type: "Hiring Trend", date: "2025-02-13", priority: "Medium" },
  { id: "3", title: "New competitor launched in West Africa", type: "Competition", date: "2025-02-12", priority: "High" },
];

const mockExpansion = [
  { region: "East Africa — Tanzania", waitlistRatio: "3.2:1", score: 87, signal: "Strong" },
  { region: "Southern Africa — Mozambique", waitlistRatio: "2.8:1", score: 74, signal: "Moderate" },
  { region: "North Africa — Morocco", waitlistRatio: "2.1:1", score: 68, signal: "Moderate" },
];

export default function MarketPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-heading-lg text-surface-900">Market Intelligence</h1>
      <p className="text-body-sm text-surface-500">
        Competitor pricing, track demand signals, hiring trends, policy alerts, expansion opportunities, and executive reports.
      </p>

      {/* Competitor Pricing */}
      <section aria-labelledby="competitor-pricing">
        <h2 id="competitor-pricing" className="text-heading-sm text-surface-900 mb-3">Competitor Pricing</h2>
        <div className="rounded-card border border-surface-200 bg-surface-0 shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-body-sm">
              <thead className="border-b border-surface-200 bg-surface-50">
                <tr>
                  <th className="px-4 py-3 text-surface-600 font-medium">Platform</th>
                  <th className="px-4 py-3 text-surface-600 font-medium">AI Engineering</th>
                  <th className="px-4 py-3 text-surface-600 font-medium">Data Science</th>
                  <th className="px-4 py-3 text-surface-600 font-medium">Cybersecurity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200">
                {mockCompetitorPricing.map((c) => (
                  <tr key={c.competitor}>
                    <td className="px-4 py-3 text-surface-900">{c.competitor}</td>
                    <td className="px-4 py-3 text-surface-700">{c.aiEngineering}</td>
                    <td className="px-4 py-3 text-surface-700">{c.dataScience}</td>
                    <td className="px-4 py-3 text-surface-700">{c.cyber}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Track Demand Signals */}
      <section aria-labelledby="demand-signals">
        <h2 id="demand-signals" className="text-heading-sm text-surface-900 mb-3">Track Demand Signals</h2>
        <div className="rounded-card border border-surface-200 bg-surface-0 shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-body-sm">
              <thead className="border-b border-surface-200 bg-surface-50">
                <tr>
                  <th className="px-4 py-3 text-surface-600 font-medium">Track</th>
                  <th className="px-4 py-3 text-surface-600 font-medium">Search Volume</th>
                  <th className="px-4 py-3 text-surface-600 font-medium">Waitlist Growth</th>
                  <th className="px-4 py-3 text-surface-600 font-medium">Inquiries</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200">
                {mockDemandSignals.map((d) => (
                  <tr key={d.track}>
                    <td className="px-4 py-3 text-surface-900">{d.track}</td>
                    <td className="px-4 py-3 text-surface-700">{d.searchVolume}</td>
                    <td className="px-4 py-3 text-surface-700">{d.waitlistGrowth}</td>
                    <td className="px-4 py-3 text-surface-700">{d.inquiries}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Market Alerts */}
      <section aria-labelledby="market-alerts">
        <h2 id="market-alerts" className="text-heading-sm text-surface-900 mb-3">Market Alerts</h2>
        <div className="rounded-card border border-surface-200 bg-surface-0 shadow-card">
          <ul className="divide-y divide-surface-200" role="list">
            {mockAlerts.map((a) => (
              <li key={a.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <span className="text-body-sm text-surface-900">{a.title}</span>
                  <p className="text-caption text-surface-500">{a.type}</p>
                </div>
                <div className="text-right">
                  <span className={`rounded-full px-2 py-0.5 text-caption ${
                    a.priority === "High" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                  }`}>
                    {a.priority}
                  </span>
                  <p className="text-caption text-surface-500 mt-1">{a.date}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Expansion Opportunities */}
      <section aria-labelledby="expansion">
        <h2 id="expansion" className="text-heading-sm text-surface-900 mb-3">Expansion Opportunities</h2>
        <div className="rounded-card border border-surface-200 bg-surface-0 shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-body-sm">
              <thead className="border-b border-surface-200 bg-surface-50">
                <tr>
                  <th className="px-4 py-3 text-surface-600 font-medium">Region</th>
                  <th className="px-4 py-3 text-surface-600 font-medium">Waitlist Ratio</th>
                  <th className="px-4 py-3 text-surface-600 font-medium">Relevance Score</th>
                  <th className="px-4 py-3 text-surface-600 font-medium">Signal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200">
                {mockExpansion.map((e) => (
                  <tr key={e.region}>
                    <td className="px-4 py-3 text-surface-900">{e.region}</td>
                    <td className="px-4 py-3 text-surface-700">{e.waitlistRatio}</td>
                    <td className="px-4 py-3 text-surface-700">{e.score}/100</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-caption ${
                        e.signal === "Strong" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        {e.signal}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* AI Executive Reports */}
      <section aria-labelledby="ai-reports">
        <h2 id="ai-reports" className="text-heading-sm text-surface-900 mb-3">AI Executive Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/super-admin/strategy"
            className="rounded-card border border-surface-200 bg-surface-0 shadow-card p-5 hover:shadow-md transition-shadow"
          >
            <h3 className="text-body-sm font-medium text-surface-900 mb-1">Strategy Intelligence</h3>
            <p className="text-caption text-surface-500">
              Generate competitive positioning, market gap analysis, and strategic recommendations using the Strategy Agent.
            </p>
          </a>
          <a
            href="/super-admin/growth"
            className="rounded-card border border-surface-200 bg-surface-0 shadow-card p-5 hover:shadow-md transition-shadow"
          >
            <h3 className="text-body-sm font-medium text-surface-900 mb-1">Growth Intelligence</h3>
            <p className="text-caption text-surface-500">
              Generate acquisition channel analysis, conversion funnel insights, and viral loop strategies using the Growth Agent.
            </p>
          </a>
        </div>
      </section>
    </div>
  );
}
