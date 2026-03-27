/**
 * @file profile-page.tsx
 * Shared profile page component used across all portal types.
 * Shows avatar (image or initials fallback), name, role, email,
 * bio, and optional social media links (LinkedIn, GitHub, Twitter/X, website).
 */
"use client";

import { useState } from "react";
import { Camera, Link2, Code2, Globe, AtSign, Save } from "lucide-react";
import { toast } from "sonner";

interface SocialLinks {
  linkedin?: string;
  github?: string;
  twitter?: string;
  website?: string;
}

interface ProfileData {
  name: string;
  email: string;
  role: string;
  bio?: string;
  avatarUrl?: string;
  socialLinks?: SocialLinks;
}

const ROLE_COLORS: Record<string, string> = {
  learner: "bg-brand-600",
  instructor: "bg-accent-600",
  admin: "bg-purple-600",
  "super-admin": "bg-surface-800",
  corporate: "bg-amber-600",
};

function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

interface ProfilePageProps {
  initialData: ProfileData;
  roleKey: string;
}

export function ProfilePage({ initialData, roleKey }: ProfilePageProps) {
  const [data, setData] = useState(initialData);
  const [editing, setEditing] = useState(false);

  function handleSave() {
    setEditing(false);
    toast.success("Profile updated", { description: "Your changes have been saved." });
  }

  function updateField(field: keyof ProfileData, value: string) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  function updateSocial(field: keyof SocialLinks, value: string) {
    setData((prev) => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [field]: value },
    }));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-heading-lg text-surface-900">Profile</h1>
        {editing ? (
          <button
            onClick={handleSave}
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-body-sm font-medium text-white hover:bg-brand-700 transition-colors"
          >
            <Save className="h-4 w-4" />
            Save Changes
          </button>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="rounded-lg border border-surface-300 px-4 py-2 text-body-sm font-medium text-surface-700 hover:bg-surface-100 transition-colors"
          >
            Edit Profile
          </button>
        )}
      </div>

      {/* Avatar + Basic Info */}
      <div className="rounded-card border border-surface-200 bg-surface-0 p-6 shadow-card">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          {/* Avatar */}
          <div className="relative">
            <div className={`flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white overflow-hidden ${ROLE_COLORS[roleKey] || "bg-brand-600"}`}>
              {data.avatarUrl ? (
                <img src={data.avatarUrl} alt={data.name} className="h-full w-full object-cover" />
              ) : (
                getInitials(data.name)
              )}
            </div>
            {editing && (
              <button
                type="button"
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-white shadow-md hover:bg-brand-700 transition-colors"
                aria-label="Upload profile photo"
                onClick={() => toast.info("Photo upload coming soon", { description: "This feature is under development." })}
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Info fields */}
          <div className="flex-1 space-y-3 text-center sm:text-left">
            {editing ? (
              <input
                type="text"
                value={data.name}
                onChange={(e) => updateField("name", e.target.value)}
                className="w-full rounded-lg border border-surface-300 px-3 py-2 text-heading-sm text-surface-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            ) : (
              <h2 className="text-heading-sm text-surface-900">{data.name}</h2>
            )}
            <p className="text-body-sm text-surface-500">{data.role} · {data.email}</p>
            {editing ? (
              <textarea
                value={data.bio || ""}
                onChange={(e) => updateField("bio", e.target.value)}
                placeholder="Write a short bio..."
                rows={3}
                className="w-full rounded-lg border border-surface-300 px-3 py-2 text-body-sm text-surface-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none"
              />
            ) : (
              <p className="text-body-sm text-surface-600">{data.bio || "No bio added yet."}</p>
            )}
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div className="rounded-card border border-surface-200 bg-surface-0 p-6 shadow-card">
        <h3 className="text-heading-sm text-surface-900 mb-4">Social Links</h3>
        <p className="text-body-sm text-surface-500 mb-4">Optional — share your professional profiles with your team and assessors.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {([
            { key: "linkedin" as const, label: "LinkedIn", icon: Link2, placeholder: "https://linkedin.com/in/yourprofile" },
            { key: "github" as const, label: "GitHub", icon: Code2, placeholder: "https://github.com/yourusername" },
            { key: "twitter" as const, label: "X (Twitter)", icon: AtSign, placeholder: "https://x.com/yourhandle" },
            { key: "website" as const, label: "Website", icon: Globe, placeholder: "https://yourwebsite.com" },
          ]).map(({ key, label, icon: Icon, placeholder }) => (
            <div key={key}>
              <label className="flex items-center gap-2 text-body-sm font-medium text-surface-700 mb-1.5">
                <Icon className="h-4 w-4 text-surface-400" />
                {label}
              </label>
              {editing ? (
                <input
                  type="url"
                  value={data.socialLinks?.[key] || ""}
                  onChange={(e) => updateSocial(key, e.target.value)}
                  placeholder={placeholder}
                  className="w-full rounded-lg border border-surface-300 px-3 py-2 text-body-sm text-surface-700 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              ) : data.socialLinks?.[key] ? (
                <a
                  href={data.socialLinks[key]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-body-sm text-brand-600 hover:text-brand-700 hover:underline transition-colors"
                >
                  {data.socialLinks[key]}
                </a>
              ) : (
                <p className="text-body-sm text-surface-400">Not set</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
