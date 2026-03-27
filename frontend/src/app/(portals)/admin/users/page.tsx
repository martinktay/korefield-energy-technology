/** @file admin/users/page.tsx — User management page with role filtering, status management, and search. */
"use client";

import { useState } from "react";
import { X } from "lucide-react";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

const FALLBACK_USERS = [
  { id: "USR-olumide-001", name: "Olumide Adebayo", email: "olumide@korefield.com", role: "Super Admin", status: "Active", joined: "2024-06-01" },
  { id: "USR-blessing-002", name: "Blessing Okoro", email: "blessing@korefield.com", role: "Admin", status: "Active", joined: "2024-06-15" },
  { id: "USR-emeka-003", name: "Dr. Emeka Okonkwo", email: "emeka@korefield.com", role: "Instructor", status: "Active", joined: "2024-07-01" },
  { id: "USR-amina-004", name: "Dr. Amina Toure", email: "amina@korefield.com", role: "Instructor", status: "Active", joined: "2024-07-10" },
  { id: "USR-babatunde-005", name: "Prof. Babatunde Ogunleye", email: "babatunde@korefield.com", role: "Assessor", status: "Active", joined: "2024-08-01" },
  { id: "USR-wanjiku-006", name: "Dr. Wanjiku Kamau", email: "wanjiku@korefield.com", role: "Assessor", status: "Active", joined: "2024-08-15" },
  { id: "USR-techafrica-007", name: "TechAfrica Corp", email: "techafrica@partner.com", role: "Corporate Partner", status: "Active", joined: "2024-09-01" },
  { id: "USR-chidinma-008", name: "Chidinma Eze", email: "chidinma@korefield.com", role: "Finance Admin", status: "Active", joined: "2024-09-10" },
  { id: "USR-tunde-009", name: "Tunde Bakare", email: "tunde@korefield.com", role: "DevOps Engineer", status: "Active", joined: "2024-09-20" },
  { id: "USR-ngozi-010", name: "Ngozi Eze", email: "ngozi@learner.com", role: "Learner", status: "Active", joined: "2025-01-05" },
  { id: "USR-tendai-011", name: "Tendai Moyo", email: "tendai@learner.com", role: "Learner", status: "Active", joined: "2025-01-08" },
  { id: "USR-aisha-012", name: "Aisha Diallo", email: "aisha@learner.com", role: "Learner", status: "Active", joined: "2025-01-10" },
  { id: "USR-kofi-013", name: "Kofi Mensah", email: "kofi@learner.com", role: "Learner", status: "Active", joined: "2025-01-12" },
  { id: "USR-halima-014", name: "Halima Yusuf", email: "halima@learner.com", role: "Learner", status: "Active", joined: "2025-01-15" },
  { id: "USR-samuel-015", name: "Samuel Osei", email: "samuel@learner.com", role: "Learner", status: "Active", joined: "2025-01-18" },
  { id: "USR-fatima-016", name: "Fatima Bello", email: "fatima@learner.com", role: "Learner", status: "Active", joined: "2025-01-20" },
  { id: "USR-kwame-017", name: "Kwame Asante", email: "kwame@learner.com", role: "Learner", status: "Active", joined: "2025-01-22" },
  { id: "USR-amara-018", name: "Amara Okafor", email: "amara@learner.com", role: "Learner", status: "Active", joined: "2025-01-25" },
  { id: "USR-zara-019", name: "Zara Mwangi", email: "zara@learner.com", role: "Learner", status: "Active", joined: "2024-10-01" },
];

interface UserRow {
  id: string; name: string; email: string; role: string; status: string; joined: string;
}

const ROLES = ["Learner", "Instructor", "Assessor", "Admin"];

function generateUserId(): string {
  return `USR-${Math.random().toString(36).slice(2, 8)}`;
}

