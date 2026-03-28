"use client";

import { NavigationShell, type NavItem } from "@/components/layout";
import { useAuthStore } from "@/stores/auth-store";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  FileText,
  Calendar,
  ShieldCheck,
  Mail,
} from "lucide-react";

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/instructor", Icon: LayoutDashboard },
  { label: "Cohorts", href: "/instructor/cohorts", Icon: Users },
  { label: "Grading Queue", href: "/instructor/grading", Icon: ClipboardCheck },
  { label: "Content", href: "/instructor/content", Icon: FileText },
  { label: "Schedule", href: "/instructor/schedule", Icon: Calendar },
  { label: "Assessor", href: "/instructor/assessor", Icon: ShieldCheck },
  { label: "Messages", href: "/instructor/messages", Icon: Mail },
];

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  return (
    <NavigationShell portalName="Instructor Portal" navItems={navItems} userName={user?.name || "Dr. Amina Osei"} userRole={user?.role || "instructor"} avatarUrl={user?.avatarUrl}>
      {children}
    </NavigationShell>
  );
}
