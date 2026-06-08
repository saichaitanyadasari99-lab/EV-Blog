import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.evpulse.co.in";

export const metadata: Metadata = {
  title: "EV Standards Reference — India & Global",
  description:
    "Comprehensive reference of EV standards: Indian AIS/IS codes, IEC, ISO, UN ECE regulations, SAE J-standards, and charging protocol standards with latest amendments and scope.",
  alternates: { canonical: `${baseUrl}/standards` },
  openGraph: {
    title: "EV Standards Reference — EVPulse",
    description:
      "All major EV standards — AIS-038, AIS-156, IEC 62660, ISO 26262, UN ECE R100, SAE J1772 and more. Latest amendments, scope, and applicability at a glance.",
  },
};

type Standard = {
  id: string;
  title: string;
  scope: string;
  latest: string;
  status: "Active" | "Withdrawn" | "Draft" | "Under Revision";
  applicability: string[];
};

type Section = {
  group: string;
  icon: string;
  color: string;
  description: string;
  standards: Standard[];
};

const SECTIONS: Section[] = [
  {
    group: "Indian Standards (AIS / IS / BIS)",
    icon: "🇮🇳",
    color: "brand",
    description:
      "Automotive Industry Standards (AIS) by CMVR-TSC and Bureau of Indian Standards (IS/BIS) codes governing EVs sold in India.",
    standards: [
      {
        id: "AIS-038 Rev 5",
        title: "Electric/Hybrid Vehicle — Battery Operated Vehicle Safety",
        scope:
          "Safety requirements for electric power train of L, M and N category vehicles. Covers electrical safety, isolation resistance, water ingress (IP), mechanical integrity, and battery system requirements including thermal runaway notification.",
        latest: "Rev 5 (2021)",
        status: "Active",
        applicability: ["2W", "3W", "4W", "EV Battery"],
      },
      {
        id: "AIS-048 Rev 3",
        title: "Safety Requirements for Electric Power Train Vehicles",
        scope:
          "Functional safety of high-voltage systems: insulation, overvoltage/overcurrent protection, disconnect in crash, and protection against electric shock. Mandatory for type approval.",
        latest: "Rev 3 (2022)",
        status: "Active",
        applicability: ["4W", "Bus", "Truck"],
      },
      {
        id: "AIS-049",
        title: "Energy Consumption Measurement — BEV / PHEV",
        scope:
          "Test procedure and calculation method for measuring energy consumption (kWh/100km) and range (km) on Indian MIDC cycle and WLTC. Required for FAME-II subsidy eligibility.",
        latest: "Amendment 1 (2022)",
        status: "Active",
        applicability: ["2W", "3W", "4W", "Testing"],
      },
      {
        id: "AIS-052",
        title: "Type Approval of Electric / Hybrid Vehicles",
        scope:
          "Type approval procedure for M & N category EVs. Cross-references AIS-038, AIS-049, AIS-123, and CMVR rules for homologation.",
        latest: "Rev 2 (2022)",
        status: "Active",
        applicability: ["4W", "Bus", "Type Approval"],
      },
      {
        id: "AIS-072 Part 1",
        title: "EV Charging Infrastructure — AC Charging",
        scope:
          "Requirements for on-board chargers, AC supply equipment (EVSE), and connectors for single-phase (3.3 kW, 7.4 kW) and three-phase (11 kW, 22 kW) AC charging in India.",
        latest: "Rev 1 (2022)",
        status: "Active",
        applicability: ["Charging", "EVSE", "OEM"],
      },
      {
        id: "AIS-072 Part 2",
        title: "EV Charging Infrastructure — DC Fast Charging",
        scope:
          "Requirements for off-board DC chargers (Bharat DC-001 at 15 kW and CCS2/CHAdeMO protocols). Defines Type 1, Type 2, CCS-2 and CHAdeMO connector requirements for India.",
        latest: "Rev 1 (2022)",
        status: "Active",
        applicability: ["Charging", "DC Fast Charge", "EVSE"],
      },
      {
        id: "AIS-123 Rev 2",
        title: "EV Battery Pack & System — Performance & Reliability",
        scope:
          "Capacity, energy, power, cycle life, and calendar life testing of traction battery packs and systems for M and N category vehicles. India's equivalent of IEC 62660-2.",
        latest: "Rev 2 (2023)",
        status: "Active",
        applicability: ["EV Battery", "4W", "Testing"],
      },
      {
        id: "AIS-156 / Phase 2",
        title: "Advanced Chemistry Cell (ACC) Battery — Safety",
        scope:
          "Safety and performance requirements for ACC-based battery packs used in EVs. Covers thermal propagation, abuse testing (overcharge, short circuit, crush, nail penetration), and fire safety. Phase 2 adds thermal runaway warning requirements.",
        latest: "Phase 2 (Effective Oct 2023)",
        status: "Active",
        applicability: ["EV Battery", "2W", "3W", "4W", "Safety"],
      },
      {
        id: "IS 17017 Part 1",
        title: "EV Charging Stations — General Requirements",
        scope:
          "BIS standard for public and semi-public EV charging station infrastructure: electrical safety, earthing, metering, payment interface, and site requirements.",
        latest: "2018 (under revision)",
        status: "Under Revision",
        applicability: ["Charging", "EVSE", "CPO"],
      },
      {
        id: "IS 16364",
        title: "Battery Packs for Electric Vehicles — Safety",
        scope:
          "Safety requirements for Li-ion battery packs in EVs covering mechanical, electrical, and thermal tests. Harmonised with IEC 62133 series.",
        latest: "2015 (Amendment 1 in 2019)",
        status: "Active",
        applicability: ["EV Battery", "2W", "Safety"],
      },
    ],
  },
  {
    group: "IEC Standards",
    icon: "⚡",
    color: "yellow",
    description:
      "International Electrotechnical Commission standards — globally adopted for EV batteries, charging infrastructure, and electrical safety.",
    standards: [
      {
        id: "IEC 62133-2",
        title: "Safety Requirements for Portable Li-Ion Cells & Batteries",
        scope:
          "Safety testing for secondary lithium cells and batteries in portable applications: mechanical, electrical, and environmental tests. Part 2 covers lithium systems specifically.",
        latest: "Edition 2 (2017)",
        status: "Active",
        applicability: ["Cell", "Pack", "Safety"],
      },
      {
        id: "IEC 62619",
        title: "Secondary Lithium Cells & Batteries — Safety for Stationary Applications",
        scope:
          "Safety requirements and tests for lithium cells in stationary (ESS) applications. Widely referenced for EV fleet depot storage systems.",
        latest: "Edition 1 (2017)",
        status: "Active",
        applicability: ["ESS", "Fleet", "Safety"],
      },
      {
        id: "IEC 62660-1",
        title: "Secondary Li-Ion Cells for EVs — Part 1: Performance",
        scope:
          "Characterisation and performance testing for cylindrical and prismatic Li-ion cells in EVs: capacity, rate capability, temperature range, and self-discharge.",
        latest: "Edition 2 (2018)",
        status: "Active",
        applicability: ["Cell", "Testing"],
      },
      {
        id: "IEC 62660-2",
        title: "Secondary Li-Ion Cells for EVs — Part 2: Reliability & Abuse",
        scope:
          "Cycle life, calendar life, and abuse testing (overcharge, over-discharge, external short, thermal shock) for EV cells. Baseline for BMS protection algorithm design.",
        latest: "Edition 2 (2018)",
        status: "Active",
        applicability: ["Cell", "BMS", "Testing"],
      },
      {
        id: "IEC 62660-3",
        title: "Secondary Li-Ion Cells for EVs — Part 3: Safety",
        scope:
          "Cell-level safety testing under abnormal conditions. Includes nail penetration, crush, overtemperature, and propagation risk assessment.",
        latest: "Edition 1 (2016)",
        status: "Active",
        applicability: ["Cell", "Safety"],
      },
      {
        id: "IEC 61851-1",
        title: "EV Conductive Charging — Part 1: General Requirements",
        scope:
          "Foundational standard for EV conductive charging. Defines Mode 1, 2, 3, and 4 charging modes; AC and DC supply equipment requirements; safety interlocks; pilot signal (CP/PP lines).",
        latest: "Edition 3 (2017)",
        status: "Active",
        applicability: ["Charging", "EVSE", "OBC"],
      },
      {
        id: "IEC 61851-21-2",
        title: "EV Conductive Charging — EMC Requirements for Off-Vehicle Charger",
        scope:
          "EMC requirements (conducted and radiated emissions, immunity) for DC off-board chargers (Modes 3 and 4). Critical for fast charger certification.",
        latest: "Edition 1 (2018)",
        status: "Active",
        applicability: ["DC Fast Charge", "EMC"],
      },
      {
        id: "IEC 62196-1",
        title: "Plugs, Sockets, Connectors — Part 1: General Requirements",
        scope:
          "General requirements for AC and DC conductive charging connectors: current ratings, temperature rise, contact resistance, mechanical endurance, and IP ratings.",
        latest: "Edition 3 (2014 + AMD1:2020)",
        status: "Active",
        applicability: ["Charging", "Connector"],
      },
      {
        id: "IEC 62196-2",
        title: "EV Connectors — Part 2: Dimensional Requirements (Type 1 & 2)",
        scope:
          "Dimensional and interface requirements for AC charging plugs: Type 1 (SAE J1772 single-phase), Type 2 (Mennekes, used in India/EU), and Type 3. Type 2 is India's mandated AC connector.",
        latest: "Edition 2 (2016)",
        status: "Active",
        applicability: ["Charging", "Connector", "India"],
      },
      {
        id: "IEC 62196-3",
        title: "EV Connectors — Part 3: CCS (DC Combo)",
        scope:
          "Dimensional specifications for DC combo connectors: CCS-1 (SAE), CCS-2 (European/India). CCS-2 is India's mandated DC fast charge connector as per AIS-138 / MoP advisory.",
        latest: "Edition 1 (2014 + AMD1:2018)",
        status: "Active",
        applicability: ["Charging", "DC Fast Charge", "India"],
      },
      {
        id: "IEC 63110",
        title: "Management of Used Batteries from EVs",
        scope:
          "Protocol for second-life battery assessment, repurposing for ESS, and end-of-life recycling. Relevant to India's Battery Waste Management Rules 2022.",
        latest: "Part 1 (2021), Part 2 (2021)",
        status: "Active",
        applicability: ["Battery Recycling", "Second Life"],
      },
    ],
  },
  {
    group: "ISO Standards",
    icon: "🌐",
    color: "purple",
    description:
      "International Organisation for Standardisation standards covering functional safety, battery testing, vehicle-to-grid communication, and environmental durability.",
    standards: [
      {
        id: "ISO 6469-1",
        title: "EVs Safety Specifications — Part 1: On-Board Energy Storage",
        scope:
          "Safety requirements for the on-board rechargeable energy storage system (REESS): protection against overcharge, thermal events, gas emissions, and mechanical integrity.",
        latest: "Edition 4 (2019)",
        status: "Active",
        applicability: ["EV Battery", "Pack", "Safety"],
      },
      {
        id: "ISO 6469-3",
        title: "EVs Safety Specifications — Part 3: Electrical Safety",
        scope:
          "Protection against electric shock from the HV system: galvanic isolation, IP requirements, service disconnect, post-crash isolation resistance (≥100 Ω/V).",
        latest: "Edition 3 (2021)",
        status: "Active",
        applicability: ["HV System", "Safety", "4W"],
      },
      {
        id: "ISO 12405-4",
        title: "Li-Ion Battery Pack & System — Part 4: Performance",
        scope:
          "Performance test procedures for battery packs and systems in EVs: capacity, energy, power capability, round-trip efficiency, and cold/hot temperature behaviour.",
        latest: "Edition 1 (2018)",
        status: "Active",
        applicability: ["Pack", "Testing"],
      },
      {
        id: "ISO 15118-1",
        title: "V2G Communication Interface — Part 1: General Information",
        scope:
          "Architecture and use cases for vehicle-to-grid (V2G) and vehicle-to-home (V2H) communication over PLC and wireless. Foundation for smart charging, V2G, and ISO 15118-20 (BPT).",
        latest: "Edition 2 (2019)",
        status: "Active",
        applicability: ["V2G", "Smart Charging", "Charging"],
      },
      {
        id: "ISO 15118-20",
        title: "V2G Communication — Part 20: 2nd Generation (AC/DC Bidirectional)",
        scope:
          "Extends ISO 15118-2 for bidirectional power transfer (BPT), wireless power transfer (WPT), and AUTOSAR-based security. Enables V2G, V2H, V2L use cases.",
        latest: "Edition 1 (2022)",
        status: "Active",
        applicability: ["V2G", "V2H", "V2L", "Smart Charging"],
      },
      {
        id: "ISO 17409",
        title: "Connection Means for Conductive Charging of Electrically Propelled Vehicles",
        scope:
          "System-level requirements for vehicle-side conductive charging hardware: inlet connector, interlock, on-board charger interface, and vehicle readiness signal.",
        latest: "Edition 2 (2020)",
        status: "Active",
        applicability: ["Charging", "OBC", "Connector"],
      },
      {
        id: "ISO 26262",
        title: "Functional Safety — Road Vehicles",
        scope:
          "Safety lifecycle for E/E systems in road vehicles. Defines ASIL levels (A–D) for hazard classification and safety goals. BMS, HV contactor control, and thermal runaway detection systems typically target ASIL B/C.",
        latest: "Edition 2 (2018) — 12 parts",
        status: "Active",
        applicability: ["BMS", "Safety", "ASIL", "4W"],
      },
      {
        id: "ISO 21782",
        title: "Electric Vehicle Energy Performance Tests",
        scope:
          "Standardised test procedures for EV performance: acceleration, top speed, range, energy consumption on standardised drive cycles including WLTP, NEDC, and Indian MIDC.",
        latest: "Parts 1–4 (2022–2023)",
        status: "Active",
        applicability: ["Performance", "Testing", "Range"],
      },
      {
        id: "ISO 16750",
        title: "Environmental Conditions for Electrical/Electronic Equipment in Road Vehicles",
        scope:
          "Environmental stress tests for automotive E/E components: temperature cycling, humidity, vibration, salt spray, dust ingress. Required for BMS hardware qualification.",
        latest: "Parts 1–5, Edition 2–4",
        status: "Active",
        applicability: ["BMS", "Electronics", "Qualification"],
      },
      {
        id: "ISO/PAS 19363",
        title: "Wireless Power Transfer for EVs — Safety and Interoperability",
        scope:
          "Safety and interoperability requirements for wireless inductive charging systems. Basis for SAE J2954 and future OEM wireless charging specifications.",
        latest: "Edition 1 (2017)",
        status: "Active",
        applicability: ["Wireless Charging", "Safety"],
      },
    ],
  },
  {
    group: "UN ECE Regulations",
    icon: "🏛",
    color: "orange",
    description:
      "United Nations Economic Commission for Europe vehicle regulations. UN ECE R100 is the key global homologation standard for BEVs.",
    standards: [
      {
        id: "UN ECE R100 Rev 3",
        title: "Approval of Vehicles with Respect to Specific Requirements for the Electric Power Train",
        scope:
          "Homologation regulation for battery-powered vehicles. Part I: electrical safety (isolation resistance, IP, service disconnect). Part II: battery pack safety — overcharge, over-discharge, external short, crush, thermal shock, vibration, fire resistance, and thermal runaway communication. India aligns type approval to AIS-038 which harmonises with R100 Rev 3.",
        latest: "Revision 3 (2022) — Supplement 3",
        status: "Active",
        applicability: ["4W", "Safety", "Type Approval", "India"],
      },
      {
        id: "UN 38.3",
        title: "Transport of Dangerous Goods — Lithium Batteries Testing",
        scope:
          "Mandatory pre-shipment testing for Li-ion and Li-metal batteries transported by air, sea, or land. Tests: altitude simulation, thermal, vibration, shock, external short, impact/crush, overcharge, forced discharge. Required for all cells sold globally.",
        latest: "Amendment 38 (7th revised edition, 2019)",
        status: "Active",
        applicability: ["Cell", "Pack", "Logistics", "Export"],
      },
      {
        id: "UN ECE R136",
        title: "Approval of L-Category Vehicles with Respect to the Electric Power Train",
        scope:
          "Equivalent of R100 for L-category (2W, 3W) EVs. Covers electrical safety, battery safety, IP ratings, and isolation resistance for electric two-wheelers and three-wheelers — directly applicable to Indian EV 2W/3W type approval.",
        latest: "Revision 1 (2022)",
        status: "Active",
        applicability: ["2W", "3W", "Safety", "India"],
      },
      {
        id: "UN ECE R10 Rev 5",
        title: "EMC Requirements for Vehicles, Components, and Separate Technical Units",
        scope:
          "EMC approval regulation for vehicles and EV charging equipment. Covers conducted and radiated emissions from the vehicle and charging system. Relevant for EV inverters, DC-DC converters, and on-board chargers.",
        latest: "Revision 5 (2014) + Amend 3 (2022)",
        status: "Active",
        applicability: ["EMC", "OBC", "Inverter"],
      },
    ],
  },
  {
    group: "SAE Standards (USA / Global)",
    icon: "🚗",
    color: "green",
    description:
      "SAE International (Society of Automotive Engineers) standards widely adopted globally for EV charging connectors, battery abuse testing, and system design.",
    standards: [
      {
        id: "SAE J1772",
        title: "EV and PHEV Conductive Charge Coupler",
        scope:
          "Defines the North American Type 1 AC charging connector (Level 1 at 120V/16A, Level 2 at 240V/80A) and pilot signal (CP/PP) protocol. Also defines CCS-1 DC combo connector integrated with Type 1 for fast charging.",
        latest: "Rev 2017-10",
        status: "Active",
        applicability: ["Charging", "Connector", "USA"],
      },
      {
        id: "SAE J2464",
        title: "EV and HEV Rechargeable Energy Storage System (RESS) Safety and Abuse Testing",
        scope:
          "Abuse test matrix for battery packs: mechanical (crush, penetration, immersion), electrical (overcharge, over-discharge, external short), and thermal (oven exposure, fire) tests. Reference for AIS-156 and IEC 62660-3.",
        latest: "Rev 2009-11",
        status: "Active",
        applicability: ["Pack", "Safety", "Abuse Testing"],
      },
      {
        id: "SAE J2954",
        title: "Wireless Power Transfer for Light-Duty Plug-In / BEVs",
        scope:
          "Interoperability and safety requirements for wireless inductive charging at power classes WPT1 (3.7 kW), WPT2 (7.7 kW), WPT3 (11.1 kW) and WPT4 (22 kW). Defines alignment tolerance, efficiency requirements, and EMF exposure limits.",
        latest: "Rev A (2020)",
        status: "Active",
        applicability: ["Wireless Charging", "Interoperability"],
      },
      {
        id: "SAE J3068",
        title: "Electric Vehicle Power Transfer Using a Three-Phase Capable Coupler",
        scope:
          "Three-phase AC charging connector (Type 2 equivalent) and control pilot protocol for North America — enables 19.2 kW and 80 kW three-phase AC charging. Emerging adoption in commercial EVs.",
        latest: "Rev 2018-11",
        status: "Active",
        applicability: ["Charging", "Connector", "3-Phase"],
      },
      {
        id: "SAE J2293",
        title: "Energy Transfer System for EVs",
        scope:
          "System architecture and requirements for EV energy transfer: power quality, communication, and safety interlocks between EVSE and on-board charger. Foundation document for Level 1/2 charging systems.",
        latest: "Parts 1 & 2 (Rev 2008)",
        status: "Active",
        applicability: ["Charging", "OBC", "System Design"],
      },
    ],
  },
  {
    group: "Charging Protocols & Industry Specs",
    icon: "🔌",
    color: "brand",
    description:
      "Industry-defined charging protocols and interoperability specifications used by charge point operators (CPOs) and EV manufacturers.",
    standards: [
      {
        id: "CCS (Type 2 / CCS-2)",
        title: "Combined Charging System — IEC 62196-3 Type 2 Combo",
        scope:
          "Combined AC+DC connector integrating Type 2 AC pins with two additional DC pins. Supports AC up to 43 kW and DC up to 350 kW. India mandated CCS-2 as the standard DC fast charging connector per MoP advisory (2019). Power and communication protocol defined by CharIN consortium.",
        latest: "CharIN CCS Spec v1.3 (2023)",
        status: "Active",
        applicability: ["DC Fast Charge", "India", "4W"],
      },
      {
        id: "CHAdeMO 3.0",
        title: "CHAdeMO DC Fast Charging Protocol",
        scope:
          "Japanese DC fast charging connector and communication protocol. Versions 1.x: up to 62.5 kW. Version 2.0: 400 kW. Version 3.0 (ChaoJi): up to 900 kW with bidirectional V2G. Supported by Toyota, Nissan, and some Chinese OEMs. AIS-072 Part 2 includes CHAdeMO as an accepted DC connector in India.",
        latest: "CHAdeMO 3.0 / ChaoJi (2021)",
        status: "Active",
        applicability: ["DC Fast Charge", "V2G", "Japan"],
      },
      {
        id: "GB/T 20234",
        title: "Connection Device for EV Conductive Charging (China Standard)",
        scope:
          "Chinese national standard for AC (GB/T 20234.2) and DC (GB/T 20234.3) charging connectors. GB/T DC is China's mandated fast-charge connector. Increasingly relevant as Chinese EVs (BYD, SAIC-MG, TATA tie-ups) enter India.",
        latest: "GB/T 20234.3-2015 + AMD1:2021",
        status: "Active",
        applicability: ["DC Fast Charge", "China", "India"],
      },
      {
        id: "OCPP 2.0.1",
        title: "Open Charge Point Protocol",
        scope:
          "Communication protocol between charge point hardware (CP) and charge management system (CSMS / back-end). OCPP 2.0.1 adds smart charging profiles, ISO 15118 Plug & Charge integration, device management, and security. Mandatory for FAME-II compliant public chargers in India.",
        latest: "OCPP 2.0.1 (2020)",
        status: "Active",
        applicability: ["Charging", "CPO", "Smart Charging", "India"],
      },
      {
        id: "OCPI 2.2.1",
        title: "Open Charge Point Interface (Roaming Protocol)",
        scope:
          "REST-based protocol enabling EV charging roaming across multiple CPO networks. Allows drivers to authenticate and pay at any OCPI-enabled charge point. Used by India's ChargeGrid, TATA Power EZ Charge, ChargeZone for roaming.",
        latest: "OCPI 2.2.1 (2021)",
        status: "Active",
        applicability: ["Charging", "CPO", "Roaming"],
      },
      {
        id: "ISO 15118-2 / Plug & Charge",
        title: "Plug & Charge (PnC) — Vehicle-to-SECC Communication",
        scope:
          "Enables automatic authentication and billing without RFID or app — the car identifies itself to the charger over PLC (HomePlug GreenPHY) and authorises charging via PKI certificates. Deployed by Porsche, BMW, and VW. India adoption expected post-2025.",
        latest: "Edition 2 (2014) + corrigendum",
        status: "Active",
        applicability: ["Charging", "Smart Charging", "V2G"],
      },
    ],
  },
  {
    group: "Indian Policy & Regulations",
    icon: "📋",
    color: "amber",
    description:
      "Key Government of India notifications, policies, and CMVR rules governing EV manufacturing, safety, subsidies, and charging infrastructure.",
    standards: [
      {
        id: "CMVR Rule 126",
        title: "Central Motor Vehicles Rules — EV Type Approval",
        scope:
          "Mandates type approval for all EVs sold in India per AIS-038 (safety), AIS-049 (energy), AIS-123 (battery), and AIS-156 (ACC battery safety). FAME-II eligibility requires AIS-049 range certification.",
        latest: "Amendment GSR 719(E) — 2022",
        status: "Active",
        applicability: ["Type Approval", "India", "2W", "3W", "4W"],
      },
      {
        id: "PM E-DRIVE Scheme",
        title: "PM Electric Drive Revolution in Innovative Vehicle Enhancement",
        scope:
          "Successor to FAME-II. ₹10,900 Cr scheme (2024–2026) for EV subsidies across 2W (₹10,000/kWh, cap ₹40,000), e-buses, and charging infrastructure. Replaces FAME-II Phase-II for private EVs.",
        latest: "Notified Sept 2024",
        status: "Active",
        applicability: ["Subsidy", "India", "2W", "Bus"],
      },
      {
        id: "Battery Waste Management Rules 2022",
        title: "Battery Waste Management Rules — EPR for EV Batteries",
        scope:
          "Extended Producer Responsibility (EPR) framework requiring EV manufacturers and importers to ensure collection and recycling of battery waste. Recyclers must hold BIS certification. Targets: 70% collection by 2026.",
        latest: "MoEFCC Notification (Aug 2022)",
        status: "Active",
        applicability: ["Battery Recycling", "EPR", "India"],
      },
      {
        id: "MoP Charging Infrastructure Guidelines",
        title: "Ministry of Power — EV Charging Infrastructure Guidelines",
        scope:
          "Mandates CCS-2 as India's DC fast-charge standard; Bharat AC-001 (15A domestic socket), Bharat AC-001 Type-2 (32A 3-phase), and Bharat DC-001 (15 kW) as public charging standards. Latest revision adds V2G readiness requirements.",
        latest: "Revised Consolidated Guidelines (Jan 2022)",
        status: "Active",
        applicability: ["Charging", "EVSE", "CPO", "India"],
      },
      {
        id: "AIS-138 Part 2",
        title: "Requirements for EV Charging Stations — DC Charging",
        scope:
          "Technical requirements for DC public charging stations in India: electrical protection, metering accuracy, communication interfaces (OCPP), cyber security, and physical accessibility. Specifies CCS-2 and CHAdeMO connectors.",
        latest: "Part 2 (2020)",
        status: "Active",
        applicability: ["DC Fast Charge", "EVSE", "India"],
      },
    ],
  },
];

