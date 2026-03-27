/** @file corporate/layout.tsx — Layout wrapper for the Corporate Partner portal (sponsored learner tracking, billing). */
"use client";

import { NavigationShell, type NavItem } from "@/components/layout";

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/corporate" },
  { label: "Sponsored Learners", href: "/corporate/learners" },
  { label: "Billing", href: "/corporate/billing" },
];

export default function CorporateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NavigationShell portalName="Corporate Portal" navItems={navItems} userName="Kwame Asante" userRole="corporate">
      {children}
    </NavigationShell>
  );
}
