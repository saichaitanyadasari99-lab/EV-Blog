import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedPostBySlug, getPublishedPosts } from "@/lib/posts";
import "katex/dist/katex.min.css";
import { renderTiptapHtml } from "@/lib/tiptap";
import { markdownToHtml } from "@/lib/markdown";
import type { PostRecord } from "@/types/post";
import { getArticleSchema, getFAQSchema, getBreadcrumbSchema } from "@/lib/schema";
import { ArticleContent } from "@/components/ArticleContent";
import { MobileTOC } from "@/components/MobileTOC";
import { BottomTabBar } from "@/components/BottomTabBar";
import { ArticleLayout } from "@/components/article/ArticleLayout";
import { ArticleHero } from "@/components/article/ArticleHero";
import { SeriesNav } from "@/components/article/SeriesNav";
import "@/styles/article-prose.css";
import "@/styles/article-layout.css";

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
  const items: Array<{ text: string; id: string; level: 2 | 3 }> = [];

  const h2Matches = [...html.matchAll(/<h2[^>]*>(.*?)<\/h2>/gi)];
  for (const match of h2Matches) {
    const raw = match[0];
    const inner = match[1] ?? "";
    const text = stripTags(inner.replace(/<button[^>]*class="anchor-btn"[^>]*>.*?<\/button>/gi, ""));
    const idAttr = raw.match(/id="([^"]+)"/);
    const id = idAttr
      ? idAttr[1]
      : text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
    if (text && id) items.push({ text, id, level: 2 });
  }

  const h3Matches = [...html.matchAll(/<h3[^>]*>(.*?)<\/h3>/gi)];
  for (const match of h3Matches) {
    const raw = match[0];
    const inner = match[1] ?? "";
    const text = stripTags(inner.replace(/<button[^>]*class="anchor-btn"[^>]*>.*?<\/button>/gi, ""));
    const idAttr = raw.match(/id="([^"]+)"/);
    const id = idAttr
      ? idAttr[1]
      : text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
    if (text && id) items.push({ text, id, level: 3 });
  }

  return items.slice(0, 16);
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
    alternates: { canonical: canonicalUrl },
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
  const cleanHtml = stripH1(quizzes.length > 0 ? stripQuizBlocks(html) : html);
  const references = postRecord.references ?? [];
  const headings = extractHeadings(cleanHtml);

  const postTags = Array.isArray(post?.tags)
    ? post.tags
    : typeof post?.tags === "string"
    ? [post.tags]
    : [];

  const tagSet = new Set(postTags.map((t) => t.toLowerCase()));
  const relatedByTags = allPosts
    .filter((item) => {
      const itemTags = Array.isArray(item.tags) ? item.tags : typeof item.tags === "string" ? [item.tags] : [];
      return item.slug !== post?.slug && itemTags.some((t) => tagSet.has(t.toLowerCase()));
    })
    .slice(0, 4);

  void relatedByTags; // used in future related articles section

  const faqs = postRecord.faqs ?? [];
  const inlineFaqs = postRecord.markdown_content ? extractInlineFaqs(postRecord.markdown_content) : [];
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

  const tierOrder = ["basic", "intermediate", "advanced", "expert", "master"];
  const seriesPosts = post.tier
    ? allPosts
        .filter((item) => item.slug !== post.slug && item.category === post.category && item.tier)
        .sort((a, b) => tierOrder.indexOf(a.tier || "basic") - tierOrder.indexOf(b.tier || "basic"))
    : [];

  const allSeriesPosts = post.tier
    ? [post, ...seriesPosts].sort((a, b) => tierOrder.indexOf(a.tier || "basic") - tierOrder.indexOf(b.tier || "basic"))
    : [];

  return (
    <>
      {/* JSON-LD Schema */}
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

      {/* Hero — full-width, outside the 3-col grid */}
      <ArticleHero
        title={post.title}
        excerpt={post.excerpt}
        category={post.category}
        tier={post.tier}
        createdAt={post.created_at}
        readingTime={post.reading_time}
        tags={postTags}
      />

      {/* 3-column layout */}
      <ArticleLayout
        headings={headings}
        tier={post.tier}
        tags={postTags}
      >
        {/* Mobile TOC (visible below 1200px) */}
        <MobileTOC headings={headings} />

        {/* Article body */}
        <section data-article-body aria-label="Article content">
          <ArticleContent html={cleanHtml} quizzes={quizzes} />
        </section>

        {/* Article footer tags */}
        {postTags.length > 0 && (
          <div className="article-tags-foot" style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid var(--border-light)", display: "flex", flexWrap: "wrap", gap: ".5rem", alignItems: "center" }}>
            <span style={{ fontFamily: "var(--font-head)", fontSize: ".7rem", color: "var(--text-dim)", fontWeight: 600, letterSpacing: ".05em" }}>Tags</span>
            {postTags.map((tag) => (
              <a
                key={tag}
                href={`/blogs?tag=${encodeURIComponent(tag)}`}
                style={{ fontFamily: "var(--font-head)", fontSize: ".7rem", padding: ".2rem .55rem", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "3px", color: "var(--text-muted)", textDecoration: "none" }}
              >
                {tag}
              </a>
            ))}
          </div>
        )}

        {/* Series Navigation */}
        <SeriesNav
          seriesPosts={allSeriesPosts}
          currentSlug={post.slug}
          category={post.category ?? ""}
        />

        {/* Author bio */}
        <div className="author-bio">
          <div className="author-avatar">
            <span className="author-initials">SD</span>
          </div>
          <div className="author-info">
            <p className="author-label">Written by</p>
            <h4 className="author-name">Sai Chaitanya Dasari</h4>
            <p className="author-title">Battery Systems Engineer · Volvo Eicher Commercial Vehicles</p>
            <p className="author-desc">3+ years in commercial EV pack development. Writing about real battery engineering from the bench.</p>
          </div>
        </div>

        {/* FAQ accordion */}
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

        {/* References */}
        {references.length > 0 && (
          <section className="references-card" aria-labelledby="references-heading">
            <h2 id="references-heading">References</h2>
            <ol>
              {references.map((ref, idx) => (
                <li key={`${ref.url}-${idx}`}>
                  <a href={ref.url} target="_blank" rel="noreferrer noopener">
                    {ref.title}
                  </a>
                </li>
              ))}
            </ol>
          </section>
        )}
      </ArticleLayout>

      <BottomTabBar />
    </>
  );
}
