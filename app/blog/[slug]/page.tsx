import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import { getCategoryTone } from "@/lib/category-theme";
import { getPublishedPostBySlug, getPublishedPosts } from "@/lib/posts";
import { renderTiptapHtml } from "@/lib/tiptap";
import { markdownToHtml } from "@/lib/markdown";
import type { PostRecord } from "@/types/post";
import { NewsletterForm } from "@/components/NewsletterForm";
import { ReadingProgress } from "@/components/ReadingProgress";
import { TableOfContents } from "@/components/TableOfContents";
import { getArticleSchema, getFAQSchema } from "@/lib/schema";
import { ArticleContent } from "@/components/ArticleContent";
import { ReactionBar } from "@/components/ReactionBar";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.evpulse.co.in";

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
    .map((match) => ({ text: stripTags(match[1] ?? ""), id: stripTags(match[1] ?? "").toLowerCase().replace(/\s+/g, "-") }))
    .filter(Boolean)
    .slice(0, 8);
}

type QuizData = {
  question: string;
  answers: string[];
  correct: number;
  explanation: string;
};

function extractQuizzes(html: string): QuizData[] {
  const regex = /<div class="quiz-block"[^>]*data-question="([^"]*)"[^>]*data-answers="([^"]*)"[^>]*data-correct="(\d)"[^>]*data-explanation="([^"]*)"[^>]*>[\s\S]*?<\/div>/gi;
  const quizzes: QuizData[] = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      quizzes.push({
        question: match[1] || "",
        answers: JSON.parse(match[2].replace(/&quot;/g, '"')) as string[],
        correct: parseInt(match[3], 10),
        explanation: match[4] || "",
      });
    } catch {
      // skip invalid
    }
  }
  return quizzes;
}

function extractInlineFaqs(markdown: string): Array<{ question: string; answer: string }> {
  const matches = [...markdown.matchAll(/\[!FAQ\]\s*([^\n]+?)\s*::([^\n]*?)\[\/!FAQ\]/gi)];
  return matches.map((m) => ({
    question: m[1].trim(),
    answer: m[2].trim(),
  }));
}

function stripQuizBlocks(html: string): string {
  const result: string[] = [];
  let i = 0;
  while (i < html.length) {
    const idx = html.indexOf('<div class="quiz-block"', i);
    if (idx === -1) {
      result.push(html.slice(i));
      break;
    }
    result.push(html.slice(i, idx));
    let depth = 0;
    let j = idx;
    while (j < html.length) {
      if (html.startsWith("<div", j)) depth++;
      else if (html.startsWith("</div", j)) {
        depth--;
        if (depth === 0) {
          const endClose = html.indexOf(">", j);
          j = endClose + 1;
          break;
        }
      }
      j++;
    }
    i = j;
  }
  return result.join("");
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  
  if (!post) return {};
  
  const description = post.excerpt ?? (post.content ? stripTags(post.content).slice(0, 160) : "EV battery insights and technical analysis");
  const canonicalUrl = `${baseUrl}/blog/${post.slug}`;
  
  return {
    title: post.title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: post.title,
      description,
      type: "article",
      url: canonicalUrl,
      images: post.cover_url ? [{ url: post.cover_url }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: post.cover_url ? [post.cover_url] : [],
    },
  };
}

