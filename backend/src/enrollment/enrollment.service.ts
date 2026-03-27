/**
 * @file enrollment.service.ts
 * Core enrollment service managing the full learner lifecycle:
 * registration → onboarding → Foundation School → Track enrollment →
 * pod assignment → performance-gated progression.
 *
 * Business rules enforced:
 * - Foundation School (5 modules) must be completed before paid Track enrollment
 * - Learners enroll in full pathways (Beginner→Intermediate→Advanced), not individual levels
 * - Pods are multidisciplinary teams with 5 standard + 4 optional roles
 * - Performance gates allow max 2 reassessment attempts before module repeat
 * - Progress is cached with 2-minute TTL for high-read dashboard endpoints
 */
import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { CacheService } from '@common/cache/cache.service';
import { generateId } from '@common/utils/generate-id';
import { PodMemberRole } from '@prisma/client';
import { RegisterLearnerDto } from './dto/register-learner.dto';
import { OnboardLearnerDto } from './dto/onboard-learner.dto';
import { CompleteFoundationModuleDto } from './dto/complete-foundation-module.dto';
import { EnrollTrackDto } from './dto/enroll-track.dto';
import { JoinWaitlistDto } from './dto/join-waitlist.dto';
import { AssignPodDto } from './dto/assign-pod.dto';
import { ActivatePodDto } from './dto/activate-pod.dto';
import { EvaluateGateDto } from './dto/evaluate-gate.dto';

const FOUNDATION_MODULES = [
  'AI Literacy',
  'AI Fluency',
  'Systems Awareness',
  'Governance',
  'Professional Discipline',
];

/**
 * Simple keyword-to-track mapping for track recommendations.
 * Keys are lowercase keywords found in learning_goals or professional_background;
 * values are track names to recommend.
 */
const TRACK_KEYWORD_MAP: Record<string, string> = {
  'ai engineering': 'AI Engineering and Intelligent Systems',
  'machine learning': 'AI Engineering and Intelligent Systems',
  'intelligent systems': 'AI Engineering and Intelligent Systems',
  'data science': 'Data Science and Decision Intelligence',
  'data analysis': 'Data Science and Decision Intelligence',
  'analytics': 'Data Science and Decision Intelligence',
  'statistics': 'Data Science and Decision Intelligence',
  'cybersecurity': 'Cybersecurity and AI Security',
  'security': 'Cybersecurity and AI Security',
  'ai security': 'Cybersecurity and AI Security',
  'product management': 'AI Product and Project Leadership',
  'project management': 'AI Product and Project Leadership',
  'leadership': 'AI Product and Project Leadership',
  'product': 'AI Product and Project Leadership',
};

/**
 * Maps track names to the PodMemberRole assigned when a learner from that track joins a pod.
 */
const TRACK_TO_ROLE_MAP: Record<string, PodMemberRole> = {
  'AI Engineering and Intelligent Systems': PodMemberRole.AIEngineer,
  'Data Science and Decision Intelligence': PodMemberRole.DataScientist,
  'Cybersecurity and AI Security': PodMemberRole.CybersecurityAISecurity,
  'AI Product and Project Leadership': PodMemberRole.ProductManager,
};

/**
 * Standard roles required for a pod to be activated (excluding Assessor, which is tracked via assessor_id).
 */
const STANDARD_ROLES: PodMemberRole[] = [
  PodMemberRole.ProductManager,
  PodMemberRole.DataScientist,
  PodMemberRole.AIEngineer,
  PodMemberRole.CybersecurityAISecurity,
  PodMemberRole.IndustrySpecialist,
];

/**
 * Optional roles that can be added to a pod for additional capacity.
 */
const OPTIONAL_ROLES: PodMemberRole[] = [
  PodMemberRole.DataEngineer,
  PodMemberRole.DevOpsCloud,
  PodMemberRole.BusinessAnalyst,
  PodMemberRole.UXProductDesigner,
];

/** Maximum members per pod (standard + optional roles). */
const MAX_POD_SIZE = STANDARD_ROLES.length + OPTIONAL_ROLES.length;

