import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Youtube from "@tiptap/extension-youtube";
import { TableKit } from "@tiptap/extension-table";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";

const lowlight = createLowlight(common);

export function tiptapExtensions() {
  return [
    StarterKit,
    Image.configure({ allowBase64: false }),
    Link.configure({ openOnClick: true, autolink: true }),
    Youtube.configure({ controls: true }),
    TableKit.configure({ table: { resizable: true } }),
    CodeBlockLowlight.configure({ lowlight }),
  ];
}

export function parseTiptapJson(content: string | null): Record<string, unknown> | null {
  if (!content) return null;
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

export function renderTiptapHtml(content: string | null): string {
  if (!content) return "";

  const parsed = parseTiptapJson(content);
  if (!parsed) {
    return renderPlainTextHtml(content);
  }

  const html = generateHTML(parsed, tiptapExtensions());

  return html
    .replaceAll(
      /\[\[PDF:(.*?)\]\]/g,
      '<iframe src="$1" title="PDF document" style="min-height:450px;border:none;"></iframe>',
    )
    .replaceAll(
      /\[\[VIDEO:(.*?)\]\]/g,
      '<video controls src="$1" style="max-height:520px;"></video>',
    );
}

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderPlainTextHtml(content: string): string {
  const lines = content.split(/\r?\n/);
  const html: string[] = [];
  let listBuffer: string[] = [];

  const flushList = () => {
    if (!listBuffer.length) return;
    html.push(`<ul>${listBuffer.join("")}</ul>`);
    listBuffer = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushList();
      continue;
    }

    if (line.startsWith("- ")) {
      listBuffer.push(`<li>${escapeHtml(line.slice(2))}</li>`);
      continue;
    }

    flushList();

    if (line.startsWith("## ")) {
      html.push(`<h2>${escapeHtml(line.slice(3))}</h2>`);
      continue;
    }

    html.push(`<p>${escapeHtml(line)}</p>`);
  }

  flushList();
  return html.join("");
}

export function estimateReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}
