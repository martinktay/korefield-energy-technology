/**
 * @file analytics.ts — Analytics pre-aggregation worker.
 * Consumes messages from the analytics SQS queue and pre-aggregates
 * Super Admin dashboard metrics using Prisma queries. Supports
 * enrollment summaries, revenue summaries, completion rates,
 * platform health metrics, cohort AI cost aggregation, cache hit rate
 * metrics, and full cohort economics snapshots (revenue, AI cost,
 * gross margin, active learners, cache hit rate, completion rate,
 * conversion rate). The dashboard service reads aggregated results
 * directly from the database.
 * Runs as a standalone process on ECS Fargate.
 */
import { SqsConsumer, ParsedMessage } from './base/sqs-consumer';
import { getPrisma } from './services/db';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AnalyticsPayload {
  metricType: string;
  aggregationParams: Record<string, unknown>;
}

/** Supported metric types for pre-aggregation. */
type MetricType =
  | 'enrollment_summary'
  | 'revenue_summary'
  | 'completion_rates'
  | 'platform_health'
  | 'cohort_ai_cost'
  | 'cache_metrics'
  | 'cohort_economics';

// ---------------------------------------------------------------------------
// Worker
// ---------------------------------------------------------------------------

class AnalyticsWorker extends SqsConsumer<AnalyticsPayload> {
  protected async processMessage(message: ParsedMessage<AnalyticsPayload>): Promise<void> {
    const { metricType, aggregationParams } = message.body;
    this.log('info', `Pre-aggregating analytics metric: ${metricType}`);

    switch (metricType as MetricType) {
      case 'enrollment_summary':
        await this.aggregateEnrollmentSummary(aggregationParams);
        break;
      case 'revenue_summary':
        await this.aggregateRevenueSummary(aggregationParams);
        break;
      case 'completion_rates':
        await this.aggregateCompletionRates(aggregationParams);
        break;
      case 'platform_health':
        await this.aggregatePlatformHealth();
        break;
      case 'cohort_ai_cost':
        await this.aggregateCohortAiCost(aggregationParams);
        break;
      case 'cache_metrics':
        await this.aggregateCacheMetrics(aggregationParams);
        break;
      case 'cohort_economics':
        await this.aggregateCohortEconomics(aggregationParams);
        break;
      default:
        this.log('warn', `Unknown metric type "${metricType}" — skipping`);
    }
  }

  /**
   * Aggregate enrollment counts: total learners, active enrollments,
   * paused enrollments, and enrollments per track.
   */
  private async aggregateEnrollmentSummary(
    _params: Record<string, unknown>,
  ): Promise<void> {
    const prisma = getPrisma();

    const [totalLearners, activeEnrollments, pausedEnrollments, enrollmentsByTrack] =
      await Promise.all([
        prisma.learner.count(),
        prisma.enrollment.count({ where: { status: 'active' } }),
        prisma.enrollment.count({ where: { status: 'paused' } }),
        prisma.enrollment.groupBy({
          by: ['track_id'],
          _count: { id: true },
        }),
      ]);

    const summary = {
      totalLearners,
      activeEnrollments,
      pausedEnrollments,
      enrollmentsByTrack: enrollmentsByTrack.map((row: any) => ({
        trackId: row.track_id,
        count: row._count.id,
      })),
      aggregatedAt: new Date().toISOString(),
    };

    this.log(
      'info',
      `Enrollment summary: ${totalLearners} learners, ${activeEnrollments} active, ${pausedEnrollments} paused`,
    );
    this.log('info', `enrollment_summary: ${JSON.stringify(summary)}`);
  }

