import Link from "next/link";
import type { CSSProperties } from "react";
import type { PostRecord } from "@/types/post";
import { getCategoryTone } from "@/lib/category-theme";

type Props = {
  post: PostRecord;
};

function mediaStyle(url?: string | null): CSSProperties {
  if (!url) {
    return {
      background: "linear-gradient(135deg,#091830 0%,#0F2A4A 40%,#072038 100%)",
    };
  }
  return {
    backgroundImage: `url(${url})`,
    backgroundSize: "contain",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  };
}

export function PostCard({ post }: Props) {
  const tone = getCategoryTone(post.category);
  return (
    <article className="a-card">
      <div className="a-card-img" style={mediaStyle(post.cover_url)} />
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


