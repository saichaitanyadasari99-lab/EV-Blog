import "@/styles/article-layout.css"

const TIER_LABELS: Record<string, string> = {
  basic:        "Beginner",
  intermediate: "Intermediate",
  advanced:     "Advanced",
  expert:       "Expert",
  master:       "Master",
}

const TIER_CLASSES: Record<string, string> = {
  basic:        "t-basic",
  intermediate: "t-intermediate",
  advanced:     "t-advanced",
  expert:       "t-expert",
  master:       "t-master",
}

interface Props {
  title: string
  excerpt?: string | null
  category?: string | null
  tier?: string | null
  createdAt?: string | null
  readingTime?: number | null
  tags?: string[]
  slug?: string
}

function formatDate(iso?: string | null): string {
  if (!iso) return ""
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  } catch {
    return iso
  }
}

export function ArticleHero({ title, excerpt, category, tier, createdAt, readingTime, tags }: Props) {
  const tierKey = tier?.toLowerCase() ?? ""
  const tierLabel = TIER_LABELS[tierKey] ?? tier ?? ""
  const tierClass = TIER_CLASSES[tierKey] ?? ""
  const catDisplay = category?.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) ?? ""

  return (
    <section className="article-hero">
      <div className="article-hero-inner">
        {/* Breadcrumb */}
        <nav className="hero-breadcrumb" aria-label="Breadcrumb">
          <a href="/">Home</a>
          <span className="sep">›</span>
          <a href="/blogs">Articles</a>
          {category && (
            <>
              <span className="sep">›</span>
              <span>{catDisplay}</span>
            </>
          )}
        </nav>

        {/* Tags row */}
        <div className="hero-tags">
          {category && (
            <span className="hero-cat-tag">{catDisplay}</span>
          )}
          {tierLabel && (
            <span className={`hero-tier-tag ${tierClass}`}>{tierLabel}</span>
          )}
        </div>

        {/* Title */}
        <h1 className="hero-h1">{title}</h1>

        {/* Subtitle */}
        {excerpt && (
          <p className="hero-subtitle">{excerpt}</p>
        )}

        {/* Meta bar */}
        <div className="hero-meta">
          {createdAt && (
            <>
              <span>{formatDate(createdAt)}</span>
              <span className="meta-sep">·</span>
            </>
          )}
          {readingTime && (
            <>
              <span>{readingTime} min read</span>
              <span className="meta-sep">·</span>
            </>
          )}
          {tierLabel && (
            <span className="meta-level">{tierLabel}</span>
          )}
          {tags && tags.length > 0 && (
            <>
              <span className="meta-sep">·</span>
              <span>{tags.slice(0, 3).join(", ")}</span>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
