"use client";

import { NavigationShell, type NavItem } from "@/components/layout";
import { useAuthStore } from "@/stores/auth-store";
import { LayoutDashboard, Users, UserPlus, BookOpen, CreditCard, Award, Briefcase, Mail } from "lucide-react";

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/admin", Icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", Icon: Users },
  { label: "Enrollments", href: "/admin/enrollments", Icon: UserPlus },
  { label: "Curriculum", href: "/admin/curriculum", Icon: BookOpen },
  { label: "Payments", href: "/admin/payments", Icon: CreditCard },
  { label: "Certificates", href: "/admin/certificates", Icon: Award },
  { label: "Recruitment", href: "/admin/recruitment", Icon: Briefcase },
  { label: "Messages", href: "/admin/messages", Icon: Mail },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  return (
    <NavigationShell portalName="Admin Portal" navItems={navItems} userName={user?.name || "Nana Adjei"} userRole={user?.role || "admin"} avatarUrl={user?.avatarUrl}>
      {children}
    </NavigationShell>
  );
}
