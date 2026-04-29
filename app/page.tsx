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
                Try Calculators
              </Link>
            </div>
            <div className="home-hero-stats">
              <div className="stat-item">
                <span className="stat-num">{posts.length}+</span>
                <span className="stat-label">Technical Articles</span>
              </div>
              <span className="stat-divider">|</span>
              <div className="stat-item">
                <span className="stat-num">6</span>
                <span className="stat-label">Calculators</span>
              </div>
              <span className="stat-divider">|</span>
              <div className="stat-item">
                <span className="stat-num">Weekly</span>
                <span className="stat-label">Updates</span>
              </div>
            </div>
          </div>
          <div className="home-hero-visual">
            <div className="ev-ecosystem">
              <svg viewBox="0 0 300 180" className="ev-svg">
                {/* Road */}
                <line x1="0" y1="150" x2="300" y2="150" stroke="var(--border)" strokeWidth="2" className="road-line"/>
                <line x1="0" y1="155" x2="300" y2="155" stroke="var(--border)" strokeWidth="1" strokeDasharray="8 4" className="road-dash"/>
                
                {/* EV Car Body */}
                <path d="M60 120 L80 120 L90 100 L150 95 L200 95 L220 100 L240 115 L250 120 L250 135 L60 135 Z" 
                      fill="none" stroke="var(--accent)" strokeWidth="2" className="car-body"/>
                
                {/* Wheels */}
                <circle cx="90" cy="135" r="12" fill="none" stroke="var(--accent)" strokeWidth="2" className="wheel"/>
                <circle cx="90" cy="135" r="5" fill="var(--accent)" className="wheel-hub"/>
                <circle cx="210" cy="135" r="12" fill="none" stroke="var(--accent)" strokeWidth="2" className="wheel"/>
                <circle cx="210" cy="135" r="5" fill="var(--accent)" className="wheel-hub"/>
                
                {/* Battery Pack in Car */}
                <rect x="100" y="115" width="100" height="15" rx="2" fill="none" stroke="var(--accent)" strokeWidth="1.5" className="battery-pack"/>
                <rect x="105" y="118" width="15" height="9" fill="var(--accent)" opacity="0.3" className="cell cell-1"/>
                <rect x="125" y="118" width="15" height="9" fill="var(--accent)" opacity="0.5" className="cell cell-2"/>
                <rect x="145" y="118" width="15" height="9" fill="var(--accent)" opacity="0.7" className="cell cell-3"/>
                <rect x="165" y="118" width="15" height="9" fill="var(--accent)" opacity="0.9" className="cell cell-4"/>
                <rect x="185" y="118" width="15" height="9" fill="var(--accent)" opacity="1" className="cell cell-5"/>
                
                {/* Energy Flow Lines */}
                <path d="M250 125 Q270 125 275 110 Q280 95 270 85" fill="none" stroke="var(--accent)" strokeWidth="1.5" 
                      opacity="0.6" className="energy-flow flow-1"/>
                <path d="M250 130 Q275 130 280 115 Q285 100 275 90" fill="none" stroke="var(--accent)" strokeWidth="1" 
                      opacity="0.4" className="energy-flow flow-2"/>
                
                {/* Charging Station */}
                <rect x="20" y="80" width="15" height="70" rx="2" fill="none" stroke="var(--accent)" strokeWidth="2" className="charger-body"/>
                <rect x="23" y="60" width="9" height="20" rx="1" fill="var(--accent)" className="charger-head"/>
                <rect x="25" y="50" width="5" height="10" rx="1" fill="var(--accent)" className="charger-tip"/>
                
                {/* Lightning Bolt on Charger */}
                <path d="M27 35 L32 45 L28 45 L31 55 L25 45 L29 45 Z" fill="var(--accent)" className="bolt"/>
                
                {/* Battery Cell Stack */}
                <rect x="20" y="170" width="30" height="50" rx="3" fill="none" stroke="var(--accent)" strokeWidth="1.5" className="cell-stack"/>
                <rect x="23" y="175" width="24" height="8" fill="var(--accent)" opacity="0.4" className="stack-cell"/>
                <rect x="23" y="186" width="24" height="8" fill="var(--accent)" opacity="0.6" className="stack-cell"/>
                <rect x="23" y="197" width="24" height="8" fill="var(--accent)" opacity="0.8" className="stack-cell"/>
                <rect x="23" y="208" width="24" height="8" fill="var(--accent)" opacity="1" className="stack-cell"/>
                
                {/* Connection Lines */}
                <path d="M35 90 Q50 90 60 110" fill="none" stroke="var(--accent)" strokeWidth="1.5" opacity="0.5" className="connect-line"/>
                <path d="M35 195 Q50 165 60 125" fill="none" stroke="var(--accent)" strokeWidth="1" opacity="0.3" className="connect-line"/>
                
                {/* Heat Waves from Battery */}
                <path d="M150 80 Q155 70 150 60 Q145 50 150 40" fill="none" stroke="var(--accent)" strokeWidth="1.5" 
                      opacity="0.4" className="heat-wave wave-heat-1"/>
                <path d="M165 85 Q170 75 165 65 Q160 55 165 45" fill="none" stroke="var(--accent)" strokeWidth="1" 
                      opacity="0.3" className="heat-wave wave-heat-2"/>
              </svg>
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
        {topStories.map((post, idx) => (
          <PostCard key={post.id} post={post} featured={idx === 0} />
        ))}
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
            {trending.map((post, idx) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="trending-item">
                <span className="trending-num">{String(idx + 1).padStart(2, "0")}</span>
                <span className="trending-title">{post.title}</span>
              </Link>
            ))}
          </div>
        </aside>
      </section>

      {/* Newsletter CTA Section */}
      <section id="newsletter" className="nl-cta">
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
            {moreStories.map((post, idx) => (
              <PostCard key={post.id} post={post} />
            ))}
          </section>
        </>
      )}
    </main>
  );
}