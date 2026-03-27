/**
 * Seed script for KoreField Academy demo user data.
 *
 * Seeds all user roles, learners with full profiles, enrollments,
 * pods, payment plans, gate attempts, submissions, capstones,
 * defenses, certificates, and certification eligibility.
 *
 * Idempotent — uses upsert to avoid duplicates on re-run.
 *
 * Usage: cd backend && pnpm ts-node --transpile-only ../db/seeds/seed-users.ts
 */

import {
  PrismaClient,
  UserRole,
  UserStatus,
  EnrollmentStatus,
  PodStatus,
  PodMemberRole,
  PaymentPlanType,
  PaymentPlanStatus,
  InstallmentStatus,
  CapstoneStatus,
  CertificateStatus,
  SubmissionStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

// ─── Constants ──────────────────────────────────────────────────

const PASSWORD_HASH =
  '$2b$10$rQZ8K5Y5Y5Y5Y5Y5Y5Y5YuE8Xz3kV7mN9pQ2wR4tY6uI8oP0aS2dF';

const NOW = new Date();
const ONE_MONTH_AGO = new Date(NOW.getTime() - 30 * 24 * 60 * 60 * 1000);
const TWO_MONTHS_AGO = new Date(NOW.getTime() - 60 * 24 * 60 * 60 * 1000);
const THREE_MONTHS_AGO = new Date(NOW.getTime() - 90 * 24 * 60 * 60 * 1000);
const ONE_MONTH_AHEAD = new Date(NOW.getTime() + 30 * 24 * 60 * 60 * 1000);
const TWO_MONTHS_AHEAD = new Date(NOW.getTime() + 60 * 24 * 60 * 60 * 1000);

// Track IDs from seed-curriculum.ts
const TRACK_AI_ENG = 'TRK-ai-eng-001';
const TRACK_DATA_SCI = 'TRK-data-sci-002';
const TRACK_CYBER_SEC = 'TRK-cyber-sec-003';
const TRACK_AI_PROD = 'TRK-ai-prod-004';

// ─── Staff Users ────────────────────────────────────────────────

interface StaffUser {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

const staffUsers: StaffUser[] = [
  { id: 'USR-olumide-001', email: 'olumide@korefield.com', role: UserRole.SuperAdmin, status: UserStatus.Active },
  { id: 'USR-blessing-002', email: 'blessing@korefield.com', role: UserRole.Admin, status: UserStatus.Active },
  { id: 'USR-emeka-003', email: 'emeka@korefield.com', role: UserRole.Instructor, status: UserStatus.Active },
  { id: 'USR-amina-004', email: 'amina@korefield.com', role: UserRole.Instructor, status: UserStatus.Active },
  { id: 'USR-babatunde-005', email: 'babatunde@korefield.com', role: UserRole.Assessor, status: UserStatus.Active },
  { id: 'USR-wanjiku-006', email: 'wanjiku@korefield.com', role: UserRole.Assessor, status: UserStatus.Active },
  { id: 'USR-techafrica-007', email: 'techafrica@partner.com', role: UserRole.CorporatePartner, status: UserStatus.Active },
  { id: 'USR-chidinma-008', email: 'chidinma@korefield.com', role: UserRole.FinanceAdmin, status: UserStatus.Active },
  { id: 'USR-tunde-009', email: 'tunde@korefield.com', role: UserRole.DevOpsEngineer, status: UserStatus.Active },
];


// ─── Learner Definitions ────────────────────────────────────────

interface LearnerDef {
  userId: string;
  learnerId: string;
  email: string;
  country: string;
  professionalBackground: string;
  learningGoals: string;
  trackId: string;
  enrollmentId: string;
  podId: string;
  podMemberRole: PodMemberRole;
}

const learners: LearnerDef[] = [
  {
    userId: 'USR-ngozi-010', learnerId: 'LRN-ngozi-010', email: 'ngozi@learner.com',
    country: 'Nigeria', professionalBackground: 'Software Developer',
    learningGoals: 'Master AI engineering and build production AI systems',
    trackId: TRACK_AI_ENG, enrollmentId: 'ENR-ngozi-010',
    podId: 'POD-zambezi', podMemberRole: PodMemberRole.AIEngineer,
  },
  {
    userId: 'USR-tendai-011', learnerId: 'LRN-tendai-011', email: 'tendai@learner.com',
    country: 'Zimbabwe', professionalBackground: 'Data Analyst',
    learningGoals: 'Transition into data science and decision intelligence',
    trackId: TRACK_DATA_SCI, enrollmentId: 'ENR-tendai-011',
    podId: 'POD-limpopo', podMemberRole: PodMemberRole.DataScientist,
  },
  {
    userId: 'USR-aisha-012', learnerId: 'LRN-aisha-012', email: 'aisha@learner.com',
    country: 'Senegal', professionalBackground: 'Student',
    learningGoals: 'Build expertise in cybersecurity and AI security',
    trackId: TRACK_CYBER_SEC, enrollmentId: 'ENR-aisha-012',
    podId: 'POD-volta', podMemberRole: PodMemberRole.CybersecurityAISecurity,
  },
  {
    userId: 'USR-kofi-013', learnerId: 'LRN-kofi-013', email: 'kofi@learner.com',
    country: 'Ghana', professionalBackground: 'Business Professional',
    learningGoals: 'Lead AI product initiatives and digital transformation',
    trackId: TRACK_AI_PROD, enrollmentId: 'ENR-kofi-013',
    podId: 'POD-niger', podMemberRole: PodMemberRole.ProductManager,
  },
  {
    userId: 'USR-halima-014', learnerId: 'LRN-halima-014', email: 'halima@learner.com',
    country: 'Nigeria', professionalBackground: 'Educator',
    learningGoals: 'Apply data science to education research and policy',
    trackId: TRACK_DATA_SCI, enrollmentId: 'ENR-halima-014',
    podId: 'POD-limpopo', podMemberRole: PodMemberRole.BusinessAnalyst,
  },
  {
    userId: 'USR-samuel-015', learnerId: 'LRN-samuel-015', email: 'samuel@learner.com',
    country: 'Ghana', professionalBackground: 'Student',
    learningGoals: 'Start a career in AI engineering from scratch',
    trackId: TRACK_AI_ENG, enrollmentId: 'ENR-samuel-015',
    podId: 'POD-zambezi', podMemberRole: PodMemberRole.DevOpsCloud,
  },
  {
    userId: 'USR-fatima-016', learnerId: 'LRN-fatima-016', email: 'fatima@learner.com',
    country: 'Nigeria', professionalBackground: 'Software Developer',
    learningGoals: 'Advance into intermediate AI engineering and LangChain',
    trackId: TRACK_AI_ENG, enrollmentId: 'ENR-fatima-016',
    podId: 'POD-zambezi', podMemberRole: PodMemberRole.DataEngineer,
  },
  {
    userId: 'USR-kwame-017', learnerId: 'LRN-kwame-017', email: 'kwame@learner.com',
    country: 'Ghana', professionalBackground: 'Software Developer',
    learningGoals: 'Complete AI engineering beginner track and build portfolio',
    trackId: TRACK_AI_ENG, enrollmentId: 'ENR-kwame-017',
    podId: 'POD-zambezi', podMemberRole: PodMemberRole.UXProductDesigner,
  },
  {
    userId: 'USR-amara-018', learnerId: 'LRN-amara-018', email: 'amara@learner.com',
    country: 'Nigeria', professionalBackground: 'Business Professional',
    learningGoals: 'Understand AI product management and stakeholder alignment',
    trackId: TRACK_AI_PROD, enrollmentId: 'ENR-amara-018',
    podId: 'POD-niger', podMemberRole: PodMemberRole.IndustrySpecialist,
  },
  {
    userId: 'USR-zara-019', learnerId: 'LRN-zara-019', email: 'zara@learner.com',
    country: 'Kenya', professionalBackground: 'Data Analyst',
    learningGoals: 'Achieve cybersecurity certification and pivot career',
    trackId: TRACK_CYBER_SEC, enrollmentId: 'ENR-zara-019',
    podId: 'POD-volta', podMemberRole: PodMemberRole.DataScientist,
  },
];


// ─── Foundation Module Statuses ─────────────────────────────────

const FOUNDATION_COMPLETE = JSON.stringify([
  { module_id: 'FND-mod-ai-literacy', status: 'completed', score: 92, completed_at: THREE_MONTHS_AGO.toISOString() },
  { module_id: 'FND-mod-ai-fluency', status: 'completed', score: 88, completed_at: THREE_MONTHS_AGO.toISOString() },
  { module_id: 'FND-mod-systems', status: 'completed', score: 85, completed_at: TWO_MONTHS_AGO.toISOString() },
  { module_id: 'FND-mod-governance', status: 'completed', score: 90, completed_at: TWO_MONTHS_AGO.toISOString() },
  { module_id: 'FND-mod-discipline', status: 'completed', score: 95, completed_at: ONE_MONTH_AGO.toISOString() },
]);

// ─── Pod Definitions ────────────────────────────────────────────

interface PodDef {
  id: string;
  trackId: string;
  assessorId: string;
}

const pods: PodDef[] = [
  { id: 'POD-zambezi', trackId: TRACK_AI_ENG, assessorId: 'USR-babatunde-005' },
  { id: 'POD-limpopo', trackId: TRACK_DATA_SCI, assessorId: 'USR-wanjiku-006' },
  { id: 'POD-volta', trackId: TRACK_CYBER_SEC, assessorId: 'USR-babatunde-005' },
  { id: 'POD-niger', trackId: TRACK_AI_PROD, assessorId: 'USR-wanjiku-006' },
];

// ─── Payment Plan Definitions ───────────────────────────────────

interface InstallmentDef {
  id: string;
  sequence: number;
  amount: number;
  dueDate: Date;
  paidAt: Date | null;
  status: InstallmentStatus;
}

interface PaymentDef {
  id: string;
  enrollmentId: string;
  planType: PaymentPlanType;
  totalAmount: number;
  currency: string;
  status: PaymentPlanStatus;
  installments: InstallmentDef[];
}

const paymentPlans: PaymentDef[] = [
  // Ngozi: 3-pay, NGN, first paid, two pending
  {
    id: 'PAY-ngozi-010', enrollmentId: 'ENR-ngozi-010',
    planType: PaymentPlanType.three_pay, totalAmount: 675000, currency: 'NGN',
    status: PaymentPlanStatus.active,
    installments: [
      { id: 'INS-ngozi-01', sequence: 1, amount: 225000, dueDate: TWO_MONTHS_AGO, paidAt: TWO_MONTHS_AGO, status: InstallmentStatus.paid },
      { id: 'INS-ngozi-02', sequence: 2, amount: 225000, dueDate: ONE_MONTH_AHEAD, paidAt: null, status: InstallmentStatus.pending },
      { id: 'INS-ngozi-03', sequence: 3, amount: 225000, dueDate: TWO_MONTHS_AHEAD, paidAt: null, status: InstallmentStatus.pending },
    ],
  },
  // Tendai: 2-pay, USD, first paid, one pending
  {
    id: 'PAY-tendai-011', enrollmentId: 'ENR-tendai-011',
    planType: PaymentPlanType.two_pay, totalAmount: 750, currency: 'USD',
    status: PaymentPlanStatus.active,
    installments: [
      { id: 'INS-tendai-01', sequence: 1, amount: 375, dueDate: TWO_MONTHS_AGO, paidAt: TWO_MONTHS_AGO, status: InstallmentStatus.paid },
      { id: 'INS-tendai-02', sequence: 2, amount: 375, dueDate: ONE_MONTH_AHEAD, paidAt: null, status: InstallmentStatus.pending },
    ],
  },
  // Aisha: full payment, XOF, paid
  {
    id: 'PAY-aisha-012', enrollmentId: 'ENR-aisha-012',
    planType: PaymentPlanType.full, totalAmount: 420000, currency: 'XOF',
    status: PaymentPlanStatus.completed,
    installments: [
      { id: 'INS-aisha-01', sequence: 1, amount: 420000, dueDate: THREE_MONTHS_AGO, paidAt: THREE_MONTHS_AGO, status: InstallmentStatus.paid },
    ],
  },
  // Kofi: 3-pay, GHS, all paid (completed)
  {
    id: 'PAY-kofi-013', enrollmentId: 'ENR-kofi-013',
    planType: PaymentPlanType.three_pay, totalAmount: 4200, currency: 'GHS',
    status: PaymentPlanStatus.completed,
    installments: [
      { id: 'INS-kofi-01', sequence: 1, amount: 1400, dueDate: THREE_MONTHS_AGO, paidAt: THREE_MONTHS_AGO, status: InstallmentStatus.paid },
      { id: 'INS-kofi-02', sequence: 2, amount: 1400, dueDate: TWO_MONTHS_AGO, paidAt: TWO_MONTHS_AGO, status: InstallmentStatus.paid },
      { id: 'INS-kofi-03', sequence: 3, amount: 1400, dueDate: ONE_MONTH_AGO, paidAt: ONE_MONTH_AGO, status: InstallmentStatus.paid },
    ],
  },
  // Halima: 2-pay, NGN, first paid, second overdue
  {
    id: 'PAY-halima-014', enrollmentId: 'ENR-halima-014',
    planType: PaymentPlanType.two_pay, totalAmount: 675000, currency: 'NGN',
    status: PaymentPlanStatus.active,
    installments: [
      { id: 'INS-halima-01', sequence: 1, amount: 337500, dueDate: THREE_MONTHS_AGO, paidAt: THREE_MONTHS_AGO, status: InstallmentStatus.paid },
      { id: 'INS-halima-02', sequence: 2, amount: 337500, dueDate: ONE_MONTH_AGO, paidAt: null, status: InstallmentStatus.overdue },
    ],
  },
  // Samuel: 3-pay, GHS, none paid yet
  {
    id: 'PAY-samuel-015', enrollmentId: 'ENR-samuel-015',
    planType: PaymentPlanType.three_pay, totalAmount: 4500, currency: 'GHS',
    status: PaymentPlanStatus.active,
    installments: [
      { id: 'INS-samuel-01', sequence: 1, amount: 1500, dueDate: ONE_MONTH_AGO, paidAt: null, status: InstallmentStatus.pending },
      { id: 'INS-samuel-02', sequence: 2, amount: 1500, dueDate: ONE_MONTH_AHEAD, paidAt: null, status: InstallmentStatus.pending },
      { id: 'INS-samuel-03', sequence: 3, amount: 1500, dueDate: TWO_MONTHS_AHEAD, paidAt: null, status: InstallmentStatus.pending },
    ],
  },
  // Fatima: full payment, NGN, paid
  {
    id: 'PAY-fatima-016', enrollmentId: 'ENR-fatima-016',
    planType: PaymentPlanType.full, totalAmount: 675000, currency: 'NGN',
    status: PaymentPlanStatus.completed,
    installments: [
      { id: 'INS-fatima-01', sequence: 1, amount: 675000, dueDate: THREE_MONTHS_AGO, paidAt: THREE_MONTHS_AGO, status: InstallmentStatus.paid },
    ],
  },
  // Kwame: 2-pay, GHS, first paid, one pending
  {
    id: 'PAY-kwame-017', enrollmentId: 'ENR-kwame-017',
    planType: PaymentPlanType.two_pay, totalAmount: 4500, currency: 'GHS',
    status: PaymentPlanStatus.active,
    installments: [
      { id: 'INS-kwame-01', sequence: 1, amount: 2250, dueDate: TWO_MONTHS_AGO, paidAt: TWO_MONTHS_AGO, status: InstallmentStatus.paid },
      { id: 'INS-kwame-02', sequence: 2, amount: 2250, dueDate: ONE_MONTH_AHEAD, paidAt: null, status: InstallmentStatus.pending },
    ],
  },
  // Amara: 3-pay, NGN, first two paid, one pending
  {
    id: 'PAY-amara-018', enrollmentId: 'ENR-amara-018',
    planType: PaymentPlanType.three_pay, totalAmount: 630000, currency: 'NGN',
    status: PaymentPlanStatus.active,
    installments: [
      { id: 'INS-amara-01', sequence: 1, amount: 210000, dueDate: THREE_MONTHS_AGO, paidAt: THREE_MONTHS_AGO, status: InstallmentStatus.paid },
      { id: 'INS-amara-02', sequence: 2, amount: 210000, dueDate: ONE_MONTH_AGO, paidAt: ONE_MONTH_AGO, status: InstallmentStatus.paid },
      { id: 'INS-amara-03', sequence: 3, amount: 210000, dueDate: ONE_MONTH_AHEAD, paidAt: null, status: InstallmentStatus.pending },
    ],
  },
  // Zara: full payment, KES, paid (completed)
  {
    id: 'PAY-zara-019', enrollmentId: 'ENR-zara-019',
    planType: PaymentPlanType.full, totalAmount: 75000, currency: 'KES',
    status: PaymentPlanStatus.completed,
    installments: [
      { id: 'INS-zara-01', sequence: 1, amount: 75000, dueDate: THREE_MONTHS_AGO, paidAt: THREE_MONTHS_AGO, status: InstallmentStatus.paid },
    ],
  },
];


// ─── Gate Attempt Definitions ───────────────────────────────────
// Gate IDs follow pattern PGT-{module-suffix} from seed-curriculum.ts

interface GateAttemptDef {
  id: string;
  gateId: string;
  learnerId: string;
  score: number;
  passed: boolean;
  attemptNumber: number;
  attemptedAt: Date;
}

const gateAttempts: GateAttemptDef[] = [
  // Ngozi — completed through Beginner Module 4 (AI Eng)
  { id: 'GAT-ngozi-01', gateId: 'PGT-ai-eng-b01', learnerId: 'LRN-ngozi-010', score: 82, passed: true, attemptNumber: 1, attemptedAt: THREE_MONTHS_AGO },
  { id: 'GAT-ngozi-02', gateId: 'PGT-ai-eng-b02', learnerId: 'LRN-ngozi-010', score: 75, passed: true, attemptNumber: 1, attemptedAt: TWO_MONTHS_AGO },
  { id: 'GAT-ngozi-03', gateId: 'PGT-ai-eng-b03', learnerId: 'LRN-ngozi-010', score: 88, passed: true, attemptNumber: 1, attemptedAt: ONE_MONTH_AGO },

  // Tendai — completed through Beginner Module 2 (Data Sci)
  { id: 'GAT-tendai-01', gateId: 'PGT-ds-b01', learnerId: 'LRN-tendai-011', score: 78, passed: true, attemptNumber: 1, attemptedAt: TWO_MONTHS_AGO },
  { id: 'GAT-tendai-02', gateId: 'PGT-ds-b02', learnerId: 'LRN-tendai-011', score: 65, passed: false, attemptNumber: 1, attemptedAt: ONE_MONTH_AGO },
  { id: 'GAT-tendai-03', gateId: 'PGT-ds-b02', learnerId: 'LRN-tendai-011', score: 73, passed: true, attemptNumber: 2, attemptedAt: ONE_MONTH_AGO },

  // Aisha — completed through Beginner Module 3 (Cyber)
  { id: 'GAT-aisha-01', gateId: 'PGT-cs-b01', learnerId: 'LRN-aisha-012', score: 91, passed: true, attemptNumber: 1, attemptedAt: THREE_MONTHS_AGO },
  { id: 'GAT-aisha-02', gateId: 'PGT-cs-b02', learnerId: 'LRN-aisha-012', score: 84, passed: true, attemptNumber: 1, attemptedAt: TWO_MONTHS_AGO },

  // Kofi — Intermediate Module 1 (AI Prod) — completed all beginner
  { id: 'GAT-kofi-01', gateId: 'PGT-ap-b01', learnerId: 'LRN-kofi-013', score: 87, passed: true, attemptNumber: 1, attemptedAt: THREE_MONTHS_AGO },
  { id: 'GAT-kofi-02', gateId: 'PGT-ap-b02', learnerId: 'LRN-kofi-013', score: 79, passed: true, attemptNumber: 1, attemptedAt: THREE_MONTHS_AGO },
  { id: 'GAT-kofi-03', gateId: 'PGT-ap-b03', learnerId: 'LRN-kofi-013', score: 92, passed: true, attemptNumber: 1, attemptedAt: TWO_MONTHS_AGO },

  // Halima — Advanced Module 2 (Data Sci) — completed beginner + intermediate
  { id: 'GAT-halima-01', gateId: 'PGT-ds-b01', learnerId: 'LRN-halima-014', score: 95, passed: true, attemptNumber: 1, attemptedAt: THREE_MONTHS_AGO },
  { id: 'GAT-halima-02', gateId: 'PGT-ds-i01', learnerId: 'LRN-halima-014', score: 83, passed: true, attemptNumber: 1, attemptedAt: TWO_MONTHS_AGO },
  { id: 'GAT-halima-03', gateId: 'PGT-ds-a01', learnerId: 'LRN-halima-014', score: 77, passed: true, attemptNumber: 1, attemptedAt: ONE_MONTH_AGO },

  // Samuel — Beginner Module 1 (AI Eng) — just started, no gates passed yet

  // Fatima — Intermediate Module 3 (AI Eng) — completed beginner + some intermediate
  { id: 'GAT-fatima-01', gateId: 'PGT-ai-eng-b01', learnerId: 'LRN-fatima-016', score: 90, passed: true, attemptNumber: 1, attemptedAt: THREE_MONTHS_AGO },
  { id: 'GAT-fatima-02', gateId: 'PGT-ai-eng-i01', learnerId: 'LRN-fatima-016', score: 85, passed: true, attemptNumber: 1, attemptedAt: TWO_MONTHS_AGO },
  { id: 'GAT-fatima-03', gateId: 'PGT-ai-eng-i02', learnerId: 'LRN-fatima-016', score: 72, passed: true, attemptNumber: 1, attemptedAt: ONE_MONTH_AGO },

  // Kwame — Beginner Module 5 (AI Eng)
  { id: 'GAT-kwame-01', gateId: 'PGT-ai-eng-b01', learnerId: 'LRN-kwame-017', score: 80, passed: true, attemptNumber: 1, attemptedAt: THREE_MONTHS_AGO },
  { id: 'GAT-kwame-02', gateId: 'PGT-ai-eng-b02', learnerId: 'LRN-kwame-017', score: 76, passed: true, attemptNumber: 1, attemptedAt: TWO_MONTHS_AGO },
  { id: 'GAT-kwame-03', gateId: 'PGT-ai-eng-b03', learnerId: 'LRN-kwame-017', score: 88, passed: true, attemptNumber: 1, attemptedAt: TWO_MONTHS_AGO },
  { id: 'GAT-kwame-04', gateId: 'PGT-ai-eng-b04', learnerId: 'LRN-kwame-017', score: 71, passed: true, attemptNumber: 1, attemptedAt: ONE_MONTH_AGO },

  // Amara — Beginner Module 3 (AI Prod)
  { id: 'GAT-amara-01', gateId: 'PGT-ap-b01', learnerId: 'LRN-amara-018', score: 74, passed: true, attemptNumber: 1, attemptedAt: TWO_MONTHS_AGO },
  { id: 'GAT-amara-02', gateId: 'PGT-ap-b02', learnerId: 'LRN-amara-018', score: 81, passed: true, attemptNumber: 1, attemptedAt: ONE_MONTH_AGO },

  // Zara — Completed all (Cyber) — all beginner + intermediate + advanced gates
  { id: 'GAT-zara-01', gateId: 'PGT-cs-b01', learnerId: 'LRN-zara-019', score: 93, passed: true, attemptNumber: 1, attemptedAt: THREE_MONTHS_AGO },
  { id: 'GAT-zara-02', gateId: 'PGT-cs-b02', learnerId: 'LRN-zara-019', score: 89, passed: true, attemptNumber: 1, attemptedAt: THREE_MONTHS_AGO },
  { id: 'GAT-zara-03', gateId: 'PGT-cs-i01', learnerId: 'LRN-zara-019', score: 86, passed: true, attemptNumber: 1, attemptedAt: TWO_MONTHS_AGO },
  { id: 'GAT-zara-04', gateId: 'PGT-cs-a01', learnerId: 'LRN-zara-019', score: 91, passed: true, attemptNumber: 1, attemptedAt: ONE_MONTH_AGO },
];


// ─── Submission Definitions ─────────────────────────────────────

interface SubmissionDef {
  id: string;
  learnerId: string;
  assessmentId: string | null;
  content: string;
  score: number | null;
  feedback: string | null;
  status: SubmissionStatus;
  submittedAt: Date | null;
}

const submissions: SubmissionDef[] = [
  {
    id: 'SUB-ngozi-01', learnerId: 'LRN-ngozi-010', assessmentId: null,
    content: 'Implemented a REST API client with error handling and retry logic.',
    score: 85, feedback: 'Excellent error handling. Consider adding request timeout configuration.',
    status: SubmissionStatus.graded, submittedAt: TWO_MONTHS_AGO,
  },
  {
    id: 'SUB-fatima-01', learnerId: 'LRN-fatima-016', assessmentId: null,
    content: 'Built a RAG pipeline using LangChain with FAISS vector store.',
    score: null, feedback: null,
    status: SubmissionStatus.submitted, submittedAt: ONE_MONTH_AGO,
  },
  {
    id: 'SUB-kofi-01', learnerId: 'LRN-kofi-013', assessmentId: null,
    content: 'Product requirements document for an AI-powered customer support system.',
    score: 78, feedback: 'Good stakeholder analysis. Needs more detail on AI model selection criteria.',
    status: SubmissionStatus.graded, submittedAt: TWO_MONTHS_AGO,
  },
  {
    id: 'SUB-zara-01', learnerId: 'LRN-zara-019', assessmentId: null,
    content: 'Threat model and security architecture for a multi-tenant AI platform.',
    score: null, feedback: null,
    status: SubmissionStatus.under_review, submittedAt: ONE_MONTH_AGO,
  },
];

// ─── Capstone & Certificate Definitions ─────────────────────────

// Zara: Capstone submitted + evaluated, defense passed, certificate issued
const ZARA_CAPSTONE_ID = 'CAP-zara-019';
const ZARA_DEFENSE_ID = 'DEF-zara-019';
const ZARA_CERT_ID = 'CRT-zara-019';
const ZARA_CERT_CODE = 'KFCERT-2025-ZM7K9P';

// Halima: Capstone unlocked but not yet submitted
const HALIMA_CAPSTONE_ID = 'CAP-halima-014';


// ─── Seed Functions ─────────────────────────────────────────────

async function seedStaffUsers(): Promise<void> {
  console.log('Seeding staff users...');

  for (const u of staffUsers) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: { email: u.email, role: u.role, status: u.status, email_verified: true, mfa_enabled: true },
      create: {
        id: u.id,
        email: u.email,
        password_hash: PASSWORD_HASH,
        role: u.role,
        status: u.status,
        email_verified: true,
        mfa_enabled: true,
      },
    });
  }

  console.log(`  ✓ ${staffUsers.length} staff users (SuperAdmin, Admin, Instructors, Assessors, Corporate, Finance, DevOps)`);
}

