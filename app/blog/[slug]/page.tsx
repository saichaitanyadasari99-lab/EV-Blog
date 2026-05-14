import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import { getCategoryTone } from "@/lib/category-theme";
import { getPublishedPostBySlug, getPublishedPosts } from "@/lib/posts";
import "katex/dist/katex.min.css";
import { renderTiptapHtml } from "@/lib/tiptap";
import { markdownToHtml } from "@/lib/markdown";
import type { PostRecord } from "@/types/post";
import { NewsletterForm } from "@/components/NewsletterForm";
import { ReadingProgress } from "@/components/ReadingProgress";
import { TableOfContents } from "@/components/TableOfContents";
import { getArticleSchema, getFAQSchema, getBreadcrumbSchema } from "@/lib/schema";
import { ArticleContent } from "@/components/ArticleContent";
import { Breadcrumb } from "@/components/Breadcrumb";
import { MobileTOC } from "@/components/MobileTOC";
import { BottomTabBar } from "@/components/BottomTabBar";
import { SeriesWidget } from "@/components/SeriesWidget";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.evpulse.co.in";

type Params = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 300;

export async function generateStaticParams() {
  const posts = await getPublishedPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

function stripTags(value: string) {
  return value.replace(/<[^>]*>/g, "").trim();
}

function stripH1(value: string): string {
  return value.replace(/<h1[^>]*>.*?<\/h1>/i, "");
}

function extractHeadings(html: string) {
  const matches = [...html.matchAll(/<h2[^>]*>(.*?)<\/h2>/gi)];
  return matches
    .map((match) => {
      const raw = match[0];
      const inner = match[1] ?? "";
      const text = stripTags(inner.replace(/<button[^>]*class="anchor-btn"[^>]*>.*?<\/button>/gi, ""));
      const idAttr = raw.match(/id="([^"]+)"/);
      const id = idAttr
        ? idAttr[1]
        : text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
      return { text, id };
    })
    .filter((h) => h.text && h.id)
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

const TIER_LABELS: Record<string, string> = {
  basic: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  expert: "Expert",
};

const TIER_CLASSES: Record<string, string> = {
  basic: "level-beginner",
  intermediate: "level-intermediate",
  advanced: "level-advanced",
  expert: "level-expert",
};

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
  const cleanHtml = stripH1(quizzes.length > 0 ? stripQuizBlocks(html) : html);
  const references = postRecord.references ?? [];
  const headings = extractHeadings(cleanHtml);

  const relatedByCategory = allPosts
    .filter((item) => item.slug !== post?.slug && item.category === post?.category)
    .slice(0, 4);

  const postTags = Array.isArray(post?.tags) ? post.tags : typeof post?.tags === "string" ? [post.tags] : [];
  const tagSet = new Set(postTags.map((tag) => tag.toLowerCase()));
  const relatedByTags = allPosts
    .filter(
      (item) => {
        const itemTags = Array.isArray(item.tags) ? item.tags : typeof item.tags === "string" ? [item.tags] : [];
        return item.slug !== post?.slug && itemTags.some((tag) => tagSet.has(tag.toLowerCase()));
      },
    )
    .slice(0, 4);

  const coverUrl = post?.cover_url;
  const faqs = postRecord.faqs ?? [];
  const inlineFaqs = postRecord.markdown_content
    ? extractInlineFaqs(postRecord.markdown_content)
    : [];
  const allFaqs = faqs.length > 0 ? faqs : inlineFaqs;
  const categorySlug = post?.category
    ? post.category.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
    : "";
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
    tier: post.tier ?? undefined,
    categorySlug: categorySlug || undefined,
  });

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: baseUrl },
    { name: post.category || "Articles", url: `${baseUrl}/blogs` },
    { name: post.title, url: `${baseUrl}/blog/${post.slug}` },
  ]);

  const tierOrder = ["basic", "intermediate", "advanced", "expert"];
  const seriesPosts = post.tier ? allPosts
    .filter((item) => item.slug !== post.slug && item.category === post.category && item.tier)
    .sort((a, b) => {
      return tierOrder.indexOf(a.tier || "basic") - tierOrder.indexOf(b.tier || "basic");
    }) : [];

  const prevInSeries = seriesPosts.length > 0
    ? seriesPosts.filter((p) => {
        return tierOrder.indexOf(p.tier || "basic") < tierOrder.indexOf(post.tier || "basic");
      }).pop()
    : null;

  const nextInSeries = seriesPosts.length > 0
    ? seriesPosts.find((p) => {
        return tierOrder.indexOf(p.tier || "basic") > tierOrder.indexOf(post.tier || "basic");
      })
    : null;

  const allSeriesPosts = post.tier
    ? [post, ...seriesPosts]
        .sort((a, b) => tierOrder.indexOf(a.tier || "basic") - tierOrder.indexOf(b.tier || "basic"))
    : [];

  return (
    <>
      <ReadingProgress />

      {/* JSON-LD Schema Scripts */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {allFaqs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(getFAQSchema(allFaqs)) }}
        />
      )}

      {/* HERO IMAGE (full width, above article) */}
      {coverUrl && (
        <div className="post-cover-image">
          <Image
            src={coverUrl}
            alt={post?.title ?? ""}
            fill
            sizes="100vw"
            className="post-cover-img"
            priority
          />
        </div>
      )}

      {/* META BAR: breadcrumb + tag pill */}
      <div className="article-meta-bar">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Articles", href: "/blogs" },
            { label: post.title ?? "" },
          ]}
        />
        {post.category && <span className="tag-pill">{post.category}</span>}
      </div>

      {/* LAYOUT GRID: article + sidebar */}
      <div className="layout">

        {/* ARTICLE COLUMN */}
        <article className="article" id="article-body">

          <h1>{post.title}</h1>

          <div className="article-meta">
            <span>{new Date(post.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
            <span className="dot">·</span>
            <span>{post.reading_time ?? 1} min read</span>
            {post.tier && (
              <>
                <span className="dot">·</span>
                <span className={`level-badge ${TIER_CLASSES[post.tier] || ""}`}>
                  {TIER_LABELS[post.tier] || post.tier}
                </span>
              </>
            )}
          </div>

          {/* MOBILE TOC */}
          <MobileTOC headings={headings} />

          {/* ARTICLE BODY */}
          <section className="article-content prose">
            <ArticleContent html={cleanHtml} quizzes={quizzes} />
          </section>

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

          {/* FAQ Section */}
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

          {/* Series Navigation */}
          {(prevInSeries || nextInSeries) && (
            <section className="series-nav" aria-labelledby="series-heading">
              <h2 id="series-heading">Part of the {post.category} Series</h2>
              <div className="series-nav-links">
                {prevInSeries && (
                  <Link href={`/blog/${prevInSeries.slug}`} className="series-nav-prev">
                    <span className="series-nav-direction">← Previous</span>
                    <span className="series-nav-title">{prevInSeries.title}</span>
                  </Link>
                )}
                {nextInSeries && (
                  <Link href={`/blog/${nextInSeries.slug}`} className="series-nav-next">
                    <span className="series-nav-direction">Next →</span>
                    <span className="series-nav-title">{nextInSeries.title}</span>
                  </Link>
                )}
              </div>
            </section>
          )}

          {/* References */}
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
        </article>

        {/* SIDEBAR */}
        <aside className="sidebar">

          {/* TOC Widget */}
          <div className="toc-widget">
            <div className="toc-title">In This Article</div>
            <TableOfContents headings={headings} />
          </div>

          {/* Series Widget */}
          {allSeriesPosts.length > 1 && (
            <SeriesWidget
              seriesPosts={allSeriesPosts}
              currentSlug={post.slug}
              category={post.category ?? ""}
            />
          )}

          {/* Related In Category */}
          {relatedByCategory.length > 0 && (
            <section className="sidebar-card" aria-labelledby="related-category-heading">
              <h3 className="sidebar-title" id="related-category-heading">Related In {post.category ?? "this category"}</h3>
              <ul className="sidebar-links">
                {relatedByCategory.map((item) => (
                  <li key={item.id}>
                    <Link href={`/blog/${item.slug}`}>{item.title}</Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Newsletter Widget */}
          <div className="newsletter-widget">
            <h4>Weekly EV Insights</h4>
            <p>Battery engineering delivered to your inbox every week.</p>
            <NewsletterForm compact />
          </div>

          {/* Similar Topics */}
          {relatedByTags.length > 0 && (
            <section className="sidebar-card" aria-labelledby="similar-topics-heading">
              <h3 className="sidebar-title" id="similar-topics-heading">Similar Topics</h3>
              <ul className="sidebar-links">
                {relatedByTags.map((item) => (
                  <li key={item.id}>
                    <Link href={`/blog/${item.slug}`}>{item.title}</Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>

      <BottomTabBar />
    </>
  );
}
