"use client";
/** @file super-admin/workforce/page.tsx — Workforce Intelligence report page powered by the Workforce Agent. */

import { AgentReportPage } from "@/components/agent/agent-report-page";
import { generateWorkforceReport } from "@/lib/agent-api";

export default function WorkforcePage() {
  return (
    <AgentReportPage
      title="Workforce Intelligence"
      description="Generate hiring trend analysis, skill demand signals, and talent pipeline assessments using the Workforce Intelligence Agent."
      generateFn={() => generateWorkforceReport()}
    />
  );
}