async function seedLearnerUsers(): Promise<void> {
  console.log('Seeding learner users and profiles...');

  for (const l of learners) {
    // User record
    await prisma.user.upsert({
      where: { id: l.userId },
      update: { email: l.email, role: UserRole.Learner, status: UserStatus.Active, email_verified: true },
      create: {
        id: l.userId,
        email: l.email,
        password_hash: PASSWORD_HASH,
        role: UserRole.Learner,
        status: UserStatus.Active,
        email_verified: true,
        mfa_enabled: false,
      },
    });

    // Learner profile
    await prisma.learner.upsert({
      where: { id: l.learnerId },
      update: {
        user_id: l.userId,
        country: l.country,
        professional_background: l.professionalBackground,
        learning_goals: l.learningGoals,
        onboarding_complete: true,
      },
      create: {
        id: l.learnerId,
        user_id: l.userId,
        country: l.country,
        professional_background: l.professionalBackground,
        learning_goals: l.learningGoals,
        onboarding_complete: true,
      },
    });
  }

  console.log(`  ✓ ${learners.length} learner users with profiles`);
}

async function seedFoundationProgress(): Promise<void> {
  console.log('Seeding foundation progress...');

  for (const l of learners) {
    const fpId = l.learnerId.replace('LRN-', 'FPR-');
    await prisma.foundationProgress.upsert({
      where: { id: fpId },
      update: {
        learner_id: l.learnerId,
        module_statuses: JSON.parse(FOUNDATION_COMPLETE),
        completed: true,
        completed_at: TWO_MONTHS_AGO,
      },
      create: {
        id: fpId,
        learner_id: l.learnerId,
        module_statuses: JSON.parse(FOUNDATION_COMPLETE),
        completed: true,
        completed_at: TWO_MONTHS_AGO,
      },
    });
  }

  console.log(`  ✓ ${learners.length} foundation progress records (all completed)`);
}

