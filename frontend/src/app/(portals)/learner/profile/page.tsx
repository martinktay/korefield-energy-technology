/** @file learner/profile/page.tsx — Learner profile page with bio and optional social links. */
"use client";

import { ProfilePage } from "@/components/profile";

export default function LearnerProfilePage() {
  return (
    <ProfilePage
      roleKey="learner"
      initialData={{
        name: "Kofi Mensah",
        email: "[email]",
        role: "Learner",
        bio: "AI Engineering track learner passionate about building intelligent systems for African markets.",
        socialLinks: { linkedin: "https://linkedin.com/in/example" },
      }}
    />
  );
}
