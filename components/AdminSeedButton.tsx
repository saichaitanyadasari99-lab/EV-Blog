"use client";

import { useState } from "react";

export function AdminSeedButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");

  async function handleSeed() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/posts/seed", { method: "POST" });
      const data = (await response.json()) as { inserted?: number; error?: string };

      if (!response.ok) {
        setMessage(data.error ?? "Failed to seed posts.");
        return;
      }

      setMessage(`Seed complete. ${data.inserted ?? 25} posts are now in Supabase.`);
      window.location.reload();
    } catch {
      setMessage("Network error while seeding posts.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleSeed}
        disabled={loading}
        className="rounded-lg border border-[var(--border)] px-4 py-2 font-semibold disabled:opacity-60"
      >
        {loading ? "Seeding..." : "Seed 25 Technical Posts"}
      </button>
      {message ? <p className="text-sm text-[var(--ink-soft)]">{message}</p> : null}
    </div>
  );
}
