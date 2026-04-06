import Link from "next/link";
import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import { getCategoryTone } from "@/lib/category-theme";
import { getPublishedPostBySlug, getPublishedPosts } from "@/lib/posts";
import { renderTiptapHtml } from "@/lib/tiptap";
import type { PostRecord } from "@/types/post";
import { NewsletterForm } from "@/components/NewsletterForm";

type Params = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 60;

function stripTags(value: string) {
  return value.replace(/<[^>]*>/g, "").trim();
}

function extractHeadings(html: string) {
  const matches = [...html.matchAll(/<h2[^>]*>(.*?)<\/h2>/gi)];
  return matches
    .map((match) => stripTags(match[1] ?? ""))
    .filter(Boolean)
    .slice(0, 8);
}

export default async function BlogPostPage({ params }: Params) {
  const { slug } = await params;
  const [post, allPosts] = await Promise.all([
    getPublishedPostBySlug(slug),
    getPublishedPosts(),
  ]);

  if (!post) notFound();

  const html = renderTiptapHtml(post.content);
  const toneStyle = { ["--tone" as string]: getCategoryTone(post.category) } as CSSProperties;
  const references = (post as PostRecord).references ?? [];
  const headings = extractHeadings(html);

  const relatedByCategory = allPosts
    .filter((item) => item.slug !== post.slug && item.category === post.category)
    .slice(0, 4);

  const tagSet = new Set((post.tags ?? []).map((tag) => tag.toLowerCase()));
  const relatedByTags = allPosts
    .filter(
      (item) =>
        item.slug !== post.slug && item.tags?.some((tag) => tagSet.has(tag.toLowerCase())),
    )
    .slice(0, 4);

  return (
    <article className="page-main wrapper">
      <header style={toneStyle} className="page-hero">
        <p className="hero-badge" style={{ background: "var(--tone)", color: "#000" }}>
          {post.category ?? "uncategorized"}
        </p>
        <h1 className="page-title post-page-title">{post.title}</h1>
        <p className="page-subtitle">
          {new Date(post.created_at).toLocaleDateString()} | {post.reading_time ?? 1} min read
        </p>
        <Link href="/blogs" className="sec-link" style={{ marginTop: 8, display: "inline-flex" }}>
          Back to all blogs {"->"}
        </Link>
      </header>

      <div className="post-layout">
        <div className="post-main">
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
        </div>

        <aside className="post-sidebar">
          <section className="sidebar-card">
            <h3 className="sidebar-title">In This Article</h3>
            {headings.length ? (
              <ul className="sidebar-list">
                {headings.map((heading) => (
                  <li key={heading}>{heading}</li>
                ))}
              </ul>
            ) : (
              <p className="sidebar-empty">Section headings will appear here.</p>
            )}
          </section>

          <section className="sidebar-card">
            <h3 className="sidebar-title">Related In {post.category ?? "this category"}</h3>
            {relatedByCategory.length ? (
              <ul className="sidebar-links">
                {relatedByCategory.map((item) => (
                  <li key={item.id}>
                    <Link href={`/blog/${item.slug}`}>{item.title}</Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="sidebar-empty">No category matches yet.</p>
            )}
          </section>

          <section className="sidebar-card">
            <h3 className="sidebar-title">Similar Topics</h3>
            {relatedByTags.length ? (
              <ul className="sidebar-links">
                {relatedByTags.map((item) => (
                  <li key={item.id}>
                    <Link href={`/blog/${item.slug}`}>{item.title}</Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="sidebar-empty">No tag-based matches yet.</p>
            )}
          </section>

          <section className="sidebar-card">
            <h3 className="sidebar-title">Newsletter</h3>
            <p className="text-sm text-[var(--text2)] mb-3">Get weekly EV battery insights delivered to your inbox.</p>
            <NewsletterForm compact />
          </section>
        </aside>
      </div>
    </article>
  );
}
