import { requireAdminUser } from "@/lib/auth";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import type { PostRecord } from "@/types/post";
import { AdminDeleteCategoryButton } from "@/components/AdminDeleteCategoryButton";

export default async function AdminCategoriesPage() {
  await requireAdminUser();
  const supabase = await getServerSupabaseClient();
  const { data: catData } = await supabase.from("categories").select("slug, name").order("name");
  const { data: postData } = await supabase.from("posts").select("category");
  const posts = (postData ?? []) as Pick<PostRecord, "category">[];

  const postCounts = posts.reduce<Record<string, number>>((acc, post) => {
    const key = (post.category ?? "post").toLowerCase();
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const categories = (catData ?? []).map((c) => ({
    ...c,
    postCount: postCounts[c.slug] ?? 0,
  }));

  return (
    <section className="panel p-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black">Categories</h1>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            Manage categories. Deleting a category keeps existing posts unchanged.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.length ? (
          categories.map((cat) => (
            <article key={cat.slug} className="rounded-xl border border-[var(--border)] p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                    Category
                  </p>
                  <p className="mt-1 text-xl font-black truncate">{cat.name}</p>
                  <p className="mt-1 text-sm text-[var(--ink-soft)]">
                    {cat.postCount} post(s)
                  </p>
                  <p className="text-xs text-[var(--text3)]">/{cat.slug}</p>
                </div>
                <AdminDeleteCategoryButton slug={cat.slug} name={cat.name} postCount={cat.postCount} />
              </div>
            </article>
          ))
        ) : (
          <p className="text-sm text-[var(--ink-soft)]">No categories found.</p>
        )}
      </div>
    </section>
  );
}
