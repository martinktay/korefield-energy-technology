/** @file learner/messages/page.tsx — Messaging for Learners (support, instructor contact). */
"use client";
import { MessagingPage } from "@/components/messaging";
import { useAuthStore } from "@/stores/auth-store";
export default function LearnerMessagesPage() {
  const user = useAuthStore((s) => s.user);
  return <MessagingPage currentUser={user?.name || "Learner"} currentRole="Learner" />;
}
