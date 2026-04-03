import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-[var(--border)] bg-white/70">
      <div className="shell grid gap-8 py-10 md:grid-cols-3">
        <section>
          <h3 className="text-sm font-black uppercase tracking-[0.12em] text-[var(--accent)]">
            EV Blog Post
          </h3>
          <p className="mt-3 text-sm text-[var(--ink-soft)]">
            Notes on battery chemistry, EV benchmarks, pack design, and compliance
            standards.
          </p>
        </section>
        <section>
          <h3 className="text-sm font-black uppercase tracking-[0.12em] text-[var(--accent)]">
            Explore
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-[var(--ink-soft)]">
            <li>
              <Link href="/blogs" className="hover:text-[var(--foreground)]">
                All Blogs
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-[var(--foreground)]">
                Contact
              </Link>
            </li>
            <li>
              <Link href="/admin" className="hover:text-[var(--foreground)]">
                Admin
              </Link>
            </li>
          </ul>
        </section>
        <section>
          <h3 className="text-sm font-black uppercase tracking-[0.12em] text-[var(--accent)]">
            Categories
          </h3>
          <p className="mt-3 text-sm text-[var(--ink-soft)]">
            Cell Chemistry, BMS Design, EV Benchmarks, Vehicle Reviews, and
            Standards.
          </p>
        </section>
      </div>
    </footer>
  );
}