export default async function BlogPostPage({ params }: Params) {
  const { slug } = await params;
  
  let post: PostRecord | null = null;
  let allPosts: PostRecord[] = [];
  
  try {
    [post, allPosts] = await Promise.all([
      getPublishedPostBySlug(slug),
      getPublishedPosts(),
    ]);
  } catch (err) {
    console.error("Error loading post:", err);
  }

  if (!post) notFound();

  const postRecord = post as PostRecord;
  const html = postRecord.markdown_content
    ? markdownToHtml(postRecord.markdown_content)
    : renderTiptapHtml(post?.content ?? null);
  const quizzes = extractQuizzes(html);
  const cleanHtml = quizzes.length > 0 ? stripQuizBlocks(html) : html;
  const toneStyle = { ["--tone" as string]: getCategoryTone(post?.category ?? "cell-chemistry") } as CSSProperties;
  const references = postRecord.references ?? [];
  const headings = extractHeadings(cleanHtml);

  const relatedByCategory = allPosts
    .filter((item) => item.slug !== post?.slug && item.category === post?.category)
    .slice(0, 4);

  const tagSet = new Set((post?.tags ?? []).map((tag) => tag.toLowerCase()));
  const relatedByTags = allPosts
    .filter(
      (item) =>
        item.slug !== post?.slug && item.tags?.some((tag) => tagSet.has(tag.toLowerCase())),
    )
    .slice(0, 4);

  const coverUrl = post?.cover_url;
  const faqs = postRecord.faqs ?? [];
  const inlineFaqs = postRecord.markdown_content
    ? extractInlineFaqs(postRecord.markdown_content)
    : [];
  const allFaqs = faqs.length > 0 ? faqs : inlineFaqs;
  const articleSchema = getArticleSchema({
    title: post.title,
    description: post.excerpt ?? "",
    slug: post.slug,
    cover_url: post.cover_url ?? undefined,
    author: "Sai Chaitanya Dasari",
    publishedAt: post.created_at ?? undefined,
    modifiedAt: post.updated_at ?? undefined,
    category: post.category ?? undefined,
    tags: post.tags ?? undefined,
    reading_time: post.reading_time ?? undefined,
  });

  return (
    <>
      <ReadingProgress />
      <article className="page-main wrapper">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
        />
        {allFaqs.length > 0 && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(getFAQSchema(allFaqs)) }}
          />
        )}
        {coverUrl && (
          <div className="post-cover-image">
            <img 
              src={coverUrl} 
              alt={post?.title ?? ""}
            />
          </div>
        )}

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
            <section className="article-content prose">
              <ArticleContent html={cleanHtml} quizzes={quizzes} />
            </section>

            <ReactionBar />

            {/* Author Bio - E-E-A-T Signal */}
            <section className="author-bio">
              <div className="author-avatar">
                <span className="author-initials">SD</span>
              </div>
              <div className="author-info">
                <p className="author-label">Written by</p>
                <h4 className="author-name">Sai Chaitanya Dasari</h4>
                <p className="author-title">Battery Systems Engineer | Volvo Eicher Commercial Vehicles</p>
                <p className="author-desc">3+ years in commercial EV pack development. Writing about real battery engineering from the bench.</p>
              </div>
            </section>

            {/* FAQ Section - AI Discoverable */}
            {allFaqs.length > 0 && (
              <section className="faq-list-card" aria-labelledby="faq-heading">
                <h2 id="faq-heading">Frequently Asked Questions</h2>
                {allFaqs.map((faq, idx) => (
                  <details key={idx} className="faq-item">
                    <summary className="faq-question">{faq.question}</summary>
                    <div className="faq-answer">{faq.answer}</div>
                  </details>
                ))}
              </section>
            )}

            {references.length ? (
              <section className="references-card" aria-labelledby="references-heading">
                <h2 id="references-heading">References</h2>
                <ol>
                  {references.map((ref) => (
                    <li key={ref.url}>
                      <a href={ref.url} target="_blank" rel="noreferrer noopener">
                        {ref.title}
                      </a>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}
          </div>

          <aside className="post-sidebar">
            <details className="sidebar-card toc-details" open>
              <summary className="toc-details-summary">
                <h3 className="sidebar-title" id="toc-heading">In This Article</h3>
              </summary>
              <TableOfContents headings={headings} />
            </details>

            <section className="sidebar-card" aria-labelledby="related-category-heading">
              <h3 className="sidebar-title" id="related-category-heading">Related In {post.category ?? "this category"}</h3>
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

            <section className="sidebar-card" aria-labelledby="similar-topics-heading">
              <h3 className="sidebar-title" id="similar-topics-heading">Similar Topics</h3>
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

            <section className="sidebar-card" aria-labelledby="newsletter-heading">
              <h3 className="sidebar-title" id="newsletter-heading">Newsletter</h3>
              <p className="text-sm text-[var(--text2)] mb-3">Get weekly EV battery insights delivered to your inbox.</p>
              <NewsletterForm compact />
            </section>
          </aside>
        </div>
      </article>
    </>
  );
}