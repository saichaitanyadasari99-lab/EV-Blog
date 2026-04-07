import Link from "next/link";
import type { PostRecord } from "@/types/post";
import { getCategoryTone } from "@/lib/category-theme";

type Props = {
  post: PostRecord;
};

export function PostCard({ post }: Props) {
  const tone = getCategoryTone(post.category);
  return (
    <article className="a-card">
      {post.cover_url ? (
        <img 
          src={post.cover_url} 
          alt={post.title}
          className="a-card-img"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
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


