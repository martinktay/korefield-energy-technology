"use client";

import { NavigationShell, type NavItem } from "@/components/layout";
import { useAuthStore } from "@/stores/auth-store";
import { LayoutDashboard, Users, Receipt } from "lucide-react";

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/corporate", Icon: LayoutDashboard },
  { label: "Sponsored Learners", href: "/corporate/learners", Icon: Users },
  { label: "Billing", href: "/corporate/billing", Icon: Receipt },
];

export default function CorporateLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  return (
    <NavigationShell portalName="Corporate Portal" navItems={navItems} userName={user?.name || "Kwame Asante"} userRole={user?.role || "corporate"} avatarUrl={user?.avatarUrl}>
      {children}
    </NavigationShell>
  );
}
