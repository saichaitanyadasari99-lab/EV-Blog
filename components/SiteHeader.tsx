"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";

const links = [
  { href: "/", label: "Home" },
  { href: "/blogs", label: "Blogs" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/admin", label: "Admin" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="navbar">
      <Link href="/" className="nav-logo">
        <span className="nav-logo-icon">VP</span>
        <span className="nav-logo-text">
          Volt<span>Pulse</span>
        </span>
      </Link>

      <nav className="nav-cats">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`nav-cat ${pathname === link.href ? "active" : ""}`}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="nav-actions">
        <Link href="/search" className="nav-btn" aria-label="Search">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
        </Link>
        <ThemeToggle />
        <Link href="/#newsletter" className="nav-subscribe">
          SUBSCRIBE
        </Link>
      </div>
    </header>
  );
}
