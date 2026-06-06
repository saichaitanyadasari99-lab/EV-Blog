interface Props {
  equations?: string[]
  category: string
}

const DEFAULT_EQUATIONS = [
  "x̂ₖ⁻ = A·x̂ₖ₋₁ + B·uₖ₋₁",
  "Kₖ = Pₖ⁻·Cᵀ · (C·Pₖ⁻·Cᵀ + R)⁻¹",
  "ε_total = √(Σ εᵢ²)",
]

export function ArticleHero({ equations = DEFAULT_EQUATIONS, category }: Props) {
  return (
    <div
      className="w-full rounded-lg mb-8 overflow-hidden"
      style={{
        background: "linear-gradient(135deg, var(--surface2), var(--surface3))",
        minHeight: "180px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.5rem",
      }}
      role="img"
      aria-label={`Technical illustration for ${category} article`}
    >
      <div className="text-center">
        <p className="font-mono text-[11px] uppercase tracking-widest text-[var(--brand)] mb-3">
          {category}
        </p>
        {equations.map((eq, i) => (
          <p key={i} className="font-mono text-[13px] text-[var(--text2)] whitespace-nowrap mb-1" style={{ opacity: Math.max(0.6, 1 - i * 0.15) }}>
            {eq}
          </p>
        ))}
      </div>
    </div>
  )
}
