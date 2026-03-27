/**
 * @file learner/layout.tsx
 * Layout wrapper for the Learner portal.
 * Renders the NavigationShell with learner-specific nav items for authenticated pages.
 * Auth routes (register, onboarding) bypass the shell and render without sidebar.
 */
"use client";

import { usePathname } from "next/navigation";
import { NavigationShell, type NavItem } from "@/components/layout";const navItems: NavItem[] = [
  { label: "Dashboard", href: "/learner" },
  { label: "Foundation", href: "/learner/foundation" },
  { label: "Tracks", href: "/learner/tracks" },
  { label: "Lessons", href: "/learner/lessons" },
  { label: "Progress", href: "/learner/progress" },
  { label: "Pod Workspace", href: "/learner/pods" },
  { label: "Payments", href: "/learner/payments" },
  { label: "Certificates", href: "/learner/certificates" },
];

/** Routes that should render without the sidebar navigation shell */
const authRoutes = ["/learner/register", "/learner/onboarding", "/learner/login"];

export default function LearnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthRoute = authRoutes.some((r) => pathname.startsWith(r));

  if (isAuthRoute) {
    return <>{children}</>;
  }

  return (
    <NavigationShell portalName="Learner Dashboard" navItems={navItems} userName="Kofi Mensah" userRole="learner">
      {children}
    </NavigationShell>
  );
}
