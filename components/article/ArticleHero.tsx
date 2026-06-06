interface Props {
  coverUrl?: string | null;
  category: string;
  tier?: string | null;
  title?: string;
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  "cell-chemistry":  "linear-gradient(135deg,#1e3a5f 0%,#1a4480 50%,#0f2d60 100%)",
  "bms-design":      "linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#1e1b4b 100%)",
  "bms":             "linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#1e1b4b 100%)",
  "thermal":         "linear-gradient(135deg,#431407 0%,#7c2d12 50%,#431407 100%)",
  "charging":        "linear-gradient(135deg,#052e16 0%,#14532d 50%,#052e16 100%)",
  "standards":       "linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)",
  "ev-benchmarks":   "linear-gradient(135deg,#0c1445 0%,#1a237e 50%,#0d47a1 100%)",
  "vehicle-reviews": "linear-gradient(135deg,#1b0000 0%,#3d0000 50%,#1b0000 100%)",
  "deepdive":        "linear-gradient(135deg,#071428 0%,#0e2444 50%,#071428 100%)",
  "policy-analysis": "linear-gradient(135deg,#1a0533 0%,#2d0a5c 50%,#1a0533 100%)",
};

const TIER_COLORS: Record<string, string> = {
  noob:         "#22c55e",
  basic:        "#22c55e",
  intermediate: "#3b82f6",
  advanced:     "#f59e0b",
  expert:       "#ef4444",
  master:       "#a855f7",
};

export function ArticleHero({ coverUrl, category, tier, title }: Props) {
  const gradient = CATEGORY_GRADIENTS[category?.toLowerCase()] ?? CATEGORY_GRADIENTS["deepdive"];
  const tierColor = TIER_COLORS[tier?.toLowerCase() ?? ""] ?? TIER_COLORS.intermediate;
  const hasImage = coverUrl && (coverUrl.startsWith("http") || coverUrl.startsWith("/"));

  return (
    <div
      className="w-full rounded-2xl overflow-hidden mb-8"
      style={{
        position: "relative",
        aspectRatio: "21 / 7",
        background: gradient,
      }}
      role="img"
      aria-label={title ?? `${category} article`}
    >
      {/* Cover image */}
      {hasImage && (
        <img
          src={coverUrl}
          alt={title ?? category}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
          }}
          loading="lazy"
        />
      )}

      {/* Gradient overlay for legibility */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: hasImage
            ? "linear-gradient(to top, rgba(0,0,0,.7) 0%, rgba(0,0,0,.3) 50%, rgba(0,0,0,.1) 100%)"
            : "linear-gradient(to top, rgba(0,0,0,.4) 0%, transparent 60%)",
        }}
      />

      {/* Badges */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          left: 20,
          display: "flex",
          gap: 8,
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            padding: "4px 12px",
            borderRadius: 100,
            background: "rgba(0,153,184,.2)",
            border: "1px solid rgba(0,153,184,.35)",
            color: "#5bc8dc",
            fontFamily: "var(--font-mono, monospace)",
          }}
        >
          {category?.replace(/-/g, " ")}
        </span>
        {tier && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              padding: "4px 12px",
              borderRadius: 100,
              background: tierColor + "22",
              border: `1px solid ${tierColor}44`,
              color: tierColor,
              fontFamily: "var(--font-mono, monospace)",
            }}
          >
            {tier}
          </span>
        )}
      </div>
    </div>
  );
}
