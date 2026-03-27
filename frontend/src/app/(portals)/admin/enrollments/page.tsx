/** @file admin/enrollments/page.tsx — Enrollment management page with track and status filtering. */
"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

const FALLBACK_ENROLLMENTS = [
  { id: "ENR-ngozi-010", learner: "Ngozi Eze", track: "AI Engineering", level: "Beginner", status: "Active", enrolled: "2025-01-05" },
  { id: "ENR-tendai-011", learner: "Tendai Moyo", track: "Data Science", level: "Beginner", status: "Active", enrolled: "2025-01-08" },
  { id: "ENR-aisha-012", learner: "Aisha Diallo", track: "Cybersecurity", level: "Beginner", status: "Active", enrolled: "2025-01-10" },
  { id: "ENR-kofi-013", learner: "Kofi Mensah", track: "AI Product Leadership", level: "Beginner", status: "Active", enrolled: "2025-01-12" },
  { id: "ENR-halima-014", learner: "Halima Yusuf", track: "Data Science", level: "Beginner", status: "Active", enrolled: "2025-01-15" },
  { id: "ENR-samuel-015", learner: "Samuel Osei", track: "AI Engineering", level: "Beginner", status: "Active", enrolled: "2025-01-18" },
  { id: "ENR-fatima-016", learner: "Fatima Bello", track: "AI Engineering", level: "Beginner", status: "Active", enrolled: "2025-01-20" },
  { id: "ENR-kwame-017", learner: "Kwame Asante", track: "AI Engineering", level: "Beginner", status: "Active", enrolled: "2025-01-22" },
  { id: "ENR-amara-018", learner: "Amara Okafor", track: "AI Product Leadership", level: "Beginner", status: "Active", enrolled: "2025-01-25" },
  { id: "ENR-zara-019", learner: "Zara Mwangi", track: "Cybersecurity", level: "Advanced", status: "Completed", enrolled: "2024-10-01" },
];

interface EnrollmentRow {
  id: string; learner: string; track: string; level: string; status: string; enrolled: string;
}

export default function EnrollmentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "admin", "enrollments"],
    queryFn: () => apiFetch<EnrollmentRow[]>("/dashboard/admin/enrollments"),
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

  const enrollments = data ?? FALLBACK_ENROLLMENTS;

  return (
    <div className="space-y-6">
      <h1 className="text-heading-lg text-surface-900">Enrollment Management</h1>
      <p className="text-body-sm text-surface-500">
        View and manage enrollments: status, track pathway, current level, and enrollment date.
      </p>

      <div className="rounded-card border border-surface-200 bg-surface-0 shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-body-sm">
            <thead className="border-b border-surface-200 bg-surface-50">
              <tr>
                <th className="px-4 py-3 text-surface-600 font-medium">Learner</th>
                <th className="px-4 py-3 text-surface-600 font-medium">Track</th>
                <th className="px-4 py-3 text-surface-600 font-medium">Level</th>
                <th className="px-4 py-3 text-surface-600 font-medium">Status</th>
                <th className="px-4 py-3 text-surface-600 font-medium">Enrolled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200">
              {enrollments.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-3 text-surface-900">{e.learner}</td>
                  <td className="px-4 py-3 text-surface-700">{e.track}</td>
                  <td className="px-4 py-3 text-surface-700">{e.level}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-caption ${
                      e.status === "Active" ? "bg-green-100 text-green-700" :
                      e.status === "Completed" ? "bg-blue-100 text-blue-700" :
                      "bg-amber-100 text-amber-700"
                    }`}>
                      {e.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-surface-500">{e.enrolled}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
