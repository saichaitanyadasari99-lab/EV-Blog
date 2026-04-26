"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useState, useEffect } from "react";

const navItems = [
  { 
    href: "/", 
    label: "Home" 
  },
  { 
    href: "/blogs", 
    label: "Blogs",
    hasMega: true,
    megaItems: [
      { href: "/blogs", label: "All Articles" },
      { href: "/category/cell-chemistry", label: "Cell Chemistry" },
      { href: "/category/bms-design", label: "Pack & BMS Design" },
      { href: "/category/ev-benchmarks", label: "EV Benchmarks" },
      { href: "/category/vehicle-reviews", label: "Vehicle Reviews" },
      { href: "/category/standards", label: "Standards & Compliance" },
      { href: "/category/news", label: "News" },
    ]
  },
  { 
    href: "/calculators", 
    label: "Calculators",
    hasMega: true,
    megaItems: [
      { href: "/calculators/pack-size", label: "Battery Pack Designer" },
      { href: "/calculators/heat-generation", label: "Thermal Load Analyzer" },
      { href: "/calculators/cooling-plate", label: "Cooling System Sizing" },
      { href: "/calculators/bus-bar", label: "Bus Bar & Fusing" },
      { href: "/calculators/soc-estimator", label: "OCV-SOC Estimator" },
      { href: "/calculators/charging-time", label: "Charging Time" },
      { href: "/calculators/range-estimator", label: "Range Estimator" },
      { href: "/calculators/cell-comparison", label: "Cell Comparison" },
      { href: "/calculators/bms-window-checker", label: "BMS Voltage Window" },
    ]
  },
  { 
    href: "/about", 
    label: "About" 
  },
  { 
    href: "/contact", 
    label: "Contact" 
  },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [openMega, setOpenMega] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSubMenu, setMobileSubMenu] = useState<string | null>(null);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileSubMenu(null);
  }, [pathname]);

  return (
    <>
      <header className="navbar">
        <Link href="/" className="nav-logo">
          <span className="nav-logo-icon">VP</span>
          <span className="nav-logo-text">
            Volt<span>Pulse</span>
          </span>
        </Link>

        <nav className="nav-catsdesktop">
          {navItems.map((item) => (
            <div 
              key={item.href} 
              className="nav-item-wrapper"
              onMouseEnter={() => item.hasMega && setOpenMega(item.href)}
              onMouseLeave={() => item.hasMega && setOpenMega(null)}
            >
              <Link
                href={item.href}
                className={`nav-cat ${pathname === item.href ? "active" : ""} ${item.hasMega ? 'has-mega' : ''}`}
              >
                {item.label}
                {item.hasMega && <span className="nav-arrow">▾</span>}
              </Link>
              
              {item.hasMega && openMega === item.href && (
                <div className="mega-menu">
                  <div className="mega-menu-grid">
                    {item.megaItems?.map((subItem) => (
                      <Link 
                        key={subItem.href} 
                        href={subItem.href}
                        className="mega-menu-link"
                      >
                        {subItem.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
          <button 
            className="mobile-menu-btn" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileMenuOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <>
                  <path d="M3 12h18M3 6h18M3 18h18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)} />
      )}
      
      {/* Mobile Menu Panel */}
      <aside className={`mobile-menu ${mobileMenuOpen ? "open" : ""}`} aria-hidden={!mobileMenuOpen}>
        <nav className="mobile-menu-nav">
          {navItems.map((item) => (
            <div key={item.href} className="mobile-menu-item">
              {item.hasMega ? (
                <>
                  <button 
                    className="mobile-menu-link has-submenu"
                    onClick={() => setMobileSubMenu(mobileSubMenu === item.href ? null : item.href)}
                    aria-expanded={mobileSubMenu === item.href}
                  >
                    {item.label}
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" className={mobileSubMenu === item.href ? "rotated" : ""}>
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  {mobileSubMenu === item.href && (
                    <div className="mobile-submenu">
                      {item.megaItems?.map((subItem) => (
                        <Link 
                          key={subItem.href} 
                          href={subItem.href}
                          className="mobile-submenu-link"
                        >
                          {subItem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link href={item.href} className="mobile-menu-link">
                  {item.label}
                </Link>
              )}
            </div>
          ))}
        </nav>
        
        <div className="mobile-menu-footer">
          <Link href="/#newsletter" className="mobile-subscribe-btn">
            SUBSCRIBE
          </Link>
          <div className="mobile-theme-toggle">
            <ThemeToggle />
            <span>Dark Mode</span>
          </div>
        </div>
      </aside>
    </>
  );
}