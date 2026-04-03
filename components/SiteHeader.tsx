"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/", label: "Home" },
  { href: "/blogs", label: "Blogs" },
  { href: "/contact", label: "Contact" },
  { href: "/admin", label: "Admin" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-white/80 backdrop-blur-xl">
      <div className="shell flex items-center justify-between py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[var(--accent)] font-black text-white">
            EV
          </span>
          <span className="font-semibold tracking-tight">EV Blog Post</span>
        </Link>

        <button
          className="rounded-md border border-[var(--border)] bg-white px-3 py-1 text-sm font-semibold text-[var(--ink-soft)] md:hidden"
          onClick={() => setOpen((value) => !value)}
        >
          Menu
        </button>

        <nav className="hidden items-center gap-2 text-sm font-semibold md:flex">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-1.5 transition ${
                pathname === item.href
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--ink-soft)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      {open ? (
        <div className="border-t border-[var(--border)] bg-white md:hidden">
          <div className="shell flex flex-col py-2">
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                  pathname === item.href
                    ? "bg-[var(--accent)] text-white"
                    : "text-[var(--ink-soft)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}
