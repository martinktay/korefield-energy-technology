/** @file instructor/layout.tsx — Layout wrapper for the Instructor portal with cohort/grading/content/schedule navigation. */
"use client";

import { NavigationShell, type NavItem } from "@/components/layout";

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/instructor" },
  { label: "Cohorts", href: "/instructor/cohorts" },
  { label: "Grading Queue", href: "/instructor/grading" },
  { label: "Content", href: "/instructor/content" },
  { label: "Schedule", href: "/instructor/schedule" },
  { label: "Assessor", href: "/instructor/assessor" },
  { label: "Messages", href: "/instructor/messages" },
];

export default function InstructorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NavigationShell portalName="Instructor Portal" navItems={navItems} userName="Dr. Amina Osei" userRole="instructor">
      {children}
    </NavigationShell>
  );
}
