/**
 * @file site-footer.tsx
 * Shared site footer rendered on all public pages (landing, pricing, legal, team, careers).
 * Hidden on portal routes (/learner, /instructor, /admin, /super-admin, /corporate).
 * Includes Platform, Portals, Company, and Legal link columns.
 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const PORTAL_PREFIXES = ["/learner", "/instructor", "/admin", "/super-admin", "/corporate"];

export function SiteFooter() {
  const pathname = usePathname();
  const isPortal = PORTAL_PREFIXES.some((p) => pathname.startsWith(p));
  if (pathname === "/") return null;
  if (isPortal) return null;

  return (
    <footer className="border-t border-surface-200 bg-surface-50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <p className="text-heading-sm text-brand-700 font-semibold tracking-tight">KoreField Academy</p>
            <p className="mt-2 text-body-sm text-surface-500 max-w-xs">Applied AI learning platform preparing Africa&apos;s workforce for intelligent industries.</p>
          </div>
          <div>
            <p className="text-body-sm font-medium text-surface-900">Platform</p>
            <ul className="mt-2 space-y-1.5 text-body-sm text-surface-500">
              <li><Link href="/#tracks" className="hover:text-brand-600 transition-colors">Specialized Tracks</Link></li>
              <li><Link href="/pricing" className="hover:text-brand-600 transition-colors">Pricing</Link></li>
              <li><Link href="/#how-it-works" className="hover:text-brand-600 transition-colors">How It Works</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-body-sm font-medium text-surface-900">Portals</p>
            <ul className="mt-2 space-y-1.5 text-body-sm text-surface-500">
              <li><Link href="/learner" className="hover:text-brand-600 transition-colors">Learner</Link></li>
              <li><Link href="/instructor" className="hover:text-brand-600 transition-colors">Instructor</Link></li>
              <li><Link href="/admin" className="hover:text-brand-600 transition-colors">Admin</Link></li>
              <li><Link href="/super-admin" className="hover:text-brand-600 transition-colors">Super Admin</Link></li>
              <li><Link href="/corporate" className="hover:text-brand-600 transition-colors">Corporate</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-body-sm font-medium text-surface-900">Company</p>
            <ul className="mt-2 space-y-1.5 text-body-sm text-surface-500">
              <li><Link href="/team" className="hover:text-brand-600 transition-colors">Team</Link></li>
              <li><Link href="/careers" className="hover:text-brand-600 transition-colors">Careers</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-body-sm font-medium text-surface-900">Legal</p>
            <ul className="mt-2 space-y-1.5 text-body-sm text-surface-500">
              <li><Link href="/privacy" className="hover:text-brand-600 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-brand-600 transition-colors">Terms of Service</Link></li>
              <li><Link href="/cookies" className="hover:text-brand-600 transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-surface-200 pt-6 text-center">
          <p className="text-caption text-surface-400">&copy; {new Date().getFullYear()} KoreField Academy. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
