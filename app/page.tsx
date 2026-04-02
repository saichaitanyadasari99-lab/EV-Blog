import Link from "next/link";
import { getPublishedPosts } from "@/lib/posts";
import { PostCard } from "@/components/PostCard";

export default async function Home() {
  const posts = await getPublishedPosts();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <header className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
          EV Website Blog
        </p>
        <h1 className="mt-2 text-4xl font-black leading-tight">
          Battery engineering insights, benchmarks, and reviews.
        </h1>
        <p className="mt-3 max-w-2xl text-[var(--ink-soft)]">
          Publish directly from your admin editor. Posts are fetched from your existing
          Supabase project at runtime, so updates appear without redeploying.
        </p>
        <div className="mt-5 flex gap-3">
          <Link
            href="/admin/new"
            className="rounded-lg bg-[var(--accent)] px-4 py-2 font-semibold text-white"
          >
            Open Admin
          </Link>
        </div>
      </header>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        {posts.length ? (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        ) : (
          <p className="text-sm text-[var(--ink-soft)]">No published posts yet.</p>
        )}
      </section>
    </main>
  );
}
