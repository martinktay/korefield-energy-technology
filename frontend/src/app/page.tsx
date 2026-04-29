import type { Metadata } from "next";
import { ComingSoonWaitlistForm } from "@/components/waitlist/coming-soon-waitlist-form";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "KoreField Academy | Coming Soon",
  description: "KoreField Academy is the applied AI learning arm of KoreField. Join the launch waitlist.",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-0">
      <nav className="sticky top-0 z-50 border-b border-surface-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-center px-4 py-3 sm:px-6 lg:px-8">
          <span className="text-heading-sm font-semibold text-brand-700">KoreField Academy</span>
        </div>
      </nav>

      <main>
        <section id="waitlist" className="bg-surface-50 py-16 sm:py-24 lg:py-32">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
            <div>
              <Badge variant="outline" className="mb-5 border-brand-200 bg-white text-brand-700">
                Coming soon
              </Badge>
              <h1 className="max-w-4xl text-display-lg leading-tight text-surface-950 md:text-display-lg">
                KoreField Academy
              </h1>
              <p className="mt-5 max-w-2xl text-heading-sm font-normal leading-relaxed text-surface-600">
                The applied AI learning arm of KoreField, built for teams, founders, and learners who need production-ready AI capability, not passive course completion.
              </p>
              <Badge variant="secondary" className="bg-accent-50 text-accent-800">
                Private launch access
              </Badge>
              <h2 className="mt-4 text-display-sm text-surface-950">Join the waitlist</h2>
              <p className="mt-4 max-w-xl text-body-lg leading-relaxed text-surface-600">
                We are opening access in stages for early learners, employers, and partners. Leave your details and the launch team will contact you when early access is ready.
              </p>
            </div>
            <div className="rounded-lg border border-surface-200 bg-white p-5 shadow-sm sm:p-6">
              <ComingSoonWaitlistForm />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-surface-200 bg-surface-950 px-4 py-8 text-surface-300 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-center">
          <p className="text-body-sm">KoreField Academy is coming soon.</p>
        </div>
      </footer>
    </div>
  );
}
