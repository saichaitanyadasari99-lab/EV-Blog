import Link from "next/link";
import { getPublishedPosts } from "@/lib/posts";
import { PostCard } from "@/components/PostCard";
import { getCategoryTone } from "@/lib/category-theme";

export default async function HomePage() {
  const posts = await getPublishedPosts();
  const hero = posts[0];
  const side = posts.slice(1, 4);
  const topStories = posts.slice(0, 5);
  const moreStories = posts.slice(5, 10);
  const trending = posts.slice(0, 5);

  const tickerItems = posts.length
    ? posts.slice(0, 6).map((post) => post.title)
    : ["Publish from admin to populate the live ticker."];

  return (
    <main className="page-main wrapper">
      <section className="ticker">
        <div className="ticker-label">
          <span className="ticker-live">LIVE</span>
        </div>
        <div className="ticker-track">
          <div className="ticker-inner">
            {[...tickerItems, ...tickerItems].map((item, idx) => (
              <div key={`${item}-${idx}`} className="ticker-item">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="hero-grid" style={{ marginTop: 16 }}>
        <article className="hero-main">
          <div
            className="hero-media"
            style={{
              background: hero?.cover_url
                ? `url(${hero.cover_url}) center/cover`
                : "linear-gradient(135deg,#0A1628 0%,#142040 40%,#0D2035 100%)",
            }}
          />
          <div className="hero-overlay" />
          <div className="hero-content">
            <span className="hero-badge">{hero?.category ?? "FEATURED"}</span>
            <h1 className="hero-title">
              {hero ? <Link href={`/blog/${hero.slug}`}>{hero.title}</Link> : "VoltPulse battery and EV technology coverage"}
            </h1>
            <p className="hero-meta">
              {hero ? `${new Date(hero.created_at).toLocaleDateString()}  |  ${hero.reading_time ?? 1} min read` : "No posts yet"}
            </p>
          </div>
        </article>

        <aside className="hero-side">
          {(side.length ? side : [null, null, null]).map((post, i) => (
            <article key={post?.id ?? `side-${i}`} className="side-card">
              <div
                className="side-thumb"
                style={{
                  background: post?.cover_url
                    ? `url(${post.cover_url}) center/cover`
                    : "linear-gradient(135deg,#0A1A0A 0%,#0D2D15 40%,#071A0A 100%)",
                }}
              />
              <div>
                <p className="side-badge" style={{ color: getCategoryTone(post?.category ?? "news") }}>
                  {post?.category ?? "UPDATE"}
                </p>
                <h3 className="side-title">
                  {post ? <Link href={`/blog/${post.slug}`}>{post.title}</Link> : "Additional story slot"}
                </h3>
              </div>
            </article>
          ))}
        </aside>
      </section>

      <section className="cat-tabs">
        {["All", "Cell Chemistry", "BMS Design", "Thermal", "Charging", "Market"].map((item, idx) => (
          <span key={item} className={`cat-tab ${idx === 0 ? "active" : ""}`}>
            {item}
          </span>
        ))}
      </section>

      <section className="sec-head">
        <h2 className="sec-title">Top Stories</h2>
        <Link href="/blogs" className="sec-link">
          View all {"->"}
        </Link>
      </section>
      <section className="articles-grid">
        {(topStories.length ? topStories : [null, null, null, null, null]).map((post, idx) =>
          post ? (
            <PostCard key={post.id} post={post} />
          ) : (
            <article key={`top-f-${idx}`} className="a-card">
              <div className="a-card-img" style={{ background: "var(--surface3)" }} />
              <div className="a-card-body">
                <span className="a-badge" style={{ background: "var(--surface3)", color: "var(--text3)" }}>
                  ARTICLE
                </span>
                <h3 className="a-title">Waiting for next post</h3>
                <p className="a-excerpt">Publish more articles to fill this slot.</p>
              </div>
            </article>
          ),
        )}
      </section>

      <section className="sec-head">
        <h2 className="sec-title">Deep Dive</h2>
        <Link href="/blogs" className="sec-link">
          All deep dives {"->"}
        </Link>
      </section>
      <section className="featured-row">
        <article className="feat-card">
          <div
            className="feat-img"
            style={{
              background: hero?.cover_url
                ? `url(${hero.cover_url}) center/cover`
                : "linear-gradient(135deg,#091830 0%,#0F2A4A 40%,#072038 100%)",
            }}
          />
          <div className="feat-body">
            <span className="a-badge" style={{ background: "var(--purple-dim)", color: "var(--purple)" }}>
              DEEP DIVE
            </span>
            <h3 className="feat-title">
              {hero ? <Link href={`/blog/${hero.slug}`}>{hero.title}</Link> : "Deep technical breakdowns appear here"}
            </h3>
            <p className="feat-excerpt">{hero?.excerpt ?? "Add more long-form content from your admin editor."}</p>
          </div>
        </article>

        <aside className="trending-panel">
          <h3 className="sec-title" style={{ fontSize: 14 }}>
            Trending
          </h3>
          {(trending.length ? trending : [null, null, null, null, null]).map((post, idx) => (
            <article key={post?.id ?? `tr-${idx}`} className="trend-item">
              <span className="trend-num">{String(idx + 1).padStart(2, "0")}</span>
              <p className="trend-title">{post ? <Link href={`/blog/${post.slug}`}>{post.title}</Link> : "Trending slot pending"}</p>
            </article>
          ))}
        </aside>
      </section>

      <section className="nl-banner">
        <div>
          <h3 className="nl-title">
            The <span style={{ color: "var(--accent)" }}>VoltPulse</span> Weekly Briefing
          </h3>
          <p className="nl-text">Deep-dive technical analysis every Thursday.</p>
        </div>
        <form className="nl-form">
          <input className="nl-input" placeholder="your@email.com" />
          <button type="button" className="nl-btn">
            SUBSCRIBE {"->"}
          </button>
        </form>
      </section>

      <section className="sec-head">
        <h2 className="sec-title">More Articles</h2>
        <Link href="/blogs" className="sec-link">
          View all {"->"}
        </Link>
      </section>
      <section className="grid-4">
        {(moreStories.length ? moreStories : [null, null, null, null, null]).map((post, idx) =>
          post ? (
            <PostCard key={post.id} post={post} />
          ) : (
            <article key={`more-f-${idx}`} className="a-card">
              <div className="a-card-img" style={{ background: "var(--surface3)" }} />
              <div className="a-card-body">
                <span className="a-badge" style={{ background: "var(--surface3)", color: "var(--text3)" }}>
                  ARTICLE
                </span>
                <h3 className="a-title">Upcoming article card</h3>
              </div>
            </article>
          ),
        )}
      </section>
    </main>
  );
}




