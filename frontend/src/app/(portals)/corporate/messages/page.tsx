/** @file corporate/messages/page.tsx — Messaging for Corporate Partners. */
"use client";
import { MessagingPage } from "@/components/messaging";
import { useAuthStore } from "@/stores/auth-store";
export default function CorporateMessagesPage() {
  const user = useAuthStore((s) => s.user);
  return <MessagingPage currentUser={user?.name || "Corporate Partner"} currentRole="CorporatePartner" />;
}
