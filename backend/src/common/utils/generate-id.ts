import { v4 as uuidv4 } from 'uuid';

/**
 * Valid entity prefixes for domain-prefixed custom IDs.
 * Format: {PREFIX}-{UNIQUE_SEGMENT}
 *
 * See Custom_ID_Convention in the glossary for the full mapping.
 */
export const ENTITY_PREFIXES = [
  'USR', // User
  'LRN', // Learner
  'TRK', // Track
  'LVL', // Level
  'MOD', // Module
  'LSN', // Lesson
  'ASM', // Assessment
  'LAB', // Lab Session
  'ENR', // Enrollment
  'POD', // Pod
  'PDM', // Pod Member
  'WTL', // Waitlist Entry
  'FND', // Foundation Progress
  'PGT', // Performance Gate
  'GTA', // Gate Attempt
  'PAY', // Payment Plan
  'IST', // Installment
  'PRC', // Pricing Config
  'CMP', // Campaign
  'SCH', // Scholarship
  'CPS', // Capstone
  'DEF', // Capstone Defense
  'CRT', // Certificate
  'CEL', // Certification Eligibility
  'SUB', // Submission
  'CEX', // Coding Exercise
  'CVR', // Content Version
  'AWE', // Agent Workflow Execution
  'AQR', // Agent Query
  'PMV', // Prompt Version
  'DRS', // Dropout Risk Score
  'SES', // Session
  'ROL', // Role
  'CBN', // Country Band
] as const;

export type EntityPrefix = (typeof ENTITY_PREFIXES)[number];

/**
 * Generates a domain-prefixed custom ID.
 * Format: {PREFIX}-{6-char hex segment}
 *
 * @param prefix - The entity prefix (e.g., 'USR', 'LRN', 'TRK')
 * @returns A unique ID string like 'USR-8a2f4c'
 */
export function generateId(prefix: EntityPrefix): string {
  const uniqueSegment = uuidv4().replace(/-/g, '').substring(0, 6);
  return `${prefix}-${uniqueSegment}`;
}

/**
 * Generates a certificate verification code.
 * Format: KFCERT-{YEAR}-{8-char alphanumeric}
 *
 * @param year - The certificate year (defaults to current year)
 * @returns A verification code like 'KFCERT-2026-A7X9K2M4'
 */
export function generateCertVerificationCode(year?: number): string {
  const certYear = year ?? new Date().getFullYear();
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let alphanumeric = '';
  const bytes = uuidv4().replace(/-/g, '');
  for (let i = 0; i < 8; i++) {
    const index = parseInt(bytes.substring(i * 2, i * 2 + 2), 16) % chars.length;
    alphanumeric += chars[index];
  }
  return `KFCERT-${certYear}-${alphanumeric}`;
}
