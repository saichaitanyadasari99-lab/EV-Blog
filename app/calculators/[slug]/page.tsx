import type { Metadata } from "next";
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
import { getWebApplicationSchema, getHowToSchema, getBreadcrumbSchema } from "@/lib/schema";

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

const CALC_META: Record<string, { description: string; keywords: string }> = {
  "cooling-plate": {
    description: "Size EV battery cooling plate channels with Reynolds number, Nusselt number, pressure drop, and flow velocity calculations for liquid-cooled thermal management systems.",
    keywords: "battery cooling plate, cold plate design, liquid cooling EV, thermal management, cold plate sizing, immersion cooling, battery thermal",
  },
  "heat-generation": {
    description: "Estimate per-cell and pack heat load under continuous, pulse, and WLTC duty cycles for EV battery thermal analysis.",
    keywords: "battery heat generation, thermal load, WLTC cycle, EV battery temperature, cell heating, battery thermal analysis",
  },
  "bus-bar": {
    description: "Compute HV bus bar cross-section, resistance, power loss, thermal rise, and fuse sizing with copper vs aluminum comparison.",
    keywords: "bus bar calculator, HV bus bar, fuse sizing, copper bus bar, aluminum bus bar, power loss, thermal rise EV",
  },
  "pack-size": {
    description: "Design battery pack SxP architecture — estimate voltage, energy capacity, energy density, mass, and packaging dimensions.",
    keywords: "battery pack design, SxP configuration, EV battery architecture, pack voltage, energy density calculator, battery mass estimation",
  },
  "soc-estimator": {
    description: "Estimate battery state-of-charge from open-circuit voltage and temperature with chemistry-aware OCV-SOC curve fitting (LFP, NMC, NCA).",
    keywords: "SOC estimation, state of charge, OCV SOC curve, battery SOC calculator, LFP SOC, NMC SOC, BMS algorithm",
  },
  "charging-time": {
    description: "Estimate EV charging time over CC-CV phases using charger power limits and battery C-rate constraints.",
    keywords: "EV charging time, CC CV charging, fast charging calculator, DC fast charge, charging curve, battery C-rate, charging time estimator",
  },
  "range-estimator": {
    description: "Predict EV range across speeds from aerodynamic drag, rolling resistance, vehicle mass, and drivetrain efficiency.",
    keywords: "EV range calculator, electric vehicle range, range estimator, aero drag, rolling resistance, EV efficiency, range prediction",
  },
  "cell-comparison": {
    description: "Compare up to three battery cell candidates across energy density, power capability, cycle life, cost, and temperature range.",
    keywords: "battery cell comparison, cell selection, LFP vs NMC, energy density comparison, cycle life, battery cell datasheet",
  },
  "bms-window-checker": {
    description: "Validate cell voltage limits, pack series voltage window, and balancing start thresholds for BMS calibration.",
    keywords: "BMS voltage window, cell voltage limits, battery balancing, BMS calibration, pack voltage range, overvoltage undervoltage protection",
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const calc = calculators[slug];
  if (!calc) return {};
  const meta = CALC_META[slug];
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.evpulse.co.in";
  return {
    title: calc.title,
    description: meta?.description || calc.description,
    keywords: meta?.keywords || "EV battery calculator, engineering tool",
    alternates: { canonical: `${baseUrl}/calculators/${slug}` },
    openGraph: {
      title: `${calc.title} — EVPulse Calculator`,
      description: meta?.description || calc.description,
    },
  };
}

export default async function CalculatorPage({ params }: Props) {
  const { slug } = await params;
  const calc = calculators[slug];

  if (!calc) {
    notFound();
  }

  const Component = calc.component;

  const webAppSchema = getWebApplicationSchema(slug, calc.title);
  const howToSchema = getHowToSchema(slug, calc.title);
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://www.evpulse.co.in"}` },
    { name: "Calculators", url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://www.evpulse.co.in"}/calculators` },
    { name: calc.title, url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://www.evpulse.co.in"}/calculators/${slug}` },
  ]);

  const methodologyNotes: Record<string, string> = {
    "pack-size": "Uses basic electrical relationships: V_pack = S × V_cell, E_kWh = V_pack × P × Ah_cell / 1000. Mass is estimated from cell-level gravimetric density with a 25% overhead for module housing, bus bars, and cooling components.",
    "heat-generation": "Based on Joule heating: P_heat = I² × R. Temperature rise uses lumped thermal capacity: ΔT = Q / (m × c_p). Duty cycles model continuous (1C), pulse (3C 10s), and WLTC-derived current profiles.",
    "cooling-plate": "Uses internal flow correlations: Re = ρ × v × D_h / μ, Nu from Gnielinski correlation for turbulent flow. Heat transfer: Q = h × A × ΔT_lm. Pressure drop from Darcy-Weisbach with Moody friction factor.",
    "bus-bar": "DC resistance: R = ρ × L / A. Self-heating: ΔT = P_loss × R_th. Fuse sizing follows IEC 60269 derating curves for continuous and pulsed DC loads.",
    "soc-estimator": "SOC is determined from OCV using chemistry-specific polynomial curve fits for LFP, NMC, and NCA. Temperature compensation applies Nernst-derived correction factors from -20°C to 60°C.",
    "charging-time": "CC phase: t_CC = (SOC_target - SOC_start) × E_pack / P_charger. CV taper uses exponential decay model fitted to typical Li-ion charge acceptance above 80% SOC.",
    "range-estimator": "Road load: P = ½ρC_dAv³ + mgC_rrv + ma. Drivetrain efficiency modeled as 0.85-0.92 depending on speed. MIDC and WLTC cycle energy computed by numerical integration.",
    "cell-comparison": "All metrics normalized to a 0-100 scale using min-max normalization per parameter. Weighted scoring allows user-defined importance for energy, power, life, cost, and temperature.",
    "bms-window-checker": "Pack voltage limits: V_pack,min = S × V_cell,min, V_pack,max = S × V_cell,max. Balancing thresholds set at configurable ΔV above min-cell voltage per industry best practices.",
  };

  return (
    <main className="page-main wrapper">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {howToSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
        />
      )}
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
        <details className="calc-methodology">
          <summary>Methodology</summary>
          <p>{methodologyNotes[slug] || "This calculator uses physics-based models derived from EV battery engineering first principles."}</p>
        </details>
      </section>

      <section className="calc-container calc-container-wide" aria-labelledby="calc-inputs-heading">
        <h2 id="calc-inputs-heading" className="sr-only">Calculator Inputs</h2>
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
