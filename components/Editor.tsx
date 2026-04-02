"use client";

import { useMemo, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import slugify from "slugify";
import { tiptapExtensions } from "@/lib/tiptap";
import { parseTiptapJson } from "@/lib/tiptap";
import { MediaUpload } from "@/components/MediaUpload";
import type { PostRecord } from "@/types/post";

type Props = {
  initialPost?: PostRecord | null;
};

const categories = [
  "post",
  "review",
  "deep-dive",
  "benchmark",
  "news",
  "standards",
] as const;

export function Editor({ initialPost }: Props) {
  const [title, setTitle] = useState(initialPost?.title ?? "");
  const [slug, setSlug] = useState(initialPost?.slug ?? "");
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt ?? "");
  const [coverUrl, setCoverUrl] = useState(initialPost?.cover_url ?? "");
  const [category, setCategory] = useState(
    initialPost?.category ?? ("post" as (typeof categories)[number]),
  );
  const [tags, setTags] = useState((initialPost?.tags ?? []).join(", "));
  const [published, setPublished] = useState(initialPost?.published ?? false);
  const [status, setStatus] = useState("");

  const editor = useEditor({
    extensions: tiptapExtensions(),
    content: parseTiptapJson(initialPost?.content ?? null) ?? undefined,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-[380px] rounded-xl border border-[var(--border)] bg-white px-4 py-3 focus:outline-none",
      },
    },
  });

  const derivedSlug = useMemo(() => {
    if (slug.trim()) return slug.trim();
    return slugify(title, { lower: true, strict: true });
  }, [slug, title]);

  if (!editor) return null;

  const save = async () => {
    if (!title.trim()) {
      setStatus("Title is required.");
      return;
    }

    const payload = {
      id: initialPost?.id,
      title,
      slug: derivedSlug,
      excerpt,
      cover_url: coverUrl || undefined,
      category,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      published,
      content: editor.getJSON(),
    };

    setStatus("Saving...");
    const response = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = (await response.json()) as { error?: string };
      setStatus(body.error ?? "Save failed.");
      return;
    }

    setStatus(
      published
        ? `Published at /blog/${payload.slug}`
        : `Saved draft with slug ${payload.slug}`,
    );
  };

  const embedFromUpload = (url: string, type: "image" | "video" | "pdf") => {
    if (type === "image") {
      editor.chain().focus().setImage({ src: url }).run();
      return;
    }
    if (type === "video") {
      editor.chain().focus().insertContent(`[[VIDEO:${url}]]`).run();
      return;
    }
    editor.chain().focus().insertContent(`[[PDF:${url}]]`).run();
  };

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
        <h1 className="text-2xl font-bold">Post Editor</h1>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">
          Upload media into Supabase Storage and publish in one click.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <input
            className="rounded-lg border border-[var(--border)] bg-white px-3 py-2"
            placeholder="Title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <input
            className="rounded-lg border border-[var(--border)] bg-white px-3 py-2"
            placeholder="Slug (optional, auto-generated)"
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
          />
          <input
            className="rounded-lg border border-[var(--border)] bg-white px-3 py-2"
            placeholder="Excerpt"
            value={excerpt}
            onChange={(event) => setExcerpt(event.target.value)}
          />
          <input
            className="rounded-lg border border-[var(--border)] bg-white px-3 py-2"
            placeholder="Cover URL"
            value={coverUrl}
            onChange={(event) => setCoverUrl(event.target.value)}
          />
          <select
            className="rounded-lg border border-[var(--border)] bg-white px-3 py-2"
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as (typeof categories)[number])
            }
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <input
            className="rounded-lg border border-[var(--border)] bg-white px-3 py-2"
            placeholder="Tags (comma separated)"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            className="rounded-lg border border-[var(--border)] px-3 py-1 text-sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          >
            H1
          </button>
          <button
            className="rounded-lg border border-[var(--border)] px-3 py-1 text-sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            H2
          </button>
          <button
            className="rounded-lg border border-[var(--border)] px-3 py-1 text-sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            Bold
          </button>
          <button
            className="rounded-lg border border-[var(--border)] px-3 py-1 text-sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            Italic
          </button>
          <button
            className="rounded-lg border border-[var(--border)] px-3 py-1 text-sm"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          >
            Code
          </button>
          <button
            className="rounded-lg border border-[var(--border)] px-3 py-1 text-sm"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
          >
            Divider
          </button>
          <button
            className="rounded-lg border border-[var(--border)] px-3 py-1 text-sm"
            onClick={() =>
              editor
                .chain()
                .focus()
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                .run()
            }
          >
            Table
          </button>
          <button
            className="rounded-lg border border-[var(--border)] px-3 py-1 text-sm"
            onClick={() => {
              const href = window.prompt("Link URL");
              if (href) editor.chain().focus().setLink({ href }).run();
            }}
          >
            Link
          </button>
          <button
            className="rounded-lg border border-[var(--border)] px-3 py-1 text-sm"
            onClick={() => {
              const url = window.prompt("YouTube URL");
              if (url) editor.commands.setYoutubeVideo({ src: url });
            }}
          >
            YouTube
          </button>
        </div>

        <div className="mt-4">
          <MediaUpload onUploaded={embedFromUpload} />
        </div>

        <div className="mt-4">
          <EditorContent editor={editor} />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={published}
              onChange={(event) => setPublished(event.target.checked)}
            />
            Publish
          </label>
          <button
            className="rounded-lg bg-[var(--accent)] px-5 py-2 font-semibold text-white hover:bg-[var(--accent-strong)]"
            onClick={save}
          >
            Save Post
          </button>
          {status ? <span className="text-sm text-[var(--ink-soft)]">{status}</span> : null}
        </div>
      </div>
    </section>
  );
}
