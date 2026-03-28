"use client";
/** @file super-admin/strategy/page.tsx — Strategy Intelligence report page powered by the Strategy Agent. */

import { AgentReportPage } from "@/components/agent/agent-report-page";
import { generateStrategyReport } from "@/lib/agent-api";

export default function StrategyPage() {
  return (
    <AgentReportPage
      title="Strategy Intelligence"
      description="Generate competitive positioning, market gap analysis, and strategic recommendations using the Strategy Agent."
      generateFn={() => generateStrategyReport()}
    />
  );
}
