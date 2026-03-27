/**
 * Seed script for KoreField Academy curriculum data.
 *
 * Seeds:
 *  - 4 launch tracks with 3 levels each (Beginner, Intermediate, Advanced)
 *  - Modules per level matching TRACKS_OVERVIEW.md curriculum
 *  - Foundation School 5 reference modules
 *  - Country bands with purchasing power multipliers
 *  - Pricing configs per track
 *
 * Idempotent — uses upsert to avoid duplicates on re-run.
 *
 * Usage: cd backend && pnpm ts-node --transpile-only ../db/seeds/seed-curriculum.ts
 *
 * Requirements: 3.3, 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7
 */

import { PrismaClient, LevelTier, TrackStatus } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Track Definitions ──────────────────────────────────────────

interface ModuleSeed {
  id: string;
  title: string;
  sequence: number;
}

interface LevelSeed {
  id: string;
  tier: LevelTier;
  sequence: number;
  modules: ModuleSeed[];
}

interface TrackSeed {
  id: string;
  name: string;
  description: string;
  estimated_duration: string;
  levels: LevelSeed[];
}

const tracks: TrackSeed[] = [
  // ── Track 1: AI Engineering and Intelligent Systems ──
  {
    id: 'TRK-ai-eng-001',
    name: 'AI Engineering and Intelligent Systems',
    description:
      'Build production AI systems — from Python fundamentals through RAG pipelines to multi-agent enterprise architectures.',
    estimated_duration: '9 months',
    levels: [
      {
        id: 'LVL-ai-eng-beg',
        tier: LevelTier.Beginner,
        sequence: 1,
        modules: [
          { id: 'MOD-ai-eng-b01', title: 'Python for AI', sequence: 1 },
          { id: 'MOD-ai-eng-b02', title: 'Data Structures and Algorithms for AI', sequence: 2 },
          { id: 'MOD-ai-eng-b03', title: 'REST APIs and HTTP Fundamentals', sequence: 3 },
          { id: 'MOD-ai-eng-b04', title: 'Prompt Engineering Foundations', sequence: 4 },
          { id: 'MOD-ai-eng-b05', title: 'Model API Integration', sequence: 5 },
          { id: 'MOD-ai-eng-b06', title: 'Cloud Basics for AI Engineers', sequence: 6 },
        ],
      },
      {
        id: 'LVL-ai-eng-int',
        tier: LevelTier.Intermediate,
        sequence: 2,
        modules: [
          { id: 'MOD-ai-eng-i01', title: 'RAG Pipelines and Vector Databases', sequence: 1 },
          { id: 'MOD-ai-eng-i02', title: 'LangChain Workflows', sequence: 2 },
          { id: 'MOD-ai-eng-i03', title: 'LangGraph Basics', sequence: 3 },
          { id: 'MOD-ai-eng-i04', title: 'Async AI Workflows', sequence: 4 },
          { id: 'MOD-ai-eng-i05', title: 'Deployment Pipelines for AI', sequence: 5 },
        ],
      },
      {
        id: 'LVL-ai-eng-adv',
        tier: LevelTier.Advanced,
        sequence: 3,
        modules: [
          { id: 'MOD-ai-eng-a01', title: 'Multi-Agent Systems', sequence: 1 },
          { id: 'MOD-ai-eng-a02', title: 'Inference Optimisation', sequence: 2 },
          { id: 'MOD-ai-eng-a03', title: 'Reliability Engineering for AI', sequence: 3 },
          { id: 'MOD-ai-eng-a04', title: 'Observability and Monitoring', sequence: 4 },
          { id: 'MOD-ai-eng-a05', title: 'Enterprise AI Architecture', sequence: 5 },
        ],
      },
    ],
  },

  // ── Track 2: Data Science and Decision Intelligence ──
  {
    id: 'TRK-data-sci-002',
    name: 'Data Science and Decision Intelligence',
    description:
      'Master data-driven decision making — from Python data analysis through ML modelling to production MLOps pipelines.',
    estimated_duration: '9 months',
    levels: [
      {
        id: 'LVL-data-sci-beg',
        tier: LevelTier.Beginner,
        sequence: 1,
        modules: [
          { id: 'MOD-ds-b01', title: 'Python for Data Science', sequence: 1 },
          { id: 'MOD-ds-b02', title: 'Statistics Fundamentals', sequence: 2 },
          { id: 'MOD-ds-b03', title: 'Exploratory Data Analysis', sequence: 3 },
          { id: 'MOD-ds-b04', title: 'Data Visualisation', sequence: 4 },
          { id: 'MOD-ds-b05', title: 'SQL for Data Professionals', sequence: 5 },
          { id: 'MOD-ds-b06', title: 'Data Ethics', sequence: 6 },
        ],
      },
      {
        id: 'LVL-data-sci-int',
        tier: LevelTier.Intermediate,
        sequence: 2,
        modules: [
          { id: 'MOD-ds-i01', title: 'Feature Engineering', sequence: 1 },
          { id: 'MOD-ds-i02', title: 'Supervised and Unsupervised Learning', sequence: 2 },
          { id: 'MOD-ds-i03', title: 'Model Evaluation and Selection', sequence: 3 },
          { id: 'MOD-ds-i04', title: 'Experimentation Design', sequence: 4 },
          { id: 'MOD-ds-i05', title: 'Explainability Basics', sequence: 5 },
        ],
      },
      {
        id: 'LVL-data-sci-adv',
        tier: LevelTier.Advanced,
        sequence: 3,
        modules: [
          { id: 'MOD-ds-a01', title: 'Production ML Pipelines', sequence: 1 },
          { id: 'MOD-ds-a02', title: 'Real-Time Analytics', sequence: 2 },
          { id: 'MOD-ds-a03', title: 'Model Monitoring and Drift Detection', sequence: 3 },
          { id: 'MOD-ds-a04', title: 'Decision Intelligence Systems', sequence: 4 },
          { id: 'MOD-ds-a05', title: 'MLOps Concepts and Practices', sequence: 5 },
        ],
      },
    ],
  },

  // ── Track 3: Cybersecurity and AI Security ──
  {
    id: 'TRK-cyber-sec-003',
    name: 'Cybersecurity and AI Security',
    description:
      'Defend intelligent systems — from IAM fundamentals through SIEM analytics to AI-driven security operations.',
    estimated_duration: '9 months',
    levels: [
      {
        id: 'LVL-cyber-beg',
        tier: LevelTier.Beginner,
        sequence: 1,
        modules: [
          { id: 'MOD-cs-b01', title: 'IAM Basics', sequence: 1 },
          { id: 'MOD-cs-b02', title: 'Security Fundamentals', sequence: 2 },
          { id: 'MOD-cs-b03', title: 'Threat Awareness', sequence: 3 },
          { id: 'MOD-cs-b04', title: 'Cloud Security Basics', sequence: 4 },
        ],
      },
      {
        id: 'LVL-cyber-int',
        tier: LevelTier.Intermediate,
        sequence: 2,
        modules: [
          { id: 'MOD-cs-i01', title: 'SIEM Analytics', sequence: 1 },
          { id: 'MOD-cs-i02', title: 'Incident Response', sequence: 2 },
          { id: 'MOD-cs-i03', title: 'Threat Modelling', sequence: 3 },
          { id: 'MOD-cs-i04', title: 'AI-Driven Anomaly Detection', sequence: 4 },
          { id: 'MOD-cs-i05', title: 'Security Automation Basics', sequence: 5 },
        ],
      },
      {
        id: 'LVL-cyber-adv',
        tier: LevelTier.Advanced,
        sequence: 3,
        modules: [
          { id: 'MOD-cs-a01', title: 'AI Security Architecture', sequence: 1 },
          { id: 'MOD-cs-a02', title: 'Adversarial ML Awareness', sequence: 2 },
          { id: 'MOD-cs-a03', title: 'Zero Trust Architecture', sequence: 3 },
          { id: 'MOD-cs-a04', title: 'Security Governance', sequence: 4 },
          { id: 'MOD-cs-a05', title: 'AI SOC Automation', sequence: 5 },
        ],
      },
    ],
  },

  // ── Track 4: AI Product and Project Leadership ──
  {
    id: 'TRK-ai-prod-004',
    name: 'AI Product and Project Leadership',
    description:
      'Lead AI-powered products — from product discovery through AI lifecycle governance to enterprise transformation.',
    estimated_duration: '9 months',
    levels: [
      {
        id: 'LVL-ai-prod-beg',
        tier: LevelTier.Beginner,
        sequence: 1,
        modules: [
          { id: 'MOD-ap-b01', title: 'Product Discovery', sequence: 1 },
          { id: 'MOD-ap-b02', title: 'Stakeholder Management', sequence: 2 },
          { id: 'MOD-ap-b03', title: 'Agile Delivery', sequence: 3 },
          { id: 'MOD-ap-b04', title: 'AI Product Fundamentals', sequence: 4 },
          { id: 'MOD-ap-b05', title: 'User Research Basics', sequence: 5 },
        ],
      },
      {
        id: 'LVL-ai-prod-int',
        tier: LevelTier.Intermediate,
        sequence: 2,
        modules: [
          { id: 'MOD-ap-i01', title: 'AI Lifecycle Governance', sequence: 1 },
          { id: 'MOD-ap-i02', title: 'Responsible AI Product Management', sequence: 2 },
          { id: 'MOD-ap-i03', title: 'Data Strategy', sequence: 3 },
          { id: 'MOD-ap-i04', title: 'Cross-Functional Leadership', sequence: 4 },
          { id: 'MOD-ap-i05', title: 'Metrics Design', sequence: 5 },
        ],
      },
      {
        id: 'LVL-ai-prod-adv',
        tier: LevelTier.Advanced,
        sequence: 3,
        modules: [
          { id: 'MOD-ap-a01', title: 'Transformation Leadership', sequence: 1 },
          { id: 'MOD-ap-a02', title: 'AI Strategy', sequence: 2 },
          { id: 'MOD-ap-a03', title: 'Enterprise AI Governance', sequence: 3 },
          { id: 'MOD-ap-a04', title: 'Innovation Management', sequence: 4 },
          { id: 'MOD-ap-a05', title: 'Executive Communication', sequence: 5 },
        ],
      },
    ],
  },
];


