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

  return (
    <>
      {/* Share */}
      <div className="sidebar-section">
        <span className="sidebar-label">Share</span>
        <div className="share-btns">
          <button className="share-btn" onClick={() => {}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
            Share
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
          <span className="sidebar-label">Prerequisites</span>
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
