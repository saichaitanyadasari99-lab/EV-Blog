import { notFound } from "next/navigation";
import { getPublishedPostBySlug } from "@/lib/posts";
import { renderTiptapHtml } from "@/lib/tiptap";

type Params = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 60;

export default async function BlogPostPage({ params }: Params) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);

  if (!post) notFound();

  const html = renderTiptapHtml(post.content);

  return (
    <article className="mx-auto w-full max-w-4xl px-4 py-10">
      <header className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-7 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
          {post.category ?? "Uncategorized"}
        </p>
        <h1 className="mt-2 text-4xl font-black leading-tight">{post.title}</h1>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          {new Date(post.created_at).toLocaleDateString()} | {post.reading_time ?? 1} min
          read
        </p>
      </header>

      <section
        className="prose mt-7 max-w-none rounded-2xl border border-[var(--border)] bg-white p-7"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </article>
  );
}
