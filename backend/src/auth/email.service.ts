/**
 * @file email.service.ts — Backward-compatibility re-export.
 * The production EmailService has moved to `backend/src/email/email.service.ts`.
 * This file re-exports it so that existing imports from `./email.service`
 * within the auth domain continue to resolve without changes.
 */
export { EmailService } from '../email/email.service';
