import type { Metadata } from "next";
import { PostCard } from "@/components/PostCard";
import { getPublishedPosts } from "@/lib/posts";
import Link from "next/link";
import type { PostRecord } from "@/types/post";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.evpulse.co.in";

export const metadata: Metadata = {
  title: "All EV Battery Articles & Technical Analysis",
  description: "Browse the complete archive of EV battery research notes, benchmarks, and explainers — covering cell chemistry, BMS design, thermal management, charging infrastructure, and vehicle reviews.",
  alternates: { canonical: `${baseUrl}/blogs` },
  openGraph: {
    title: "All EV Battery Articles & Technical Analysis — EVPulse",
    description: "Browse the complete archive of EV battery research notes, benchmarks, and explainers covering cell chemistry, BMS design, thermal management, and charging.",
  },
};

type SectionSpec = {
  title: string;
  keyword: string;
  category: string;
  tag?: string;
};

const defaultSections: SectionSpec[] = [
  { title: "Cell Chemistry", keyword: "Keywords: DCIR, OCV-SOC, silicon anode, calendar aging", category: "cell-chemistry" },
  { title: "Pack and BMS Design", keyword: "Keywords: EKF, balancing, ISO 26262, runaway detection", category: "bms-design" },
  { title: "EV Benchmarks", keyword: "Keywords: charging taper, winter range, regen efficiency", category: "ev-benchmarks" },
  { title: "Vehicle Reviews", keyword: "Keywords: real-world range, thermal behavior, long-term efficiency", category: "vehicle-reviews" },
  { title: "Standards and Compliance", keyword: "Keywords: UN ECE R100, UL 2580, ISO 15118, IEC 61851", category: "standards" },
  { title: "News", keyword: "Keywords: Latest EV and battery industry news", category: "news" },
];

const CATEGORY_ICONS: Record<string, string> = {
  "cell-chemistry": "◉",
  "bms-design": "◈",
  "ev-benchmarks": "◎",
  "vehicle-reviews": "◇",
  "standards": "◻",
  "news": "◉",
};

const CATEGORY_COLORS: Record<string, string> = {
  "cell-chemistry": "#00d8f2",
  "bms-design": "#7c3aed",
  "ev-benchmarks": "#ff6b35",
  "vehicle-reviews": "#00d68f",
  "standards": "#ffd60a",
  "news": "#00d8f2",
};

const categoryAliases: Record<string, string> = {
  post: "cell-chemistry",
  "cell-chemistry": "cell-chemistry",
  "deep-dive": "bms-design",
  "bms-design": "bms-design",
  benchmark: "ev-benchmarks",
  "ev-benchmarks": "ev-benchmarks",
  review: "vehicle-reviews",
  "vehicle-reviews": "vehicle-reviews",
  standards: "standards",
  news: "news",
};

function canonicalCategory(category?: string | null) {
  const key = (category ?? "uncategorized").toLowerCase().trim();
  return categoryAliases[key] ?? key;
}

function getSectionTitle(category: string): string {
  const found = defaultSections.find((s) => s.category === category);
  if (found) return found.title;
  return category
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function getSectionKeywords(category: string): string {
  const found = defaultSections.find((s) => s.category === category);
  if (found) return found.keyword;
  return "Latest articles";
}

export default async function BlogsPage() {
  let posts: PostRecord[] = [];
  
  try {
    posts = await getPublishedPosts();
  } catch (err) {
    console.error("Error loading posts:", err);
  }

  const grouped = new Map<string, PostRecord[]>();
  for (const post of posts) {
    const key = canonicalCategory(post.category);
    const bucket = grouped.get(key) ?? [];
    bucket.push(post);
    grouped.set(key, bucket);
  }

  const categories = [...grouped.keys()];

  const sortedCategories = categories.sort((a, b) => {
    const aIsDefault = defaultSections.some((s) => s.category === a);
    const bIsDefault = defaultSections.some((s) => s.category === b);
    if (aIsDefault && !bIsDefault) return -1;
    if (!aIsDefault && bIsDefault) return 1;
    return a.localeCompare(b);
  });

return (
    <main className="page-main wrapper">
      <section className="page-hero page-hero-center">
        <div className="hero-badge">BLOGS</div>
        <h1 className="page-title">All Published Articles</h1>
        <p className="page-subtitle">A complete archive of EV battery research notes, benchmarks, and explainers.</p>
      </section>

      <section className="category-cards">
        {sortedCategories.map((category) => {
          const categoryPosts = grouped.get(category) ?? [];
          const color = CATEGORY_COLORS[category] || "#00d8f2";
          const icon = CATEGORY_ICONS[category] || "◎";
          return (
            <Link key={category} href={`/category/${category}`} className="category-card" style={{ borderColor: color }}>
              <span className="category-icon" style={{ color: color }}>{icon}</span>
              <span className="category-name">{getSectionTitle(category)}</span>
              <span className="category-count">{categoryPosts.length} articles</span>
            </Link>
          );
        })}
      </section>

      {sortedCategories.map((category) => {
        const categoryPosts = grouped.get(category) ?? [];
        const totalPosts = categoryPosts.length;

        if (totalPosts === 0) return null;

        return (
          <section key={category} className="section-block">
            <div className="sec-head">
              <h2 className="sec-title">
                {getSectionTitle(category)} ({totalPosts})
              </h2>
            </div>
            <p className="section-keywords">{getSectionKeywords(category)}</p>
            <div className="articles-grid five-grid">
              {categoryPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
            {totalPosts > 6 && (
              <div className="sec-foot">
                <Link href={`/category/${category}`} className="sec-link">
                  View all {totalPosts} articles →
                </Link>
              </div>
            )}
          </section>
        );
      })}
    </main>
  );
}
