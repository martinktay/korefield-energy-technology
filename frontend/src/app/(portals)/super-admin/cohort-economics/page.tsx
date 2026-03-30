"use client";

/**
 * @file cohort-economics/page.tsx
 * Super Admin Cohort Economics Dashboard.
 * Displays per-cohort financial and AI cost metrics: revenue, AI cost,
 * gross margin ($ and %), AI cost per active learner, cache hit rate,
 * completion rate, and Foundation-to-Cohort conversion rate.
 * Fetches pre-aggregated data from GET /dashboard/cohort-economics.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import {
  DollarSign,
  Cpu,
  TrendingUp,
  Users,
  Zap,
  GraduationCap,
  ArrowRightLeft,
} from "lucide-react";

interface CohortSnapshot {
  id: string;
  cohortId: string;
  snapshotDate: string;
  totalRevenue: number;
  totalAiCost: number;
  grossMargin: number;
  grossMarginPct: number;
  activeLearners: number;
  aiCostPerLearner: number;
  cacheHitRate: number;
  completionRate: number;
  conversionRate: number;
}

interface CohortEconomicsResponse {
  data: CohortSnapshot[];
  status: string;
  message?: string;
}

/** Format a number as USD currency. */
function fmtUsd(value: number): string {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Format a decimal as a percentage string. */
function fmtPct(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export default function CohortEconomicsPage() {
  const [selectedCohort, setSelectedCohort] = useState<string>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "cohort-economics", selectedCohort],
    queryFn: () => {
      const params = selectedCohort !== "all" ? `?cohort_id=${selectedCohort}` : "";
      return apiFetch<CohortEconomicsResponse>(`/dashboard/cohort-economics${params}`);
    },
  });

  const snapshots = data?.data ?? [];
  const isPending = data?.status === "pending" || snapshots.length === 0;

  // Derive unique cohort IDs for the selector
  const cohortIds = Array.from(new Set(snapshots.map((s) => s.cohortId)));

  // Get the latest snapshot per cohort (most recent snapshot_date)
  const latestByCohort = new Map<string, CohortSnapshot>();
  for (const s of snapshots) {
    const existing = latestByCohort.get(s.cohortId);
    if (!existing || s.snapshotDate > existing.snapshotDate) {
      latestByCohort.set(s.cohortId, s);
    }
  }
  const displaySnapshots = Array.from(latestByCohort.values());

  // Aggregate for "All Cohorts" view
  const aggregate: CohortSnapshot | null =
    displaySnapshots.length > 0
      ? {
          id: "all",
          cohortId: "All Cohorts",
          snapshotDate: displaySnapshots[0].snapshotDate,
          totalRevenue: displaySnapshots.reduce((s, c) => s + c.totalRevenue, 0),
          totalAiCost: displaySnapshots.reduce((s, c) => s + c.totalAiCost, 0),
          grossMargin: displaySnapshots.reduce((s, c) => s + c.grossMargin, 0),
          grossMarginPct: 0,
          activeLearners: displaySnapshots.reduce((s, c) => s + c.activeLearners, 0),
          aiCostPerLearner: 0,
          cacheHitRate:
            displaySnapshots.reduce((s, c) => s + c.cacheHitRate, 0) /
            displaySnapshots.length,
          completionRate:
            displaySnapshots.reduce((s, c) => s + c.completionRate, 0) /
            displaySnapshots.length,
          conversionRate:
            displaySnapshots.reduce((s, c) => s + c.conversionRate, 0) /
            displaySnapshots.length,
        }
      : null;

  if (aggregate) {
    aggregate.grossMarginPct =
      aggregate.totalRevenue > 0
        ? ((aggregate.totalRevenue - aggregate.totalAiCost) / aggregate.totalRevenue) * 100
        : 0;
    aggregate.aiCostPerLearner =
      aggregate.activeLearners > 0
        ? aggregate.totalAiCost / aggregate.activeLearners
        : 0;
  }

  const cardsToShow =
    selectedCohort === "all" ? displaySnapshots : displaySnapshots.filter((s) => s.cohortId === selectedCohort);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 skeleton rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 skeleton rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-display-sm text-surface-900">Cohort Economics</h1>
          <p className="mt-1 text-body-lg text-surface-500">
            Per-cohort revenue, AI cost, and operational efficiency metrics.
          </p>
        </div>
        <select
          value={selectedCohort}
          onChange={(e) => setSelectedCohort(e.target.value)}
          className="rounded-xl border border-surface-200 bg-surface-0 px-4 py-2.5 text-body-sm text-surface-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          aria-label="Select cohort"
        >
          <option value="all">All Cohorts</option>
          {cohortIds.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </div>

      {isPending ? (
        <div className="rounded-2xl border border-surface-200 bg-surface-0 p-12 text-center shadow-card">
          <Cpu className="mx-auto h-12 w-12 text-surface-300" />
          <p className="mt-4 text-heading-sm text-surface-500">Data pending</p>
          <p className="mt-2 text-body-sm text-surface-400">
            Cohort economics data is being aggregated. Check back shortly.
          </p>
        </div>
      ) : (
        <>
          {/* Aggregate Summary (when viewing all) */}
          {selectedCohort === "all" && aggregate && (
            <section>
              <h2 className="text-heading-sm text-surface-900 mb-4">Platform Aggregate</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard icon={DollarSign} label="Total Revenue" value={fmtUsd(aggregate.totalRevenue)} />
                <MetricCard icon={Cpu} label="Total AI Cost" value={fmtUsd(aggregate.totalAiCost)} />
                <MetricCard icon={TrendingUp} label="Gross Margin" value={`${fmtUsd(aggregate.grossMargin)} (${aggregate.grossMarginPct.toFixed(1)}%)`} />
                <MetricCard icon={Users} label="Active Learners" value={String(aggregate.activeLearners)} />
              </div>
            </section>
          )}

          {/* Per-Cohort Cards */}
          <section>
            <h2 className="text-heading-sm text-surface-900 mb-4">
              {selectedCohort === "all" ? "Per-Cohort Breakdown" : `Cohort: ${selectedCohort}`}
            </h2>
            <div className="grid gap-6 lg:grid-cols-2">
              {cardsToShow.map((snapshot) => (
                <CohortCard key={snapshot.id} snapshot={snapshot} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-surface-200 bg-surface-0 p-4 shadow-card">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-surface-400" />
        <p className="text-caption text-surface-400">{label}</p>
      </div>
      <p className="text-heading-sm font-bold text-surface-900">{value}</p>
    </div>
  );
}

function CohortCard({ snapshot }: { snapshot: CohortSnapshot }) {
  return (
    <div className="rounded-2xl border border-surface-200 bg-surface-0 p-6 shadow-card hover:shadow-card-hover transition-all">
      <h3 className="text-body-lg font-semibold text-surface-900 mb-4">{snapshot.cohortId}</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <DollarSign className="h-3.5 w-3.5 text-accent-600" />
            <span className="text-caption text-surface-400">Revenue</span>
          </div>
          <p className="text-body-sm font-bold text-surface-900">{fmtUsd(snapshot.totalRevenue)}</p>
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Cpu className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-caption text-surface-400">AI Cost</span>
          </div>
          <p className="text-body-sm font-bold text-surface-900">{fmtUsd(snapshot.totalAiCost)}</p>
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="h-3.5 w-3.5 text-brand-600" />
            <span className="text-caption text-surface-400">Gross Margin</span>
          </div>
          <p className="text-body-sm font-bold text-surface-900">
            {fmtUsd(snapshot.grossMargin)} ({snapshot.grossMarginPct.toFixed(1)}%)
          </p>
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Users className="h-3.5 w-3.5 text-brand-500" />
            <span className="text-caption text-surface-400">AI Cost / Learner</span>
          </div>
          <p className="text-body-sm font-bold text-surface-900">{fmtUsd(snapshot.aiCostPerLearner)}</p>
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-caption text-surface-400">Cache Hit Rate</span>
          </div>
          <p className="text-body-sm font-bold text-surface-900">{fmtPct(snapshot.cacheHitRate)}</p>
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <GraduationCap className="h-3.5 w-3.5 text-accent-500" />
            <span className="text-caption text-surface-400">Completion Rate</span>
          </div>
          <p className="text-body-sm font-bold text-surface-900">{fmtPct(snapshot.completionRate)}</p>
        </div>
        <div className="col-span-2">
          <div className="flex items-center gap-1.5 mb-1">
            <ArrowRightLeft className="h-3.5 w-3.5 text-brand-400" />
            <span className="text-caption text-surface-400">Foundation → Cohort Conversion</span>
          </div>
          <p className="text-body-sm font-bold text-surface-900">{fmtPct(snapshot.conversionRate)}</p>
        </div>
      </div>
    </div>
  );
}
