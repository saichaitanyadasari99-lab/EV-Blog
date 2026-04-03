import Link from "next/link";
import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
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

  if (!posts.length) {
    notFound();
  }

  const toneStyle = { ["--tone" as string]: getCategoryTone(slug) } as CSSProperties;

  return (
    <main className="page-main wrapper">
      <section className="page-hero" style={toneStyle}>
        <div className="hero-badge" style={{ background: "var(--tone)", color: "#000" }}>
          CATEGORY
        </div>
        <h1 className="page-title" style={{ textTransform: "capitalize" }}>
          {slug}
        </h1>
        <p className="page-subtitle">Technical posts under the {slug} category.</p>
        <Link href="/blogs" className="sec-link" style={{ marginTop: 8, display: "inline-flex" }}>
          Back to all blogs {"->"}
        </Link>
      </section>

      <section className="sec-head">
        <h2 className="sec-title">Articles</h2>
      </section>
      <section className="articles-grid">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </section>
    </main>
  );
}



