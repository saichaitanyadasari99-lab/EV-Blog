import { Suspense } from "react";
import { ArticleSkeleton } from "@/components/Skeleton";

function PostSkeleton() {
  return (
    <article className="page-main wrapper">
      <div className="post-cover-image">
        <div className="skeleton" style={{ height: 400, borderRadius: 8 }} />
      </div>
      <header className="page-hero">
        <div className="skeleton" style={{ height: 32, width: 120, borderRadius: 4 }} />
        <div className="skeleton" style={{ height: 56, width: "80%", marginTop: 16 }} />
        <div className="skeleton" style={{ height: 24, width: "40%", marginTop: 8 }} />
      </header>
      <div className="post-layout">
        <div className="post-main">
          <ArticleSkeleton />
          <ArticleSkeleton />
          <ArticleSkeleton />
        </div>
        <aside className="post-sidebar">
          <div className="skeleton" style={{ height: 200, borderRadius: 8, marginBottom: 16 }} />
          <div className="skeleton" style={{ height: 150, borderRadius: 8 }} />
        </aside>
      </div>
    </article>
  );
}

export default function Loading() {
  return <PostSkeleton />;
}