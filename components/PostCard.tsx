"use client";

import Link from "next/link";
import Image from "next/image";
import type { PostRecord } from "@/types/post";
import { getCategoryTone } from "@/lib/category-theme";

type Props = {
  post: PostRecord;
  featured?: boolean;
};

function parseTags(tags: unknown): string[] {
  if (!tags) return [];
  if (Array.isArray(tags)) {
    return tags.flatMap((t) => {
      if (typeof t === "string" && t.startsWith("[")) {
        try { const p = JSON.parse(t); return Array.isArray(p) ? p : [t]; } catch { return [t]; }
      }
      return [t];
    }).filter(Boolean);
  }
  if (typeof tags === "string") {
    try { const p = JSON.parse(tags); return Array.isArray(p) ? p : [tags]; } catch { return [tags]; }
  }
  return [];
}

const TIER_COLOR: Record<string, string> = {
  basic:        "#22c55e",
  intermediate: "#3b82f6",
  advanced:     "#f59e0b",
  expert:       "#ef4444",
};

export function PostCard({ post, featured = false }: Props) {
  const tone     = getCategoryTone(post.category);
  const coverUrl = post.cover_url;
  const showImg  = coverUrl && (coverUrl.startsWith("http") || coverUrl.startsWith("/"));
  const tier     = post.tier || "intermediate";
  const tierCol  = TIER_COLOR[tier] ?? TIER_COLOR.intermediate;

  return (
    <article className="a-card">
      {/* Image */}
      <Link href={`/blog/${post.slug}`} className="a-card-link-image">
        {showImg ? (
          <Image
            src={coverUrl}
            alt={post.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="a-card-img"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div
            className="a-card-img"
            style={{ background: "linear-gradient(135deg,#091830 0%,#0F2A4A 40%,#072038 100%)" }}
          />
        )}
      </Link>

      {/* Body */}
      <div className="a-card-body">
        {/* Badges */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <span className="a-badge" style={{ background: tone + "22", color: tone }}>
            {post.category ?? "article"}
          </span>
          <span className="a-badge" style={{ background: tierCol + "18", color: tierCol }}>
            {tier}
          </span>
        </div>

        {/* Title */}
        <h3 className="a-title">
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </h3>

        {/* Excerpt */}
        <p className="a-excerpt">{post.excerpt ?? "Technical update from EVPulse."}</p>

        {/* Footer */}
        <div className="a-footer">
          <span>{new Date(post.created_at).toLocaleDateString()}</span>
          <span className="a-dot">·</span>
          <span>{post.reading_time ?? 1} min read</span>
          {(() => {
            const tags = parseTags(post.tags).slice(0, 2);
            return tags.length ? (
              <>
                <span className="a-dot">·</span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "120px" }}>
                  {tags.join(", ")}
                </span>
              </>
            ) : null;
          })()}
        </div>
      </div>
    </article>
  );
}
