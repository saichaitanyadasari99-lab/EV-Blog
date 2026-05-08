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
              <svg viewBox="0 0 600 300" className="ev-svg">
                <defs>
                  <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="var(--surface)" />
                    <stop offset="100%" stopColor="var(--surface2)" />
                  </linearGradient>
                </defs>
                
                {/* Background Sky */}
                <rect x="0" y="0" width="600" height="300" fill="url(#skyGrad)"/>
                
                {/* Ground */}
                <rect x="0" y="260" width="600" height="40" fill="none" stroke="var(--border)" strokeWidth="1"/>
                
                {/* Trees on Left Border */}
                <g className="tree-left">
                  <path d="M0 260 L5 220 L10 260 Z" fill="none" stroke="var(--accent)" strokeWidth="1.5"/>
                  <path d="M2 240 L8 200 L14 240 Z" fill="none" stroke="var(--accent)" strokeWidth="1"/>
                  <path d="M2 210 L8 170 L14 210 Z" fill="none" stroke="var(--accent)" strokeWidth="1"/>
                  <path d="M-2 260 L3 230 L8 260 Z" fill="none" stroke="var(--accent)" strokeWidth="1.5" opacity="0.7"/>
                </g>
                
                {/* Trees on Right Border */}
                <g className="tree-right">
                  <path d="M590 260 L595 220 L600 260 Z" fill="none" stroke="var(--accent)" strokeWidth="1.5"/>
                  <path d="M592 240 L598 200 L604 240 Z" fill="none" stroke="var(--accent)" strokeWidth="1"/>
                  <path d="M592 210 L598 170 L604 210 Z" fill="none" stroke="var(--accent)" strokeWidth="1"/>
                  <path d="M592 260 L597 230 L602 260 Z" fill="none" stroke="var(--accent)" strokeWidth="1.5" opacity="0.7"/>
                </g>
                
                {/* Transmission Towers Left */}
                <g className="tower-left">
                  <line x1="30" y1="100" x2="30" y2="260" stroke="var(--border)" strokeWidth="2"/>
                  <line x1="20" y1="140" x2="40" y2="140" stroke="var(--border)" strokeWidth="1.5"/>
                  <line x1="22" y1="180" x2="38" y2="180" stroke="var(--border)" strokeWidth="1.5"/>
                </g>
                
                {/* Power Lines */}
                <path d="M30 140 Q150 120 200 150" fill="none" stroke="var(--accent)" strokeWidth="1.5" opacity="0.6" className="power-line"/>
                <path d="M30 180 Q160 160 200 170" fill="none" stroke="var(--accent)" strokeWidth="1" opacity="0.4" className="power-line"/>
                
                {/* Mobile Tower */}
                <g className="mobile-tower">
                  <line x1="480" y1="150" x2="480" y2="260" stroke="var(--border)" strokeWidth="2"/>
                  <line x1="470" y1="180" x2="490" y2="180" stroke="var(--border)" strokeWidth="1.5"/>
                  <line x1="475" y1="160" x2="485" y2="160" stroke="var(--border)" strokeWidth="1.5"/>
                  <circle cx="480" cy="150" r="3" fill="var(--accent)" className="tower-light"/>
                  <path d="M470 180 L465 185" stroke="var(--accent)" strokeWidth="1" opacity="0.5"/>
                  <path d="M490 180 L495 185" stroke="var(--accent)" strokeWidth="1" opacity="0.5"/>
                </g>
                
                {/* Charging Station - 4 Chargers */}
                <g className="charging-station">
                  <rect x="240" y="120" width="100" height="140" rx="4" fill="none" stroke="var(--accent)" strokeWidth="2"/>
                  <rect x="250" y="130" width="6" height="30" fill="var(--accent)" className="charger-1"/>
                  <rect x="262" y="130" width="6" height="30" fill="var(--accent)" className="charger-2"/>
                  <rect x="274" y="130" width="6" height="30" fill="var(--accent)" className="charger-3"/>
                  <rect x="286" y="130" width="6" height="30" fill="var(--accent)" className="charger-4"/>
                  {/* Charging indicators */}
                  <circle cx="253" cy="125" r="2" fill="var(--accent)" className="charge-indicator"/>
                  <circle cx="265" cy="125" r="2" fill="var(--accent)" className="charge-indicator"/>
                  <circle cx="277" cy="125" r="2" fill="var(--accent)" className="charge-indicator"/>
                  <circle cx="289" cy="125" r="2" fill="var(--accent)" className="charge-indicator"/>
                </g>
                
                {/* Car Charging from Charger 2 */}
                <g className="car-charging" transform="translate(280, 195)">
                  <rect x="0" y="0" width="50" height="25" rx="4" fill="none" stroke="var(--accent)" strokeWidth="1.5"/>
                  <rect x="2" y="2" width="46" height="9" fill="var(--accent)" opacity="0.3"/>
                  <rect x="2" y="13" width="20" height="8" fill="var(--accent)" opacity="0.5"/>
                  <circle cx="12" cy="25" r="6" fill="none" stroke="var(--accent)" strokeWidth="1"/>
                  <circle cx="38" cy="25" r="6" fill="none" stroke="var(--accent)" strokeWidth="1"/>
                  {/* Charging cable */}
                  <path d="M262 160 L262 150 L280 145 L290 155" fill="none" stroke="var(--accent)" strokeWidth="1.5" opacity="0.8" className="charging-cable"/>
                </g>
                
                {/* Semi Truck Charging from Charger 1 */}
                <g className="semi-truck" transform="translate(200, 200)">
                  <rect x="0" y="0" width="35" height="20" rx="2" fill="none" stroke="var(--accent)" strokeWidth="1.5"/>
                  <rect x="35" y="10" width="15" height="10" rx="2" fill="none" stroke="var(--accent)" strokeWidth="1.5"/>
                  <circle cx="10" cy="25" r="5" fill="none" stroke="var(--accent)" strokeWidth="1"/>
                  <circle cx="25" cy="25" r="5" fill="none" stroke="var(--accent)" strokeWidth="1"/>
                  <circle cx="42" cy="25" r="5" fill="none" stroke="var(--accent)" strokeWidth="1"/>
                  {/* Charging cable */}
                  <path d="M250 160 L250 150 L235 145 L225 155" fill="none" stroke="var(--accent)" strokeWidth="1.5" opacity="0.8" className="charging-cable"/>
                </g>
                
                {/* Volvo Truck Charging from Charger 3 */}
                <g className="volvo-truck" transform="translate(370, 195)">
                  <rect x="0" y="0" width="45" height="22" rx="3" fill="none" stroke="var(--accent)" strokeWidth="1.5"/>
                  <rect x="45" y="6" width="12" height="10" rx="2" fill="none" stroke="var(--accent)" strokeWidth="1.5"/>
                  <circle cx="12" cy="27" r="6" fill="none" stroke="var(--accent)" strokeWidth="1"/>
                  <circle cx="30" cy="27" r="6" fill="none" stroke="var(--accent)" strokeWidth="1"/>
                  <circle cx="50" cy="27" r="6" fill="none" stroke="var(--accent)" strokeWidth="1"/>
                  {/* Volvo badge */}
                  <text x="15" y="14" fontSize="6" fill="var(--accent)" opacity="0.7">VOLVO</text>
                  {/* Charging cable */}
                  <path d="M274 160 L274 150 L295 145 L310 155" fill="none" stroke="var(--accent)" strokeWidth="1.5" opacity="0.8" className="charging-cable"/>
                </g>
                
                {/* Drones Flying */}
                <g className="drone-1">
                  <circle cx="100" cy="80" r="3" fill="none" stroke="var(--accent)" strokeWidth="1"/>
                  <line x1="97" y1="78" x2="93" y2="76" stroke="var(--accent)" strokeWidth="1"/>
                  <line x1="103" y1="78" x2="107" y2="76" stroke="var(--accent)" strokeWidth="1"/>
                  <line x1="97" y1="82" x2="93" y2="84" stroke="var(--accent)" strokeWidth="1"/>
                  <line x1="103" y1="82" x2="107" y2="84" stroke="var(--accent)" strokeWidth="1"/>
                </g>
                
                <g className="drone-2">
                  <circle cx="170" cy="60" r="2.5" fill="none" stroke="var(--accent)" strokeWidth="1"/>
                  <line x1="168" y1="59" x2="165" y2="57" stroke="var(--accent)" strokeWidth="0.8"/>
                  <line x1="172" y1="59" x2="175" y2="57" stroke="var(--accent)" strokeWidth="0.8"/>
                  <line x1="168" y1="61" x2="165" y2="63" stroke="var(--accent)" strokeWidth="0.8"/>
                  <line x1="172" y1="61" x2="175" y2="63" stroke="var(--accent)" strokeWidth="0.8"/>
                </g>
                
                <g className="drone-3">
                  <circle cx="420" cy="90" r="3" fill="none" stroke="var(--accent)" strokeWidth="1"/>
                  <line x1="418" y1="88" x2="415" y2="85" stroke="var(--accent)" strokeWidth="1"/>
                  <line x1="422" y1="88" x2="425" y2="85" stroke="var(--accent)" strokeWidth="1"/>
                  <line x1="418" y1="92" x2="415" y2="95" stroke="var(--accent)" strokeWidth="1"/>
                  <line x1="422" y1="92" x2="425" y2="95" stroke="var(--accent)" strokeWidth="1"/>
                </g>
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