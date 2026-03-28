/**
 * @file sidebar.tsx
 * Responsive sidebar navigation shared across all portal layouts.
 * Renders per-portal nav items with active state (left border accent),
 * hover states, and a help footer linking to the portal's messages page.
 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUIStore } from "@/stores/ui-store";
import { useEffect } from "react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  Icon?: LucideIcon;
}

interface SidebarProps {
  items: NavItem[];
}

export function Sidebar({ items }: SidebarProps) {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname, setSidebarOpen]);

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-surface-950/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex w-sidebar flex-col border-r border-surface-200 bg-surface-0
          transition-transform duration-200 ease-in-out
          lg:static lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        role="navigation"
        aria-label="Sidebar navigation"
      >
        {/* Mobile header */}
        <div className="flex h-14 items-center justify-between border-b border-surface-200 px-4 lg:hidden">
          <span className="font-bold text-brand-700">KoreField</span>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-md p-1.5 text-surface-500 hover:bg-surface-100 transition-colors"
            aria-label="Close navigation menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4">
          <ul className="space-y-0.5" role="list">
            {items.map((item) => {
              // Exact match for dashboard-level routes (e.g. /learner, /instructor)
              // For sub-routes, use startsWith but exclude the portal root from matching children
              const portalRoot = "/" + item.href.split("/").filter(Boolean)[0];
              const isDashboardLink = item.href === portalRoot;
              const isActive = isDashboardLink
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(item.href + "/");
              const IconComponent = item.Icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`
                      group flex items-center gap-3 rounded-lg px-3 py-2.5 text-body-sm transition-all duration-150
                      ${
                        isActive
                          ? "bg-brand-600/10 text-brand-700 font-medium border-l-2 border-brand-600 -ml-[2px] pl-[calc(0.75rem+2px)]"
                          : "text-surface-500 hover:bg-surface-100 hover:text-surface-900"
                      }
                    `}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {IconComponent && (
                      <IconComponent
                        className={`h-[18px] w-[18px] shrink-0 transition-colors ${
                          isActive ? "text-brand-600" : "text-surface-400 group-hover:text-surface-500"
                        }`}
                        aria-hidden="true"
                      />
                    )}
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar footer */}
        <div className="border-t border-surface-200 px-3 py-3">
          <Link href={`/${pathname.split("/")[1] || "learner"}/messages`} className="block rounded-lg bg-brand-50/50 px-3 py-2.5 hover:bg-brand-100/50 transition-colors">
            <p className="text-caption font-medium text-brand-700">Need help?</p>
            <p className="text-caption text-brand-600/70 mt-0.5">Message our support team</p>
          </Link>
        </div>
      </aside>
    </>
  );
}
