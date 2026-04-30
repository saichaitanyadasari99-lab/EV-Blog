import type { PostRecord } from "@/types/post";

type RefLink = { title: string; url: string };

type SeedInput = {
  slug: string;
  title: string;
  excerpt: string;
  category: PostRecord["category"];
  tags: string[];
  date: string;
  readingTime: number;
  focus: string;
  method: string;
  takeaway: string;
};

const imagePool: Record<string, string[]> = {
  post: [
    "https://commons.wikimedia.org/wiki/Special:FilePath/Lithium_Ion_Battery.jpg",
    "https://commons.wikimedia.org/wiki/Special:FilePath/Lithium-Ion_Cell_cylindric.JPG",
  ],
  "deep-dive": [
    "https://commons.wikimedia.org/wiki/Special:FilePath/Electric_Car_Charging_Point.jpg",
    "https://commons.wikimedia.org/wiki/Special:FilePath/Lithium_Ion_Battery.jpg",
  ],
  benchmark: [
    "https://commons.wikimedia.org/wiki/Special:FilePath/Electric_Car_Charging_Point.jpg",
    "https://commons.wikimedia.org/wiki/Special:FilePath/Lithium-Ion_Cell_cylindric.JPG",
  ],
  review: [
    "https://commons.wikimedia.org/wiki/Special:FilePath/Electric_Car_Charging_Point.jpg",
    "https://commons.wikimedia.org/wiki/Special:FilePath/Lithium_Ion_Battery.jpg",
  ],
  standards: [
    "https://commons.wikimedia.org/wiki/Special:FilePath/Lithium_Ion_Battery.jpg",
    "https://commons.wikimedia.org/wiki/Special:FilePath/Electric_Car_Charging_Point.jpg",
  ],
};

const refsByCategory: Record<string, RefLink[]> = {
  post: [
    { title: "IEA Global EV Outlook 2025", url: "https://www.iea.org/reports/global-ev-outlook-2025" },
    { title: "ORNL Review: Calendar Aging of Silicon-Containing Batteries", url: "https://impact.ornl.gov/en/publications/calendar-aging-of-silicon-containing-batteries/" },
    { title: "Open-Circuit Voltage Hysteresis in LiFePO4 for SOC Estimation", url: "https://doi.org/10.1016/j.apenergy.2015.10.092" },
    { title: "U.S. DOE Vehicle Technologies Office: Batteries", url: "https://www.energy.gov/eere/vehicles/batteries" },
  ],
  "deep-dive": [
    { title: "ISO 26262 (Functional Safety) Overview", url: "https://www.iso.org/standard/68383.html" },
    { title: "SAE J2464 Abuse Testing Scope", url: "https://www.sae.org/standards/content/j2464_200911/" },
    { title: "U.S. DOE Battery R&D", url: "https://www.energy.gov/eere/vehicles/batteries" },
    { title: "IEA Global EV Outlook 2025", url: "https://www.iea.org/reports/global-ev-outlook-2025" },
  ],
  benchmark: [
    { title: "Alternative Fuels Data Center: Electricity Basics", url: "https://afdc.energy.gov/fuels/electricity_basics.html" },
    { title: "Hyundai IONIQ 5 Charging Specifications", url: "https://www.hyundaiusa.com/us/en/vehicles/2025-ioniq-5" },
    { title: "IEA Global EV Outlook 2025", url: "https://www.iea.org/reports/global-ev-outlook-2025" },
    { title: "U.S. DOE Battery Program", url: "https://www.energy.gov/eere/vehicles/batteries" },
  ],
  review: [
    { title: "Tesla Model Y", url: "https://www.tesla.com/modely" },
    { title: "Hyundai IONIQ 5", url: "https://www.hyundaiusa.com/us/en/vehicles/2025-ioniq-5" },
    { title: "BMW i4 eDrive40 Technical Highlights", url: "https://www.bmw.com/en-au/all-models/bmw-i/i4/2021/bmw-i4-highlights.html" },
    { title: "Ford F-150 Lightning", url: "https://www.ford.com/trucks/f150/f150-lightning/" },
  ],
  standards: [
    { title: "UN Vehicle Regulations (WP.29) Portal", url: "https://unece.org/transport/vehicle-regulations-wp29" },
    { title: "UL 2580 Standard Page", url: "https://www.shopulstandards.com/ProductDetail.aspx?productId=UL2580" },
    { title: "ISO 6469-1:2019", url: "https://www.iso.org/cms/render/live/en/sites/isoorg/contents/data/standard/06/86/68665.html" },
    { title: "ISO 15118-1", url: "https://www.iso.org/cms/render/live/en/sites/isoorg/contents/data/standard/05/53/55365.html" },
  ],
};

