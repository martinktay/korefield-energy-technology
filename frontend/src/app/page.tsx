import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, BookOpen, Building2, Cpu, GraduationCap, ShieldCheck } from "lucide-react";
import { ComingSoonWaitlistForm } from "@/components/waitlist/coming-soon-waitlist-form";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "KoreField Academy | Coming Soon",
  description: "KoreField Academy is the applied AI learning arm of KoreField. Join the launch waitlist.",
};

const signals = [
  { label: "AI Foundation School", icon: BookOpen },
  { label: "Applied team projects", icon: Building2 },
  { label: "Production AI systems", icon: Cpu },
  { label: "Verifiable outcomes", icon: ShieldCheck },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-0">
      <nav className="sticky top-0 z-50 border-b border-surface-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="text-heading-sm font-semibold text-brand-700">
            KoreField Academy
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/pricing" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "hidden sm:inline-flex")}>
              Pricing
            </Link>
            <Link href="/team" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "hidden sm:inline-flex")}>
              Team
            </Link>
            <Link href="/learner/login" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              Sign in
            </Link>
          </div>
        </div>
      </nav>

      <main>
        <section className="relative overflow-hidden border-b border-surface-200 bg-surface-50">
          <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[linear-gradient(135deg,rgba(37,99,235,0.12),rgba(20,184,166,0.12))] lg:block" />
          <div className="mx-auto grid min-h-[calc(100vh-57px)] max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:px-8">
            <div className="max-w-3xl">
              <Badge variant="outline" className="mb-5 border-brand-200 bg-white text-brand-700">
                Coming soon
              </Badge>
              <h1 className="max-w-4xl text-display-lg leading-tight text-surface-950">
                KoreField Academy
              </h1>
              <p className="mt-5 max-w-2xl text-heading-sm font-normal leading-relaxed text-surface-600">
                The applied AI learning arm of KoreField, built for teams, founders, and learners who need production-ready AI capability, not passive course completion.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#waitlist" className={cn(buttonVariants({ size: "lg" }), "bg-brand-600 text-white hover:bg-brand-700")}>
                  Join the waitlist
                  <ArrowUpRight className="size-4" />
                </a>
                <Link href="/careers" className={cn(buttonVariants({ size: "lg", variant: "outline" }), "bg-white")}>
                  Careers
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="overflow-hidden rounded-lg border border-surface-200 bg-white shadow-xl">
                <div className="border-b border-surface-200 bg-surface-900 px-5 py-4">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="size-5 text-brand-200" />
                    <span className="text-body-sm font-semibold text-white">Launch Readiness</span>
                  </div>
                </div>
                <div className="grid gap-px bg-surface-200">
                  {signals.map((signal, index) => {
                    const Icon = signal.icon;
                    return (
                      <div key={signal.label} className="flex items-center justify-between bg-white px-5 py-5">
                        <div className="flex items-center gap-3">
                          <span className="flex size-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                            <Icon className="size-5" />
                          </span>
                          <span className="text-body-sm font-semibold text-surface-800">{signal.label}</span>
                        </div>
                        <span className="text-caption font-semibold uppercase tracking-wide text-accent-700">
                          Phase {index + 1}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="waitlist" className="bg-white py-16 sm:py-20">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
            <div>
              <Badge variant="secondary" className="bg-accent-50 text-accent-800">
                Private launch access
              </Badge>
              <h2 className="mt-4 text-display-sm text-surface-950">Join the waitlist</h2>
              <p className="mt-4 max-w-xl text-body-lg leading-relaxed text-surface-600">
                We are opening access in stages for early learners, employers, and partners. Leave your details and the launch team will contact you when your cohort is ready.
              </p>
            </div>
            <div className="rounded-lg border border-surface-200 bg-surface-50 p-5 shadow-sm sm:p-6">
              <ComingSoonWaitlistForm />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-surface-200 bg-surface-950 px-4 py-8 text-surface-300 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-body-sm">KoreField Academy is coming soon.</p>
          <div className="flex gap-4 text-body-sm">
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/cookies" className="hover:text-white">Cookies</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
