"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  slug: string;
  name: string;
  postCount: number;
};

export function AdminDeleteCategoryButton({ slug, name, postCount }: Props) {
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    const msg =
      postCount > 0
        ? `Delete category "${name}"? ${postCount} post(s) use this category and will be unaffected.`
        : `Delete category "${name}"?`;
    if (!window.confirm(msg)) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/categories?slug=${encodeURIComponent(slug)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json();
        alert(body.error ?? "Failed to delete");
        return;
      }
      router.refresh();
    } catch {
      alert("Failed to delete category");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="shrink-0 rounded-md border border-[var(--border)] px-2.5 py-1 text-xs text-[var(--red)] hover:bg-[var(--red)]/10 disabled:opacity-50 transition"
      title={`Delete ${name}`}
    >
      {deleting ? "..." : "Delete"}
    </button>
  );
}
