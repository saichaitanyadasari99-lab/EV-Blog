import type { Metadata } from "next";
import Link from "next/link";
import { searchPublishedPosts, getPublishedPosts, canonicalCategory } from "@/lib/posts";
import { PostCard } from "@/components/PostCard";
import { getCategoryTone } from "@/lib/category-theme";

export const metadata: Metadata = {
  title: "Search EV Battery Articles",
  description: "Search EVPulse's complete library of EV battery technical articles, benchmarks, and engineering guides by keyword, category, or date.",
  openGraph: {
    title: "Search EV Battery Articles — EVPulse",
    description: "Search the complete library of EV battery technical articles, benchmarks, and engineering guides.",
  },
};

type Props = {
  searchParams: Promise<{ q?: string; category?: string; date?: string }>;
};

export const revalidate = 0;

const CATEGORIES = [
  { value: "", label: "All Categories" },
  { value: "cell-chemistry", label: "Cell Chemistry" },
  { value: "bms-design", label: "Pack and BMS Design" },
  { value: "ev-benchmarks", label: "EV Benchmarks" },
  { value: "vehicle-reviews", label: "Vehicle Reviews" },
  { value: "standards", label: "Standards" },
  { value: "news", label: "News" },
];

const DATE_OPTIONS = [
  { value: "", label: "Any Time" },
  { value: "7", label: "Past Week" },
  { value: "30", label: "Past Month" },
  { value: "90", label: "Past 3 Months" },
  { value: "365", label: "Past Year" },
];

function filterByDate(posts: any[], days: number | undefined) {
  if (!days) return posts;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return posts.filter((post) => new Date(post.created_at) >= cutoff);
}

export default async function SearchPage({ searchParams }: Props) {
  const { q, category, date } = await searchParams;
  const query = (q ?? "").trim();
  const catFilter = category ?? "";
  const dateFilter = date ? parseInt(date) : undefined;
  
  let allPosts = query ? await searchPublishedPosts(query) : await getPublishedPosts();
  
  if (catFilter) {
    allPosts = allPosts.filter((post) => canonicalCategory(post.category) === canonicalCategory(catFilter));
  }
  
  allPosts = filterByDate(allPosts, dateFilter);
  const results = allPosts;

  return (
    <main className="page-main wrapper">
      <section className="page-hero">
        <div className="hero-badge">SEARCH</div>
        <h1 className="page-title">Search Articles</h1>
        <form action="/search" className="search-form">
          <input
            name="q"
            defaultValue={query}
            placeholder="Search batteries, BMS, charging..."
            className="field-input"
          />
          <button type="submit" className="btn-accent">
            Search
          </button>
        </form>
        
        <div className="search-filters">
          <form action="/search" className="filter-row">
            <input type="hidden" name="q" value={query} />
            <select name="category" defaultValue={catFilter} className="field-select" onChange={(e) => e.currentTarget.form?.submit()}>
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
            <select name="date" defaultValue={date ?? ""} className="field-select" onChange={(e) => e.currentTarget.form?.submit()}>
              {DATE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </form>
        </div>
        
        <p className="page-subtitle" style={{ marginTop: 12 }}>
          {query || catFilter || dateFilter
            ? `${results.length} result(s)`
            : "Start with a keyword like LFP, BMS, or thermal."}
        </p>
        <Link href="/blogs" className="sec-link" style={{ marginTop: 8, display: "inline-flex" }}>
          Browse all blogs {"->"}
        </Link>
      </section>

      {(catFilter || dateFilter) && (
        <div className="active-filters">
          {catFilter && (
            <span className="filter-tag" style={{ background: `${getCategoryTone(catFilter)}22`, color: getCategoryTone(catFilter) }}>
              {CATEGORIES.find(c => c.value === catFilter)?.label}
              <Link href={`/search?q=${query ?? ""}&date=${date ?? ""}`} className="filter-remove">×</Link>
            </span>
          )}
          {dateFilter && (
            <span className="filter-tag">
              {DATE_OPTIONS.find(d => d.value === date)?.label}
              <Link href={`/search?q=${query ?? ""}&category=${catFilter}`} className="filter-remove">×</Link>
            </span>
          )}
        </div>
      )}

      <section className="sec-head">
        <h2 className="sec-title">Results</h2>
      </section>
      <section className="articles-grid">
        {query || catFilter || dateFilter ? (
          results.length ? (
            results.map((post) => <PostCard key={post.id} post={post} />)
          ) : (
            <article className="a-card">
              <div className="a-card-body">
                <h3 className="a-title">No results found</h3>
                <p className="a-excerpt">Try adjusting your filters or search term.</p>
              </div>
            </article>
          )
        ) : (
          <article className="a-card">
            <div className="a-card-body">
              <h3 className="a-title">Enter a query</h3>
              <p className="a-excerpt">Search across title, excerpt, category, and tags.</p>
            </div>
          </article>
        )}
      </section>
    </main>
  );
}