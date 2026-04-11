import { notFound } from "next/navigation";
import type { ComponentType } from "react";
import { CoolingPlateCalculator } from "@/components/calculators/CoolingPlateCalculator";
import { HeatGenerationCalculator } from "@/components/calculators/HeatGenerationCalculator";
import { BusBarCalculator } from "@/components/calculators/BusBarCalculator";
import { PackSizeCalculator } from "@/components/calculators/PackSizeCalculator";

type Props = {
  params: Promise<{ slug: string }>;
};

const calculators: Record<string, { title: string; component: ComponentType }> = {
  "cooling-plate": { title: "Cooling Plate Calculator", component: CoolingPlateCalculator },
  "heat-generation": { title: "Heat Generation Calculator", component: HeatGenerationCalculator },
  "bus-bar": { title: "Bus Bar Calculator", component: BusBarCalculator },
  "pack-size": { title: "Pack Size Calculator", component: PackSizeCalculator },
};

export default async function CalculatorPage({ params }: Props) {
  const { slug } = await params;
  const calc = calculators[slug];

  if (!calc) {
    notFound();
  }

  const Component = calc.component;

  return (
    <main className="page-main wrapper">
      <section className="page-hero page-hero-center">
        <div className="hero-badge">TOOLS</div>
        <h1 className="page-title">{calc.title}</h1>
      </section>
      <section className="calc-container">
        <Component />
      </section>
    </main>
  );
}
