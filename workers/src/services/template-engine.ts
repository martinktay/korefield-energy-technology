/**
 * @file template-engine.ts — Branded HTML email template rendering engine.
 * Pure function module that renders all 9 KoreField Academy email types into
 * HTML + plain text using a shared base layout. No external templating library
 * needed — uses TypeScript template literals.
 */

// ---------------------------------------------------------------------------
// Types (self-contained — no cross-package imports)
// ---------------------------------------------------------------------------

/** All supported email types. */
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

export type EmailType = (typeof EMAIL_TYPES)[number];

/** Output of the template rendering pipeline. */
export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

/** Internal return type from individual template renderers. */
interface TemplateResult {
  subject: string;
  bodyHtml: string;
}

// ---------------------------------------------------------------------------
// Brand constants
// ---------------------------------------------------------------------------

const BRAND = {
  name: 'KoreField Academy',
  color600: '#1b5ef5',
  surface900: '#0f172a',
  surface50: '#f8fafc',
  surface500: '#64748b',
  supportEmail: 'support@korefield.com',
  siteUrl: 'https://korefield.com',
} as const;

// ---------------------------------------------------------------------------
// Base layout
// ---------------------------------------------------------------------------

/**
 * Wraps email body HTML in the shared KoreField Academy branded layout.
 * Includes logo text header, brand colors, and footer with contact info.
 */
