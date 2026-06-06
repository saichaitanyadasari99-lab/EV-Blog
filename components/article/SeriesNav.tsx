import Link from "next/link"

type SeriesPost = {
  slug: string
  title: string
  tier?: string | null
}

interface Props {
  seriesPosts: SeriesPost[]
  currentSlug: string
  category: string
}

const tierOrder = ["basic", "intermediate", "advanced", "expert"]

export function SeriesNav({ seriesPosts, currentSlug, category }: Props) {
  const sorted = [...seriesPosts].sort(
    (a, b) => tierOrder.indexOf(a.tier || "basic") - tierOrder.indexOf(b.tier || "basic")
  )

  const currentIdx = sorted.findIndex((p) => p.slug === currentSlug)
  if (currentIdx === -1) return null

  const prev = currentIdx > 0 ? sorted[currentIdx - 1] : null
  const next = currentIdx < sorted.length - 1 ? sorted[currentIdx + 1] : null

  if (!prev && !next) return null

  return (
    <section className="series-nav" aria-labelledby="series-heading">
      <h2 id="series-heading">Part of the {category} Series</h2>
      <div className="series-nav-links">
        {prev && (
          <Link href={`/blog/${prev.slug}`} className="series-nav-prev">
            <span className="series-nav-direction">← Previous</span>
            <span className="series-nav-title">{prev.title}</span>
          </Link>
        )}
        {next && (
          <Link href={`/blog/${next.slug}`} className="series-nav-next">
            <span className="series-nav-direction">Next →</span>
            <span className="series-nav-title">{next.title}</span>
          </Link>
        )}
      </div>
    </section>
  )
}
