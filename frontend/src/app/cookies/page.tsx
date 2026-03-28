/**
 * @file cookies/page.tsx
 * Cookie Policy page — documents essential, functional, analytics, and performance cookies,
 * third-party cookies (Cloudflare, payment processors), localStorage usage, and consent compliance.
 */
"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-surface-0">
      <nav className="sticky top-0 z-50 border-b border-surface-200/80 bg-surface-0/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="text-heading-sm text-brand-700 font-semibold tracking-tight">KoreField Academy</Link>
          <div className="hidden items-center gap-1 sm:flex">
            <Link href="/privacy" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>Privacy</Link>
            <Link href="/terms" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>Terms</Link>
            <Separator orientation="vertical" className="mx-2 h-5" />
            <Link href="/learner/login" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>Sign In</Link>
          </div>
        </div>
      </nav>

      <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        <h1 className="text-display-sm text-surface-900">Cookie Policy</h1>
        <p className="mt-2 text-body-sm text-surface-500">Last updated: March 2026</p>

        <div className="mt-8 space-y-8 text-body-sm text-surface-700 leading-relaxed">
          <section>
            <h2 className="text-heading-sm text-surface-900 mb-3">1. What Are Cookies</h2>
            <p>Cookies are small text files stored on your device when you visit a website. They help us provide a better experience by remembering your preferences, keeping you signed in, and understanding how you use the Platform.</p>
          </section>

          <section>
            <h2 className="text-heading-sm text-surface-900 mb-3">2. Cookies We Use</h2>

            <div className="mt-4 rounded-card border border-surface-200 overflow-hidden">
              <table className="w-full text-left text-body-sm">
                <thead className="border-b border-surface-200 bg-surface-50">
                  <tr>
                    <th className="px-4 py-3 text-surface-600 font-medium">Category</th>
                    <th className="px-4 py-3 text-surface-600 font-medium">Purpose</th>
                    <th className="px-4 py-3 text-surface-600 font-medium">Duration</th>
                    <th className="px-4 py-3 text-surface-600 font-medium">Required</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-200">
                  <tr>
                    <td className="px-4 py-3 font-medium text-surface-900">Essential</td>
                    <td className="px-4 py-3 text-surface-600">Authentication (JWT session), CSRF protection, security tokens</td>
                    <td className="px-4 py-3 text-surface-500">Session / 24h</td>
                    <td className="px-4 py-3 text-surface-500">Yes</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-surface-900">Functional</td>
                    <td className="px-4 py-3 text-surface-600">Language preference, theme preference, sidebar state, code editor settings</td>
                    <td className="px-4 py-3 text-surface-500">1 year</td>
                    <td className="px-4 py-3 text-surface-500">No</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-surface-900">Analytics</td>
                    <td className="px-4 py-3 text-surface-600">Page views, feature usage, session duration — used to improve the Platform</td>
                    <td className="px-4 py-3 text-surface-500">90 days</td>
                    <td className="px-4 py-3 text-surface-500">No</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-surface-900">Performance</td>
                    <td className="px-4 py-3 text-surface-600">CDN caching (Cloudflare), load balancing, error tracking</td>
                    <td className="px-4 py-3 text-surface-500">Session</td>
                    <td className="px-4 py-3 text-surface-500">Yes</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-heading-sm text-surface-900 mb-3">3. Third-Party Cookies</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Cloudflare: performance and security cookies for video streaming and CDN</li>
              <li>Payment processors: session cookies during checkout flow (not stored after completion)</li>
            </ul>
            <p className="mt-2">We do not use advertising cookies or sell cookie data to third parties.</p>
          </section>

          <section>
            <h2 className="text-heading-sm text-surface-900 mb-3">4. Managing Cookies</h2>
            <p className="mb-2">You can control cookies through:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Your browser settings — most browsers allow you to block or delete cookies</li>
              <li>Our cookie consent banner — shown on your first visit, allowing you to accept or reject non-essential cookies</li>
            </ul>
            <p className="mt-2">Blocking essential cookies will prevent you from signing in and using the Platform. Blocking functional cookies may degrade your experience (e.g., preferences won&apos;t be remembered).</p>
          </section>

          <section>
            <h2 className="text-heading-sm text-surface-900 mb-3">5. Local Storage</h2>
            <p>In addition to cookies, we use browser localStorage for:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>Authentication tokens (JWT) for maintaining your session</li>
              <li>Code editor state (unsaved code, cursor position) to prevent data loss</li>
              <li>UI preferences (sidebar collapsed state, notification settings)</li>
            </ul>
            <p className="mt-2">localStorage data is stored only on your device and is not transmitted to our servers except for authentication tokens included in API requests.</p>
          </section>

          <section>
            <h2 className="text-heading-sm text-surface-900 mb-3">6. Compliance</h2>
            <p>This cookie policy complies with GDPR (EU), UK PECR, Nigeria&apos;s NDPR, and CCPA/CPRA requirements. We obtain consent before setting non-essential cookies for users in jurisdictions that require it.</p>
          </section>

          <section>
            <h2 className="text-heading-sm text-surface-900 mb-3">7. Changes</h2>
            <p>We may update this policy when we add or remove cookies. Changes will be reflected in the &quot;Last updated&quot; date above.</p>
          </section>

          <section>
            <h2 className="text-heading-sm text-surface-900 mb-3">8. Contact</h2>
            <p>For questions about cookies: <span className="text-brand-600">privacy@korefield.academy</span></p>
          </section>
        </div>
      </article>

    </div>
  );
}
