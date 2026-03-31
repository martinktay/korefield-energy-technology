/**
 * Seed script for cohort economics snapshot data.
 *
 * Populates the cohort_economics_snapshots table with realistic demo data
 * so the Super Admin Cohort Economics dashboard renders immediately in
 * local dev without needing the Analytics Worker to aggregate from live data.
 *
 * Seeds 4 cohorts (one per track) with 6 monthly snapshots each, showing
 * realistic revenue, AI cost, margin, and operational efficiency trends.
 *
 * Idempotent — uses INSERT ... ON CONFLICT DO NOTHING.
 *
 * Usage: cd backend && pnpm ts-node --transpile-only ../db/seeds/seed-cohort-economics.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CohortSeed {
  cohortId: string;
  trackName: string;
  baseLearners: number;
  baseRevenue: number;
  baseAiCost: number;
}

const cohorts: CohortSeed[] = [
  {
    cohortId: 'COH-ai-eng-2025Q1',
    trackName: 'AI Engineering and Intelligent Systems',
    baseLearners: 42,
    baseRevenue: 126000,
    baseAiCost: 847.32,
  },
  {
    cohortId: 'COH-data-sci-2025Q1',
    trackName: 'Data Science and Decision Intelligence',
    baseLearners: 38,
    baseRevenue: 98800,
    baseAiCost: 623.18,
  },
  {
    cohortId: 'COH-cyber-2025Q1',
    trackName: 'Cybersecurity and AI Security',
    baseLearners: 31,
    baseRevenue: 80600,
    baseAiCost: 412.55,
  },
  {
    cohortId: 'COH-product-2025Q1',
    trackName: 'AI Product and Project Leadership',
    baseLearners: 27,
    baseRevenue: 70200,
    baseAiCost: 358.91,
  },
];

// Generate 6 monthly snapshots per cohort (Oct 2025 → Mar 2026)
function generateSnapshots() {
  const snapshots: Array<{
    id: string;
    cohort_id: string;
    snapshot_date: string;
    total_revenue: number;
    total_ai_cost: number;
    gross_margin: number;
    gross_margin_pct: number;
    active_learners: number;
    ai_cost_per_learner: number;
    cache_hit_rate: number;
    completion_rate: number;
    conversion_rate: number;
  }> = [];

  const months = [
    '2025-10-01', '2025-11-01', '2025-12-01',
    '2026-01-01', '2026-02-01', '2026-03-01',
  ];

  for (const cohort of cohorts) {
    for (let i = 0; i < months.length; i++) {
      const monthFactor = 1 + i * 0.08; // Revenue grows ~8% per month
      const aiCostDecay = 1 - i * 0.05; // AI cost per learner drops as cache warms
      const completionGrowth = Math.min(0.12 + i * 0.14, 0.92);
      const cacheImprovement = Math.min(0.45 + i * 0.08, 0.89);

      const revenue = Math.round(cohort.baseRevenue * monthFactor * 100) / 100;
      const aiCost = Math.round(cohort.baseAiCost * monthFactor * aiCostDecay * 100) / 100;
      const margin = Math.round((revenue - aiCost) * 100) / 100;
      const marginPct = Math.round((margin / revenue) * 10000) / 100;
      const learners = cohort.baseLearners + Math.floor(i * 2.5);
      const costPerLearner = Math.round((aiCost / learners) * 1000000) / 1000000;

      const snapshotId = `CES-${cohort.cohortId}-${months[i].slice(0, 7)}`;

      snapshots.push({
        id: snapshotId,
        cohort_id: cohort.cohortId,
        snapshot_date: months[i],
        total_revenue: revenue,
        total_ai_cost: aiCost,
        gross_margin: margin,
        gross_margin_pct: marginPct,
        active_learners: learners,
        ai_cost_per_learner: costPerLearner,
        cache_hit_rate: Math.round(cacheImprovement * 10000) / 10000,
        completion_rate: Math.round(completionGrowth * 10000) / 10000,
        conversion_rate: Math.round((0.62 + i * 0.03) * 10000) / 10000,
      });
    }
  }

  return snapshots;
}

async function main() {
  console.log('Seeding cohort economics snapshots...');

  const snapshots = generateSnapshots();

  for (const s of snapshots) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO cohort_economics_snapshots
        (id, cohort_id, snapshot_date, total_revenue, total_ai_cost,
         gross_margin, gross_margin_pct, active_learners, ai_cost_per_learner,
         cache_hit_rate, completion_rate, conversion_rate)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (cohort_id, snapshot_date) DO NOTHING`,
      s.id, s.cohort_id, s.snapshot_date,
      s.total_revenue, s.total_ai_cost,
      s.gross_margin, s.gross_margin_pct,
      s.active_learners, s.ai_cost_per_learner,
      s.cache_hit_rate, s.completion_rate, s.conversion_rate,
    );
  }

  console.log(`Seeded ${snapshots.length} cohort economics snapshots (${cohorts.length} cohorts × 6 months).`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
