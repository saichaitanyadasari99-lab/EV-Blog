"use client";

import { useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import slugify from "slugify";
import { tiptapExtensions, renderTiptapHtml } from "@/lib/tiptap";
import { parseTiptapJson } from "@/lib/tiptap";
import { MediaUpload } from "@/components/MediaUpload";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import type { PostRecord } from "@/types/post";

type Props = {
  initialPost?: PostRecord | null;
};

const categories = [
  "cell-chemistry",
  "bms-design",
  "ev-benchmarks",
  "vehicle-reviews",
  "standards",
  "news",
] as const;

const defaultSections = [
  "Cell Chemistry",
  "BMS Design",
  "EV Benchmarks",
  "Vehicle Reviews",
  "Standards",
  "News",
];

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function normalizeEncoding(input: string) {
  return input
    .replaceAll("â€”", "—")
    .replaceAll("â€“", "–")
    .replaceAll("âˆ’", "−")
    .replaceAll("â‰¥", "≥")
    .replaceAll("â‰¤", "≤")
    .replaceAll("Ã—", "×")
    .replaceAll("Â°C", "°C")
    .replaceAll("Î©", "Ω");
}

function formatInline(text: string) {
  let value = escapeHtml(text);
  value = value.replace(/`([^`]+)`/g, "<code>$1</code>");
  value = value.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  value = value.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  value = value.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2" />');
  value = value.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return value;
}

function isTableLine(line: string) {
  return line.includes("|") && line.split("|").length >= 3;
}

function parseTable(lines: string[], start: number) {
  const tableLines: string[] = [];
  let idx = start;
  while (idx < lines.length && lines[idx].trim() && isTableLine(lines[idx])) {
    tableLines.push(lines[idx].trim());
    idx += 1;
  }

  if (tableLines.length < 2 || !tableLines[1].includes("---")) {
    return { html: "", next: start };
  }

  const cells = (line: string) =>
    line
      .split("|")
      .map((cell) => cell.trim())
      .filter(Boolean);

  const headerCells = cells(tableLines[0]).map((cell) => `<th>${formatInline(cell)}</th>`).join("");
  const rows = tableLines
    .slice(2)
    .map((row) => {
      const cols = cells(row).map((cell) => `<td>${formatInline(cell)}</td>`).join("");
      return `<tr>${cols}</tr>`;
    })
    .join("");

  return {
    html: `<table><thead><tr>${headerCells}</tr></thead><tbody>${rows}</tbody></table>`,
    next: idx,
  };
}

function markdownToHtml(markdown: string) {
  const lines = normalizeEncoding(markdown).replace(/\r\n/g, "\n").split("\n");
  const blocks: string[] = [];
  let paragraph: string[] = [];
  let listItems: string[] = [];

  const flushParagraph = () => {
    const text = paragraph.join(" ").trim();
    if (!text) return;
    blocks.push(`<p>${formatInline(text)}</p>`);
    paragraph = [];
  };

  const flushList = () => {
    if (!listItems.length) return;
    blocks.push(`<ul>${listItems.map((item) => `<li>${formatInline(item)}</li>`).join("")}</ul>`);
    listItems = [];
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    if (isTableLine(line)) {
      flushParagraph();
      flushList();
      const parsed = parseTable(lines, i);
      if (parsed.next !== i) {
        blocks.push(parsed.html);
        i = parsed.next - 1;
        continue;
      }
    }

    if (line.startsWith("### ")) {
      flushParagraph();
      flushList();
      blocks.push(`<h3>${formatInline(line.slice(4))}</h3>`);
      continue;
    }

    if (line.startsWith("## ")) {
      flushParagraph();
      flushList();
      blocks.push(`<h2>${formatInline(line.slice(3))}</h2>`);
      continue;
    }

    if (line.startsWith("# ")) {
      flushParagraph();
      flushList();
      blocks.push(`<h1>${formatInline(line.slice(2))}</h1>`);
      continue;
    }

    if (line === "---") {
      flushParagraph();
      flushList();
      blocks.push("<hr />");
      continue;
    }

    if (line.startsWith("- ")) {
      flushParagraph();
      listItems.push(line.slice(2).trim());
      continue;
    }

    if (line.startsWith("> ")) {
      flushParagraph();
      flushList();
      blocks.push(`<blockquote><p>${formatInline(line.slice(2))}</p></blockquote>`);
      continue;
    }

    const imageNoteMatch = line.match(/^\[IMAGE:\s*(.+)\]$/i);
    if (imageNoteMatch) {
      flushParagraph();
      flushList();
      blocks.push(`<blockquote><p><strong>Image note:</strong> ${formatInline(imageNoteMatch[1])}</p></blockquote>`);
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();
  flushList();

  return blocks.join("");
}

function parseMarkdownMetadata(markdown: string) {
  const normalized = markdown.replace(/\r\n/g, "\n");
  const titleMatch = normalized.match(/^#\s+(.+)$/m);
  const categoryMatch = normalized.match(/\*\*Category:\*\*\s*(.+)$/m);
  const tagsMatch = normalized.match(/\*\*Tags:\*\*\s*(.+)$/m);
  const slugMatch = normalized.match(/\*\*Slug:\*\*\s*`?([^`\n]+)`?/m);

  const bodyStart = normalized.indexOf("\n## ");
  const body = bodyStart >= 0 ? normalized.slice(bodyStart).trim() : normalized.trim();
  const firstParagraph = body
    .split("\n\n")
    .map((part) => part.replace(/^#+\s+/g, "").trim())
    .find(Boolean);

  const coverMatch = normalized.match(/!\[[^\]]*\]\(([^)]+)\)/);

  return {
    title: titleMatch?.[1]?.trim() ?? "",
    category: categoryMatch?.[1]?.trim().toLowerCase() ?? "post",
    tags: tagsMatch?.[1]?.trim() ?? "",
    slug: slugMatch?.[1]?.trim() ?? "",
    excerpt: firstParagraph?.slice(0, 220) ?? "",
    body,
    coverUrl: coverMatch?.[1]?.trim() ?? "",
  };
}

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
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [bodyPreview, setBodyPreview] = useState("");
  const [markdownInput, setMarkdownInput] = useState("");
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const coverFileRef = useRef<HTMLInputElement | null>(null);
  const markdownFileRef = useRef<HTMLInputElement | null>(null);

  const editor = useEditor({
    extensions: tiptapExtensions(),
    content: parseTiptapJson(initialPost?.content ?? null) ?? undefined,
    immediatelyRender: false,
    onUpdate({ editor: current }) {
      const text = current.getText().trim();
      setBodyPreview(text.slice(0, 280));
    },
    editorProps: {
      attributes: {
        class:
          "min-h-[380px] rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 focus:outline-none",
      },
    },
  });

  const fullPreviewHtml = useMemo(() => {
    if (!editor) return "";
    return renderTiptapHtml(JSON.stringify(editor.getJSON()));
  }, [editor, previewKey]);

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

    setSaving(true);
    setStatus("Saving...");
    const response = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = (await response.json()) as { error?: string };
      setStatus(body.error ?? "Save failed.");
      setSaving(false);
      return;
    }

    setStatus(
      published
        ? `Published at /blog/${payload.slug}`
        : `Saved draft with slug ${payload.slug}`,
    );
    setSaving(false);
  };

  const embedFromUpload = (url: string, type: "image" | "video" | "pdf" | "doc") => {
    if (type === "image") {
      editor.chain().focus().setImage({ src: url }).run();
      return;
    }
    if (type === "video") {
      editor.chain().focus().insertContent(`[[VIDEO:${url}]]`).run();
      return;
    }
    if (type === "pdf") {
      editor.chain().focus().insertContent(`[[PDF:${url}]]`).run();
      return;
    }
    editor.chain().focus().insertContent(`[[DOC:${url}]]`).run();
  };

  const uploadCover = async (file: File) => {
    const supabase = getBrowserSupabaseClient();
    const ext = file.name.split(".").pop();
    const path = `cover-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    setUploadingCover(true);
    setStatus("Uploading cover image...");

    const { error } = await supabase.storage.from("media").upload(path, file, {
      upsert: false,
    });

    if (error) {
      setStatus(error.message);
      setUploadingCover(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("media").getPublicUrl(path);

    setCoverUrl(publicUrl);
    setStatus("Cover image uploaded.");
    setUploadingCover(false);
  };

  const importMarkdown = (markdown: string) => {
    const meta = parseMarkdownMetadata(markdown);

    if (meta.title) setTitle(meta.title);
    if (meta.slug) setSlug(meta.slug);
    if (meta.tags) setTags(meta.tags);
    if (meta.excerpt) setExcerpt(meta.excerpt);
    if (meta.coverUrl) setCoverUrl(meta.coverUrl);

    const mappedCategory = 
      meta.category === "bms design" || meta.category?.includes("bms")
        ? "bms-design"
        : meta.category?.includes("benchmark")
          ? "ev-benchmarks"
          : meta.category?.includes("review")
            ? "vehicle-reviews"
            : meta.category?.includes("standard")
              ? "standards"
              : meta.category?.includes("news")
                ? "news"
                : "cell-chemistry";
    setCategory(mappedCategory);

    editor.commands.setContent(markdownToHtml(meta.body));
    setBodyPreview(meta.excerpt);
    setStatus("Markdown imported into editor. Review and click Save Post.");
  };

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="panel p-5 shadow-sm">
        <h1 className="text-2xl font-bold">Post Editor</h1>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">
          Upload media to Supabase, set a cover image, preview quickly, then publish.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <input
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
            placeholder="Title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <input
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
            placeholder="Slug (optional, auto-generated)"
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
          />
          <input
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
            placeholder="Excerpt"
            value={excerpt}
            onChange={(event) => setExcerpt(event.target.value)}
          />
          <div className="flex gap-2">
            <input
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
              placeholder="Cover URL"
              value={coverUrl}
              onChange={(event) => setCoverUrl(event.target.value)}
            />
            <button
              type="button"
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
              onClick={() => coverFileRef.current?.click()}
              disabled={uploadingCover}
            >
              {uploadingCover ? "Uploading" : "Upload"}
            </button>
            <input
              ref={coverFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadCover(file);
              }}
            />
          </div>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
              placeholder="Section (e.g., cell-chemistry, bms-design, thermal)"
              value={category}
              onChange={(event) => setCategory(event.target.value as any)}
              list="sections"
            />
            <datalist id="sections">
              {defaultSections.map((sec) => (
                <option key={sec} value={sec.toLowerCase().replace(/\s+/g, "-")} />
              ))}
            </datalist>
          </div>
          <input
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
            placeholder="Tags (comma separated)"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
          />
        </div>

        <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface2)] p-4">
          <p className="text-sm font-semibold">Import from .md</p>
          <p className="mt-1 text-xs text-[var(--ink-soft)]">
            Paste markdown or upload a local .md file to auto-fill the editor.
          </p>
          <textarea
            className="mt-3 min-h-[140px] w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-sm"
            placeholder="Paste markdown content here... Use ## References heading for links."
            value={markdownInput}
            onChange={(event) => setMarkdownInput(event.target.value)}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
              onClick={() => {
                if (!markdownInput.trim()) {
                  setStatus("Paste markdown first.");
                  return;
                }
                importMarkdown(markdownInput);
              }}
            >
              Import Pasted Markdown
            </button>
            <button
              type="button"
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
              onClick={() => markdownFileRef.current?.click()}
            >
              Upload .md File
            </button>
              <input
              ref={markdownFileRef}
              type="file"
              accept=".md,text/markdown"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  const text = String(reader.result ?? "");
                  setMarkdownInput(text);
                  importMarkdown(text);
                };
                reader.readAsText(file);
              }}
            />
          </div>
        </div>

        {coverUrl ? (
          <div className="editor-preview-cover mt-4" style={{ background: `url(${coverUrl}) center/cover` }} />
        ) : null}

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
          <label className="rounded-lg border border-[var(--border)] px-3 py-1 text-sm cursor-pointer hover:bg-[var(--surface2)]">
            Add Image
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                
                const ext = file.name.split(".").pop();
                const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
                setStatus("Uploading image...");
                
                const supabase = getBrowserSupabaseClient();
                const { error } = await supabase.storage.from("media").upload(path, file, { upsert: false });
                
                if (error) {
                  setStatus(error.message);
                  return;
                }
                
                const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(path);
                editor.chain().focus().setImage({ src: publicUrl }).run();
                setStatus("Image added.");
              }}
            />
          </label>
          <button
            type="button"
            className="rounded-lg border border-[var(--border)] px-3 py-1 text-sm"
            onClick={() => {
              const attrs = editor.getAttributes("image");
              if (attrs.src) {
                const newUrl = window.prompt("Replace with new image URL:", attrs.src);
                if (newUrl) editor.chain().focus().setImage({ src: newUrl }).run();
              } else {
                setStatus("Select an image first, then use Replace.");
              }
            }}
          >
            Replace Image
          </button>
          <button
            type="button"
            className="rounded-lg border border-[var(--border)] px-3 py-1 text-sm text-[var(--red)]"
            onClick={() => {
              editor.chain().focus().deleteSelection().run();
            }}
          >
            Delete Image
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

        <div className="mt-4 overflow-x-auto">
          <EditorContent editor={editor} />
        </div>

        <div className="editor-preview">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.12em] text-[var(--ink-soft)]">Quick Preview</p>
            <button
              type="button"
              className="text-xs text-[var(--accent)] underline"
              onClick={() => {
                setShowFullPreview(!showFullPreview);
                setPreviewKey((k) => k + 1);
              }}
            >
              {showFullPreview ? "Hide Full Preview" : "Show Full Preview"}
            </button>
          </div>
          <h3 className="mt-2 text-xl font-bold">{title || "Post title preview"}</h3>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">{excerpt || bodyPreview || "Content preview will appear here."}</p>
          <p className="mt-2 text-xs text-[var(--ink-soft)]">Slug: {derivedSlug || "(auto)"}</p>
        </div>

        {showFullPreview && (
          <div className="editor-full-preview">
            <p className="text-xs uppercase tracking-[0.12em] text-[var(--ink-soft)] mb-3">Full Preview</p>
            {coverUrl && (
              <div className="full-preview-cover" style={{ background: `url(${coverUrl}) center/cover` }} />
            )}
            <div className="full-preview-content prose" dangerouslySetInnerHTML={{ __html: fullPreviewHtml }} />
          </div>
        )}

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
            className="rounded-lg bg-[var(--accent)] px-5 py-2 font-semibold text-black hover:bg-[var(--accent-strong)] disabled:opacity-50"
            onClick={save}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Post"}
          </button>
          {status ? <span className="text-sm text-[var(--ink-soft)]">{status}</span> : null}
        </div>
      </div>
    </section>
  );
}
