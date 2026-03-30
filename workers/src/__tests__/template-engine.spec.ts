/** @file template-engine.spec.ts — Property-based tests for the branded email template engine. */

import * as fc from 'fast-check';
import { renderEmail, EMAIL_TYPES, EmailType } from '../services/template-engine';

// ---------------------------------------------------------------------------
// Arbitraries — generate valid template data per email type
// ---------------------------------------------------------------------------

const safeChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 -_.';

/** Non-empty string built from safe characters (no braces, no "null"/"undefined" literals). */
const safeString = fc
  .string({ minLength: 1, maxLength: 40, unit: fc.constantFrom(...safeChars.split('')) })
  .filter((s) => s.trim().length > 0);

const safeUrl = safeString.map((s) => `https://example.com/${s.replace(/ /g, '-')}`);
const safeEmail = safeString.map((s) => `${s.replace(/[^a-zA-Z0-9]/g, '')}@example.com`);
const safeAmount = fc.double({ min: 0.01, max: 99999.99, noNaN: true }).map((n) => Math.round(n * 100) / 100);
const safeDate = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map((d) => d.toISOString());

function templateDataArb(type: EmailType): fc.Arbitrary<Record<string, unknown>> {
  switch (type) {
    case 'email_verification':
      return fc.record({ verificationUrl: safeUrl, email: safeEmail });
    case 'welcome':
      return fc.record({ dashboardUrl: safeUrl, foundationUrl: safeUrl });
    case 'password_reset':
      return fc.record({ resetUrl: safeUrl });
    case 'payment_confirmation':
      return fc.record({
        amount: safeAmount,
        currency: fc.constantFrom('USD', 'GBP', 'EUR', 'NGN'),
        trackName: safeString,
        paymentPlanType: fc.constantFrom('full', '2-pay', '3-pay'),
        installmentSequence: fc.integer({ min: 1, max: 10 }),
        paymentDate: safeDate,
        paymentHistoryUrl: safeUrl,
      });
    case 'enrollment_confirmation':
      return fc.record({
        trackName: safeString,
        enrollmentDate: safeDate,
        expectedDuration: safeString,
        trackDashboardUrl: safeUrl,
      });
    case 'certificate_issued':
      return fc.record({
        trackName: safeString,
        verificationCode: safeString,
        certificateUrl: safeUrl,
        publicVerificationUrl: safeUrl,
      });
    case 'pod_assignment':
      return fc.record({
        podId: safeString,
        assignedRole: safeString,
        trackName: safeString,
        podPageUrl: safeUrl,
      });
    case 'mfa_setup_confirmation':
      return fc.record({ activatedAt: safeDate });
    case 'account_status_change':
      return fc.record({
        newStatus: fc.constantFrom('Suspended', 'Active'),
        reason: safeString,
        supportContactUrl: safeUrl,
        loginUrl: safeUrl,
      });
  }
}

/** Arbitrary that yields a random valid email type paired with matching template data. */
const emailTypeAndData: fc.Arbitrary<{ type: EmailType; data: Record<string, unknown> }> = fc
  .constantFrom(...EMAIL_TYPES)
  .chain((type) => templateDataArb(type).map((data) => ({ type, data })));

// ---------------------------------------------------------------------------
// Type-specific content assertions
// ---------------------------------------------------------------------------

/** Returns strings that MUST appear in the rendered HTML for a given email type + data. */
function requiredHtmlContent(type: EmailType, data: Record<string, unknown>): string[] {
  switch (type) {
    case 'email_verification':
      return [String(data.verificationUrl), String(data.email)];
    case 'welcome':
      return ['KoreField Academy', 'AI Foundation School'];
    case 'password_reset':
      return [String(data.resetUrl), '1 hour'];
    case 'payment_confirmation':
      return [
        String(data.trackName),
        String(data.currency),
        Number(data.amount).toFixed(2),
      ];
    case 'enrollment_confirmation':
      return [String(data.trackName), String(data.enrollmentDate)];
    case 'certificate_issued':
      return [
        String(data.trackName),
        String(data.verificationCode),
        String(data.certificateUrl),
      ];
    case 'pod_assignment':
      return [String(data.podId), String(data.assignedRole), String(data.trackName)];
    case 'mfa_setup_confirmation':
      return ['MFA', 'backup codes'];
    case 'account_status_change':
      return [String(data.newStatus)];
  }
}

// ---------------------------------------------------------------------------
// Property 2: Template rendering produces HTML, text, and subject
// ---------------------------------------------------------------------------

describe('Property 2: Template rendering produces both HTML and plain text with required content', () => {
  /**
   * **Validates: Requirements 4.1, 4.2, 5.2, 6.2, 7.2, 8.2, 9.2, 10.2, 11.2, 12.2, 12.3, 13.3**
   *
   * For any email type and valid template data, renderEmail returns:
   * - non-empty html containing base layout elements
   * - non-empty text
   * - non-empty subject
   * - type-specific required content in the html
   */
  it('should produce non-empty html with base layout, non-empty text, and non-empty subject with type-specific elements', () => {
    fc.assert(
      fc.property(emailTypeAndData, ({ type, data }) => {
        const result = renderEmail(type, data);

        // Non-empty outputs
        expect(result.html.length).toBeGreaterThan(0);
        expect(result.text.length).toBeGreaterThan(0);
        expect(result.subject.length).toBeGreaterThan(0);

        // Base layout elements (Req 4.1)
        expect(result.html).toContain('KoreField Academy');
        expect(result.html).toContain('#1b5ef5');
        expect(result.html).toContain('support@korefield.com');
        expect(result.html).toContain('<!DOCTYPE html>');

        // Plain text fallback exists (Req 4.2)
        expect(result.text).toContain('KoreField Academy');

        // Type-specific required content
        const required = requiredHtmlContent(type, data);
        for (const fragment of required) {
          expect(result.html).toContain(fragment);
        }
      }),
      { numRuns: 20 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 3: No unresolved template placeholders
// ---------------------------------------------------------------------------

describe('Property 3: No unresolved template placeholders', () => {
  /**
   * **Validates: Requirements 4.4**
   *
   * For any email type and valid template data, rendered HTML and text
   * must not contain {{ , }} , "undefined", or "null" as literal strings.
   */
  it('should contain no unresolved placeholders in html or text', () => {
    fc.assert(
      fc.property(emailTypeAndData, ({ type, data }) => {
        const result = renderEmail(type, data);

        // No mustache-style placeholders
        expect(result.html).not.toContain('{{');
        expect(result.html).not.toContain('}}');
        expect(result.text).not.toContain('{{');
        expect(result.text).not.toContain('}}');

        // No literal "undefined" or "null"
        expect(result.html).not.toContain('undefined');
        expect(result.html).not.toContain('null');
        expect(result.text).not.toContain('undefined');
        expect(result.text).not.toContain('null');
      }),
      { numRuns: 20 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 4: Unknown email type rejection
// ---------------------------------------------------------------------------

describe('Property 4: Unknown email type rejection', () => {
  /**
   * **Validates: Requirements 4.5**
   *
   * For any string NOT in the 9 valid email types, renderEmail must throw.
   */
  it('should throw a validation error for any unknown email type', () => {
    const validSet = new Set<string>(EMAIL_TYPES);

    const invalidType = fc
      .string({ minLength: 1, maxLength: 60 })
      .filter((s) => !validSet.has(s));

    fc.assert(
      fc.property(invalidType, (type) => {
        expect(() => renderEmail(type, {})).toThrow(/Unknown email type/);
      }),
      { numRuns: 20 },
    );
  });
});
