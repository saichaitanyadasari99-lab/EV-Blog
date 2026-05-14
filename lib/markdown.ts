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

  value = escapeHtml(value);
  value = value.replace(/`([^`]+)`/g, "<code>$1</code>");
  value = value.replace(/\$([^$\n]+)\$/g, '<code class="math-inline">$1</code>');
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
    html: `<div class="table-wrap"><table><thead><tr>${headerCells}</tr></thead><tbody>${rows}</tbody></table></div>`,
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

function preprocessCustomBlocks(markdown: string): {
  text: string;
  map: Record<string, string>;
} {
  const map: Record<string, string> = {};
  let counter = 0;
  let text = markdown;

  const register = (html: string): string => {
    const key = `\u0002BLOCK_${counter++}\u0002`;
    map[key] = html;
    return key;
  };

  text = text.replace(
    /\[!NOTE\]([\s\S]*?)\[\/!NOTE\]/g,
    (_, content) =>
      register(
        `<div class="callout callout-note"><span class="callout-icon">ℹ</span><div class="callout-body">${formatBlockContent(
          content
        )}</div></div>`
      )
  );

  text = text.replace(
    /\[!WARNING\]([\s\S]*?)\[\/!WARNING\]/g,
    (_, content) =>
      register(
        `<div class="callout callout-warning"><span class="callout-icon">⚠</span><div class="callout-body">${formatBlockContent(
          content
        )}</div></div>`
      )
  );

  text = text.replace(
    /\[!KEY\]([\s\S]*?)\[\/!KEY\]/g,
    (_, content) =>
      register(
        `<div class="callout callout-key"><span class="callout-icon">🔑</span><div class="callout-body">${formatBlockContent(
          content
        )}</div></div>`
      )
  );

  text = text.replace(
    /\[!TIP\]([\s\S]*?)\[\/!TIP\]/g,
    (_, content) =>
      register(
        `<div class="callout callout-tip"><span class="callout-icon">💡</span><div class="callout-body">${formatBlockContent(
          content
        )}</div></div>`
      )
  );

  text = text.replace(
    /\[!DANGER\]([\s\S]*?)\[\/!DANGER\]/g,
    (_, content) =>
      register(
        `<div class="callout callout-danger"><span class="callout-icon">🔴</span><div class="callout-body">${formatBlockContent(
          content
        )}</div></div>`
      )
  );

  text = text.replace(
    /\[!QUOTE\]([\s\S]*?)\[\/!QUOTE\]/g,
    (_, content) =>
      register(
        `<blockquote class="pull-quote"><p>${formatInline(
          content.trim()
        )}</p></blockquote>`
      )
  );

  text = text.replace(
    /\[!STAT\s+label="([^"]+)"\]([\s\S]*?)\[\/!STAT\]/g,
    (_, label, value) =>
      register(
        `<div class="stat-card"><div class="stat-label">${escapeHtml(
          label
        )}</div><div class="stat-value">${formatInline(
          value.trim()
        )}</div></div>`
      )
  );

  text = text.replace(
    /\[!STATS\]([\s\S]*?)\[\/!STATS\]/g,
    (_, content) => {
      const items = content
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((line: string) => {
          const [label, ...rest] = line.split("::");
          return `<div class="stat-card"><div class="stat-label">${escapeHtml(
            label.trim()
          )}</div><div class="stat-value">${formatInline(
            rest.join("::").trim()
          )}</div></div>`;
        })
        .join("");
      return register(`<div class="stat-row">${items}</div>`);
    }
  );

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
        : `<tr><td colspan="${threeCol ? 3 : 2}" style="text-align:center;padding:14px;color:var(--text3)">—</td></tr>`;
      const headers = [escapeHtml(labelA), escapeHtml(labelB)];
      if (threeCol) headers.push(escapeHtml(labelC));
      return register(
        `<div class="compare-block"><table class="compare-table"><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></div>`
      );
    }
  );

  text = text.replace(
    /\[!EXPAND\s+title="([^"]+)"\]([\s\S]*?)\[\/!EXPAND\]/g,
    (_, title, content) =>
      register(
        `<details class="expandable-section"><summary class="expandable-summary">${escapeHtml(
          title
        )}</summary><div class="expandable-body">${formatBlockContent(
          content
        )}</div></details>`
      )
  );

  text = text.replace(
    /\[!QUIZ\s+q="([^"]+)"\s+a1="([^"]+)"\s+a2="([^"]+)"\s+a3="([^"]+)"\s+a4="([^"]+)"\s+correct=(\d+)\]([\s\S]*?)\[\/!QUIZ\]/g,
    (
      _match,
      q,
      a1,
      a2,
      a3,
      a4,
      correct,
      explanation
    ) => {
      const answers = [a1, a2, a3, a4];
      const correctIdx = parseInt(correct, 10) - 1;
      const id = `quiz_${counter}`;
      const escapedId = id.replace(/'/g, "\\'");
      const answersJson = JSON.stringify(answers).replace(/"/g, "&quot;");
      const optionsHtml = answers
        .map((ans, idx) => {
          const isCorrect = idx === correctIdx;
          return `<button class="quiz-option" data-correct="${isCorrect}" data-quiz="${id}" onclick="(function(btn){var all=document.querySelectorAll('[data-quiz=\\'${escapedId}\\']');all.forEach(function(b){b.disabled=true;b.classList.remove('correct','incorrect');b.classList.add(b.dataset.correct==='true'?'correct':'incorrect')});var exp=document.getElementById('${escapedId}_exp');if(exp)exp.style.display='block'})(this)">${escapeHtml(
            ans
          )}</button>`;
        })
        .join("");
      return register(
        `<div class="quiz-block" data-question="${escapeHtml(q)}" data-answers="${answersJson}" data-correct="${correct}" data-explanation="${escapeHtml(explanation.trim())}"><p class="quiz-question"><strong>Q:</strong> ${escapeHtml(
          q
        )}</p><div class="quiz-options">${optionsHtml}</div><div class="quiz-explanation" id="${id}_exp" style="display:none"><p>${formatInline(
          explanation.trim()
        )}</p></div></div>`
      );
    }
  );

  text = text.replace(
    /\[!POLL\s+q="([^"]+)"\]([\s\S]*?)\[\/!POLL\]/g,
    (_, question, content) => {
      const options = content
        .trim()
        .split("|")
        .map((o: string) => o.trim())
        .filter(Boolean);
      const hash = simpleHash(question);
      const pollId = `poll_${hash}`;
      const optionsHtml = options
        .map((opt: string, idx: number) =>
          `<button class="poll-option" data-poll="${pollId}" data-option="${idx}" id="${pollId}_opt${idx}"><span class="poll-label">${escapeHtml(
            opt
          )}</span><span class="poll-bar-wrap"><span class="poll-bar" id="${pollId}_bar${idx}"></span></span><span class="poll-pct" id="${pollId}_pct${idx}">—</span></button>`
        )
        .join("");
      return register(
        `<div class="poll-block" data-poll-id="${pollId}" id="${pollId}"><p class="poll-question"><strong>Poll:</strong> ${escapeHtml(
          question
        )}</p><div class="poll-options">${optionsHtml}</div><p class="poll-note">Tap to vote</p></div>`
      );
    }
  );

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
          `<button class="tab-btn${
            idx === 0 ? " active" : ""
          }" onclick="evpulseTab('${tabId}',${idx})" id="${tabId}_btn${idx}">${escapeHtml(
            label
          )}</button>`
        )
        .join("");
      const tabPanels = panels
        .map((panel: string, idx: number) =>
          `<div class="tab-panel${
            idx === 0 ? " active" : ""
          }" id="${tabId}_panel${idx}">${formatBlockContent(panel)}</div>`
        )
        .join("");
      return register(
        `<div class="tabs-block" id="${tabId}"><div class="tab-buttons">${tabButtons}</div><div class="tab-panels">${tabPanels}</div></div>`
      );
    }
  );

  text = text.replace(
    /\[!EQ\s+label="([^"]+)"\]([\s\S]*?)\[\/!EQ\]/g,
    (_, label, formula) => {
      const f = formula.trim();
      return register(
        `<div class="equation-block"><span class="equation-label">${escapeHtml(
          label
        )}</span><pre class="math-block" data-formula="${escapeHtml(
          f
        )}"><code>${escapeHtml(f)}</code></pre></div>`
      );
    }
  );

  text = text.replace(
    /\[!TIMELINE\]([\s\S]*?)\[\/!TIMELINE\]/g,
    (_, content) => {
      const items = content
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((line: string) => {
          const [year, ...rest] = line.split("::");
          const event = rest.join("::").trim();
          return `<div class="timeline-item"><div class="timeline-dot"></div><div class="timeline-content"><span class="timeline-year">${escapeHtml(
            year.trim()
          )}</span><p class="timeline-event">${formatInline(event)}</p></div></div>`;
        })
        .join("");
      return register(
        `<div class="timeline-block"><div class="timeline-line"></div>${items}</div>`
      );
    }
  );

  text = text.replace(
    /\[!STEPS\]([\s\S]*?)\[\/!STEPS\]/g,
    (_, content) => {
      const items = content
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((line: string, idx: number) => {
          const [title, ...rest] = line.split("::");
          const body = rest.join("::").trim();
          return `<div class="step-item"><div class="step-number">${
            idx + 1
          }</div><div class="step-content"><strong class="step-title">${escapeHtml(
            title.trim()
          )}</strong>${
            body
              ? `<p class="step-body">${formatInline(body)}</p>`
              : ""
          }</div></div>`;
        })
        .join("");
      return register(`<div class="steps-block">${items}</div>`);
    }
  );

  text = text.replace(
    /\[!PROSCONS\]([\s\S]*?)\[\/!PROSCONS\]/g,
    (_, content) => {
      const lines = content.trim().split("\n").filter(Boolean);
      const pros = lines.filter((l: string) => l.trim().startsWith("+"));
      const cons = lines.filter((l: string) => l.trim().startsWith("-"));
      const prosHtml = pros
        .map((l: string) =>
          `<li>${formatInline(l.trim().slice(1).trim())}</li>`
        )
        .join("");
      const consHtml = cons
        .map((l: string) =>
          `<li>${formatInline(l.trim().slice(1).trim())}</li>`
        )
        .join("");
      return register(
        `<div class="proscons-block"><div class="pros-col"><div class="proscons-header proscons-pros">✅ Pros</div><ul class="proscons-list">${prosHtml}</ul></div><div class="cons-col"><div class="proscons-header proscons-cons">❌ Cons</div><ul class="proscons-list">${consHtml}</ul></div></div>`
      );
    }
  );

  text = text.replace(
    /\[!FIGURE\s+src="([^"]+)"(?:\s+caption="([^"]*)")?(?:\s+credit="([^"]*)")?(?:\s+creditUrl="([^"]*)")?\]\[\/!FIGURE\]/g,
    (_, src, caption, credit, creditUrl) => {
      const captionHtml = caption
        ? `<figcaption>${escapeHtml(caption)}${
            credit
              ? ` <span class="img-credit">Source: ${
                  creditUrl
                    ? `<a href="${escapeHtml(
                        creditUrl
                      )}" target="_blank" rel="noopener noreferrer">${escapeHtml(
                        credit
                      )}</a>`
                    : escapeHtml(credit)
                }</span>`
              : ""
          }</figcaption>`
        : credit
        ? `<figcaption><span class="img-credit">Source: ${
            creditUrl
              ? `<a href="${escapeHtml(
                  creditUrl
                )}" target="_blank" rel="noopener noreferrer">${escapeHtml(
                  credit
                )}</a>`
              : escapeHtml(credit)
          }</span></figcaption>`
        : "";
      return register(
        `<figure class="article-figure"><img src="${escapeHtml(
          src
        )}" alt="${escapeHtml(caption ?? "")}" loading="lazy"/>${captionHtml}</figure>`
      );
    }
  );

  // [!FAQ]question::answer[/!FAQ]
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

  return { text, map };
}

