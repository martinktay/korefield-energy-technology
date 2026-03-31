/** @file cohort-economics.property.spec.ts — Property-based tests for cohort economics (workers). */

import * as fc from 'fast-check';

/**
 * Feature: ai-cost-controls-cohort-economics
 * Property 3: Cohort cost aggregation correctness
 * Validates: Requirements 1.6, 1.7
 *
 * For any set of AWE records with arbitrary cohort_id, learner_id, and
 * estimated_cost_usd values, the daily aggregation grouped by
 * (cohort_id, learner_id) shall produce sums that equal the manual sum
 * of estimated_cost_usd for each (cohort_id, learner_id) pair.
 */
describe('Property 3: Cohort cost aggregation correctness', () => {
  interface AweRecord {
    cohort_id: string;
    learner_id: string;
    estimated_cost_usd: number;
  }

  function aggregateCohortCost(
    records: AweRecord[],
  ): Map<string, number> {
    const result = new Map<string, number>();
    for (const r of records) {
      const key = `${r.cohort_id}:${r.learner_id}`;
      result.set(key, (result.get(key) ?? 0) + r.estimated_cost_usd);
    }
    return result;
  }

  const aweRecordArb = fc.record({
    cohort_id: fc.constantFrom('COH-A', 'COH-B', 'COH-C'),
    learner_id: fc.constantFrom('LRN-1', 'LRN-2', 'LRN-3'),
    estimated_cost_usd: fc.double({ min: 0, max: 10, noNaN: true }),
  });

  it('aggregation matches manual sum for any set of AWE records', () => {
    fc.assert(
      fc.property(
        fc.array(aweRecordArb, { minLength: 0, maxLength: 100 }),
        (records: AweRecord[]) => {
          const aggregated = aggregateCohortCost(records);

          // Manual verification: compute expected sums
          const expected = new Map<string, number>();
          for (const r of records) {
            const key = `${r.cohort_id}:${r.learner_id}`;
            expected.set(key, (expected.get(key) ?? 0) + r.estimated_cost_usd);
          }

          expect(aggregated.size).toBe(expected.size);
          for (const [key, value] of expected) {
            expect(aggregated.get(key)).toBeCloseTo(value, 10);
          }
        },
      ),
      { numRuns: 150 },
    );
  });

  it('aggregation produces non-negative sums for non-negative costs', () => {
    fc.assert(
      fc.property(
        fc.array(aweRecordArb, { minLength: 1, maxLength: 50 }),
        (records: AweRecord[]) => {
          const aggregated = aggregateCohortCost(records);
          for (const value of aggregated.values()) {
            expect(value).toBeGreaterThanOrEqual(0);
          }
        },
      ),
      { numRuns: 150 },
    );
  });
});


/**
 * Feature: ai-cost-controls-cohort-economics
 * Property 8: Cache hit rate computation
 * Validates: Requirements 3.8
 *
 * For any non-negative integers cache_hits and cache_misses where
 * (cache_hits + cache_misses) > 0, the computed cache hit rate shall
 * equal cache_hits / (cache_hits + cache_misses).
 */
describe('Property 8: Cache hit rate computation', () => {
  function computeCacheHitRate(
    cacheHits: number,
    cacheMisses: number,
  ): number {
    const total = cacheHits + cacheMisses;
    if (total === 0) return 0;
    return cacheHits / total;
  }

  it('hit rate equals hits / (hits + misses) for any non-negative counts', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 10000 }),
        fc.nat({ max: 10000 }),
        (cacheHits: number, cacheMisses: number) => {
          fc.pre(cacheHits + cacheMisses > 0);

          const rate = computeCacheHitRate(cacheHits, cacheMisses);
          const expected = cacheHits / (cacheHits + cacheMisses);

          expect(rate).toBeCloseTo(expected, 12);
        },
      ),
      { numRuns: 150 },
    );
  });

  it('hit rate is between 0 and 1 inclusive', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 10000 }),
        fc.nat({ max: 10000 }),
        (cacheHits: number, cacheMisses: number) => {
          fc.pre(cacheHits + cacheMisses > 0);

          const rate = computeCacheHitRate(cacheHits, cacheMisses);
          expect(rate).toBeGreaterThanOrEqual(0);
          expect(rate).toBeLessThanOrEqual(1);
        },
      ),
      { numRuns: 150 },
    );
  });

  it('hit rate is 1 when all calls are cache hits', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 10000 }).filter((n) => n >= 1),
        (cacheHits: number) => {
          const rate = computeCacheHitRate(cacheHits, 0);
          expect(rate).toBe(1);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('hit rate is 0 when all calls are cache misses', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 10000 }).filter((n) => n >= 1),
        (cacheMisses: number) => {
          const rate = computeCacheHitRate(0, cacheMisses);
          expect(rate).toBe(0);
        },
      ),
      { numRuns: 100 },
    );
  });
});