async function seedEnrollments(): Promise<void> {
  console.log('Seeding enrollments...');

  // Zara is completed, everyone else is active
  for (const l of learners) {
    const status = l.learnerId === 'LRN-zara-019'
      ? EnrollmentStatus.completed
      : EnrollmentStatus.active;

    await prisma.enrollment.upsert({
      where: { id: l.enrollmentId },
      update: { learner_id: l.learnerId, track_id: l.trackId, status },
      create: {
        id: l.enrollmentId,
        learner_id: l.learnerId,
        track_id: l.trackId,
        status,
        enrolled_at: THREE_MONTHS_AGO,
      },
    });
  }

  console.log(`  ✓ ${learners.length} enrollments`);
}

async function seedPods(): Promise<void> {
  console.log('Seeding pods...');

  for (const pod of pods) {
    await prisma.pod.upsert({
      where: { id: pod.id },
      update: { track_id: pod.trackId, assessor_id: pod.assessorId, status: PodStatus.active },
      create: {
        id: pod.id,
        track_id: pod.trackId,
        assessor_id: pod.assessorId,
        status: PodStatus.active,
        activated_at: THREE_MONTHS_AGO,
      },
    });
  }

  console.log(`  ✓ ${pods.length} pods (Zambezi, Limpopo, Volta, Niger)`);
}

