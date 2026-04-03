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
    <article className="shell py-10">
      <header className="panel p-7 md:p-10">
        <p className="chip inline-flex">
          {post.category ?? "Uncategorized"}
        </p>
        <h1 className="mt-4 text-4xl font-black leading-tight md:text-5xl">{post.title}</h1>
        <p className="mt-3 text-sm text-[var(--ink-soft)]">
          {new Date(post.created_at).toLocaleDateString()} | {post.reading_time ?? 1} min
          read
        </p>
      </header>

      <section
        className="prose panel mt-7 max-w-none p-7 md:p-10"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </article>
  );
}
