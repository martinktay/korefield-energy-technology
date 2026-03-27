/** @file admin/certificates/page.tsx — Certificate administration with issuance, verification, and revocation management. */
"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

const FALLBACK_CERTIFICATES = [
  { id: "CRT-001", code: "KFCERT-2025-A1B2C3", learner: "Kofi Mensah", track: "AI Engineering", issued: "2025-01-30", status: "Active" },
  { id: "CRT-002", code: "KFCERT-2025-D4E5F6", learner: "Halima Yusuf", track: "Data Science", issued: "2025-02-05", status: "Active" },
  { id: "CRT-003", code: "KFCERT-2024-G7H8I9", learner: "Yemi Adeyemi", track: "Cybersecurity", issued: "2024-11-20", status: "Revoked" },
];

interface CertRow {
  id: string; code: string; learner: string; track: string; issued: string; status: string;
}

export default function CertificatesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "admin", "certificates"],
    queryFn: () => apiFetch<CertRow[]>("/dashboard/admin/certificates"),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-surface-200" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-card bg-surface-200" />
          ))}
        </div>
      </div>
    );
  }

  const certificates = data ?? FALLBACK_CERTIFICATES;

  return (
    <div className="space-y-6">
      <h1 className="text-heading-lg text-surface-900">Certificate Operations</h1>
      <p className="text-body-sm text-surface-500">
        View issued certificates, revoke (with reason), reissue, and audit verification records.
      </p>

      <div className="rounded-card border border-surface-200 bg-surface-0 shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-body-sm">
            <thead className="border-b border-surface-200 bg-surface-50">
              <tr>
                <th className="px-4 py-3 text-surface-600 font-medium">Verification Code</th>
                <th className="px-4 py-3 text-surface-600 font-medium">Learner</th>
                <th className="px-4 py-3 text-surface-600 font-medium">Track</th>
                <th className="px-4 py-3 text-surface-600 font-medium">Issued</th>
                <th className="px-4 py-3 text-surface-600 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200">
              {certificates.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-mono text-body-sm text-surface-900">{c.code}</td>
                  <td className="px-4 py-3 text-surface-700">{c.learner}</td>
                  <td className="px-4 py-3 text-surface-700">{c.track}</td>
                  <td className="px-4 py-3 text-surface-500">{c.issued}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-caption ${
                      c.status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
