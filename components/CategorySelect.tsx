"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type Category = { slug: string; name: string };

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function CategorySelect({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchCategories = useCallback(async () => {
    setFetching(true);
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(data.categories ?? []);
    } catch {
      setError("Failed to load categories");
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (adding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [adding]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setAdding(false);
        setNewName("");
        setError("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = categories.find((c) => c.slug === value);

  const handleSelect = (slug: string) => {
    onChange(slug);
    setOpen(false);
  };

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;

    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const body = await res.json();
        setError(body.error ?? "Failed to create category");
        return;
      }
      const data = await res.json();
      const newCat = data.category as Category;
      await fetchCategories();
      onChange(newCat.slug);
      setAdding(false);
      setNewName("");
      setOpen(false);
    } catch {
      setError("Failed to create category");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (slug: string, name: string) => {
    if (!window.confirm(`Delete category "${name}"? This won't remove it from existing posts.`)) return;

    try {
      const res = await fetch(`/api/categories?slug=${encodeURIComponent(slug)}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json();
        setError(body.error ?? "Failed to delete category");
        return;
      }
      await fetchCategories();
      if (value === slug) {
        onChange("");
      }
    } catch {
      setError("Failed to delete category");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
    if (e.key === "Escape") {
      setAdding(false);
      setNewName("");
    }
  };

  return (
    <div ref={containerRef} className="relative" style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-left text-sm"
      >
        <span className={selected ? "" : "text-[var(--text3)]"}>
          {selected ? selected.name : value || "Select a category..."}
        </span>
        <svg
          className={`ml-2 h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute z-50 mt-1 w-full rounded-lg border bg-[var(--surface)] py-1 shadow-lg"
          style={{
            borderColor: "var(--border)",
            maxHeight: "260px",
            overflowY: "auto",
          }}
        >
          {fetching ? (
            <div className="px-3 py-2 text-sm text-[var(--text3)]">Loading...</div>
          ) : categories.length === 0 && !adding ? (
            <div className="px-3 py-2 text-sm text-[var(--text3)]">No categories yet</div>
          ) : (
            categories.map((cat) => (
              <div
                key={cat.slug}
                className={`flex items-center justify-between px-3 py-2 text-sm cursor-pointer transition ${
                  cat.slug === value
                    ? "bg-[var(--accent-dim)] text-[var(--accent)]"
                    : "hover:bg-[var(--surface2)] text-[var(--text)]"
                }`}
                onClick={() => handleSelect(cat.slug)}
              >
                <span>{cat.name}</span>
                <button
                  type="button"
                  title={`Delete ${cat.name}`}
                  className="ml-2 rounded p-0.5 text-[var(--text3)] opacity-0 hover:text-[var(--red)] group-hover:opacity-100 transition-opacity"
                  style={{ opacity: 0 }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(cat.slug, cat.name);
                  }}
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))
          )}

          {adding ? (
            <div className="border-t border-[var(--border)] px-3 py-2 flex gap-2">
              <input
                ref={inputRef}
                type="text"
                className="flex-1 rounded-md border border-[var(--border)] bg-[var(--surface2)] px-2 py-1.5 text-sm"
                placeholder="Category name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={saving}
              />
              <button
                type="button"
                className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-semibold text-black disabled:opacity-50"
                onClick={handleAdd}
                disabled={saving || !newName.trim()}
              >
                {saving ? "..." : "Add"}
              </button>
              <button
                type="button"
                className="rounded-md border border-[var(--border)] px-2 py-1.5 text-sm"
                onClick={() => { setAdding(false); setNewName(""); setError(""); }}
              >
                Esc
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="flex w-full items-center gap-2 border-t border-[var(--border)] px-3 py-2 text-sm text-[var(--accent)] hover:bg-[var(--surface2)] transition"
              onClick={() => setAdding(true)}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              + Add New Category
            </button>
          )}

          {error && (
            <div className="border-t border-[var(--border)] px-3 py-1.5 text-xs text-[var(--red)]">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
