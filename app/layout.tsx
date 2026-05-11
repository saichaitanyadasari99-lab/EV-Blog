import type { Metadata, Viewport } from "next";
import { DM_Sans, IBM_Plex_Mono, Syne } from "next/font/google";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SkipLink } from "@/components/SkipLink";
import "katex/dist/katex.min.css";
import "./globals.css";
import { ORGANIZATION_SCHEMA, WEBSITE_SCHEMA } from "@/lib/schema";

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
    default: "EVPulse — EV Battery Technology Newsroom & Engineering Calculators",
    template: "%s | EVPulse",
  },
  description: "Deep-dive technical analysis on EV batteries, BMS design, cell chemistry (LFP, NMC, Na-ion), thermal management, charging infrastructure, and EV benchmarks. Free engineering calculators for pack design, SOC estimation, and thermal analysis.",
  keywords: ["EV battery", "electric vehicle", "BMS design", "battery management system", "LFP battery", "NMC battery", "sodium ion battery", "thermal management", "EV charging", "battery pack design", "SOC estimation", "EV benchmarks", "battery engineering", "cell chemistry", "immersion cooling", "CCS charging", "ISO 15118", "UN ECE R100"],
  authors: [{ name: "Sai Chaitanya Dasari", url: "https://www.linkedin.com/in/dasarisaisrinivasachaitanya" }],
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
    title: "EVPulse — EV Battery Technology Newsroom & Engineering Calculators",
    description: "Deep-dive technical analysis on EV batteries, BMS design, cell chemistry, thermal management, and charging infrastructure. Free engineering calculators for pack design, SOC estimation, and thermal analysis.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "EVPulse — EV Battery Technology Newsroom",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "EVPulse — EV Battery Technology Newsroom & Engineering Calculators",
    description: "Deep-dive EV battery technical analysis, BMS design, cell chemistry, and free engineering calculators.",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_SCHEMA) }}
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
window.evpulsePollVote = async function(pollId, idx) {
  var storageKey = 'evpulse_poll_' + pollId;
  if (localStorage.getItem(storageKey)) return;
  try {
    var res = await fetch('/api/poll', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({pollId: pollId, optionIndex: idx})
    });
    if (res.status === 409) { localStorage.setItem(storageKey, '1'); return; }
    if (!res.ok) return;
    var data = await res.json();
    localStorage.setItem(storageKey, '1');
    var btns = document.querySelectorAll('[data-poll="' + pollId + '"]');
    evpulseShowPollResults(pollId, data.counts, data.total);
  } catch(e) {}
};
window.evpulseShowPollResults = function(pollId, counts, total) {
  var btns = document.querySelectorAll('[data-poll="' + pollId + '"]');
  btns.forEach(function(btn) {
    var i = parseInt(btn.getAttribute('data-option'), 10);
    var bar = document.getElementById(pollId + '_bar' + i);
    var pct = document.getElementById(pollId + '_pct' + i);
    var count = (counts || {})[i] || 0;
    var p = total > 0 ? Math.round(count / total * 100) : 0;
    btn.disabled = true;
    if (bar) setTimeout(function(){bar.style.width = p + '%';}, 50);
    if (pct) pct.textContent = p + '%';
  });
  var container = document.getElementById(pollId);
  var note = container ? container.querySelector('.poll-note') : null;
  if (note) note.textContent = total + ' vote' + (total !== 1 ? 's' : '');
};
window.evpulseLoadPolls = function() {
  document.querySelectorAll('.poll-block[data-poll-id]').forEach(function(el) {
    var pollId = el.getAttribute('data-poll-id');
    if (localStorage.getItem('evpulse_poll_' + pollId)) {
      var storageKey = 'evpulse_poll_data_' + pollId;
      var cached = localStorage.getItem(storageKey);
      if (cached) {
        try {
          var d = JSON.parse(cached);
          evpulseShowPollResults(pollId, d.counts, d.total);
          return;
        } catch(e) {}
      }
    }
    fetch('/api/poll?pollId=' + encodeURIComponent(pollId))
      .then(function(r){return r.json();})
      .then(function(data) {
        localStorage.setItem('evpulse_poll_data_' + pollId, JSON.stringify(data));
        evpulseShowPollResults(pollId, data.counts, data.total);
      })
      .catch(function(){});
  });
};
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    window.evpulseLoadPolls();
    document.addEventListener('click', function(e) {
      var btn = e.target.closest('.poll-option[data-poll]');
      if (btn) {
        var pollId = btn.getAttribute('data-poll');
        var idx = parseInt(btn.getAttribute('data-option'), 10);
        window.evpulsePollVote(pollId, idx);
      }
    });
  });
} else {
  window.evpulseLoadPolls();
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('.poll-option[data-poll]');
    if (btn) {
      var pollId = btn.getAttribute('data-poll');
      var idx = parseInt(btn.getAttribute('data-option'), 10);
      window.evpulsePollVote(pollId, idx);
    }
  });
}
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
