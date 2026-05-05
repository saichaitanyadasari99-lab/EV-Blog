"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import slugify from "slugify";
import { tiptapExtensions } from "@/lib/tiptap";
import { parseTiptapJson } from "@/lib/tiptap";
import { markdownToHtml } from "@/lib/markdown";
import { MediaUpload } from "@/components/MediaUpload";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import { useUploadThing } from "@/lib/uploadthing";
import type { PostRecord } from "@/types/post";

type Props = {
  initialPost?: PostRecord | null;
};

type FaqItem = {
  question: string;
  answer: string;
};

function parseMarkdownMetadata(markdown: string) {
  const normalized = markdown.replace(/\r\n/g, "\n");
  const titleMatch = normalized.match(/^#\s+(.+)$/m);
  const categoryMatch = normalized.match(/\*\*Category:\*\*\s*(.+)$/m);
  const tagsMatch = normalized.match(/\*\*Tags:\*\*\s*(.+)$/m);
  const slugMatch = normalized.match(/\*\*Slug:\*\*\s*`?([^`\n]+)`?/m);

  const faqMatches = [...normalized.matchAll(/\[!FAQ\]([^\n]+?)::([^\n]*?)\[\/!FAQ\]/gi)];
  const faqs: Array<{ question: string; answer: string }> = faqMatches.map((m) => ({
    question: m[1].trim(),
    answer: m[2].trim(),
  }));

  const body = normalized.trim();
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
    faqs,
  };
}

function mapCategory(category: string) {
  const lower = category?.toLowerCase() ?? "";
  if (lower.includes("bms")) return "bms-design";
  if (lower.includes("benchmark")) return "ev-benchmarks";
  if (lower.includes("review")) return "vehicle-reviews";
  if (lower.includes("standard")) return "standards";
  if (lower.includes("news")) return "news";
  return "cell-chemistry";
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
  const [rawMarkdown, setRawMarkdown] = useState<string | null>(null);
  const [importTab, setImportTab] = useState<"json" | "markdown">("json");
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [faqs, setFaqs] = useState<FaqItem[]>(
    initialPost?.faqs ? [...initialPost.faqs] : []
  );
  const [categories, setCategories] = useState<Array<{ slug: string; name: string }>>([]);
  const coverFileRef = useRef<HTMLInputElement | null>(null);
  const importFileRef = useRef<HTMLInputElement | null>(null);

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
      markdown_content: rawMarkdown || undefined,
      faqs: faqs.filter((f) => f.question.trim() || f.answer.trim()),
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

  const uploadCover = async (file: File) => {
    setUploadingCover(true);
    setStatus("Uploading cover image...");
    await uploadCoverToUt([file]);
    setUploadingCover(false);
  };

  const addFaq = () => {
    setFaqs([...faqs, { question: "", answer: "" }]);
  };

  const updateFaq = (index: number, field: "question" | "answer", value: string) => {
    const updated = [...faqs];
    updated[index] = { ...updated[index], [field]: value };
    setFaqs(updated);
  };

  const removeFaq = (index: number) => {
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  const importMarkdown = (markdown: string) => {
    const meta = parseMarkdownMetadata(markdown);

    if (meta.title) setTitle(meta.title);
    if (meta.slug) setSlug(meta.slug);
    if (meta.tags) setTags(meta.tags);
    if (meta.excerpt) setExcerpt(meta.excerpt);
    if (meta.coverUrl) setCoverUrl(meta.coverUrl);
    if (meta.faqs && meta.faqs.length > 0) setFaqs(meta.faqs);

    setCategory(mapCategory(meta.category));

    const html = markdownToHtml(markdown);
    editor.commands.setContent(markdownToHtml(meta.body));
    setPreviewHtml(html);
    setStatus("Markdown imported. Review and click Save Post.");
  };

  const importJson = (jsonText: string) => {
    try {
      const data = JSON.parse(jsonText);

      if (!data.title) {
        setStatus("Invalid JSON: missing title.");
        return;
      }

      setTitle(data.title || "");
      setSlug(data.slug || "");
      setExcerpt(data.excerpt || "");
      setTags((data.tags || []).join(", "));
      setTier(data.tier || "intermediate");
      setPublished(data.published || false);
      setCategory(mapCategory(data.category || "cell-chemistry"));

      if (data.cover_url) {
        setCoverUrl(data.cover_url);
      } else if (data.cover?.url) {
        setCoverUrl(data.cover.url);
      }

      if (data.faqs && Array.isArray(data.faqs)) {
        setFaqs(data.faqs.map((f: { question: string; answer: string }) => ({
          question: f.question || "",
          answer: f.answer || "",
        })));
      }

      if (data.markdown) {
        const meta = parseMarkdownMetadata(data.markdown);
        editor.commands.setContent(markdownToHtml(meta.body));
        setPreviewHtml(markdownToHtml(data.markdown));
        setRawMarkdown(data.markdown);
        if (!data.faqs && meta.faqs && meta.faqs.length > 0) {
          setFaqs(meta.faqs);
        }
        setStatus("JSON imported successfully. Review content, then click Save Post.");
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
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-sm font-semibold">Import Content</p>
              <p className="text-xs text-[var(--ink-soft)]">
                Paste JSON or Markdown to auto-fill all fields.
              </p>
            </div>
            <div className="flex gap-1 bg-[var(--surface)] rounded-lg p-1 border border-[var(--border)]">
              <button
                type="button"
                className={`px-3 py-1.5 text-xs rounded-md transition ${
                  importTab === "json"
                    ? "bg-[var(--accent)] text-black font-semibold"
                    : "text-[var(--ink-soft)] hover:text-[var(--text)]"
                }`}
                onClick={() => setImportTab("json")}
              >
                JSON
              </button>
              <button
                type="button"
                className={`px-3 py-1.5 text-xs rounded-md transition ${
                  importTab === "markdown"
                    ? "bg-[var(--accent)] text-black font-semibold"
                    : "text-[var(--ink-soft)] hover:text-[var(--text)]"
                }`}
                onClick={() => setImportTab("markdown")}
              >
                Markdown
              </button>
            </div>
          </div>

          <textarea
            className="mt-3 min-h-[140px] w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-sm font-mono"
            placeholder={
              importTab === "json"
                ? '{"title": "Post Title", "markdown": "# Content..."}'
                : "# Title\n\n**Category:** ...\n\n## Introduction\n\nContent here..."
            }
            value={markdownInput}
            onChange={(event) => setMarkdownInput(event.target.value)}
          />

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg bg-[var(--accent)] text-black px-4 py-2 text-sm font-semibold hover:bg-[var(--accent-strong)]"
              onClick={() => {
                if (!markdownInput.trim()) {
                  setStatus("Paste content first.");
                  return;
                }
                if (importTab === "json") {
                  importJson(markdownInput);
                } else {
                  importMarkdown(markdownInput);
                }
              }}
            >
              Import {importTab === "json" ? "JSON" : "Markdown"}
            </button>
            <button
              type="button"
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
              onClick={() => importFileRef.current?.click()}
            >
              Upload File
            </button>
            <button
              type="button"
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
              onClick={() => {
                if (previewHtml) {
                  setShowPreview(!showPreview);
                } else {
                  setStatus("Import content first to see preview.");
                }
              }}
            >
              {showPreview ? "Hide Preview" : "Show Preview"}
            </button>
            <input
              ref={importFileRef}
              type="file"
              accept=".json,.md,.txt,application/json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  const text = String(reader.result ?? "");
                  setMarkdownInput(text);
                  if (file.name.endsWith(".json")) {
                    setImportTab("json");
                    importJson(text);
                  } else {
                    setImportTab("markdown");
                    importMarkdown(text);
                  }
                };
                reader.readAsText(file);
              }}
            />
          </div>

          {showPreview && previewHtml && (
            <div className="mt-4 editor-full-preview prose" dangerouslySetInnerHTML={{ __html: previewHtml }} />
          )}
        </div>

        {coverUrl ? (
          <div className="editor-preview-cover mt-4" style={{ background: `url(${coverUrl}) center/cover` }} />
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            H2
          </button>
          <button
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            H3
          </button>
          <button
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            Bold
          </button>
          <button
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            Italic
          </button>
          <button
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          >
            Code
          </button>
          <button
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
          >
            Divider
          </button>
          <button
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm"
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
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm"
            onClick={() => {
              const href = window.prompt("Link URL");
              if (href) editor.chain().focus().setLink({ href }).run();
            }}
          >
            Link
          </button>
          <label className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm cursor-pointer hover:bg-[var(--surface2)]">
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
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm"
            onClick={() => {
              const url = window.prompt("YouTube URL");
              if (url) editor.commands.setYoutubeVideo({ src: url });
            }}
          >
            YouTube
          </button>
        </div>

        {/* Advanced Elements Toolbar */}
        <div className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--surface2)] p-3">
          <p className="text-xs font-semibold text-[var(--ink-soft)] mb-2">Advanced Elements</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="rounded-md border border-[var(--border)] px-2.5 py-1.5 text-xs hover:bg-[var(--surface)]" onClick={() => editor.commands.insertContent('[!NOTE]\nYour note here\n[/!NOTE]\n\n')} title="Blue info callout">💡 Note</button>
            <button type="button" className="rounded-md border border-[var(--border)] px-2.5 py-1.5 text-xs hover:bg-[var(--surface)]" onClick={() => editor.commands.insertContent('[!WARNING]\nYour warning here\n[/!WARNING]\n\n')} title="Orange warning callout">⚠️ Warning</button>
            <button type="button" className="rounded-md border border-[var(--border)] px-2.5 py-1.5 text-xs hover:bg-[var(--surface)]" onClick={() => editor.commands.insertContent('[!KEY]\nKey takeaway here\n[/!KEY]\n\n')} title="Green key takeaway">🔑 Key</button>
            <button type="button" className="rounded-md border border-[var(--border)] px-2.5 py-1.5 text-xs hover:bg-[var(--surface)]" onClick={() => editor.commands.insertContent('[!TIP]\nPractical engineering advice here\n[/!TIP]\n\n')} title="Purple tip callout">💡 Tip</button>
            <button type="button" className="rounded-md border border-[var(--border)] px-2.5 py-1.5 text-xs hover:bg-[var(--surface)]" onClick={() => editor.commands.insertContent('[!DANGER]\nCritical safety information here\n[/!DANGER]\n\n')} title="Red danger callout">🔴 Danger</button>
            <button type="button" className="rounded-md border border-[var(--border)] px-2.5 py-1.5 text-xs hover:bg-[var(--surface)]" onClick={() => editor.commands.insertContent('[!QUOTE]\nPull quote text here\n[/!QUOTE]\n\n')} title="Serif pull quote">❝ Quote</button>
            <button type="button" className="rounded-md border border-[var(--border)] px-2.5 py-1.5 text-xs hover:bg-[var(--surface)]" onClick={() => editor.commands.insertContent('[!STAT label="Label"]\nValue\n[/!STAT]\n\n')} title="Single stat card">🔢 Stat</button>
            <button type="button" className="rounded-md border border-[var(--border)] px-2.5 py-1.5 text-xs hover:bg-[var(--surface)]" onClick={() => editor.commands.insertContent('[!STATS]\nEnergy Density::250 Wh/kg\nCycle Life::3000+\nCost::$90/kWh\n[/!STATS]\n\n')} title="Multi-stat row (label::value per line)">📊 Stats Row</button>
            <button type="button" className="rounded-md border border-[var(--border)] px-2.5 py-1.5 text-xs hover:bg-[var(--surface)]" onClick={() => editor.commands.insertContent('[!COMPARE a="Option A" b="Option B"]\nPro A | Con B\nPro A | Con B\n[/!COMPARE]\n\n')} title="Comparison table (rows separated by |)">⚖️ Compare</button>
            <button type="button" className="rounded-md border border-[var(--border)] px-2.5 py-1.5 text-xs hover:bg-[var(--surface)]" onClick={() => editor.commands.insertContent('[!EXPAND title="What is this?"]\nExpandable content here\n[/!EXPAND]\n\n')} title="Collapsible expandable section">▸ Expand</button>
            <button type="button" className="rounded-md border border-[var(--border)] px-2.5 py-1.5 text-xs hover:bg-[var(--surface)]" onClick={() => editor.commands.insertContent('[!QUIZ q="Question?" a1="Option A" a2="Option B" a3="Option C" a4="Option D" correct=1]\nExplanation here\n[/!QUIZ]\n\n')} title="Interactive quiz">❓ Quiz</button>
            <button type="button" className="rounded-md border border-[var(--border)] px-2.5 py-1.5 text-xs hover:bg-[var(--surface)]" onClick={() => editor.commands.insertContent('[!POLL q="Your poll question?"]\nOption 1|Option 2|Option 3|Option 4\n[/!POLL]\n\n')} title="Interactive poll with live results">📊 Poll</button>
            <button type="button" className="rounded-md border border-[var(--border)] px-2.5 py-1.5 text-xs hover:bg-[var(--surface)]" onClick={() => editor.commands.insertContent('[!TABS t1="Tab 1" t2="Tab 2" t3="Tab 3"]\nContent for tab 1\n---TAB---\nContent for tab 2\n---TAB---\nContent for tab 3\n[/!TABS]\n\n')} title="Tabbed content (separate tabs with ---TAB---)">🗂️ Tabs</button>
            <button type="button" className="rounded-md border border-[var(--border)] px-2.5 py-1.5 text-xs hover:bg-[var(--surface)]" onClick={() => editor.commands.insertContent('[!EQ label="Equation Name"]\nk = A × exp(-Ea / R·T)\n[/!EQ]\n\n')} title="Named equation block with KaTeX">📐 Equation</button>
            <button type="button" className="rounded-md border border-[var(--border)] px-2.5 py-1.5 text-xs hover:bg-[var(--surface)]" onClick={() => editor.commands.insertContent('[!TIMELINE]\n1991::First event description\n2020::Second event description\n[/!TIMELINE]\n\n')} title="Vertical timeline (year::event per line)">📅 Timeline</button>
            <button type="button" className="rounded-md border border-[var(--border)] px-2.5 py-1.5 text-xs hover:bg-[var(--surface)]" onClick={() => editor.commands.insertContent('[!STEPS]\nStep 1 Title::Step 1 description\nStep 2 Title::Step 2 description\n[/!STEPS]\n\n')} title="Numbered steps (title::body per line)">🔢 Steps</button>
            <button type="button" className="rounded-md border border-[var(--border)] px-2.5 py-1.5 text-xs hover:bg-[var(--surface)]" onClick={() => editor.commands.insertContent('[!PROSCONS]\n+ Pro item 1\n+ Pro item 2\n- Con item 1\n- Con item 2\n[/!PROSCONS]\n\n')} title="Pros and cons grid (+ for pros, - for cons)">✅ Pros/Cons</button>
            <button type="button" className="rounded-md border border-[var(--border)] px-2.5 py-1.5 text-xs hover:bg-[var(--surface)]" onClick={() => editor.commands.insertContent('[!FIGURE src="https://example.com/image.jpg" caption="Image caption" credit="Source Name" creditUrl="https://example.com"][/!FIGURE]\n\n')} title="Image with caption and credit">🖼️ Figure</button>
            <button type="button" className="rounded-md border border-[var(--border)] px-2.5 py-1.5 text-xs hover:bg-[var(--surface)]" onClick={() => editor.commands.insertContent('[!FAQ]\nWhat is this question?\nThis is the answer.\n[/!FAQ]\n\n')} title="FAQ accordion item">❓ FAQ</button>
            <button type="button" className="rounded-md border border-[var(--border)] px-2.5 py-1.5 text-xs hover:bg-[var(--surface)]" onClick={() => editor.commands.insertContent("==highlighted text==")} title="Inline highlight">🖍️ Highlight</button>
          </div>
        </div>

        <div className="mt-4">
          <MediaUpload onUploaded={(url, type) => {
            if (type === "image") {
              editor.chain().focus().setImage({ src: url }).run();
            } else if (type === "video") {
              editor.chain().focus().insertContent(`[[VIDEO:${url}]]`).run();
            } else if (type === "pdf") {
              editor.chain().focus().insertContent(`[[PDF:${url}]]`).run();
            } else {
              editor.chain().focus().insertContent(`[[DOC:${url}]]`).run();
            }
          }} />
        </div>

        <div className="mt-4 overflow-x-auto">
          <EditorContent editor={editor} />
        </div>

        {/* FAQ / Q&A Section */}
        <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface2)] p-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-sm font-semibold">Q&A Section (FAQs)</p>
              <p className="text-xs text-[var(--ink-soft)]">
                Add questions that appear as collapsible FAQs on the published blog post.
              </p>
            </div>
            <button
              type="button"
              className="rounded-lg bg-[var(--accent)] text-black px-3 py-1.5 text-sm font-semibold hover:bg-[var(--accent-strong)]"
              onClick={addFaq}
            >
              + Add Question
            </button>
          </div>

          {faqs.length === 0 && (
            <p className="mt-3 text-xs text-[var(--text3)]">
              No questions yet. Click &quot;+ Add Question&quot; to start.
            </p>
          )}

          <div className="mt-3 grid gap-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[var(--accent)]">
                    Q{idx + 1}
                  </span>
                  <button
                    type="button"
                    className="text-xs text-[var(--red)] hover:underline"
                    onClick={() => removeFaq(idx)}
                  >
                    Remove
                  </button>
                </div>
                <input
                  className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--surface2)] px-3 py-2 text-sm"
                  placeholder="Question..."
                  value={faq.question}
                  onChange={(e) => updateFaq(idx, "question", e.target.value)}
                />
                <textarea
                  className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--surface2)] px-3 py-2 text-sm min-h-[80px]"
                  placeholder="Answer..."
                  value={faq.answer}
                  onChange={(e) => updateFaq(idx, "answer", e.target.value)}
                />
              </div>
            ))}
          </div>

          {faqs.length > 0 && (
            <details className="mt-4 faq-list">
              <summary className="text-xs text-[var(--ink-soft)] cursor-pointer hover:text-[var(--text)]">
                Preview {faqs.length} FAQ{faqs.length > 1 ? "s" : ""}
              </summary>
              <div className="mt-2 space-y-2">
                {faqs.map((faq, idx) => (
                  <details key={idx} className="faq-item">
                    <summary className="faq-question">{faq.question || "(empty question)"}</summary>
                    <p className="faq-answer">{faq.answer || "(empty answer)"}</p>
                  </details>
                ))}
              </div>
            </details>
          )}
        </div>

        {/* Save */}
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