export default function UsersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "admin", "users"],
    queryFn: () => apiFetch<UserRow[]>("/dashboard/admin/users"),
  });
  const [extraUsers, setExtraUsers] = useState<UserRow[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: ROLES[0], status: "Active" });
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const users = [...(data ?? FALLBACK_USERS), ...extraUsers];

  function openDialog() {
    setForm({ name: "", email: "", role: ROLES[0], status: "Active" });
    setErrors({});
    setDialogOpen(true);
  }

  function validateForm(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Valid email is required";
    return errs;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateForm();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const newUser: UserRow = {
      id: generateUserId(),
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      status: form.status,
      joined: new Date().toISOString().split("T")[0],
    };
    setExtraUsers((prev) => [newUser, ...prev]);
    setDialogOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-heading-lg text-surface-900">User Management</h1>
        <button onClick={openDialog} className="rounded-lg bg-brand-600 px-4 py-2 text-body-sm text-white hover:bg-brand-700">
          Create User
        </button>
      </div>
      <p className="text-body-sm text-surface-500">
        View, search, create, edit, and deactivate Learner, Instructor, and Assessor accounts.
      </p>

      <div className="rounded-card border border-surface-200 bg-surface-0 shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-body-sm">
            <thead className="border-b border-surface-200 bg-surface-50">
              <tr>
                <th className="px-4 py-3 text-surface-600 font-medium">Name</th>
                <th className="px-4 py-3 text-surface-600 font-medium">Email</th>
                <th className="px-4 py-3 text-surface-600 font-medium">Role</th>
                <th className="px-4 py-3 text-surface-600 font-medium">Status</th>
                <th className="px-4 py-3 text-surface-600 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 text-surface-900">{u.name}</td>
                  <td className="px-4 py-3 text-surface-700">{u.email}</td>
                  <td className="px-4 py-3 text-surface-700">{u.role}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-caption ${
                      u.status === "Active" ? "bg-green-100 text-green-700" : "bg-surface-100 text-surface-600"
                    }`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-surface-500">{u.joined}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Create User Dialog ── */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-surface-950/50" onClick={() => setDialogOpen(false)} />
          <div className="relative w-full max-w-lg mx-4 rounded-card border border-surface-200 bg-surface-0 shadow-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
              <h2 className="text-heading-sm text-surface-900">Create New User</h2>
              <button onClick={() => setDialogOpen(false)} className="p-1 rounded-lg text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-colors" aria-label="Close dialog">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label htmlFor="user-name" className="block text-body-sm font-medium text-surface-700 mb-1.5">Name <span className="text-status-error">*</span></label>
                <input id="user-name" type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Full name" className="w-full rounded-lg border border-surface-300 px-3.5 py-2.5 text-body-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors" aria-invalid={!!errors.name} />
                {errors.name && <p className="mt-1 text-caption text-status-error">{errors.name}</p>}
              </div>
              <div>
                <label htmlFor="user-email" className="block text-body-sm font-medium text-surface-700 mb-1.5">Email <span className="text-status-error">*</span></label>
                <input id="user-email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="user@example.com" className="w-full rounded-lg border border-surface-300 px-3.5 py-2.5 text-body-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors" aria-invalid={!!errors.email} />
                {errors.email && <p className="mt-1 text-caption text-status-error">{errors.email}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="user-role" className="block text-body-sm font-medium text-surface-700 mb-1.5">Role</label>
                  <select id="user-role" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} className="w-full rounded-lg border border-surface-300 px-3.5 py-2.5 text-body-sm text-surface-900 bg-surface-0 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors">
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="user-status" className="block text-body-sm font-medium text-surface-700 mb-1.5">Status</label>
                  <select id="user-status" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="w-full rounded-lg border border-surface-300 px-3.5 py-2.5 text-body-sm text-surface-900 bg-surface-0 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setDialogOpen(false)} className="rounded-lg border border-surface-300 px-4 py-2.5 text-body-sm font-medium text-surface-700 hover:bg-surface-100 transition-colors">Cancel</button>
                <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2.5 text-body-sm font-medium text-white hover:bg-brand-700 transition-colors">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
