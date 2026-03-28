/**
 * @file notification-store.ts
 * Zustand store for managing in-app notifications.
 * Provides role-specific fallback notifications, mark-read, mark-all-read,
 * and push subscription registration via the Notification API.
 */
import { create } from "zustand";

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  category: string;
  action_url?: string;
  read: boolean;
  created_at: string;
}

/** Role-specific fallback notifications shown before backend is connected. */
const ROLE_NOTIFICATIONS: Record<string, AppNotification[]> = {
  learner: [
    { id: "n1", title: "AI Foundation School unlocked", body: "Complete all 5 modules to access paid tracks.", category: "enrollment", action_url: "/learner/foundation", read: false, created_at: new Date(Date.now() - 300000).toISOString() },
    { id: "n2", title: "New lesson available", body: "AI Literacy Module 1: What Is Artificial Intelligence?", category: "content", action_url: "/learner/lessons", read: false, created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: "n3", title: "Payment confirmed", body: "Installment 1 of 3 received. Next due in 30 days.", category: "payment", read: true, created_at: new Date(Date.now() - 86400000).toISOString() },
    { id: "n4", title: "Performance gate passed", body: "You cleared Module 2 gate with 82%.", category: "certification", read: true, created_at: new Date(Date.now() - 172800000).toISOString() },
  ],
  instructor: [
    { id: "n1", title: "New submission", body: "Kwame Asante submitted Lab 3 — Python for AI.", category: "content", action_url: "/instructor/grading", read: false, created_at: new Date(Date.now() - 600000).toISOString() },
    { id: "n2", title: "Lab session tomorrow", body: "REST APIs lab scheduled for 10:00 AM WAT.", category: "content", action_url: "/instructor/schedule", read: false, created_at: new Date(Date.now() - 7200000).toISOString() },
    { id: "n3", title: "Cohort risk alert", body: "3 learners in AI Engineering Beginner flagged for inactivity.", category: "system", action_url: "/instructor", read: true, created_at: new Date(Date.now() - 86400000).toISOString() },
  ],
  admin: [
    { id: "n1", title: "New job application", body: "Amara Osei applied for Full-Stack Engineer.", category: "recruitment", action_url: "/admin/recruitment", read: false, created_at: new Date(Date.now() - 900000).toISOString() },
    { id: "n2", title: "Enrollment spike", body: "12 new enrollments in the last 24 hours.", category: "enrollment", action_url: "/admin/enrollments", read: false, created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: "n3", title: "Payment overdue", body: "2 learners have overdue installments past grace period.", category: "payment", action_url: "/admin/payments", read: true, created_at: new Date(Date.now() - 86400000).toISOString() },
  ],
  "super-admin": [
    { id: "n1", title: "Revenue milestone", body: "Monthly revenue crossed $50,000 for the first time.", category: "system", action_url: "/super-admin/revenue", read: false, created_at: new Date(Date.now() - 1800000).toISOString() },
    { id: "n2", title: "New coupon redeemed", body: "LAUNCH2026 used 128 times (500 limit).", category: "payment", action_url: "/super-admin/coupons", read: false, created_at: new Date(Date.now() - 7200000).toISOString() },
    { id: "n3", title: "AI agent latency spike", body: "Tutor Agent p95 latency exceeded 3s threshold.", category: "system", action_url: "/super-admin/ai", read: false, created_at: new Date(Date.now() - 14400000).toISOString() },
    { id: "n4", title: "Certificate issued", body: "KFCERT-2026-A7X3K issued to Fatima Bello.", category: "certification", read: true, created_at: new Date(Date.now() - 86400000).toISOString() },
  ],
};

interface NotificationState {
  notifications: AppNotification[];
  pushPermission: NotificationPermission | "default";
  /** Initialize notifications for a role (uses fallback data until backend connected). */
  init: (role: string) => void;
  /** Mark a single notification as read. */
  markRead: (id: string) => void;
  /** Mark all notifications as read. */
  markAllRead: () => void;
  /** Add a new notification (from WebSocket/SSE or push event). */
  addNotification: (n: AppNotification) => void;
  /** Request browser push permission and register subscription. */
  requestPushPermission: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  pushPermission: typeof window !== "undefined" && "Notification" in window ? Notification.permission : "default",

  init: (role: string) => {
    const fallback = ROLE_NOTIFICATIONS[role] || ROLE_NOTIFICATIONS["learner"];
    set({ notifications: fallback });
  },

  markRead: (id: string) => {
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  },

  markAllRead: () => {
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    }));
  },

  addNotification: (n: AppNotification) => {
    set((s) => ({ notifications: [n, ...s.notifications] }));

    // Show browser notification if permission granted
    if (get().pushPermission === "granted" && typeof window !== "undefined" && "Notification" in window) {
      new Notification(n.title, {
        body: n.body,
        icon: "/favicon.ico",
        tag: n.id,
      });
    }
  },

  requestPushPermission: async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    const permission = await Notification.requestPermission();
    set({ pushPermission: permission });

    if (permission === "granted") {
      // In production: register service worker + push subscription
      // and POST to /notifications/push/subscribe
      console.log("[Push] Permission granted — ready for push notifications");
    }
  },
}));
