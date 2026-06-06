import Link from "next/link";
import type { CSSProperties } from "react";
import { getCategoryTone } from "@/lib/category-theme";
import type { PostRecord } from "@/types/post";

type Props = {
  posts: PostRecord[];
};

export function BreakingTicker({ posts }: Props) {
  const items = posts.slice(0, 6);
  if (!items.length) return null;
  const loopItems = [...items, ...items];
  const toneStyle = { ["--tone" as string]: getCategoryTone(items[0]?.category) } as CSSProperties;

  return (
    <div style={toneStyle} className="news-stripe tone-stripe panel overflow-hidden py-2">
      <div className="flex items-center gap-4 px-3">
        <span className="rounded tone-chip chip px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]">
          Breaking
        </span>
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="ticker-track inline-flex min-w-full animate-[ticker_28s_linear_infinite] gap-8 whitespace-nowrap text-sm">
            {loopItems.map((post, index) => (
              <Link
                key={`${post.id}-${index}`}
                href={`/blog/${post.slug}`}
                className="text-[var(--ink-soft)] hover:text-[var(--foreground)]"
              >
                {post.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
