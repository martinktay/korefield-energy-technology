/**
 * @file page.tsx (Landing Page)
 * Public marketing landing page for KoreField Academy.
 * Showcases the two-layer curriculum (AI Foundation School + Track Pathways),
 * platform features, and the 4-step learner journey.
 * Uses shadcn/ui components (Button, Badge, Card, Separator).
 * No authentication required.
 */
import Link from "next/link";
import {
  Bot,
  Users,
  TrendingUp,
  Trophy,
  Globe,
  ShieldCheck,
  GraduationCap,
  BookOpen,
  BrainCircuit,
  Cpu,
  BarChart3,
  Rocket,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const tracks = [
  {
    id: "ai-engineering",
    name: "AI Engineering and Intelligent Systems",
    description: "Build production-grade AI systems, from model training to deployment pipelines.",
    icon: Cpu,
    color: "text-brand-600",
    bg: "bg-brand-50",
    border: "hover:border-l-brand-500",
  },
  {
    id: "data-science",
    name: "Data Science and Decision Intelligence",
    description: "Turn raw data into actionable insights with statistical modeling and ML.",
    icon: BarChart3,
    color: "text-accent-600",
    bg: "bg-accent-50",
    border: "hover:border-l-accent-500",
  },
  {
    id: "cybersecurity",
    name: "Cybersecurity and AI Security",
    description: "Defend intelligent systems against adversarial attacks and emerging threats.",
    icon: ShieldCheck,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "hover:border-l-amber-500",
  },
  {
    id: "ai-product",
    name: "AI Product and Project Leadership",
    description: "Lead AI-powered product teams from ideation through delivery and governance.",
    icon: Rocket,
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "hover:border-l-purple-500",
  },
];

const stats = [
  { label: "Learning Tracks", value: "4" },
  { label: "Foundation Modules", value: "5" },
  { label: "AI Teaching Agents", value: "11" },
  { label: "Countries Supported", value: "54+" },
];

const features = [
  { title: "AI Avatar Teaching", description: "Structured lessons delivered by AI-driven virtual teaching agents powered by RAG, available 24/7.", icon: Bot },
  { title: "Pod-Based Collaboration", description: "Join multidisciplinary delivery teams simulating real-world project roles and workflows.", icon: Users },
  { title: "Performance-Gated Progression", description: "Advance through rigorous gates that ensure mastery before moving to the next level.", icon: TrendingUp },
  { title: "Capstone Defense", description: "Prove your skills with a final project and live panel defense before certified assessors.", icon: Trophy },
  { title: "Region-Aware Pricing", description: "Fair pricing adjusted for your country, with flexible payment plans and scholarship support.", icon: Globe },
  { title: "Verifiable Certificates", description: "Earn traceable, employer-verifiable certificates gated by real competency — not attendance.", icon: ShieldCheck },
];

const steps = [
  { step: "1", title: "AI Foundation School", desc: "Complete 5 free modules covering AI literacy, prompt engineering, governance, and professional discipline.", icon: BookOpen },
  { step: "2", title: "Choose Your Track", desc: "Enroll in a full pathway — Beginner through Advanced — in one of four specialized tracks.", icon: BrainCircuit },
  { step: "3", title: "Learn in Pods", desc: "Collaborate in multidisciplinary teams with AI tutoring, hands-on labs, and peer reviews.", icon: Users },
  { step: "4", title: "Earn Your Certificate", desc: "Pass all performance gates, defend your capstone, and receive a verifiable certificate.", icon: GraduationCap },
];

const foundationModules = ["AI Literacy", "AI Fluency", "Systems Awareness", "Governance", "Professional Discipline"];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-0">
      {/* ── Navigation ── */}
      <nav className="sticky top-0 z-50 border-b border-surface-200/80 bg-surface-0/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="text-heading-sm text-brand-700 font-semibold">
            KoreField Academy
          </Link>
          <div className="hidden items-center gap-1 sm:flex">
            <a href="#tracks" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>Specialized Tracks</a>
            <a href="#features" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>Features</a>
            <Link href="/pricing" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>Pricing</Link>
            <a href="#how-it-works" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>How It Works</a>
            <Link href="/team" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>Team</Link>
            <Link href="/careers" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>Careers</Link>
            <Separator orientation="vertical" className="mx-2 h-5" />
            <Link href="/learner/login" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>Sign In</Link>
            <Link href="/learner/register" className={cn(buttonVariants({ size: "sm" }), "bg-brand-600 text-white hover:bg-brand-700")}>Get Started</Link>
          </div>
          {/* Mobile */}
          <div className="flex items-center gap-2 sm:hidden">
            <Link href="/learner/login" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>Sign In</Link>
            <Link href="/learner/register" className={cn(buttonVariants({ size: "sm" }), "bg-brand-600 text-white hover:bg-brand-700")}>Start</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <header className="relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-surface-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-600/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-4 bg-brand-700/40 text-brand-100 border border-brand-500/40 hover:bg-brand-700/40">
              Africa&apos;s Applied AI Learning Platform
            </Badge>
            <h1 className="text-display-lg text-white leading-tight">
              Build Real AI Skills.
              <br />
              <span className="text-brand-200">
                Not Just Certificates.
              </span>
            </h1>
            <p className="mt-5 max-w-2xl text-body-lg text-surface-200 leading-relaxed">
              KoreField Academy combines AI-powered teaching, hands-on labs, and
              multidisciplinary team projects to prepare Africa&apos;s workforce for
              intelligent industries. Start free with AI Foundation School.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/learner/register" className={cn(buttonVariants({ size: "lg" }), "bg-white text-brand-700 hover:bg-surface-50 shadow-lg gap-2 font-semibold")}>
                Start Free Foundation
                <ArrowRight className="size-4" />
              </Link>
              <a href="#tracks" className={cn(buttonVariants({ size: "lg", variant: "outline" }), "border-brand-400/40 text-brand-100 hover:bg-brand-800/40 hover:text-white bg-transparent")}>
                Explore Tracks
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* ── Stats Bar ── */}
      <section className="border-b border-surface-200 bg-surface-0">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-12 sm:px-6 md:grid-cols-4 lg:px-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-display-sm text-brand-600 font-bold">{stat.value}</p>
              <p className="mt-1.5 text-body-sm text-surface-500 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="bg-surface-0 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge variant="outline" className="mb-3">4-Step Journey</Badge>
            <h2 className="text-display-sm text-surface-900">How It Works</h2>
            <p className="mt-3 text-body-lg text-surface-500 max-w-2xl mx-auto">
              A structured path from AI literacy to industry-ready certification.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.step} className="relative border-surface-200 bg-surface-0 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all group">
                  <CardHeader>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-body-sm font-bold text-white group-hover:scale-110 transition-transform">
                      {item.step}
                    </span>
                    <CardTitle className="text-heading-sm text-surface-900 mt-1">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-body-sm text-surface-500">{item.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Track Pathways ── */}
      <section id="tracks" className="bg-surface-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge variant="outline" className="mb-3">Beginner → Advanced</Badge>
            <h2 className="text-display-sm text-surface-900">Specialized Tracks</h2>
            <p className="mt-3 text-body-lg text-surface-500 max-w-2xl mx-auto">
              Four specialized tracks spanning Beginner to Advanced. Each includes
              AI-powered lessons, instructor-led labs, and a capstone defense.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {tracks.map((track) => {
              const Icon = track.icon;
              return (
                <Card key={track.id} className="border-surface-200 border-l-4 border-l-transparent bg-surface-0 shadow-card hover:shadow-card-hover transition-all group">
                  <CardHeader>
                    <CardTitle className="text-heading-sm text-surface-900 mt-1">{track.name}</CardTitle>
                    <CardDescription className="text-body-sm text-surface-500">
                      {track.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {["Beginner", "Intermediate", "Advanced"].map((level) => (
                        <Badge key={level} variant="secondary" className="bg-brand-50 text-brand-700 hover:bg-brand-100 border-0">
                          {level}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="bg-surface-0 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge variant="outline" className="mb-3">Why KoreField</Badge>
            <h2 className="text-display-sm text-surface-900">Built for Applied Learning</h2>
            <p className="mt-3 text-body-lg text-surface-500 max-w-2xl mx-auto">
              Not passive consumption. Real skills, real teams, real outcomes.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="border-surface-200 bg-surface-0 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all group">
                  <CardHeader>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 group-hover:bg-brand-100 transition-colors">
                      <Icon className="size-5 text-brand-600" aria-hidden="true" />
                    </div>
                    <CardTitle className="text-heading-sm text-surface-900 mt-1">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-body-sm text-surface-500">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── AI Foundation School CTA ── */}
      <section className="bg-gradient-to-r from-brand-900 to-brand-800 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-display-sm text-white">Start With AI Foundation School</h2>
          <p className="mt-4 max-w-2xl mx-auto text-body-lg text-brand-200">
            Five free modules that every learner completes before accessing paid tracks.
            Build your AI literacy, prompt engineering skills, and professional discipline.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {foundationModules.map((mod) => (
              <Badge key={mod} variant="outline" className="border-brand-600 text-brand-100 hover:bg-brand-800/50 bg-transparent">
                <CheckCircle2 className="size-3 mr-1" />
                {mod}
              </Badge>
            ))}
          </div>
          <div className="mt-8">
            <Link href="/learner/register" className={cn(buttonVariants({ size: "lg" }), "bg-white text-brand-700 hover:bg-surface-50 shadow-lg gap-2")}>
              Create Free Account
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
