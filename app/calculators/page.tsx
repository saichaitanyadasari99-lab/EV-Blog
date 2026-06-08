import type { Metadata } from "next";
import Link from "next/link";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.evpulse.co.in";

export const metadata: Metadata = {
  title: "EV Battery Engineering Calculators",
  description: "Free engineering-grade calculators for EV battery pack design, thermal load analysis, cooling system sizing, SOC estimation, charging time, range prediction, bus bar sizing, cell comparison, and BMS voltage window checking.",
  alternates: { canonical: `${baseUrl}/calculators` },
  openGraph: {
    title: "EV Battery Engineering Calculators — EVPulse",
    description: "Free engineering-grade calculators for pack design, thermal analysis, SOC estimation, charging, range prediction, and BMS calibration.",
  },
};

const indiaCalculators = [
  {
    slug: "ev-vs-petrol",
    name: "EV vs Petrol TCO",
    description: "7-year total cost comparison with break-even point, annual savings, and CO₂ avoided. Covers all segments — 2W, 3W, Car, SUV.",
    category: "India Tools",
    icon: "⚡",
  },
  {
    slug: "charging-cost-india",
    name: "India Charging Cost",
    description: "State DISCOM tariffs, home vs public EVSE split, and per-km cost vs petrol. Compares all 20 states.",
    category: "India Tools",
    icon: "🔌",
  },
  {
    slug: "fame-subsidy",
    name: "FAME-II / PM E-DRIVE Subsidy",
    description: "Calculate central + state subsidies and road tax waiver for 2W, 3W, 4W, e-Bus, and e-Truck.",
    category: "India Tools",
    icon: "🏛",
  },
  {
    slug: "ev-solar",
    name: "EV + Rooftop Solar",
    description: "Size a rooftop solar system to power your EV. Calculates panels needed, self-sufficiency %, and payback period.",
    category: "India Tools",
    icon: "☀️",
  },
  {
    slug: "battery-health",
    name: "Battery Health Estimator",
    description: "Estimate SOH from cycles, temperature, and chemistry. Projects 10-year capacity degradation curve.",
    category: "India Tools",
    icon: "🔋",
  },
];

const calculators = [
  {
    slug: "pack-size",
    name: "Battery Pack Designer",
    description: "Design SxP architecture, density, mass range, and live pack geometry",
    category: "Pack Design",
  },
  {
    slug: "heat-generation",
    name: "Thermal Load Analyzer",
    description: "Estimate heat generation across duty profiles including WLTC mode",
    category: "Thermal",
  },
  {
    slug: "cooling-plate",
    name: "Cooling System Sizing Tool",
    description: "Size cooling plate channels with Reynolds, Nusselt, and pressure-drop outputs",
    category: "Thermal",
  },
  {
    slug: "bus-bar",
    name: "Bus Bar & Fusing Calculator",
    description: "Cross-section, power loss, thermal rise, fuse recommendation, and Cu vs Al comparison",
    category: "Electrical",
  },
  {
    slug: "soc-estimator",
    name: "SOC Estimator",
    description: "Estimate SOC from OCV/temperature with chemistry-specific OCV-SOC curve",
    category: "BMS",
  },
  {
    slug: "charging-time",
    name: "Charging Time Calculator",
    description: "CC-CV charging profile with phase split and total charging duration",
    category: "Charging",
  },
  {
    slug: "range-estimator",
    name: "Range Estimator",
    description: "Predict range vs speed based on aero, mass, and rolling losses",
    category: "Vehicle",
  },
  {
    slug: "cell-comparison",
    name: "Cell Comparison Tool",
    description: "Compare up to three cells across energy, power, life, cost, and temperature",
    category: "Cell Chemistry",
  },
  {
    slug: "bms-window-checker",
    name: "BMS Voltage Window Checker",
    description: "Validate pack voltage window and balancing thresholds",
    category: "BMS",
  },
];

export default function CalculatorsPage() {
  return (
    <main className="page-main wrapper">
      <section className="page-hero page-hero-center">
        <div className="hero-badge">TOOLS</div>
        <h1 className="page-title">EV Calculators</h1>
        <p className="page-subtitle">India-specific consumer tools and engineering-grade calculators for pack design, thermal analysis, charging, and BMS calibration.</p>
      </section>

      {/* ── India Tools ────────────────────────────────────────── */}
      <section className="calc-grid" style={{ marginBottom: "48px" }}>
        <div className="calc-section-header">
          <div className="calc-section-title">🇮🇳 India Tools</div>
          <div className="calc-section-subtitle">Made for Indian EV buyers, owners, and fleet operators</div>
        </div>
        {indiaCalculators.map((calc) => (
          <Link key={calc.slug} href={`/calculators/${calc.slug}`} className="calc-india-card">
            <div className="calc-india-card-icon">{calc.icon}</div>
            <div className="calc-india-card-name">{calc.name}</div>
            <div className="calc-india-card-desc">{calc.description}</div>
            <span className="calc-india-card-cat">{calc.category}</span>
          </Link>
        ))}
      </section>

      {/* ── Engineering Tools ──────────────────────────────────── */}
      <section className="calc-grid">
        <div className="calc-section-header">
          <div className="calc-section-title">⚙️ Engineering Calculators</div>
          <div className="calc-section-subtitle">Physics-based tools for battery pack engineers and BMS developers</div>
        </div>
        {calculators.map((calc) => (
          <Link key={calc.slug} href={`/calculators/${calc.slug}`} className="calc-card">
            <h2 className="calc-title">{calc.name}</h2>
            <p className="calc-desc">{calc.description}</p>
            <span className="calc-cat">{calc.category}</span>
          </Link>
        ))}
      </section>
    </main>
  );
}
