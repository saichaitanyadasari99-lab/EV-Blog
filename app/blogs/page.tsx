import type { Metadata } from "next";
import { getPublishedPosts } from "@/lib/posts";
import type { PostRecord } from "@/types/post";
import { BlogsClientView } from "@/components/BlogsClientView";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.evpulse.co.in";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "All EV Battery Articles & Technical Analysis",
  description:
    "Browse the complete archive of EV battery research notes, benchmarks, and explainers — covering cell chemistry, BMS design, thermal management, charging infrastructure, and vehicle reviews.",
  alternates: { canonical: `${baseUrl}/blogs` },
  openGraph: {
    title: "All EV Battery Articles & Technical Analysis — EVPulse",
    description:
      "Browse the complete archive of EV battery research notes, benchmarks, and explainers covering cell chemistry, BMS design, thermal management, and charging.",
  },
};

const CATEGORY_ORDER = [
  "cell-chemistry",
  "bms-design",
  "ev-benchmarks",
  "vehicle-reviews",
  "standards",
  "news",
];

const categoryAliases: Record<string, string> = {
  post:                       "cell-chemistry",
  "cell-chemistry":           "cell-chemistry",
  "bms-design":               "bms-design",
  bms:                        "bms-design",       // merge raw "bms" into bms-design
  benchmark:                  "ev-benchmarks",
  "ev-benchmarks":            "ev-benchmarks",
  review:                     "vehicle-reviews",
  "vehicle-reviews":          "vehicle-reviews",
  standards:                  "standards",
  news:                       "news",
  thermal:                    "thermal",
  deepdive:                   "deepdive",
  "deep-dive":                "deepdive",
  "charging":                 "charging",
  "charging-&-infrastructure":"charging",
  "charging-infrastructure":  "charging",
  "policy-analysis":          "policy-analysis",
  "policy":                   "policy-analysis",
};

function canonicalCat(category?: string | null) {
  const key = (category ?? "uncategorized").toLowerCase().trim();
  return categoryAliases[key] ?? key;
}

export default async function BlogsPage() {
  let posts: PostRecord[] = [];

  try {
    posts = await getPublishedPosts();
  } catch (err) {
    console.error("Error loading posts:", err);
  }

  /* ── Build counts ── */
  const categoryCounts: Record<string, number> = {};
  for (const post of posts) {
    const cat = canonicalCat(post.category);
    categoryCounts[cat] = (categoryCounts[cat] ?? 0) + 1;
  }

  /* ── Ordered category list ── */
  const allCats = [...new Set(posts.map(p => canonicalCat(p.category)))];
  const categories = [
    ...CATEGORY_ORDER.filter(c => allCats.includes(c)),
    ...allCats.filter(c => !CATEGORY_ORDER.includes(c)),
  ];

  return (
    <main className="page-main wrapper">
      {/* Page hero */}
      <section className="page-hero page-hero-center">
        <div className="hero-badge">Articles</div>
        <h1 className="page-title">All Published Articles</h1>
        <p className="page-subtitle">
          A complete archive of EV battery research notes, benchmarks, and explainers.
        </p>
      </section>

      {/* Slothui-style sidebar + article grid */}
      <BlogsClientView
        posts={posts}
        categories={categories}
        categoryCounts={categoryCounts}
      />
    </main>
  );
}
