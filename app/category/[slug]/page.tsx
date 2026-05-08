import Link from "next/link";
import type { CSSProperties } from "react";
import { getCategoryTone } from "@/lib/category-theme";
import { getPublishedPostsByCategory } from "@/lib/posts";
import { PostCard } from "@/components/PostCard";

type Params = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 60;

export default async function CategoryPage({ params }: Params) {
  const { slug } = await params;
  const posts = await getPublishedPostsByCategory(slug);

  const toneStyle = { ["--tone" as string]: getCategoryTone(slug) } as CSSProperties;
  const displayName = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <main className="page-main wrapper">
      <section className="page-hero" style={toneStyle}>
        <div className="hero-badge" style={{ background: "var(--tone)", color: "#000" }}>
          CATEGORY
        </div>
        <h1 className="page-title" style={{ textTransform: "capitalize" }}>
          {displayName}
        </h1>
        <p className="page-subtitle">Technical posts under the {displayName} category.</p>
        <Link href="/blogs" className="sec-link" style={{ marginTop: 8, display: "inline-flex" }}>
          Browse all blogs {"->"}
        </Link>
      </section>

      <section className="sec-head">
        <h2 className="sec-title">Articles</h2>
      </section>
      <section className="articles-grid">
        {posts.length > 0 ? (
          posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))
        ) : (
          <article className="a-card">
            <div className="a-card-body">
              <h3 className="a-title">No articles yet</h3>
              <p className="a-excerpt">There are no published articles in this category yet. Check back soon or browse all blogs.</p>
            </div>
          </article>
        )}
      </section>
    </main>
  );
}



