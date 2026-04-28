import Link from "next/link";
import { getPublishedPosts } from "@/lib/posts";
import { PostCard } from "@/components/PostCard";
import { getCategoryTone } from "@/lib/category-theme";
import { NewsletterForm } from "@/components/NewsletterForm";
import type { PostRecord } from "@/types/post";

export default async function HomePage() {
  let posts: PostRecord[] = [];
  
  try {
    posts = await getPublishedPosts();
  } catch (err) {
    console.error("Error loading posts:", err);
  }
  
  const hero = posts[0];
  const side = posts.slice(1, 4);
  const topStories = posts.slice(0, 5);
  const moreStories = posts.slice(5, 11);
  const trending = posts.slice(0, 5);
  const hot = posts.find(p => p.category?.toLowerCase().includes("hot") || p.title.toLowerCase().includes("analysis")) ?? posts[0];

  const tickerItems = posts.length
    ? posts.slice(0, 6)
    : [];

  return (
    <main className="page-main wrapper">
{/* Hero Section */}
      <section className="home-hero">
        <div className="home-hero-content">
          <div className="home-hero-text">
            <span className="home-hero-label">EV Battery & Energy Technology</span>
            <h1 className="home-hero-title">
              Engineering clarity for the <span className="accent-text">EV era</span>
            </h1>
            <p className="home-hero-desc">
              Deep-dive technical analysis, battery engineering insights, and engineering tools for EV professionals and enthusiasts.
            </p>
            <div className="home-hero-cta">
              <Link href="/blogs" className="hero-btn primary">
                Explore Articles
              </Link>
              <Link href="/calculators" className="hero-btn secondary">
                Battery Tools
              </Link>
            </div>
            <div className="home-hero-stats">
              <div className="stat-item">
                <span className="stat-num">{posts.length}+</span>
                <span className="stat-label">Technical Articles</span>
              </div>
              <div className="stat-item">
                <span className="stat-num">6</span>
                <span className="stat-label">Calculators</span>
              </div>
              <div className="stat-item">
                <span className="stat-num">Weekly</span>
                <span className="stat-label">Updates</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Ticker */}
      <section className="ticker">
        <div className="ticker-label">
          <span className="ticker-live">LIVE</span>
        </div>
        <div className="ticker-track">
          <div className="ticker-inner">
            {[...tickerItems, ...tickerItems].map((post, idx) => (
              <Link key={`${post.id}-${idx}`} href={`/blog/${post.slug}`} className="ticker-item">
                {post.title}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Article */}
      {hero && (
        <section className="home-featured">
          <span className="section-label">Featured</span>
          <Link href={`/blog/${hero.slug}`} className="featured-card">
            <div 
              className="featured-image"
              style={{
                backgroundImage: hero.cover_url ? `url(${hero.cover_url})` : "linear-gradient(135deg,#0A1628 0%,#142040 40%,#0D2035 100%)"
              }}
            />
            <div className="featured-content">
              <span className="featured-badge">{hero.category}</span>
              <h2 className="featured-title">{hero.title}</h2>
              <p className="featured-excerpt">{hero.excerpt}</p>
              <div className="featured-meta">
                <span>{new Date(hero.created_at).toLocaleDateString()}</span>
                <span className="dot">·</span>
                <span>{hero.reading_time ?? 1} min read</span>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* Category Tabs */}
      <section className="cat-tabs">
        {["All", "Cell Chemistry", "BMS Design", "Thermal", "Charging", "Market"].map((item, idx) => (
          <Link 
            key={item} 
            href={item === "All" ? "/blogs" : `/category/${item.toLowerCase().replace(/\s+/g, "-")}`} 
            className={`cat-tab ${idx === 0 ? "active" : ""}`}
          >
            {item}
          </Link>
        ))}
      </section>

      {/* Top Stories Grid */}
      <section className="sec-head">
        <h2 className="sec-title">Latest Articles</h2>
        <Link href="/blogs" className="sec-link">
          View all {"->"}
        </Link>
      </section>
      <section className="articles-grid home-grid">
        {(topStories.length ? topStories : [null, null, null, null, null]).map((post, idx) =>
          post ? (
            <PostCard key={post.id} post={post} featured={idx === 0} />
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

      {/* Calculators Section */}
      <section className="sec-head">
        <h2 className="sec-title">Battery Design Tools</h2>
        <Link href="/calculators" className="sec-link">
          View all {"->"}
        </Link>
      </section>
      <section className="calc-grid-home">
        {[
          { name: "Pack Designer", slug: "pack-size" },
          { name: "Thermal Load", slug: "heat-generation" },
          { name: "Cooling Sizing", slug: "cooling-plate" },
          { name: "Bus Bar", slug: "bus-bar" },
          { name: "SOC Estimator", slug: "soc-estimator" },
          { name: "Charging Time", slug: "charging-time" },
        ].map((calc) => (
          <Link key={calc.slug} href={`/calculators/${calc.slug}`} className="calc-card-home">
            <span className="calc-name">{calc.name}</span>
          </Link>
        ))}
      </section>

      {/* Trending + Deep Dive */}
      <section className="home-deepdive">
        <div className="deepdive-main">
          <span className="section-label">Deep Dive</span>
          {hero ? (
            <article className="deepdive-card">
              <div 
                className="deepdive-image"
                style={{
                  backgroundImage: hero.cover_url ? `url(${hero.cover_url})` : "linear-gradient(135deg,#091830 0%,#0F2A4A 40%,#072038 100%)"
                }}
              />
              <div className="deepdive-body">
                <span className="a-badge" style={{ background: "var(--purple-dim)", color: "var(--purple)" }}>
                  LONG READ
                </span>
                <h3 className="deepdive-title">
                  <Link href={`/blog/${hero.slug}`}>{hero.title}</Link>
                </h3>
                <p className="deepdive-excerpt">{hero.excerpt ?? "Technical deep-dive content"}</p>
                <div className="deepdive-meta">
                  {new Date(hero.created_at).toLocaleDateString()} · {hero.reading_time ?? 10} min read
                </div>
              </div>
            </article>
          ) : (
            <div className="deepdive-placeholder">Add long-form content</div>
          )}
        </div>
        <aside className="trending-panel">
          <h3 className="sec-title">Trending</h3>
          <div className="trending-list">
            {(trending.length ? trending : [null, null, null, null]).map((post, idx) => (
              <Link key={post?.id ?? `tr-${idx}`} href={post ? `/blog/${post.slug}` : "#"} className="trending-item">
                <span className="trending-num">{String(idx + 1).padStart(2, "0")}</span>
                <span className="trending-title">{post?.title ?? "Loading..."}</span>
              </Link>
            ))}
          </div>
        </aside>
      </section>

      {/* Newsletter CTA Section */}
      <section className="nl-cta">
        <div className="nl-cta-content">
          <div className="nl-cta-text">
            <h2 className="nl-cta-title">Stay Ahead in EV Engineering</h2>
            <p className="nl-cta-desc">
              Get weekly technical insights, battery design patterns, and engineering tools delivered to your inbox.
            </p>
            <div className="nl-cta-stats">
              <span>Join 500+ EV engineers</span>
            </div>
          </div>
          <NewsletterForm />
        </div>
      </section>

      {/* More Articles */}
      {(moreStories.length > 0) && (
        <>
          <section className="sec-head">
            <h2 className="sec-title">More Articles</h2>
            <Link href="/blogs" className="sec-link">
              View all {"->"}
            </Link>
          </section>
          <section className="grid-4">
            {(moreStories.length ? moreStories : [null, null, null, null]).map((post, idx) =>
              post ? (
                <PostCard key={post.id} post={post} />
              ) : (
                <article key={`more-f-${idx}`} className="a-card">
                  <div className="a-card-img" style={{ background: "var(--surface3)" }} />
                  <div className="a-card-body">
                    <span className="a-badge" style={{ background: "var(--surface3)", color: "var(--text3)" }}>
                      ARTICLE
                    </span>
                    <h3 className="a-title">Upcoming article</h3>
                  </div>
                </article>
              ),
            )}
          </section>
        </>
      )}
    </main>
  );
}