// ─── Foundation School Reference Modules ────────────────────────
// Foundation progress is tracked via FoundationProgress JSON, but we
// store reference data so the frontend can display module names/descriptions.

interface FoundationModuleSeed {
  id: string;
  title: string;
  description: string;
  sequence: number;
}

const foundationModules: FoundationModuleSeed[] = [
  {
    id: 'FND-mod-ai-literacy',
    title: 'AI Literacy and Future of Work',
    description:
      'What AI is and is not, predictive vs generative AI, narrow vs frontier AI, human-AI collaboration, future of work realities.',
    sequence: 1,
  },
  {
    id: 'FND-mod-ai-fluency',
    title: 'AI Fluency and Prompt Intelligence',
    description:
      'Zero-shot prompting, few-shot prompting, role prompting, structured output prompting, prompt evaluation, basic chain-of-thought awareness.',
    sequence: 2,
  },
  {
    id: 'FND-mod-systems',
    title: 'Systems Awareness',
    description:
      'APIs, cloud basics, data pipelines, databases, cybersecurity awareness.',
    sequence: 3,
  },
  {
    id: 'FND-mod-governance',
    title: 'Governance and Responsible AI',
    description:
      'Bias and fairness, privacy awareness, GDPR, NDPR, CCPA/CPRA, NIST AI RMF, FTC AI Enforcement, responsible AI, hallucination awareness.',
    sequence: 4,
  },
  {
    id: 'FND-mod-discipline',
    title: 'Professional Discipline',
    description:
      'Communication, accountability, collaboration, documentation, learning discipline.',
    sequence: 5,
  },
];

