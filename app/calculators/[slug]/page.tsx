import Link from "next/link";
import { notFound } from "next/navigation";
import type { ComponentType } from "react";
import { CoolingPlateCalculator } from "@/components/calculators/CoolingPlateCalculator";
import { HeatGenerationCalculator } from "@/components/calculators/HeatGenerationCalculator";
import { BusBarCalculator } from "@/components/calculators/BusBarCalculator";
import { PackSizeCalculator } from "@/components/calculators/PackSizeCalculator";
import { SocEstimatorCalculator } from "@/components/calculators/SocEstimatorCalculator";
import { ChargingTimeCalculator } from "@/components/calculators/ChargingTimeCalculator";
import { RangeEstimatorCalculator } from "@/components/calculators/RangeEstimatorCalculator";
import { CellComparisonCalculator } from "@/components/calculators/CellComparisonCalculator";
import { BmsVoltageWindowCalculator } from "@/components/calculators/BmsVoltageWindowCalculator";

type Props = {
  params: Promise<{ slug: string }>;
};

type CalculatorSpec = {
  title: string;
  description: string;
  equation: string;
  component: ComponentType;
  related: Array<{ title: string; href: string }>;
};

const calculators: Record<string, CalculatorSpec> = {
  "cooling-plate": {
    title: "Cooling System Sizing Tool",
    description: "Size coolant flow and channel geometry with Reynolds, Nusselt, and pressure-drop outputs.",
    equation: "Q = m_dot * c_p * Delta T, Re = rho * v * D_h / mu, h = Nu * k / D_h",
    component: CoolingPlateCalculator,
    related: [
      { title: "Thermal Runaway Detection Feature Engineering", href: "/blog/thermal-runaway-detection-feature-engineering" },
      { title: "Battery Preconditioning Time Benefit", href: "/blog/battery-preconditioning-time-benefit" },
    ],
  },
  "heat-generation": {
    title: "Thermal Load Analyzer",
    description: "Estimate per-cell and pack heat load under continuous, pulse, and WLTC-like duty cycles.",
    equation: "P_heat = I^2 * R, Delta T ~= Q * t / (m * c_p)",
    component: HeatGenerationCalculator,
    related: [
      { title: "Winter Range Loss Heat Pump vs PTC", href: "/blog/winter-range-loss-heat-pump-vs-ptc" },
      { title: "Thermal Runaway Detection Feature Engineering", href: "/blog/thermal-runaway-detection-feature-engineering" },
    ],
  },
  "bus-bar": {
    title: "Bus Bar & Fusing Calculator",
    description: "Compute cross-section, resistance, thermal rise, and fuse sizing for HV bus bars.",
    equation: "R = rho * L / A, P_loss = I^2 * R",
    component: BusBarCalculator,
    related: [
      { title: "CAN FD vs Ethernet for Zonal BMS", href: "/blog/can-fd-vs-ethernet-zonal-bms" },
      { title: "Active Balancing Topologies and Transfer Efficiency", href: "/blog/active-balancing-topologies-efficiency" },
    ],
  },
  "pack-size": {
    title: "Battery Pack Designer",
    description: "Design SxP architecture and estimate voltage, energy, density, mass, and packaging dimensions.",
    equation: "V_pack = S * V_cell, Ah_pack = P * Ah_cell, E_kWh = V_pack * Ah_pack / 1000",
    component: PackSizeCalculator,
    related: [
      { title: "LFP vs NMC DCIR Rise Cycle Aging", href: "/blog/lfp-vs-nmc-dcir-rise-cycle-aging" },
      { title: "EKF vs UKF for SOC Estimation in BMS", href: "/blog/ekf-vs-ukf-soc-estimation-bms" },
    ],
  },
  "soc-estimator": {
    title: "SOC Estimator",
    description: "Estimate battery SOC from OCV and temperature with chemistry-aware OCV-SOC curve fitting.",
    equation: "SOC = f(OCV, T, chemistry)",
    component: SocEstimatorCalculator,
    related: [
      { title: "OCV SOC Hysteresis Modeling for LFP Cells", href: "/blog/ocv-soc-hysteresis-modeling-lfp-cells" },
      { title: "EKF vs UKF for SOC Estimation in BMS", href: "/blog/ekf-vs-ukf-soc-estimation-bms" },
    ],
  },
  "charging-time": {
    title: "Charging Time Calculator",
    description: "Estimate charging time over CC-CV phases using charger limits and battery C-rate constraints.",
    equation: "t = E / P, with CV taper after SOC threshold",
    component: ChargingTimeCalculator,
    related: [
      { title: "DC Fast Charge Taper Curves 10 to 80", href: "/blog/dc-fast-charge-taper-curves-10-80" },
      { title: "Ioniq 5 800V Charging Behavior Review", href: "/blog/ioniq-5-800v-charging-behavior-review" },
    ],
  },
  "range-estimator": {
    title: "Range Estimator",
    description: "Predict range across speeds from aero drag, rolling losses, mass, and drivetrain efficiency.",
    equation: "P = 0.5 * rho * C_d * A * v^3 + m * g * C_rr * v",
    component: RangeEstimatorCalculator,
    related: [
      { title: "HVAC Load Sensitivity in Wh per km", href: "/blog/hvac-load-sensitivity-wh-per-km" },
      { title: "BMW i4 Range Consistency Review", href: "/blog/bmw-i4-edrive40-range-consistency-review" },
    ],
  },
  "cell-comparison": {
    title: "Cell Comparison Tool",
    description: "Compare up to three cell candidates across density, power, life, cost, and temperature range.",
    equation: "Normalized score = 100 * (x - min) / (max - min)",
    component: CellComparisonCalculator,
    related: [
      { title: "Silicon Anode Expansion Mitigation Strategies", href: "/blog/silicon-anode-expansion-mitigation-strategies" },
      { title: "Electrolyte Additives for High Voltage Stability", href: "/blog/electrolyte-additives-high-voltage-stability" },
    ],
  },
  "bms-window-checker": {
    title: "BMS Voltage Window Checker",
    description: "Validate cell voltage limits, pack window, and balancing start thresholds.",
    equation: "V_pack,min = S * V_cell,min, V_pack,max = S * V_cell,max",
    component: BmsVoltageWindowCalculator,
    related: [
      { title: "ISO 26262 Battery Safety Goals for BMS", href: "/blog/iso26262-battery-safety-goals-bms" },
      { title: "UN ECE R100 Pack Safety Requirements", href: "/blog/un-ece-r100-pack-level-safety-requirements" },
    ],
  },
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
      <section className="page-hero page-hero-center calc-page-hero">
        <p className="calc-breadcrumb">
          <Link href="/calculators">Calculators</Link> <span>&gt;</span> {calc.title}
        </p>
        <div className="hero-badge">TOOLS</div>
        <h1 className="page-title">{calc.title}</h1>
        <p className="page-subtitle">{calc.description}</p>
        <details className="calc-equation">
          <summary>How this works</summary>
          <pre>{calc.equation}</pre>
        </details>
      </section>

      <section className="calc-container calc-container-wide">
        <Component />
      </section>

      <section className="panel calc-related">
        <h2>Related Blogs</h2>
        <div className="calc-related-grid">
          {calc.related.map((item) => (
            <Link key={item.href} href={item.href} className="calc-related-link">
              {item.title}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
