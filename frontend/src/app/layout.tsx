/**
 * @file layout.tsx (Root Layout)
 * Next.js root layout wrapping the entire application.
 * Provides React Query context via QueryProvider for server state management.
 * SiteFooter is rendered via ClientShell to avoid server/client boundary issues.
 */
import type { Metadata } from "next";
import { ClientShell } from "@/components/layout/client-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "KoreField Academy",
  description: "Applied AI learning platform for Africa's workforce",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="font-sans">
      <body>
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