// ─── Country Bands ──────────────────────────────────────────────

interface CountryBandSeed {
  id: string;
  country_code: string;
  purchasing_power_band: string;
  multiplier: number;
}

const countryBands: CountryBandSeed[] = [
  { id: 'CBN-ng', country_code: 'NG', purchasing_power_band: 'Tier 3', multiplier: 0.45 },
  { id: 'CBN-ke', country_code: 'KE', purchasing_power_band: 'Tier 3', multiplier: 0.50 },
  { id: 'CBN-gh', country_code: 'GH', purchasing_power_band: 'Tier 3', multiplier: 0.48 },
  { id: 'CBN-za', country_code: 'ZA', purchasing_power_band: 'Tier 2', multiplier: 0.65 },
  { id: 'CBN-eg', country_code: 'EG', purchasing_power_band: 'Tier 3', multiplier: 0.50 },
  { id: 'CBN-gb', country_code: 'GB', purchasing_power_band: 'Tier 1', multiplier: 1.00 },
  { id: 'CBN-us', country_code: 'US', purchasing_power_band: 'Tier 1', multiplier: 1.00 },
  { id: 'CBN-in', country_code: 'IN', purchasing_power_band: 'Tier 3', multiplier: 0.40 },
  { id: 'CBN-br', country_code: 'BR', purchasing_power_band: 'Tier 2', multiplier: 0.55 },
  { id: 'CBN-ae', country_code: 'AE', purchasing_power_band: 'Tier 1', multiplier: 0.95 },
];

// ─── Pricing Configs ────────────────────────────────────────────

interface PricingConfigSeed {
  id: string;
  track_id: string;
  base_price: number;
  floor_price: number;
  ceiling_price: number;
}

