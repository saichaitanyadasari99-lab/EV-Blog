import { getPublishedPosts } from "@/lib/posts";
import { PostCard } from "@/components/PostCard";

export const revalidate = 60;

export default async function BlogsPage() {
  const posts = await getPublishedPosts();
  const categoryCount = posts.reduce<Record<string, number>>((acc, post) => {
    const key = post.category ?? "uncategorized";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <main className="shell py-8">
      <header className="panel p-8">
        <div className="chip">Blogs</div>
        <h1 className="mt-3 text-4xl font-black md:text-5xl">All Published Articles</h1>
        <p className="mt-3 max-w-2xl text-[var(--ink-soft)]">
          A complete archive of EV battery research notes, benchmarks, and long-form
          explainers.
        </p>
      </header>

      <section className="mt-4 flex flex-wrap gap-2">
        {Object.entries(categoryCount).map(([category, count]) => (
          <span key={category} className="chip">
            {category} ({count})
          </span>
        ))}
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {posts.length ? (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        ) : (
          <p className="text-sm text-[var(--ink-soft)]">No posts published yet.</p>
        )}
      </section>
    </main>
  );
}
