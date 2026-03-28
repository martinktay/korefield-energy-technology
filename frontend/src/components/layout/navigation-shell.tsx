/**
 * @file navigation-shell.tsx
 * Shared layout wrapper for all portal pages.
 * Combines TopBar + Sidebar + main content area with max-width container,
 * entrance animation, and custom scrollbar styling.
 */
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

export function NavigationShell({
  portalName,
  navItems,
  userName,
  userRole,
  avatarUrl,
  children,
}: NavigationShellProps) {
  return (
    <div className="flex h-screen flex-col bg-surface-50">
      <TopBar portalName={portalName} userName={userName} userRole={userRole} avatarUrl={avatarUrl} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar items={navItems} />
        <main className="flex-1 overflow-y-auto scrollbar-thin p-4 lg:p-6 xl:p-8">
          <div className="mx-auto max-w-7xl animate-fade-in-up">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
