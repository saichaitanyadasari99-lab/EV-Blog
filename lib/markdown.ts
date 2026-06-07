import katex from "katex";
import "katex/dist/katex.min.css";

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36).slice(0, 8);
}

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function normalizeEncoding(input: string) {
  return input;
}

function slugifyHeading(text: string) {
  return text
    .toLowerCase()
    .replace(/[*_`$$$$]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function stripLatexDelimiters(formula: string): string {
  let f = formula.trim();
  if (f.startsWith("$$") && f.endsWith("$$")) f = f.slice(2, -2).trim();
  else if (f.startsWith("$") && f.endsWith("$")) f = f.slice(1, -1).trim();
  else if (f.startsWith("\\(") && f.endsWith("\\)")) f = f.slice(2, -2).trim();
  else if (f.startsWith("\\[") && f.endsWith("\\]")) f = f.slice(2, -2).trim();
  return f;
}

function renderKatexInline(formula: string): string {
  const f = stripLatexDelimiters(formula);
  try {
    return katex.renderToString(f, { displayMode: false, throwOnError: false, output: "html" });
  } catch {
    return `<code class="math-inline">${escapeHtml(f)}</code>`;
  }
}

function renderKatexBlock(formula: string): string {
  const f = stripLatexDelimiters(formula);
  try {
    return katex.renderToString(f, { displayMode: true, throwOnError: false, output: "html" });
  } catch {
    return `<pre class="math-fallback">${escapeHtml(f)}</pre>`;
  }
}

function formatInline(text: string) {
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

  // Stash inline math before escaping HTML
  value = value.replace(/\\\((.+?)\\\)/g, (_full, formula) => {
    tokens.push(renderKatexInline(formula));
    return `\x00${tokens.length - 1}\x00`;
  });
  value = value.replace(/\$([^$\n]+)\$/g, (_full, formula) => {
    tokens.push(renderKatexInline(formula));
    return `\x00${tokens.length - 1}\x00`;
  });

  value = escapeHtml(value);
  value = value.replace(/`([^`]+)`/g, "<code>$1</code>");
  value = value.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  value = value.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  value = value.replace(/==([^=]+)==/g, '<mark class="inline-highlight">$1</mark>');

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
    html: `<div class="tbl-wrap"><table><thead><tr>${headerCells}</tr></thead><tbody>${rows}</tbody></table></div>`,
    next: idx,
  };
}

function formatBlockContent(content: string): string {
  const paras = content.trim().split(/\n\n+/);
  return paras
    .map((para) => {
      const lines = para
        .split("\n")
        .map((l) => formatInline(l.trim()))
        .filter(Boolean);
      return lines.length > 1
        ? `<p>${lines.join("<br>")}</p>`
        : `<p>${lines[0] ?? ""}</p>`;
    })
    .join("");
}

// ── Callout helper ──────────────────────────────────────────────────────────
function makeCallout(type: string, icon: string, label: string, content: string): string {
  return `<div class="callout ${type}"><div class="c-icon">${icon}</div><div class="c-body"><strong>${label}</strong>${formatBlockContent(content)}</div></div>`;
}

function preprocessCustomBlocks(markdown: string): {
  text: string;
  map: Record<string, string>;
} {
  const map: Record<string, string> = {};
  let counter = 0;
  let text = markdown;

  const register = (html: string): string => {
    const key = `BLOCK_${counter++}`;
    map[key] = html;
    return key;
  };

  // ── [!TLDR] ──────────────────────────────────────────────────────────────
  text = text.replace(
    /\[!TLDR\]([\s\S]*?)\[\/!TLDR\]/g,
    (_, content) => {
      const items = content.trim().split("\n")
        .filter((l: string) => l.trim().startsWith("-"))
        .map((l: string) => `<li>${formatInline(l.trim().slice(1).trim())}</li>`)
        .join("");
      return register(
        `<div class="tldr"><div class="tldr-head"><span class="tldr-badge">TL;DR</span><span class="tldr-title">Key Points</span></div><ul>${items}</ul></div>`
      );
    }
  );

  // ── [!NOTE] ───────────────────────────────────────────────────────────────
  text = text.replace(
    /\[!NOTE\]([\s\S]*?)\[\/!NOTE\]/g,
    (_, content) => register(makeCallout("note", "i", "Note", content))
  );

  // ── [!WARNING] and [!WARN] ────────────────────────────────────────────────
  text = text.replace(
    /\[!(?:WARNING|WARN)\]([\s\S]*?)\[\/!(?:WARNING|WARN)\]/g,
    (_, content) => register(makeCallout("warn", "!", "Warning", content))
  );

  // ── [!KEY] ────────────────────────────────────────────────────────────────
  text = text.replace(
    /\[!KEY\]([\s\S]*?)\[\/!KEY\]/g,
    (_, content) => register(makeCallout("key", "◆", "Key Insight", content))
  );

  // ── [!TIP] ────────────────────────────────────────────────────────────────
  text = text.replace(
    /\[!TIP\]([\s\S]*?)\[\/!TIP\]/g,
    (_, content) => register(makeCallout("tip", "→", "Tip", content))
  );

  // ── [!DANGER] ─────────────────────────────────────────────────────────────
  text = text.replace(
    /\[!DANGER\]([\s\S]*?)\[\/!DANGER\]/g,
    (_, content) => register(makeCallout("danger", "×", "Danger", content))
  );

  // ── [!INFO] ───────────────────────────────────────────────────────────────
  text = text.replace(
    /\[!INFO\]([\s\S]*?)\[\/!INFO\]/g,
    (_, content) => register(makeCallout("info", "≡", "Context", content))
  );

  // ── [!QUOTE] ──────────────────────────────────────────────────────────────
  text = text.replace(
    /\[!QUOTE\]([\s\S]*?)\[\/!QUOTE\]/g,
    (_, content) =>
      register(
        `<blockquote class="pull-quote"><p>${formatInline(content.trim())}</p></blockquote>`
      )
  );

  // ── [!STAT value="X" label="desc"] ───────────────────────────────────────
  text = text.replace(
    /\[!STAT\s+value="([^"]+)"\s+label="([^"]+)"\]\s*(?:\[\/!STAT\])?/g,
    (_, value, label) =>
      register(
        `<div class="stat-highlight"><div class="stat-hl-value">${escapeHtml(value)}</div><div class="stat-hl-label">${escapeHtml(label)}</div></div>`
      )
  );

  // ── [!STAT label="X"]value[/!STAT] (legacy) ──────────────────────────────
  text = text.replace(
    /\[!STAT\s+label="([^"]+)"\]([\s\S]*?)\[\/!STAT\]/g,
    (_, label, value) =>
      register(
        `<div class="stat-highlight"><div class="stat-hl-value">${formatInline(value.trim())}</div><div class="stat-hl-label">${escapeHtml(label)}</div></div>`
      )
  );

  // ── [!STATS] multi-stat row ───────────────────────────────────────────────
  text = text.replace(
    /\[!STATS\]([\s\S]*?)\[\/!STATS\]/g,
    (_, content) => {
      const items = content
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((line: string) => {
          const [label, ...rest] = line.split("::");
          return `<div class="stat-card"><div class="stat-label">${escapeHtml(label.trim())}</div><div class="stat-value">${formatInline(rest.join("::").trim())}</div></div>`;
        })
        .join("");
      return register(`<div class="stat-row">${items}</div>`);
    }
  );

  // ── [!EQ label="Eq. N — Name"]$$...$$[/!EQ] ─────────────────────────────
  text = text.replace(
    /\[!EQ\s+label="([^"]+)"\]([\s\S]*?)\[\/!EQ\]/g,
    (_, label, formula) => {
      const rendered = renderKatexBlock(formula.trim());
      return register(
        `<div class="eq"><div class="eq-label">${escapeHtml(label)}</div><div class="eq-body">${rendered}</div></div>`
      );
    }
  );

  // ── [!COMPARE] table ──────────────────────────────────────────────────────
  text = text.replace(
    /\[!COMPARE\s+a="([^"]+)"\s+b="([^"]+)"(?:\s+c="([^"]*)")?\](?:([\s\S]*?)\[\/!COMPARE\])?/g,
    (_, labelA, labelB, labelC, content) => {
      const threeCol = !!labelC;
      const parseRow = (line: string) => {
        const parts = line.split("|");
        const cells = [formatInline(parts[0]?.trim() ?? ""), formatInline(parts[1]?.trim() ?? "")];
        if (threeCol) cells.push(formatInline(parts[2]?.trim() ?? ""));
        return `<tr>${cells.map((c) => `<td>${c}</td>`).join("")}</tr>`;
      };
      const rows = content
        ? content.trim().split("\n").filter(Boolean).map(parseRow).join("")
        : `<tr><td colspan="${threeCol ? 3 : 2}" style="text-align:center;padding:14px;color:var(--text-dim)">—</td></tr>`;
      const headers = [escapeHtml(labelA), escapeHtml(labelB)];
      if (threeCol) headers.push(escapeHtml(labelC));
      return register(
        `<div class="tbl-wrap"><table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></div>`
      );
    }
  );

  // ── [!COMPARE] bare (no attributes) — pipe-separated table ───────────────
  text = text.replace(
    /\[!COMPARE\]([\s\S]*?)\[\/!COMPARE\]/g,
    (_, content) => {
      const rows = content.trim().split("\n").filter(Boolean);
      if (rows.length < 1) return register("");
      const cells = (line: string) =>
        line.split("|").map((c) => c.trim()).filter(Boolean);
      const headerCells = cells(rows[0]).map((c) => `<th>${formatInline(c)}</th>`).join("");
      const bodyRows = rows
        .slice(1)
        .map((row: string) => `<tr>${cells(row).map((c) => `<td>${formatInline(c)}</td>`).join("")}</tr>`)
        .join("");
      return register(
        `<div class="tbl-wrap"><table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table></div>`
      );
    }
  );

  // ── [!EXPAND] ─────────────────────────────────────────────────────────────
  text = text.replace(
    /\[!EXPAND\s+title="([^"]+)"\]([\s\S]*?)\[\/!EXPAND\]/g,
    (_, title, content) =>
      register(
        `<details class="expandable-section"><summary class="expandable-summary">${escapeHtml(title)}</summary><div class="expandable-body">${formatBlockContent(content)}</div></details>`
      )
  );

  // ── [!QUIZ] ───────────────────────────────────────────────────────────────
  text = text.replace(
    /\[!QUIZ\s+q="([^"]+)"\s+a1="([^"]+)"\s+a2="([^"]+)"\s+a3="([^"]+)"\s+a4="([^"]+)"\s+correct=(\d+)\]([\s\S]*?)\[\/!QUIZ\]/g,
    (_match, q, a1, a2, a3, a4, correct, explanation) => {
      const answers = [a1, a2, a3, a4];
      const correctIdx = parseInt(correct, 10) - 1;
      const id = `quiz_${counter}`;
      const escapedId = id.replace(/'/g, "\\'");
      const answersJson = JSON.stringify(answers).replace(/"/g, "&quot;");
      const optionsHtml = answers
        .map((ans, idx) => {
          const isCorrect = idx === correctIdx;
          return `<button class="quiz-option" data-correct="${isCorrect}" data-quiz="${id}" onclick="(function(btn){var all=document.querySelectorAll('[data-quiz=\\'${escapedId}\\']');all.forEach(function(b){b.disabled=true;b.classList.remove('correct','incorrect');b.classList.add(b.dataset.correct==='true'?'correct':'incorrect')});var exp=document.getElementById('${escapedId}_exp');if(exp)exp.style.display='block'})(this)">${escapeHtml(ans)}</button>`;
        })
        .join("");
      return register(
        `<div class="quiz-block" data-question="${escapeHtml(q)}" data-answers="${answersJson}" data-correct="${correct}" data-explanation="${escapeHtml(explanation.trim())}"><p class="quiz-question"><strong>Q:</strong> ${escapeHtml(q)}</p><div class="quiz-options">${optionsHtml}</div><div class="quiz-explanation" id="${id}_exp" style="display:none"><p>${formatInline(explanation.trim())}</p></div></div>`
      );
    }
  );

  // ── [!POLL] ───────────────────────────────────────────────────────────────
  text = text.replace(
    /\[!POLL\s+q="([^"]+)"\]([\s\S]*?)\[\/!POLL\]/g,
    (_, question, content) => {
      const options = content.trim().split("|").map((o: string) => o.trim()).filter(Boolean);
      const hash = simpleHash(question);
      const pollId = `poll_${hash}`;
      const optionsHtml = options
        .map((opt: string, idx: number) =>
          `<button class="poll-option" data-poll="${pollId}" data-option="${idx}" id="${pollId}_opt${idx}"><span class="poll-label">${escapeHtml(opt)}</span><span class="poll-bar-wrap"><span class="poll-bar" id="${pollId}_bar${idx}"></span></span><span class="poll-pct" id="${pollId}_pct${idx}">—</span></button>`
        )
        .join("");
      return register(
        `<div class="poll-block" data-poll-id="${pollId}" id="${pollId}"><p class="poll-question"><strong>Poll:</strong> ${escapeHtml(question)}</p><div class="poll-options">${optionsHtml}</div><p class="poll-note">Tap to vote</p></div>`
      );
    }
  );

  // ── [!TABS] ───────────────────────────────────────────────────────────────
  text = text.replace(
    /\[!TABS((?:\s+t\d+="[^"]*")+)\]([\s\S]*?)\[\/!TABS\]/g,
    (_, attribs, content) => {
      const labels: string[] = [];
      const labelRe = /t(\d+)="([^"]*)"/g;
      let m: RegExpExecArray | null;
      while ((m = labelRe.exec(attribs)) !== null) {
        labels[parseInt(m[1]) - 1] = m[2];
      }
      const tabId = `tabs_${counter}`;
      const panels = content.split("---TAB---");
      const tabButtons = labels
        .map((label, idx) =>
          `<button class="tab-btn${idx === 0 ? " active" : ""}" onclick="evpulseTab('${tabId}',${idx})" id="${tabId}_btn${idx}">${escapeHtml(label)}</button>`
        )
        .join("");
      const tabPanels = panels
        .map((panel: string, idx: number) =>
          `<div class="tab-panel${idx === 0 ? " active" : ""}" id="${tabId}_panel${idx}">${formatBlockContent(panel)}</div>`
        )
        .join("");
      return register(
        `<div class="tabs-block" id="${tabId}"><div class="tab-buttons">${tabButtons}</div><div class="tab-panels">${tabPanels}</div></div>`
      );
    }
  );

  // ── [!TIMELINE] ───────────────────────────────────────────────────────────
  text = text.replace(
    /\[!TIMELINE\]([\s\S]*?)\[\/!TIMELINE\]/g,
    (_, content) => {
      const items = content.trim().split("\n").filter(Boolean)
        .map((line: string) => {
          const [year, ...rest] = line.split("::");
          const event = rest.join("::").trim();
          return `<div class="timeline-item"><div class="timeline-dot"></div><div class="timeline-content"><span class="timeline-year">${escapeHtml(year.trim())}</span><p class="timeline-event">${formatInline(event)}</p></div></div>`;
        })
        .join("");
      return register(`<div class="timeline-block"><div class="timeline-line"></div>${items}</div>`);
    }
  );

  // ── [!STEPS] ──────────────────────────────────────────────────────────────
  text = text.replace(
    /\[!STEPS\]([\s\S]*?)\[\/!STEPS\]/g,
    (_, content) => {
      const items = content.trim().split("\n").filter(Boolean)
        .map((line: string, idx: number) => {
          // Support both "Title::body" and plain numbered "1. Title" or just text
          const stripped = line.replace(/^\d+\.\s*/, "");
          const [title, ...rest] = stripped.split("::");
          const body = rest.join("::").trim();
          return `<div class="step-item"><div class="step-number">${idx + 1}</div><div class="step-content"><strong class="step-title">${formatInline(title.trim())}</strong>${body ? `<p class="step-body">${formatInline(body)}</p>` : ""}</div></div>`;
        })
        .join("");
      return register(`<div class="steps-block">${items}</div>`);
    }
  );

  // ── [!PROSCONS] and [!PROCONS] ────────────────────────────────────────────
  text = text.replace(
    /\[!(?:PROSCONS|PROCONS)\]([\s\S]*?)\[\/!(?:PROSCONS|PROCONS)\]/g,
    (_, content) => {
      const lines = content.trim().split("\n").filter(Boolean);
      const pros = lines.filter((l: string) => l.trim().startsWith("+"));
      const cons = lines.filter((l: string) => l.trim().startsWith("-"));
      const prosHtml = pros.map((l: string) => `<li>${formatInline(l.trim().slice(1).trim())}</li>`).join("");
      const consHtml = cons.map((l: string) => `<li>${formatInline(l.trim().slice(1).trim())}</li>`).join("");
      return register(
        `<div class="compare"><div class="compare-card pro"><div class="compare-head">✓ Strengths</div><ul class="compare-list">${prosHtml}</ul></div><div class="compare-card con"><div class="compare-head">✗ Limitations</div><ul class="compare-list">${consHtml}</ul></div></div>`
      );
    }
  );

  // ── [!FIGURE] ─────────────────────────────────────────────────────────────
  text = text.replace(
    /\[!FIGURE\s+src="([^"]+)"(?:\s+caption="([^"]*)")?(?:\s+credit="([^"]*)")?(?:\s+creditUrl="([^"]*)")?(?:\s*\/)?\](?:\s*\[\/!FIGURE\])?/g,
    (_, src, caption, credit, creditUrl) => {
      const captionHtml = caption
        ? `<figcaption>${escapeHtml(caption)}${credit ? ` <span class="img-credit">Source: ${creditUrl ? `<a href="${escapeHtml(creditUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(credit)}</a>` : escapeHtml(credit)}</span>` : ""}</figcaption>`
        : credit ? `<figcaption><span class="img-credit">Source: ${creditUrl ? `<a href="${escapeHtml(creditUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(credit)}</a>` : escapeHtml(credit)}</span></figcaption>` : "";
      return register(
        `<figure class="article-figure"><img src="${escapeHtml(src)}" alt="${escapeHtml(caption ?? "")}" loading="lazy"/>${captionHtml}</figure>`
      );
    }
  );

  // ── [!FAQ] (inline) ───────────────────────────────────────────────────────
  text = text.replace(
    /\[!FAQ\]([\s\S]*?)\[\/!FAQ\]/g,
    (_, content) => {
      const [question, ...rest] = content.split("::");
      const answer = rest.join("::").trim();
      return register(
        `<details class="faq-item"><summary class="faq-question">${escapeHtml(question.trim())}</summary><div class="faq-answer">${formatInline(answer)}</div></details>`
      );
    }
  );

  // ── [!QA] Q::A pairs ──────────────────────────────────────────────────────
  text = text.replace(
    /\[!QA\]([\s\S]*?)\[\/!QA\]/g,
    (_, content) => {
      const [question, ...rest] = content.split("::");
      const answer = rest.join("::").trim();
      return register(
        `<div class="qa-item"><div class="qa-q"><span class="q-badge">Q</span><span>${escapeHtml(question.trim())}</span></div><div class="qa-a"><span class="a-badge">A</span><p>${formatInline(answer)}</p></div></div>`
      );
    }
  );

  // ── [!TAKEAWAYS] ──────────────────────────────────────────────────────────
  text = text.replace(
    /\[!TAKEAWAYS\]([\s\S]*?)\[\/!TAKEAWAYS\]/g,
    (_, content) => {
      const items = content.trim().split("\n")
        .filter((l: string) => l.trim())
        .map((l: string) => {
          // Strip leading "1." or "-" or "*"
          const cleaned = l.trim().replace(/^(\d+\.|[-*])\s*/, "");
          return `<li>${formatInline(cleaned)}</li>`;
        })
        .join("");
      return register(
        `<div class="takeaways"><div class="tk-head"><span class="tk-star">✦</span><span class="tk-title">Key Takeaways</span></div><ol>${items}</ol></div>`
      );
    }
  );

  return { text, map };
}

