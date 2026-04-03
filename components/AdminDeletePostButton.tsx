"use client";

import { useState } from "react";

type Props = {
  id: string;
  title: string;
};

export function AdminDeletePostButton({ id, title }: Props) {
  const [loading, setLoading] = useState(false);

  const onDelete = async () => {
    const ok = window.confirm(`Delete post "${title}"? This action cannot be undone.`);
    if (!ok) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/posts?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        window.alert(body.error ?? "Failed to delete post.");
        return;
      }

      window.location.reload();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      className="rounded border border-red-300 px-2 py-1 text-red-700 disabled:opacity-50"
      onClick={onDelete}
      disabled={loading}
    >
      {loading ? "Deleting..." : "Delete"}
    </button>
  );
}