  /**
   * Aggregate revenue metrics: total revenue from completed payment plans,
   * active plan totals, and revenue breakdown by track.
   */
  private async aggregateRevenueSummary(
    _params: Record<string, unknown>,
  ): Promise<void> {
    const prisma = getPrisma();

    const [completedRevenue, activeRevenue, revenueByTrack] = await Promise.all([
      prisma.paymentPlan.aggregate({
        where: { status: 'completed' },
        _sum: { total_amount: true },
        _count: { id: true },
      }),
      prisma.paymentPlan.aggregate({
        where: { status: 'active' },
        _sum: { total_amount: true },
        _count: { id: true },
      }),
      prisma.paymentPlan.findMany({
        where: { status: 'completed' },
        select: {
          total_amount: true,
          enrollment: { select: { track_id: true } },
        },
      }),
    ]);

    // Aggregate revenue by track from the raw results
    const trackTotals = new Map<string, number>();
    for (const plan of revenueByTrack) {
      const trackId = plan.enrollment.track_id;
      trackTotals.set(trackId, (trackTotals.get(trackId) ?? 0) + plan.total_amount);
    }

    const summary = {
      completedRevenue: completedRevenue._sum.total_amount ?? 0,
      completedPlanCount: completedRevenue._count.id,
      activeRevenue: activeRevenue._sum.total_amount ?? 0,
      activePlanCount: activeRevenue._count.id,
      revenueByTrack: Array.from(trackTotals.entries()).map(([trackId, total]) => ({
        trackId,
        total,
      })),
      aggregatedAt: new Date().toISOString(),
    };

    this.log(
      'info',
      `Revenue summary: completed=${summary.completedRevenue}, active=${summary.activeRevenue}`,
    );
    this.log('info', `revenue_summary: ${JSON.stringify(summary)}`);
  }

  /**
   * Aggregate completion rates: certificates issued, capstone pass rates,
   * and foundation completion rates.
   */
  private async aggregateCompletionRates(
    _params: Record<string, unknown>,
  ): Promise<void> {
    const prisma = getPrisma();

    const [
      totalCertificates,
      totalCapstones,
      passedCapstones,
      foundationTotal,
      foundationCompleted,
    ] = await Promise.all([
      prisma.certificate.count({ where: { status: 'active' } }),
      prisma.capstone.count(),
      prisma.capstone.count({ where: { status: 'evaluated', result: 'pass' } }),
      prisma.foundationProgress.count(),
      prisma.foundationProgress.count({ where: { completed: true } }),
    ]);

    const capstonePassRate = totalCapstones > 0
      ? Math.round((passedCapstones / totalCapstones) * 100)
      : 0;
    const foundationCompletionRate = foundationTotal > 0
      ? Math.round((foundationCompleted / foundationTotal) * 100)
      : 0;

    const summary = {
      totalCertificates,
      capstonePassRate,
      totalCapstones,
      passedCapstones,
      foundationCompletionRate,
      foundationTotal,
      foundationCompleted,
      aggregatedAt: new Date().toISOString(),
    };

    this.log(
      'info',
      `Completion rates: ${totalCertificates} certs, capstone pass ${capstonePassRate}%, foundation ${foundationCompletionRate}%`,
    );
    this.log('info', `completion_rates: ${JSON.stringify(summary)}`);
  }

  /**
   * Aggregate platform health metrics: total users by role, overdue
   * installments, active pods, and pending submissions.
   */
  private async aggregatePlatformHealth(): Promise<void> {
    const prisma = getPrisma();

    const [
      usersByRole,
      overdueInstallments,
      activePods,
      pendingSubmissions,
    ] = await Promise.all([
      prisma.user.groupBy({
        by: ['role'],
        _count: { id: true },
      }),
      prisma.installment.count({ where: { status: 'overdue' } }),
      prisma.pod.count({ where: { status: 'active' } }),
      prisma.submission.count({ where: { status: 'submitted' } }),
    ]);

    const summary = {
      usersByRole: usersByRole.map((row: any) => ({
        role: row.role,
        count: row._count.id,
      })),
      overdueInstallments,
      activePods,
      pendingSubmissions,
      aggregatedAt: new Date().toISOString(),
    };

    this.log(
      'info',
      `Platform health: ${overdueInstallments} overdue installments, ${activePods} active pods, ${pendingSubmissions} pending submissions`,
    );
    this.log('info', `platform_health: ${JSON.stringify(summary)}`);
  }

