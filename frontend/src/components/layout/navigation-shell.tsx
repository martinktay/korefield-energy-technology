"use client";

import { TopBar } from "./top-bar";
import { Sidebar, type NavItem } from "./sidebar";
import type { ReactNode } from "react";

interface NavigationShellProps {
  portalName: string;
  navItems: NavItem[];
  userName?: string;
  userRole?: "learner" | "instructor" | "admin" | "super-admin" | "corporate";
  avatarUrl?: string;
  children: ReactNode;
}

/**
 * Universal navigation shell used by all portal types.
 * Implements the dashboard layout from DASHBOARD_LAYOUT_RULES.md:
 * Top Bar + Sidebar + Main Content Area.
 *
 * Responsive behaviour:
 * - Desktop (1024px+): Full sidebar + main content
 * - Tablet (768–1023px): Collapsed sidebar (icons only) + main content
 * - Mobile (320–767px): Hidden sidebar (hamburger) + full-width content
 */
export function NavigationShell({
  portalName,
  navItems,
  userName,
  userRole,
  avatarUrl,
  children,
}: NavigationShellProps) {
  return (
    <div className="flex h-screen flex-col">
      <TopBar portalName={portalName} userName={userName} userRole={userRole} avatarUrl={avatarUrl} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar items={navItems} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
