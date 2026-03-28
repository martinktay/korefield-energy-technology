/**
 * @file terms/page.tsx
 * Terms of Service page — covers enrollment structure, payment/refund policy,
 * pod collaboration rules, certificate conditions, acceptable use, IP, and governing law.
 */
"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-surface-0">
      <nav className="sticky top-0 z-50 border-b border-surface-200/80 bg-surface-0/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="text-heading-sm text-brand-700 font-semibold tracking-tight">KoreField Academy</Link>
          <div className="hidden items-center gap-1 sm:flex">
            <Link href="/privacy" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>Privacy</Link>
            <Link href="/cookies" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>Cookies</Link>
            <Separator orientation="vertical" className="mx-2 h-5" />
            <Link href="/learner/login" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>Sign In</Link>
          </div>
        </div>
      </nav>

      <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        <h1 className="text-display-sm text-surface-900">Terms of Service</h1>
        <p className="mt-2 text-body-sm text-surface-500">Last updated: March 2026</p>

        <div className="mt-8 space-y-8 text-body-sm text-surface-700 leading-relaxed">
          <section>
            <h2 className="text-heading-sm text-surface-900 mb-3">1. Acceptance of Terms</h2>
            <p>By creating an account or using KoreField Academy (&quot;the Platform&quot;), you agree to these Terms of Service. If you do not agree, do not use the Platform. These terms constitute a legally binding agreement between you and KoreField Academy.</p>
          </section>

          <section>
            <h2 className="text-heading-sm text-surface-900 mb-3">2. Eligibility</h2>
            <p>You must be at least 16 years old to use the Platform. By registering, you represent that you meet this age requirement and that the information you provide is accurate and complete.</p>
          </section>

          <section>
            <h2 className="text-heading-sm text-surface-900 mb-3">3. Account Responsibilities</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>You are responsible for maintaining the confidentiality of your login credentials</li>
              <li>You must not share your account with others</li>
              <li>You must enable MFA when required by your role (Instructors, Assessors, Super Admins, Corporate Partners, Finance Admins, DevOps Engineers)</li>
              <li>You must notify us immediately of any unauthorized access to your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-heading-sm text-surface-900 mb-3">4. Learning Structure</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>All learners must complete the AI Foundation School (free, 5 modules) before accessing paid Track Pathways</li>
              <li>Track Pathways are enrolled as a full pathway (Beginner + Intermediate + Advanced) — individual levels cannot be purchased separately</li>
              <li>Progression is gated by Performance Gates at each module and level boundary. You must meet the threshold score to advance.</li>
              <li>You have a maximum of 2 reassessment attempts per Performance Gate. If exhausted, you must repeat the module.</li>
              <li>Certification requires completion of all 6 conditions: Foundation complete, all levels complete, pod deliverables complete, capstone defense passed, assessor approval, and payment cleared</li>
            </ul>
          </section>

          <section>
            <h2 className="text-heading-sm text-surface-900 mb-3">5. Payments and Refunds</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Track Pathway pricing is region-aware, calculated based on your billing country, purchasing power band, applicable scholarships, and active campaigns</li>
              <li>Payment plans available: full payment, 2-installment, or 3-installment</li>
              <li>Installments must be paid by their due dates. A grace period applies to overdue installments before escalation.</li>
              <li>Pausing a payment plan pauses your access to paid content. AI Foundation School access remains available.</li>
              <li>Refunds are available within 14 days of enrollment if you have not completed more than 20% of the first level. After this period, no refunds are issued.</li>
              <li>Certificates will not be issued until all payments are cleared</li>
            </ul>
          </section>

          <section>
            <h2 className="text-heading-sm text-surface-900 mb-3">6. Pod Collaboration</h2>
            <p className="mb-2">Learners are assigned to multidisciplinary pods that simulate real-world project teams. By participating in pods, you agree to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Collaborate professionally with pod members</li>
              <li>Contribute to pod deliverables (working prototype, documentation, governance checklist, sprint reviews)</li>
              <li>Maintain professionalism standards across 5 dimensions: Communication, Accountability, Collaboration, Documentation, and Learning Discipline</li>
              <li>Accept assessor evaluations of your professionalism and pod contributions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-heading-sm text-surface-900 mb-3">7. Certificates</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Certificates are issued automatically upon meeting all 6 certification conditions</li>
              <li>Each certificate has a unique verification code (KFCERT-YEAR-ALPHANUMERIC) that is publicly verifiable</li>
              <li>We reserve the right to revoke certificates in cases of academic dishonesty, fraud, or misrepresentation</li>
              <li>Certificates represent completion of the KoreField Academy curriculum and do not constitute a degree or professional license</li>
            </ul>
          </section>

          <section>
            <h2 className="text-heading-sm text-surface-900 mb-3">8. AI Services</h2>
            <p>The Platform uses AI agents for tutoring, feedback, risk assessment, and career guidance. These agents are advisory tools — they do not make binding decisions. AI-generated content may contain errors. You should verify important information independently. We implement guardrails against harmful outputs, but no AI system is perfect.</p>
          </section>

          <section>
            <h2 className="text-heading-sm text-surface-900 mb-3">9. Acceptable Use</h2>
            <p className="mb-2">You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Submit work that is not your own (plagiarism)</li>
              <li>Attempt to manipulate AI agents through prompt injection or adversarial inputs</li>
              <li>Share assessment answers, gate questions, or capstone materials with other learners</li>
              <li>Use the Platform for any unlawful purpose</li>
              <li>Attempt to access accounts, data, or systems you are not authorized to use</li>
              <li>Harass, threaten, or discriminate against other users</li>
              <li>Reverse-engineer, scrape, or redistribute Platform content</li>
            </ul>
          </section>

          <section>
            <h2 className="text-heading-sm text-surface-900 mb-3">10. Intellectual Property</h2>
            <p>All curriculum content, assessments, AI agent prompts, platform code, and branding are the intellectual property of KoreField Academy. Your enrollment grants you a personal, non-transferable license to access the content for learning purposes only. You retain ownership of your own submissions, capstone projects, and pod contributions.</p>
          </section>

          <section>
            <h2 className="text-heading-sm text-surface-900 mb-3">11. Limitation of Liability</h2>
            <p>KoreField Academy is provided &quot;as is&quot;. We do not guarantee uninterrupted access, error-free AI outputs, or specific employment outcomes. Our total liability to you is limited to the amount you have paid for your current enrollment. We are not liable for indirect, incidental, or consequential damages.</p>
          </section>

          <section>
            <h2 className="text-heading-sm text-surface-900 mb-3">12. Termination</h2>
            <p>We may suspend or terminate your account for violation of these terms, academic dishonesty, non-payment, or abusive behavior. You may close your account at any time by contacting support. Termination does not entitle you to a refund except as described in Section 5.</p>
          </section>

          <section>
            <h2 className="text-heading-sm text-surface-900 mb-3">13. Governing Law</h2>
            <p>These terms are governed by the laws of the Federal Republic of Nigeria. Disputes will be resolved through arbitration in Lagos, Nigeria, unless otherwise required by your local consumer protection laws.</p>
          </section>

          <section>
            <h2 className="text-heading-sm text-surface-900 mb-3">14. Changes to Terms</h2>
            <p>We may update these terms from time to time. Material changes will be communicated via email or platform notification at least 30 days before they take effect. Continued use of the Platform after changes take effect constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="text-heading-sm text-surface-900 mb-3">15. Contact</h2>
            <p>For questions about these terms: <span className="text-brand-600">legal@korefield.academy</span></p>
          </section>
        </div>
      </article>

    </div>
  );
}
