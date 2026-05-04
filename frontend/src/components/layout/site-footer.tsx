/**
 * @file site-footer.tsx
 * Public pages (not `/`, not portals): KETL block, Academy anchors to home,
 * Expertise (KETL services), Ecosystem, Connect, legal row.
 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mail, MapPin, MessageSquare } from "lucide-react";

const PORTAL_PREFIXES = ["/learner", "/instructor", "/admin", "/super-admin", "/corporate"];

export function SiteFooter() {
  const pathname = usePathname();
  const isPortal = PORTAL_PREFIXES.some((p) => pathname.startsWith(p));
  if (pathname === "/") return null;
  if (isPortal) return null;

  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-surface-200 bg-surface-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-12 grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <p className="text-xl font-extrabold tracking-tight text-brand-700">KoreField Energy &amp; Technology (KETL)</p>
            <p className="mt-3 max-w-sm text-body-sm leading-relaxed text-surface-600">
              KoreField Academy—programs and platform under active development—aligned with the same engineering standards as our enterprise practice.
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm font-bold text-brand-700">
              <MapPin className="size-4 shrink-0" aria-hidden />
              <span>Lagos, Nigeria</span>
            </div>
            <p className="mt-1 max-w-sm pl-6 text-xs font-medium leading-relaxed text-surface-500">
              <span className="text-surface-400">This site:</span>{" "}
              <span className="text-surface-600">academy.korefield.com</span>
              <span className="mx-2 text-surface-300" aria-hidden>
                ·
              </span>
              <a href="https://korefield.com/" className="font-bold text-brand-700 hover:underline">
                korefield.com
              </a>
            </p>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-xs font-bold uppercase tracking-widest text-surface-900">Academy</h4>
            <p className="mb-3 mt-1 text-[10px] font-bold uppercase tracking-wider text-surface-400">Bootcamp &amp; LMS</p>
            <ul className="space-y-2.5 text-body-sm font-medium text-surface-600">
              <li>
                <Link href="/#program" className="transition-colors hover:text-brand-600">
                  Program overview
                </Link>
              </li>
              <li>
                <Link href="/#academy-philosophy" className="transition-colors hover:text-brand-600">
                  Philosophy &amp; approach
                </Link>
              </li>
              <li>
                <Link href="/#outcomes" className="transition-colors hover:text-brand-600">
                  Skills &amp; outcomes
                </Link>
              </li>
              <li>
                <Link href="/#industry-tools" className="transition-colors hover:text-brand-600">
                  Tools we teach
                </Link>
              </li>
              <li>
                <Link href="/#team" className="transition-colors hover:text-brand-600">
                  Academy team
                </Link>
              </li>
              <li>
                <Link href="/#waitlist" className="transition-colors hover:text-brand-600">
                  Join waitlist
                </Link>
              </li>
            </ul>
            <p className="mb-2 mt-6 text-[10px] font-bold uppercase tracking-wider text-surface-400">On this site</p>
            <ul className="space-y-2 text-xs font-medium text-surface-500">
              <li>
                <Link href="/pricing" className="transition-colors hover:text-brand-600">
                  Pricing &amp; enrollment
                </Link>
              </li>
              <li>
                <Link href="/team" className="transition-colors hover:text-brand-600">
                  Team page
                </Link>
              </li>
              <li>
                <Link href="/careers" className="transition-colors hover:text-brand-600">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/learner/login" className="transition-colors hover:text-brand-600">
                  Learner login
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-xs font-bold uppercase tracking-widest text-surface-900">Expertise</h4>
            <p className="mb-3 mt-1 text-[10px] font-bold uppercase tracking-wider text-surface-400">KETL enterprise practice</p>
            <ul className="space-y-2.5 text-body-sm font-medium text-surface-600">
              <li>
                <a className="transition-colors hover:text-brand-600" href="https://korefield.com/services">
                  Enterprise AI
                </a>
              </li>
              <li>
                <a className="transition-colors hover:text-brand-600" href="https://korefield.com/services">
                  Automation
                </a>
              </li>
              <li>
                <a className="transition-colors hover:text-brand-600" href="https://korefield.com/services">
                  Data Strategy
                </a>
              </li>
              <li>
                <a className="transition-colors hover:text-brand-600" href="https://korefield.com/services">
                  Integration
                </a>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-xs font-bold uppercase tracking-widest text-surface-900">Ecosystem</h4>
            <ul className="mt-4 space-y-2.5 text-body-sm font-medium text-surface-600">
              <li>
                <Link href="/" className="transition-colors hover:text-brand-600">
                  KoreField Academy
                </Link>
              </li>
              <li>
                <a className="transition-colors hover:text-brand-600" href="https://korefield.com/about">
                  About Us
                </a>
              </li>
              <li>
                <a className="transition-colors hover:text-brand-600" href="https://korefield.com/use-cases">
                  Solutions
                </a>
              </li>
              <li>
                <a className="transition-colors hover:text-brand-600" href="https://korefield.com/contact">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-xs font-bold uppercase tracking-widest text-surface-900">Connect</h4>
            <div className="mt-4 flex gap-3">
              <a
                className="flex size-10 items-center justify-center rounded-full bg-surface-200 text-surface-700 transition-all hover:bg-brand-600 hover:text-white"
                href="https://wa.me/2347033075594"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp +234 703 307 5594"
              >
                <MessageSquare className="size-4" />
              </a>
              <a
                className="flex size-10 items-center justify-center rounded-full bg-surface-200 text-surface-700 transition-all hover:bg-brand-600 hover:text-white"
                href="mailto:enquiry@korefield.com"
                aria-label="Email enquiry@korefield.com"
              >
                <Mail className="size-4" />
              </a>
            </div>
            <ul className="mt-4 space-y-2 text-body-sm text-surface-600">
              <li>
                <a className="transition-colors hover:text-brand-600" href="https://wa.me/2347033075594" target="_blank" rel="noopener noreferrer">
                  WhatsApp +234 703 307 5594
                </a>
              </li>
              <li>
                <a className="transition-colors hover:text-brand-600" href="mailto:enquiry@korefield.com">
                  enquiry@korefield.com
                </a>
              </li>
            </ul>
            <p className="mt-4 text-[10px] uppercase tracking-tighter text-surface-400">
              Network Status: <span className="font-bold text-emerald-600">Operational</span>
            </p>
            <p className="mt-5 text-[10px] font-bold uppercase tracking-wider text-surface-400">Academy policies</p>
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-surface-500">
              <li>
                <Link href="/privacy" className="hover:text-brand-600">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-brand-600">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-brand-600">
                  Cookies
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-6 border-t border-surface-200 pt-8 md:flex-row md:items-center md:justify-between">
          <div className="max-w-md">
            <p className="text-sm font-bold text-surface-900">
              © {year} KoreField Energy &amp; Technology Ltd (KETL).
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-widest text-surface-400">
              32 Oye Elegunde Street, Beckley Estate, U-Turn Bus Stop, Lagos State, Nigeria.
            </p>
          </div>
          <div className="flex flex-wrap gap-6 text-[10px] font-bold uppercase tracking-widest text-surface-500">
            <a className="transition-colors hover:text-brand-600" href="https://korefield.com/legal">
              Privacy Policy
            </a>
            <a className="transition-colors hover:text-brand-600" href="https://korefield.com/legal">
              Terms of Service
            </a>
            <a className="transition-colors hover:text-brand-600" href="https://korefield.com/legal">
              Security
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
