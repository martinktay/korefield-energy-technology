/** @file admin/profile/page.tsx — Admin profile page with bio and optional social links. */
"use client";

import { ProfilePage } from "@/components/profile";

export default function AdminProfilePage() {
  return (
    <ProfilePage
      roleKey="admin"
      initialData={{
        name: "Nana Adjei",
        email: "[email]",
        role: "Admin",
        bio: "Platform administrator managing enrollments, curriculum, and certification workflows.",
      }}
    />
  );
}
