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
    return `<p>${content}</p>`;
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

export function estimateReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}
