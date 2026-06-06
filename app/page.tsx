import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedPosts } from "@/lib/posts";
import { PostCard } from "@/components/PostCard";
import { getCategoryTone } from "@/lib/category-theme";
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
  
  const hero = posts[0];
  const side = posts.slice(1, 4);
  const topStories = posts.slice(0, 3);
  const moreStories = posts.slice(3, 6);
  const trending = posts.slice(0, 5);
  const hot = posts.find(p => p.category?.toLowerCase().includes("hot") || p.title.toLowerCase().includes("analysis")) ?? posts[0];

  const tickerItems = posts.length
    ? posts.slice(0, 6)
    : [];

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
              <Link href="/blogs" style={{ background: "var(--brand)", color: "#fff", padding: "12px 32px", fontWeight: 600, borderRadius: 8, display: "inline-block", transition: "opacity .15s" }}
                onMouseEnter={e => (e.currentTarget.style.opacity = ".85")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
              >
                Explore Articles
              </Link>
              <Link href="/calculators" style={{ border: "2px solid var(--border)", color: "var(--brand)", padding: "10px 32px", fontWeight: 600, borderRadius: 8, display: "inline-block", transition: "border-color .15s" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--brand)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
              >
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

      {/* Live Ticker */}
      <section className="wrapper border-y border-border py-4 my-8 overflow-hidden">
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold text-red-500 animate-pulse">● LIVE</span>
          <div className="flex gap-8 overflow-x-auto">
            {tickerItems.slice(0, 6).map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="text-text2 hover:text-brand transition whitespace-nowrap text-sm">
                {post.title}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Article */}
      {hero && (
        <section className="wrapper py-16">
          <p className="text-xs font-bold tracking-widest uppercase text-brand mb-6">Featured</p>
          <Link href={`/blog/${hero.slug}`} className="grid grid-cols-1 lg:grid-cols-2 gap-6 border border-border rounded-lg overflow-hidden hover:border-border-2 transition-all hover-lift bg-surface">
            <div
              className="aspect-video bg-cover bg-center"
              style={{
                backgroundImage: hero.cover_url ? `url(${hero.cover_url})` : "linear-gradient(135deg,#0A1628 0%,#142040 40%,#0D2035 100%)"
              }}
            />
            <div className="p-8 flex flex-col justify-center">
              <span className="text-xs font-bold uppercase px-3 py-1 rounded bg-brand-bg text-brand w-fit mb-4">{hero.category}</span>
              <h2 className="text-2xl lg:text-3xl font-bold mb-3 leading-snug">{hero.title}</h2>
              <p className="text-text2 mb-4 leading-relaxed">{hero.excerpt}</p>
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
      <section className="wrapper py-8 flex gap-3 overflow-x-auto pb-4">
        {["All", "Cell Chemistry", "BMS Design", "Thermal", "Charging"].map((item, idx) => (
          <Link
            key={item}
            href={item === "All" ? "/blogs" : `/category/${item.toLowerCase().replace(/\s+/g, "-")}`}
            className={`px-4 py-2 rounded text-sm font-medium whitespace-nowrap transition-all ${idx === 0 ? "bg-brand text-white" : "bg-surface border border-border text-text2 hover:border-brand hover:text-brand"}`}
          >
            {item}
          </Link>
        ))}
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
            { name: "Pack Designer", slug: "pack-size" },
            { name: "Thermal Load", slug: "heat-generation" },
            { name: "Cooling Sizing", slug: "cooling-plate" },
            { name: "Bus Bar", slug: "bus-bar" },
            { name: "SOC Estimator", slug: "soc-estimator" },
            { name: "Charging Time", slug: "charging-time" },
          ].map((calc) => (
            <Link key={calc.slug} href={`/calculators/${calc.slug}`} className="p-6 bg-surface border border-border rounded-lg text-center hover:border-brand hover:bg-opacity-50 transition-all hover-lift">
              <span className="font-semibold">{calc.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending + Deep Dive */}
      <section className="wrapper grid grid-cols-1 lg:grid-cols-3 gap-8 py-16">
        <div className="lg:col-span-2">
          <p className="text-xs font-bold tracking-widest uppercase text-brand mb-6">Deep Dive</p>
          {hero ? (
            <Link href={`/blog/${hero.slug}`} className="grid grid-cols-1 sm:grid-cols-2 gap-6 border border-border rounded-lg overflow-hidden hover:border-brand transition-all hover-lift">
              <div
                className="aspect-video bg-cover bg-center"
                style={{
                  backgroundImage: hero.cover_url ? `url(${hero.cover_url})` : "linear-gradient(135deg,#091830 0%,#0F2A4A 40%,#072038 100%)"
                }}
              />
              <div className="p-6 flex flex-col justify-center">
                <span className="text-xs font-bold uppercase px-2 py-1 rounded bg-purple-500 bg-opacity-10 text-purple-400 w-fit mb-3">Long Read</span>
                <h3 className="text-xl font-bold mb-2">{hero.title}</h3>
                <p className="text-text2 text-sm mb-4">{hero.excerpt ?? "Technical deep-dive content"}</p>
                <div className="text-xs text-text3">
                  {new Date(hero.created_at).toLocaleDateString()} · {hero.reading_time ?? 10} min read
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
      <section id="newsletter" className="wrapper my-20 p-12 bg-surface border border-border rounded-lg">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Stay Ahead in EV Engineering</h2>
            <p className="text-text2 mb-6 leading-relaxed">
              Get weekly technical insights, battery design patterns, and engineering tools delivered to your inbox.
            </p>
            <p className="text-brand font-semibold">Join 500+ EV engineers</p>
          </div>
          <NewsletterForm />
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