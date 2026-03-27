"use client";

import { NavigationShell, type NavItem } from "@/components/layout";
import { useAuthStore } from "@/stores/auth-store";
import { LayoutDashboard, DollarSign, UserPlus, GraduationCap, Activity, Bot, Globe, MessageSquare, Calculator } from "lucide-react";

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/super-admin", Icon: LayoutDashboard },
  { label: "Revenue", href: "/super-admin/revenue", Icon: DollarSign },
  { label: "Finance", href: "/super-admin/finance", Icon: Calculator },
  { label: "Enrollment", href: "/super-admin/enrollment", Icon: UserPlus },
  { label: "Academic Quality", href: "/super-admin/academic", Icon: GraduationCap },
  { label: "Platform Health", href: "/super-admin/platform", Icon: Activity },
  { label: "AI Agents", href: "/super-admin/ai", Icon: Bot },
  { label: "Market Intelligence", href: "/super-admin/market", Icon: Globe },
  { label: "Messages", href: "/super-admin/messages", Icon: MessageSquare },
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  return (
    <NavigationShell portalName="Super Admin Portal" navItems={navItems} userName={user?.name || "Esi Owusu"} userRole={user?.role || "super-admin"} avatarUrl={user?.avatarUrl}>
      {children}
    </NavigationShell>
  );
}
