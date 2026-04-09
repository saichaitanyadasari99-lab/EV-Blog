import Link from "next/link";

const calculators = [
  {
    slug: "cooling-plate",
    name: "Cooling Plate Calculator",
    description: "Calculate heat transfer and flow requirements for battery cooling plates",
    category: "Thermal",
  },
  {
    slug: "heat-generation",
    name: "Heat Generation Calculator",
    description: "Calculate internal heat generation based on current and resistance",
    category: "Thermal",
  },
  {
    slug: "bus-bar",
    name: "Bus Bar Calculator",
    description: "Calculate bus bar sizing for current carrying capacity",
    category: "BMS Design",
  },
  {
    slug: "pack-size",
    name: "Pack Size Calculator",
    description: "Estimate pack dimensions based on cell count and configuration",
    category: "Cell Chemistry",
  },
];

export default function CalculatorsPage() {
  return (
    <main className="page-main wrapper">
      <section className="page-hero page-hero-center">
        <div className="hero-badge">TOOLS</div>
        <h1 className="page-title">EV Battery Calculators</h1>
        <p className="page-subtitle">Engineering calculators for battery system design and analysis.</p>
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