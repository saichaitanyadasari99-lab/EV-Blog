"use client"

import { useState } from "react"

interface Props {
  tier?: string | null
  tags?: string[]
}

const TIER_DOTS: Record<string, number> = {
  basic: 1,
  intermediate: 2,
  advanced: 3,
  expert: 4,
  master: 5,
}

export function LeftSidebar({ tier, tags }: Props) {
  const dots = tier ? TIER_DOTS[tier] ?? 0 : 0
  const [copied, setCopied] = useState(false)

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function shareX() {
    const url = encodeURIComponent(window.location.href)
    const text = encodeURIComponent(document.title)
    window.open(`https://x.com/intent/tweet?url=${url}&text=${text}`, "_blank", "noopener")
  }

  function shareLinkedIn() {
    const url = encodeURIComponent(window.location.href)
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, "_blank", "noopener")
  }

  return (
    <>
      {/* Share */}
      <div className="sidebar-section">
        <span className="sidebar-label">Share</span>
        <div className="share-btns">
          <button className="share-btn" onClick={copyLink} title={copied ? "Copied!" : "Copy link"}>
            {copied ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
            )}
            {copied ? "Copied" : "Link"}
          </button>
          <button className="share-btn" onClick={shareX} title="Share on X">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            X
          </button>
          <button className="share-btn" onClick={shareLinkedIn} title="Share on LinkedIn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
            in
          </button>
        </div>
      </div>

      {/* Difficulty */}
      <div className="sidebar-section">
        <span className="sidebar-label">Level</span>
        <div className="difficulty-bar">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`diff-dot ${i <= dots ? "filled" : ""} ${tier ? `t-${tier}` : ""}`} />
          ))}
        </div>
        <span className="difficulty-label">{tier ? tier.charAt(0).toUpperCase() + tier.slice(1) : ""}</span>
      </div>

      {/* Prerequisites */}
      {tags && tags.length > 0 && (
        <div className="sidebar-section">
          <span className="sidebar-label">Topics</span>
          <div className="prereq-list">
            {tags.slice(0, 5).map((tag) => (
              <span key={tag} className="prereq-item">{tag}</span>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
