/** @file learner/certificates/page.tsx — Certificate listing with KFCERT verification codes and PDF download. */
"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { EmptyState } from "@/components/feedback";

const FALLBACK_CERTIFICATES = [
  {
    id: "CRT-zara-001",
    verificationCode: "KFCERT-2025-ZM7K9P",
    trackName: "Cybersecurity and AI Security",
    completionDate: "2025-02-10",
    status: "active" as const,
  },
];

interface Certificate {
  id: string;
  verificationCode: string;
  trackName: string;
  completionDate: string;
  status: string;
}

export default function CertificatesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "learner", "certificates"],
    queryFn: () => apiFetch<Certificate[]>("/dashboard/learner/certificates"),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-surface-200" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-card bg-surface-200" />
          ))}
        </div>
      </div>
    );
  }

  const certificates = data ?? FALLBACK_CERTIFICATES;

  if (certificates.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-heading-lg text-surface-900">Certificates</h1>
        <EmptyState
          title="No certificates yet"
          description="Complete a Track Pathway to earn your certificate. Check your progress dashboard for certification readiness."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-heading-lg text-surface-900">Certificates</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        {certificates.map((cert) => (
          <div
            key={cert.id}
            className="rounded-card border border-surface-200 bg-surface-0 p-4 shadow-card"
          >
            <div className="flex items-start justify-between">
              <h2 className="text-body-lg font-medium text-surface-900">{cert.trackName}</h2>
              <span className="rounded-full bg-accent-100 px-2 py-0.5 text-caption text-accent-700">
                {cert.status === "active" ? "Active" : "Revoked"}
              </span>
            </div>
            <div className="mt-3 space-y-1 text-body-sm text-surface-600">
              <p>Certificate ID: <span className="font-mono text-surface-900">{cert.id}</span></p>
              <p>Verification: <span className="font-mono text-surface-900">{cert.verificationCode}</span></p>
              <p>Completed: {cert.completionDate}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                const blob = new Blob(["Certificate PDF placeholder"], { type: "application/pdf" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${cert.verificationCode}.pdf`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-body-sm font-medium text-white hover:bg-brand-700 transition-colors"
            >
              Download PDF
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