  /**
   * Aggregate daily AI cost grouped by cohort_id and learner_id
   * from the agent_workflow_executions table.
   */
  private async aggregateCohortAiCost(
    _params: Record<string, unknown>,
  ): Promise<void> {
    const prisma = getPrisma();
    const today = new Date().toISOString().split('T')[0];

    const results: Array<{
      cohort_id: string;
      learner_id: string;
      total_cost: number;
      call_count: bigint;
    }> = await prisma.$queryRawUnsafe(`
      SELECT cohort_id, learner_id,
             SUM(estimated_cost_usd)::float AS total_cost,
             COUNT(*) AS call_count
      FROM agent_workflow_executions
      WHERE cohort_id IS NOT NULL
        AND created_at::date = $1::date
      GROUP BY cohort_id, learner_id
    `, today);

    this.log(
      'info',
      `Cohort AI cost: ${results.length} cohort-learner pairs for ${today}`,
    );
    this.log('info', `cohort_ai_cost: ${JSON.stringify(results)}`);
  }

  /**
   * Compute cache hit rate per cohort per day from agent_workflow_executions telemetry.
   */
  private async aggregateCacheMetrics(
    _params: Record<string, unknown>,
  ): Promise<void> {
    const prisma = getPrisma();
    const today = new Date().toISOString().split('T')[0];

    const results: Array<{
      cohort_id: string;
      cache_hits: bigint;
      total_calls: bigint;
      hit_rate: number;
    }> = await prisma.$queryRawUnsafe(`
      SELECT cohort_id,
             SUM(CASE WHEN cache_hit = true THEN 1 ELSE 0 END) AS cache_hits,
             COUNT(*) AS total_calls,
             CASE WHEN COUNT(*) > 0
               THEN SUM(CASE WHEN cache_hit = true THEN 1 ELSE 0 END)::float / COUNT(*)::float
               ELSE 0
             END AS hit_rate
      FROM agent_workflow_executions
      WHERE cohort_id IS NOT NULL
        AND created_at::date = $1::date
      GROUP BY cohort_id
    `, today);

    this.log(
      'info',
      `Cache metrics: ${results.length} cohorts for ${today}`,
    );
    this.log('info', `cache_metrics: ${JSON.stringify(results)}`);
  }