export function baseLayout(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.surface50};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.surface50};">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color:${BRAND.color600};padding:24px 32px;text-align:center;">
              <span style="font-size:24px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">${BRAND.name}</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;color:${BRAND.surface900};font-size:16px;line-height:1.6;">
              ${bodyHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;background-color:${BRAND.surface50};border-top:1px solid #e2e8f0;text-align:center;font-size:13px;color:${BRAND.surface500};line-height:1.5;">
              <p style="margin:0 0 8px;">&copy; ${new Date().getFullYear()} ${BRAND.name}. All rights reserved.</p>
              <p style="margin:0 0 4px;">Questions? Contact us at <a href="mailto:${BRAND.supportEmail}" style="color:${BRAND.color600};text-decoration:none;">${BRAND.supportEmail}</a></p>
              <p style="margin:0;"><a href="${BRAND.siteUrl}" style="color:${BRAND.color600};text-decoration:none;">${BRAND.siteUrl}</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// HTML utility helpers
// ---------------------------------------------------------------------------

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function ctaButton(text: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr>
    <td style="background-color:${BRAND.color600};border-radius:6px;padding:14px 28px;">
      <a href="${escapeHtml(url)}" style="color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;display:inline-block;">${escapeHtml(text)}</a>
    </td>
  </tr>
</table>`;
}

// ---------------------------------------------------------------------------
// Plain text generation
// ---------------------------------------------------------------------------

/**
 * Strips HTML tags from a string, preserving link URLs in `[text](url)` format.
 * Used to generate the plain text fallback for every email.
 */
export function stripHtml(html: string): string {
  let text = html;

  // Convert <a href="url">text</a> → text (url)
  text = text.replace(/<a\s[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi, (_, url, label) => {
    const cleanLabel = label.replace(/<[^>]*>/g, '').trim();
    if (cleanLabel && cleanLabel !== url) {
      return `${cleanLabel} (${url})`;
    }
    return url;
  });

  // Remove remaining HTML tags
  text = text.replace(/<[^>]*>/g, '');

  // Decode common HTML entities
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&copy;/g, '(c)');

  // Collapse whitespace and trim
  text = text.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();

  return text;
}

// ---------------------------------------------------------------------------
// Template: email_verification
// ---------------------------------------------------------------------------

function renderEmailVerification(data: Record<string, unknown>): TemplateResult {
  const verificationUrl = String(data.verificationUrl ?? '');
  const email = String(data.email ?? '');

  return {
    subject: 'Verify your email address — KoreField Academy',
    bodyHtml: `
      <h2 style="margin:0 0 16px;color:${BRAND.surface900};font-size:22px;">Verify Your Email Address</h2>
      <p>Hi there,</p>
      <p>Thanks for signing up for <strong>${BRAND.name}</strong>! Please verify your email address <strong>${escapeHtml(email)}</strong> by clicking the button below.</p>
      ${ctaButton('Verify Email', verificationUrl)}
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break:break-all;color:${BRAND.color600};">${escapeHtml(verificationUrl)}</p>
      <p style="color:${BRAND.surface500};font-size:14px;">This link expires in <strong>24 hours</strong>. If you did not create an account, you can safely ignore this email.</p>
    `,
  };
}

// ---------------------------------------------------------------------------
// Template: welcome
// ---------------------------------------------------------------------------

function renderWelcome(data: Record<string, unknown>): TemplateResult {
  const dashboardUrl = String(data.dashboardUrl ?? `${BRAND.siteUrl}/learner`);
  const foundationUrl = String(data.foundationUrl ?? `${BRAND.siteUrl}/learner/foundation`);

  return {
    subject: `Welcome to ${BRAND.name}!`,
    bodyHtml: `
      <h2 style="margin:0 0 16px;color:${BRAND.surface900};font-size:22px;">Welcome to ${BRAND.name}!</h2>
      <p>Your email has been verified and your account is now active. We're excited to have you on board.</p>
      <p>Start your journey with the <strong>AI Foundation School</strong> — a free, mandatory program that covers AI literacy, prompt engineering, systems awareness, and professional discipline.</p>
      ${ctaButton('Start AI Foundation School', foundationUrl)}
      <p>You can also explore your <a href="${escapeHtml(dashboardUrl)}" style="color:${BRAND.color600};text-decoration:none;">Learner Dashboard</a> to see what's ahead.</p>
      <p>Welcome aboard — let's build something great together.</p>
    `,
  };
}

// ---------------------------------------------------------------------------
// Template: password_reset
// ---------------------------------------------------------------------------

function renderPasswordReset(data: Record<string, unknown>): TemplateResult {
  const resetUrl = String(data.resetUrl ?? '');

  return {
    subject: 'Reset your password — KoreField Academy',
    bodyHtml: `
      <h2 style="margin:0 0 16px;color:${BRAND.surface900};font-size:22px;">Reset Your Password</h2>
      <p>We received a request to reset the password for your ${BRAND.name} account.</p>
      ${ctaButton('Reset Password', resetUrl)}
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break:break-all;color:${BRAND.color600};">${escapeHtml(resetUrl)}</p>
      <p style="color:${BRAND.surface500};font-size:14px;">This link expires in <strong>1 hour</strong>.</p>
      <p style="color:${BRAND.surface500};font-size:14px;">If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>
    `,
  };
}

// ---------------------------------------------------------------------------
// Template: payment_confirmation
// ---------------------------------------------------------------------------

function renderPaymentConfirmation(data: Record<string, unknown>): TemplateResult {
  const amount = Number(data.amount ?? 0);
  const currency = String(data.currency ?? 'USD');
  const trackName = String(data.trackName ?? '');
  const paymentPlanType = String(data.paymentPlanType ?? '');
  const installmentSequence = Number(data.installmentSequence ?? 1);
  const paymentDate = String(data.paymentDate ?? '');
  const paymentHistoryUrl = String(data.paymentHistoryUrl ?? `${BRAND.siteUrl}/learner/payments`);

  return {
    subject: `Payment confirmed — ${trackName}`,
    bodyHtml: `
      <h2 style="margin:0 0 16px;color:${BRAND.surface900};font-size:22px;">Payment Confirmed</h2>
      <p>Your payment has been successfully processed. Here are the details:</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:16px 0;border-collapse:collapse;">
        <tr>
          <td style="padding:8px 0;color:${BRAND.surface500};width:160px;">Track</td>
          <td style="padding:8px 0;font-weight:600;">${escapeHtml(trackName)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:${BRAND.surface500};">Amount Paid</td>
          <td style="padding:8px 0;font-weight:600;">${escapeHtml(currency)} ${amount.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:${BRAND.surface500};">Payment Plan</td>
          <td style="padding:8px 0;">${escapeHtml(paymentPlanType)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:${BRAND.surface500};">Installment</td>
          <td style="padding:8px 0;">#${installmentSequence}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:${BRAND.surface500};">Date</td>
          <td style="padding:8px 0;">${escapeHtml(paymentDate)}</td>
        </tr>
      </table>
      ${ctaButton('View Payment History', paymentHistoryUrl)}
      <p style="color:${BRAND.surface500};font-size:14px;">Keep this email as your payment receipt.</p>
    `,
  };
}

// ---------------------------------------------------------------------------
// Template: enrollment_confirmation
// ---------------------------------------------------------------------------

function renderEnrollmentConfirmation(data: Record<string, unknown>): TemplateResult {
  const trackName = String(data.trackName ?? '');
  const enrollmentDate = String(data.enrollmentDate ?? '');
  const expectedDuration = String(data.expectedDuration ?? '12 months');
  const trackDashboardUrl = String(data.trackDashboardUrl ?? `${BRAND.siteUrl}/learner`);

  return {
    subject: `You're enrolled — ${trackName}`,
    bodyHtml: `
      <h2 style="margin:0 0 16px;color:${BRAND.surface900};font-size:22px;">Enrollment Confirmed</h2>
      <p>Congratulations! You are now enrolled in <strong>${escapeHtml(trackName)}</strong>.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:16px 0;border-collapse:collapse;">
        <tr>
          <td style="padding:8px 0;color:${BRAND.surface500};width:160px;">Track</td>
          <td style="padding:8px 0;font-weight:600;">${escapeHtml(trackName)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:${BRAND.surface500};">Enrollment Date</td>
          <td style="padding:8px 0;">${escapeHtml(enrollmentDate)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:${BRAND.surface500};">Expected Duration</td>
          <td style="padding:8px 0;">${escapeHtml(expectedDuration)}</td>
        </tr>
      </table>
      ${ctaButton('Start First Module', trackDashboardUrl)}
      <p>Your learning journey begins now. Dive into the first module and start building real-world skills.</p>
    `,
  };
}

// ---------------------------------------------------------------------------
// Template: certificate_issued
// ---------------------------------------------------------------------------

function renderCertificateIssued(data: Record<string, unknown>): TemplateResult {
  const trackName = String(data.trackName ?? '');
  const verificationCode = String(data.verificationCode ?? '');
  const certificateUrl = String(data.certificateUrl ?? '');
  const publicVerificationUrl = String(
    data.publicVerificationUrl ?? `${BRAND.siteUrl}/verify/${verificationCode}`,
  );

  return {
    subject: `Certificate issued — ${trackName}`,
    bodyHtml: `
      <h2 style="margin:0 0 16px;color:${BRAND.surface900};font-size:22px;">Your Certificate Is Ready!</h2>
      <p>Congratulations on completing <strong>${escapeHtml(trackName)}</strong>! Your certificate has been issued.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:16px 0;border-collapse:collapse;">
        <tr>
          <td style="padding:8px 0;color:${BRAND.surface500};width:160px;">Track</td>
          <td style="padding:8px 0;font-weight:600;">${escapeHtml(trackName)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:${BRAND.surface500};">Verification Code</td>
          <td style="padding:8px 0;font-weight:600;font-family:monospace;">${escapeHtml(verificationCode)}</td>
        </tr>
      </table>
      ${ctaButton('Download Certificate (PDF)', certificateUrl)}
      <p>Share your achievement! Anyone can verify your certificate at:</p>
      <p style="word-break:break-all;"><a href="${escapeHtml(publicVerificationUrl)}" style="color:${BRAND.color600};text-decoration:none;">${escapeHtml(publicVerificationUrl)}</a></p>
    `,
  };
}

// ---------------------------------------------------------------------------
// Template: pod_assignment
// ---------------------------------------------------------------------------

function renderPodAssignment(data: Record<string, unknown>): TemplateResult {
  const podId = String(data.podId ?? '');
  const assignedRole = String(data.assignedRole ?? '');
  const trackName = String(data.trackName ?? '');
  const podPageUrl = String(data.podPageUrl ?? `${BRAND.siteUrl}/learner/pods`);

  return {
    subject: `Pod assignment — ${trackName}`,
    bodyHtml: `
      <h2 style="margin:0 0 16px;color:${BRAND.surface900};font-size:22px;">You've Been Assigned to a Pod</h2>
      <p>You've been placed in a multidisciplinary delivery team for <strong>${escapeHtml(trackName)}</strong>. Pods simulate real-world project teams to help you build collaboration skills.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:16px 0;border-collapse:collapse;">
        <tr>
          <td style="padding:8px 0;color:${BRAND.surface500};width:160px;">Pod</td>
          <td style="padding:8px 0;font-weight:600;">${escapeHtml(podId)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:${BRAND.surface500};">Your Role</td>
          <td style="padding:8px 0;font-weight:600;">${escapeHtml(assignedRole)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:${BRAND.surface500};">Track</td>
          <td style="padding:8px 0;">${escapeHtml(trackName)}</td>
        </tr>
      </table>
      ${ctaButton('Go to Your Pod', podPageUrl)}
      <p>Meet your teammates and start collaborating!</p>
    `,
  };
}

// ---------------------------------------------------------------------------
// Template: mfa_setup_confirmation
// ---------------------------------------------------------------------------

function renderMfaSetupConfirmation(data: Record<string, unknown>): TemplateResult {
  const activatedAt = String(data.activatedAt ?? new Date().toISOString());

  return {
    subject: 'MFA enabled on your account — KoreField Academy',
    bodyHtml: `
      <h2 style="margin:0 0 16px;color:${BRAND.surface900};font-size:22px;">Multi-Factor Authentication Enabled</h2>
      <p>MFA has been successfully activated on your ${BRAND.name} account.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:16px 0;border-collapse:collapse;">
        <tr>
          <td style="padding:8px 0;color:${BRAND.surface500};width:160px;">Status</td>
          <td style="padding:8px 0;font-weight:600;color:#16a34a;">Active</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:${BRAND.surface500};">Activated At</td>
          <td style="padding:8px 0;">${escapeHtml(activatedAt)}</td>
        </tr>
      </table>
      <p><strong>Important:</strong> Make sure you have stored your backup codes in a safe place. You will need them if you lose access to your authenticator app.</p>
      <p style="color:#dc2626;font-size:14px;"><strong>If you did not enable MFA on your account, please contact our support team immediately at <a href="mailto:${BRAND.supportEmail}" style="color:#dc2626;">${BRAND.supportEmail}</a>.</strong></p>
    `,
  };
}

// ---------------------------------------------------------------------------
// Template: account_status_change
// ---------------------------------------------------------------------------

function renderAccountStatusChange(data: Record<string, unknown>): TemplateResult {
  const newStatus = String(data.newStatus ?? '');
  const reason = data.reason != null ? String(data.reason) : '';
  const supportContactUrl = String(data.supportContactUrl ?? `mailto:${BRAND.supportEmail}`);
  const loginUrl = String(data.loginUrl ?? `${BRAND.siteUrl}/learner/login`);

  const isSuspended = newStatus.toLowerCase() === 'suspended';
  const statusColor = isSuspended ? '#dc2626' : '#16a34a';

  let nextStepsHtml: string;
  if (isSuspended) {
    nextStepsHtml = `
      <p>Your access to ${BRAND.name} has been temporarily restricted. If you believe this is an error or would like more information, please contact our support team.</p>
      ${ctaButton('Contact Support', supportContactUrl)}
    `;
  } else {
    nextStepsHtml = `
      <p>Your account is now active again. You can log in and continue your learning journey.</p>
      ${ctaButton('Log In', loginUrl)}
    `;
  }

  return {
    subject: `Account ${newStatus.toLowerCase()} — KoreField Academy`,
    bodyHtml: `
      <h2 style="margin:0 0 16px;color:${BRAND.surface900};font-size:22px;">Account Status Update</h2>
      <p>Your ${BRAND.name} account status has been changed.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:16px 0;border-collapse:collapse;">
        <tr>
          <td style="padding:8px 0;color:${BRAND.surface500};width:160px;">New Status</td>
          <td style="padding:8px 0;font-weight:600;color:${statusColor};">${escapeHtml(newStatus)}</td>
        </tr>
        ${reason ? `<tr>
          <td style="padding:8px 0;color:${BRAND.surface500};">Reason</td>
          <td style="padding:8px 0;">${escapeHtml(reason)}</td>
        </tr>` : ''}
      </table>
      ${nextStepsHtml}
    `,
  };
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

/** Map of email type → render function. */
const TEMPLATE_RENDERERS: Record<EmailType, (data: Record<string, unknown>) => TemplateResult> = {
  email_verification: renderEmailVerification,
  welcome: renderWelcome,
  password_reset: renderPasswordReset,
  payment_confirmation: renderPaymentConfirmation,
  enrollment_confirmation: renderEnrollmentConfirmation,
  certificate_issued: renderCertificateIssued,
  pod_assignment: renderPodAssignment,
  mfa_setup_confirmation: renderMfaSetupConfirmation,
  account_status_change: renderAccountStatusChange,
};

/**
 * Renders a branded email for the given type and data.
 * Dispatches to the type-specific renderer, wraps in the base layout,
 * and generates a plain text fallback.
 *
 * @throws {Error} If the email type is unknown.
 */
export function renderEmail(type: string, data: Record<string, unknown>): RenderedEmail {
  if (!(EMAIL_TYPES as readonly string[]).includes(type)) {
    throw new Error(`Unknown email type: "${type}". Valid types: ${EMAIL_TYPES.join(', ')}`);
  }

  const renderer = TEMPLATE_RENDERERS[type as EmailType];
  const { subject, bodyHtml } = renderer(data);
  const html = baseLayout(subject, bodyHtml);
  const text = stripHtml(html);

  return { subject, html, text };
}