@Injectable()
export class EnrollmentService {
  private readonly logger = new Logger(EnrollmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  /**
   * Register a new Learner profile linked to an existing User.
   * Collects optional country, professional_background, learning_goals.
   */
  async registerLearner(dto: RegisterLearnerDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.user_id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.prisma.learner.findUnique({
      where: { user_id: dto.user_id },
    });

    if (existing) {
      throw new ConflictException('Learner profile already exists for this user');
    }

    const learnerId = generateId('LRN');

    const learner = await this.prisma.learner.create({
      data: {
        id: learnerId,
        user_id: dto.user_id,
        country: dto.country,
        professional_background: dto.professional_background,
        learning_goals: dto.learning_goals,
      },
    });

    this.logger.log(`Learner registered: ${learner.id} for user ${dto.user_id}`);

    return {
      id: learner.id,
      user_id: learner.user_id,
      country: learner.country,
      professional_background: learner.professional_background,
      learning_goals: learner.learning_goals,
      onboarding_complete: learner.onboarding_complete,
    };
  }

  /**
   * Complete onboarding for a learner:
   * 1. Update profile fields (country, background, goals) if provided
   * 2. Mark onboarding_complete = true
   * 3. Recommend tracks based on goals/background keywords
   * 4. Auto-enroll in Foundation School (create FoundationProgress)
   */
  async onboardLearner(dto: OnboardLearnerDto) {
    const learner = await this.prisma.learner.findUnique({
      where: { id: dto.learner_id },
    });

    if (!learner) {
      throw new NotFoundException('Learner not found');
    }

    if (learner.onboarding_complete) {
      throw new BadRequestException('Onboarding already completed');
    }

    // Update learner profile with onboarding data
    const updatedLearner = await this.prisma.learner.update({
      where: { id: dto.learner_id },
      data: {
        country: dto.country ?? learner.country,
        professional_background:
          dto.professional_background ?? learner.professional_background,
        learning_goals: dto.learning_goals ?? learner.learning_goals,
        onboarding_complete: true,
      },
    });

    // Auto-create FoundationProgress with 5 modules all incomplete
    const foundationId = generateId('FND');
    const moduleStatuses = FOUNDATION_MODULES.map((name) => ({
      name,
      status: 'not_started',
    }));

    await this.prisma.foundationProgress.create({
      data: {
        id: foundationId,
        learner_id: dto.learner_id,
        module_statuses: moduleStatuses,
        completed: false,
      },
    });

    // Recommend tracks based on goals and background
    const recommendedTracks = this.recommendTracks(
      dto.learning_goals ?? updatedLearner.learning_goals,
      dto.professional_background ?? updatedLearner.professional_background,
    );

    this.logger.log(`Onboarding complete for learner: ${dto.learner_id}`);

    return {
      id: updatedLearner.id,
      user_id: updatedLearner.user_id,
      country: updatedLearner.country,
      professional_background: updatedLearner.professional_background,
      learning_goals: updatedLearner.learning_goals,
      onboarding_complete: updatedLearner.onboarding_complete,
      foundation_progress_id: foundationId,
      recommended_tracks: recommendedTracks,
    };
  }

  /**
   * Simple keyword-based track recommendation.
   * Scans learning_goals and professional_background for known keywords
   * and returns matching track names (deduplicated).
   */
  recommendTracks(
    learningGoals?: string | null,
    professionalBackground?: string | null,
  ): string[] {
    const text = [learningGoals ?? '', professionalBackground ?? '']
      .join(' ')
      .toLowerCase();

    const matched = new Set<string>();

    for (const [keyword, trackName] of Object.entries(TRACK_KEYWORD_MAP)) {
      if (text.includes(keyword)) {
        matched.add(trackName);
      }
    }

    // If no matches, return all tracks as general recommendations
    if (matched.size === 0) {
      return [
        'AI Engineering and Intelligent Systems',
        'Data Science and Decision Intelligence',
        'Cybersecurity and AI Security',
        'AI Product and Project Leadership',
      ];
    }

    return Array.from(matched);
  }

  /**
   * Get Foundation School progress for a learner.
   * Returns the 5 module statuses and overall completion state.
   */
  async getFoundationProgress(learnerId: string) {
    const progress = await this.prisma.foundationProgress.findUnique({
      where: { learner_id: learnerId },
    });

    if (!progress) {
      throw new NotFoundException('Foundation progress not found for this learner');
    }

    return {
      id: progress.id,
      learner_id: progress.learner_id,
      module_statuses: progress.module_statuses,
      completed: progress.completed,
      completed_at: progress.completed_at,
    };
  }

  /**
   * Mark a specific Foundation module as completed.
   * When all 5 modules are completed, sets overall Foundation as complete.
   */
  async completeFoundationModule(dto: CompleteFoundationModuleDto) {
    const progress = await this.prisma.foundationProgress.findUnique({
      where: { learner_id: dto.learner_id },
    });

    if (!progress) {
      throw new NotFoundException('Foundation progress not found for this learner');
    }

    if (progress.completed) {
      throw new BadRequestException('Foundation School already completed');
    }

    const statuses = progress.module_statuses as Array<{
      name: string;
      status: string;
    }>;

    const moduleIndex = statuses.findIndex((m) => m.name === dto.module_name);
    if (moduleIndex === -1) {
      throw new BadRequestException(`Module "${dto.module_name}" not found in Foundation progress`);
    }

    if (statuses[moduleIndex].status === 'completed') {
      throw new BadRequestException(`Module "${dto.module_name}" is already completed`);
    }

    // Mark the module as completed
    statuses[moduleIndex].status = 'completed';

    // Check if all 5 modules are now completed
    const allCompleted = statuses.every((m) => m.status === 'completed');

    const updated = await this.prisma.foundationProgress.update({
      where: { learner_id: dto.learner_id },
      data: {
        module_statuses: statuses,
        completed: allCompleted,
        completed_at: allCompleted ? new Date() : null,
      },
    });

    this.logger.log(
      `Foundation module "${dto.module_name}" completed for learner ${dto.learner_id}` +
        (allCompleted ? ' — Foundation School complete!' : ''),
    );

    return {
      id: updated.id,
      learner_id: updated.learner_id,
      module_statuses: updated.module_statuses,
      completed: updated.completed,
      completed_at: updated.completed_at,
    };
  }

  /**
   * Get Foundation completion status.
   * If complete, also returns available paid Track Pathways.
   */
  async getFoundationStatus(learnerId: string) {
    const progress = await this.prisma.foundationProgress.findUnique({
      where: { learner_id: learnerId },
    });

    if (!progress) {
      throw new NotFoundException('Foundation progress not found for this learner');
    }

    const result: {
      learner_id: string;
      foundation_complete: boolean;
      completed_at: Date | null;
      available_tracks?: Array<{
        id: string;
        name: string;
        description: string | null;
        status: string;
        estimated_duration: string | null;
      }>;
    } = {
      learner_id: progress.learner_id,
      foundation_complete: progress.completed,
      completed_at: progress.completed_at,
    };

    // On completion, present catalog of available paid Track Pathways
    if (progress.completed) {
      const tracks = await this.prisma.track.findMany({
        where: { status: 'available' },
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          estimated_duration: true,
        },
      });
      result.available_tracks = tracks;
    }

    return result;
  }

