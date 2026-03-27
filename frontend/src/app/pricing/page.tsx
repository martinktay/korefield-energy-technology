/**
 * @file pricing/page.tsx
 * Public-facing pricing page showing track costs, payment plans,
 * and region-aware pricing. Accessible without authentication.
 *
 * Pricing is computed server-side by the Pricing Intelligence Engine
 * based on billing country, purchasing power, scholarships, and campaigns.
 * The values shown here are representative base prices (Nigeria tier).
 */
import Link from "next/link";

/** Base prices per track in USD — actual prices vary by region */
const tracks = [
  {
    id: "ai-engineering",
    name: "AI Engineering and Intelligent Systems",
    description: "Build production-grade AI systems from model training to deployment pipelines.",
    basePrice: 1200,
    modules: 18,
    duration: "9 months",
    icon: "🤖",
  },
  {
    id: "data-science",
    name: "Data Science and Decision Intelligence",
    description: "Turn raw data into actionable insights with statistical modeling and ML.",
    basePrice: 1200,
    modules: 18,
    duration: "9 months",
    icon: "📊",
  },
  {
    id: "cybersecurity",
    name: "Cybersecurity and AI Security",
    description: "Defend intelligent systems against adversarial attacks and emerging threats.",
    basePrice: 1100,
    modules: 18,
    duration: "9 months",
    icon: "🛡️",
  },
  {
    id: "ai-product",
    name: "AI Product and Project Leadership",
    description: "Lead AI-powered product teams from ideation through delivery and governance.",
    basePrice: 1000,
    modules: 18,
    duration: "9 months",
    icon: "🚀",
  },
];

/** Available payment plans — full, 2-pay, 3-pay installments */
const paymentPlans = [
  { id: "full", name: "Full Payment", description: "Pay once, save 10%", discount: 0.10 },
  { id: "2-pay", name: "2-Pay Plan", description: "Split into 2 installments", discount: 0.05 },
  { id: "3-pay", name: "3-Pay Plan", description: "Split into 3 installments", discount: 0 },
];

/** What every track includes */
const included = [
  "AI Avatar lessons (24/7 access)",
  "Instructor-led lab sessions",
  "Pod-based team collaboration",
  "Performance-gated progression",
  "Capstone project + panel defense",
  "Verifiable digital certificate",
  "Career Support Agent access",
  "Assignment Feedback Agent",
];

