"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";

type MediaFile = {
  id: string;
  name: string;
  url: string;
  content_type: string;
  size: number;
  created_at: string;
};

type StorageFile = {
  id: string;
  name: string;
  metadata?: {
    content_type?: string;
    size?: number;
  };
  created_at?: string;
};

export default function AdminMediaPage() {
  const router = useRouter();
  const supabase = getBrowserSupabaseClient();
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadMedia();
  }, []);

  async function loadMedia() {
    setLoading(true);
    const { data, error } = await supabase.storage.from("media").list("", {
      sort: { column: "created_at", order: "desc" },
    });
    if (!error && data) {
      const media = await Promise.all(
        data.map(async (file: StorageFile) => {
          const { data: urlData } = supabase.storage.from("media").getPublicUrl(file.name);
          return {
            id: file.id,
            name: file.name,
            url: urlData.publicUrl,
            content_type: file.metadata?.content_type ?? "image/png",
            size: file.metadata?.size ?? 0,
            created_at: file.created_at ?? new Date().toISOString(),
          };
        })
      );
      setFiles(media);
    }
    setLoading(false);
  }

  async function deleteSelected() {
    if (selected.length === 0) return;
    if (!confirm(`Delete ${selected.length} file(s)?`)) return;
    
    const { error } = await supabase.storage.from("media").remove(selected);
    if (!error) {
      setFiles(files.filter((f) => !selected.includes(f.name)));
      setSelected([]);
    }
  }

  const filtered = files.filter((f) => 
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const toggleSelect = (name: string) => {
    setSelected(selected.includes(name) 
      ? selected.filter((s) => s !== name)
      : [...selected, name]
    );
  };

  return (
    <section className="space-y-4">
      <div className="panel p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black">Media Library</h1>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">
              {files.length} file{files.length !== 1 ? "s" : ""} in storage
            </p>
          </div>
          <Link href="/admin/new" className="rounded-lg bg-[var(--accent)] px-4 py-2 font-semibold text-white">
            Upload New
          </Link>
        </div>
      </div>

      <div className="panel p-4">
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 min-w-[200px]"
          />
          {selected.length > 0 && (
            <button
              onClick={deleteSelected}
              className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white"
            >
              Delete ({selected.length})
            </button>
          )}
          <button
            onClick={loadMedia}
            className="rounded-lg border border-[var(--border)] px-4 py-2 font-semibold"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="panel p-12 text-center">
          <p className="text-[var(--ink-soft)]">Loading media...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="panel p-12 text-center">
          <p className="text-[var(--ink-soft)]">No media files found</p>
          <Link href="/admin/new" className="mt-4 inline-block rounded-lg bg-[var(--accent)] px-4 py-2 font-semibold text-white">
            Upload Media
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((file) => {
            const isImage = file.content_type.startsWith("image/");
            const isSelected = selected.includes(file.name);
            
            return (
              <div
                key={file.id}
                className={`panel overflow-hidden ${isSelected ? "ring-2 ring-[var(--accent)]" : ""}`}
              >
                <div 
                  className="relative aspect-square cursor-pointer bg-[var(--border)]"
                  onClick={() => toggleSelect(file.name)}
                >
                  {isImage ? (
                    <img
                      src={file.url}
                      alt={file.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl">
                      📄
                    </div>
                  )}
                  <div className={`absolute inset-0 flex items-center justify-center bg-black/50 ${isSelected ? "opacity-100" : "opacity-0"} transition-opacity`}>
                    <span className="text-2xl text-white">{isSelected ? "✓" : ""}</span>
                  </div>
                </div>
                <div className="p-3">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <div className="mt-1 flex justify-between text-xs text-[var(--ink-soft)]">
                    <span>{formatSize(file.size)}</span>
                    <span>{new Date(file.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}