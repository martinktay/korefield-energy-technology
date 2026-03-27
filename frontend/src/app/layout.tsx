/**
 * @file layout.tsx (Root Layout)
 * Next.js root layout wrapping the entire application.
 * Provides React Query context via QueryProvider for server state management.
 * Uses Inter as the primary font per the KoreField design system.
 */
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { QueryProvider } from "@/providers/query-provider";
import { cn } from "@/lib/utils";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

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
    <html lang="en" className={cn("font-sans", inter.variable)}>
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
