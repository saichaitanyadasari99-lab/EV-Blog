import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Youtube from "@tiptap/extension-youtube";
import { TableKit } from "@tiptap/extension-table";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import katex from "katex";

const lowlight = createLowlight(common);

function renderMath(content: string): string {
  content = content.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: true, throwOnError: false });
    } catch { return math; }
  });
  content = content.replace(/\$([^$\n]+?)\$/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
    } catch { return math; }
  });
  
  content = content.replace(/<p class="math-block" data-formula="([^"]+)">/g, (_, formula) => {
    try {
      return katex.renderToString(formula, { displayMode: true, throwOnError: false });
    } catch { return `<p>${formula}</p>`; }
  });
  
  content = content.replace(/!\[([^\]]*)\]\(https:\/\/latex\.codecogs\.com\/png\.image\?.*?\\bg\{white\}([^)]+)\)/g, (_, alt, latex) => {
    try {
      const displayMode = latex.includes("\\dpi{120}") || latex.includes("\\displaystyle");
      const cleanLatex = latex.replace(/\\dpi\{\d+\}/g, "").replace(/\\bg\{white\}/g, "").trim();
      return katex.renderToString(cleanLatex, { displayMode, throwOnError: false });
    } catch { return alt || ""; }
  });
  
  return content;
}

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

  let html = generateHTML(parsed, tiptapExtensions());

  html = renderMath(html);
  html = html.replaceAll(/\[\[PDF:(.*?)\]\]/g, '<iframe src="$1" title="PDF document" style="min-height:450px;border:none;"></iframe>');
  html = html.replaceAll(/\[\[VIDEO:(.*?)\]\]/g, '<video controls src="$1" style="max-height:520px;"></video>');
  html = html.replaceAll(/\[\[DOC:(.*?)\]\]/g, '<div class="doc-embed"><a href="$1" target="_blank" rel="noreferrer" class="doc-link"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>View Document</a></div>');

  // Add copy buttons to code blocks
  html = html.replace(/<pre([^>]*)>([\s\S]*?)<\/pre>/g, (_, attrs, code) => {
    return `<pre${attrs}><button type="button" class="copy-btn" onclick="navigator.clipboard.writeText(this.parentElement.textContent.replace('Copy','').trim()).then(()=>{this.textContent='Copied!';this.classList.add('copied');setTimeout(()=>{this.textContent='Copy';this.classList.remove('copied')},2000)})"><span>Copy</span></button>${code}</pre>`;
  });

  // Add share links to headings
  html = html.replace(/<h2([^>]*)>(.*?)<\/h2>/gi, (_, attrs, text) => {
    const idMatch = attrs.match(/id="([^"]+)"/);
    const id = idMatch ? idMatch[1] : text.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
    return `<h2${attrs} id="${id}">${text}<button type="button" class="share-heading" onclick="navigator.clipboard.writeText(window.location.origin+window.location.pathname+'#${id}').then(()=>{this.classList.add('copied');setTimeout(()=>this.classList.remove('copied'),1500)})" title="Copy link to this section">🔗</button></h2>`;
  });

  html = html.replace(/<h3([^>]*)>(.*?)<\/h3>/gi, (_, attrs, text) => {
    const idMatch = attrs.match(/id="([^"]+)"/);
    const id = idMatch ? idMatch[1] : text.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
    return `<h3${attrs} id="${id}">${text}<button type="button" class="share-heading" onclick="navigator.clipboard.writeText(window.location.origin+window.location.pathname+'#${id}').then(()=>{this.classList.add('copied');setTimeout(()=>this.classList.remove('copied'),1500)})" title="Copy link to this section">🔗</button></h3>`;
  });

  return html;
}

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatInlineText(input: string): string {
  let text = escapeHtml(input);
  text = renderMath(text);
  text = text.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noreferrer">$1</a>',
  );
  text = text.replace(
    /\b(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noreferrer">$1</a>',
  );
  return text;
}

function renderPlainTextHtml(content: string): string {
  const lines = content.split(/\r?\n/);
  const html: string[] = [];
  let listBuffer: string[] = [];
  let orderedBuffer: string[] = [];

  const flushList = () => {
    if (!listBuffer.length) return;
    html.push(`<ul>${listBuffer.join("")}</ul>`);
    listBuffer = [];
  };

  const flushOrdered = () => {
    if (!orderedBuffer.length) return;
    html.push(`<ol>${orderedBuffer.join("")}</ol>`);
    orderedBuffer = [];
  };

  const addOrderedItems = (line: string) => {
    const parts = line
      .split(/(?=\d+\.\s)/)
      .map((part) => part.trim())
      .filter(Boolean);
    for (const part of parts) {
      const item = part.replace(/^\d+\.\s*/, "").trim();
      if (item) orderedBuffer.push(`<li>${formatInlineText(item)}</li>`);
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushList();
      flushOrdered();
      continue;
    }

    if (line.startsWith("- ")) {
      flushOrdered();
      listBuffer.push(`<li>${escapeHtml(line.slice(2))}</li>`);
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      flushList();
      addOrderedItems(line);
      continue;
    }

    flushList();
    flushOrdered();

    if (line.startsWith("## ")) {
      html.push(`<h2>${formatInlineText(line.slice(3))}</h2>`);
      continue;
    }

    html.push(`<p>${formatInlineText(line)}</p>`);
  }

  flushList();
  flushOrdered();
  return html.join("");
}

export function estimateReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = words / 250;
  return Math.max(1, Math.ceil(minutes));
}