async function seedPodMembers(): Promise<void> {
  console.log('Seeding pod members...');

  for (const l of learners) {
    const pmId = l.learnerId.replace('LRN-', 'PM-');
    await prisma.podMember.upsert({
      where: { id: pmId },
      update: { pod_id: l.podId, learner_id: l.learnerId, role: l.podMemberRole },
      create: {
        id: pmId,
        pod_id: l.podId,
        learner_id: l.learnerId,
        role: l.podMemberRole,
        assigned_at: THREE_MONTHS_AGO,
      },
    });
  }

  console.log(`  ✓ ${learners.length} pod members assigned`);
}

async function seedPaymentPlans(): Promise<void> {
  console.log('Seeding payment plans and installments...');

  let installmentCount = 0;

  for (const pp of paymentPlans) {
    await prisma.paymentPlan.upsert({
      where: { id: pp.id },
      update: {
        enrollment_id: pp.enrollmentId,
        plan_type: pp.planType,
        total_amount: pp.totalAmount,
        currency: pp.currency,
        status: pp.status,
      },
      create: {
        id: pp.id,
        enrollment_id: pp.enrollmentId,
        plan_type: pp.planType,
        total_amount: pp.totalAmount,
        currency: pp.currency,
        status: pp.status,
      },
    });

    for (const inst of pp.installments) {
      await prisma.installment.upsert({
        where: { id: inst.id },
        update: {
          plan_id: pp.id,
          sequence: inst.sequence,
          amount: inst.amount,
          due_date: inst.dueDate,
          paid_at: inst.paidAt,
          status: inst.status,
        },
        create: {
          id: inst.id,
          plan_id: pp.id,
          sequence: inst.sequence,
          amount: inst.amount,
          due_date: inst.dueDate,
          paid_at: inst.paidAt,
          status: inst.status,
        },
      });
      installmentCount++;
    }
  }

  console.log(`  ✓ ${paymentPlans.length} payment plans, ${installmentCount} installments`);
}

