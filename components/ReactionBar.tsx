"use client";

import { useState, useEffect } from "react";

type ReactionOption = {
  icon: string;
  label: string;
  key: string;
};

const reactions: ReactionOption[] = [
  { icon: "💡", label: "Learned something", key: "learned" },
  { icon: "🔖", label: "Saving this", key: "saving" },
  { icon: "🤔", label: "Need more context", key: "context" },
];

export function ReactionBar() {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("reaction");
    if (stored) setActive(stored);
  }, []);

  const handleClick = (key: string) => {
    if (active === key) {
      setActive(null);
      localStorage.removeItem("reaction");
      return;
    }
    setActive(key);
    localStorage.setItem("reaction", key);
  };

  return (
    <div className="reaction-bar">
      <span className="reaction-bar-label">How was this article?</span>
      {reactions.map((r) => (
        <button
          key={r.key}
          type="button"
          className={`reaction-btn ${active === r.key ? "active" : ""}`}
          onClick={() => handleClick(r.key)}
        >
          <span className="reaction-icon">{r.icon}</span>
          <span>{r.label}</span>
        </button>
      ))}
    </div>
  );
}