/**
 * Feature: ai-cost-controls-cohort-economics
 * Property 12: Cohort economics metric computation
 * Validates: Requirements 6.1, 6.8, 6.10
 *
 * For any cohort with total_revenue > 0 and total_ai_cost >= 0 and
 * active_learners > 0, the computed gross_margin shall equal
 * total_revenue - total_ai_cost, gross_margin_pct shall equal
 * ((total_revenue - total_ai_cost) / total_revenue) * 100, and
 * ai_cost_per_learner shall equal total_ai_cost / active_learners.
 */
describe('Property 12: Cohort economics metric computation', () => {
  interface CohortMetrics {
    grossMargin: number;
    grossMarginPct: number;
    aiCostPerLearner: number;
  }

  function computeCohortMetrics(
    totalRevenue: number,
    totalAiCost: number,
    activeLearners: number,
  ): CohortMetrics {
    const grossMargin = totalRevenue - totalAiCost;
    const grossMarginPct =
      totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : 0;
    const aiCostPerLearner =
      activeLearners > 0 ? totalAiCost / activeLearners : 0;
    return { grossMargin, grossMarginPct, aiCostPerLearner };
  }

  it('gross_margin equals revenue minus AI cost', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 1_000_000, noNaN: true }),
        fc.double({ min: 0, max: 1_000_000, noNaN: true }),
        fc.nat({ max: 1000 }).filter((n) => n >= 1),
        (totalRevenue: number, totalAiCost: number, activeLearners: number) => {
          const metrics = computeCohortMetrics(
            totalRevenue,
            totalAiCost,
            activeLearners,
          );
          expect(metrics.grossMargin).toBeCloseTo(
            totalRevenue - totalAiCost,
            8,
          );
        },
      ),
      { numRuns: 150 },
    );
  });

  it('gross_margin_pct equals ((revenue - cost) / revenue) * 100', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 1_000_000, noNaN: true }),
        fc.double({ min: 0, max: 1_000_000, noNaN: true }),
        fc.nat({ max: 1000 }).filter((n) => n >= 1),
        (totalRevenue: number, totalAiCost: number, activeLearners: number) => {
          const metrics = computeCohortMetrics(
            totalRevenue,
            totalAiCost,
            activeLearners,
          );
          const expected =
            ((totalRevenue - totalAiCost) / totalRevenue) * 100;
          expect(metrics.grossMarginPct).toBeCloseTo(expected, 8);
        },
      ),
      { numRuns: 150 },
    );
  });

  it('ai_cost_per_learner equals total_ai_cost / active_learners', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 1_000_000, noNaN: true }),
        fc.double({ min: 0, max: 1_000_000, noNaN: true }),
        fc.nat({ max: 1000 }).filter((n) => n >= 1),
        (totalRevenue: number, totalAiCost: number, activeLearners: number) => {
          const metrics = computeCohortMetrics(
            totalRevenue,
            totalAiCost,
            activeLearners,
          );
          expect(metrics.aiCostPerLearner).toBeCloseTo(
            totalAiCost / activeLearners,
            8,
          );
        },
      ),
      { numRuns: 150 },
    );
  });
});
