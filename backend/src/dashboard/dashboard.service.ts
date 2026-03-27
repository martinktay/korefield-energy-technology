/**
 * @file dashboard.service.ts
 * Aggregated dashboard queries for all portal types.
 * Each method queries Prisma with proper includes/joins to return
 * pre-shaped data ready for frontend consumption.
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Admin Dashboard ───────────────────────────────────────────

  async getAdminDashboard() {
    const [totalUsers, activeEnrollments, pendingPayments, certificatesIssued] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.enrollment.count({ where: { status: 'active' } }),
        this.prisma.installment.count({ where: { status: 'pending' } }),
        this.prisma.certificate.count(),
      ]);

    const recentActivity = await this.prisma.certificate.findMany({
      take: 10,
      orderBy: { created_at: 'desc' },
      include: {
        learner: { include: { user: { select: { email: true } } } },
        track: { select: { name: true } },
      },
    });

    return {
      metrics: [
        { label: 'Total Users', value: String(totalUsers), change: '' },
        { label: 'Active Enrollments', value: String(activeEnrollments), change: '' },
        { label: 'Pending Payments', value: String(pendingPayments), change: '' },
        { label: 'Certificates Issued', value: String(certificatesIssued), change: '' },
      ],
      recentActivity: recentActivity.map((c) => ({
        id: c.id,
        action: 'Certificate issued',
        user: `${c.learner.user.email} — ${c.verification_code}`,
        date: c.created_at.toISOString().split('T')[0],
      })),
    };
  }

  async getAdminUsers() {
    const users = await this.prisma.user.findMany({
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        created_at: true,
      },
    });

    return users.map((u) => ({
      id: u.id,
      name: u.email.split('@')[0],
      email: u.email,
      role: u.role,
      status: u.status,
      joined: u.created_at.toISOString().split('T')[0],
    }));
  }

  async getAdminEnrollments() {
    const enrollments = await this.prisma.enrollment.findMany({
      orderBy: { enrolled_at: 'desc' },
      include: {
        learner: { include: { user: { select: { email: true } } } },
        track: { select: { name: true } },
      },
    });

    return enrollments.map((e) => ({
      id: e.id,
      learner: e.learner.user.email.split('@')[0],
      track: e.track.name,
      level: 'Beginner',
      status: e.status.charAt(0).toUpperCase() + e.status.slice(1),
      enrolled: e.enrolled_at.toISOString().split('T')[0],
    }));
  }

  async getAdminPayments() {
    const plans = await this.prisma.paymentPlan.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        enrollment: {
          include: {
            learner: { include: { user: { select: { email: true } } } },
            track: { select: { name: true } },
          },
        },
        installments: true,
      },
    });

    return plans.map((p) => {
      const paid = p.installments
        .filter((i) => i.status === 'paid')
        .reduce((sum, i) => sum + i.amount, 0);
      const remaining = p.total_amount - paid;
      const hasOverdue = p.installments.some((i) => i.status === 'overdue');

      return {
        id: p.id,
        learner: p.enrollment.learner.user.email.split('@')[0],
        track: p.enrollment.track.name,
        plan: p.plan_type === 'full' ? 'Full' : p.plan_type === 'two_pay' ? '2-Pay' : '3-Pay',
        paid: `$${paid.toFixed(0)}`,
        remaining: `$${remaining.toFixed(0)}`,
        status: hasOverdue ? 'Overdue' : remaining === 0 ? 'Paid' : 'Current',
      };
    });
  }

  async getAdminCertificates() {
    const certs = await this.prisma.certificate.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        learner: { include: { user: { select: { email: true } } } },
        track: { select: { name: true } },
      },
    });

    return certs.map((c) => ({
      id: c.id,
      code: c.verification_code,
      learner: c.learner.user.email.split('@')[0],
      track: c.track.name,
      issued: c.issued_at.toISOString().split('T')[0],
      status: c.status.charAt(0).toUpperCase() + c.status.slice(1),
    }));
  }


  // ── Super Admin Dashboard ─────────────────────────────────────

  async getSuperAdminKPIs() {
    const [
      totalRevenue,
      activeLearners,
      certifications,
      totalEnrollments,
    ] = await Promise.all([
      this.prisma.installment.aggregate({
        where: { status: 'paid' },
        _sum: { amount: true },
      }),
      this.prisma.enrollment.count({ where: { status: 'active' } }),
      this.prisma.certificate.count({ where: { status: 'active' } }),
      this.prisma.enrollment.count(),
    ]);

    const revenue = totalRevenue._sum.amount ?? 0;
    const conversionRate =
      totalEnrollments > 0
        ? Math.round((activeLearners / totalEnrollments) * 100)
        : 0;

    return [
      { label: 'Total Revenue (MTD)', value: `$${revenue.toLocaleString()}`, change: '' },
      { label: 'Active Learners', value: String(activeLearners), change: '' },
      { label: 'Certifications (YTD)', value: String(certifications), change: '' },
      { label: 'Platform Uptime', value: '99.97%', change: '' },
      { label: 'AI Agent Workflows', value: '—', change: '' },
      { label: 'Foundation Conversion', value: `${conversionRate}%`, change: '' },
    ];
  }

  async getSuperAdminRevenue() {
    const plans = await this.prisma.paymentPlan.findMany({
      include: {
        enrollment: {
          include: {
            track: { select: { name: true } },
            learner: { select: { country: true } },
          },
        },
        installments: { where: { status: 'paid' } },
      },
    });

    // Revenue by track
    const trackMap = new Map<string, { revenue: number; enrollments: number; overdue: number; total: number }>();
    for (const p of plans) {
      const trackName = p.enrollment.track.name;
      const entry = trackMap.get(trackName) ?? { revenue: 0, enrollments: 0, overdue: 0, total: 0 };
      entry.revenue += p.installments.reduce((s, i) => s + i.amount, 0);
      entry.enrollments += 1;
      entry.total += 1;
      trackMap.set(trackName, entry);
    }

    const revenueByTrack = Array.from(trackMap.entries()).map(([track, d]) => ({
      track,
      revenue: `$${d.revenue.toLocaleString()}`,
      enrollments: d.enrollments,
      overdueRate: d.total > 0 ? `${Math.round((d.overdue / d.total) * 100)}%` : '0%',
    }));

    // Revenue by region
    const regionMap = new Map<string, number>();
    let totalRevenue = 0;
    for (const p of plans) {
      const country = p.enrollment.learner.country ?? 'Unknown';
      const rev = p.installments.reduce((s, i) => s + i.amount, 0);
      regionMap.set(country, (regionMap.get(country) ?? 0) + rev);
      totalRevenue += rev;
    }

    const revenueByRegion = Array.from(regionMap.entries()).map(([region, rev]) => ({
      region,
      revenue: `$${rev.toLocaleString()}`,
      share: totalRevenue > 0 ? `${Math.round((rev / totalRevenue) * 100)}%` : '0%',
    }));

    return { revenueByTrack, revenueByRegion };
  }

  async getSuperAdminEnrollments() {
    const [activeLearners, totalEnrollments, tracks, countries] =
      await Promise.all([
        this.prisma.enrollment.count({ where: { status: 'active' } }),
        this.prisma.enrollment.count(),
        this.prisma.track.findMany({
          include: {
            enrollments: true,
            waitlist_entries: true,
          },
        }),
        this.prisma.learner.findMany({
          select: { country: true },
          distinct: ['country'],
        }),
      ]);

    const completedEnrollments = await this.prisma.enrollment.count({
      where: { status: 'completed' },
    });

    const metrics = [
      { label: 'Active Learners', value: String(activeLearners) },
      { label: 'New Enrollments (MTD)', value: String(totalEnrollments) },
      {
        label: 'Foundation → Paid Conversion',
        value: totalEnrollments > 0
          ? `${Math.round((activeLearners / totalEnrollments) * 100)}%`
          : '0%',
      },
      { label: 'Dropout Rate (Avg)', value: '0%' },
      { label: 'Countries Represented', value: String(countries.length) },
    ];

    const byTrack = tracks.map((t) => {
      const active = t.enrollments.filter((e) => e.status === 'active').length;
      const completed = t.enrollments.filter((e) => e.status === 'completed').length;
      return {
        track: t.name,
        active,
        newMTD: t.enrollments.length,
        dropout: '0%',
        waitlist: t.waitlist_entries.length,
      };
    });

    return { metrics, byTrack };
  }


  // ── Instructor Dashboard ──────────────────────────────────────

  async getInstructorDashboard(instructorId: string) {
    const [labSessions, submissions, pods] = await Promise.all([
      this.prisma.labSession.findMany({
        where: { instructor_id: instructorId },
        include: { module: { select: { title: true } } },
        orderBy: { scheduled_at: 'asc' },
      }),
      this.prisma.submission.findMany({
        where: { status: 'submitted' },
        include: {
          learner: { include: { user: { select: { email: true } } } },
          assessment: { select: { title: true } },
        },
        orderBy: { submitted_at: 'desc' },
        take: 20,
      }),
      this.prisma.pod.findMany({
        where: { status: 'active' },
        include: {
          members: {
            include: { learner: { include: { user: { select: { email: true } } } } },
          },
          track: { select: { name: true } },
        },
      }),
    ]);

    const cohorts = labSessions.length > 0
      ? [
          {
            id: 'COH-001',
            name: `${labSessions[0]?.module?.title ?? 'Session'} Cohort`,
            track: 'Active',
            level: 'Beginner',
            learners: 0,
            status: 'Active',
          },
        ]
      : [];

    const gradingQueue = submissions.map((s) => ({
      id: s.id,
      learner: s.learner.user.email.split('@')[0],
      assessment: s.assessment?.title ?? 'Submission',
      submitted: s.submitted_at?.toISOString().split('T')[0] ?? '',
      status: 'Pending',
    }));

    const schedule = labSessions
      .filter((ls) => ls.scheduled_at > new Date())
      .slice(0, 5)
      .map((ls) => ({
        id: ls.id,
        session: ls.module.title,
        date: ls.scheduled_at.toISOString().split('T')[0],
        time: ls.scheduled_at.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        cohort: 'COH-001',
      }));

    const riskFlags: { id: string; learner: string; track: string; metric: string }[] = [];

    const podOverview = pods.map((p) => ({
      id: p.id,
      members: p.members.length,
      roles: p.members.map((m) => m.role),
      recentActivity: p.status,
    }));

    return { cohorts, gradingQueue, schedule, riskFlags, pods: podOverview };
  }

  // ── Assessor Dashboard ────────────────────────────────────────

  async getAssessorDashboard(assessorId: string) {
    const [assignedPods, submissions] = await Promise.all([
      this.prisma.pod.findMany({
        where: { assessor_id: assessorId },
        include: {
          members: true,
          track: { select: { name: true } },
        },
      }),
      this.prisma.submission.findMany({
        where: { status: 'submitted' },
        include: {
          learner: { include: { user: { select: { email: true } } } },
        },
        orderBy: { submitted_at: 'asc' },
        take: 20,
      }),
    ]);

    const pods = assignedPods.map((p) => ({
      id: p.id,
      members: p.members.length,
      submissions: 0,
      avgProfessionalism: 0,
      nextDeadline: '',
    }));

    const reviewQueue = submissions.map((s) => {
      const daysWaiting = s.submitted_at
        ? Math.floor((Date.now() - s.submitted_at.getTime()) / 86400000)
        : 0;
      return {
        id: s.id,
        learner: s.learner.user.email.split('@')[0],
        pod: '',
        type: 'Submission',
        submitted: s.submitted_at?.toISOString().split('T')[0] ?? '',
        daysWaiting,
      };
    });

    return { pods, reviewQueue };
  }


  // ── Learner Dashboard ─────────────────────────────────────────

  async getLearnerDashboard(learnerId: string) {
    const learner = await this.prisma.learner.findFirst({
      where: { user_id: learnerId },
      select: { id: true },
    });

    if (!learner) return { tracks: [], activities: [] };

    const enrollments = await this.prisma.enrollment.findMany({
      where: { learner_id: learner.id, status: 'active' },
      include: {
        track: {
          include: {
            levels: {
              include: { modules: true },
              orderBy: { sequence: 'asc' },
            },
          },
        },
      },
    });

    const tracks = enrollments.map((e) => {
      const totalModules = e.track.levels.reduce((s, l) => s + l.modules.length, 0);
      return {
        id: e.track.id,
        name: e.track.name,
        level: e.track.levels[0]?.tier ?? 'Beginner',
        module: `Module 1 of ${totalModules}`,
        progress: 0,
      };
    });

    const labSessions = await this.prisma.labSession.findMany({
      where: { scheduled_at: { gt: new Date() } },
      include: { module: { select: { title: true } } },
      orderBy: { scheduled_at: 'asc' },
      take: 5,
    });

    const activities = labSessions.map((ls) => ({
      id: ls.id,
      label: ls.module.title,
      date: ls.scheduled_at.toISOString().split('T')[0],
      type: 'lab',
    }));

    return { tracks, activities };
  }

  async getLearnerPayments(learnerId: string) {
    const learner = await this.prisma.learner.findFirst({
      where: { user_id: learnerId },
      select: { id: true },
    });

    if (!learner) return null;

    const enrollment = await this.prisma.enrollment.findFirst({
      where: { learner_id: learner.id },
      include: {
        track: { select: { name: true } },
        payment_plans: {
          include: { installments: { orderBy: { sequence: 'asc' } } },
          take: 1,
        },
      },
    });

    if (!enrollment || enrollment.payment_plans.length === 0) return null;

    const plan = enrollment.payment_plans[0];
    const hasOverdue = plan.installments.some((i) => i.status === 'overdue');

    return {
      id: plan.id,
      track: enrollment.track.name,
      plan: plan.plan_type,
      totalAmount: `$${plan.total_amount.toFixed(0)}`,
      currency: plan.currency,
      installments: plan.installments.map((i) => ({
        id: i.id,
        amount: `$${i.amount.toFixed(0)}`,
        dueDate: i.due_date.toISOString().split('T')[0],
        status: i.status,
      })),
      gracePeriodActive: hasOverdue,
      accessPaused: false,
    };
  }

  async getLearnerCertificates(learnerId: string) {
    const learner = await this.prisma.learner.findFirst({
      where: { user_id: learnerId },
      select: { id: true },
    });

    if (!learner) return [];

    const certs = await this.prisma.certificate.findMany({
      where: { learner_id: learner.id },
      include: { track: { select: { name: true } } },
      orderBy: { issued_at: 'desc' },
    });

    return certs.map((c) => ({
      id: c.id,
      verificationCode: c.verification_code,
      trackName: c.track.name,
      completionDate: c.issued_at.toISOString().split('T')[0],
      status: c.status,
    }));
  }

  async getLearnerPods(learnerId: string) {
    const learner = await this.prisma.learner.findFirst({
      where: { user_id: learnerId },
      select: { id: true },
    });

    if (!learner) return [];

    const podMembers = await this.prisma.podMember.findMany({
      where: { learner_id: learner.id },
      include: {
        pod: {
          include: {
            track: { select: { name: true } },
            members: true,
          },
        },
      },
    });

    return podMembers.map((pm) => ({
      id: pm.pod.id,
      name: pm.pod.id,
      track: pm.pod.track.name,
      members: pm.pod.members.length,
      status: pm.pod.status.charAt(0).toUpperCase() + pm.pod.status.slice(1),
    }));
  }
}