async function seedGateAttempts(): Promise<void> {
  console.log('Seeding gate attempts...');

  for (const ga of gateAttempts) {
    await prisma.gateAttempt.upsert({
      where: { id: ga.id },
      update: {
        gate_id: ga.gateId,
        learner_id: ga.learnerId,
        score: ga.score,
        passed: ga.passed,
        attempt_number: ga.attemptNumber,
        attempted_at: ga.attemptedAt,
      },
      create: {
        id: ga.id,
        gate_id: ga.gateId,
        learner_id: ga.learnerId,
        score: ga.score,
        passed: ga.passed,
        attempt_number: ga.attemptNumber,
        attempted_at: ga.attemptedAt,
      },
    });
  }

  console.log(`  ✓ ${gateAttempts.length} gate attempts`);
}

async function seedSubmissions(): Promise<void> {
  console.log('Seeding submissions...');

  for (const sub of submissions) {
    await prisma.submission.upsert({
      where: { id: sub.id },
      update: {
        learner_id: sub.learnerId,
        assessment_id: sub.assessmentId,
        content: sub.content,
        score: sub.score,
        feedback: sub.feedback,
        status: sub.status,
        submitted_at: sub.submittedAt,
      },
      create: {
        id: sub.id,
        learner_id: sub.learnerId,
        assessment_id: sub.assessmentId,
        content: sub.content,
        score: sub.score,
        feedback: sub.feedback,
        status: sub.status,
        submitted_at: sub.submittedAt,
      },
    });
  }

  console.log(`  ✓ ${submissions.length} submissions`);
}


