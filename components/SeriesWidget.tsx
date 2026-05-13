import Link from "next/link";

type SeriesPost = {
  slug: string;
  title: string;
  tier: string;
};

export function SeriesWidget({
  seriesPosts,
  currentSlug,
  category,
}: {
  seriesPosts: SeriesPost[];
  currentSlug: string;
  category: string;
}) {
  const tierOrder = ["basic", "intermediate", "advanced", "expert"];
  const sorted = [...seriesPosts].sort(
    (a, b) => tierOrder.indexOf(a.tier) - tierOrder.indexOf(b.tier)
  );

  return (
    <div className="series-widget">
      <div className="series-widget-title">{category} Series</div>
      <ul className="series-list">
        {sorted.map((post, idx) => (
          <li key={post.slug} className={post.slug === currentSlug ? "current" : ""}>
            <Link href={`/blog/${post.slug}`}>
              <span className="series-num">{idx + 1}</span>
              {post.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
