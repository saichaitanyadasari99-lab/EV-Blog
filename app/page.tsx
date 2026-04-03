import Link from "next/link";
import { getPublishedPosts } from "@/lib/posts";
import { PostCard } from "@/components/PostCard";

export default async function Home() {
  const posts = await getPublishedPosts();
  const latest = posts.slice(0, 3);

  return (
    <main className="shell py-8">
      <header className="panel fade-up overflow-hidden p-8 md:p-10">
        <div className="chip">EV Research Journal</div>
        <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight md:text-6xl">
          Modern EV battery blog for engineers, founders, and enthusiasts.
        </h1>
        <p className="mt-4 max-w-2xl text-base text-[var(--ink-soft)] md:text-lg">
          Read practical analysis on cell chemistry, BMS strategy, thermal behavior,
          charging benchmarks, and Indian EV market performance.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/blogs"
            className="rounded-lg bg-[var(--accent)] px-5 py-2.5 font-semibold text-white hover:bg-[var(--accent-strong)]"
          >
            Browse Blogs
          </Link>
          <Link
            href="/admin/new"
            className="rounded-lg border border-[var(--border)] bg-white px-5 py-2.5 font-semibold"
          >
            Open Admin
          </Link>
        </div>
      </header>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          "Cell chemistry and degradation modeling",
          "Pack architecture and BMS fault logic",
          "Real-world EV benchmark datasets",
        ].map((item) => (
          <article key={item} className="panel p-5">
            <h2 className="text-lg font-bold">{item}</h2>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">
              Clear write-ups with actionable conclusions, not generic summaries.
            </p>
          </article>
        ))}
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-2xl font-black">Latest Posts</h2>
          <Link href="/blogs" className="text-sm font-semibold text-[var(--accent)]">
            View all
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {latest.length ? (
            latest.map((post) => <PostCard key={post.id} post={post} />)
          ) : (
            <p className="text-sm text-[var(--ink-soft)]">No published posts yet.</p>
          )}
        </div>
      </section>

      <section className="panel mt-10 p-8 md:p-10">
        <h2 className="text-3xl font-black">Want tailored EV analysis?</h2>
        <p className="mt-3 max-w-2xl text-[var(--ink-soft)]">
          For founders and engineering teams, this blog can evolve into a decision
          dashboard with custom benchmark breakdowns and battery risk notes.
        </p>
        <div className="mt-6">
          <Link
            href="/contact"
            className="rounded-lg bg-[var(--accent)] px-5 py-2.5 font-semibold text-white hover:bg-[var(--accent-strong)]"
          >
            Contact for Collaboration
          </Link>
        </div>
      </section>
    </main>
  );
}
