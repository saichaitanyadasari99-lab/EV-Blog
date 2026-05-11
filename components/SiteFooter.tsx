import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="wrapper">
        <div className="footer-inner">
          <section>
<div className="footer-logo">
              EV<span>Pulse</span>
            </div>
            <p className="footer-p">
              The most technically rigorous source for battery technology and EV engineering coverage.
            </p>
          </section>

<section className="footer-col">
            <h4>Categories</h4>
            <Link href="/category/cell-chemistry">Cell Chemistry</Link>
            <Link href="/category/bms-design">BMS Design</Link>
            <Link href="/category/thermal">Thermal</Link>
            <Link href="/category/charging">Charging</Link>
          </section>

          <section className="footer-col">
            <h4>Resources</h4>
            <Link href="/search">Search</Link>
            <Link href="/blogs">All Blogs</Link>
            <Link href="/glossary">Glossary</Link>
            <Link href="/calculators">Calculators</Link>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
          </section>

          <section className="footer-col">
            <h4>Site</h4>
            <Link href="/blogs">Archive</Link>
          </section>
        </div>

        <div className="footer-bottom">
          <p>(c) 2026 EVPulse. All rights reserved.</p>
          <div>
            <Link href="/about">About</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}


