"use client";

import { NavigationShell, type NavItem } from "@/components/layout";
import {
  LayoutDashboard,
  Users,
  Receipt,
} from "lucide-react";

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/corporate", Icon: LayoutDashboard },
  { label: "Sponsored Learners", href: "/corporate/learners", Icon: Users },
  { label: "Billing", href: "/corporate/billing", Icon: Receipt },
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
