"use client";

import Link from "next/link";
import Image from "next/image";
import type { PostRecord } from "@/types/post";
import { getCategoryTone } from "@/lib/category-theme";

type Props = {
  post: PostRecord;
};

function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
}

function hasImageExtension(url: string): boolean {
  const exts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  const lower = url.toLowerCase();
  return exts.some(ext => lower.includes(ext)) || lower.includes('image');
}

export function PostCard({ post }: Props) {
  const tone = getCategoryTone(post.category);
  const coverUrl = post.cover_url;
  const showImage = isValidImageUrl(coverUrl) && hasImageExtension(coverUrl || '');
  
  return (
    <article className="a-card">
      {showImage && coverUrl ? (
        <div className="a-card-img-wrapper">
          <img 
            src={coverUrl} 
            alt={post.title}
            className="a-card-img"
          />
        </div>
      ) : (
        <div className="a-card-img" style={{
          background: "linear-gradient(135deg,#091830 0%,#0F2A4A 40%,#072038 100%)"
        }} />
      )}
      <div className="a-card-body">
        <span className="a-badge" style={{ background: `${tone}22`, color: tone }}>
          {post.category ?? "article"}
        </span>
        <h3 className="a-title">
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </h3>
        <p className="a-excerpt">{post.excerpt ?? "Technical update from VoltPulse."}</p>
        <div className="a-footer">{new Date(post.created_at).toLocaleDateString()}  |  {post.reading_time ?? 1} min read</div>
      </div>
    </article>
  );
}


