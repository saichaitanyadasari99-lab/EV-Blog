import { requireAdminUser } from "@/lib/auth";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import type { PostRecord } from "@/types/post";

export default async function AdminCategoriesPage() {
  await requireAdminUser();
  const supabase = await getServerSupabaseClient();
  const { data } = await supabase.from("posts").select("*");
  const posts = (data ?? []) as PostRecord[];

  const counts = posts.reduce<Record<string, number>>((acc, post) => {
    const key = (post.category ?? "post").toLowerCase();
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <section className="panel p-6">
      <h1 className="text-2xl font-black">Categories</h1>
      <p className="mt-2 text-sm text-[var(--ink-soft)]">
        Category distribution from current posts. Use editor to assign categories.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(counts).length ? (
          Object.entries(counts).map(([name, count]) => (
            <article key={name} className="rounded-xl border border-[var(--border)] p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                Category
              </p>
              <p className="mt-1 text-xl font-black capitalize">{name}</p>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">{count} post(s)</p>
            </article>
          ))
        ) : (
          <p className="text-sm text-[var(--ink-soft)]">No categorized posts yet.</p>
        )}
      </div>
    </section>
  );
}
