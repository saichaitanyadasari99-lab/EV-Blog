import { Suspense } from "react";
import { ArticleSkeleton, PostCardSkeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="page-main wrapper">
      <div className="page-hero page-hero-center">
        <div className="article-skeleton-header">
          <div className="skeleton" style={{ height: 40, width: 120, borderRadius: 4 }} />
          <div className="skeleton" style={{ height: 60, width: "80%", marginTop: 16 }} />
          <div className="skeleton" style={{ height: 24, width: "60%", marginTop: 8 }} />
        </div>
      </div>
      <div className="articles-grid">
        {[...Array(6)].map((_, i) => (
          <PostCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}