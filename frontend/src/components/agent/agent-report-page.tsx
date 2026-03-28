"use client";
/** @file agent-report-page.tsx — Shared report page component for executive AI agent dashboards. */

import { useState } from "react";
import type { AgentReportResponse } from "@/lib/agent-api";
import { ConfidenceBadge } from "./confidence-badge";

type PageState = "idle" | "loading" | "success" | "error";

interface AgentReportPageProps {
  title: string;
  description: string;
  generateFn: () => Promise<AgentReportResponse>;
}

export function AgentReportPage({ title, description, generateFn }: AgentReportPageProps) {
  const [state, setState] = useState<PageState>("idle");
  const [data, setData] = useState<AgentReportResponse | null>(null);
  const [error, setError] = useState<string>("");
  const [errorStatus, setErrorStatus] = useState<number | null>(null);

  async function handleGenerate() {
    setState("loading");
    setError("");
    setErrorStatus(null);
    try {
      const result = await generateFn();
      setData(result);
      setState("success");
    } catch (err: unknown) {
      const e = err as Error & { status?: number };
      setError(e.message || "Report generation failed");
      setErrorStatus(e.status ?? null);
      setState("error");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-heading-lg text-surface-900">{title}</h1>
        <p className="text-body-sm text-surface-500 mt-1">{description}</p>
      </div>

      {/* Idle / Empty state */}
      {state === "idle" && (
        <div className="rounded-card border border-surface-200 bg-surface-0 shadow-card p-8 text-center">
          <p className="text-body-sm text-surface-500 mb-4">{description}</p>
          <button
            onClick={handleGenerate}
            className="inline-flex items-center rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-brand-700 transition-colors"
          >
            Generate Report
          </button>
        </div>
      )}

      {/* Loading state */}
      {state === "loading" && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-card border border-surface-200 bg-surface-0 shadow-card p-6 animate-pulse">
              <div className="h-4 bg-surface-200 rounded w-1/3 mb-3" />
              <div className="h-3 bg-surface-200 rounded w-full mb-2" />
              <div className="h-3 bg-surface-200 rounded w-5/6 mb-2" />
              <div className="h-3 bg-surface-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {state === "error" && (
        <div className="rounded-card border border-red-200 bg-red-50 shadow-card p-6">
          <p className="text-body-sm text-red-700 mb-4">{error}</p>
          {errorStatus !== 403 && (
            <button
              onClick={handleGenerate}
              className="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Success state */}
      {state === "success" && data && (
        <>
          {/* Report sections */}
          <div className="space-y-4">
            {data.sections.map((section, idx) => (
              <section
                key={idx}
                className="rounded-card border border-surface-200 bg-surface-0 shadow-card p-6"
              >
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-heading-sm text-surface-900">{section.title}</h2>
                  <ConfidenceBadge confidence={section.confidence} />
                </div>
                <p className="text-body-sm text-surface-700 whitespace-pre-line">{section.content}</p>
                {section.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-surface-200">
                    <p className="text-caption text-surface-500 mb-1">Sources</p>
                    <ul className="list-disc list-inside text-caption text-surface-500 space-y-0.5">
                      {section.sources.map((src, si) => (
                        <li key={si}>{src}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            ))}
          </div>

          {/* Metadata card */}
          <div className="rounded-card border border-surface-200 bg-surface-50 shadow-card p-4">
            <h3 className="text-caption font-medium text-surface-600 mb-2">Report Metadata</h3>
            <div className="grid grid-cols-3 gap-4 text-caption text-surface-700">
              <div>
                <span className="text-surface-500">Report ID</span>
                <p className="font-mono">{data.report_id}</p>
              </div>
              <div>
                <span className="text-surface-500">Steps Executed</span>
                <p>{data.workflow_steps_executed}</p>
              </div>
              <div>
                <span className="text-surface-500">Duration</span>
                <p>{data.telemetry.duration_ms.toLocaleString()} ms</p>
              </div>
            </div>
          </div>

          {/* Generate another */}
          <div className="text-center">
            <button
              onClick={handleGenerate}
              className="inline-flex items-center rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-brand-700 transition-colors"
            >
              Generate New Report
            </button>
          </div>
        </>
      )}
    </div>
  );
}
