import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

const leadership = [
  { name: "Martin Tay", role: "Founder & CEO", bio: "Visionary behind KoreField Academy. Passionate about building Africa's AI workforce through applied, competency-based learning.", initials: "MT", color: "bg-brand-600" },
  { name: "Esi Owusu", role: "Chief Operating Officer", bio: "Oversees platform operations, enrollment strategy, and regional expansion across 54+ African countries.", initials: "EO", color: "bg-surface-800" },
  { name: "Nana Adjei", role: "Head of Administration", bio: "Manages user operations, curriculum publishing, payment oversight, and certificate administration.", initials: "NA", color: "bg-purple-600" },
];

const instructors = [
  { name: "Dr. Amina Osei", role: "Lead Instructor — AI Engineering", specialization: "Production AI Systems, MLOps, Model Deployment", tracks: ["AI Engineering"], initials: "AO", color: "bg-accent-600" },
  { name: "Prof. Kweku Mensah", role: "Lead Instructor — Data Science", specialization: "Statistical Modeling, Decision Intelligence, ML Pipelines", tracks: ["Data Science"], initials: "KM", color: "bg-accent-600" },
  { name: "Dr. Fatou Diop", role: "Lead Instructor — Cybersecurity", specialization: "AI Security, Adversarial ML, Threat Intelligence", tracks: ["Cybersecurity"], initials: "FD", color: "bg-accent-600" },
  { name: "Dr. Chidi Nwosu", role: "Lead Instructor — AI Product Leadership", specialization: "Product Strategy, AI Governance, Team Leadership", tracks: ["AI Product Leadership"], initials: "CN", color: "bg-accent-600" },
];

const assessors = [
  { name: "Prof. Babatunde Ogunleye", role: "Senior Assessor", focus: "Capstone defense panels, performance gate evaluation, pod supervision", initials: "BO", color: "bg-amber-600" },
  { name: "Dr. Wanjiku Kamau", role: "Senior Assessor", focus: "Professionalism scoring, certification validation, industry realism review", initials: "WK", color: "bg-amber-600" },
];

