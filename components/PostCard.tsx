"use client";

import Link from "next/link";
import type { PostRecord } from "@/types/post";
import { getCategoryTone } from "@/lib/category-theme";

type Props = {
  post: PostRecord;
  featured?: boolean;
};

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
    if (img.parentElement) {
      img.parentElement.setAttribute('style', 'background: linear-gradient(135deg,#091830 0%,#0F2A4A 40%,#072038 100%)');
    }
  };
  
  return (
    <article className={`a-card ${featured ? 'featured-card-item' : ''}`}>
      {showImage ? (
        <Link href={`/blog/${post.slug}`} className="a-card-link">
          <img 
            src={coverUrl} 
            alt={post.title}
            className="a-card-img"
            style={{ objectFit: 'contain', padding: '8px' }}
            onError={handleImageError}
          />
        </Link>
      ) : (
        <Link href={`/blog/${post.slug}`} className="a-card-link">
          <div className="a-card-img" style={{
            background: "linear-gradient(135deg,#091830 0%,#0F2A4A 40%,#072038 100%)"
          }} />
        </Link>
      )}
      <div className="a-card-body">
        <span className="a-badge" style={{ background: tone + '22', color: tone }}>
          {post.category ?? "article"}
        </span>
        <span 
          className="a-badge" 
          style={{ 
            background: tierColor + '15', 
            color: tierColor,
            marginLeft: post.tags?.length ? '6px' : '0',
            fontSize: '9px',
            padding: '2px 6px' 
          }}
        >
          {tier}
        </span>
        <h3 className="a-title">
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </h3>
        <p className="a-excerpt">{post.excerpt ?? "Technical update from EVPulse."}</p>
        <div className="a-footer">
          <span className="a-date">{new Date(post.created_at).toLocaleDateString()}</span>
          <span className="a-dot">·</span>
          <span className="a-readtime">{post.reading_time ?? 1} min read</span>
          {post.tags?.length ? (
            <>
              <span className="a-dot">·</span>
              <span className="a-tags">{post.tags.slice(0, 2).join(', ')}</span>
            </>
          ) : null}
        </div>
      </div>
    </article>
  );
}