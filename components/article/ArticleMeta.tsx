const TIER_LABELS: Record<string, string> = {
  basic: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  expert: "Expert",
}

interface Props {
  date: string
  readingTime: number
  tier?: string | null
}

export function ArticleMeta({ date, readingTime, tier }: Props) {
  return (
    <div className="font-mono text-[11px] text-[var(--text2)] flex items-center gap-2 flex-wrap mb-6">
      <span>{new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
      <span>·</span>
      <span>{readingTime} min read</span>
      {tier && (
        <>
          <span>·</span>
          <span className="px-2 py-0.5 rounded text-[10px] uppercase" style={{ background: "var(--yellow-dim)", color: "var(--yellow)" }}>
            {TIER_LABELS[tier] || tier}
          </span>
        </>
      )}
    </div>
  )
}