const operations = [
  { name: "Chidinma Eze", role: "Finance Admin", focus: "Payment processing, installment management, scholarship administration" },
  { name: "Tunde Bakare", role: "DevOps Engineer", focus: "Infrastructure, CI/CD, platform reliability, monitoring" },
  { name: "Akua Boateng", role: "Admin Coordinator", focus: "Enrollment operations, user support, curriculum scheduling" },
];

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function TeamPage() {
  return (
    <div className="min-h-screen bg-surface-0">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-surface-200/80 bg-surface-0/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="text-heading-sm text-brand-700 font-semibold tracking-tight">KoreField Academy</Link>
          <div className="hidden items-center gap-1 sm:flex">
            <Link href="/#tracks" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>Specialized Tracks</Link>
            <Link href="/pricing" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>Pricing</Link>
            <Link href="/team" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-brand-600")}>Team</Link>
            <Link href="/careers" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>Careers</Link>
            <Separator orientation="vertical" className="mx-2 h-5" />
            <Link href="/learner/login" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>Sign In</Link>
            <Link href="/learner/register" className={cn(buttonVariants({ size: "sm" }), "bg-brand-600 text-white hover:bg-brand-700")}>Get Started</Link>
          </div>
          <div className="flex items-center gap-2 sm:hidden">
            <Link href="/learner/login" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>Sign In</Link>
            <Link href="/learner/register" className={cn(buttonVariants({ size: "sm" }), "bg-brand-600 text-white hover:bg-brand-700")}>Start</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-surface-900 py-20 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-600/20 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-3xl px-4">
          <Badge variant="secondary" className="mb-4 bg-brand-700/40 text-brand-100 border border-brand-500/40 hover:bg-brand-700/40">Our People</Badge>
          <h1 className="text-display-lg text-white">Meet the Team</h1>
          <p className="mt-4 text-body-lg text-surface-200 max-w-xl mx-auto">
            The educators, engineers, and operators building Africa&apos;s applied AI learning platform.
          </p>
        </div>
      </header>

      {/* Leadership */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <h2 className="text-display-sm text-surface-900 text-center mb-2">Leadership</h2>
        <p className="text-body-lg text-surface-500 text-center mb-10 max-w-xl mx-auto">The team steering KoreField Academy&apos;s vision and operations.</p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {leadership.map((person) => (
            <div key={person.name} className="rounded-2xl border border-surface-200 bg-surface-0 p-6 shadow-card hover:shadow-card-hover transition-all text-center">
              <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-white ${person.color}`}>
                {person.initials}
              </div>
              <h3 className="mt-4 text-heading-sm text-surface-900">{person.name}</h3>
              <p className="text-body-sm text-brand-600 font-medium">{person.role}</p>
              <p className="mt-2 text-body-sm text-surface-500">{person.bio}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Instructors */}
      <section className="bg-surface-50 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-display-sm text-surface-900 text-center mb-2">Instructors</h2>
          <p className="text-body-lg text-surface-500 text-center mb-10 max-w-xl mx-auto">Industry practitioners who design curriculum and lead lab sessions.</p>
          <div className="grid gap-6 sm:grid-cols-2">
            {instructors.map((person) => (
              <div key={person.name} className="rounded-2xl border border-surface-200 bg-surface-0 p-6 shadow-card hover:shadow-card-hover transition-all">
                <div className="flex items-start gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${person.color}`}>
                    {person.initials}
                  </div>
                  <div>
                    <h3 className="text-heading-sm text-surface-900">{person.name}</h3>
                    <p className="text-body-sm text-accent-600 font-medium">{person.role}</p>
                    <p className="mt-2 text-body-sm text-surface-500">{person.specialization}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {person.tracks.map((t) => (
                        <Badge key={t} variant="secondary" className="bg-brand-50 text-brand-700 border-0 text-caption">{t}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Assessors */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <h2 className="text-heading-lg text-surface-900 text-center mb-2">Assessors</h2>
        <p className="text-body-lg text-surface-500 text-center mb-10 max-w-md mx-auto">Performance reviewers, pod supervisors, and certification validators.</p>
        <div className="grid gap-6 sm:grid-cols-2 max-w-3xl mx-auto">
          {assessors.map((person) => (
            <div key={person.name} className="rounded-2xl border border-surface-200 bg-surface-0 p-6 shadow-card">
              <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${person.color}`}>
                  {person.initials}
                </div>
                <div>
                  <h3 className="text-heading-sm text-surface-900">{person.name}</h3>
                  <p className="text-body-sm text-amber-600 font-medium">{person.role}</p>
                  <p className="mt-2 text-body-sm text-surface-500">{person.focus}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Operations */}
      <section className="bg-surface-50 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-heading-lg text-surface-900 text-center mb-2">Operations</h2>
          <p className="text-body-lg text-surface-500 text-center mb-10 max-w-md mx-auto">The team keeping the platform running smoothly.</p>
          <div className="grid gap-4 sm:grid-cols-3 max-w-4xl mx-auto">
            {operations.map((person) => (
              <div key={person.name} className="rounded-2xl border border-surface-200 bg-surface-0 p-5 shadow-card text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-surface-200 text-sm font-bold text-surface-600">
                  {getInitials(person.name)}
                </div>
                <h3 className="mt-3 text-body-lg font-semibold text-surface-900">{person.name}</h3>
                <p className="text-caption text-surface-500">{person.role}</p>
                <p className="mt-2 text-caption text-surface-400">{person.focus}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-brand-900 to-brand-800 py-16 text-center">
        <h2 className="text-display-sm text-white">Join Our Team</h2>
        <p className="mt-3 text-body-lg text-brand-200 max-w-md mx-auto">We&apos;re hiring instructors, assessors, and engineers to shape the future of AI education in Africa.</p>
        <Link href="/careers" className={cn(buttonVariants({ size: "lg" }), "mt-6 bg-white text-brand-700 hover:bg-surface-50 shadow-lg gap-2 font-semibold")}>
          View Open Positions <ArrowRight className="size-4" />
        </Link>
      </section>

    </div>
  );
}