export function markdownToHtml(markdown: string) {
  const { text: preprocessed, map: blockMap } =
    preprocessCustomBlocks(markdown);

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

    if (line === "$$") {
      flushAll();
      const formulaLines: string[] = [];
      i += 1;
      while (i < lines.length && lines[i].trim() !== "$$") {
        formulaLines.push(lines[i]);
        i += 1;
      }
      const formula = formulaLines.join("\n").trim();
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
          const key = fl.slice(0, colonIdx).trim();
          const value = fl.slice(colonIdx + 2).trim();
          figureData[key] = value;
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
      const figHtml = `<figure class="editor-figure"><img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" /><figcaption>${formatInline(caption)}${creditHtml}</figcaption></figure>`;
      blocks.push(figHtml);
      continue;
    }

    const imageNoteMatch = line.match(/^\[IMAGE:\s*(.+)\]$/i);
    if (imageNoteMatch) {
      flushAll();
      blocks.push(`<blockquote><p><strong>Image note:</strong> ${formatInline(imageNoteMatch[1])}</p></blockquote>`);
      continue;
    }

    if (line.startsWith("\u0002BLOCK_")) {
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
  raw = raw.replace(/\u0002BLOCK_\d+\u0002/g, (key) => blockMap[key] ?? "");

  raw = raw.replace(/<pre[^>]*class="[^"]*math-block[^"]*"[^>]*data-formula="([^"]*)"[^>]*>[\s\S]*?<\/pre>/g, (_, formula) => {
    const decoded = formula.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    try {
      return `<div class="katex-display">${katex.renderToString(decoded, { displayMode: true, throwOnError: false })}</div>`;
    } catch { return `<div class="katex-display">${formula}</div>`; }
  });

  raw = raw.replace(/<code[^>]*class="[^"]*math-inline[^"]*"[^>]*>(.*?)<\/code>/g, (_, formula) => {
    const decoded = formula.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    try {
      return katex.renderToString(decoded, { displayMode: false, throwOnError: false });
    } catch { return `<code class="math-inline">${decoded}</code>`; }
  });

  return raw;
}
