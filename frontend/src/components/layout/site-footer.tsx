/**
 * @file site-footer.tsx
 * Public pages (not `/`, not portals): KoreField Academy branding, in-page anchors,
 * academy routes, enrollment contact, and on-site legal links only.
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
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:max-w-5xl lg:px-8">
        <div className="mb-12 grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <p className="text-xl font-extrabold tracking-tight text-brand-700">KoreField Academy</p>
            <p className="mt-3 max-w-sm text-body-sm leading-relaxed text-surface-600">
              Live bootcamps, learner support, and the Academy platform—focused on hands-on AI and engineering skills for students and lifelong learners.
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm font-bold text-brand-700">
              <MapPin className="size-4 shrink-0" aria-hidden />
              <span>Lagos, Nigeria</span>
            </div>
            <p className="mt-1 max-w-sm text-xs font-medium leading-relaxed text-surface-500">
              <span className="text-surface-400">Academy site</span>{" "}
              <span className="font-semibold text-surface-700">academy.korefield.com</span>
            </p>
          </div>

          <div className="md:col-span-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-surface-900">On this page</h4>
            <p className="mb-3 mt-1 text-[10px] font-bold uppercase tracking-wider text-surface-400">Program &amp; cohort</p>
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
          </div>

          <div className="md:col-span-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-surface-900">Academy</h4>
            <p className="mb-3 mt-1 text-[10px] font-bold uppercase tracking-wider text-surface-400">Pages on this site</p>
            <ul className="space-y-2.5 text-body-sm font-medium text-surface-600">
              <li>
                <Link href="/" className="transition-colors hover:text-brand-600">
                  Academy home
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="transition-colors hover:text-brand-600">
                  Pricing &amp; enrollment
                </Link>
              </li>
              <li>
                <Link href="/team" className="transition-colors hover:text-brand-600">
                  Team
                </Link>
              </li>
              <li>
                <Link href="/careers" className="transition-colors hover:text-brand-600">
                  Careers at the Academy
                </Link>
              </li>
              <li>
                <Link href="/learner/login" className="transition-colors hover:text-brand-600">
                  Learner login
                </Link>
              </li>
            </ul>
            <p className="mb-2 mt-6 text-[10px] font-bold uppercase tracking-wider text-surface-400">Policies</p>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-surface-500">
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

          <div className="md:col-span-2">
            <h4 className="text-xs font-bold uppercase tracking-widest text-surface-900">Enrollment</h4>
            <div className="mt-4 flex gap-3">
              <a
                className="flex size-10 items-center justify-center rounded-full bg-surface-200 text-surface-700 transition-all hover:bg-brand-600 hover:text-white"
                href="https://wa.me/2347033075594"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp the Academy +234 703 307 5594"
              >
                <MessageSquare className="size-4" />
              </a>
              <a
                className="flex size-10 items-center justify-center rounded-full bg-surface-200 text-surface-700 transition-all hover:bg-brand-600 hover:text-white"
                href="mailto:enquiry@korefield.com"
                aria-label="Email the Academy at enquiry@korefield.com"
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
                <a className="transition-colors hover:text-brand-600" href="tel:+2347033075594">
                  Call +234 703 307 5594
                </a>
              </li>
              <li>
                <a className="transition-colors hover:text-brand-600" href="mailto:enquiry@korefield.com">
                  enquiry@korefield.com
                </a>
              </li>
            </ul>
            <p className="mt-4 text-[10px] uppercase tracking-tighter text-surface-400">
              Academy platform status: <span className="font-bold text-emerald-600">Operational</span>
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-6 border-t border-surface-200 pt-8 md:flex-row md:items-center md:justify-between">
          <div className="max-w-md">
            <p className="text-sm font-bold text-surface-900">© {year} KoreField Academy</p>
            <p className="mt-1 text-xs leading-relaxed text-surface-600">A learning program operated by KoreField Energy &amp; Technology Ltd.</p>
            <p className="mt-2 text-[10px] uppercase tracking-widest text-surface-400">
              32 Oye Elegunde Street, Beckley Estate, U-Turn Bus Stop, Lagos State, Nigeria.
            </p>
          </div>
          <div className="flex flex-wrap gap-6 text-[10px] font-bold uppercase tracking-widest text-surface-500">
            <Link className="transition-colors hover:text-brand-600" href="/privacy">
              Privacy Policy
            </Link>
            <Link className="transition-colors hover:text-brand-600" href="/terms">
              Terms of Service
            </Link>
            <Link className="transition-colors hover:text-brand-600" href="/privacy">
              Security &amp; data
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
