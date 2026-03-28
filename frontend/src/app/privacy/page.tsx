/**
 * @file privacy/page.tsx
 * Privacy Policy page — covers data collection, AI processing, GDPR/NDPR/CCPA compliance,
 * data retention, international transfers, and user rights.
 */
"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-surface-0">
      <nav className="sticky top-0 z-50 border-b border-surface-200/80 bg-surface-0/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="text-heading-sm text-brand-700 font-semibold tracking-tight">KoreField Academy</Link>
          <div className="hidden items-center gap-1 sm:flex">
            <Link href="/terms" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>Terms</Link>
            <Link href="/cookies" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>Cookies</Link>
            <Separator orientation="vertical" className="mx-2 h-5" />
            <Link href="/learner/login" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>Sign In</Link>
          </div>
        </div>
      </nav>

      <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        <h1 className="text-display-sm text-surface-900">Privacy Policy</h1>
        <p className="mt-2 text-body-sm text-surface-500">Last updated: March 2026</p>

        <div className="mt-8 space-y-8 text-body-sm text-surface-700 leading-relaxed">
          <section>
            <h2 className="text-heading-sm text-surface-900 mb-3">1. Who We Are</h2>
            <p>KoreField Academy (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is an applied AI learning platform. We operate as a data controller for the personal data we collect through our platform at korefield.academy and related services.</p>
          </section>

          <section>
            <h2 className="text-heading-sm text-surface-900 mb-3">2. Data We Collect</h2>
            <p className="mb-2">We collect the following categories of personal data:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Account information: name, email address, country, professional background, learning goals</li>
              <li>Authentication data: hashed passwords, MFA secrets (encrypted), session tokens</li>
              <li>Learning data: course progress, assessment scores, lab submissions, pod participation, capstone projects</li>
              <li>Payment data: billing country, payment plan type, installment status. We do not store card numbers — payment processing is handled by PCI DSS-compliant third-party gateways using tokenization.</li>
              <li>Usage data: pages visited, features used, session duration, device type</li>
              <li>Communication data: messages sent through the platform messaging system</li>
              <li>Recruitment data: CV uploads, application details, ATS matching scores (for job applicants only)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-heading-sm text-surface-900 mb-3">3. How We Use Your Data</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Deliver and personalize your learning experience, including AI-powered tutoring and feedback</li>
              <li>Track your progress through AI Foundation School and Track Pathways</li>
              <li>Process payments and manage installment plans</li>
              <li>Issue and verify certificates upon completion</li>
              <li>Identify at-risk learners through our Dropout Risk Agent (advisory only — no automated decisions)</li>
              <li>Improve our platform, curriculum, and AI agents</li>
              <li>Communicate with you about your account, courses, and platform updates</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-heading-sm text-surface-900 mb-3">4. AI and Automated Processing</h2>
            <p>Our platform uses AI agents (powered by LangChain and LangGraph) for tutoring, assignment feedback, dropout risk assessment, and career guidance. These agents are advisory only — they cannot override human decisions, fabricate data, modify curriculum, or bypass payment or certification gates. All AI outputs include guardrails against prompt injection, hallucination, and bias. You can request human review of any AI-generated assessment or recommendation.</p>
          </section>

          <section>
            <h2 className="text-heading-sm text-surface-900 mb-3">5. Legal Basis for Processing</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Contract performance: delivering the learning services you enrolled in</li>
              <li>Legitimate interest: improving our platform, preventing fraud, ensuring security</li>
              <li>Consent: marketing communications, optional analytics</li>
              <li>Legal obligation: tax records, regulatory compliance</li>
            </ul>
          </section>

          <section>
            <h2 className="text-heading-sm text-surface-900 mb-3">6. Data Sharing</h2>
            <p className="mb-2">We do not sell your personal data. We share data only with:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Cloud infrastructure providers (AWS) for hosting and storage — data encrypted at rest and in transit</li>
              <li>Payment processors for transaction processing (tokenized, PCI DSS-compliant)</li>
              <li>Cloudflare for video content delivery</li>
              <li>Corporate partners — only for sponsored learners, limited to progress and completion data as agreed in the sponsorship terms</li>
              <li>Law enforcement or regulators when required by law</li>
            </ul>
          </section>

          <section>
            <h2 className="text-heading-sm text-surface-900 mb-3">7. International Transfers</h2>
            <p>Your data may be processed in regions outside your country of residence. We use AWS infrastructure with appropriate safeguards including Standard Contractual Clauses (SCCs) for transfers outside the EEA/UK. We comply with GDPR, Nigeria&apos;s NDPR, UK DPA 2018, and CCPA/CPRA requirements for cross-border data transfers.</p>
          </section>

          <section>
            <h2 className="text-heading-sm text-surface-900 mb-3">8. Data Retention</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Account data: retained while your account is active, deleted within 30 days of account closure</li>
              <li>Learning records and certificates: retained indefinitely for verification purposes (certificates are publicly verifiable)</li>
              <li>Payment records: retained for 7 years for tax and audit compliance</li>
              <li>AI agent traces: retained for 90 days (via LangSmith) for quality assurance</li>
              <li>Job applications: retained for 12 months after the position is filled</li>
            </ul>
          </section>

          <section>
            <h2 className="text-heading-sm text-surface-900 mb-3">9. Your Rights</h2>
            <p className="mb-2">Depending on your jurisdiction, you have the right to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Access your personal data</li>
              <li>Rectify inaccurate data</li>
              <li>Request deletion of your data (subject to legal retention requirements)</li>
              <li>Restrict or object to processing</li>
              <li>Data portability</li>
              <li>Withdraw consent at any time</li>
              <li>Lodge a complaint with your local data protection authority</li>
            </ul>
            <p className="mt-2">To exercise these rights, contact us at <span className="text-brand-600">privacy@korefield.academy</span>.</p>
          </section>

          <section>
            <h2 className="text-heading-sm text-surface-900 mb-3">10. Security</h2>
            <p>We implement industry-standard security measures including TLS 1.2+ for all data in transit, encryption at rest for databases and storage, MFA for privileged roles, RBAC at API and database layers, container image vulnerability scanning, and regular security audits.</p>
          </section>

          <section>
            <h2 className="text-heading-sm text-surface-900 mb-3">11. Children</h2>
            <p>KoreField Academy is designed for adult learners and working professionals. We do not knowingly collect data from individuals under 16. If you believe a minor has provided us with personal data, contact us immediately.</p>
          </section>

          <section>
            <h2 className="text-heading-sm text-surface-900 mb-3">12. Changes to This Policy</h2>
            <p>We may update this policy from time to time. We will notify you of material changes via email or platform notification at least 30 days before they take effect.</p>
          </section>

          <section>
            <h2 className="text-heading-sm text-surface-900 mb-3">13. Contact</h2>
            <p>For privacy inquiries: <span className="text-brand-600">privacy@korefield.academy</span></p>
          </section>
        </div>
      </article>

    </div>
  );
}
