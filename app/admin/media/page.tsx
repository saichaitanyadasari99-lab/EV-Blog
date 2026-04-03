import Link from "next/link";
import { requireAdminUser } from "@/lib/auth";

export default async function AdminMediaPage() {
  await requireAdminUser();

  return (
    <section className="panel p-6">
      <h1 className="text-2xl font-black">Media Library</h1>
      <p className="mt-2 text-sm text-[var(--ink-soft)]">
        Media uploads are currently handled directly inside the editor and stored in
        Supabase bucket `media`.
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <article className="rounded-xl border border-[var(--border)] p-4">
          <h2 className="font-bold">Upload Workflow</h2>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            Go to editor, drag files, and embed them inline. Public URLs are generated
            automatically.
          </p>
        </article>
        <article className="rounded-xl border border-[var(--border)] p-4">
          <h2 className="font-bold">Next Upgrade</h2>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            We can add a standalone media browser page with search/filter and delete
            actions.
          </p>
        </article>
      </div>

      <div className="mt-5">
        <Link href="/admin/new" className="rounded-lg bg-[var(--accent)] px-4 py-2 font-semibold text-white">
          Open Editor Uploader
        </Link>
      </div>
    </section>
  );
}
