/** @file admin/messages/page.tsx — Internal messaging for Admins. */
"use client";
import { MessagingPage } from "@/components/messaging";
export default function AdminMessagesPage() {
  return <MessagingPage currentUser="Nana Adjei" currentRole="Admin" />;
}
