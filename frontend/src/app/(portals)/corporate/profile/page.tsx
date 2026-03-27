/** @file corporate/profile/page.tsx — Corporate partner profile page with bio and optional social links. */
"use client";

import { ProfilePage } from "@/components/profile";

export default function CorporateProfilePage() {
  return (
    <ProfilePage
      roleKey="corporate"
      initialData={{
        name: "Kwame Asante",
        email: "[email]",
        role: "Corporate Partner",
        bio: "Managing sponsored learner programs and talent pipeline for our organization.",
      }}
    />
  );
}