export function markdownToHtml(markdown: string) {
  const { text: preprocessed, map: blockMap } = preprocessCustomBlocks(markdown);

  const lines = normalizeEncoding(preprocessed)
    .replace(/\r\n/g, "\n")
    .split("\n");
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

  const flushOrderedList = () => {
    if (!orderedItems.length) return;
    blocks.push(`<ol>${orderedItems.map((item) => `<li>${formatInline(item)}</li>`).join("")}</ol>`);
    orderedItems = [];
  };

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

    // ── Fenced code block: ```lang [filename: foo.py] ──────────────────────
    if (line.startsWith("```")) {
      flushAll();
      const langRaw = line.slice(3).trim();
      // Parse: "python filename: coulomb.py" or "python" or ""
      let lang = "text";
      let filename = "";
      if (langRaw) {
        const filenameMatch = langRaw.match(/^(\S+)\s+filename:\s*(.+)$/i);
        if (filenameMatch) {
          lang = (filenameMatch[1] || "text").toLowerCase();
          filename = filenameMatch[2].trim();
        } else {
          lang = langRaw.split(/\s+/)[0].toLowerCase() || "text";
        }
      }

      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i += 1;
      }
      const raw = codeLines.join("\n").trimEnd();
      const escaped = raw
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      const copyJs = `navigator.clipboard.writeText(this.closest('.codeblock').querySelector('code').innerText).then(()=>{this.textContent='✓ Copied';this.classList.add('ok');setTimeout(()=>{this.textContent='Copy';this.classList.remove('ok')},2000)})`;
      const filenameHtml = filename ? `<span class="code-filename">${escapeHtml(filename)}</span>` : "";
      blocks.push(
        `<div class="codeblock">` +
        `<div class="code-head"><span class="lang-pill">${lang.toUpperCase()}</span>${filenameHtml}<button type="button" class="copy-btn" onclick="${copyJs}">Copy</button></div>` +
        `<pre><code class="language-${lang}">${escaped}</code></pre></div>`
      );
      continue;
    }

    // ── Freestanding block equation: $$ on its own line ────────────────────
    if (line === "$$") {
      flushAll();
      const formulaLines: string[] = [];
      i += 1;
      while (i < lines.length && lines[i].trim() !== "$$") {
        formulaLines.push(lines[i]);
        i += 1;
      }
      const formula = formulaLines.join("\n").trim();
      const rendered = renderKatexBlock(formula);
      blocks.push(`<div class="eq"><div class="eq-body">${rendered}</div></div>`);
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

    const orderedMatch = line.match(/^\d+\.\s+(.+)/);
    if (orderedMatch) {
      flushParagraph();
      flushList();
      flushBlockquote();
      orderedItems.push(orderedMatch[1]);
      continue;
    }

    if (line.startsWith("> ")) {
      flushParagraph();
      flushList();
      flushOrderedList();
      blockquoteLines.push(line.slice(2).trim());
      continue;
    }

    if (line.startsWith("[FIGURE]")) {
      flushAll();
      const figureLines: string[] = [];
      i += 1;
      while (i < lines.length && lines[i].trim() !== "[/FIGURE]") {
        figureLines.push(lines[i].trim());
        i += 1;
      }
      const figureData: Record<string, string> = {};
      for (const fl of figureLines) {
        const colonIdx = fl.indexOf(": ");
        if (colonIdx >= 0) {
          figureData[fl.slice(0, colonIdx).trim()] = fl.slice(colonIdx + 2).trim();
        }
      }
      const src = figureData.src || "";
      const alt = figureData.alt || "Figure image";
      const caption = figureData.caption || "";
      const credit = figureData.credit || "";
      const creditUrl = figureData.creditUrl || "";
      const license = figureData.license || "";
      const creditHtml = credit
        ? ` <span class="figure-credit">Credit: <a href="${escapeHtml(creditUrl)}" target="_blank" rel="noreferrer">${escapeHtml(credit)}</a> (${escapeHtml(license)})</span>`
        : "";
      blocks.push(`<figure class="article-figure"><img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" /><figcaption>${formatInline(caption)}${creditHtml}</figcaption></figure>`);
      continue;
    }

    const imageNoteMatch = line.match(/^\[IMAGE:\s*(.+)\]$/i);
    if (imageNoteMatch) {
      flushAll();
      blocks.push(`<blockquote><p><strong>Image note:</strong> ${formatInline(imageNoteMatch[1])}</p></blockquote>`);
      continue;
    }

    if (line.startsWith("BLOCK_")) {
      flushAll();
      const html = blockMap[line];
      if (html) blocks.push(html);
      continue;
    }

    flushBlockquote();
    paragraph.push(line);
  }

  flushAll();

  let raw = blocks.join("");
  // Resolve any remaining block placeholders (e.g. inside paragraphs)
  raw = raw.replace(/BLOCK_\d+/g, (key) => blockMap[key] ?? "");

  return raw;
}
