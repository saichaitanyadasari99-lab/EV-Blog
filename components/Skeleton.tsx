"use client";

type SkeletonProps = {
  className?: string;
  height?: string;
  width?: string;
  borderRadius?: string;
  style?: React.CSSProperties;
};

export function Skeleton({ className = "", height = "20px", width = "100%", borderRadius = "4px", style }: SkeletonProps) {
  return (
    <div 
      className={`skeleton ${className}`}
      style={{ height, width, borderRadius, ...style }}
    />
  );
}

export function PostCardSkeleton() {
  return (
    <article className="a-card">
      <Skeleton className="skeleton-img" height="160px" borderRadius="8px 8px 0 0" />
      <div className="a-card-body">
        <Skeleton height="16px" width="60px" borderRadius="4px" />
        <Skeleton height="20px" width="90%" style={{ marginTop: "8px" }} />
        <Skeleton height="16px" width="80%" style={{ marginTop: "8px" }} />
        <Skeleton height="12px" width="40%" style={{ marginTop: "12px" }} />
      </div>
    </article>
  );
}

export function ArticleSkeleton() {
  return (
    <article className="a-card">
      <Skeleton className="skeleton-img" height="200px" borderRadius="8px 8px 0 0" />
      <div className="a-card-body">
        <Skeleton height="14px" width="80px" borderRadius="4px" />
        <Skeleton height="24px" width="100%" style={{ marginTop: "10px" }} />
        <Skeleton height="18px" width="95%" style={{ marginTop: "8px" }} />
        <Skeleton height="18px" width="85%" style={{ marginTop: "6px" }} />
        <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
          <Skeleton height="12px" width="100px" />
          <Skeleton height="12px" width="80px" />
        </div>
      </div>
    </article>
  );
}