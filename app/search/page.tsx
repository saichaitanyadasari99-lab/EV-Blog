import Link from "next/link";
import { searchPublishedPosts } from "@/lib/posts";
import { PostCard } from "@/components/PostCard";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export const revalidate = 0;

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const results = query ? await searchPublishedPosts(query) : [];

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
        <p className="page-subtitle" style={{ marginTop: 12 }}>
          {query
            ? `${results.length} result(s) for "${query}"`
            : "Start with a keyword like LFP, BMS, or thermal."}
        </p>
        <Link href="/blogs" className="sec-link" style={{ marginTop: 8, display: "inline-flex" }}>
          Browse all blogs {"->"}
        </Link>
      </section>

      <section className="sec-head">
        <h2 className="sec-title">Results</h2>
      </section>
      <section className="articles-grid">
        {query ? (
          results.length ? (
            results.map((post) => <PostCard key={post.id} post={post} />)
          ) : (
            <article className="a-card">
              <div className="a-card-body">
                <h3 className="a-title">No results found</h3>
                <p className="a-excerpt">Try a different keyword or browse all posts.</p>
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