/** Frequently asked questions about pricing */
const faqs = [
  {
    q: "Is Foundation School really free?",
    a: "Yes. All 5 Foundation modules are completely free. You must complete them before enrolling in any paid track.",
  },
  {
    q: "How does region-aware pricing work?",
    a: "Our Pricing Intelligence Engine adjusts prices based on your billing country and local purchasing power. You'll see your personalized price after selecting your country during registration.",
  },
  {
    q: "Can I switch payment plans?",
    a: "You can upgrade from a 3-Pay to a 2-Pay or Full plan at any time. Downgrading is available before your second installment is due.",
  },
  {
    q: "What happens if I miss a payment?",
    a: "You'll receive reminders before the due date. If a payment is overdue, your track access is paused (not revoked) until the balance is cleared.",
  },
  {
    q: "Are scholarships available?",
    a: "Yes. Scholarship campaigns are applied automatically during checkout when available for your region and track.",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-surface-0">
      {/* Navigation — matches landing page */}
      <nav className="sticky top-0 z-50 border-b border-surface-200 bg-surface-0/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="text-heading-sm text-brand-700 font-semibold">
            KoreField Academy
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-body-sm text-surface-600 hover:text-surface-900 transition-colors">
              Home
            </Link>
            <Link
              href="/learner/register"
              className="rounded-lg bg-brand-600 px-4 py-2 text-body-sm font-medium text-white hover:bg-brand-700 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="bg-gradient-to-br from-brand-950 to-brand-900 py-16 text-center">
        <div className="mx-auto max-w-3xl px-4">
          <h1 className="text-display-sm text-white">Simple, Fair Pricing</h1>
          <p className="mt-3 text-body-lg text-brand-200">
            Start free with Foundation School. Pay only when you enroll in a track.
            Prices adjust to your region automatically.
          </p>
        </div>
      </header>

      {/* Foundation School — Free */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-card border-2 border-accent-500 bg-accent-50 p-6 text-center">
          <span className="inline-block rounded-full bg-accent-600 px-3 py-1 text-caption font-medium text-white">
            Always Free
          </span>
          <h2 className="mt-3 text-heading-lg text-surface-900">Foundation School</h2>
          <p className="mt-2 text-body-sm text-surface-600 max-w-lg mx-auto">
            5 mandatory modules covering AI Literacy, AI Fluency, Systems Awareness,
            Governance, and Professional Discipline. Required before any paid track.
          </p>
          <p className="mt-4 text-display-sm text-accent-700">$0</p>
          <Link
            href="/learner/register"
            className="mt-4 inline-block rounded-lg bg-accent-600 px-6 py-2.5 text-body-sm font-medium text-white hover:bg-accent-700 transition-colors"
          >
            Start Free
          </Link>
        </div>
      </section>

      {/* Track Pricing Cards */}
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <h2 className="text-heading-lg text-surface-900 text-center mb-8">Track Pathways</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {tracks.map((track) => (
            <div
              key={track.id}
              className="rounded-card border border-surface-200 bg-surface-0 p-6 shadow-card hover:shadow-card-hover transition-shadow"
            >
              <span className="text-heading-lg" role="img" aria-label={track.name}>
                {track.icon}
              </span>
              <h3 className="mt-3 text-heading-sm text-surface-900">{track.name}</h3>
              <p className="mt-1 text-body-sm text-surface-500">{track.description}</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-display-sm text-brand-700">
                  ${track.basePrice.toLocaleString()}
                </span>
                <span className="text-body-sm text-surface-400">USD base</span>
              </div>
              <p className="text-caption text-surface-400 mt-1">
                {track.modules} modules · {track.duration} · Beginner → Advanced
              </p>

              {/* Payment plan options */}
              <div className="mt-4 space-y-2">
                {paymentPlans.map((plan) => {
                  const finalPrice = Math.round(track.basePrice * (1 - plan.discount));
                  return (
                    <div
                      key={plan.id}
                      className="flex items-center justify-between rounded-lg border border-surface-200 px-3 py-2"
                    >
                      <div>
                        <span className="text-body-sm font-medium text-surface-700">{plan.name}</span>
                        <p className="text-caption text-surface-400">{plan.description}</p>
                      </div>
                      <span className="text-body-sm font-medium text-surface-900">
                        ${finalPrice.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-caption text-surface-400">
          Prices shown are base USD rates. Your final price is personalized based on billing country and purchasing power.
        </p>
      </section>

      {/* What's Included */}
      <section className="bg-surface-50 py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-heading-lg text-surface-900 text-center mb-6">
            Every Track Includes
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {included.map((item) => (
              <div key={item} className="flex items-start gap-2">
                <span className="mt-0.5 text-accent-600">✓</span>
                <span className="text-body-sm text-surface-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="text-heading-lg text-surface-900 text-center mb-8">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {faqs.map((faq) => (
            <details
              key={faq.q}
              className="group rounded-card border border-surface-200 bg-surface-0 shadow-card"
            >
              <summary className="cursor-pointer px-5 py-4 text-body-sm font-medium text-surface-900 list-none flex items-center justify-between">
                {faq.q}
                <span className="text-surface-400 group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <p className="px-5 pb-4 text-body-sm text-surface-600">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-brand-900 to-brand-800 py-12 text-center">
        <h2 className="text-heading-lg text-white">Ready to start?</h2>
        <p className="mt-2 text-body-sm text-brand-200 max-w-md mx-auto">
          Foundation School is free. Create your account and begin your AI journey today.
        </p>
        <Link
          href="/learner/register"
          className="mt-6 inline-block rounded-lg bg-white px-6 py-3 text-body-sm font-medium text-brand-700 shadow-lg hover:bg-surface-50 transition-colors"
        >
          Create Free Account
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-200 bg-surface-50 py-6 text-center text-caption text-surface-400">
        © {new Date().getFullYear()} KoreField Academy. All rights reserved.
      </footer>
    </div>
  );
}