const extraRefsBySlug: Record<string, RefLink[]> = {
  "iec-61851-charging-interface-practical-guide": [
    { title: "IEC 61851 (EV Conductive Charging System)", url: "https://webstore.iec.ch/publication/33644" },
  ],
  "un-ece-r100-pack-level-safety-requirements": [
    { title: "UN Regulation No. 100 (Electric Power Train Safety)", url: "https://unece.org/transport/vehicle-regulations-wp29/regulations" },
  ],
  "iso-15118-plug-charge-cybersecurity-basics": [
    { title: "ISO 15118-20 Publication Details", url: "https://www.iso.org/standard/77845.html" },
  ],
  "eqs-suv-energy-consumption-aero-vs-mass": [
    { title: "Mercedes-Benz EQS SUV", url: "https://www.mbusa.com/en/vehicles/class/eqs/suv" },
  ],
};

function contentFor(item: SeedInput): string {
  return [
    "## Why this topic matters",
    `${item.excerpt} Engineers evaluating production feasibility need clarity on controllable variables, not only headline outcomes. This article frames the subsystem behavior against thermal limits, impedance growth, and calibration tradeoffs.`,
    "## Engineering method",
    `${item.method} The review uses repeatable operating windows (SOC, temperature, and power level) and compares outcomes on normalized metrics such as energy throughput, equivalent full cycles, or effective charging power over usable windows.`,
    "## Key technical points",
    `- ${item.focus}`,
    `- Tags considered in this analysis: ${item.tags.join(", ")}.`,
    "- Sensitivity checks include ambient variation, instrumentation uncertainty, and control strategy impact.",
    "- Results are interpreted with pack-level constraints, not isolated cell data alone.",
    "## Practical takeaway",
    `${item.takeaway} For engineering teams, the critical path is linking model assumptions to measurable pack behavior, then folding that into BMS logic and thermal-control limits before design freeze.`,
  ].join("\n\n");
}

function refsFor(item: SeedInput): RefLink[] {
  const base = refsByCategory[item.category ?? "post"] ?? [];
  const extra = extraRefsBySlug[item.slug] ?? [];
  const all = [...base, ...extra];
  const seen = new Set<string>();
  return all.filter((r) => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });
}

function coverFor(item: SeedInput, index: number): string | null {
  const pool = imagePool[item.category ?? "post"] ?? imagePool.post;
  return pool[index % pool.length] ?? null;
}

