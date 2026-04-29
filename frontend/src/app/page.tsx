import type { Metadata } from "next";
import { CalendarDays, CheckCircle2, Flame, Mail, MessageSquare, Rocket, School, Users, Video } from "lucide-react";
import { ComingSoonWaitlistForm } from "@/components/waitlist/coming-soon-waitlist-form";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "KoreField Academy | AI Holiday Bootcamp",
  description: "Join the KoreField Academy waitlist for the AI Holiday Bootcamp for senior secondary students.",
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

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f2f8fb] text-[#073f3a]">
      <nav className="sticky top-0 z-50 border-b border-[#d8e7ec] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="https://korefield.com" className="text-heading-sm font-bold text-[#06463f]">
            KETL
          </a>
          <div className="hidden items-center gap-8 text-body-sm font-semibold text-surface-600 md:flex">
            <a href="https://korefield.com" className="hover:text-[#06463f]">Home</a>
            <a href="#waitlist" className="text-[#06463f] underline underline-offset-8">KoreField Academy</a>
            <a href="https://korefield.com/services" className="hover:text-[#06463f]">Services</a>
            <a href="https://korefield.com/about" className="hover:text-[#06463f]">About Us</a>
            <a href="https://korefield.com/contact" className="hover:text-[#06463f]">Contact</a>
          </div>
          <a href={whatsappUrl} className={cn(buttonVariants({ size: "sm" }), "bg-[#06463f] px-5 text-white hover:bg-[#053832]")}>
            Enroll Now
          </a>
        </div>
      </nav>

      <main>
        <section className="px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
          <div className="mx-auto max-w-5xl text-center">
            <Badge variant="outline" className="mb-8 rounded-full border-[#b8d3d8] bg-[#dceef3] px-5 py-2 text-[#44706d]">
              <Flame className="mr-2 size-4" />
              AI Holiday Bootcamp Now Enrolling
            </Badge>
            <h1 className="text-[3rem] font-bold leading-none text-[#06463f] sm:text-[4.25rem]">
              KoreField Academy
            </h1>
            <p className="mt-8 text-heading-sm text-surface-950">
              Build real AI systems, <span className="text-[#06463f]">not just theory.</span>
            </p>
            <p className="mx-auto mt-5 max-w-3xl text-body-lg text-surface-600 sm:text-lg">
              An intensive 8-week bootcamp designed for senior secondary students who want to learn Python, build AI agents, and work on real-world projects, led by a practising AI Engineer and Data Scientist.
            </p>
            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
              <a href={whatsappUrl} className={cn(buttonVariants({ size: "lg" }), "h-14 bg-[#06463f] px-8 text-base text-white shadow-lg hover:bg-[#053832]")}>
                <MessageSquare className="size-5" />
                Enroll via WhatsApp
              </a>
              <a href="#waitlist" className={cn(buttonVariants({ size: "lg", variant: "secondary" }), "h-14 bg-[#c9e2ee] px-8 text-base text-[#073f3a] hover:bg-[#bdd9e6]")}>
                <Mail className="size-5" />
                Join Waitlist
              </a>
            </div>
            <p className="mt-8 text-body-sm text-surface-700">
              <span className="font-bold text-[#06463f]">N180,000</span> Early Bird Price · Limited Slots
            </p>
          </div>
        </section>

        <section className="border-y border-[#d8e7ec] bg-white px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="text-center">
              <p className="text-body-sm font-semibold uppercase text-[#4b7774]">Program Overview</p>
              <h2 className="mt-2 text-display-sm text-surface-950">What You&apos;re Signing Up For</h2>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {overview.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-lg border border-[#d8e7ec] bg-[#f7fbfd] p-6 text-center shadow-sm">
                    <Icon className="mx-auto size-7 text-[#06463f]" />
                    <p className="mt-4 text-display-sm text-[#06463f]">{item.value}</p>
                    <p className="text-body-sm font-semibold text-surface-700">{item.label}</p>
                    <p className="text-caption text-surface-500">{item.detail}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-[#f2f8fb] px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.8fr]">
            <div>
              <p className="text-body-sm font-semibold uppercase text-[#4b7774]">What You&apos;ll Learn</p>
              <h2 className="mt-2 text-display-sm text-surface-950">Skills That Actually Matter</h2>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {outcomes.map(([title, description]) => (
                  <div key={title} className="rounded-lg border border-[#d8e7ec] bg-white p-6 shadow-sm">
                    <Rocket className="size-6 text-[#06463f]" />
                    <h3 className="mt-4 text-heading-sm text-surface-950">{title}</h3>
                    <p className="mt-2 text-body-sm text-surface-600">{description}</p>
                  </div>
                ))}
              </div>
            </div>
            <aside className="rounded-lg border border-[#d8e7ec] bg-white p-6 shadow-sm">
              <p className="text-body-sm font-semibold uppercase text-[#4b7774]">Investment</p>
              <p className="mt-3 text-display-sm text-[#06463f]">N180,000</p>
              <p className="text-body-sm text-surface-500">Early Bird Price</p>
              <div className="mt-6 space-y-3">
                {included.map((item) => (
                  <div key={item} className="flex gap-3 text-body-sm text-surface-700">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-status-success" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <a href={whatsappUrl} className={cn(buttonVariants({ size: "lg" }), "mt-8 w-full bg-[#06463f] text-white hover:bg-[#053832]")}>
                Enroll Now
              </a>
            </aside>
          </div>
        </section>

        <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.75fr_1.25fr]">
            <div>
              <p className="text-body-sm font-semibold uppercase text-[#4b7774]">Your Instructor</p>
              <h2 className="mt-2 text-display-sm text-surface-950">Led by an AI Engineer and Data Scientist</h2>
            </div>
            <div className="rounded-lg border border-[#d8e7ec] bg-[#f7fbfd] p-6">
              <h3 className="text-heading-lg text-[#06463f]">Martin K. Tay</h3>
              <p className="mt-1 text-body-sm font-semibold text-surface-700">Founder and Lead Engineer, KoreField</p>
              <p className="mt-4 text-body-lg text-surface-600">
                With professional experience deploying AI systems for enterprise clients across energy, finance, and operations, Martin brings real-world engineering expertise to every session. This is practical, industry-grade AI education.
              </p>
            </div>
          </div>
        </section>

        <section className="border-y border-[#d8e7ec] bg-[#edf6f8] px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="outline" className="border-[#b8d3d8] bg-white text-[#4b7774]">
              Full LMS Platform Under Development
            </Badge>
            <p className="mt-5 text-body-lg text-surface-700">
              The full KoreField Academy learning platform is currently being built. This inaugural cohort will run live via Google Meet while the platform is completed. Early students will receive access to the full platform when it launches.
            </p>
          </div>
        </section>

        <section id="waitlist" className="bg-white px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <Badge variant="secondary" className="bg-[#dceef3] text-[#06463f]">
                Join the Waitlist
              </Badge>
              <h2 className="mt-4 text-display-sm text-surface-950">Get notified about enrollment updates</h2>
              <p className="mt-4 max-w-xl text-body-lg leading-relaxed text-surface-600">
                Join the list for enrollment updates, curriculum previews, and early-bird offers.
              </p>
            </div>
            <div className="rounded-lg border border-[#d8e7ec] bg-[#f7fbfd] p-5 shadow-sm sm:p-6">
              <ComingSoonWaitlistForm />
            </div>
          </div>
        </section>

        <section className="bg-[#06463f] px-4 py-14 text-center text-white sm:px-6 lg:px-8">
          <h2 className="text-display-sm">Ready to Start Your AI Journey?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-body-lg text-white/80">
            Limited spots available. Learn from a practising AI engineer while the full Academy platform is being prepared.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a href={whatsappUrl} className={cn(buttonVariants({ size: "lg" }), "bg-white text-[#06463f] hover:bg-[#eaf4f7]")}>
              <MessageSquare className="size-5" />
              WhatsApp Us
            </a>
            <a href="tel:+2347033075594" className="text-body-lg font-semibold text-white">
              +234 703 307 5594
            </a>
          </div>
        </section>
      </main>

      <footer className="bg-[#031817] px-4 py-8 text-white/75 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <div>
            <p className="text-body-sm font-semibold text-white">KoreField Energy & Technology Ltd (KETL)</p>
            <p className="text-caption">KoreField Academy is under active development.</p>
          </div>
          <p className="text-caption">Lagos, Nigeria · academy.korefield.com</p>
        </div>
      </footer>
    </div>
  );
}
