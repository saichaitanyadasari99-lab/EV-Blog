import { requireAdminUser } from "@/lib/auth";
import { getServerSupabaseClient } from "@/lib/supabase/server";

type Subscriber = {
  id: string;
  email: string;
  full_name: string | null;
  source: string | null;
  created_at: string;
  opted_in: boolean;
};

type Inquiry = {
  id: string;
  full_name: string;
  email: string;
  subject: string;
  created_at: string;
};

export default async function AdminNewsletterPage() {
  await requireAdminUser();
  const supabase = await getServerSupabaseClient();

  const [{ data: subscribersData }, { data: inquiriesData }] = await Promise.all([
    supabase
      .from("newsletter_subscribers")
      .select("*")
      .eq("opted_in", true)
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("contact_submissions")
      .select("id,full_name,email,subject,created_at")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const subscribers = (subscribersData ?? []) as Subscriber[];
  const inquiries = (inquiriesData ?? []) as Inquiry[];
  const emailList = subscribers.map((s) => s.email).join(", ");

  return (
    <section className="panel p-6">
      <h1 className="text-2xl font-black">Newsletter</h1>
      <p className="mt-2 text-sm text-[var(--ink-soft)]">
        Manage subscriber emails collected from your contact/subscribe form.
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <article className="rounded-xl border border-[var(--border)] p-4">
          <h2 className="font-bold">Subscribers</h2>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">{subscribers.length}</p>
        </article>
        <article className="rounded-xl border border-[var(--border)] p-4">
          <h2 className="font-bold">Inquiries</h2>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">{inquiries.length}</p>
        </article>
        <article className="rounded-xl border border-[var(--border)] p-4">
          <h2 className="font-bold">Broadcast Ready</h2>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">Copy emails and send new-post updates.</p>
        </article>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-[var(--border)] p-4">
          <h2 className="font-bold">Subscriber Email List</h2>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">
            Copy this list into your mail client BCC field.
          </p>
          <textarea
            readOnly
            value={emailList}
            className="mt-3 min-h-[180px] w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-xs"
          />
        </article>

        <article className="rounded-xl border border-[var(--border)] p-4">
          <h2 className="font-bold">Recent Submissions</h2>
          <div className="mt-3 space-y-2">
            {inquiries.length ? (
              inquiries.map((item) => (
                <div key={item.id} className="rounded-lg border border-[var(--border)] p-3">
                  <p className="text-sm font-semibold">{item.subject}</p>
                  <p className="text-xs text-[var(--ink-soft)]">
                    {item.full_name} | {item.email}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--ink-soft)]">No submissions yet.</p>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