const COLOR_MAP: Record<string, string> = {
  brand:  "var(--brand)",
  yellow: "#f0b429",
  purple: "#9b6dff",
  orange: "#ff6b35",
  green:  "#00d68f",
  amber:  "#ffd60a",
};

const STATUS_STYLE: Record<Standard["status"], { bg: string; color: string }> = {
  Active:         { bg: "rgba(0,214,143,0.12)",  color: "#00d68f" },
  Withdrawn:      { bg: "rgba(255,69,69,0.12)",  color: "#ff4545" },
  Draft:          { bg: "rgba(255,214,10,0.12)", color: "#ffd60a" },
  "Under Revision":{ bg: "rgba(155,109,255,0.12)", color: "#9b6dff" },
};

export default function StandardsPage() {
  return (
    <main className="page-main wrapper">
      {/* Hero */}
      <section className="page-hero page-hero-center">
        <div className="hero-badge">REFERENCE</div>
        <h1 className="page-title">EV Standards Reference</h1>
        <p className="page-subtitle">
          India (AIS/BIS) · IEC · ISO · UN ECE · SAE · Charging Protocols · Policy — all in one place, with latest amendments and scope.
        </p>
      </section>

      {/* Quick-nav pills */}
      <div className="std-nav">
        {SECTIONS.map((s) => (
          <a key={s.group} href={`#${s.group.replace(/\W+/g, "-").toLowerCase()}`} className="std-nav-pill">
            <span>{s.icon}</span> {s.group.split("(")[0].trim()}
          </a>
        ))}
      </div>

      {/* Sections */}
      {SECTIONS.map((section) => (
        <section
          key={section.group}
          id={section.group.replace(/\W+/g, "-").toLowerCase()}
          className="std-section"
          style={{ "--sect-color": COLOR_MAP[section.color] } as React.CSSProperties}
        >
          <div className="std-section-header">
            <span className="std-section-icon">{section.icon}</span>
            <div>
              <h2 className="std-section-title">{section.group}</h2>
              <p className="std-section-desc">{section.description}</p>
            </div>
          </div>

          <div className="std-cards">
            {section.standards.map((std) => (
              <div key={std.id} className="std-card">
                <div className="std-card-header">
                  <div className="std-id">{std.id}</div>
                  <span
                    className="std-status"
                    style={{ background: STATUS_STYLE[std.status].bg, color: STATUS_STYLE[std.status].color }}
                  >
                    {std.status}
                  </span>
                </div>
                <div className="std-title">{std.title}</div>
                <p className="std-scope">{std.scope}</p>
                <div className="std-footer">
                  <div className="std-latest">
                    <span className="std-latest-label">Latest</span>
                    <span className="std-latest-val">{std.latest}</span>
                  </div>
                  <div className="std-tags">
                    {std.applicability.map((tag) => (
                      <span key={tag} className="std-tag">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Disclaimer */}
      <div className="std-disclaimer">
        <strong>Disclaimer:</strong> Standards evolve continuously. Always verify the current edition and amendments through the issuing body (BIS, IEC, ISO, SAE, CMVR-TSC) before use in engineering or compliance work. This reference is for educational purposes only.
      </div>
    </main>
  );
}
