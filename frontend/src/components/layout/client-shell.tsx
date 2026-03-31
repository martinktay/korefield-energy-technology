"use client";
/** @file client-shell.tsx — Client boundary wrapper for root layout. Provides QueryProvider and SiteFooter. */

import { QueryProvider } from "@/providers/query-provider";
import { SiteFooter } from "./site-footer";
import { ToastContainer } from "@/components/ui/toast";

export function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      {children}
      <SiteFooter />
      <ToastContainer />
    </QueryProvider>
  );
}
