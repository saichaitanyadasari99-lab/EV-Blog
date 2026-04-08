import { PostCard } from "@/components/PostCard";
import { getPublishedPosts } from "@/lib/posts";
import type { PostRecord } from "@/types/post";

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

function getSectionTitle(category: string): string {
  const found = defaultSections.find(s => s.category === category);
  if (found) return found.title;
  return category.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function getSectionKeywords(category: string): string {
  const found = defaultSections.find(s => s.category === category);
  if (found) return found.keyword;
  return "Latest articles";
}

export default async function BlogsPage() {
  const posts = await getPublishedPosts();
  
  // Get unique categories from posts
  const categories = [...new Set(posts.map(p => p.category || "uncategorized"))];
  
  // Sort categories: default sections first, then custom
  const sortedCategories = categories.sort((a, b) => {
    const aIsDefault = defaultSections.some(s => s.category === a);
    const bIsDefault = defaultSections.some(s => s.category === b);
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

      {sortedCategories.map((category) => {
        const categoryPosts = posts
          .filter((post) => (post.category || "uncategorized") === category)
          .slice(0, 5);

        if (categoryPosts.length === 0) return null;

        return (
          <section key={category} className="section-block">
            <div className="sec-head">
              <h2 className="sec-title">{getSectionTitle(category)} ({categoryPosts.length})</h2>
            </div>
            <p className="section-keywords">{getSectionKeywords(category)}</p>
            <div className="articles-grid five-grid">
              {categoryPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}
