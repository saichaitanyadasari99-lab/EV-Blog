import Link from "next/link";
import { AdminLogin } from "@/components/AdminLogin";
import { getSessionUser, isAdminEmail } from "@/lib/auth";

export default async function AdminPage() {
  const user = await getSessionUser();

  if (!user?.email || !isAdminEmail(user.email)) {
    return <AdminLogin />;
  }

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">Signed in as {user.email}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/admin/new"
            className="rounded-lg bg-[var(--accent)] px-4 py-2 font-semibold text-white"
          >
            New Post
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-[var(--border)] bg-white px-4 py-2 font-semibold"
          >
            View Site
          </Link>
        </div>
      </div>
    </main>
  );
}
