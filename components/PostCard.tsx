import Link from "next/link";
import type { PostRecord } from "@/types/post";

type Props = {
  post: PostRecord;
};

export function PostCard({ post }: Props) {
  return (
    <article className="panel fade-up p-5 transition hover:-translate-y-0.5 hover:shadow-md">
      <p className="chip inline-flex">
        {post.category ?? "Uncategorized"}
      </p>
      <h2 className="mt-2 text-2xl font-bold leading-tight text-[var(--foreground)]">
        <Link href={`/blog/${post.slug}`} className="hover:underline">
          {post.title}
        </Link>
      </h2>
      <p className="mt-3 text-sm text-[var(--ink-soft)]">
        {post.excerpt ?? "No excerpt added yet."}
      </p>
      <div className="mt-4 flex items-center justify-between text-xs text-[var(--ink-soft)]">
        <span>{new Date(post.created_at).toLocaleDateString()}</span>
        <span>{post.reading_time ?? 1} min read</span>
      </div>
    </article>
  );
}
