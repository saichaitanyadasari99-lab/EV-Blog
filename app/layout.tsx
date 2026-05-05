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
    default: "EVPulse - Battery and EV Technology Newsroom",
    template: "%s | EVPulse",
  },
  description: "Deep-dive technical analysis, battery engineering insights, and EV benchmarks for engineers and enthusiasts.",
  keywords: ["EV batteries", "battery technology", "electric vehicles", "BMS", "BMS design", "battery thermal management", "charging technology", "EV benchmarks"],
  authors: [{ name: "EVPulse Team" }],
  creator: "EVPulse",
  publisher: "EVPulse",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "EVPulse",
    title: "EVPulse - Battery and EV Technology Newsroom",
    description: "Deep-dive technical analysis, battery engineering insights, and EV benchmarks for engineers and enthusiasts.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "EVPulse",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "EVPulse - Battery and EV Technology Newsroom",
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
        <meta name="apple-mobile-web-app-title" content="EVPulse" />
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
        <script dangerouslySetInnerHTML={{ __html: `
window.evpulsePollVote = function(id, idx) {
  var data = JSON.parse(localStorage.getItem(id) || 'null') || {};
  if (data.voted) return;
  data.voted = true;
  data.counts = data.counts || {};
  data.counts[idx] = (data.counts[idx] || 0) + 1;
  localStorage.setItem(id, JSON.stringify(data));
  var opts = document.querySelectorAll('[id^=' + id + '_opt]');
  var n = opts.length;
  evpulseShowPollResults(id, data, n);
};
window.evpulseShowPollResults = function(id, data, n) {
  var total = Object.values(data.counts || {}).reduce(function(a,b){return a+b;},0);
  for (var i = 0; i < n; i++) {
    var btn = document.getElementById(id + '_opt' + i);
    var bar = document.getElementById(id + '_bar' + i);
    var pct = document.getElementById(id + '_pct' + i);
    var count = (data.counts || {})[i] || 0;
    var p = total > 0 ? Math.round(count / total * 100) : 0;
    if (btn) btn.disabled = true;
    if (bar) setTimeout(function(){bar.style.width = p + '%';}, 50);
    if (pct) pct.textContent = p + '%';
  }
  var note = document.querySelector('#' + id + ' .poll-note');
  if (note) note.textContent = total + ' vote' + (total !== 1 ? 's' : '');
};
window.evpulseTab = function(id, idx) {
  var btns = document.querySelectorAll('#' + id + ' .tab-btn');
  var panels = document.querySelectorAll('#' + id + ' .tab-panel');
  btns.forEach(function(b,i){b.classList.toggle('active', i===idx);});
  panels.forEach(function(p,i){p.classList.toggle('active', i===idx);});
};
        ` }} />
      </body>
    </html>
  );
}