const pricingConfigs: PricingConfigSeed[] = [
  {
    id: 'PRC-ai-eng-001',
    track_id: 'TRK-ai-eng-001',
    base_price: 1500,
    floor_price: 600,
    ceiling_price: 1800,
  },
  {
    id: 'PRC-data-sci-002',
    track_id: 'TRK-data-sci-002',
    base_price: 1500,
    floor_price: 600,
    ceiling_price: 1800,
  },
  {
    id: 'PRC-cyber-sec-003',
    track_id: 'TRK-cyber-sec-003',
    base_price: 1400,
    floor_price: 560,
    ceiling_price: 1680,
  },
  {
    id: 'PRC-ai-prod-004',
    track_id: 'TRK-ai-prod-004',
    base_price: 1400,
    floor_price: 560,
    ceiling_price: 1680,
  },
];


// ─── Seed Functions ─────────────────────────────────────────────

async function seedTracks(): Promise<void> {
  console.log('Seeding tracks, levels, modules, and performance gates...');

  for (const track of tracks) {
    await prisma.track.upsert({
      where: { id: track.id },
      update: {
        name: track.name,
        description: track.description,
        estimated_duration: track.estimated_duration,
      },
      create: {
        id: track.id,
        name: track.name,
        description: track.description,
        status: TrackStatus.available,
        estimated_duration: track.estimated_duration,
      },
    });

    let moduleCount = 0;
    for (const level of track.levels) {
      await prisma.level.upsert({
        where: { id: level.id },
        update: {
          track_id: track.id,
          tier: level.tier,
          sequence: level.sequence,
        },
        create: {
          id: level.id,
          track_id: track.id,
          tier: level.tier,
          sequence: level.sequence,
        },
      });

      for (const mod of level.modules) {
        await prisma.module.upsert({
          where: { id: mod.id },
          update: {
            level_id: level.id,
            title: mod.title,
            sequence: mod.sequence,
          },
          create: {
            id: mod.id,
            level_id: level.id,
            title: mod.title,
            sequence: mod.sequence,
            version: 1,
            published: true,
          },
        });

        // Create PerformanceGate for each module
        const gateId = mod.id.replace('MOD-', 'PGT-');
        await prisma.performanceGate.upsert({
          where: { id: gateId },
          update: {
            module_id: mod.id,
            threshold_score: 70,
            max_attempts: 2,
          },
          create: {
            id: gateId,
            module_id: mod.id,
            threshold_score: 70,
            max_attempts: 2,
          },
        });

        moduleCount++;
      }
    }

    console.log(`  ✓ ${track.name} (${track.levels.length} levels, ${moduleCount} modules, ${moduleCount} gates)`);
  }
}

/**
 * Seeds Foundation School reference data.
 *
 * Foundation modules are not stored as Track → Level → Module in the DB
 * because Foundation School is a standalone layer tracked via FoundationProgress JSON.
 * We store them as a JSON reference file that the frontend and services can read.
 * This function writes the reference data to a JSON file alongside the seed.
 */
async function seedFoundationModules(): Promise<void> {
  console.log('Seeding Foundation School reference data...');

  const fs = await import('fs');
  const path = await import('path');

  const outputPath = path.join(__dirname, 'foundation-modules.json');
  fs.writeFileSync(outputPath, JSON.stringify(foundationModules, null, 2), 'utf-8');

  console.log(`  ✓ Foundation School (${foundationModules.length} modules) → ${outputPath}`);
}

async function seedCountryBands(): Promise<void> {
  console.log('Seeding country bands...');

  for (const band of countryBands) {
    await prisma.countryBand.upsert({
      where: { id: band.id },
      update: {
        country_code: band.country_code,
        purchasing_power_band: band.purchasing_power_band,
        multiplier: band.multiplier,
      },
      create: {
        id: band.id,
        country_code: band.country_code,
        purchasing_power_band: band.purchasing_power_band,
        multiplier: band.multiplier,
      },
    });
  }

  console.log(`  ✓ ${countryBands.length} country bands`);
}

async function seedPricingConfigs(): Promise<void> {
  console.log('Seeding pricing configs...');

  const effectiveFrom = new Date('2025-01-01T00:00:00Z');

  for (const config of pricingConfigs) {
    await prisma.pricingConfig.upsert({
      where: { id: config.id },
      update: {
        track_id: config.track_id,
        base_price: config.base_price,
        floor_price: config.floor_price,
        ceiling_price: config.ceiling_price,
        effective_from: effectiveFrom,
      },
      create: {
        id: config.id,
        track_id: config.track_id,
        base_price: config.base_price,
        floor_price: config.floor_price,
        ceiling_price: config.ceiling_price,
        effective_from: effectiveFrom,
      },
    });
  }

  console.log(`  ✓ ${pricingConfigs.length} pricing configs`);
}

// ─── Main ───────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('\n🌱 KoreField Academy — Curriculum Seed\n');

  await seedTracks();
  await seedFoundationModules();
  await seedCountryBands();
  await seedPricingConfigs();

  console.log('\n✅ Seed complete.\n');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
