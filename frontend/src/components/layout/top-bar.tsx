/**
 * @file top-bar.tsx
 * Sticky top bar with portal name, mobile hamburger, notification bell
 * with dropdown, and user avatar placeholder.
 */
"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Bell, LogOut, Settings, User } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";

interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: "1", title: "New module published", description: "AI Engineering Module 3 is now live.", time: "5 min ago", read: false },
  { id: "2", title: "Pod review scheduled", description: "Sprint review for Pod Alpha on Friday.", time: "1 hr ago", read: false },
  { id: "3", title: "Payment received", description: "Installment 2 of 3 confirmed.", time: "3 hrs ago", read: true },
  { id: "4", title: "Performance gate passed", description: "You cleared Module 2 gate with 82%.", time: "1 day ago", read: true },
];

interface TopBarProps {
  portalName: string;
  userName?: string;
  userRole?: "learner" | "instructor" | "admin" | "super-admin" | "corporate";
  avatarUrl?: string;
}

const ROLE_COLORS: Record<string, string> = {
  learner: "bg-brand-600",
  instructor: "bg-accent-600",
  admin: "bg-purple-600",
  "super-admin": "bg-surface-800",
  corporate: "bg-amber-600",
};

const ROLE_LABELS: Record<string, string> = {
  learner: "Learner",
  instructor: "Instructor",
  admin: "Admin",
  "super-admin": "Super Admin",
  corporate: "Corporate",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function TopBar({ portalName, userName = "Kofi Mensah", userRole = "learner", avatarUrl }: TopBarProps) {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const pathname = usePathname();
  const portalBase = "/" + (pathname.split("/")[1] || "learner");
  const profileHref = `${portalBase}/profile`;

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    if (open || profileOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, profileOpen]);

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function markRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-surface-200 bg-surface-0 px-4 lg:px-6">
      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={toggleSidebar}
        className="lg:hidden rounded-md p-2 text-surface-500 hover:bg-surface-100 hover:text-surface-700"
        aria-label="Toggle navigation menu"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {/* Logo + portal name */}
      <div className="flex items-center gap-2">
        <span className="font-sans font-bold text-brand-700 text-heading-sm">KoreField</span>
        <span className="hidden sm:inline text-surface-400">|</span>
        <span className="hidden sm:inline text-body-sm text-surface-600">{portalName}</span>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="relative rounded-md p-2 text-surface-500 hover:bg-surface-100 hover:text-surface-700 transition-colors"
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
            aria-expanded={open}
            aria-haspopup="true"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-status-error text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {open && (
            <div
              className="absolute right-0 top-full mt-2 w-80 rounded-card border border-surface-200 bg-surface-0 shadow-lg"
              role="menu"
              aria-label="Notifications"
            >
              <div className="flex items-center justify-between border-b border-surface-200 px-4 py-3">
                <span className="text-body-sm font-medium text-surface-900">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="text-caption text-brand-600 hover:text-brand-700 transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <ul className="max-h-80 overflow-y-auto divide-y divide-surface-100" role="list">
                {notifications.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => markRead(n.id)}
                      className={`w-full text-left px-4 py-3 hover:bg-surface-50 transition-colors ${!n.read ? "bg-brand-50/40" : ""}`}
                    >
                      <div className="flex items-start gap-2">
                        {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-600" />}
                        <div className={!n.read ? "" : "pl-4"}>
                          <p className="text-body-sm font-medium text-surface-900">{n.title}</p>
                          <p className="text-caption text-surface-500 mt-0.5">{n.description}</p>
                          <p className="text-caption text-surface-400 mt-1">{n.time}</p>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
              {notifications.length === 0 && (
                <div className="px-4 py-8 text-center text-body-sm text-surface-500">
                  No notifications
                </div>
              )}
            </div>
          )}
        </div>

        {/* User avatar with dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-lg p-1 hover:bg-surface-100 transition-colors"
            aria-label="Account menu"
            aria-expanded={profileOpen}
            aria-haspopup="true"
          >
            <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white overflow-hidden ${ROLE_COLORS[userRole] || "bg-brand-600"}`}>
              {avatarUrl ? (
                <img src={avatarUrl} alt={userName} className="h-full w-full object-cover" />
              ) : (
                getInitials(userName)
              )}
            </span>
            <span className="hidden md:block text-body-sm text-surface-700">{userName}</span>
          </button>

          {profileOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-56 rounded-card border border-surface-200 bg-surface-0 shadow-lg"
              role="menu"
              aria-label="Account menu"
            >
              <div className="border-b border-surface-200 px-4 py-3">
                <p className="text-body-sm font-medium text-surface-900">{userName}</p>
                <p className="text-caption text-surface-500">{ROLE_LABELS[userRole] || userRole}</p>
              </div>
              <ul className="py-1" role="list">
                <li>
                  <Link href={profileHref} className="flex w-full items-center gap-2 px-4 py-2 text-body-sm text-surface-700 hover:bg-surface-50 transition-colors" onClick={() => setProfileOpen(false)}>
                    <User className="h-4 w-4 text-surface-400" />
                    Profile
                  </Link>
                </li>
                <li>
                  <Link href={profileHref} className="flex w-full items-center gap-2 px-4 py-2 text-body-sm text-surface-700 hover:bg-surface-50 transition-colors" onClick={() => setProfileOpen(false)}>
                    <Settings className="h-4 w-4 text-surface-400" />
                    Settings
                  </Link>
                </li>
              </ul>
              <div className="border-t border-surface-200 py-1">
                <button type="button" onClick={() => { setProfileOpen(false); window.location.href = "/"; }} className="flex w-full items-center gap-2 px-4 py-2 text-body-sm text-status-error hover:bg-red-50 transition-colors">
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