async function seedCapstones(): Promise<void> {
  console.log('Seeding capstones...');

  // Zara: submitted + evaluated
  await prisma.capstone.upsert({
    where: { id: ZARA_CAPSTONE_ID },
    update: {
      learner_id: 'LRN-zara-019',
      track_id: TRACK_CYBER_SEC,
      status: CapstoneStatus.evaluated,
      submitted_at: ONE_MONTH_AGO,
      result: 'pass',
      feedback: 'Outstanding threat modelling and security architecture. Demonstrated deep understanding of AI-specific attack vectors and mitigation strategies.',
    },
    create: {
      id: ZARA_CAPSTONE_ID,
      learner_id: 'LRN-zara-019',
      track_id: TRACK_CYBER_SEC,
      status: CapstoneStatus.evaluated,
      submitted_at: ONE_MONTH_AGO,
      result: 'pass',
      feedback: 'Outstanding threat modelling and security architecture. Demonstrated deep understanding of AI-specific attack vectors and mitigation strategies.',
    },
  });

  // Halima: unlocked but not submitted
  await prisma.capstone.upsert({
    where: { id: HALIMA_CAPSTONE_ID },
    update: {
      learner_id: 'LRN-halima-014',
      track_id: TRACK_DATA_SCI,
      status: CapstoneStatus.unlocked,
    },
    create: {
      id: HALIMA_CAPSTONE_ID,
      learner_id: 'LRN-halima-014',
      track_id: TRACK_DATA_SCI,
      status: CapstoneStatus.unlocked,
    },
  });

  console.log('  ✓ 2 capstones (Zara: evaluated, Halima: unlocked)');
}

