/** @file admin/layout.tsx — Layout wrapper for the Admin portal with user/enrollment/curriculum/payment/certificate navigation. */
"use client";

import { NavigationShell, type NavItem } from "@/components/layout";

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/admin" },
  { label: "Users", href: "/admin/users" },
  { label: "Enrollments", href: "/admin/enrollments" },
  { label: "Curriculum", href: "/admin/curriculum" },
  { label: "Payments", href: "/admin/payments" },
  { label: "Certificates", href: "/admin/certificates" },
  { label: "Messages", href: "/admin/messages" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NavigationShell portalName="Admin Portal" navItems={navItems} userName="Nana Adjei" userRole="admin">
      {children}
    </NavigationShell>
  );
}
