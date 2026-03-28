"use client";

import { NavigationShell, type NavItem } from "@/components/layout";
import { useAuthStore } from "@/stores/auth-store";
import { LayoutDashboard, DollarSign, UserPlus, GraduationCap, Activity, Bot, Globe, Mail, Calculator, Tag, Compass, TrendingUp, Lightbulb, Users } from "lucide-react";

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/super-admin", Icon: LayoutDashboard },
  { label: "Revenue", href: "/super-admin/revenue", Icon: DollarSign },
  { label: "Finance", href: "/super-admin/finance", Icon: Calculator },
  { label: "Messages", href: "/super-admin/messages", Icon: Mail },
  { label: "Coupons", href: "/super-admin/coupons", Icon: Tag },
  { label: "Enrollment", href: "/super-admin/enrollment", Icon: UserPlus },
  { label: "Academic Quality", href: "/super-admin/academic", Icon: GraduationCap },
  { label: "Platform Health", href: "/super-admin/platform", Icon: Activity },
  { label: "AI Agents", href: "/super-admin/ai", Icon: Bot },
  { label: "Market Intelligence", href: "/super-admin/market", Icon: Globe },
  { label: "Strategy", href: "/super-admin/strategy", Icon: Compass },
  { label: "Growth", href: "/super-admin/growth", Icon: TrendingUp },
  { label: "Product Strategy", href: "/super-admin/product", Icon: Lightbulb },
  { label: "Workforce", href: "/super-admin/workforce", Icon: Users },
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  return (
    <NavigationShell portalName="Super Admin Portal" navItems={navItems} userName={user?.name || "Esi Owusu"} userRole={user?.role || "super-admin"} avatarUrl={user?.avatarUrl}>
      {children}
    </NavigationShell>
  );
}
