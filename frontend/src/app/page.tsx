import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  Cloud,
  Code2,
  Container,
  Database,
  FileCode2,
  Flame,
  GitBranch,
  Mail,
  MapPin,
  Menu,
  MessageSquare,
  Phone,
  Rocket,
  School,
  Users,
  Video,
  X,
} from "lucide-react";
import { ComingSoonWaitlistForm } from "@/components/waitlist/coming-soon-waitlist-form";

export const metadata: Metadata = {
  title: "KoreField Academy | AI Holiday Bootcamp",
  description: "Join KoreField Academy's affordable AI Holiday Bootcamp for senior secondary students to learn Python, build AI agents, and prepare for real tech opportunities.",
  keywords: [
    "KoreField Academy",
    "AI Holiday Bootcamp",
    "AI classes for students",
    "Python bootcamp Nigeria",
    "AI education Lagos",
    "affordable tech education Nigeria",
    "tech career training",
    "secondary school coding bootcamp",
  ],
  alternates: {
    canonical: "https://academy.korefield.com",
  },
  openGraph: {
    title: "KoreField Academy | AI Holiday Bootcamp",
    description: "Affordable AI education for students who want to learn Python, build AI agents, and prepare for real tech opportunities.",
    url: "https://academy.korefield.com",
    siteName: "KoreField Academy",
    type: "website",
    images: [
      {
        url: "https://korefield.com/images/sovereign-ai-viz.png",
        width: 1200,
        height: 630,
        alt: "KoreField Academy AI Holiday Bootcamp",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "KoreField Academy | AI Holiday Bootcamp",
    description: "Affordable AI education for students who want to learn Python, build AI agents, and prepare for real tech opportunities.",
    images: ["https://korefield.com/images/sovereign-ai-viz.png"],
  },
};

const whatsappUrl = "https://wa.me/2347033075594?text=Hello%20KoreField%2C%20I%20want%20to%20enroll%20for%20the%20AI%20Holiday%20Bootcamp.";

const overview = [
  { label: "Weeks", value: "8", detail: "Duration", icon: CalendarDays },
  { label: "Sessions", value: "12", detail: "Interactive", icon: School },
  { label: "Online", value: "Live", detail: "Google Meet", icon: Video },
  { label: "Target", value: "SS1-3", detail: "Senior Secondary", icon: Users },
];

const outcomes = [
  ["Build AI Agents", "Design intelligent agents that can reason, plan, and take action on real tasks."],
  ["Learn Python for AI", "Master Python fundamentals and practical AI libraries with guided projects."],
  ["Real-World Projects", "Build portfolio-ready projects instead of only completing textbook exercises."],
  ["Problem-Solving Skills", "Develop computational thinking that applies beyond coding and AI."],
];

const included = [
  "8 weeks of hands-on training",
  "12 interactive live sessions",
  "Real AI project portfolio",
  "Certificate of completion",
  "Direct mentorship from an AI Engineer",
  "Access to the KoreField community",
];

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "EducationalOrganization",
      "@id": "https://academy.korefield.com/#organization",
      name: "KoreField Academy",
      url: "https://academy.korefield.com",
      parentOrganization: {
        "@type": "Organization",
        name: "KoreField Energy & Technology Ltd",
        url: "https://korefield.com",
      },
      sameAs: ["https://korefield.com"],
      address: {
        "@type": "PostalAddress",
        streetAddress: "32 Oyelegunde Street, Beckley Estate, U-Turn Bus Stop",
        addressLocality: "Lagos",
        addressRegion: "Lagos State",
        addressCountry: "NG",
      },
    },
    {
      "@type": "Course",
      "@id": "https://academy.korefield.com/#ai-holiday-bootcamp",
      name: "AI Holiday Bootcamp",
      description:
        "An affordable 8-week bootcamp for senior secondary students to learn Python, build AI agents, and prepare for real tech opportunities without breaking the bank.",
      provider: {
        "@id": "https://academy.korefield.com/#organization",
      },
      educationalCredentialAwarded: "Certificate of Completion",
      timeRequired: "P8W",
      courseMode: "Online",
      inLanguage: "en",
      audience: {
        "@type": "EducationalAudience",
        educationalRole: "student",
      },
      offers: {
        "@type": "Offer",
        price: "180000",
        priceCurrency: "NGN",
        availability: "https://schema.org/InStock",
        url: "https://academy.korefield.com/#waitlist",
      },
      instructor: {
        "@type": "Person",
        name: "Martin K. Tay",
        jobTitle: "Founder and Lead Engineer, KoreField",
      },
    },
  ],
};

