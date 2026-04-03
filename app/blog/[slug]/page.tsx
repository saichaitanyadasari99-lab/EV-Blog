import Link from "next/link";
import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import { getCategoryTone } from "@/lib/category-theme";
import { getPublishedPostBySlug } from "@/lib/posts";
import { renderTiptapHtml } from "@/lib/tiptap";
import type { PostRecord } from "@/types/post";

type Params = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 60;

export default async function BlogPostPage({ params }: Params) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);

  if (!post) notFound();

  const html = renderTiptapHtml(post.content);
  const toneStyle = { ["--tone" as string]: getCategoryTone(post.category) } as CSSProperties;
  const references = (post as PostRecord).references ?? [];

  return (
    <article className="page-main wrapper">
      <header style={toneStyle} className="page-hero">
        <p className="hero-badge" style={{ background: "var(--tone)", color: "#000" }}>
          {post.category ?? "uncategorized"}
        </p>
        <h1 className="page-title">{post.title}</h1>
        <p className="page-subtitle">
          {new Date(post.created_at).toLocaleDateString()}  |  {post.reading_time ?? 1} min read
        </p>
        <Link href="/blogs" className="sec-link" style={{ marginTop: 8, display: "inline-flex" }}>
          Back to all blogs {"->"}
        </Link>
      </header>

      <section className="article-content prose" dangerouslySetInnerHTML={{ __html: html }} />

      {references.length ? (
        <section className="references-card">
          <h2>References</h2>
          <ol>
            {references.map((ref) => (
              <li key={ref.url}>
                <a href={ref.url} target="_blank" rel="noreferrer">
                  {ref.title}
                </a>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </article>
  );
}



