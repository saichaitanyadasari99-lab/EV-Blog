function SkeletonLine({ width = "100%", height = 14, mt = 0 }: { width?: string | number; height?: number; mt?: number }) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius: 4, marginTop: mt }}
    />
  );
}

function BreadcrumbSkeleton() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 12 }}>
      <SkeletonLine width={40} height={11} />
      <span style={{ color: "var(--text3)", fontSize: 11 }}>/</span>
      <SkeletonLine width={50} height={11} />
      <span style={{ color: "var(--text3)", fontSize: 11 }}>/</span>
      <SkeletonLine width={160} height={11} />
    </div>
  );
}

function CategoryBadgeSkeleton() {
  return (
    <div
      className="skeleton"
      style={{ width: 90, height: 20, borderRadius: 4, marginBottom: 12 }}
    />
  );
}

function TitleSkeleton() {
  return (
    <>
      <SkeletonLine width="80%" height={28} mt={0} />
      <SkeletonLine width="60%" height={28} mt={8} />
    </>
  );
}

function MetaSkeleton() {
  return (
    <div style={{ display: "flex", gap: 12, marginTop: 12, marginBottom: 20 }}>
      <SkeletonLine width={100} height={12} />
      <SkeletonLine width={80} height={12} />
      <SkeletonLine width={60} height={12} />
    </div>
  );
}

function HeroSkeleton() {
  return (
    <div
      className="skeleton"
      style={{
        width: "100%",
        height: 200,
        borderRadius: 12,
        marginBottom: 24,
      }}
    />
  );
}

function TocSidebarSkeleton() {
  return (
    <div>
      <SkeletonLine width={80} height={13} mt={0} />
      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        {[90, 70, 85, 60, 75, 50].map((w, i) => (
          <SkeletonLine key={i} width={`${w}%`} height={11} />
        ))}
      </div>
      <div style={{ marginTop: 24 }}>
        <SkeletonLine width={60} height={11} />
        <SkeletonLine width={100} height={11} mt={8} />
        <SkeletonLine width={70} height={11} mt={8} />
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <>
      <div className="fixed top-0 left-0 right-0 h-0.5 z-50 skeleton progress-bar" />
      <div className="page-main wrapper" style={{ paddingTop: 32 }}>
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1fr",
          }}
          className="lg:grid-cols-[220px_1fr]"
        >
          <aside
            className="toc-sidebar hidden lg:block"
            style={{ borderRight: "1px solid var(--border)", padding: "24px 20px" }}
          >
            <TocSidebarSkeleton />
          </aside>
          <article style={{ minWidth: 0, padding: "24px 32px 80px", maxWidth: 768 }}>
            <BreadcrumbSkeleton />
            <CategoryBadgeSkeleton />
            <TitleSkeleton />
            <MetaSkeleton />
            <HeroSkeleton />
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[100, 95, 98, 92, 100, 88, 96, 90].map((w, i) => (
                <SkeletonLine key={i} width={`${w}%`} height={14} />
              ))}
            </div>
          </article>
        </div>
      </div>
    </>
  );
}