const navLinks = [
  { href: "#program", label: "Program" },
  { href: "#academy-philosophy", label: "Philosophy" },
  { href: "#team", label: "Team" },
  { href: "#waitlist", label: "Waitlist", active: true },
];

function NavLink({ href, label, active = false }: { href: string; label: string; active?: boolean }) {
  return (
    <a
      href={href}
      className={[
        "font-semibold tracking-tight transition-colors duration-200",
        active ? "text-[#003d37]" : "text-[#4c616c] hover:text-[#003d37]",
      ].join(" ")}
    >
      {label}
    </a>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f4faff] text-[#111d23]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <nav className="sticky top-0 z-50 border-b border-[#c3c6d4]/40 bg-[rgba(244,250,255,0.9)] backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-4xl items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:max-w-6xl lg:gap-4 lg:px-8 xl:max-w-7xl">
          <a
            href="https://korefield.com/"
            className="inline-flex min-w-0 items-center gap-3 font-sans text-[#003d37] sm:gap-4"
          >
            <Image
              src="/logo.svg"
              alt="KoreField Logo"
              width={64}
              height={64}
              className="h-12 w-auto shrink-0 sm:h-14 md:h-16"
              priority
              unoptimized
            />
            <span className="flex min-w-0 flex-col leading-none">
              <span className="text-lg font-black tracking-tight sm:text-xl md:text-2xl">KoreField</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#4c616c] sm:text-[11px]">
                Energy &amp; Technology
              </span>
            </span>
          </a>

          <div className="hidden items-center gap-8 text-sm md:flex">
            {navLinks.map((link) => (
              <NavLink key={link.label} href={link.href} label={link.label} active={link.active} />
            ))}
          </div>

          <a
            href={whatsappUrl}
            className="hidden rounded-lg bg-[#003d37] px-3 py-1.5 text-sm font-bold tracking-tight text-white transition-colors hover:bg-[#12554f] md:inline-flex"
          >
            Enroll Now
          </a>

          <details className="group relative md:hidden">
            <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-full border border-[#003d37]/15 bg-white/80 text-[#003d37] [&::-webkit-details-marker]:hidden">
              <Menu className="size-5 group-open:hidden" />
              <X className="hidden size-5 group-open:block" />
            </summary>
            <div className="absolute right-0 top-14 w-[min(78vw,18rem)] rounded-3xl border border-[#c3c6d4]/60 bg-[#f4faff] p-3.5 shadow-2xl">
              <div className="mb-5 text-base font-black tracking-tight text-[#003d37]">Academy Menu</div>
              <div className="flex flex-col gap-4 text-lg font-bold">
                {navLinks.map((link) => (
                  <NavLink key={link.label} href={link.href} label={link.label} active={link.active} />
                ))}
              </div>
              <a
                href={whatsappUrl}
                className="mx-auto mt-6 flex w-full max-w-[13.5rem] items-center justify-center rounded-lg bg-[#003d37] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#12554f] sm:text-sm"
              >
                Enroll Now
              </a>
            </div>
          </details>
        </div>
      </nav>

      <main>
        <section className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
          <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-[#003d37]/5 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[#003d37]/5 blur-3xl" />
          <div className="relative mx-auto max-w-4xl text-center lg:max-w-5xl">
            <div className="mb-8 inline-flex max-w-[calc(100vw-2rem)] items-center gap-1.5 rounded-full border border-[#003d37]/15 bg-[#dceef3] px-3 py-1.5 text-[10px] font-bold uppercase leading-tight tracking-[0.14em] text-[#003d37] md:gap-2 md:px-4 md:py-2 md:text-xs md:tracking-[0.18em]">
              <Flame className="size-3.5 shrink-0 sm:size-4" />
              AI Holiday Bootcamp Now Enrolling
            </div>
            <h1 className="font-sans text-5xl font-extrabold leading-none tracking-tight text-[#003d37] sm:text-6xl lg:text-7xl">
              KoreField Academy
            </h1>
            <p className="mt-6 font-sans text-2xl font-bold tracking-tight text-[#111d23] sm:text-3xl">
              Build real AI systems, not just theory.
            </p>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-[#4c616c]">
              An intensive 8-week bootcamp designed for senior secondary students who want to learn Python, build AI agents, and work on real-world projects, led by a practising AI Engineer and Data Scientist.
            </p>
            <div className="mx-auto mt-10 flex w-full max-w-[min(15rem,calc(100vw-2.5rem))] flex-col justify-center gap-2 md:max-w-xl md:flex-row md:gap-3">
              <a
                href={whatsappUrl}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#003d37] px-2.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#12554f] sm:gap-2 sm:px-3 sm:text-sm"
              >
                <MessageSquare className="size-4 shrink-0 sm:size-5" />
                Enroll via WhatsApp
              </a>
              <a
                href="#waitlist"
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#cfe6f2] px-2.5 py-2 text-xs font-semibold text-[#003d37] transition-colors hover:bg-[#bdd8e6] sm:gap-2 sm:px-3 sm:text-sm"
              >
                <Mail className="size-4 shrink-0 sm:size-5" />
                Join Waitlist
              </a>
            </div>
            <p className="mt-8 text-sm text-[#434652]">
              <span className="font-bold text-[#003d37]">{"\u20A6"}180,000</span> Early Bird Price · Limited Slots
            </p>
          </div>
        </section>

        <section id="program" className="scroll-mt-24 border-y border-[#c3c6d4]/35 bg-white px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl lg:max-w-5xl">
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#003d37]">Program Overview</p>
              <h2 className="mt-2 font-sans text-3xl font-extrabold tracking-tight text-[#111d23] sm:text-4xl">What You&apos;re Signing Up For</h2>
            </div>
            <div className="mt-8 grid gap-2.5 sm:mt-10 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
              {overview.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="mx-auto flex w-full max-w-[min(17.25rem,calc(100vw-2.5rem))] min-h-[6rem] flex-col justify-center rounded-2xl border border-[#c3c6d4]/20 bg-[#f7fbfd] p-3 text-center shadow-sm md:min-h-[7rem] md:p-4 lg:mx-0 lg:max-w-full"
                  >
                    <Icon className="mx-auto size-5 text-[#003d37]" />
                    <p className="mt-3 font-sans text-xl font-extrabold text-[#003d37] sm:text-2xl">{item.value}</p>
                    <p className="text-sm font-bold text-[#111d23]">{item.label}</p>
                    <p className="text-[11px] leading-relaxed text-[#4c616c]">{item.detail}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="academy-philosophy" className="scroll-mt-24 bg-[#e9f6fd] px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-4xl gap-8 lg:max-w-5xl lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div className="text-center lg:text-left">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#003d37]">About the Academy</p>
              <h2 className="mt-2 font-sans text-3xl font-extrabold tracking-tight text-[#111d23] sm:text-4xl">A practical path into tech that does not break the bank</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
              <div className="mx-auto w-full max-w-[min(19rem,calc(100vw-2.5rem))] rounded-2xl border border-[#c3c6d4]/20 bg-white p-4 shadow-sm md:p-5 lg:mx-0 lg:max-w-full lg:p-6">
                <h3 className="text-lg font-bold text-[#003d37]">Affordable by Design</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#4c616c]">
                  KoreField Academy exists for families who want serious tech education without paying luxury-school prices. We keep the offer focused: live teaching, real projects, mentorship, and a clear learning path.
                </p>
              </div>
              <div className="mx-auto w-full max-w-[min(19rem,calc(100vw-2.5rem))] rounded-2xl border border-[#c3c6d4]/20 bg-white p-4 shadow-sm md:p-5 lg:mx-0 lg:max-w-full lg:p-6">
                <h3 className="text-lg font-bold text-[#003d37]">Job-Ready Thinking</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#4c616c]">
                  Our philosophy is simple: students should learn skills that can grow into internships, freelance work, scholarships, and future jobs. The goal is not just to finish lessons, but to build confidence with tools used in the real world.
                </p>
              </div>
              <div className="mx-auto w-full max-w-[min(19rem,calc(100vw-2.5rem))] rounded-2xl border border-[#c3c6d4]/20 bg-white p-4 shadow-sm sm:col-span-2 md:p-5 lg:mx-0 lg:max-w-full lg:p-6">
                <h3 className="text-lg font-bold text-[#003d37]">Talent First, Platform Next</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#4c616c]">
                  While the full LMS is being completed, this first cohort runs live via Google Meet so students can begin now. Early learners will move into the platform when it launches, carrying their project work and community access with them.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="industry-tools" className="scroll-mt-24 bg-[#e9f6fd] px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl lg:max-w-5xl">
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#003d37]">Industry Tools</p>
              <h2 className="mt-2 font-sans text-3xl font-extrabold tracking-tight text-[#111d23] sm:text-4xl">
                Tools We Work With at KoreField
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-[#4c616c]">
                Learn with the same technologies we use in the Academy curriculum—so what you study matches how modern AI systems are built.
              </p>
            </div>
            <div className="mt-8 grid gap-3.5 sm:mt-12 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {(
                [
                  {
                    title: "Python & PyTorch",
                    body: "Industry-standard AI development with the most widely used ML stack.",
                    icon: Code2,
                    iconWrap: "bg-[#3776ab]/10 text-[#3776ab]",
                  },
                  {
                    title: "LangChain & LangGraph",
                    body: "Production-ready agents and workflows with composable orchestration.",
                    icon: GitBranch,
                    iconWrap: "bg-[#111d23]/10 text-[#111d23]",
                  },
                  {
                    title: "AWS Cloud",
                    body: "Deploy and scale AI workloads on leading cloud primitives.",
                    icon: Cloud,
                    iconWrap: "bg-[#ff9900]/12 text-[#ca6c00]",
                  },
                  {
                    title: "Docker & FastAPI",
                    body: "Containerized services and high-performance APIs for models and agents.",
                    icon: Container,
                    iconWrap: "bg-[#2496ed]/10 text-[#2496ed]",
                  },
                  {
                    title: "PostgreSQL & data",
                    body: "Reliable storage, migrations, and analytics-ready pipelines.",
                    icon: Database,
                    iconWrap: "bg-[#336791]/12 text-[#336791]",
                  },
                  {
                    title: "TypeScript & Next.js",
                    body: "Typed, accessible web surfaces learners and staff use every day.",
                    icon: FileCode2,
                    iconWrap: "bg-[#003d37]/10 text-[#003d37]",
                  },
                ] as const
              ).map(({ title, body, icon: Icon, iconWrap }) => (
                <div
                  key={title}
                  className="mx-auto w-full max-w-[min(18.5rem,calc(100vw-2.5rem))] rounded-2xl border border-[#c3c6d4]/20 bg-white p-4 text-center shadow-sm md:p-5 lg:mx-0 lg:max-w-full lg:p-6"
                >
                  <div
                    className={`mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl sm:mb-4 sm:h-12 sm:w-12 ${iconWrap}`}
                  >
                    <Icon className="size-5 sm:size-6" aria-hidden />
                  </div>
                  <h3 className="text-lg font-bold text-[#111d23]">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#4c616c]">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="outcomes" className="scroll-mt-24 bg-[#f4faff] px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-4xl gap-10 lg:max-w-5xl lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#003662]">What You&apos;ll Learn</p>
              <h2 className="mt-2 font-sans text-3xl font-extrabold tracking-tight text-[#111d23] sm:text-4xl">Skills That Actually Matter</h2>
              <div className="mt-8 grid gap-3 sm:grid-cols-2 sm:gap-4">
                {outcomes.map(([title, description]) => (
                  <div
                    key={title}
                    className="mx-auto w-full max-w-[min(19rem,calc(100vw-2.5rem))] rounded-2xl border border-[#c3c6d4]/20 bg-[#e9f6fd] p-4 shadow-sm md:p-5 lg:mx-0 lg:max-w-full lg:p-6"
                  >
                    <Rocket className="size-6 text-[#003d37]" />
                    <h3 className="mt-4 text-base font-bold text-[#111d23] sm:text-lg">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#4c616c]">{description}</p>
                  </div>
                ))}
              </div>
            </div>
            <aside className="mx-auto flex w-full max-w-[min(20.5rem,calc(100vw-2.5rem))] flex-col items-center rounded-3xl border border-[#c3c6d4]/25 bg-[#e9f6fd] p-4 shadow-sm md:p-6 lg:mx-0 lg:max-w-none lg:items-stretch lg:self-stretch lg:p-8">
              <div className="w-full text-center">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#003d37]">Investment</p>
                <p className="mt-4 font-sans text-4xl font-extrabold text-[#003d37] sm:text-5xl">{"\u20A6"}180,000</p>
                <p className="mt-2 text-sm text-[#4c616c]">Early Bird Price</p>
              </div>
              <div className="mt-6 w-full max-w-[17.5rem] grid grid-cols-3 gap-1.5 sm:mt-8 sm:gap-2 md:gap-3 lg:max-w-full">
                <div className="flex min-h-[4rem] flex-col justify-center rounded-xl border border-[#c3c6d4]/15 bg-white px-1 py-2.5 text-center sm:min-h-[5.25rem] sm:rounded-2xl sm:p-4">
                  <div className="text-base font-extrabold text-[#003d37] sm:text-lg">8</div>
                  <div className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#4c616c] sm:mt-1 sm:text-[11px] sm:tracking-[0.16em]">Weeks</div>
                </div>
                <div className="flex min-h-[4rem] flex-col justify-center rounded-xl border border-[#c3c6d4]/15 bg-white px-1 py-2.5 text-center sm:min-h-[5.25rem] sm:rounded-2xl sm:p-4">
                  <div className="text-base font-extrabold text-[#003d37] sm:text-lg">12</div>
                  <div className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#4c616c] sm:mt-1 sm:text-[11px] sm:tracking-[0.16em]">Sessions</div>
                </div>
                <div className="flex min-h-[4rem] flex-col justify-center rounded-xl border border-[#c3c6d4]/15 bg-white px-1 py-2.5 text-center sm:min-h-[5.25rem] sm:rounded-2xl sm:p-4">
                  <div className="text-base font-extrabold text-[#003d37] sm:text-lg">Live</div>
                  <div className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#4c616c] sm:mt-1 sm:text-[11px] sm:tracking-[0.16em]">Mentoring</div>
                </div>
              </div>
              <div className="mt-6 w-full max-w-[19rem] space-y-3 sm:mt-8 sm:space-y-4 lg:max-w-full">
                {included.map((item) => (
                  <div key={item} className="flex gap-3 text-sm text-[#111d23]">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#003d37]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <a
                href={whatsappUrl}
                className="mt-6 inline-flex w-full max-w-[min(13.5rem,calc(100vw-3rem))] items-center justify-center rounded-lg bg-[#003d37] px-2.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#12554f] sm:mt-8 md:px-3 md:text-sm lg:max-w-[14.5rem]"
              >
                Enroll Now
              </a>
            </aside>
          </div>
        </section>

        <section id="team" className="scroll-mt-24 bg-white px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl xl:max-w-7xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#003d37]">Academy Team</p>
              <h2 className="mt-2 font-sans text-4xl font-extrabold tracking-tight text-[#111d23]">Built by practitioners who care about access</h2>
              <p className="mt-4 text-base leading-snug text-[#4c616c] sm:text-lg">
                The Academy is shaped by lead instructors and specialist faculty who combine rigorous delivery with real care for access—so learners get both world-class standards and human support.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-6 sm:gap-7 lg:grid-cols-3 lg:items-stretch lg:gap-6">
              <article className="mx-auto flex h-full w-full max-w-lg flex-col rounded-2xl border border-[#c3c6d4]/25 bg-[#f4faff] p-5 shadow-sm sm:max-w-xl sm:p-6 lg:mx-0 lg:max-w-none">
                <div className="flex w-full flex-col items-center gap-5 text-center sm:gap-6 lg:items-stretch lg:gap-4 lg:text-left">
                  <div className="relative mx-auto aspect-square w-full max-w-[13.25rem] shrink-0 overflow-hidden rounded-2xl border border-[#003d37]/12 bg-[#cfdce6] shadow-inner sm:max-w-[15rem] lg:mx-0 lg:max-w-none lg:rounded-xl">
                    <Image
                      src="/images/martin-tay-instructor.png"
                      alt="Martin K. Tay"
                      fill
                      sizes="(max-width: 1023px) 240px, (max-width: 1280px) 28vw, 320px"
                      className="object-cover object-[50%_30%]"
                    />
                  </div>
                  <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
                    <h3 className="font-sans text-lg font-bold leading-tight text-[#003d37] sm:text-xl">Martin K. Tay</h3>
                    <p className="mt-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#4c616c]">Founder and Lead Engineer</p>
                    <p className="mt-3 text-sm leading-relaxed text-[#434652] sm:text-[0.9375rem]">
                      Leads the Academy curriculum, live instruction, and project-based learning model with 8+ years across engineering, data science, Oil and Gas, finance, enterprise operations, and applied AI.
                    </p>
                  </div>
                </div>
              </article>

              <article className="mx-auto flex h-full w-full max-w-lg flex-col rounded-2xl border border-[#c3c6d4]/25 bg-[#f4faff] p-5 shadow-sm sm:max-w-xl sm:p-6 lg:mx-0 lg:max-w-none">
                <div className="flex w-full flex-col items-center gap-5 text-center sm:gap-6 lg:items-stretch lg:gap-4 lg:text-left">
                  <div className="relative mx-auto aspect-square w-full max-w-[13.25rem] shrink-0 overflow-hidden rounded-2xl border border-[#003d37]/12 bg-[#cfdce6] shadow-inner sm:max-w-[15rem] lg:mx-0 lg:max-w-none lg:rounded-xl">
                    <Image
                      src="/images/abigail-emmanuel.png"
                      alt="Abigail Emmanuel, Mathematics tutor"
                      fill
                      sizes="(max-width: 1023px) 240px, (max-width: 1280px) 28vw, 320px"
                      className="object-cover object-[50%_18%]"
                    />
                  </div>
                  <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
                    <h3 className="font-sans text-lg font-bold leading-tight text-[#003d37] sm:text-xl">Abigail Emmanuel</h3>
                    <p className="mt-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#4c616c]">Mathematics Tutor</p>
                    <p className="mt-3 text-sm leading-relaxed text-[#434652] sm:text-[0.9375rem]">
                      Abigail is a mathematics tutor with more than eight years of experience helping students build clarity and confidence. She meets each learner where they are—strengthening fundamentals, closing gaps with patient explanation, and tracking progress so families see steady improvement over time.
                    </p>
                  </div>
                </div>
              </article>

              <article className="mx-auto flex h-full w-full max-w-lg flex-col rounded-2xl border border-[#c3c6d4]/25 bg-[#f4faff] p-5 shadow-sm sm:max-w-xl sm:p-6 lg:mx-0 lg:max-w-none">
                <div className="flex w-full flex-col items-center gap-5 text-center sm:gap-6 lg:items-stretch lg:gap-4 lg:text-left">
                  <div className="relative mx-auto aspect-square w-full max-w-[13.25rem] shrink-0 overflow-hidden rounded-2xl border border-[#003d37]/12 bg-[#cfdce6] shadow-inner sm:max-w-[15rem] lg:mx-0 lg:max-w-none lg:rounded-xl">
                    <Image
                      src="/images/michael-ogu.png"
                      alt="Michael Ogu, AI and ML instructor"
                      fill
                      sizes="(max-width: 1023px) 240px, (max-width: 1280px) 28vw, 320px"
                      className="object-cover object-[50%_22%]"
                    />
                  </div>
                  <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
                    <h3 className="font-sans text-lg font-bold leading-tight text-[#003d37] sm:text-xl">Michael Ogu</h3>
                    <p className="mt-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#4c616c]">AI/ML Instructor &amp; Mentor</p>
                    <p className="mt-3 text-sm leading-relaxed text-[#434652] sm:text-[0.9375rem]">
                      Michael is a senior AI/ML engineer who brings current, university-level depth into the classroom: he is completing a BSc in Artificial Intelligence at Johannes Kepler Universität Linz alongside active industry work. He has mentored engineers in structured programs and focuses on clear explanations, sound problem-solving habits, and the same professional standards we expect in real delivery teams.
                    </p>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="border-y border-[#c3c6d4]/35 bg-[#e9f6fd] px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center md:max-w-3xl">
            <div className="inline-flex max-w-[calc(100vw-2rem)] rounded-full border border-[#003d37]/12 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#4c616c] md:px-4 md:py-2 md:text-xs md:tracking-[0.16em]">
              Full LMS Platform Under Development
            </div>
            <p className="mx-auto mt-5 max-w-3xl text-base leading-relaxed text-[#4c616c] sm:text-lg">
              The full KoreField Academy learning platform is currently being built. This inaugural cohort will run live via Google Meet while the platform is completed. Early students will receive access to the full platform when it launches.
            </p>
          </div>
        </section>

        <section id="waitlist" className="scroll-mt-24 bg-white px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-4xl gap-6 sm:gap-8 lg:max-w-5xl lg:grid-cols-[0.92fr_1.08fr]">
            <div className="mx-auto w-full max-w-[min(22rem,calc(100vw-2.5rem))] rounded-2xl border border-[#c3c6d4]/20 bg-[#e3f0f8] p-4 shadow-sm md:p-6 lg:mx-0 lg:max-w-none lg:rounded-3xl lg:p-8 xl:p-10">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#003d37]">Join the Waitlist</p>
              <h2 className="mt-3 font-sans text-2xl font-extrabold tracking-tight text-[#111d23] sm:text-4xl">Get notified about enrollment updates</h2>
              <p className="mt-4 text-base leading-relaxed text-[#4c616c] sm:text-lg">
                Join the list for enrollment updates, curriculum previews, and early-bird offers.
              </p>
              <div className="mt-5 space-y-3 sm:mt-6 sm:space-y-4">
                <div className="rounded-lg border border-[#c3c6d4]/15 bg-white p-3 sm:rounded-xl sm:p-4">
                  <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#4c616c] sm:mb-2 sm:text-[11px] sm:tracking-[0.16em]">Why Join Early</div>
                  <p className="text-sm leading-relaxed text-[#434652]">Secure early access to updates while the Academy platform and inaugural cohort are being finalized.</p>
                </div>
                <div className="rounded-lg border border-[#c3c6d4]/15 bg-white p-3 sm:rounded-xl sm:p-4">
                  <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#4c616c] sm:mb-2 sm:text-[11px] sm:tracking-[0.16em]">What You Receive</div>
                  <p className="text-sm leading-relaxed text-[#434652]">Enrollment updates, curriculum previews, and early-bird offers only.</p>
                </div>
              </div>
            </div>
            <div className="mx-auto w-full max-w-[min(22rem,calc(100vw-2.5rem))] rounded-2xl border border-[#c3c6d4]/20 bg-[#f7fbfd] p-3.5 shadow-sm md:p-6 lg:mx-0 lg:max-w-none lg:rounded-3xl lg:p-8">
              <ComingSoonWaitlistForm />
            </div>
          </div>
        </section>

        <section className="bg-[#003d37] px-4 py-16 text-center text-white sm:px-6 lg:px-8">
          <h2 className="font-sans text-4xl font-extrabold tracking-tight sm:text-5xl">Ready to Start Your AI Journey?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#8bc8bf] sm:text-lg">
            Limited spots available. Learn from a practising AI engineer while the full Academy platform is being prepared.
          </p>
          <div className="mx-auto mt-8 flex w-full max-w-[min(15rem,calc(100vw-2.5rem))] flex-col items-stretch justify-center gap-2 self-center md:max-w-xl md:flex-row md:items-center md:justify-center md:gap-3">
            <a href={whatsappUrl} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white px-2.5 py-2 text-xs font-semibold text-[#003d37] transition-colors hover:bg-[#eaf4f7] sm:gap-2 sm:px-3 sm:text-sm">
              <MessageSquare className="size-4 shrink-0 sm:size-5" />
              WhatsApp Us
            </a>
            <a href="tel:+2347033075594" className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/30 px-2.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/10 sm:gap-2 sm:px-3 sm:text-sm">
              <Phone className="size-4 shrink-0 sm:size-5" />
              +234 703 307 5594
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#c3c6d4]/35 bg-[#e9f6fd] px-4 py-16 text-[#434652] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl lg:max-w-5xl">
          <div className="mb-16 grid grid-cols-1 gap-12 text-center md:grid-cols-12 md:text-left">
            <div className="md:col-span-4">
              <span className="mb-6 block text-2xl font-extrabold tracking-tight text-[#003d37]">KoreField Academy</span>
              <p className="mx-auto mb-6 max-w-sm text-sm leading-relaxed text-[#4c616c] md:mx-0">
                Live bootcamps, learner support, and the Academy platform—focused on hands-on AI and engineering skills for students and lifelong learners.
              </p>
              <div className="mb-2 flex items-center justify-center gap-2 text-sm font-bold text-[#003d37] md:justify-start">
                <MapPin className="size-4 shrink-0" aria-hidden />
                <span>Lagos, Nigeria</span>
              </div>
              <p className="mx-auto max-w-sm text-xs font-medium leading-relaxed text-[#4c616c] md:mx-0 md:pl-6">
                <span className="text-[#4c616c]/80">Academy site</span>{" "}
                <span className="font-semibold text-[#111d23]">academy.korefield.com</span>
              </p>
            </div>
            <div className="md:col-span-3">
              <h4 className="mb-6 text-sm font-bold uppercase tracking-widest text-[#111d23]">On this page</h4>
              <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-[#4c616c]/80">Program &amp; cohort</p>
              <ul className="space-y-3 text-sm font-medium text-[#4c616c]">
                <li>
                  <a className="transition-colors hover:text-[#003d37]" href="#program">
                    Program overview
                  </a>
                </li>
                <li>
                  <a className="transition-colors hover:text-[#003d37]" href="#academy-philosophy">
                    Philosophy &amp; approach
                  </a>
                </li>
                <li>
                  <a className="transition-colors hover:text-[#003d37]" href="#outcomes">
                    Skills &amp; outcomes
                  </a>
                </li>
                <li>
                  <a className="transition-colors hover:text-[#003d37]" href="#industry-tools">
                    Tools we teach
                  </a>
                </li>
                <li>
                  <a className="transition-colors hover:text-[#003d37]" href="#team">
                    Academy team
                  </a>
                </li>
                <li>
                  <a className="transition-colors hover:text-[#003d37]" href="#waitlist">
                    Join waitlist
                  </a>
                </li>
              </ul>
            </div>
            <div className="md:col-span-3">
              <h4 className="mb-6 text-sm font-bold uppercase tracking-widest text-[#111d23]">Academy</h4>
              <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-[#4c616c]/80">Pages on this site</p>
              <ul className="space-y-3 text-sm font-medium text-[#4c616c]">
                <li>
                  <Link href="/" className="transition-colors hover:text-[#003d37]">
                    Academy home
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="transition-colors hover:text-[#003d37]">
                    Pricing &amp; enrollment
                  </Link>
                </li>
                <li>
                  <Link href="/team" className="transition-colors hover:text-[#003d37]">
                    Team
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="transition-colors hover:text-[#003d37]">
                    Careers at the Academy
                  </Link>
                </li>
                <li>
                  <Link href="/learner/login" className="transition-colors hover:text-[#003d37]">
                    Learner login
                  </Link>
                </li>
              </ul>
              <p className="mb-2 mt-6 text-[10px] font-bold uppercase tracking-wider text-[#4c616c]/80">Policies</p>
              <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs font-medium text-[#4c616c] md:justify-start">
                <li>
                  <Link href="/privacy" className="transition-colors hover:text-[#003d37]">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="transition-colors hover:text-[#003d37]">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" className="transition-colors hover:text-[#003d37]">
                    Cookies
                  </Link>
                </li>
              </ul>
            </div>
            <div className="md:col-span-2">
              <h4 className="mb-6 text-sm font-bold uppercase tracking-widest text-[#111d23]">Enrollment</h4>
              <div className="mb-4 flex justify-center gap-4 md:justify-start">
                <a
                  className="flex size-10 items-center justify-center rounded-full border border-[#c3c6d4]/50 bg-white text-[#003d37] shadow-sm transition-all hover:border-[#003d37] hover:bg-[#003d37] hover:text-white"
                  href="https://wa.me/2347033075594"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp the Academy +234 703 307 5594"
                >
                  <MessageSquare className="size-4" />
                </a>
                <a
                  className="flex size-10 items-center justify-center rounded-full border border-[#c3c6d4]/50 bg-white text-[#003d37] shadow-sm transition-all hover:border-[#003d37] hover:bg-[#003d37] hover:text-white"
                  href="mailto:enquiry@korefield.com"
                  aria-label="Email the Academy at enquiry@korefield.com"
                >
                  <Mail className="size-4" />
                </a>
              </div>
              <ul className="space-y-2 text-sm text-[#4c616c]">
                <li>
                  <a className="transition-colors hover:text-[#003d37]" href="https://wa.me/2347033075594" target="_blank" rel="noopener noreferrer">
                    WhatsApp +234 703 307 5594
                  </a>
                </li>
                <li>
                  <a className="transition-colors hover:text-[#003d37]" href="tel:+2347033075594">
                    Call +234 703 307 5594
                  </a>
                </li>
                <li>
                  <a className="transition-colors hover:text-[#003d37]" href="mailto:enquiry@korefield.com">
                    enquiry@korefield.com
                  </a>
                </li>
              </ul>
              <p className="mt-5 text-[10px] uppercase tracking-tighter text-[#4c616c]/80">
                Academy platform status: <span className="font-bold text-emerald-600">Operational</span>
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-6 border-t border-[#c3c6d4]/35 pt-8 text-center md:flex-row md:items-center md:justify-between md:text-left">
            <div className="max-w-md md:max-w-md">
              <p className="mb-1 text-sm font-bold text-[#111d23]">© {new Date().getFullYear()} KoreField Academy</p>
              <p className="text-xs leading-relaxed text-[#4c616c]">
                A learning program operated by KoreField Energy &amp; Technology Ltd.
              </p>
              <p className="mt-2 text-[10px] uppercase tracking-widest text-[#4c616c]">
                32 Oye Elegunde Street, Beckley Estate, U-Turn Bus Stop, Lagos State, Nigeria.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-[10px] font-bold uppercase tracking-widest text-[#4c616c] md:justify-end">
              <Link className="transition-colors hover:text-[#003d37]" href="/privacy">
                Privacy Policy
              </Link>
              <Link className="transition-colors hover:text-[#003d37]" href="/terms">
                Terms of Service
              </Link>
              <Link className="transition-colors hover:text-[#003d37]" href="/privacy">
                Security &amp; data
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}



