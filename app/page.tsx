import "@/app/home.css";
import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedPosts } from "@/lib/posts";
import { PostCard } from "@/components/PostCard";
import { NewsletterForm } from "@/components/NewsletterForm";
import { HeroAnimation } from "@/components/HeroAnimation";
import type { PostRecord } from "@/types/post";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.evpulse.co.in";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: { canonical: baseUrl },
};

export default async function HomePage() {
  let posts: PostRecord[] = [];
  
  try {
    posts = await getPublishedPosts();
  } catch (err) {
    console.error("Error loading posts:", err);
  }
  
  const hero      = posts[0];
  const deepDive  = posts[1] ?? posts[0];          // different from hero
  const topStories = posts.slice(1, 4);            // skip hero – it's already featured
  const moreStories = posts.slice(4, 8);           // next batch
  const trending  = posts.slice(1, 6);             // skip hero from trending too

  const tickerItems = posts.slice(0, 6);

  return (
<main className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="wrapper py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="space-y-8">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-brand mb-4">EV Battery & Energy Technology</p>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
                Engineering clarity for the <span style={{ color: "var(--brand)" }}>EV era</span>
              </h1>
              <p className="text-lg text-text2 leading-relaxed max-w-lg">
                Deep-dive technical analysis, battery engineering insights, and engineering tools for EV professionals and enthusiasts.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/blogs" className="btn-primary">
                Explore Articles
              </Link>
              <Link href="/calculators" className="btn-outline">
                Try Calculators
              </Link>
            </div>

            <div className="flex flex-wrap gap-8 pt-4">
              <div>
                <p className="text-3xl font-bold text-brand">{posts.length}+</p>
                <p className="text-xs uppercase tracking-wider text-text3 mt-1">Technical Articles</p>
              </div>
              <div className="h-12 w-px bg-border"></div>
              <div>
                <p className="text-3xl font-bold text-brand">6</p>
                <p className="text-xs uppercase tracking-wider text-text3 mt-1">Calculators</p>
              </div>
              <div className="h-12 w-px bg-border"></div>
              <div>
                <p className="text-3xl font-bold text-brand">Weekly</p>
                <p className="text-xs uppercase tracking-wider text-text3 mt-1">Updates</p>
              </div>
            </div>
          </div>

          <div className="hidden lg:flex items-center justify-center">
            <HeroAnimation />
          </div>
        </div>
      </section>

      {/* Live Ticker — animated loop */}
      {tickerItems.length > 0 && (
        <div className="border-y border-border py-3 my-8">
          <div className="wrapper flex items-center gap-4">
            <span className="text-xs font-bold text-red-500 animate-pulse shrink-0 font-mono">● LIVE</span>
            <div className="ticker-outer">
              <div className="ticker-inner">
                {/* Duplicated for seamless loop */}
                {[...tickerItems, ...tickerItems].map((post, i) => (
                  <Link key={`${post.id}-${i}`} href={`/blog/${post.slug}`} className="text-text2 hover:text-brand transition text-sm shrink-0 font-mono">
                    {post.title}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Featured Article */}
      {hero && (
        <section className="wrapper py-16">
          <p className="text-xs font-bold tracking-widest uppercase text-brand mb-6">Featured</p>
          <Link href={`/blog/${hero.slug}`} className="grid grid-cols-1 lg:grid-cols-2 gap-5 border border-border rounded-2xl hover:border-brand transition-all hover-lift bg-surface p-4">
            <div
              className="aspect-video bg-cover bg-center rounded-xl overflow-hidden"
              style={{
                backgroundImage: hero.cover_url ? `url(${hero.cover_url})` : "linear-gradient(135deg,#0A1628 0%,#142040 40%,#0D2035 100%)"
              }}
            />
            <div className="flex flex-col justify-center py-4 px-2">
              <span className="text-xs font-bold uppercase px-3 py-1 rounded bg-brand-bg text-brand w-fit mb-4">{hero.category}</span>
              <h2 className="text-2xl lg:text-3xl font-bold mb-3 leading-snug">{hero.title}</h2>
              <p className="text-text2 mb-4 leading-relaxed line-clamp-3">{hero.excerpt}</p>
              <div className="text-xs text-text3 space-x-2">
                <span>{new Date(hero.created_at).toLocaleDateString()}</span>
                <span>·</span>
                <span>{hero.reading_time ?? 1} min read</span>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* Category Tabs */}
      <section className="wrapper cat-tabs-section">
        <p className="cat-tabs-label">Browse by Topic</p>
        <div className="cat-tabs-row">
          {[
            { label: "All",           href: "/blogs" },
            { label: "Cell Chemistry",href: "/category/cell-chemistry" },
            { label: "BMS Design",    href: "/category/bms-design" },
            { label: "Thermal",       href: "/category/thermal" },
            { label: "Charging",      href: "/category/charging" },
            { label: "Benchmarks",    href: "/category/ev-benchmarks" },
          ].map(({ label, href }, idx) => (
            <Link
              key={label}
              href={href}
              className={`cat-tab${idx === 0 ? " cat-tab-active" : ""}`}
            >
              {label}
            </Link>
          ))}
        </div>
      </section>

      {/* Top Stories Grid */}
      <section className="wrapper">
        <div className="flex items-center justify-between py-8 border-b border-border mb-8">
          <h2 className="text-2xl md:text-3xl font-bold">Latest Articles</h2>
          <Link href="/blogs" className="text-brand font-semibold hover:underline text-sm">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {topStories.map((post, idx) => (
            <PostCard key={post.id} post={post} featured={idx === 0} />
          ))}
        </div>
      </section>

      {/* Calculators Section */}
      <section className="wrapper">
        <div className="flex items-center justify-between py-8 border-b border-border mb-8">
          <h2 className="text-2xl md:text-3xl font-bold">Battery Design Tools</h2>
          <Link href="/calculators" className="text-brand font-semibold hover:underline text-sm">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-16">
          {[
            { name: "Pack Designer",  slug: "pack-size",       cat: "Pack Design",     desc: "Cell count, SxP layout & density" },
            { name: "Thermal Load",   slug: "heat-generation", cat: "Thermal",         desc: "Heat output across duty profiles" },
            { name: "Cooling Plate",  slug: "cooling-plate",   cat: "Thermal",         desc: "Reynolds, Nusselt, pressure-drop" },
            { name: "Bus Bar Sizing", slug: "bus-bar",         cat: "Electrical",      desc: "Cross-section & thermal rise" },
            { name: "SOC Estimator",  slug: "soc-estimator",   cat: "BMS",             desc: "OCV-temperature SOC curve" },
            { name: "Charging Time",  slug: "charging-time",   cat: "Charging",        desc: "CC-CV phase split & duration" },
          ].map((calc) => (
            <Link key={calc.slug} href={`/calculators/${calc.slug}`} className="calc-card">
              <span className="calc-cat">{calc.cat}</span>
              <h3 className="calc-title">{calc.name}</h3>
              <p className="calc-desc">{calc.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending + Deep Dive */}
      <section className="wrapper grid grid-cols-1 lg:grid-cols-3 gap-8 py-16">
        <div className="lg:col-span-2">
          <p className="text-xs font-bold tracking-widest uppercase text-brand mb-6">Deep Dive</p>
          {deepDive ? (
            <Link href={`/blog/${deepDive.slug}`} className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-border rounded-2xl hover:border-brand transition-all hover-lift p-4">
              <div
                className="aspect-video bg-cover bg-center rounded-xl overflow-hidden"
                style={{
                  backgroundImage: deepDive.cover_url ? `url(${deepDive.cover_url})` : "linear-gradient(135deg,#091830 0%,#0F2A4A 40%,#072038 100%)"
                }}
              />
              <div className="flex flex-col justify-center py-2">
                <span className="text-xs font-bold uppercase px-2 py-1 rounded bg-purple-500 bg-opacity-10 text-purple-400 w-fit mb-3">Long Read</span>
                <h3 className="text-xl font-bold mb-2 line-clamp-3">{deepDive.title}</h3>
                <p className="text-text2 text-sm mb-4 line-clamp-3">{deepDive.excerpt ?? "Technical deep-dive content"}</p>
                <div className="text-xs text-text3">
                  {new Date(deepDive.created_at).toLocaleDateString()} · {deepDive.reading_time ?? 10} min read
                </div>
              </div>
            </Link>
          ) : (
            <div className="p-12 text-center border-2 border-dashed border-border rounded text-text3">Add long-form content</div>
          )}
        </div>

        <aside className="bg-surface border border-border rounded-lg p-6 h-fit">
          <h3 className="font-bold text-lg mb-6">Trending</h3>
          <div className="space-y-4">
            {trending.map((post, idx) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="flex gap-3 pb-4 border-b border-border last:border-b-0 hover:text-brand transition">
                <span className="font-bold text-brand text-lg min-w-8">{String(idx + 1).padStart(2, "0")}</span>
                <span className="text-sm leading-tight">{post.title}</span>
              </Link>
            ))}
          </div>
        </aside>
      </section>

      {/* Newsletter CTA Section */}
      <section id="newsletter" className="wrapper my-20">
        <div className="nl-section">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-brand mb-3 font-mono">Newsletter</p>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Stay Ahead in EV Engineering</h2>
              <p className="text-text2 mb-6 leading-relaxed">
                Weekly technical insights, battery design patterns, and engineering tools — straight to your inbox.
              </p>
              <p className="text-sm text-text3 font-mono">↗ Joined by 500+ EV engineers</p>
            </div>
            <NewsletterForm />
          </div>
        </div>
      </section>

      {/* More Articles */}
      {(moreStories.length > 0) && (
        <section className="wrapper">
          <div className="flex items-center justify-between py-8 border-b border-border mb-8">
            <h2 className="text-2xl md:text-3xl font-bold">More Articles</h2>
            <Link href="/blogs" className="text-brand font-semibold hover:underline text-sm">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {moreStories.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}

      {/* External Sources — Authority Signals */}
      <section className="wrapper py-16 border-t border-border">
        <p className="text-xs font-bold tracking-widest uppercase text-brand mb-6">Cited Sources</p>
        <div className="space-y-3">
          <a href="https://www.iea.org/reports/global-ev-outlook-2025" target="_blank" rel="noreferrer" className="block p-3 bg-surface border border-border rounded hover:border-brand hover:bg-opacity-50 transition text-sm">
            IEA Global EV Outlook 2025
          </a>
          <a href="https://www.energy.gov/eere/vehicles/batteries" target="_blank" rel="noreferrer" className="block p-3 bg-surface border border-border rounded hover:border-brand hover:bg-opacity-50 transition text-sm">
            DOE Vehicle Batteries
          </a>
          <a href="https://unece.org/transport/vehicle-regulations-wp29" target="_blank" rel="noreferrer" className="block p-3 bg-surface border border-border rounded hover:border-brand hover:bg-opacity-50 transition text-sm">
            UN ECE WP.29
          </a>
        </div>
      </section>
    </main>
  );
}