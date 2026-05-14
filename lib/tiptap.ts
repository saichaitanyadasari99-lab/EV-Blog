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
  // Block math from markdown parser: <pre class="math-block" data-formula="...">
  content = content.replace(/<pre[^>]*class="[^"]*math-block[^"]*"[^>]*data-formula="([^"]*)"[^>]*>[\s\S]*?<\/pre>/g, (_, formula) => {
    const decoded = formula.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    try {
      return `<div class="katex-display">${katex.renderToString(decoded, { displayMode: true, throwOnError: false })}</div>`;
    } catch { return `<div class="katex-display">${formula}</div>`; }
  });

  // Raw $$...$$ blocks that survived TipTap processing
  content = content.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    try {
      return `<div class="katex-display">${katex.renderToString(math.trim(), { displayMode: true, throwOnError: false })}</div>`;
    } catch { return math; }
  });

  // Inline math: <code class="math-inline">formula</code>
  content = content.replace(/<code[^>]*class="[^"]*math-inline[^"]*"[^>]*>([\s\S]*?)<\/code>/g, (_, formula) => {
    const decoded = formula.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    try {
      return katex.renderToString(decoded, { displayMode: false, throwOnError: false });
    } catch { return `<code class="math-inline">${decoded}</code>`; }
  });

  // Raw $...$ inline that survived processing
  content = content.replace(/\$([^$\n]+?)\$/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
    } catch { return math; }
  });

  // Codecogs image fallback
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

  // Wrap code blocks with .code-block header
  html = html.replace(/<pre([^>]*)>([\s\S]*?)<\/pre>/g, (_, attrs, code) => {
    const langMatch = attrs.match(/class="[^"]*language-(\w+)[^"]*"/);
    const lang = langMatch ? langMatch[1] : "code";
    return `<div class="code-block"><div class="code-block-header"><span class="lang-tag">${lang}</span><button type="button" class="copy-btn" onclick="navigator.clipboard.writeText(this.parentElement.nextElementSibling.textContent.trim()).then(()=>{this.textContent='Copied!';this.classList.add('copied');setTimeout(()=>{this.textContent='Copy';this.classList.remove('copied')},2000)})">Copy</button></div><pre${attrs}>${code}</pre></div>`;
  });

  // Protect pre/code content from custom block regex
  const protectedBlocks: string[] = [];
  html = html.replace(/<pre[\s\S]*?<\/pre>|<code[\s\S]*?<\/code>/gi, (match) => {
    const placeholder = `@@PROTECTED_${protectedBlocks.length}@@`;
    protectedBlocks.push(match);
    return placeholder;
  });

  // Process custom block syntax in TipTap-rendered content
  html = processCustomBlocks(html);

  // Restore protected content
  html = html.replace(/@@PROTECTED_(\d+)@@/g, (_, idx) => protectedBlocks[parseInt(idx)]);

  // Add share links to headings
  html = html.replace(/<h2([^>]*)>(.*?)<\/h2>/gi, (_, attrs, text) => {
    const idMatch = attrs.match(/id="([^"]+)"/);
    const id = idMatch ? idMatch[1] : text.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
    return `<h2${attrs} id="${id}">${text}<button type="button" class="anchor-btn" onclick="navigator.clipboard.writeText(window.location.origin+window.location.pathname+'#${id}').then(()=>{this.classList.add('copied');setTimeout(()=>this.classList.remove('copied'),1500)})" title="Copy link to this section">🔗</button></h2>`;
  });

  html = html.replace(/<h3([^>]*)>(.*?)<\/h3>/gi, (_, attrs, text) => {
    const idMatch = attrs.match(/id="([^"]+)"/);
    const id = idMatch ? idMatch[1] : text.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
    return `<h3${attrs} id="${id}">${text}<button type="button" class="anchor-btn" onclick="navigator.clipboard.writeText(window.location.origin+window.location.pathname+'#${id}').then(()=>{this.classList.add('copied');setTimeout(()=>this.classList.remove('copied'),1500)})" title="Copy link to this section">🔗</button></h3>`;
  });

  return html;
}

