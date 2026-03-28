"use client";
/** @file super-admin/product/page.tsx — Product Strategy report page powered by the Product Agent. */

import { AgentReportPage } from "@/components/agent/agent-report-page";
import { generateProductReport } from "@/lib/agent-api";

export default function ProductPage() {
  return (
    <AgentReportPage
      title="Product Strategy"
      description="Generate feature prioritization, user journey optimization, and product roadmap insights using the Product Strategy Agent."
      generateFn={() => generateProductReport()}
    />
  );
}
