"use client";

import { useEffect, useState } from "react";

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

type QueueStatus = {
  totalSubscribers: number;
  pendingPosts: number;
  currentPosition: number;
  remainingThisWeek: number;
  batchesRemaining: number;
  weekStarted: string | null;
};

export function AdminNewsletterClient({
  subscribers,
  inquiries,
}: {
  subscribers: Subscriber[];
  inquiries: Inquiry[];
}) {
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<{
    sent: number;
    failed: number;
    message: string;
  } | null>(null);
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);

  useEffect(() => {
    loadQueueStatus();
  }, []);

  async function loadQueueStatus() {
    try {
      const res = await fetch("/api/newsletter/send", { method: "GET" });
      if (res.ok) {
        const data = await res.json();
        setQueueStatus(data);
      }
    } catch {
      // ignore
    }
  }

  async function sendNextBatch() {
    if (!confirm("Send next batch of 100 emails?")) return;

    setSending(true);
    setLastResult(null);

    try {
      const res = await fetch("/api/newsletter/send", { method: "POST" });
      const data = await res.json();

      if (res.ok && data.success) {
        setLastResult({
          sent: data.sent,
          failed: data.failed,
          message: `Sent ${data.sent} emails (batch ${data.batch.start}-${data.batch.end} of ${data.batch.total})`,
        });
        loadQueueStatus();
      } else {
        setLastResult({
          sent: 0,
          failed: 0,
          message: data.error || "Failed to send",
        });
      }
    } catch (err) {
      setLastResult({
        sent: 0,
        failed: 0,
        message: String(err),
      });
    }

    setSending(false);
  }

  const emailList = subscribers.map((s) => s.email).join(", ");

  return (
    <section className="space-y-4">
      <div className="panel p-6">
        <h1 className="text-2xl font-black">Newsletter</h1>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Send weekly updates in batches of 100 emails per day.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <article className="panel p-4">
          <h2 className="font-bold">Subscribers</h2>
          <p className="mt-1 text-2xl font-black">{subscribers.length}</p>
        </article>
        <article className="panel p-4">
          <h2 className="font-bold">This Week</h2>
          <p className="mt-1 text-2xl font-black">
            {queueStatus?.remainingThisWeek ?? 0}
          </p>
          <p className="text-xs text-[var(--ink-soft)]">emails pending</p>
        </article>
        <article className="panel p-4">
          <h2 className="font-bold">Batches Left</h2>
          <p className="mt-1 text-2xl font-black">
            {queueStatus?.batchesRemaining ?? 0}
          </p>
          <p className="text-xs text-[var(--ink-soft)]">to send today</p>
        </article>
        <article className="panel p-4">
          <h2 className="font-bold">Recent Posts</h2>
          <p className="mt-1 text-2xl font-black">
            {queueStatus?.pendingPosts ?? 0}
          </p>
          <p className="text-xs text-[var(--ink-soft)]">ready to share</p>
        </article>
      </div>

      <div className="panel p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-lg">Send Weekly Newsletter</h2>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">
              Sends 100 emails at a time. Click again to send next batch.
            </p>
          </div>
          <button
            onClick={sendNextBatch}
            disabled={sending}
            className="rounded-lg bg-[var(--accent)] px-6 py-3 font-bold text-white disabled:opacity-50"
          >
            {sending ? "Sending..." : "Send Next 100"}
          </button>
        </div>

        {lastResult && (
          <div
            className={`mt-4 rounded-lg p-4 ${
              lastResult.sent > 0 ? "bg-green-500/10" : "bg-red-500/10"
            }`}
          >
            <p className={lastResult.sent > 0 ? "text-green-600" : "text-red-600"}>
              {lastResult.message}
            </p>
          </div>
        )}
      </div>

      {queueStatus && queueStatus.batchesRemaining > 1 && (
        <div className="panel p-4 border-l-4 border-yellow-500">
          <p className="text-sm text-[var(--ink-soft)]">
            <strong>{queueStatus.batchesRemaining}</strong> more batches will be
            sent on subsequent days. Come back tomorrow to continue sending.
          </p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="panel p-4">
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

        <article className="panel p-4">
          <h2 className="font-bold">Recent Submissions</h2>
          <div className="mt-3 space-y-2">
            {inquiries.length ? (
              inquiries.slice(0, 10).map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-[var(--border)] p-3"
                >
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