  /**
   * Check if a learner has completed Foundation School.
   * Used as a prerequisite check before paid Track enrollment.
   */
  async assertFoundationComplete(learnerId: string): Promise<void> {
    const progress = await this.prisma.foundationProgress.findUnique({
      where: { learner_id: learnerId },
    });

    if (!progress) {
      throw new NotFoundException('Foundation progress not found for this learner');
    }

    if (!progress.completed) {
      throw new ForbiddenException(
        'Foundation School must be completed before enrolling in a paid Track Pathway',
      );
    }
  }

  /**
   * Enroll a learner in a full Track Pathway (Beginner + Intermediate + Advanced).
   * Requires Foundation School completion. Assigns learner to the first module
   * of the Beginner level.
   */
  async enrollInTrack(trackId: string, dto: EnrollTrackDto) {
    // 1. Verify Foundation is complete
    await this.assertFoundationComplete(dto.learner_id);

    // 2. Verify track exists and is available
    const track = await this.prisma.track.findUnique({
      where: { id: trackId },
      include: {
        levels: {
          orderBy: { sequence: 'asc' },
          include: {
            modules: {
              orderBy: { sequence: 'asc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!track) {
      throw new NotFoundException(`Track ${trackId} not found`);
    }

    if (track.status === 'waitlisted') {
      throw new BadRequestException(
        `Track "${track.name}" is not available for enrollment. Join the waitlist instead.`,
      );
    }

    // 3. Check for duplicate enrollment
    const existing = await this.prisma.enrollment.findFirst({
      where: {
        learner_id: dto.learner_id,
        track_id: trackId,
        status: { in: ['active', 'completed'] },
      },
    });

    if (existing) {
      throw new ConflictException('Learner is already enrolled in this track');
    }

    // 4. Create enrollment for the full pathway
    const enrollmentId = generateId('ENR');

    const enrollment = await this.prisma.enrollment.create({
      data: {
        id: enrollmentId,
        learner_id: dto.learner_id,
        track_id: trackId,
        status: 'active',
      },
    });

    // 5. Determine first module assignment
    const beginnerLevel = track.levels.find((l) => l.tier === 'Beginner');
    const firstModule = beginnerLevel?.modules[0] ?? null;

    this.logger.log(
      `Learner ${dto.learner_id} enrolled in track ${trackId} (${track.name}), enrollment ${enrollmentId}`,
    );

    return {
      id: enrollment.id,
      learner_id: enrollment.learner_id,
      track_id: enrollment.track_id,
      track_name: track.name,
      status: enrollment.status,
      enrolled_at: enrollment.enrolled_at,
      current_level: beginnerLevel
        ? { id: beginnerLevel.id, tier: beginnerLevel.tier }
        : null,
      current_module: firstModule
        ? { id: firstModule.id, title: firstModule.title }
        : null,
    };
  }

  /**
   * Add a learner to the waitlist for a track.
   * Position is determined by the current count of waitlist entries for the track + 1.
   */
  async joinWaitlist(trackId: string, dto: JoinWaitlistDto) {
    // 1. Verify track exists
    const track = await this.prisma.track.findUnique({
      where: { id: trackId },
    });

    if (!track) {
      throw new NotFoundException(`Track ${trackId} not found`);
    }

    // 2. Check for duplicate waitlist entry
    const existing = await this.prisma.waitlistEntry.findFirst({
      where: {
        learner_id: dto.learner_id,
        track_id: trackId,
      },
    });

    if (existing) {
      throw new ConflictException('Learner is already on the waitlist for this track');
    }

    // 3. Determine position (max position + 1)
    const maxPosition = await this.prisma.waitlistEntry.aggregate({
      where: { track_id: trackId },
      _max: { position: true },
    });

    const position = (maxPosition._max.position ?? 0) + 1;

    // 4. Create waitlist entry
    const waitlistId = generateId('WTL');

    const entry = await this.prisma.waitlistEntry.create({
      data: {
        id: waitlistId,
        learner_id: dto.learner_id,
        track_id: trackId,
        position,
      },
    });

    this.logger.log(
      `Learner ${dto.learner_id} joined waitlist for track ${trackId} at position ${position}`,
    );

    return {
      id: entry.id,
      learner_id: entry.learner_id,
      track_id: entry.track_id,
      track_name: track.name,
      position: entry.position,
      joined_at: entry.joined_at,
    };
  }

  /**
   * Notify waitlisted learners when a track becomes available.
   * Notifies in order of position, sets a 72-hour enrollment window.
   */
  async notifyWaitlist(trackId: string) {
    const entries = await this.prisma.waitlistEntry.findMany({
      where: {
        track_id: trackId,
        notified_at: null,
      },
      orderBy: { position: 'asc' },
    });

    if (entries.length === 0) {
      return { notified_count: 0 };
    }

    const ENROLLMENT_WINDOW_HOURS = 72;
    const now = new Date();
    const deadline = new Date(now.getTime() + ENROLLMENT_WINDOW_HOURS * 60 * 60 * 1000);

    const notifiedEntries = [];

    for (const entry of entries) {
      const updated = await this.prisma.waitlistEntry.update({
        where: { id: entry.id },
        data: {
          notified_at: now,
          enrollment_deadline: deadline,
        },
      });
      notifiedEntries.push(updated);
    }

    this.logger.log(
      `Notified ${notifiedEntries.length} waitlisted learners for track ${trackId}`,
    );

    return {
      notified_count: notifiedEntries.length,
      enrollment_deadline: deadline,
    };
  }

  /**
   * Release expired waitlist slots.
   * If a learner's 72-hour enrollment window has passed without enrollment,
   * remove their waitlist entry so the next learner can be notified.
   */
  async releaseExpiredWaitlistSlots(trackId: string) {
    const now = new Date();

    const expiredEntries = await this.prisma.waitlistEntry.findMany({
      where: {
        track_id: trackId,
        notified_at: { not: null },
        enrollment_deadline: { lt: now },
      },
      orderBy: { position: 'asc' },
    });

    if (expiredEntries.length === 0) {
      return { released_count: 0 };
    }

    // Check which expired learners actually enrolled
    const releasedIds: string[] = [];

    for (const entry of expiredEntries) {
      const enrolled = await this.prisma.enrollment.findFirst({
        where: {
          learner_id: entry.learner_id,
          track_id: trackId,
          status: { in: ['active', 'completed'] },
        },
      });

      if (!enrolled) {
        await this.prisma.waitlistEntry.delete({
          where: { id: entry.id },
        });
        releasedIds.push(entry.id);
      }
    }

    this.logger.log(
      `Released ${releasedIds.length} expired waitlist slots for track ${trackId}`,
    );

    return {
      released_count: releasedIds.length,
      released_ids: releasedIds,
    };
  }

  // ─── Pod Assignment & Management ────────────────────────────────

  /**
   * Determine the PodMemberRole for a learner based on their enrolled track name.
   */
  resolveRoleForTrack(trackName: string): PodMemberRole {
    const role = TRACK_TO_ROLE_MAP[trackName];
    if (role) return role;

    // Default to IndustrySpecialist for tracks not in the mapping
    return PodMemberRole.IndustrySpecialist;
  }

  /**
   * Assign a learner to a pod for a given track.
   * Finds an existing pending pod with a vacancy for the learner's role,
   * or creates a new pod if none is available.
   */
  async assignLearnerToPod(dto: AssignPodDto) {
    // 1. Verify track exists
    const track = await this.prisma.track.findUnique({
      where: { id: dto.track_id },
    });

    if (!track) {
      throw new NotFoundException(`Track ${dto.track_id} not found`);
    }

    // 2. Verify learner exists
    const learner = await this.prisma.learner.findUnique({
      where: { id: dto.learner_id },
    });

    if (!learner) {
      throw new NotFoundException(`Learner ${dto.learner_id} not found`);
    }

    // 3. Check learner is not already in a pod for this track
    const existingMembership = await this.prisma.podMember.findFirst({
      where: {
        learner_id: dto.learner_id,
        pod: { track_id: dto.track_id, status: { in: ['pending', 'active'] } },
      },
    });

    if (existingMembership) {
      throw new ConflictException('Learner is already assigned to a pod for this track');
    }

    // 4. Determine role based on track
    const role = this.resolveRoleForTrack(track.name);

    // 5. Find a pending pod with vacancy for this role
    const candidatePods = await this.prisma.pod.findMany({
      where: {
        track_id: dto.track_id,
        status: 'pending',
      },
      include: { members: true },
    });

    let targetPod = candidatePods.find((pod) => {
      const hasRole = pod.members.some((m) => m.role === role);
      return !hasRole && pod.members.length < MAX_POD_SIZE;
    });

    // 6. Create a new pod if no suitable one found
    if (!targetPod) {
      const podId = generateId('POD');
      targetPod = await this.prisma.pod.create({
        data: {
          id: podId,
          track_id: dto.track_id,
        },
        include: { members: true },
      });
    }

    // 7. Create pod member
    const memberId = generateId('PDM');
    const member = await this.prisma.podMember.create({
      data: {
        id: memberId,
        pod_id: targetPod!.id,
        learner_id: dto.learner_id,
        role,
      },
    });

    this.logger.log(
      `Learner ${dto.learner_id} assigned to pod ${targetPod!.id} as ${role}`,
    );

    return {
      pod_id: targetPod!.id,
      member_id: member.id,
      learner_id: member.learner_id,
      role: member.role,
      track_id: dto.track_id,
      track_name: track.name,
      pod_status: targetPod!.status,
      assigned_at: member.assigned_at,
    };
  }

  /**
   * Get pod details with all members.
   */
  async getPodDetails(podId: string) {
    const pod = await this.prisma.pod.findUnique({
      where: { id: podId },
      include: {
        members: {
          include: { learner: { select: { id: true, user_id: true } } },
        },
        track: { select: { id: true, name: true } },
      },
    });

    if (!pod) {
      throw new NotFoundException(`Pod ${podId} not found`);
    }

    const filledRoles = pod.members.map((m) => m.role);
    const missingStandardRoles = STANDARD_ROLES.filter(
      (r) => !filledRoles.includes(r),
    );

    return {
      id: pod.id,
      track: pod.track,
      assessor_id: pod.assessor_id,
      status: pod.status,
      activated_at: pod.activated_at,
      created_at: pod.created_at,
      members: pod.members.map((m) => ({
        id: m.id,
        learner_id: m.learner_id,
        role: m.role,
        assigned_at: m.assigned_at,
      })),
      filled_roles: filledRoles,
      missing_standard_roles: missingStandardRoles,
    };
  }

  /**
   * Activate a pod. Requires:
   * 1. An assessor to be assigned (via assessor_id in the DTO)
   * 2. All standard roles to be filled by pod members
   */
  async activatePod(podId: string, dto: ActivatePodDto) {
    const pod = await this.prisma.pod.findUnique({
      where: { id: podId },
      include: { members: true },
    });

    if (!pod) {
      throw new NotFoundException(`Pod ${podId} not found`);
    }

    if (pod.status === 'active') {
      throw new BadRequestException('Pod is already active');
    }

    if (pod.status === 'disbanded' || pod.status === 'completed') {
      throw new BadRequestException(`Cannot activate a pod with status "${pod.status}"`);
    }

    // Verify assessor exists and has Assessor role
    const assessor = await this.prisma.user.findUnique({
      where: { id: dto.assessor_id },
    });

    if (!assessor) {
      throw new NotFoundException(`Assessor user ${dto.assessor_id} not found`);
    }

    if (assessor.role !== 'Assessor') {
      throw new BadRequestException('Assigned user does not have the Assessor role');
    }

    // Check all standard roles are filled
    const filledRoles = pod.members.map((m) => m.role);
    const missingRoles = STANDARD_ROLES.filter((r) => !filledRoles.includes(r));

    if (missingRoles.length > 0) {
      throw new BadRequestException(
        `Pod cannot be activated. Missing standard roles: ${missingRoles.join(', ')}`,
      );
    }

    // Activate the pod
    const activated = await this.prisma.pod.update({
      where: { id: podId },
      data: {
        assessor_id: dto.assessor_id,
        status: 'active',
        activated_at: new Date(),
      },
    });

    this.logger.log(`Pod ${podId} activated with assessor ${dto.assessor_id}`);

    return {
      id: activated.id,
      track_id: activated.track_id,
      assessor_id: activated.assessor_id,
      status: activated.status,
      activated_at: activated.activated_at,
      member_count: pod.members.length,
    };
  }

  /**
   * Reassign members from a pod that has dropped below minimum standard roles.
   * Finds active pods with matching vacancies and moves members there.
   * Disbands the original pod after reassignment.
   */
  async reassignPodMembers(podId: string) {
    const pod = await this.prisma.pod.findUnique({
      where: { id: podId },
      include: { members: true },
    });

    if (!pod) {
      throw new NotFoundException(`Pod ${podId} not found`);
    }

    const filledRoles = pod.members.map((m) => m.role);
    const missingStandardRoles = STANDARD_ROLES.filter(
      (r) => !filledRoles.includes(r),
    );

    // Only reassign if pod is below minimum standard roles
    if (missingStandardRoles.length === 0) {
      throw new BadRequestException(
        'Pod has all standard roles filled. No reassignment needed.',
      );
    }

    // Find active pods in the same track with matching vacancies
    const activePods = await this.prisma.pod.findMany({
      where: {
        track_id: pod.track_id,
        status: 'active',
        id: { not: podId },
      },
      include: { members: true },
    });

    const reassigned: Array<{ member_id: string; new_pod_id: string; role: string }> = [];

    for (const member of pod.members) {
      const targetPod = activePods.find((ap) => {
        const hasRole = ap.members.some((m) => m.role === member.role);
        return !hasRole && ap.members.length < MAX_POD_SIZE;
      });

      if (targetPod) {
        await this.prisma.podMember.update({
          where: { id: member.id },
          data: { pod_id: targetPod.id },
        });

        // Update local state so subsequent iterations see the new member
        targetPod.members.push(member);

        reassigned.push({
          member_id: member.id,
          new_pod_id: targetPod.id,
          role: member.role,
        });
      }
    }

    // Disband the original pod
    await this.prisma.pod.update({
      where: { id: podId },
      data: { status: 'disbanded' },
    });

    this.logger.log(
      `Pod ${podId} disbanded. ${reassigned.length}/${pod.members.length} members reassigned.`,
    );

    return {
      disbanded_pod_id: podId,
      reassigned_members: reassigned,
      unassigned_count: pod.members.length - reassigned.length,
    };
  }

  // ─── Performance-Gated Progression ──────────────────────────────

  /**
   * Evaluate a learner against a performance gate threshold.
   * 1. Look up the PerformanceGate by ID
   * 2. Count existing GateAttempts for this learner + gate
   * 3. If attempts >= max_attempts (2): throw error, require module repeat
   * 4. Record new GateAttempt with score
   * 5. If score >= threshold_score: passed=true, return unlock info
   * 6. If score < threshold_score: passed=false, return feedback + remaining attempts
   */
  async evaluateGate(gateId: string, dto: EvaluateGateDto) {
    // 1. Look up the gate with its module and level context
    const gate = await this.prisma.performanceGate.findUnique({
      where: { id: gateId },
      include: {
        module: {
          include: {
            level: {
              include: {
                modules: { orderBy: { sequence: 'asc' } },
                track: {
                  include: {
                    levels: {
                      orderBy: { sequence: 'asc' },
                      include: {
                        modules: { orderBy: { sequence: 'asc' }, take: 1 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!gate) {
      throw new NotFoundException(`Performance gate ${gateId} not found`);
    }

    // 2. Count existing attempts for this learner + gate
    const existingAttempts = await this.prisma.gateAttempt.count({
      where: {
        gate_id: gateId,
        learner_id: dto.learner_id,
      },
    });

    // 3. If attempts exhausted, require module repeat
    if (existingAttempts >= gate.max_attempts) {
      throw new BadRequestException(
        `Maximum attempts (${gate.max_attempts}) exhausted for gate ${gateId}. Module repeat required.`,
      );
    }

    // 4. Record new GateAttempt
    const attemptNumber = existingAttempts + 1;
    const passed = dto.score >= gate.threshold_score;
    const attemptId = generateId('GTA');

    await this.prisma.gateAttempt.create({
      data: {
        id: attemptId,
        gate_id: gateId,
        learner_id: dto.learner_id,
        score: dto.score,
        passed,
        attempt_number: attemptNumber,
      },
    });

    // Invalidate cached progress for this learner across all tracks
    // (we don't know which track here easily, so we let progress re-cache on next read)

    const module = gate.module;
    const level = module.level;
    const track = level.track;

    // 5. If passed, determine what to unlock
    if (passed) {
      const nextUnlock = this.determineNextUnlock(module, level, track);

      this.logger.log(
        `Learner ${dto.learner_id} passed gate ${gateId} (score: ${dto.score}/${gate.threshold_score})`,
      );

      return {
        passed: true,
        score: dto.score,
        threshold: gate.threshold_score,
        attempt_number: attemptNumber,
        attempt_id: attemptId,
        feedback: 'Congratulations! You have passed this performance gate.',
        next_action: 'unlock',
        unlock: nextUnlock,
      };
    }

    // 6. If failed, return feedback + remaining attempts
    const remainingAttempts = gate.max_attempts - attemptNumber;

    this.logger.log(
      `Learner ${dto.learner_id} failed gate ${gateId} (score: ${dto.score}/${gate.threshold_score}, remaining: ${remainingAttempts})`,
    );

    if (remainingAttempts > 0) {
      return {
        passed: false,
        score: dto.score,
        threshold: gate.threshold_score,
        attempt_number: attemptNumber,
        attempt_id: attemptId,
        feedback: `Score ${dto.score} is below the required threshold of ${gate.threshold_score}. Review the module content and try again.`,
        next_action: 'reassessment',
        remaining_attempts: remainingAttempts,
      };
    }

    return {
      passed: false,
      score: dto.score,
      threshold: gate.threshold_score,
      attempt_number: attemptNumber,
      attempt_id: attemptId,
      feedback: `Score ${dto.score} is below the required threshold of ${gate.threshold_score}. All attempts exhausted.`,
      next_action: 'module_repeat',
      remaining_attempts: 0,
    };
  }

  /**
   * Determine what gets unlocked after passing a gate.
   * - If there's a next module in the same level, unlock it.
   * - If this is the last module in the level, unlock the next level's first module.
   */
  private determineNextUnlock(
    module: { id: string; sequence: number; title: string },
    level: {
      id: string;
      tier: string;
      sequence: number;
      modules: Array<{ id: string; sequence: number; title: string }>;
    },
    track: {
      id: string;
      name: string;
      levels: Array<{
        id: string;
        tier: string;
        sequence: number;
        modules: Array<{ id: string; title: string }>;
      }>;
    },
  ) {
    // Check for next module in same level
    const nextModule = level.modules.find((m) => m.sequence === module.sequence + 1);
    if (nextModule) {
      return {
        type: 'module' as const,
        level_id: level.id,
        level_tier: level.tier,
        module_id: nextModule.id,
        module_title: nextModule.title,
      };
    }

    // Last module in level — check for next level
    const nextLevel = track.levels.find((l) => l.sequence === level.sequence + 1);
    if (nextLevel && nextLevel.modules.length > 0) {
      return {
        type: 'level' as const,
        level_id: nextLevel.id,
        level_tier: nextLevel.tier,
        module_id: nextLevel.modules[0].id,
        module_title: nextLevel.modules[0].title,
      };
    }

    // All levels complete — capstone eligible
    return {
      type: 'capstone' as const,
      track_id: track.id,
      track_name: track.name,
    };
  }

  /**
   * Get learner progress across all enrolled tracks.
   * Cached in Redis with key `progress:{LRN-*}:{TRK-*}` and 2 min TTL.
   */
  async getLearnerProgress(learnerId: string) {
    // Verify learner exists
    const learner = await this.prisma.learner.findUnique({
      where: { id: learnerId },
    });

    if (!learner) {
      throw new NotFoundException(`Learner ${learnerId} not found`);
    }

    // Get all active enrollments
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        learner_id: learnerId,
        status: { in: ['active', 'completed'] },
      },
      include: {
        track: {
          include: {
            levels: {
              orderBy: { sequence: 'asc' },
              include: {
                modules: {
                  orderBy: { sequence: 'asc' },
                  include: {
                    performance_gates: {
                      include: {
                        attempts: {
                          where: { learner_id: learnerId },
                          orderBy: { attempt_number: 'asc' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const trackProgressList = [];

    for (const enrollment of enrollments) {
      // Check cache first
      const cacheKey = `progress:${learnerId}:${enrollment.track_id}`;
      const cached = await this.cache.get<object>(cacheKey);
      if (cached) {
        trackProgressList.push(cached);
        continue;
      }

      const trackProgress = this.computeTrackProgress(enrollment, learnerId);

      // Cache for 2 minutes
      await this.cache.set(cacheKey, trackProgress, 120);
      trackProgressList.push(trackProgress);
    }

    return {
      learner_id: learnerId,
      tracks: trackProgressList,
    };
  }

  /**
   * Compute progress for a single track enrollment.
   */
  private computeTrackProgress(
    enrollment: {
      id: string;
      track_id: string;
      status: string;
      enrolled_at: Date;
      track: {
        id: string;
        name: string;
        levels: Array<{
          id: string;
          tier: string;
          sequence: number;
          modules: Array<{
            id: string;
            title: string;
            sequence: number;
            performance_gates: Array<{
              id: string;
              threshold_score: number;
              max_attempts: number;
              attempts: Array<{
                id: string;
                score: number;
                passed: boolean;
                attempt_number: number;
              }>;
            }>;
          }>;
        }>;
      };
    },
    learnerId: string,
  ) {
    let totalModules = 0;
    let completedModules = 0;
    let currentLevel: { id: string; tier: string } | null = null;
    let currentModule: { id: string; title: string } | null = null;
    const gateResults: Array<{
      gate_id: string;
      module_id: string;
      module_title: string;
      passed: boolean;
      best_score: number | null;
      attempts_used: number;
      max_attempts: number;
    }> = [];

    for (const level of enrollment.track.levels) {
      for (const mod of level.modules) {
        totalModules++;

        const gate = mod.performance_gates[0]; // One gate per module
        if (gate) {
          const passed = gate.attempts.some((a) => a.passed);
          const bestScore = gate.attempts.length > 0
            ? Math.max(...gate.attempts.map((a) => a.score))
            : null;

          gateResults.push({
            gate_id: gate.id,
            module_id: mod.id,
            module_title: mod.title,
            passed,
            best_score: bestScore,
            attempts_used: gate.attempts.length,
            max_attempts: gate.max_attempts,
          });

          if (passed) {
            completedModules++;
          } else if (!currentModule) {
            // First non-passed module is the current one
            currentLevel = { id: level.id, tier: level.tier };
            currentModule = { id: mod.id, title: mod.title };
          }
        } else {
          // Module without a gate — if no current module set yet, this is it
          if (!currentModule && completedModules < totalModules) {
            currentLevel = { id: level.id, tier: level.tier };
            currentModule = { id: mod.id, title: mod.title };
          }
        }
      }
    }

    // If no current module found, learner is at the first module
    if (!currentModule && enrollment.track.levels.length > 0) {
      const firstLevel = enrollment.track.levels[0];
      if (firstLevel.modules.length > 0) {
        currentLevel = { id: firstLevel.id, tier: firstLevel.tier };
        currentModule = { id: firstLevel.modules[0].id, title: firstLevel.modules[0].title };
      }
    }

    const completionPercentage = totalModules > 0
      ? Math.round((completedModules / totalModules) * 100)
      : 0;

    return {
      enrollment_id: enrollment.id,
      track_id: enrollment.track_id,
      track_name: enrollment.track.name,
      status: enrollment.status,
      enrolled_at: enrollment.enrolled_at,
      current_level: currentLevel,
      current_module: currentModule,
      completion_percentage: completionPercentage,
      completed_modules: completedModules,
      total_modules: totalModules,
      gate_results: gateResults,
    };
  }
}
