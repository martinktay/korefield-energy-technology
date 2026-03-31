/** @file toast.tsx — Global toast notification component with auto-dismiss. */
"use client";

import { useEffect, useState, useCallback } from "react";
import { create } from "zustand";
import { CheckCircle, XCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastState {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (message, type = "success") => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 4000);
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

const ICONS = { success: CheckCircle, error: XCircle, info: Info };
const COLORS = {
  success: "border-green-200 bg-green-50 text-green-800",
  error: "border-red-200 bg-red-50 text-red-800",
  info: "border-brand-200 bg-brand-50 text-brand-800",
};
const ICON_COLORS = { success: "text-green-500", error: "text-red-500", info: "text-brand-500" };

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none" aria-live="polite">
      {toasts.map((t) => {
        const Icon = ICONS[t.type];
        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg animate-in slide-in-from-right-5 fade-in duration-300 ${COLORS[t.type]}`}
            role="status"
          >
            <Icon className={`h-5 w-5 shrink-0 ${ICON_COLORS[t.type]}`} />
            <p className="text-body-sm font-medium flex-1">{t.message}</p>
            <button onClick={() => removeToast(t.id)} className="shrink-0 p-0.5 rounded hover:bg-black/5 transition-colors" aria-label="Dismiss">
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
