"use client";

import { useState } from "react";

type Heading = {
  text: string;
  id: string;
};

export function MobileTOC({ headings }: { headings: Heading[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mobile-toc">
      <button
        className={`mobile-toc-trigger ${open ? "open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>In This Article</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
      </button>
      <div className={`mobile-toc-body ${open ? "show" : ""}`}>
        <ul className="toc-list" style={{ padding: "8px 0" }}>
          {headings.map((h) => (
            <li key={h.id}>
              <a href={`#${h.id}`} onClick={() => setOpen(false)}>{h.text}</a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
