import Link from "next/link";
import { requireAdminUser } from "@/lib/auth";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import type { PostRecord } from "@/types/post";
import { AdminDeletePostButton } from "@/components/AdminDeletePostButton";

export default async function AdminPostsPage() {
  await requireAdminUser();
  const supabase = await getServerSupabaseClient();
  const { data } = await supabase.from("posts").select("*").order("updated_at", { ascending: false });
  const posts = (data ?? []) as PostRecord[];

  return (
    <section className="panel p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Posts</h1>
          <p className="text-sm text-[var(--ink-soft)]">Manage drafts, published content, and edits.</p>
        </div>
        <Link href="/admin/new" className="rounded-lg bg-[var(--accent)] px-4 py-2 font-semibold text-white">
          New Post
        </Link>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-[var(--ink-soft)]">
              <th className="px-2 py-2">Title</th>
              <th className="px-2 py-2">Category</th>
              <th className="px-2 py-2">Status</th>
              <th className="px-2 py-2">Updated</th>
              <th className="px-2 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} className="border-b border-[var(--border)]/70">
                <td className="px-2 py-3 font-semibold">{post.title}</td>
                <td className="px-2 py-3">{post.category ?? "post"}</td>
                <td className="px-2 py-3">{post.published ? "Published" : "Draft"}</td>
                <td className="px-2 py-3">{new Date(post.updated_at).toLocaleDateString()}</td>
                <td className="px-2 py-3">
                  <div className="flex gap-2">
                    <Link href={`/admin/edit/${post.id}`} className="rounded border border-[var(--border)] px-2 py-1">
                      Edit
                    </Link>
                    <Link href={`/blog/${post.slug}`} className="rounded border border-[var(--border)] px-2 py-1">
                      View
                    </Link>
                    <AdminDeletePostButton id={post.id} title={post.title} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!posts.length ? (
          <p className="mt-4 text-sm text-[var(--ink-soft)]">No posts yet. Create your first one.</p>
        ) : null}
      </div>
    </section>
  );
}
