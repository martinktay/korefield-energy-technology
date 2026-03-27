"use client";

import { NavigationShell, type NavItem } from "@/components/layout";
import {
  LayoutDashboard,
  DollarSign,
  UserPlus,
  GraduationCap,
  Activity,
  Bot,
  Globe,
  MessageSquare,
  Calculator,
} from "lucide-react";

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
