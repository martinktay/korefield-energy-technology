/** @file learner/pods/[podId]/chat/page.tsx — Pod team communication hub. */
"use client";

import { useParams } from "next/navigation";
import { PodChat } from "@/components/messaging";

const POD_MEMBERS = [
  { id: "PDM-001", name: "Amara Okafor", role: "Product Manager", online: true },
  { id: "PDM-002", name: "Kwame Asante", role: "AI Engineer", online: true },
  { id: "PDM-003", name: "Fatima Bello", role: "Data Scientist", online: false },
  { id: "PDM-004", name: "Chidi Nwosu", role: "Cybersecurity Specialist", online: true },
  { id: "PDM-005", name: "Zara Mwangi", role: "Industry Specialist", online: false },
];

export default function PodChatPage() {
  const params = useParams<{ podId: string }>();
  return (
    <PodChat
      podName={`Pod ${params.podId.replace("POD-", "").replace("pod-", "")}`}
      members={POD_MEMBERS}
      currentUser="Kofi Mensah"
    />
  );
}
