import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "EV Battery Engineering Calculators",
  description: "Free engineering-grade calculators for EV battery pack design, thermal load analysis, cooling system sizing, SOC estimation, charging time, range prediction, bus bar sizing, cell comparison, and BMS voltage window checking.",
  openGraph: {
    title: "EV Battery Engineering Calculators — EVPulse",
    description: "Free engineering-grade calculators for battery pack design, thermal analysis, SOC estimation, charging, range prediction, and BMS calibration.",
  },
};

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
        <h1 className="page-title">EV Battery Calculators</h1>
        <p className="page-subtitle">Engineering-grade calculators for pack design, thermal analysis, charging, and BMS calibration.</p>
      </section>

      <section className="calc-grid">
        {calculators.map((calc) => (
          <Link key={calc.slug} href={`/calculators/${calc.slug}`} className="calc-card">
            <h3 className="calc-title">{calc.name}</h3>
            <p className="calc-desc">{calc.description}</p>
            <span className="calc-cat">{calc.category}</span>
          </Link>
        ))}
      </section>
    </main>
  );
}
