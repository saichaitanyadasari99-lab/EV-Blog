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
      if (typeof t === "string" && t.startsWith("[") && t.endsWith("]")) {
        try {
          const parsed = JSON.parse(t);
          return Array.isArray(parsed) ? parsed : [t];
        } catch {
          return [t];
        }
      }
      return [t];
    }).filter(Boolean);
  }
  if (typeof tags === "string") {
    try {
      const parsed = JSON.parse(tags);
      return Array.isArray(parsed) ? parsed : [tags];
    } catch {
      return [tags];
    }
  }
  return [];
}

export function PostCard({ post, featured = false }: Props) {
  const tone = getCategoryTone(post.category);
  const coverUrl = post.cover_url;
  const showImage = coverUrl && (coverUrl.startsWith('http') || coverUrl.startsWith('/'));
  
  const tierColors: Record<string, string> = {
    basic: '#22c55e',
    intermediate: '#3b82f6',
    advanced: '#f59e0b',
    expert: '#ef4444',
  };
  const tier = post.tier || 'intermediate';
  const tierColor = tierColors[tier] || tierColors.intermediate;
  
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    img.style.display = 'none';
  };
  
  return (
    <article className={`a-card ${featured ? 'featured-card-item' : ''}`}>
      {showImage ? (
        <Link href={`/blog/${post.slug}`} className="a-card-link-image">
          <Image
            src={coverUrl}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="a-card-img"
            onError={handleImageError}
          />
        </Link>
      ) : (
        <Link href={`/blog/${post.slug}`} className="a-card-link-image">
          <div className="a-card-img" style={{
            background: "linear-gradient(135deg,#091830 0%,#0F2A4A 40%,#072038 100%)"
          }} />
        </Link>
      )}
      <div className="a-card-body">
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 8 }}>
          <span className="a-badge" style={{ background: tone + '22', color: tone }}>
            {post.category ?? "article"}
          </span>
          <span 
            className="a-badge" 
            style={{ background: tierColor + '15', color: tierColor }}
          >
            {tier}
          </span>
        </div>
        <h3 className="a-title">
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </h3>
        <p className="a-excerpt">{post.excerpt ?? "Technical update from EVPulse."}</p>
        <div className="a-footer">
          <span>{new Date(post.created_at).toLocaleDateString()}</span>
          <span className="a-dot">·</span>
          <span>{post.reading_time ?? 1} min read</span>
          {(() => {
            const tags = parseTags(post.tags).slice(0, 2);
            return tags.length ? (
              <>
                <span className="a-dot">·</span>
                <span>{tags.join(', ')}</span>
              </>
            ) : null;
          })()}
        </div>
      </div>
    </article>
  );
}