const seed: SeedInput[] = [
  {
    slug: "lfp-vs-nmc-dcir-rise-cycle-aging",
    title: "LFP vs NMC: DCIR Rise Under 1,500-Cycle Aging",
    excerpt: "A controlled comparison of impedance growth under 25 C and 45 C conditions with matched C-rates.",
    category: "post",
    tags: ["LFP", "NMC", "DCIR", "cycle-aging", "power-fade"],
    date: "2026-03-20T09:00:00.000Z",
    readingTime: 9,
    focus: "LFP tends to retain lower resistance growth under repeated moderate C-rate cycling, while high-nickel systems can deliver higher energy at the cost of thermal sensitivity.",
    method: "Cells are compared on pulse-resistance maps before and after staged aging blocks, with matched temperature control and charge-throughput accounting.",
    takeaway: "Choose chemistry by duty cycle: prioritize resistance stability for frequent high-power dispatch and prioritize energy density only where thermal envelope is tightly controlled.",
  },
  {
    slug: "ocv-soc-hysteresis-modeling-lfp-cells",
    title: "OCV-SOC Hysteresis Modeling for LFP Cells",
    excerpt: "A practical hysteresis-aware model for robust SOC estimation in flat-voltage chemistries.",
    category: "post",
    tags: ["OCV", "SOC", "hysteresis", "LFP", "estimation"],
    date: "2026-03-16T09:00:00.000Z",
    readingTime: 8,
    focus: "Ignoring hysteresis in flat OCV regions can create persistent SOC bias, especially after dynamic current transients.",
    method: "Charge-rest-discharge sequences are used to build branch-specific OCV surfaces, then evaluated in observer loops under realistic drive profiles.",
    takeaway: "Use hysteresis-aware observer design plus periodic anchor points to suppress long-horizon SOC drift in LFP packs.",
  },
  {
    slug: "silicon-anode-expansion-mitigation-strategies",
    title: "Silicon Anode Expansion: Mitigation Strategies That Scale",
    excerpt: "Binder selection, particle engineering, and formation protocols for high-silicon blends.",
    category: "post",
    tags: ["silicon-anode", "expansion", "binder", "prelithiation", "formation"],
    date: "2026-03-10T09:00:00.000Z",
    readingTime: 10,
    focus: "Particle cracking and unstable interphase growth remain the main durability bottlenecks for silicon-rich blends.",
    method: "Mitigation routes are compared by cycle retention, first-cycle efficiency impact, and compatibility with gigascale coating and calendaring lines.",
    takeaway: "The best production path is usually moderate silicon loading with process-stable binders and tightly controlled formation windows.",
  },
  {
    slug: "calendar-aging-arrhenius-activation-energy",
    title: "Calendar Aging and Arrhenius Fit: Extracting Activation Energy",
    excerpt: "How to fit temperature-dependent capacity loss and avoid common statistical pitfalls.",
    category: "post",
    tags: ["calendar-aging", "Arrhenius", "activation-energy", "lifetime", "SOC-window"],
    date: "2026-03-04T09:00:00.000Z",
    readingTime: 11,
    focus: "Activation-energy estimates shift with SOC window and chemistry, so single-fit extrapolation can overstate lifetime confidence.",
    method: "Multi-temperature storage data is fit with uncertainty bands and cross-validated against independent hold-out windows.",
    takeaway: "Use segmented Arrhenius models and explicit confidence bounds when converting lab storage data into warranty projections.",
  },
  {
    slug: "electrolyte-additives-high-voltage-stability",
    title: "Electrolyte Additives for High-Voltage Stability Above 4.3 V",
    excerpt: "Interphase control strategies for manganese dissolution and gas suppression.",
    category: "post",
    tags: ["electrolyte", "additives", "high-voltage", "SEI", "CEI"],
    date: "2026-02-27T09:00:00.000Z",
    readingTime: 9,
    focus: "Additive packages can trade fast-charge capability for shelf-life gains depending on CEI/SEI formation pathways.",
    method: "Cells are screened with differential voltage and impedance diagnostics after high-voltage holds and accelerated cycling.",
    takeaway: "Treat additive selection as a multi-objective optimization problem across energy density, thermal robustness, and aging rate.",
  },
  {
    slug: "ekf-vs-ukf-soc-estimation-bms",
    title: "EKF vs UKF for SOC Estimation in Production BMS",
    excerpt: "State-estimator performance under sensor noise, temperature drift, and model mismatch.",
    category: "deep-dive",
    tags: ["EKF", "UKF", "SOC", "BMS", "observer"],
    date: "2026-03-22T09:00:00.000Z",
    readingTime: 12,
    focus: "UKF can improve non-linear observability in transient-heavy profiles but at higher compute and calibration overhead.",
    method: "Estimator variants are tested against synchronized current-voltage-temperature traces and validated with coulomb-count references.",
    takeaway: "For most production BMS, EKF with temperature-adaptive parameters remains the best cost-performance baseline.",
  },
  {
    slug: "iso26262-battery-safety-goals-bms",
    title: "ISO 26262 Safety Goals for Battery Control Software",
    excerpt: "ASIL allocation, fault handling, and safety mechanism coverage in high-voltage packs.",
    category: "deep-dive",
    tags: ["ISO26262", "ASIL", "functional-safety", "BMS", "diagnostics"],
    date: "2026-03-14T09:00:00.000Z",
    readingTime: 13,
    focus: "Battery hazards must map cleanly from HARA outputs into safety goals, technical safety requirements, and monitor coverage.",
    method: "Safety mechanisms are traced to fault hypotheses and validated through fault injection and degraded-mode timing checks.",
    takeaway: "Strong safety architecture needs traceability, diagnostic coverage evidence, and deterministic fallback behavior under communication loss.",
  },
  {
    slug: "active-balancing-topologies-efficiency",
    title: "Active Balancing Topologies and Transfer Efficiency",
    excerpt: "Inductor, capacitor, and transformer-based balancing circuits under realistic mismatch conditions.",
    category: "deep-dive",
    tags: ["active-balancing", "passive-balancing", "topology", "efficiency", "pack-uniformity"],
    date: "2026-03-08T09:00:00.000Z",
    readingTime: 10,
    focus: "Energy-transfer topology determines both balancing speed and thermal overhead under high mismatch scenarios.",
    method: "Equivalent-circuit simulation is paired with hardware-in-loop checks to estimate balancing time versus conversion losses.",
    takeaway: "Passive balancing remains practical for many packs, but high-utilization fleets can justify active balancing with clear energy-recovery benefits.",
  },
  {
    slug: "can-fd-vs-ethernet-zonal-bms",
    title: "CAN FD vs Ethernet for Zonal BMS Architectures",
    excerpt: "Latency, determinism, cybersecurity surface, and update strategy tradeoffs.",
    category: "deep-dive",
    tags: ["CAN-FD", "Automotive-Ethernet", "zonal-architecture", "latency", "cybersecurity"],
    date: "2026-03-01T09:00:00.000Z",
    readingTime: 9,
    focus: "Bandwidth is only one factor; determinism, diagnosability, and secure boot/update chains govern architecture viability.",
    method: "Message latency and bus-load stress tests are compared against update payload size and fault-isolation requirements.",
    takeaway: "Hybrid architectures are increasingly preferred: deterministic low-level control on CAN FD with high-volume diagnostics over Ethernet.",
  },
  {
    slug: "thermal-runaway-detection-feature-engineering",
    title: "Thermal Runaway Detection: Feature Engineering for Early Warning",
    excerpt: "Delta-T, dV/dt, and impedance trend fusion for faster anomaly detection.",
    category: "deep-dive",
    tags: ["thermal-runaway", "anomaly-detection", "dVdt", "diagnostics", "safety"],
    date: "2026-02-24T09:00:00.000Z",
    readingTime: 11,
    focus: "Single-signal thresholding is fragile; robust detection benefits from multi-sensor feature fusion and context-aware gating.",
    method: "Feature candidates are scored against false-positive and missed-detection rates on abuse and normal-operation datasets.",
    takeaway: "Early detection quality improves when electro-thermal trend features are fused with pack-state context and sensor-health checks.",
  },
  {
    slug: "winter-range-loss-heat-pump-vs-ptc",
    title: "Winter Range Loss: Heat Pump vs PTC Heating Benchmarks",
    excerpt: "Measured consumption impact across ambient temperatures from 0 C to -15 C.",
    category: "benchmark",
    tags: ["winter-range", "heat-pump", "PTC", "efficiency", "benchmark"],
    date: "2026-03-23T09:00:00.000Z",
    readingTime: 8,
    focus: "Heat-pump advantage depends on ambient temperature, compressor map, and cabin load profile.",
    method: "Paired-route tests are run with matched speed and occupancy, then normalized in Wh/km and auxiliary load share.",
    takeaway: "Use climate-binned efficiency maps when forecasting winter range; one global correction factor is not sufficient.",
  },
  {
    slug: "dc-fast-charge-taper-curves-10-80",
    title: "DC Fast-Charge Taper Curves from 10% to 80% SOC",
    excerpt: "A comparative test of charge acceptance and thermal limits across mainstream EV packs.",
    category: "benchmark",
    tags: ["fast-charging", "taper-curve", "SOC-window", "preconditioning", "charge-acceptance"],
    date: "2026-03-17T09:00:00.000Z",
    readingTime: 9,
    focus: "Average power across the charging window is more decision-useful than peak charger power claims.",
    method: "Charging sessions are instrumented from 10% to 80% SOC, recording instantaneous power, pack temperature, and taper onset.",
    takeaway: "Plan long-distance charging around energy-added-per-minute curves rather than nameplate charger rating.",
  },
  {
    slug: "regen-efficiency-urban-descents",
    title: "Regenerative Braking Efficiency on Urban Descents",
    excerpt: "How inverter limits, SOC ceiling, and temperature cap practical recovery.",
    category: "benchmark",
    tags: ["regen", "inverter", "SOC-limit", "energy-recovery", "drive-cycle"],
    date: "2026-03-11T09:00:00.000Z",
    readingTime: 8,
    focus: "Recoverable energy is constrained by battery acceptance limits and inverter current ceilings, not only road grade.",
    method: "Descending-route cycles are repeated at controlled entry SOC and temperature to separate mechanical and electrochemical constraints.",
    takeaway: "Regen calibration should adapt to SOC and thermal state in real time to maximize usable recovery without drivability penalties.",
  },
  {
    slug: "hvac-load-sensitivity-wh-per-km",
    title: "HVAC Load Sensitivity in Wh/km Across Mixed Cycles",
    excerpt: "Separating drivetrain and auxiliary loads using repeated A/B route testing.",
    category: "benchmark",
    tags: ["HVAC", "Wh-per-km", "auxiliary-load", "range-model", "A-B-testing"],
    date: "2026-03-05T09:00:00.000Z",
    readingTime: 7,
    focus: "Auxiliary loads can dominate efficiency variance in city cycles where drivetrain load is relatively low.",
    method: "A/B tests isolate HVAC settings while keeping route, speed band, and traffic envelope as consistent as practical.",
    takeaway: "Range prediction models should include explicit auxiliary-load submodels, not a fixed percentage penalty.",
  },
  {
    slug: "battery-preconditioning-time-benefit",
    title: "Battery Preconditioning: Time-to-Charge Benefit Quantification",
    excerpt: "How much preconditioning helps at different ambient temperatures and charger classes.",
    category: "benchmark",
    tags: ["preconditioning", "charging-time", "ambient-temperature", "trip-optimization", "thermal-control"],
    date: "2026-02-28T09:00:00.000Z",
    readingTime: 8,
    focus: "Preconditioning shifts charging curves upward in cold weather but consumes energy before arrival.",
    method: "Net trip-time impact is computed from preheat energy, arrival SOC, and measured charging-power trajectory.",
    takeaway: "Enable preconditioning when charger dwell reduction exceeds preheat energy penalty under expected ambient conditions.",
  },
  {
    slug: "model-y-rwd-long-term-efficiency-review",
    title: "Model Y RWD Long-Term Efficiency Review",
    excerpt: "A year-scale look at degradation, real range, and charging consistency in mixed climates.",
    category: "review",
    tags: ["Model-Y", "long-term", "degradation", "real-range", "efficiency"],
    date: "2026-03-21T09:00:00.000Z",
    readingTime: 11,
    focus: "Long-horizon performance should be judged by seasonal-normalized consumption and charging repeatability, not isolated trips.",
    method: "Year-scale telemetry is segmented by temperature bin, route profile, and charger class to reduce confounding effects.",
    takeaway: "Use normalized metrics and confidence bands before inferring true capacity or efficiency drift.",
  },
  {
    slug: "ioniq-5-800v-charging-behavior-review",
    title: "Ioniq 5 800 V Charging Behavior Review",
    excerpt: "High-power charging repeatability, pack heating response, and taper behavior.",
    category: "review",
    tags: ["Ioniq-5", "800V", "charging", "thermal", "long-trip"],
    date: "2026-03-15T09:00:00.000Z",
    readingTime: 10,
    focus: "The value of 800 V architecture appears most strongly in sustained high-power windows and reduced taper onset.",
    method: "Multi-stop fast-charge sessions compare effective average power and thermal behavior over repeat trip conditions.",
    takeaway: "Evaluate charging architecture using integrated energy-per-minute over trip windows, not one-session peak values.",
  },
  {
    slug: "eqs-suv-energy-consumption-aero-vs-mass",
    title: "EQS SUV Consumption: Aerodynamics vs Mass Contribution",
    excerpt: "A physics-based breakdown of highway and urban consumption drivers.",
    category: "review",
    tags: ["EQS-SUV", "aerodynamics", "vehicle-mass", "consumption", "highway"],
    date: "2026-03-07T09:00:00.000Z",
    readingTime: 9,
    focus: "Highway consumption is typically drag-dominant, while urban duty shifts importance toward mass and stop-go efficiency.",
    method: "Segmented route analysis separates high-speed drag loads from low-speed acceleration and auxiliary contributions.",
    takeaway: "Platform-level optimization should target aerodynamic drag first for highway use and mass reduction for city-heavy duty.",
  },
  {
    slug: "bmw-i4-edrive40-range-consistency-review",
    title: "BMW i4 eDrive40: Range Consistency Under Temperature Swings",
    excerpt: "Consistency metrics across mild and cold climates using identical route profiles.",
    category: "review",
    tags: ["BMW-i4", "range-consistency", "temperature", "conditioning", "real-world"],
    date: "2026-03-02T09:00:00.000Z",
    readingTime: 8,
    focus: "Range consistency depends on preconditioning strategy, thermal control policy, and route-speed distribution.",
    method: "Repeat-route runs are grouped by ambient bins and HVAC mode to quantify variance beyond driver input.",
    takeaway: "For planning confidence, report percentile-based range instead of single-point headline figures.",
  },
  {
    slug: "ford-f150-lightning-towing-range-review",
    title: "F-150 Lightning Towing Range Review",
    excerpt: "Trailer drag effects, speed sensitivity, and charging-stop strategy implications.",
    category: "review",
    tags: ["F-150-Lightning", "towing", "aero-drag", "range-loss", "route-planning"],
    date: "2026-02-25T09:00:00.000Z",
    readingTime: 10,
    focus: "Towing range is strongly coupled to trailer frontal area and cruise speed, often more than payload mass alone.",
    method: "Controlled towing loops capture energy use versus speed to derive practical stop-planning envelopes.",
    takeaway: "Tow-route optimization should prioritize speed discipline and charger spacing with trailer-access constraints.",
  },
  {
    slug: "un-ece-r100-pack-level-safety-requirements",
    title: "UN ECE R100: Pack-Level Safety Requirements Explained",
    excerpt: "A practical reading of insulation, isolation, and abuse test expectations.",
    category: "standards",
    tags: ["UNECE-R100", "type-approval", "isolation", "safety", "compliance"],
    date: "2026-03-19T09:00:00.000Z",
    readingTime: 12,
    focus: "Isolation monitoring, protection coordination, and abuse test evidence are central to approval readiness.",
    method: "Requirement clauses are mapped to pack architecture artifacts, validation plans, and traceable test outcomes.",
    takeaway: "Compliance programs succeed when regulatory requirements are converted into early design controls, not end-stage documentation only.",
  },
  {
    slug: "ul-2580-abuse-test-matrix-deep-dive",
    title: "UL 2580 Abuse Test Matrix: What Teams Miss",
    excerpt: "Interpreting crush, thermal, and overcharge tests with design-stage checkpoints.",
    category: "standards",
    tags: ["UL2580", "abuse-testing", "overcharge", "crush-test", "verification"],
    date: "2026-03-13T09:00:00.000Z",
    readingTime: 11,
    focus: "Late failures often arise from incomplete mapping between abuse scenarios and protection logic assumptions.",
    method: "Test matrices are linked to subsystem FMEA items and pre-compliance gate reviews before full certification campaigns.",
    takeaway: "Treat abuse testing as an iterative engineering loop with early failure-learning cycles, not a one-time compliance event.",
  },
  {
    slug: "iso-6469-electric-road-vehicle-safety",
    title: "ISO 6469 for Electric Road Vehicle Safety Systems",
    excerpt: "Requirements mapping for electrical safety and operational protection functions.",
    category: "standards",
    tags: ["ISO6469", "electrical-safety", "HV-system", "protection", "requirements"],
    date: "2026-03-06T09:00:00.000Z",
    readingTime: 10,
    focus: "Electrical safety requires coordinated controls across HV isolation, contactor strategy, and fault annunciation.",
    method: "The standard clauses are translated into system-level safety requirements and verifiable test evidence.",
    takeaway: "Build a requirements-to-test traceability matrix early to avoid integration gaps at vehicle validation stage.",
  },
  {
    slug: "iec-61851-charging-interface-practical-guide",
    title: "IEC 61851 Charging Interface: Practical Implementation Guide",
    excerpt: "Control pilot behavior, state transitions, and interoperability test cases.",
    category: "standards",
    tags: ["IEC61851", "EVSE", "control-pilot", "interoperability", "charging-standard"],
    date: "2026-03-01T09:00:00.000Z",
    readingTime: 9,
    focus: "Many field issues trace back to pilot-state handling, grounding assumptions, and timeout logic.",
    method: "Signal-level logging is aligned with state-machine transitions to isolate interoperability faults across EVSE vendors.",
    takeaway: "Validation should include adverse timing and state-transition edge cases, not only nominal charging sessions.",
  },
  {
    slug: "iso-15118-plug-charge-cybersecurity-basics",
    title: "ISO 15118 Plug and Charge: Security and PKI Basics",
    excerpt: "Certificate flow, trust anchors, and operational concerns for scalable deployment.",
    category: "standards",
    tags: ["ISO15118", "plug-and-charge", "PKI", "cybersecurity", "certificates"],
    date: "2026-02-23T09:00:00.000Z",
    readingTime: 11,
    focus: "Plug and Charge reliability depends on robust certificate lifecycle management, revocation strategy, and backend integration.",
    method: "Protocol flow is evaluated from contract certificate provisioning through session authentication and renewal handling.",
    takeaway: "Successful deployment requires joint ownership across EV, EVSE, and backend PKI operations from day one.",
  },
];

export const EDITORIAL_SEED_POSTS: PostRecord[] = seed.map((item, index) => ({
  id: `seed-${index + 1}`,
  created_at: item.date,
  updated_at: item.date,
  title: item.title,
  slug: item.slug,
  content: contentFor(item),
  excerpt: item.excerpt,
  cover_url: coverFor(item, index),
  category: item.category,
  tags: item.tags,
  published: true,
  reading_time: item.readingTime,
  tier: 'intermediate',
  pullquote: null,
  stats: null,
  references: refsFor(item),
}));
