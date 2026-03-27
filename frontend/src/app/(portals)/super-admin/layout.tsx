/** @file super-admin/layout.tsx — Layout wrapper for the Super Admin portal with executive intelligence dashboards. */
"use client";

import { NavigationShell, type NavItem } from "@/components/layout";

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/super-admin" },
  { label: "Revenue", href: "/super-admin/revenue" },
  { label: "Enrollment", href: "/super-admin/enrollment" },
  { label: "Academic Quality", href: "/super-admin/academic" },
  { label: "Platform Health", href: "/super-admin/platform" },
  { label: "AI Agents", href: "/super-admin/ai" },
  { label: "Market Intelligence", href: "/super-admin/market" },
  { label: "Messages", href: "/super-admin/messages" },
];

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NavigationShell portalName="Super Admin Portal" navItems={navItems} userName="Esi Owusu" userRole="super-admin">
      {children}
    </NavigationShell>
  );
}
