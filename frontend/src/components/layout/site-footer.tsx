/**
 * @file site-footer.tsx
 * Public Academy pages footer with brand, enrollment contact, navigation, and legal links.
 */
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mail, MessageSquare } from "lucide-react";

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
          <div className="md:col-span-5">
            <Link href="/" className="mb-4 inline-flex items-center gap-3">
              <Image src="/logo.svg" alt="KoreField Academy logo" width={56} height={56} className="h-12 w-auto" />
              <span className="text-xl font-extrabold tracking-tight text-brand-700">KoreField Academy</span>
            </Link>
            <p className="max-w-sm text-body-sm leading-relaxed text-surface-600">
              Hands-on AI bootcamps, learner support, and practical engineering education from KoreField Energy &amp; Technology Ltd.
            </p>
          </div>

          <div className="md:col-span-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-surface-900">Enrollment Support</h4>
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
          </div>

          <div className="md:col-span-2">
            <h4 className="text-xs font-bold uppercase tracking-widest text-surface-900">Program</h4>
            <ul className="mt-4 space-y-2.5 text-body-sm font-medium text-surface-600">
              <li>
                <Link href="/#program" className="transition-colors hover:text-brand-600">
                  Overview
                </Link>
              </li>
              <li>
                <Link href="/#industry-tools" className="transition-colors hover:text-brand-600">
                  Industry tools
                </Link>
              </li>
              <li>
                <Link href="/#outcomes" className="transition-colors hover:text-brand-600">
                  Skills &amp; outcomes
                </Link>
              </li>
              <li>
                <Link href="/#waitlist" className="transition-colors hover:text-brand-600">
                  Join waitlist
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-xs font-bold uppercase tracking-widest text-surface-900">Academy</h4>
            <ul className="mt-4 space-y-2.5 text-body-sm font-medium text-surface-600">
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
            <Link className="transition-colors hover:text-brand-600" href="/cookies">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
