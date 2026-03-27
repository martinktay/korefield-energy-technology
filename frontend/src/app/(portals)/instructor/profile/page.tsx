/** @file instructor/profile/page.tsx — Instructor profile page with bio and optional social links. */
"use client";

import { ProfilePage } from "@/components/profile";

export default function InstructorProfilePage() {
  return (
    <ProfilePage
      roleKey="instructor"
      initialData={{
        name: "Dr. Amina Osei",
        email: "[email]",
        role: "Instructor",
        bio: "Senior AI researcher and educator with 10+ years in machine learning and data science.",
        socialLinks: { linkedin: "https://linkedin.com/in/example", github: "https://github.com/example" },
      }}
    />
  );
}
