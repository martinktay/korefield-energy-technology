"use client";
/** @file super-admin/growth/page.tsx — Growth Intelligence report page powered by the Growth Agent. */

import { AgentReportPage } from "@/components/agent/agent-report-page";
import { generateGrowthReport } from "@/lib/agent-api";

export default function GrowthPage() {
  return (
    <AgentReportPage
      title="Growth Intelligence"
      description="Generate acquisition channel analysis, conversion funnel insights, and viral loop strategies using the Growth Agent."
      generateFn={() => generateGrowthReport()}
    />
  );
}