  /**
   * Compute full cohort economics snapshot: revenue, AI cost, gross margin,
   * active learners, cache hit rate, completion rate, conversion rate.
   * Upserts results into the cohort_economics_snapshots table.
   */
  private async aggregateCohortEconomics(
    _params: Record<string, unknown>,
  ): Promise<void> {
    const prisma = getPrisma();
    const today = new Date().toISOString().split('T')[0];

    // Get all distinct cohort IDs from enrollments (using track_id as cohort proxy)
    const cohorts: Array<{ track_id: string }> = await prisma.$queryRawUnsafe(`
      SELECT DISTINCT track_id FROM enrollments WHERE status = 'active'
    `);

    for (const cohort of cohorts) {
      const cohortId = cohort.track_id;

      // Revenue: sum of paid installments for this cohort's enrollments
      const revenueResult: Array<{ total_revenue: number }> = await prisma.$queryRawUnsafe(`
        SELECT COALESCE(SUM(i.amount), 0)::float AS total_revenue
        FROM installments i
        JOIN payment_plans pp ON i.plan_id = pp.id
        JOIN enrollments e ON pp.enrollment_id = e.id
        WHERE e.track_id = $1 AND i.status = 'paid'
      `, cohortId);
      const totalRevenue = revenueResult[0]?.total_revenue ?? 0;

      // AI cost: sum of estimated_cost_usd for this cohort
      const costResult: Array<{ total_ai_cost: number }> = await prisma.$queryRawUnsafe(`
        SELECT COALESCE(SUM(estimated_cost_usd), 0)::float AS total_ai_cost
        FROM agent_workflow_executions
        WHERE cohort_id = $1
      `, cohortId);
      const totalAiCost = costResult[0]?.total_ai_cost ?? 0;

      // Active learners
      const activeResult: Array<{ count: bigint }> = await prisma.$queryRawUnsafe(`
        SELECT COUNT(DISTINCT learner_id) AS count
        FROM enrollments
        WHERE track_id = $1 AND status = 'active'
      `, cohortId);
      const activeLearners = Number(activeResult[0]?.count ?? 0);

      // Cache hit rate
      const cacheResult: Array<{ hits: bigint; total: bigint }> = await prisma.$queryRawUnsafe(`
        SELECT
          SUM(CASE WHEN cache_hit = true THEN 1 ELSE 0 END) AS hits,
          COUNT(*) AS total
        FROM agent_workflow_executions
        WHERE cohort_id = $1
      `, cohortId);
      const cacheHits = Number(cacheResult[0]?.hits ?? 0);
      const cacheTotal = Number(cacheResult[0]?.total ?? 0);
      const cacheHitRate = cacheTotal > 0 ? cacheHits / cacheTotal : 0;

      // Completion rate: certificates / enrolled learners
      const certResult: Array<{ count: bigint }> = await prisma.$queryRawUnsafe(`
        SELECT COUNT(*) AS count FROM certificates WHERE track_id = $1 AND status = 'active'
      `, cohortId);
      const certCount = Number(certResult[0]?.count ?? 0);
      const enrolledResult: Array<{ count: bigint }> = await prisma.$queryRawUnsafe(`
        SELECT COUNT(DISTINCT learner_id) AS count FROM enrollments WHERE track_id = $1
      `, cohortId);
      const enrolledCount = Number(enrolledResult[0]?.count ?? 0);
      const completionRate = enrolledCount > 0 ? certCount / enrolledCount : 0;

      // Conversion rate: cohort enrollments / foundation completions
      const foundationResult: Array<{ count: bigint }> = await prisma.$queryRawUnsafe(`
        SELECT COUNT(*) AS count FROM foundation_progress WHERE completed = true
      `);
      const foundationCompletions = Number(foundationResult[0]?.count ?? 0);
      const conversionRate = foundationCompletions > 0 ? enrolledCount / foundationCompletions : 0;

      // Compute derived metrics
      const grossMargin = totalRevenue - totalAiCost;
      const grossMarginPct = totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : 0;
      const aiCostPerLearner = activeLearners > 0 ? totalAiCost / activeLearners : 0;

      // Generate a deterministic snapshot ID
      const snapshotId = `CES-${cohortId}-${today}`.replace(/[^a-zA-Z0-9-]/g, '');

      // Upsert into cohort_economics_snapshots
      await prisma.$queryRawUnsafe(`
        INSERT INTO cohort_economics_snapshots (
          id, cohort_id, snapshot_date, total_revenue, total_ai_cost,
          gross_margin, gross_margin_pct, active_learners, ai_cost_per_learner,
          cache_hit_rate, completion_rate, conversion_rate, created_at, updated_at
        ) VALUES ($1, $2, $3::date, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
        ON CONFLICT (cohort_id, snapshot_date)
        DO UPDATE SET
          total_revenue = EXCLUDED.total_revenue,
          total_ai_cost = EXCLUDED.total_ai_cost,
          gross_margin = EXCLUDED.gross_margin,
          gross_margin_pct = EXCLUDED.gross_margin_pct,
          active_learners = EXCLUDED.active_learners,
          ai_cost_per_learner = EXCLUDED.ai_cost_per_learner,
          cache_hit_rate = EXCLUDED.cache_hit_rate,
          completion_rate = EXCLUDED.completion_rate,
          conversion_rate = EXCLUDED.conversion_rate,
          updated_at = NOW()
      `,
        snapshotId, cohortId, today,
        totalRevenue, totalAiCost, grossMargin, grossMarginPct,
        activeLearners, aiCostPerLearner, cacheHitRate, completionRate, conversionRate,
      );

      this.log(
        'info',
        `Cohort economics snapshot for ${cohortId}: revenue=${totalRevenue}, ai_cost=${totalAiCost}, margin=${grossMarginPct.toFixed(1)}%`,
      );
    }

    this.log('info', `cohort_economics: processed ${cohorts.length} cohorts for ${today}`);
  }
}

// ---------------------------------------------------------------------------
// Standalone startup
// ---------------------------------------------------------------------------

const worker = new AnalyticsWorker({
  queueName: 'analytics',
  queueUrl: process.env.ANALYTICS_QUEUE_URL ?? '',
  dlqUrl: process.env.ANALYTICS_DLQ_URL ?? '',
});

worker.start();
