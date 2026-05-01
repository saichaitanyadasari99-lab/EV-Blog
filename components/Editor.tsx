"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import slugify from "slugify";
import { tiptapExtensions } from "@/lib/tiptap";
import { parseTiptapJson } from "@/lib/tiptap";
import { MediaUpload } from "@/components/MediaUpload";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import { useUploadThing } from "@/lib/uploadthing";
import type { PostRecord } from "@/types/post";

type Props = {
  initialPost?: PostRecord | null;
};

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

function buildUploadPath(prefix: string, fileName: string) {
  const ext = fileName.split(".").pop() || "bin";
  return `${prefix}-${crypto.randomUUID()}.${ext}`;
}

function slugifyHeading(text: string) {
  return text
    .toLowerCase()
    .replace(/[*_`$$$$]/g, "")        // strip markdown formatting chars
    .replace(/[^\w\s-]/g, "")        // strip non-word chars
    .replace(/\s+/g, "-")            // spaces → hyphens
    .replace(/-+/g, "-")             // collapse multiple hyphens
    .trim();
}

interface ImageResult {
  src: string;
  alt: string;
  caption: string;
  credit: string;
  creditUrl: string;
  license: string;
}

async function autoSearchImage(keyword: string, context: string): Promise<ImageResult | null> {
  try {
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(keyword)}&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url|extmetadata&format=json&origin=*`;
    const response = await fetch(searchUrl);
    const data = await response.json();

    if (!data.query?.pages) return null;

    const pages = Object.values(data.query.pages) as Array<{
      title: string;
      imageinfo?: Array<{ url: string; extmetadata?: Record<string, string> }>;
    }>;

    for (const page of pages) {
      const info = page.imageinfo?.[0];
      if (!info?.url) continue;

      const ext = info.url.split('.').pop()?.toLowerCase();
      if (!['jpg', 'jpeg', 'png', 'webp', 'svg'].includes(ext || '')) continue;

      const metadata = info.extmetadata as Record<string, string>;
      const license = metadata?.License || metadata?.UsageTerms || '';
      const validLicenses = ['CC0', 'CC BY', 'CC BY-SA', 'CC0 1.0', 'CC BY 4.0', 'CC BY-SA 4.0', 'Public Domain'];

      if (!validLicenses.some(l => license.includes(l))) continue;

      const artistValue = metadata?.Artist || '';
      const credit = artistValue.replace(/<[^>]+>/g, '') || page.title.replace('File:', '').replace(/\.[^.]+$/, '');
      const creditUrlLink = `https://commons.wikimedia.org/wiki/${page.title.replace(/ /g, '_')}`;

      return {
        src: info.url,
        alt: keyword,
        caption: context.slice(0, 100) || `Illustration related to ${keyword}`,
        credit: credit.slice(0, 100),
        creditUrl: creditUrlLink,
        license: license.includes('CC BY-SA') ? 'CC BY-SA 4.0' : license.includes('CC0') ? 'CC0 1.0' : 'CC BY 4.0',
      };
    }
  } catch (error) {
    console.error('Image search failed:', error);
  }
  return null;
}

async function processMarkdownImages(markdown: string): Promise<string> {
  const regex = /\[IMAGE_SEARCH\]([\s\S]*?)\[\/IMAGE_SEARCH\]/gi;
  let match;
  const blocks: string[] = [];
  while ((match = regex.exec(markdown)) !== null) {
    blocks.push(match[0]);
  }

  let processed = markdown;
  for (const block of blocks) {
    const keywordMatch = block.match(/\[IMAGE_SEARCH\]\s*([^\n]+)/);
    const contextMatch = block.match(/\n([^\n]+)\n/);
    const kw = keywordMatch?.[1]?.trim() || '';
    const context = contextMatch?.[1]?.trim() || '';

    if (!kw) continue;

    const image = await autoSearchImage(kw, context);
    if (!image) {
      processed = processed.replace(block, `<!-- IMAGE_NOT_FOUND: ${kw} -->`);
      continue;
    }

    const figureBlock = `[FIGURE]\nsrc: ${image.src}\nalt: ${image.alt}\ncaption: ${image.caption}\ncredit: ${image.credit}\ncreditUrl: ${image.creditUrl}\nlicense: ${image.license}\n[\/FIGURE]`;

    processed = processed.replace(block, figureBlock);
  }

  return processed;
}

function formatInline(text: string) {
  // Extract images and links BEFORE HTML escaping so URLs are never mangled.
  // Replace each match with a null-byte-delimited index placeholder, then
  // restore after escaping the remaining text content.
  const tokens: string[] = [];

  let value = text
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => {
      tokens.push(`<img alt="${escapeHtml(alt)}" src="${src}" />`);
      return `\x00${tokens.length - 1}\x00`;
    })
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
      tokens.push(`<a href="${href}">${escapeHtml(label)}</a>`);
      return `\x00${tokens.length - 1}\x00`;
    });

  // Now it is safe to HTML-escape — no URLs remain in the string.
  value = escapeHtml(value);

  // Apply inline markdown formatting to the escaped text.
  value = value.replace(/`([^`]+)`/g, "<code>$1</code>");
  // Inline math: $...$ → styled code span so it looks distinct from regular code
  value = value.replace(/\$([^$\n]+)\$/g, '<code class="math-inline">$1</code>');
  value = value.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  value = value.replace(/\*([^*]+)\*/g, "<em>$1</em>");

  // Restore URL tokens.
  return value.replace(/\x00(\d+)\x00/g, (_, i) => tokens[Number(i)]);
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
  let orderedItems: string[] = [];
  let blockquoteLines: string[] = [];

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

  // FIX 1: Numbered (ordered) list support
  const flushOrderedList = () => {
    if (!orderedItems.length) return;
    blocks.push(`<ol>${orderedItems.map((item) => `<li>${formatInline(item)}</li>`).join("")}</ol>`);
    orderedItems = [];
  };

  // FIX 2: Multi-line blockquote support
  const flushBlockquote = () => {
    if (!blockquoteLines.length) return;
    const inner = blockquoteLines.join(" ").trim();
    blocks.push(`<blockquote><p>${formatInline(inner)}</p></blockquote>`);
    blockquoteLines = [];
  };

  const flushAll = () => {
    flushParagraph();
    flushList();
    flushOrderedList();
    flushBlockquote();
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();

    if (!line) {
      flushAll();
      continue;
    }

    // Block math: fenced $$ ... $$
    if (line === "$$") {
      flushAll();
      const formulaLines: string[] = [];
      i += 1;
      while (i < lines.length && lines[i].trim() !== "$$") {
        formulaLines.push(lines[i]);
        i += 1;
      }
      const formula = formulaLines.join("\n").trim();
      // Renders raw LaTeX as a styled block; if KaTeX is wired up client-side
      // it will pick up data-formula. Otherwise the formula is human-readable
      // as a styled code block.
      blocks.push(`<pre class="math-block" data-formula="${escapeHtml(formula)}"><code>${escapeHtml(formula)}</code></pre>`);
      continue;
    }

    if (isTableLine(line)) {
      flushAll();
      const parsed = parseTable(lines, i);
      if (parsed.next !== i) {
        blocks.push(parsed.html);
        i = parsed.next - 1;
        continue;
      }
    }

    // FIX 3: Heading ids for working TOC anchor links
    if (line.startsWith("### ")) {
      flushAll();
      const text = line.slice(4);
      blocks.push(`<h3 id="${slugifyHeading(text)}">${formatInline(text)}</h3>`);
      continue;
    }

    if (line.startsWith("## ")) {
      flushAll();
      const text = line.slice(3);
      blocks.push(`<h2 id="${slugifyHeading(text)}">${formatInline(text)}</h2>`);
      continue;
    }

    if (line.startsWith("# ")) {
      flushAll();
      const text = line.slice(2);
      blocks.push(`<h1 id="${slugifyHeading(text)}">${formatInline(text)}</h1>`);
      continue;
    }

    if (line === "---") {
      flushAll();
      blocks.push("<hr />");
      continue;
    }

    if (line.startsWith("- ")) {
      flushParagraph();
      flushOrderedList();
      flushBlockquote();
      listItems.push(line.slice(2).trim());
      continue;
    }

    // FIX 1 continued: detect "1. " / "2. " etc.
    const orderedMatch = line.match(/^\d+\.\s+(.+)/);
    if (orderedMatch) {
      flushParagraph();
      flushList();
      flushBlockquote();
      orderedItems.push(orderedMatch[1]);
      continue;
    }

    // FIX 2 continued: accumulate consecutive blockquote lines
    if (line.startsWith("> ")) {
      flushParagraph();
      flushList();
      flushOrderedList();
      blockquoteLines.push(line.slice(2).trim());
      continue;
    }

    const imageNoteMatch = line.match(/^\[IMAGE:\s*(.+)\]$/i);
    if (imageNoteMatch) {
      flushAll();
      blocks.push(`<blockquote><p><strong>Image note:</strong> ${formatInline(imageNoteMatch[1])}</p></blockquote>`);
      continue;
    }

    // If we were accumulating a blockquote and hit a non-> line, flush it first
    flushBlockquote();
    paragraph.push(line);
  }

  flushAll();

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
  const [category, setCategory] = useState(initialPost?.category ?? "cell-chemistry");
  const [tier, setTier] = useState(initialPost?.tier ?? "intermediate");
  const [tags, setTags] = useState((initialPost?.tags ?? []).join(", "));
  const [published, setPublished] = useState(initialPost?.published ?? false);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [markdownInput, setMarkdownInput] = useState("");
  const [categories, setCategories] = useState<Array<{ slug: string; name: string }>>([]);
  const coverFileRef = useRef<HTMLInputElement | null>(null);
  const markdownFileRef = useRef<HTMLInputElement | null>(null);

  const { startUpload: uploadToEditor, isUploading: isUploadingEditor } = useUploadThing("media", {
    onClientUploadComplete: (res) => {
      if (res && res[0] && editor) {
        editor.chain().focus().setImage({ src: res[0].url }).run();
        setStatus("Image added.");
      }
    },
    onUploadError: (error) => {
      setStatus(`Error: ${error.message}`);
    },
  });

  const { startUpload: uploadCoverToUt, isUploading: isUploadingCoverUt } = useUploadThing("media", {
    onClientUploadComplete: (res) => {
      if (res && res[0]) {
        setCoverUrl(res[0].url);
        setStatus("Cover image uploaded.");
      }
    },
    onUploadError: (error) => {
      setStatus(`Error: ${error.message}`);
      setUploadingCover(false);
    },
  });

  const uploadImageToEditor = async (file: File) => {
    setStatus("Uploading image...");
    await uploadToEditor([file]);
  };

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []))
      .catch(console.error);
  }, []);

  const editor = useEditor({
    extensions: tiptapExtensions(),
    content: parseTiptapJson(initialPost?.content ?? null) ?? undefined,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-[380px] rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 focus:outline-none",
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

    const postId = initialPost?.id;
    console.log("Saving post with id:", postId);

    const payload = {
      id: postId,
      title,
      slug: derivedSlug,
      excerpt,
      cover_url: coverUrl || undefined,
      category,
      tier,
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
    setUploadingCover(true);
    setStatus("Uploading cover image...");
    await uploadCoverToUt([file]);
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
    setStatus("Markdown imported. Review and click Save Post.");
  };

  const importJson = async (jsonText: string) => {
    try {
      const data = JSON.parse(jsonText);

      if (!data.title) {
        setStatus("Invalid JSON: missing title.");
        return;
      }

      // Fill form fields
      setTitle(data.title || "");
      setSlug(data.slug || "");
      setExcerpt(data.excerpt || "");
      setTags((data.tags || []).join(", "));
      setTier(data.tier || "intermediate");
      setPublished(data.published || false);

      const mappedCategory =
        data.category?.toLowerCase().includes("bms")
          ? "bms-design"
          : data.category?.toLowerCase().includes("benchmark")
            ? "ev-benchmarks"
            : data.category?.toLowerCase().includes("review")
              ? "vehicle-reviews"
              : data.category?.toLowerCase().includes("standard")
                ? "standards"
                : data.category?.toLowerCase().includes("news")
                  ? "news"
                  : "cell-chemistry";
      setCategory(mappedCategory);

      // Auto-fetch cover image
      if (data.cover?.search) {
        setStatus("Fetching cover image...");
        const coverImage = await autoSearchImage(data.cover.search, "Cover image for " + data.title);
        if (coverImage) {
          setCoverUrl(coverImage.src);
          setStatus("Cover image fetched successfully.");
        }
      }

      // Process markdown with auto-image search
      if (data.markdown) {
        setStatus("Processing markdown and fetching images...");
        const processedMarkdown = await processMarkdownImages(data.markdown);
        const meta = parseMarkdownMetadata(processedMarkdown);
        editor.commands.setContent(markdownToHtml(meta.body));
        setStatus("JSON imported successfully. Review and click Save Post.");
      } else {
        setStatus("JSON imported. No markdown content found.");
      }
    } catch (error) {
      setStatus("Invalid JSON format: " + String(error));
    }
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
          <div className="flex gap-2 items-center">
            <input
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
              placeholder="Cover URL (paste image URL)"
              value={coverUrl}
              onChange={(event) => setCoverUrl(event.target.value)}
            />
            {coverUrl && (
              <img src={coverUrl} alt="Cover preview" className="w-16 h-16 object-cover rounded border" />
            )}
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
              placeholder="Category (type to search or enter new)"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              list="categories"
            />
            <datalist id="categories">
              {categories.map((cat) => (
                <option key={cat.slug} value={cat.slug} />
              ))}
            </datalist>
          </div>
          <select
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
            value={tier}
            onChange={(event) => setTier(event.target.value as 'basic' | 'intermediate' | 'advanced' | 'expert')}
          >
            <option value="basic">Basic - For new EV engineers</option>
            <option value="intermediate">Intermediate - 1-3 years experience</option>
            <option value="advanced">Advanced - Experienced engineers</option>
            <option value="expert">Expert - Domain specialists</option>
          </select>
          <input
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
            placeholder="Tags (comma separated)"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
          />
        </div>

        <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface2)] p-4">
          <p className="text-sm font-semibold">Import from JSON</p>
          <p className="mt-1 text-xs text-[var(--ink-soft)]">
            Paste JSON or upload a local .json file to auto-fill all fields and fetch images automatically.
          </p>
          <textarea
            className="mt-3 min-h-[140px] w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-sm font-mono"
            placeholder='Paste JSON content here... {"title": "Post Title", "markdown": "# Content..."}'
            value={markdownInput}
            onChange={(event) => setMarkdownInput(event.target.value)}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
              onClick={() => {
                if (!markdownInput.trim()) {
                  setStatus("Paste JSON first.");
                  return;
                }
                void importJson(markdownInput);
              }}
            >
              Import Pasted JSON
            </button>
            <button
              type="button"
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
              onClick={() => markdownFileRef.current?.click()}
            >
              Upload .json File
            </button>
              <input
              ref={markdownFileRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  const text = String(reader.result ?? "");
                  setMarkdownInput(text);
                  void importJson(text);
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
                setStatus("Uploading image...");
                await uploadImageToEditor(file);
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
