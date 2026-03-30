/**
 * @file email.types.ts — Type definitions, payload interfaces, and category
 * classification for the transactional email system.
 */

/**
 * All supported email types as a const array.
 * Used as the single source of truth for the EmailType union.
 */
export const EMAIL_TYPES = [
  'email_verification',
  'welcome',
  'password_reset',
  'payment_confirmation',
  'enrollment_confirmation',
  'certificate_issued',
  'pod_assignment',
  'mfa_setup_confirmation',
  'account_status_change',
] as const;

/** Union of all valid email type strings. */
export type EmailType = (typeof EMAIL_TYPES)[number];

/**
 * Transactional emails are always delivered regardless of user preferences.
 * Marketing emails respect the user's unsubscribe preference.
 */
export const TRANSACTIONAL_EMAIL_TYPES: readonly EmailType[] = [
  'email_verification',
  'welcome',
  'password_reset',
  'payment_confirmation',
  'enrollment_confirmation',
  'certificate_issued',
  'pod_assignment',
  'mfa_setup_confirmation',
  'account_status_change',
] as const;

export const MARKETING_EMAIL_TYPES: readonly EmailType[] = [] as const;

/** Returns true if the given email type is transactional (never skipped). */
export function isTransactionalEmail(type: EmailType): boolean {
  return (TRANSACTIONAL_EMAIL_TYPES as readonly string[]).includes(type);
}

/** Returns true if the given email type is marketing (respects opt-out). */
export function isMarketingEmail(type: EmailType): boolean {
  return (MARKETING_EMAIL_TYPES as readonly string[]).includes(type);
}

// ---------------------------------------------------------------------------
// Per-type template data interfaces
// ---------------------------------------------------------------------------

/** Data required for payment_confirmation emails. */
export interface PaymentEmailData {
  amount: number;
  currency: string;
  trackName: string;
  paymentPlanType: string;
  installmentSequence: number;
  paymentDate: string;
}

/** Data required for enrollment_confirmation emails. */
export interface EnrollmentEmailData {
  trackName: string;
  enrollmentDate: string;
  trackDashboardUrl: string;
}

/** Data required for certificate_issued emails. */
export interface CertificateEmailData {
  trackName: string;
  verificationCode: string;
  certificateUrl: string;
  issueDate: string;
}

/** Data required for pod_assignment emails. */
export interface PodAssignmentEmailData {
  podId: string;
  assignedRole: string;
  trackName: string;
  podPageUrl: string;
}

/** Data required for account_status_change emails. */
export interface AccountStatusEmailData {
  newStatus: string;
  reason?: string;
  supportContactUrl?: string;
  loginUrl?: string;
}

// ---------------------------------------------------------------------------
// SQS message payload
// ---------------------------------------------------------------------------

/** JSON payload published to the email SQS queue. */
export interface EmailPayload {
  /** Correlation ID in EML-xxxxx format. */
  id: string;
  /** Recipient email address. */
  to: string;
  /** One of the 9 supported email types. */
  type: EmailType;
  /** Template-specific variables (shape depends on `type`). */
  data: Record<string, unknown>;
  /** Associated user ID for preference checks and log association. */
  userId?: string;
}
