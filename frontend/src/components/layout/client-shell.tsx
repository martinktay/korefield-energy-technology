"use client";
/** @file client-shell.tsx — Client boundary wrapper for root layout. Provides QueryProvider and SiteFooter. */

import { QueryProvider } from "@/providers/query-provider";
import { SiteFooter } from "./site-footer";
import { ToastContainer } from "@/components/ui/toast";
import { CleanUrlParams } from "./clean-url-params";

export function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <CleanUrlParams />
      {children}
      <SiteFooter />
      <ToastContainer />
    </QueryProvider>
  );
}
