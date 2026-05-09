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
    default: "KoreField Academy | Practical AI, Coding & Digital Skills Training",
    template: "%s | KoreField Academy",
  },
  description: "KoreField Academy is the talent development front door for KoreField Energy & Technology, offering practical AI, coding, digital skills, school programmes, corporate training, and bootcamps.",
  applicationName: "KoreField Academy",
  keywords: [
    "KoreField Academy",
    "practical AI training Nigeria",
    "AI bootcamp Nigeria",
    "Python bootcamp Nigeria",
    "AI training Lagos",
    "coding bootcamp Nigeria",
    "school AI program",
    "corporate AI training Nigeria",
    "digital skills training",
  ],
  alternates: {
    canonical: "https://academy.korefield.com",
  },
  icons: {
    icon: [
      {
        url: "/logo.svg",
        type: "image/svg+xml",
      },
      {
        url: "/images/korefield-logo.png",
        type: "image/png",
        sizes: "32x32",
      },
    ],
    apple: "/images/korefield-logo.png",
  },
  openGraph: {
    type: "website",
    url: "https://academy.korefield.com",
    title: "KoreField Academy | Practical AI, Coding & Digital Skills Training",
    description: "Practical AI, coding, digital skills, school programmes, and corporate training from KoreField Academy.",
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
    title: "KoreField Academy | Practical AI, Coding & Digital Skills Training",
    description: "Practical AI, coding, digital skills, school programmes, and corporate training from KoreField Academy.",
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
