import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  Briefcase,
  Building2,
  Flame,
  GraduationCap,
  Mail,
  Menu,
  MessageSquare,
  Phone,
  Rocket,
  School,
  Users,
  X,
  Bot,
  Code2,
  Brain,
} from "lucide-react";
import { ComingSoonWaitlistForm } from "@/components/waitlist/coming-soon-waitlist-form";

export const metadata: Metadata = {
  title: "KoreField Academy | Practical AI, Coding & Digital Skills Training",
  description: "KoreField Academy delivers hands-on AI, coding, data, and digital skills training for students, schools, professionals, and teams in Nigeria, with applied projects and a roadmap for AI-supported learning.",
  keywords: [
    "KoreField Academy",
    "practical AI training Nigeria",
    "AI bootcamp Nigeria",
    "Python bootcamp Nigeria",
    "AI education Lagos",
    "corporate AI training Nigeria",
    "school AI program",
    "NYSC AI program",
    "digital skills training",
    "coding bootcamp Nigeria",
  ],
  alternates: {
    canonical: "https://academy.korefield.com",
  },
  openGraph: {
    title: "KoreField Academy | Practical AI, Coding & Digital Skills Training",
    description: "Hands-on AI, coding, data, and digital skills training for students, schools, professionals, and teams in Nigeria.",
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
    title: "KoreField Academy | Practical AI, Coding & Digital Skills Training",
    description: "Practical AI education, corporate AI training, school programmes, and student AI bootcamps from KoreField Academy.",
    images: ["https://korefield.com/images/sovereign-ai-viz.png"],
  },
};

const whatsappUrl = "https://wa.me/2347033075594?text=Hello%2C%20I%27m%20interested%20in%20KoreField%20Academy%20AI%20training%20programs.";

const overview = [
  { label: "Corporate", value: "B2B", detail: "AI adoption labs", icon: Briefcase },
  { label: "Acceleration", value: "NYSC", detail: "Career readiness", icon: Users },
  { label: "Sector Tracks", value: "Pro", detail: "Role-specific AI", icon: Building2 },
  { label: "Bootcamp", value: "8W", detail: "Student pathway", icon: CalendarDays },
];

const outcomes = [
  { title: "Build AI Agents", description: "Design practical agents that support research, operations, customer workflows, and internal productivity.", icon: Bot },
  { title: "Learn Applied AI Tools", description: "Use Python, prompt engineering, retrieval, automation, and modern AI libraries at the depth each audience needs.", icon: Code2 },
  { title: "Real-World Projects", description: "Turn training into prototypes, portfolio assets, and workflow demos that reflect real organizational problems.", icon: Rocket },
  { title: "Responsible AI Habits", description: "Develop evaluation, data privacy, governance, and problem-framing habits that make AI useful and safe.", icon: Brain },
];

const included = [
  "Senior secondary student AI bootcamp",
  "12 interactive live sessions over 8 weeks",
  "Python, agents, and real AI project portfolio",
  "Certificate of completion",
  "Direct mentorship from an AI Engineer",
  "Access to the KoreField community",
];