function processCustomBlocks(html: string): string {
  // Inline highlight: ==text==
  html = html.replace(/==([^=]+)==/g, '<mark class="inline-highlight">$1</mark>');

  // Callouts
  html = html.replace(
    /(?:<p>)?\[!NOTE\]([\s\S]*?)\[\/!NOTE\](?:<\/p>)?/gi,
    (_, c) => `<div class="callout callout-note"><span class="callout-icon">ℹ</span><div class="callout-body">${c.trim()}</div></div>`,
  );
  html = html.replace(
    /(?:<p>)?\[!WARNING\]([\s\S]*?)\[\/!WARNING\](?:<\/p>)?/gi,
    (_, c) => `<div class="callout callout-warning"><span class="callout-icon">⚠</span><div class="callout-body">${c.trim()}</div></div>`,
  );
  html = html.replace(
    /(?:<p>)?\[!KEY\]([\s\S]*?)\[\/!KEY\](?:<\/p>)?/gi,
    (_, c) => `<div class="callout callout-key"><span class="callout-icon">🔑</span><div class="callout-body">${c.trim()}</div></div>`,
  );
  html = html.replace(
    /(?:<p>)?\[!TIP\]([\s\S]*?)\[\/!TIP\](?:<\/p>)?/gi,
    (_, c) => `<div class="callout callout-tip"><span class="callout-icon">💡</span><div class="callout-body">${c.trim()}</div></div>`,
  );
  html = html.replace(
    /(?:<p>)?\[!DANGER\]([\s\S]*?)\[\/!DANGER\](?:<\/p>)?/gi,
    (_, c) => `<div class="callout callout-danger"><span class="callout-icon">🔴</span><div class="callout-body">${c.trim()}</div></div>`,
  );

  // Pull quote
  html = html.replace(
    /(?:<p>)?\[!QUOTE\]([\s\S]*?)\[\/!QUOTE\](?:<\/p>)?/gi,
    (_, c) => `<div class="pull-quote"><blockquote><p>${c.trim()}</p></blockquote></div>`,
  );

  // Single stat card
  html = html.replace(
    /(?:<p>)?\[!STAT\s+label="([^"]+)"\]([\s\S]*?)\[\/!STAT\](?:<\/p>)?/gi,
    (_, label, value) => `<div class="stat-card"><div class="stat-label">${label}</div><div class="stat-value">${value.trim()}</div></div>`,
  );

  // Multi stat row
  html = html.replace(
    /(?:<p>)?\[!STATS\]\s*([\s\S]*?)\s*\[\/!STATS\](?:<\/p>)?/gi,
    (_, content) => {
      const items = content.trim().split("\n").filter(Boolean).map((line: string) => {
        const [label, ...rest] = line.split("::");
        const value = rest.join("::").trim();
        return `<div class="stat-card"><div class="stat-label">${label.trim()}</div><div class="stat-value">${value}</div></div>`;
      }).join("");
      return `<div class="stat-row">${items}</div>`;
    },
  );

  // Expandable section
  html = html.replace(
    /(?:<p>)?\[!EXPAND\s+title="([^"]+)"\]([\s\S]*?)\[\/!EXPAND\](?:<\/p>)?/gi,
    (_, title, content) => `<details class="expandable-section"><summary class="expandable-summary">${title}</summary><div class="expandable-body"><p>${content.trim()}</p></div></details>`,
  );

  // Steps
  html = html.replace(
    /(?:<p>)?\[!STEPS\]\s*([\s\S]*?)\s*\[\/!STEPS\](?:<\/p>)?/gi,
    (_, content) => {
      const items = content.trim().split("\n").filter(Boolean).map((line: string, idx: number) => {
        const [title, ...rest] = line.split("::");
        const body = rest.join("::").trim();
        return `<div class="step-item"><div class="step-number">${idx + 1}</div><div class="step-content"><strong class="step-title">${title.trim()}</strong>${body ? `<p class="step-body">${body}</p>` : ""}</div></div>`;
      }).join("");
      return `<div class="steps-block">${items}</div>`;
    },
  );

  // Timeline
  html = html.replace(
    /(?:<p>)?\[!TIMELINE\]\s*([\s\S]*?)\s*\[\/!TIMELINE\](?:<\/p>)?/gi,
    (_, content) => {
      const items = content.trim().split("\n").filter(Boolean).map((line: string) => {
        const [year, ...rest] = line.split("::");
        const event = rest.join("::").trim();
        return `<div class="timeline-item"><div class="timeline-dot"></div><div class="timeline-content"><span class="timeline-year">${year.trim()}</span><p class="timeline-event">${event}</p></div></div>`;
      }).join("");
      return `<div class="timeline-block"><div class="timeline-line"></div>${items}</div>`;
    },
  );

  // Pros & Cons
  html = html.replace(
    /(?:<p>)?\[!PROSCONS\]\s*([\s\S]*?)\s*\[\/!PROSCONS\](?:<\/p>)?/gi,
    (_, content) => {
      const lines = content.trim().split("\n").filter(Boolean);
      const pros = lines.filter((l: string) => l.trim().startsWith("+")).map((l: string) => `<li>${l.trim().slice(1).trim()}</li>`).join("");
      const cons = lines.filter((l: string) => l.trim().startsWith("-")).map((l: string) => `<li>${l.trim().slice(1).trim()}</li>`).join("");
      return `<div class="proscons-block"><div class="pros-col"><div class="proscons-header proscons-pros">✅ Pros</div><ul class="proscons-list">${pros}</ul></div><div class="cons-col"><div class="proscons-header proscons-cons">❌ Cons</div><ul class="proscons-list">${cons}</ul></div></div>`;
    },
  );

  // Compare table
  html = html.replace(
    /(?:<p>)?\[!COMPARE\s+a="([^"]+)"\s+b="([^"]+)"(?:\s+c="([^"]*)")?\](?:\s*([\s\S]*?)\s*\[\/!COMPARE\])?(?:<\/p>)?/gi,
    (_, labelA, labelB, labelC, content) => {
      const threeCol = !!labelC;
      const parseRow = (line: string) => {
        const parts = line.split("|").map((p: string) => p.trim());
        const cells = [parts[0] ?? "", parts[1] ?? ""];
        if (threeCol) cells.push(parts[2] ?? "");
        return `<tr>${cells.map((c) => `<td>${c}</td>`).join("")}</tr>`;
      };
      const rows = content?.trim()
        ? content.trim().split("\n").filter(Boolean).map(parseRow).join("")
        : `<tr><td colspan="${threeCol ? 3 : 2}" style="text-align:center;padding:14px;color:var(--text3)">—</td></tr>`;
      const headers = [labelA, labelB];
      if (threeCol) headers.push(labelC);
      return `<div class="compare-block"><table class="compare-table"><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></div>`;
    },
  );

  // FAQ
  html = html.replace(
    /(?:<p>)?\[!FAQ\]\s*([\s\S]*?)\s*\[\/!FAQ\](?:<\/p>)?/gi,
    (_, content) => {
      const [question, ...rest] = content.split("::");
      const answer = rest.join("::").trim();
      return `<details class="faq-item"><summary class="faq-question">${question.trim()}</summary><div class="faq-answer">${answer}</div></details>`;
    },
  );

  // Figure
  html = html.replace(
    /(?:<p>)?\[!FIGURE\s+src="([^"]+)"(?:\s+caption="([^"]*)")?(?:\s+credit="([^"]*)")?(?:\s+creditUrl="([^"]*)")?(?:\s*\/)?\](?:\s*\[\/!FIGURE\])?(?:<\/p>)?/gi,
    (_, src, caption, credit, creditUrl) => {
      const creditHtml = credit
        ? `<span class="img-credit">Source: ${creditUrl ? `<a href="${creditUrl}" target="_blank" rel="noopener noreferrer">${credit}</a>` : credit}</span>`
        : "";
      return `<figure class="article-figure"><img src="${src}" alt="${caption || ""}" loading="lazy" />${caption ? `<figcaption>${caption}${creditHtml ? " " + creditHtml : ""}</figcaption>` : creditHtml ? `<figcaption>${creditHtml}</figcaption>` : ""}</figure>`;
    },
  );

  // Equation block
  html = html.replace(
    /(?:<p>)?\[!EQ\s+label="([^"]+)"\]\s*([\s\S]*?)\s*\[\/!EQ\](?:<\/p>)?/gi,
    (_, label, formula) => {
      const f = formula.trim();
      let rendered = escapeHtml(f);
      try {
        rendered = katex.renderToString(f, { displayMode: true, throwOnError: false });
      } catch { /* fallback to escaped formula */ }
      return `<div class="equation-block"><span class="equation-label">${label}</span><div class="katex-display">${rendered}</div></div>`;
    },
  );

  // Tabs
  let tabCounter = 0;
  html = html.replace(
    /(?:<p>)?\[!TABS((?:\s+t\d+="[^"]*")+)\]\s*([\s\S]*?)\s*\[\/!TABS\](?:<\/p>)?/gi,
    (_, attribs, content) => {
      const labels: string[] = [];
      const labelRe = /t(\d+)="([^"]*)"/g;
      let m: RegExpExecArray | null;
      while ((m = labelRe.exec(attribs)) !== null) {
        labels[parseInt(m[1]) - 1] = m[2];
      }
      const tabId = `tabs_${tabCounter++}`;
      const panels = content.split("---TAB---");
      const tabButtons = labels.map((label, idx) =>
        `<button class="tab-btn${idx === 0 ? " active" : ""}" onclick="evpulseTab('${tabId}',${idx})" id="${tabId}_btn${idx}">${label}</button>`,
      ).join("");
      const tabPanels = panels.map((panel: string, idx: number) =>
        `<div class="tab-panel${idx === 0 ? " active" : ""}" id="${tabId}_panel${idx}">${panel.trim()}</div>`,
      ).join("");
      return `<div class="tabs-block" id="${tabId}"><div class="tab-buttons">${tabButtons}</div><div class="tab-panels">${tabPanels}</div></div>`;
    },
  );

  // Quiz
  let quizCounter = 0;
  html = html.replace(
    /(?:<p>)?\[!QUIZ\s+q="([^"]+)"\s+a1="([^"]+)"\s+a2="([^"]+)"\s+a3="([^"]+)"\s+a4="([^"]+)"\s+correct=(\d+)\]([\s\S]*?)\[\/!QUIZ\](?:<\/p>)?/gi,
    (_match, q, a1, a2, a3, a4, correct, explanation) => {
      const answers = [a1, a2, a3, a4];
      const correctIdx = parseInt(correct, 10) - 1;
      const id = `quiz_${quizCounter++}`;
      const escapedId = id.replace(/'/g, "\\'");
      const answersJson = JSON.stringify(answers).replace(/"/g, "&quot;");
      const optionsHtml = answers.map((ans: string, idx: number) => {
        const isCorrect = idx === correctIdx;
        return `<button class="quiz-option" data-correct="${isCorrect}" data-quiz="${id}" onclick="(function(btn){var all=document.querySelectorAll('[data-quiz=\\'${escapedId}\\']');all.forEach(function(b){b.disabled=true;b.classList.remove('correct','incorrect');b.classList.add(b.dataset.correct==='true'?'correct':'incorrect')});var exp=document.getElementById('${escapedId}_exp');if(exp)exp.style.display='block'})(this)">${ans}</button>`;
      }).join("");
      return `<div class="quiz-block" data-question="${q}" data-answers="${answersJson}" data-correct="${correct}" data-explanation="${explanation.trim()}"><p class="quiz-question"><strong>Q:</strong> ${q}</p><div class="quiz-options">${optionsHtml}</div><div class="quiz-explanation" id="${id}_exp" style="display:none"><p>${explanation.trim()}</p></div></div>`;
    },
  );

  // Poll
  let pollCounter = 0;
  html = html.replace(
    /(?:<p>)?\[!POLL\s+q="([^"]+)"\]\s*([\s\S]*?)\s*\[\/!POLL\](?:<\/p>)?/gi,
    (_, question, content) => {
      const options = content.trim().split("|").map((o: string) => o.trim()).filter(Boolean);
      const pollId = `poll_${pollCounter++}`;
      const optionsHtml = options.map((opt: string, idx: number) =>
        `<button class="poll-option" data-poll="${pollId}" data-option="${idx}" id="${pollId}_opt${idx}"><span class="poll-label">${opt}</span><span class="poll-bar-wrap"><span class="poll-bar" id="${pollId}_bar${idx}"></span></span><span class="poll-pct" id="${pollId}_pct${idx}">—</span></button>`,
      ).join("");
      return `<div class="poll-block" data-poll-id="${pollId}" id="${pollId}"><p class="poll-question"><strong>Poll:</strong> ${question}</p><div class="poll-options">${optionsHtml}</div><p class="poll-note">Tap to vote</p></div>`;
    },
  );

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
