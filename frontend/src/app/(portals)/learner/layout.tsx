"use client";

import { usePathname } from "next/navigation";
import { NavigationShell, type NavItem } from "@/components/layout";
import {
  LayoutDashboard,
  BookOpen,
  Route,
  GraduationCap,
  TrendingUp,
  Users,
  CreditCard,
  Award,
} from "lucide-react";

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/learner", Icon: LayoutDashboard },
  { label: "Foundation", href: "/learner/foundation", Icon: BookOpen },
  { label: "Tracks", href: "/learner/tracks", Icon: Route },
  { label: "Lessons", href: "/learner/lessons", Icon: GraduationCap },
  { label: "Progress", href: "/learner/progress", Icon: TrendingUp },
  { label: "Pod Workspace", href: "/learner/pods", Icon: Users },
  { label: "Payments", href: "/learner/payments", Icon: CreditCard },
  { label: "Certificates", href: "/learner/certificates", Icon: Award },
];

const authRoutes = ["/learner/register", "/learner/onboarding", "/learner/login"];

export default function LearnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthRoute = authRoutes.some((r) => pathname.startsWith(r));

  if (isAuthRoute) {
    return <>{children}</>;
  }

  return (
    <NavigationShell portalName="Learner Dashboard" navItems={navItems} userName="Kofi Mensah" userRole="learner">
      {children}
    </NavigationShell>
  );
}
