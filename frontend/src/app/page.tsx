import type { Metadata } from "next";
import Image from "next/image";
import { CalendarDays, CheckCircle2, Flame, Mail, Menu, MessageSquare, Phone, Rocket, School, Users, Video, X } from "lucide-react";
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
  { href: "#instructor", label: "Instructor" },
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
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="https://korefield.com" className="font-sans text-xl font-black tracking-tight text-[#003d37]">
            KoreField Academy
          </a>

          <div className="hidden items-center gap-8 text-sm md:flex">
            {navLinks.map((link) => (
              <NavLink key={link.label} href={link.href} label={link.label} active={link.active} />
            ))}
          </div>

          <a
            href={whatsappUrl}
            className="hidden rounded-lg bg-[#003d37] px-4 py-2 text-sm font-bold tracking-tight text-white transition-colors hover:bg-[#12554f] md:inline-flex"
          >
            Enroll Now
          </a>

          <details className="group relative md:hidden">
            <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-full border border-[#003d37]/15 bg-white/80 text-[#003d37] [&::-webkit-details-marker]:hidden">
              <Menu className="size-5 group-open:hidden" />
              <X className="hidden size-5 group-open:block" />
            </summary>
            <div className="absolute right-0 top-14 w-[min(88vw,22rem)] rounded-3xl border border-[#c3c6d4]/60 bg-[#f4faff] p-5 shadow-2xl">
              <div className="mb-6 text-lg font-black tracking-tight text-[#003d37]">Academy Menu</div>
              <div className="flex flex-col gap-5 text-xl font-bold">
                {navLinks.map((link) => (
                  <NavLink key={link.label} href={link.href} label={link.label} active={link.active} />
                ))}
              </div>
              <a
                href={whatsappUrl}
                className="mt-8 inline-flex w-full items-center justify-center rounded-lg bg-[#003d37] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#12554f]"
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
          <div className="relative mx-auto max-w-6xl text-center">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#003d37]/15 bg-[#dceef3] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.18em] text-[#003d37]">
              <Flame className="size-4" />
              AI Holiday Bootcamp Now Enrolling
            </div>
            <h1 className="font-sans text-5xl font-extrabold leading-none tracking-tight text-[#003d37] sm:text-6xl lg:text-7xl">
              KoreField Academy
            </h1>
            <p className="mt-6 font-sans text-2xl font-bold tracking-tight text-[#111d23] sm:text-3xl">
              Build real AI systems, not just theory.
            </p>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-relaxed text-[#4c616c]">
              An intensive 8-week bootcamp designed for senior secondary students who want to learn Python, build AI agents, and work on real-world projects, led by a practising AI Engineer and Data Scientist.
            </p>
            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              <a href={whatsappUrl} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#003d37] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#12554f]">
                <MessageSquare className="size-5" />
                Enroll via WhatsApp
              </a>
              <a href="#waitlist" className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#cfe6f2] px-4 py-2.5 text-sm font-semibold text-[#003d37] transition-colors hover:bg-[#bdd8e6]">
                <Mail className="size-5" />
                Join Waitlist
              </a>
            </div>
            <p className="mt-8 text-sm text-[#434652]">
              <span className="font-bold text-[#003d37]">{"\u20A6"}180,000</span> Early Bird Price · Limited Slots
            </p>
          </div>
        </section>

        <section id="program" className="border-y border-[#c3c6d4]/35 bg-white px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#003d37]">Program Overview</p>
              <h2 className="mt-2 font-sans text-3xl font-extrabold tracking-tight text-[#111d23] sm:text-4xl">What You&apos;re Signing Up For</h2>
            </div>
            <div className="mt-8 grid gap-3 sm:mt-10 sm:grid-cols-2 lg:grid-cols-4">
              {overview.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex min-h-[6.5rem] flex-col justify-center rounded-2xl border border-[#c3c6d4]/20 bg-[#f7fbfd] p-4 text-center shadow-sm sm:min-h-[7rem] sm:p-5">
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

        <section id="academy-philosophy" className="bg-[#e9f6fd] px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div className="text-center lg:text-left">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#003d37]">About the Academy</p>
              <h2 className="mt-2 font-sans text-3xl font-extrabold tracking-tight text-[#111d23] sm:text-4xl">A practical path into tech that does not break the bank</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#c3c6d4]/20 bg-white p-5 shadow-sm sm:p-6">
                <h3 className="text-lg font-bold text-[#003d37]">Affordable by Design</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#4c616c]">
                  KoreField Academy exists for families who want serious tech education without paying luxury-school prices. We keep the offer focused: live teaching, real projects, mentorship, and a clear learning path.
                </p>
              </div>
              <div className="rounded-2xl border border-[#c3c6d4]/20 bg-white p-5 shadow-sm sm:p-6">
                <h3 className="text-lg font-bold text-[#003d37]">Job-Ready Thinking</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#4c616c]">
                  Our philosophy is simple: students should learn skills that can grow into internships, freelance work, scholarships, and future jobs. The goal is not just to finish lessons, but to build confidence with tools used in the real world.
                </p>
              </div>
              <div className="rounded-2xl border border-[#c3c6d4]/20 bg-white p-5 shadow-sm sm:col-span-2 sm:p-6">
                <h3 className="text-lg font-bold text-[#003d37]">Talent First, Platform Next</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#4c616c]">
                  While the full LMS is being completed, this first cohort runs live via Google Meet so students can begin now. Early learners will move into the platform when it launches, carrying their project work and community access with them.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#f4faff] px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#003662]">What You&apos;ll Learn</p>
              <h2 className="mt-2 font-sans text-3xl font-extrabold tracking-tight text-[#111d23] sm:text-4xl">Skills That Actually Matter</h2>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {outcomes.map(([title, description]) => (
                  <div key={title} className="rounded-2xl border border-[#c3c6d4]/20 bg-[#e9f6fd] p-5 shadow-sm sm:p-6">
                    <Rocket className="size-6 text-[#003d37]" />
                    <h3 className="mt-4 text-base font-bold text-[#111d23] sm:text-lg">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#4c616c]">{description}</p>
                  </div>
                ))}
              </div>
            </div>
            <aside className="rounded-3xl border border-[#c3c6d4]/25 bg-[#e9f6fd] p-6 shadow-sm sm:p-8">
              <div className="text-center">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#003d37]">Investment</p>
                <p className="mt-4 font-sans text-4xl font-extrabold text-[#003d37] sm:text-5xl">{"\u20A6"}180,000</p>
                <p className="mt-2 text-sm text-[#4c616c]">Early Bird Price</p>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-2 sm:gap-3">
                <div className="flex min-h-[4.5rem] flex-col justify-center rounded-2xl border border-[#c3c6d4]/15 bg-white p-3 text-center sm:min-h-[5.25rem] sm:p-4">
                  <div className="text-lg font-extrabold text-[#003d37]">8</div>
                  <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#4c616c]">Weeks</div>
                </div>
                <div className="flex min-h-[4.5rem] flex-col justify-center rounded-2xl border border-[#c3c6d4]/15 bg-white p-3 text-center sm:min-h-[5.25rem] sm:p-4">
                  <div className="text-lg font-extrabold text-[#003d37]">12</div>
                  <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#4c616c]">Sessions</div>
                </div>
                <div className="flex min-h-[4.5rem] flex-col justify-center rounded-2xl border border-[#c3c6d4]/15 bg-white p-3 text-center sm:min-h-[5.25rem] sm:p-4">
                  <div className="text-lg font-extrabold text-[#003d37]">Live</div>
                  <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#4c616c]">Mentoring</div>
                </div>
              </div>
              <div className="mt-8 space-y-4">
                {included.map((item) => (
                  <div key={item} className="flex gap-3 text-sm text-[#111d23]">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#003d37]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <a href={whatsappUrl} className="mt-8 inline-flex w-full items-center justify-center rounded-lg bg-[#003d37] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#12554f]">
                Enroll Now
              </a>
            </aside>
          </div>
        </section>

        <section id="instructor" className="bg-[#d7e4ec] px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#003d37]">Your Instructor</p>
            <div className="mx-auto mt-8 max-w-2xl rounded-3xl border border-[#c3c6d4]/20 bg-white p-5 shadow-sm sm:p-10">
              <div className="mx-auto mb-6 w-full max-w-[16rem] overflow-hidden rounded-3xl border border-[#003d37]/10 bg-[#d7e4ec] p-2 shadow-lg shadow-[#111d23]/10 sm:max-w-[18rem]">
                <div className="relative aspect-square overflow-hidden rounded-[1.25rem]">
                  <Image
                    src="/images/martin-tay-instructor.png"
                    alt="Martin K. Tay, Founder and Lead Engineer of KoreField"
                    fill
                    sizes="(min-width: 640px) 18rem, 82vw"
                    className="object-cover object-[50%_28%]"
                    priority
                  />
                </div>
              </div>
              <h3 className="font-sans text-2xl font-bold text-[#003d37]">Martin K. Tay</h3>
              <p className="mt-2 text-sm font-bold uppercase tracking-[0.16em] text-[#4c616c]">Founder and Lead Engineer, KoreField</p>
              <p className="mt-4 text-base leading-relaxed text-[#434652] sm:text-lg">
                Martin is a Computer Engineer trained in the Russian Federation with an MSc in Data Science and Computational Intelligence from the UK. Across more than 8 years of professional experience spanning Oil and Gas, finance, enterprise operations, and applied AI delivery, he brings practical engineering judgment to every session.
              </p>
            </div>
          </div>
        </section>

        <section id="team" className="bg-white px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#003d37]">Academy Team</p>
              <h2 className="mt-2 font-sans text-4xl font-extrabold tracking-tight text-[#111d23]">Built by practitioners who care about access</h2>
              <p className="mt-4 text-base leading-relaxed text-[#4c616c] sm:text-lg">
                The Academy is shaped by people who understand both professional technology delivery and the need to make quality tech education practical, affordable, and close to real opportunity.
              </p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-2">
              <article className="rounded-3xl border border-[#c3c6d4]/20 bg-[#f4faff] p-4 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                  <div className="mx-auto w-full max-w-[9.5rem] overflow-hidden rounded-2xl border border-[#003d37]/10 bg-[#d7e4ec] p-1.5 shadow-md shadow-[#111d23]/5 sm:mx-0 sm:max-w-[11rem]">
                    <div className="relative aspect-square overflow-hidden rounded-[0.95rem]">
                      <Image
                        src="/images/martin-tay-instructor.png"
                        alt="Martin K. Tay"
                        fill
                        sizes="11rem"
                        className="object-cover object-[50%_28%]"
                      />
                    </div>
                  </div>
                  <div className="text-left">
                    <h3 className="font-sans text-2xl font-bold text-[#003d37]">Martin K. Tay</h3>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-[#4c616c]">Founder and Lead Engineer</p>
                    <p className="mt-4 text-sm leading-relaxed text-[#434652]">
                      Leads the Academy curriculum, live instruction, and project-based learning model with 8+ years across engineering, data science, Oil and Gas, finance, enterprise operations, and applied AI.
                    </p>
                  </div>
                </div>
              </article>

              <article className="rounded-3xl border border-[#c3c6d4]/20 bg-[#f4faff] p-4 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                  <div className="mx-auto flex aspect-square w-full max-w-[9.5rem] items-center justify-center rounded-2xl border border-[#003d37]/10 bg-[linear-gradient(145deg,#d7e4ec,#f7fbfd)] p-1.5 shadow-md shadow-[#111d23]/5 sm:mx-0 sm:max-w-[11rem]">
                    <div className="flex h-full w-full items-center justify-center rounded-[0.95rem] bg-white/70 font-sans text-4xl font-extrabold text-[#003d37]">
                      NA
                    </div>
                  </div>
                  <div className="text-left">
                    <h3 className="font-sans text-2xl font-bold text-[#003d37]">Ngo Alalibo</h3>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-[#4c616c]">Technical Partner</p>
                    <p className="mt-4 text-sm leading-relaxed text-[#434652]">
                      Brings a wealth of software engineering experience across fintech and edtech, supporting the Academy&apos;s technical direction, platform roadmap, and learner support systems with real-world delivery standards.
                    </p>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="border-y border-[#c3c6d4]/35 bg-[#e9f6fd] px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex rounded-full border border-[#003d37]/12 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#4c616c]">
              Full LMS Platform Under Development
            </div>
            <p className="mx-auto mt-5 max-w-3xl text-base leading-relaxed text-[#4c616c] sm:text-lg">
              The full KoreField Academy learning platform is currently being built. This inaugural cohort will run live via Google Meet while the platform is completed. Early students will receive access to the full platform when it launches.
            </p>
          </div>
        </section>

        <section id="waitlist" className="bg-white px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="rounded-3xl border border-[#c3c6d4]/20 bg-[#e3f0f8] p-6 shadow-sm sm:p-10">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#003d37]">Join the Waitlist</p>
              <h2 className="mt-3 font-sans text-2xl font-extrabold tracking-tight text-[#111d23] sm:text-4xl">Get notified about enrollment updates</h2>
              <p className="mt-4 text-base leading-relaxed text-[#4c616c] sm:text-lg">
                Join the list for enrollment updates, curriculum previews, and early-bird offers.
              </p>
              <div className="mt-6 space-y-4">
                <div className="rounded-xl border border-[#c3c6d4]/15 bg-white p-4">
                  <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#4c616c]">Why Join Early</div>
                  <p className="text-sm leading-relaxed text-[#434652]">Secure early access to updates while the Academy platform and inaugural cohort are being finalized.</p>
                </div>
                <div className="rounded-xl border border-[#c3c6d4]/15 bg-white p-4">
                  <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#4c616c]">What You Receive</div>
                  <p className="text-sm leading-relaxed text-[#434652]">Enrollment updates, curriculum previews, and early-bird offers only.</p>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-[#c3c6d4]/20 bg-[#f7fbfd] p-4 shadow-sm sm:p-8">
              <ComingSoonWaitlistForm />
            </div>
          </div>
        </section>

        <section className="bg-[#003d37] px-4 py-16 text-center text-white sm:px-6 lg:px-8">
          <h2 className="font-sans text-4xl font-extrabold tracking-tight sm:text-5xl">Ready to Start Your AI Journey?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#8bc8bf] sm:text-lg">
            Limited spots available. Learn from a practising AI engineer while the full Academy platform is being prepared.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href={whatsappUrl} className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-[#003d37] transition-colors hover:bg-[#eaf4f7]">
              <MessageSquare className="size-5" />
              WhatsApp Us
            </a>
            <a href="tel:+2347033075594" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10">
              <Phone className="size-5" />
              +234 703 307 5594
            </a>
          </div>
        </section>
      </main>

      <footer className="bg-[#031817] px-4 py-8 text-white/75 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <div>
            <p className="text-sm font-semibold text-white">KoreField Academy</p>
            <p className="text-xs">KoreField Academy is under active development.</p>
          </div>
          <p className="text-xs">Lagos, Nigeria · academy.korefield.com</p>
        </div>
      </footer>
    </div>
  );
}