async function seedCapstoneDefenses(): Promise<void> {
  console.log('Seeding capstone defenses...');

  await prisma.capstoneDefense.upsert({
    where: { id: ZARA_DEFENSE_ID },
    update: {
      capstone_id: ZARA_CAPSTONE_ID,
      panel_assessor_ids: ['USR-babatunde-005', 'USR-wanjiku-006'],
      scheduled_at: ONE_MONTH_AGO,
      result: 'pass',
      feedback: 'Zara demonstrated exceptional command of cybersecurity principles during the defense. Her responses to panel questions on zero-trust architecture and adversarial ML were thorough and well-reasoned.',
    },
    create: {
      id: ZARA_DEFENSE_ID,
      capstone_id: ZARA_CAPSTONE_ID,
      panel_assessor_ids: ['USR-babatunde-005', 'USR-wanjiku-006'],
      scheduled_at: ONE_MONTH_AGO,
      result: 'pass',
      feedback: 'Zara demonstrated exceptional command of cybersecurity principles during the defense. Her responses to panel questions on zero-trust architecture and adversarial ML were thorough and well-reasoned.',
    },
  });

  console.log('  ✓ 1 capstone defense (Zara: passed)');
}

async function seedCertificates(): Promise<void> {
  console.log('Seeding certificates...');

  await prisma.certificate.upsert({
    where: { id: ZARA_CERT_ID },
    update: {
      learner_id: 'LRN-zara-019',
      track_id: TRACK_CYBER_SEC,
      verification_code: ZARA_CERT_CODE,
      status: CertificateStatus.active,
      pdf_url: 'https://storage.korefield.com/certificates/KFCERT-2025-ZM7K9P.pdf',
    },
    create: {
      id: ZARA_CERT_ID,
      learner_id: 'LRN-zara-019',
      track_id: TRACK_CYBER_SEC,
      verification_code: ZARA_CERT_CODE,
      issued_at: ONE_MONTH_AGO,
      status: CertificateStatus.active,
      pdf_url: 'https://storage.korefield.com/certificates/KFCERT-2025-ZM7K9P.pdf',
    },
  });

  console.log('  ✓ 1 certificate (Zara: KFCERT-2025-ZM7K9P)');
}

