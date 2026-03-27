/** @file super-admin/profile/page.tsx — Super Admin profile page with bio and optional social links. */
"use client";

import { ProfilePage } from "@/components/profile";

export default function SuperAdminProfilePage() {
  return (
    <ProfilePage
      roleKey="super-admin"
      initialData={{
        name: "Esi Owusu",
        email: "[email]",
        role: "Super Admin",
        bio: "Executive overseeing platform strategy, revenue intelligence, and market expansion.",
      }}
    />
  );
}
