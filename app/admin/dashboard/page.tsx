import Link from "next/link";
import { requireAdminUser } from "@/lib/auth";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import type { PostRecord } from "@/types/post";
import { AdminSeedButton } from "@/components/AdminSeedButton";

export default async function AdminDashboardPage() {
  const user = await requireAdminUser();
  const supabase = await getServerSupabaseClient();
  const { data } = await supabase.from("posts").select("*").order("updated_at", { ascending: false });
  const posts = (data ?? []) as PostRecord[];

  const published = posts.filter((post) => post.published).length;
  const drafts = posts.length - published;
  const categories = new Set(posts.map((post) => post.category ?? "post")).size;

  return (
    <div className="space-y-4">
      <section className="panel p-6">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--accent)]">
          VoltPulse Admin
        </p>
        <h1 className="mt-2 text-3xl font-black">Dashboard</h1>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">Signed in as {user.email}</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="panel p-5">
          <p className="text-sm text-[var(--ink-soft)]">Total Posts</p>
          <p className="mt-2 text-3xl font-black">{posts.length}</p>
        </article>
        <article className="panel p-5">
          <p className="text-sm text-[var(--ink-soft)]">Published</p>
          <p className="mt-2 text-3xl font-black">{published}</p>
        </article>
        <article className="panel p-5">
          <p className="text-sm text-[var(--ink-soft)]">Drafts</p>
          <p className="mt-2 text-3xl font-black">{drafts}</p>
        </article>
      </section>

      <section className="panel p-6">
        <h2 className="text-xl font-black">Quick Actions</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/admin/new" className="rounded-lg bg-[var(--accent)] px-4 py-2 font-semibold text-white">
            Create Post
          </Link>
          <Link href="/admin/posts" className="rounded-lg border border-[var(--border)] px-4 py-2 font-semibold">
            Manage Posts
          </Link>
          <Link href="/admin/categories" className="rounded-lg border border-[var(--border)] px-4 py-2 font-semibold">
            Categories ({categories})
          </Link>
          <AdminSeedButton />
        </div>
      </section>
    </div>
  );
}