async function seedCertificationEligibility(): Promise<void> {
  console.log('Seeding certification eligibility...');

  // Zara: all 6 conditions met
  await prisma.certificationEligibility.upsert({
    where: { id: 'CEL-zara-019' },
    update: {
      learner_id: 'LRN-zara-019',
      track_id: TRACK_CYBER_SEC,
      foundation_complete: true,
      levels_complete: true,
      pod_deliverables_complete: true,
      capstone_passed: true,
      assessor_approved: true,
      payment_cleared: true,
      eligible: true,
    },
    create: {
      id: 'CEL-zara-019',
      learner_id: 'LRN-zara-019',
      track_id: TRACK_CYBER_SEC,
      foundation_complete: true,
      levels_complete: true,
      pod_deliverables_complete: true,
      capstone_passed: true,
      assessor_approved: true,
      payment_cleared: true,
      eligible: true,
    },
  });

  // Halima: partial eligibility — foundation + some levels done, payment not cleared
  await prisma.certificationEligibility.upsert({
    where: { id: 'CEL-halima-014' },
    update: {
      learner_id: 'LRN-halima-014',
      track_id: TRACK_DATA_SCI,
      foundation_complete: true,
      levels_complete: false,
      pod_deliverables_complete: false,
      capstone_passed: false,
      assessor_approved: false,
      payment_cleared: false,
      eligible: false,
    },
    create: {
      id: 'CEL-halima-014',
      learner_id: 'LRN-halima-014',
      track_id: TRACK_DATA_SCI,
      foundation_complete: true,
      levels_complete: false,
      pod_deliverables_complete: false,
      capstone_passed: false,
      assessor_approved: false,
      payment_cleared: false,
      eligible: false,
    },
  });

  console.log('  ✓ 2 certification eligibility records');
}


// ─── Main ───────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('\n🌱 KoreField Academy — User & Demo Data Seed\n');

  // Seed in dependency order
  await seedStaffUsers();
  await seedLearnerUsers();
  await seedFoundationProgress();
  await seedEnrollments();
  await seedPods();
  await seedPodMembers();
  await seedPaymentPlans();
  await seedGateAttempts();
  await seedSubmissions();
  await seedCapstones();
  await seedCapstoneDefenses();
  await seedCertificates();
  await seedCertificationEligibility();

  console.log('\n✅ User seed complete — all portals now have demo data.\n');
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
