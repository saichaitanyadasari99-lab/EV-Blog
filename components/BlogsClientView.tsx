"use client";

import "@/app/blogs/blogs.css";
import { useState, useMemo } from "react";
import Link from "next/link";
import type { PostRecord } from "@/types/post";

const CATEGORY_LABELS: Record<string, string> = {
  "cell-chemistry":  "Cell Chemistry",
  "bms-design":      "Pack & BMS Design",
  "ev-benchmarks":   "EV Benchmarks",
  "vehicle-reviews": "Vehicle Reviews",
  "standards":       "Standards & Compliance",
  "news":            "News",
  "thermal":         "Thermal Management",
  "deepdive":        "Deep Dives",
  "charging":        "Charging & Infrastructure",
  "policy-analysis": "Policy Analysis",
};

function fmt(cat?: string | null) {
  if (!cat) return "Article";
  return CATEGORY_LABELS[cat.toLowerCase().replace(/\s+/g, "-")] ?? cat;
}

const CLIENT_ALIASES: Record<string, string> = {
  bms:                        "bms-design",
  "deep-dive":                "deepdive",
  "charging-&-infrastructure":"charging",
  "charging-infrastructure":  "charging",
  "policy":                   "policy-analysis",
};

function canonicalCat(cat?: string | null) {
  if (!cat) return "uncategorized";
  const key = cat.toLowerCase().trim().replace(/\s+/g, "-");
  return CLIENT_ALIASES[key] ?? key;
}

interface Props {
  posts: PostRecord[];
  categories: string[];           // already-canonical slugs
  categoryCounts: Record<string, number>;
}

export function BlogsClientView({ posts, categories, categoryCounts }: Props) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery,    setSearchQuery]    = useState("");

  const filtered = useMemo(() => {
    let r = posts;
    if (activeCategory !== "all") {
      r = r.filter(p => canonicalCat(p.category) === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      r = r.filter(p =>
        p.title.toLowerCase().includes(q) ||
        (p.excerpt ?? "").toLowerCase().includes(q) ||
        (p.category ?? "").toLowerCase().includes(q)
      );
    }
    return r;
  }, [posts, activeCategory, searchQuery]);

  const featured = filtered[0];
  const rest     = filtered.slice(1);

  return (
    <div className="blogs-layout">
      {/* ── SIDEBAR ── */}
      <aside className="blogs-sidebar">
        {/* Search */}
        <div className="blogs-search-wrap">
          <svg className="blogs-search-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="9" cy="9" r="6" />
            <path d="M15 15l-3-3" />
          </svg>
          <input
            type="text"
            placeholder="Search articles…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="blogs-search-input"
          />
        </div>

        {/* Category filter */}
        <p className="blogs-sidebar-label">Browse By Categories</p>
        <ul className="blogs-cat-list">
          <li>
            <button
              className={`blogs-cat-btn${activeCategory === "all" ? " active" : ""}`}
              onClick={() => setActiveCategory("all")}
            >
              <span>All Articles</span>
              <span className="blogs-cat-count">{posts.length}</span>
            </button>
          </li>
          {categories.map(cat => (
            <li key={cat}>
              <button
                className={`blogs-cat-btn${activeCategory === cat ? " active" : ""}`}
                onClick={() => setActiveCategory(cat)}
              >
                <span>{CATEGORY_LABELS[cat] ?? cat.replace(/-/g, " ")}</span>
                <span className="blogs-cat-count">{categoryCounts[cat] ?? 0}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="blogs-content">
        {/* Header row */}
        <div className="blogs-content-header">
          <p className="blogs-result-count">
            <span className="blogs-result-num">{filtered.length}</span>
            {" "}{activeCategory === "all" ? "articles" : fmt(activeCategory)}
          </p>
          {searchQuery && (
            <button className="blogs-clear-btn" onClick={() => setSearchQuery("")}>
              Clear ×
            </button>
          )}
        </div>

        {filtered.length === 0 && (
          <div className="blogs-empty">
            <p>No articles found — try a different keyword or category.</p>
            <button className="filter-submit" onClick={() => { setSearchQuery(""); setActiveCategory("all"); }}>
              Reset filters
            </button>
          </div>
        )}

        {/* ── FEATURED CARD ── */}
        {featured && (
          <Link href={`/blog/${featured.slug}`} className="blogs-featured">
            <div className="blogs-featured-img-wrap">
              {featured.cover_url ? (
                <img src={featured.cover_url} alt={featured.title} className="blogs-featured-img" />
              ) : (
                <div className="blogs-featured-placeholder" />
              )}
              <span className="blogs-featured-badge">Featured</span>
            </div>
            <div className="blogs-featured-body">
              <span className="blogs-cat-pill">{fmt(featured.category)}</span>
              <h2 className="blogs-featured-title">{featured.title}</h2>
              <p className="blogs-featured-excerpt">{featured.excerpt ?? ""}</p>
              <div className="blogs-article-meta">
                <span>{new Date(featured.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                <span className="meta-dot">·</span>
                <span>{featured.reading_time ?? 5} min read</span>
                <svg className="blogs-article-arrow" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M3 8h10M9 4l4 4-4 4" />
                </svg>
              </div>
            </div>
          </Link>
        )}

        {/* ── ARTICLE GRID ── */}
        {rest.length > 0 && (
          <div className="blogs-grid">
            {rest.map(post => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="blogs-article-card">
                <div className="blogs-article-img-wrap">
                  {post.cover_url ? (
                    <img src={post.cover_url} alt={post.title} className="blogs-article-img" />
                  ) : (
                    <div className="blogs-article-placeholder" />
                  )}
                  <span className="blogs-cat-pill">{fmt(post.category)}</span>
                </div>
                <div className="blogs-article-body">
                  <h3 className="blogs-article-title">{post.title}</h3>
                  <p className="blogs-article-excerpt">{post.excerpt ?? ""}</p>
                  <div className="blogs-article-meta">
                    <span>{new Date(post.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                    <span className="meta-dot">·</span>
                    <span>{post.reading_time ?? 5} min read</span>
                    <svg className="blogs-article-arrow" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M3 8h10M9 4l4 4-4 4" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
