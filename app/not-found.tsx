import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page-main wrapper">
      <section className="page-hero page-hero-center" style={{ minHeight: "50vh", justifyContent: "center" }}>
        <div className="hero-badge" style={{ background: "var(--accent)", color: "#000" }}>
          404
        </div>
        <h1 className="page-title">Page not found</h1>
        <p className="page-subtitle">
          The page you are looking for does not exist or has been moved.
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="/" className="btn-accent">Go Home</Link>
          <Link href="/blogs" className="sec-link" style={{ display: "inline-flex", alignItems: "center" }}>
            Browse Articles
          </Link>
        </div>
        <div style={{ marginTop: 32, display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "center", fontSize: 14, color: "var(--text2)" }}>
          <Link href="/search">Search</Link>
          <Link href="/calculators">Calculators</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
        </div>
      </section>
    </main>
  );
}
