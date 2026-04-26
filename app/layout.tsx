import type { Metadata, Viewport } from "next";
import { DM_Sans, IBM_Plex_Mono, Syne } from "next/font/google";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SkipLink } from "@/components/SkipLink";
import "katex/dist/katex.min.css";
import "./globals.css";
import { ORGANIZATION_SCHEMA } from "@/lib/schema";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const ibmMono = IBM_Plex_Mono({
  variable: "--font-ibm-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
});

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.evpulse.co.in";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "VoltPulse - Battery and EV Technology Newsroom",
    template: "%s | VoltPulse",
  },
  description: "Deep-dive technical analysis, battery engineering insights, and EV benchmarks for engineers and enthusiasts.",
  keywords: ["EV batteries", "battery technology", "electric vehicles", "BMS", "BMS design", "battery thermal management", "charging technology", "EV benchmarks"],
  authors: [{ name: "VoltPulse Team" }],
  creator: "VoltPulse",
  publisher: "VoltPulse",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "VoltPulse",
    title: "VoltPulse - Battery and EV Technology Newsroom",
    description: "Deep-dive technical analysis, battery engineering insights, and EV benchmarks for engineers and enthusiasts.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "VoltPulse",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VoltPulse - Battery and EV Technology Newsroom",
    description: "Deep-dive technical analysis, battery engineering insights, and EV benchmarks.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className={`${syne.variable} ${dmSans.variable} ${ibmMono.variable} h-full antialiased`}
    >
      <head>
        <meta name="theme-color" content="#0099b8" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="VoltPulse" />
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_SCHEMA) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <SkipLink />
        <SiteHeader />
        <main id="main-content" className="flex-1 main-content-with-header" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
