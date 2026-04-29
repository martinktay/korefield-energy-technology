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
  metadataBase: new URL("https://academy.korefield.com"),
  title: {
    default: "KoreField Academy",
    template: "%s | KoreField Academy",
  },
  description: "KoreField Academy delivers applied AI education, bootcamps, and workforce training for Africa's next generation of builders.",
  applicationName: "KoreField Academy",
  keywords: [
    "KoreField Academy",
    "AI Holiday Bootcamp",
    "AI bootcamp Nigeria",
    "Python for students",
    "AI training Lagos",
    "machine learning bootcamp",
    "secondary school AI program",
    "KETL Academy",
  ],
  alternates: {
    canonical: "https://academy.korefield.com",
  },
  openGraph: {
    type: "website",
    url: "https://academy.korefield.com",
    title: "KoreField Academy",
    description: "Applied AI education, bootcamps, and workforce training for Africa's next generation of builders.",
    siteName: "KoreField Academy",
    locale: "en_NG",
    images: [
      {
        url: "https://korefield.com/images/sovereign-ai-viz.png",
        width: 1200,
        height: 630,
        alt: "KoreField Academy AI bootcamp and applied learning program",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "KoreField Academy",
    description: "Applied AI education, bootcamps, and workforce training for Africa's next generation of builders.",
    images: ["https://korefield.com/images/sovereign-ai-viz.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
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