const academyTracks = [
  {
    title: "Corporate AI Training Nigeria",
    description:
      "Executive briefings, team workshops, and implementation labs that help Nigerian organizations identify high-value AI use cases, govern tools responsibly, and upskill staff for practical adoption.",
    icon: Briefcase,
  },
  {
    title: "NYSC AI Acceleration Program",
    description:
      "A career-forward NYSC AI program for corps members who want practical AI literacy, portfolio projects, employability signals, and a guided path into applied technology roles.",
    icon: GraduationCap,
  },
  {
    title: "Professional & Sector AI Tracks",
    description:
      "Role-specific tracks for energy, finance, operations, education, public sector, SME growth, and technical teams, shaped around the language and constraints of each sector.",
    icon: Building2,
  },
  {
    title: "Student AI Bootcamp Nigeria",
    description:
      "The student bootcamp remains the early talent pathway: Python foundations, AI agents, responsible tool use, and portfolio-ready projects for senior secondary learners.",
    icon: School,
  },
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
        "An 8-week student pathway for senior secondary learners to build Python foundations, AI agents, responsible tool habits, and a portfolio-ready AI project.",
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
        url: "https://academy.korefield.com/#contact",
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
  { href: "#home", label: "Home" },
  { href: "#programs", label: "Programs" },
  { href: "#learning-model", label: "Learning Model" },
  { href: "#industry-tools", label: "Tools" },
  { href: "#team", label: "Team" },
  { href: "/pricing", label: "Pricing" },
  { href: "#contact", label: "Contact", active: true },
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
    <div id="home" className="min-h-screen bg-[#f4faff] text-[#111d23]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <nav className="sticky top-0 z-50 border-b border-[#c3c6d4]/40 bg-[rgba(244,250,255,0.9)] backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-4xl items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:max-w-6xl lg:gap-4 lg:px-8 xl:max-w-7xl">
          <a
            href="https://korefield.com/"
            className="inline-flex min-w-0 items-center gap-2 font-sans text-[#003d37] sm:gap-3"
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
              <span className="text-lg font-black tracking-tight sm:text-xl md:text-2xl">KoreField Academy</span>
            </span>
          </a>

          <div className="hidden items-center gap-8 text-sm md:flex">
            {navLinks.map((link) => (
              <NavLink key={link.label} href={link.href} label={link.label} active={link.active} />
            ))}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <Link
              href="/learner/login"
              className="rounded-lg border border-[#003d37]/20 px-3 py-1.5 text-sm font-bold tracking-tight text-[#003d37] transition-colors hover:bg-[#dceef3]"
            >
              Learner login
            </Link>
            <Link
              href="/learner/register"
              className="rounded-lg bg-[#003d37] px-3 py-1.5 text-sm font-bold tracking-tight text-white transition-colors hover:bg-[#12554f]"
            >
              Create free account
            </Link>
          </div>

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
              <div className="mt-6 grid gap-2">
                <Link
                  href="/learner/register"
                  className="mx-auto flex w-full max-w-[13.5rem] items-center justify-center rounded-lg bg-[#003d37] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#12554f] sm:text-sm"
                >
                  Create free account
                </Link>
                <Link
                  href="/learner/login"
                  className="mx-auto flex w-full max-w-[13.5rem] items-center justify-center rounded-lg border border-[#003d37]/20 px-3 py-2 text-xs font-semibold text-[#003d37] transition-colors hover:bg-[#dceef3] sm:text-sm"
                >
                  Learner login
                </Link>
              </div>
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
              Flagship Talent Arm of Nigeria&apos;s Pioneering Practical AI Agency
            </div>
            <h1 className="font-sans text-5xl font-extrabold leading-none tracking-tight text-[#003d37] sm:text-6xl lg:text-7xl">
              KoreField Academy
            </h1>
            <p className="mt-6 font-sans text-2xl font-bold tracking-tight text-[#111d23] sm:text-3xl">
              Practical AI education for students, schools, professionals, and teams.
            </p>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-[#4c616c]">
              KoreField Academy delivers hands-on AI, coding, data, and digital skills training for Nigeria-first learners and organisations, with applied projects, responsible AI practice, and a platform roadmap for AI-supported tutoring, feedback, and progress insight.
            </p>
            <div className="mx-auto mt-10 flex w-full max-w-[min(15rem,calc(100vw-2.5rem))] flex-col justify-center gap-2 md:max-w-xl md:flex-row md:gap-3">
              <Link
                href="/learner/register"
                className="inline-flex items-center justify-center rounded-lg bg-[#003d37] px-2.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#12554f] sm:px-3 sm:text-sm"
              >
                Create free account
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center rounded-lg bg-[#cfe6f2] px-2.5 py-2 text-xs font-semibold text-[#003d37] transition-colors hover:bg-[#bdd8e6] sm:px-3 sm:text-sm"
              >
                View pricing
              </Link>
              <a
                href={whatsappUrl}
                className="inline-flex items-center justify-center rounded-lg border border-[#003d37]/20 bg-white/70 px-2.5 py-2 text-xs font-semibold text-[#003d37] transition-colors hover:bg-white sm:px-3 sm:text-sm"
              >
                Discuss Training
              </a>
            </div>
            <p className="mt-8 text-sm text-[#434652]">
              <span className="font-bold text-[#003d37]">School, student, professional, corporate, and NYSC pathways</span> · Lagos-based, Nigeria-first delivery
            </p>
          </div>
        </section>

        <section id="programs" className="border-y border-[#c3c6d4]/35 bg-white px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#003d37]">Practical AI Programs</p>
              <h2 className="mt-2 font-sans text-3xl font-extrabold tracking-tight text-[#111d23] sm:text-4xl">
                Built for the people who will use, manage, and build AI
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#4c616c] sm:text-lg">
                Every KoreField Academy pathway is tied to practical delivery: workflow redesign, responsible AI practice, automation, data literacy, governance, and real project outputs.
              </p>
            </div>
            <div className="mt-8 grid gap-3 sm:mt-10 md:grid-cols-2 xl:grid-cols-4 md:gap-4">
              {academyTracks.map((track) => {
                const Icon = track.icon;
                return (
                  <article key={track.title} className="rounded-3xl border border-[#c3c6d4]/20 bg-[#f7fbfd] p-5 shadow-sm md:p-6">
                    <div className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-[#dceef3] text-[#003d37]">
                      <Icon className="size-5" />
                    </div>
                    <h3 className="text-lg font-bold text-[#003d37]">{track.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-[#4c616c]">{track.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="portfolio" className="scroll-mt-24 border-y border-[#c3c6d4]/35 bg-[#e9f6fd] px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl lg:max-w-5xl">
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#003d37]">Academy Portfolio</p>
              <h2 className="mt-2 font-sans text-3xl font-extrabold tracking-tight text-[#111d23] sm:text-4xl">A practical AI talent engine for Nigeria</h2>
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

        <section id="schools" className="scroll-mt-24 bg-[#e9f6fd] px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-4xl gap-8 lg:max-w-5xl lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div className="text-center lg:text-left">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#003d37]">Schools</p>
              <h2 className="mt-2 font-sans text-3xl font-extrabold tracking-tight text-[#111d23] sm:text-4xl">Bring practical AI into classrooms and school programmes</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
              <div className="mx-auto w-full max-w-[min(19rem,calc(100vw-2.5rem))] rounded-2xl border border-[#c3c6d4]/20 bg-white p-4 shadow-sm md:p-5 lg:mx-0 lg:max-w-full lg:p-6">
                <h3 className="text-lg font-bold text-[#003d37]">School Workshops</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#4c616c]">
                  We help schools introduce AI, coding, and digital skills through workshops, clubs, assemblies, and after-school programmes that feel practical rather than theoretical.
                </p>
              </div>
              <div className="mx-auto w-full max-w-[min(19rem,calc(100vw-2.5rem))] rounded-2xl border border-[#c3c6d4]/20 bg-white p-4 shadow-sm md:p-5 lg:mx-0 lg:max-w-full lg:p-6">
                <h3 className="text-lg font-bold text-[#003d37]">Teacher Support</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#4c616c]">
                  We support school teams with ready-to-run session outlines, project ideas, and practical delivery support so teachers can keep the programme alive after the first visit.
                </p>
              </div>
              <div className="mx-auto w-full max-w-[min(19rem,calc(100vw-2.5rem))] rounded-2xl border border-[#c3c6d4]/20 bg-white p-4 shadow-sm sm:col-span-2 md:p-5 lg:mx-0 lg:max-w-full lg:p-6">
                <h3 className="text-lg font-bold text-[#003d37]">Student Pathways</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#4c616c]">
                  Students can move from school exposure into the full Academy bootcamp, keeping their project work, community access, and long-term learning path connected to KoreField.
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
            <div className="mx-auto mt-8 grid max-w-4xl grid-cols-2 gap-2.5 sm:mt-12 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5">
              {(
                [
                  { name: "Python", src: "/images/tools/python.svg", hideLabel: true },
                  { name: "PyTorch", src: "/images/tools/pytorch.png" },
                  { name: "LangChain", src: "/images/tools/langchain.png" },
                  { name: "LangGraph", src: "/images/tools/langgraph.png" },
                  { name: "Supabase" },
                  { name: "Docker", src: "/images/tools/docker.png" },
                ] as const
              ).map((tool) => (
                  <div
                    key={tool.name}
                    className="rounded-2xl border border-[#c3c6d4]/20 bg-white p-3 text-center shadow-sm sm:p-3.5"
                  >
                  <div className={`flex h-14 items-center justify-center sm:h-16 ${tool.name === "Python" ? "pt-0.5" : ""}`}>
                    {"src" in tool ? (
                      <Image
                        src={tool.src}
                        alt={tool.name}
                        width={160}
                        height={56}
                        className={tool.name === "Python" ? "h-11 w-auto object-contain sm:h-12" : "h-10 w-auto object-contain sm:h-11"}
                        loading="lazy"
                        unoptimized
                      />
                    ) : (
                      <span className="rounded-xl bg-[#003d37] px-3 py-2 text-sm font-black tracking-tight text-white">Supa</span>
                    )}
                  </div>
                  {!("hideLabel" in tool && tool.hideLabel) && (
                    <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#4c616c]">{tool.name}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="learning-model" className="scroll-mt-24 bg-[#f4faff] px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-4xl gap-10 lg:max-w-5xl lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#003662]">Learning Model</p>
              <h2 className="mt-2 font-sans text-3xl font-extrabold tracking-tight text-[#111d23] sm:text-4xl">From AI awareness to working systems</h2>
              <div className="mt-8 grid gap-3 sm:grid-cols-2 sm:gap-4">
                {outcomes.map((outcome) => {
                  const LearningIcon = outcome.icon;
                  return (
                    <div
                      key={outcome.title}
                      className="mx-auto w-full max-w-[min(19rem,calc(100vw-2.5rem))] rounded-2xl border border-[#c3c6d4]/20 bg-[#e9f6fd] p-4 shadow-sm md:p-5 lg:mx-0 lg:max-w-full lg:p-6"
                    >
                      <LearningIcon className="size-6 text-[#003d37]" />
                      <h3 className="mt-4 text-base font-bold text-[#111d23] sm:text-lg">{outcome.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-[#4c616c]">{outcome.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
            <aside className="mx-auto flex w-full max-w-[min(20.5rem,calc(100vw-2.5rem))] flex-col items-center rounded-3xl border border-[#c3c6d4]/25 bg-[#e9f6fd] p-4 text-center shadow-sm md:p-6 lg:mx-0 lg:max-w-none lg:self-stretch lg:p-8">
              <div className="w-full">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#003d37]">Student Bootcamp</p>
                <p className="mt-4 font-sans text-4xl font-extrabold text-[#003d37] sm:text-5xl">{"\u20A6"}180,000</p>
                <p className="mt-2 text-sm text-[#4c616c]">Early Bird Price for the 8-week student pathway</p>
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
                  <div key={item} className="flex items-start justify-center gap-3 text-sm text-[#111d23]">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#003d37]" aria-hidden />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <a
                href={whatsappUrl}
                className="mt-6 inline-flex w-full max-w-[min(13.5rem,calc(100vw-3rem))] items-center justify-center rounded-lg bg-[#003d37] px-2.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#12554f] sm:mt-8 md:px-3 md:text-sm"
              >
                Enroll for Bootcamp
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
              Academy platform and program tracks under active development
            </div>
            <p className="mx-auto mt-5 max-w-3xl text-base leading-relaxed text-[#4c616c] sm:text-lg">
              KoreField Academy is expanding from its live student bootcamp into a wider talent-development platform for corporate AI training, NYSC acceleration, and professional sector tracks. Early cohorts run live while the full platform is completed, with AI-supported tutoring, structured feedback, and progress insight on the roadmap.
            </p>
          </div>
        </section>

        <section id="contact" className="scroll-mt-24 bg-white px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-4xl gap-6 sm:gap-8 lg:max-w-5xl lg:grid-cols-[0.92fr_1.08fr]">
            <div className="mx-auto w-full max-w-[min(22rem,calc(100vw-2.5rem))] rounded-2xl border border-[#c3c6d4]/20 bg-[#e3f0f8] p-4 shadow-sm md:p-6 lg:mx-0 lg:max-w-none lg:rounded-3xl lg:p-8 xl:p-10">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#003d37]">Join the Interest List</p>
              <h2 className="mt-3 font-sans text-2xl font-extrabold tracking-tight text-[#111d23] sm:text-4xl">Tell us which AI pathway fits you</h2>
              <p className="mt-4 text-base leading-relaxed text-[#4c616c] sm:text-lg">
                Register interest for corporate AI training, the NYSC AI Acceleration Program, professional/sector tracks, or the student bootcamp.
              </p>
              <div className="mt-5 space-y-3 sm:mt-6 sm:space-y-4">
                <div className="rounded-lg border border-[#c3c6d4]/15 bg-white p-3 sm:rounded-xl sm:p-4">
                  <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#4c616c] sm:mb-2 sm:text-[11px] sm:tracking-[0.16em]">Why Register Early</div>
                  <p className="text-sm leading-relaxed text-[#434652]">Help KoreField route you to the right practical AI education pathway as each track opens.</p>
                </div>
                <div className="rounded-lg border border-[#c3c6d4]/15 bg-white p-3 sm:rounded-xl sm:p-4">
                  <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#4c616c] sm:mb-2 sm:text-[11px] sm:tracking-[0.16em]">What You Receive</div>
                  <p className="text-sm leading-relaxed text-[#434652]">Program updates, curriculum previews, corporate training conversations, and student early-bird offers.</p>
                </div>
              </div>
            </div>
            <div className="mx-auto w-full max-w-[min(22rem,calc(100vw-2.5rem))] rounded-2xl border border-[#c3c6d4]/20 bg-[#f7fbfd] p-3.5 shadow-sm md:p-6 lg:mx-0 lg:max-w-none lg:rounded-3xl lg:p-8">
              <ComingSoonWaitlistForm />
            </div>
          </div>
        </section>

        <section className="bg-[#003d37] px-4 py-16 text-center text-white sm:px-6 lg:px-8">
          <h2 className="font-sans text-4xl font-extrabold tracking-tight sm:text-5xl">Ready to build practical AI capability?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#8bc8bf] sm:text-lg">
            Talk to KoreField Academy about corporate AI training, the NYSC AI Acceleration Program, sector tracks, or the student AI bootcamp.
          </p>
          <div className="mx-auto mt-8 flex w-full max-w-[min(15rem,calc(100vw-2.5rem))] flex-col items-stretch justify-center gap-2 self-center md:max-w-xl md:flex-row md:items-center md:justify-center md:gap-3">
            <a href={whatsappUrl} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white px-2.5 py-2 text-xs font-semibold text-[#003d37] transition-colors hover:bg-[#eaf4f7] sm:gap-2 sm:px-3 sm:text-sm">
              <MessageSquare className="size-4 shrink-0 sm:size-5" />
              Discuss a Program
            </a>
            <a href="https://korefield.com/" className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/30 px-2.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/10 sm:gap-2 sm:px-3 sm:text-sm">
              <Phone className="size-4 shrink-0 sm:size-5" />
              Visit KoreField
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#c3c6d4]/35 bg-[#e9f6fd] px-4 py-16 text-[#434652] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl lg:max-w-5xl">
          <div className="mb-12 grid grid-cols-1 gap-10 text-center md:grid-cols-12 md:text-left">
            <div className="md:col-span-5">
              <Link href="/" className="mx-auto mb-5 inline-flex items-center justify-center gap-3 md:mx-0 md:justify-start">
                <Image src="/logo.svg" alt="KoreField Logo" width={72} height={72} className="h-14 w-auto sm:h-16" />
                <span className="flex flex-col leading-none">
                  <span className="text-xl font-extrabold tracking-tight text-[#003d37]">KoreField Academy</span>
                </span>
              </Link>
              <p className="mx-auto max-w-sm text-sm leading-relaxed text-[#4c616c] md:mx-0">
                KoreField Academy is the flagship talent arm of KoreField, connecting practical AI education to the same engineering standards as our enterprise AI practice.
              </p>
            </div>

            <div className="md:col-span-3">
              <h4 className="mb-5 text-sm font-bold uppercase tracking-widest text-[#111d23]">Connect</h4>
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
              <ul className="space-y-2.5 text-sm font-medium text-[#4c616c]">
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
            </div>

            <div className="md:col-span-2">
              <h4 className="mb-5 text-sm font-bold uppercase tracking-widest text-[#111d23]">Ecosystem</h4>
              <ul className="space-y-2.5 text-sm font-medium text-[#4c616c]">
                <li>
                  <a className="transition-colors hover:text-[#003d37]" href="#programs">
                    Academy Programs
                  </a>
                </li>
                <li>
                  <a className="transition-colors hover:text-[#003d37]" href="https://korefield.com/">
                    KoreField.com
                  </a>
                </li>
                <li>
                  <a className="transition-colors hover:text-[#003d37]" href="https://korefield.com/about">
                    About Us
                  </a>
                </li>
                <li>
                  <a className="transition-colors hover:text-[#003d37]" href="https://korefield.com/use-cases">
                    Solutions
                  </a>
                </li>
                <li>
                  <a className="transition-colors hover:text-[#003d37]" href="https://korefield.com/contact">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            <div className="md:col-span-2">
              <h4 className="mb-5 text-sm font-bold uppercase tracking-widest text-[#111d23]">Academy</h4>
              <ul className="space-y-2.5 text-sm font-medium text-[#4c616c]">
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
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="/learner/login" className="transition-colors hover:text-[#003d37]">
                    Learner login
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col gap-6 border-t border-[#c3c6d4]/35 pt-8 text-center md:flex-row md:items-center md:justify-between md:text-left">
            <div className="max-w-md md:max-w-md">
              <p className="mb-1 text-sm font-bold text-[#111d23]">© {new Date().getFullYear()} KoreField Energy &amp; Technology Ltd (KETL).</p>
              <p className="text-xs leading-relaxed text-[#4c616c]">
                This site: academy.korefield.com · Visit the main KoreField agency site at korefield.com.
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
              <Link className="transition-colors hover:text-[#003d37]" href="/cookies">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
