/** @file seed-cohort-economics.js — Seeds cohort economics snapshot data for dev. */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const cohorts = [
  { id: 'COH-ai-eng-2025Q1', base: 42, rev: 126000, ai: 847.32 },
  { id: 'COH-data-sci-2025Q1', base: 38, rev: 98800, ai: 623.18 },
  { id: 'COH-cyber-2025Q1', base: 31, rev: 80600, ai: 412.55 },
  { id: 'COH-product-2025Q1', base: 27, rev: 70200, ai: 358.91 },
];

const months = ['2025-10-01','2025-11-01','2025-12-01','2026-01-01','2026-02-01','2026-03-01'];

async function main() {
  let count = 0;
  for (const c of cohorts) {
    for (let i = 0; i < months.length; i++) {
      const mf = 1 + i * 0.08;
      const ad = 1 - i * 0.05;
      const rev = Math.round(c.rev * mf * 100) / 100;
      const ai = Math.round(c.ai * mf * ad * 100) / 100;
      const margin = Math.round((rev - ai) * 100) / 100;
      const mpct = Math.round((margin / rev) * 10000) / 100;
      const lrn = c.base + Math.floor(i * 2.5);
      const cpl = Math.round((ai / lrn) * 1e6) / 1e6;
      const chr = Math.round((0.45 + i * 0.08) * 1e4) / 1e4;
      const cr = Math.round(Math.min(0.12 + i * 0.14, 0.92) * 1e4) / 1e4;
      const cvr = Math.round((0.62 + i * 0.03) * 1e4) / 1e4;
      const sid = 'CES-' + c.id + '-' + months[i].slice(0, 7);

      await prisma.$executeRawUnsafe(
        `INSERT INTO cohort_economics_snapshots
          (id, cohort_id, snapshot_date, total_revenue, total_ai_cost,
           gross_margin, gross_margin_pct, active_learners, ai_cost_per_learner,
           cache_hit_rate, completion_rate, conversion_rate)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         ON CONFLICT (cohort_id, snapshot_date) DO NOTHING`,
        sid, c.id, months[i], rev, ai, margin, mpct, lrn, cpl, chr, cr, cvr
      );
      count++;
    }
  }
  console.log('Seeded ' + count + ' cohort economics snapshots');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
