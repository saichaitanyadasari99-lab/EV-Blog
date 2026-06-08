// ── India EV Data — shared across all India-specific calculators ─────────────

export type StateCode =
  | "MH" | "KA" | "DL" | "TN" | "GJ" | "RJ" | "UP" | "WB"
  | "AP" | "TS" | "HR" | "MP" | "PB" | "OD" | "KL" | "BR"
  | "JH" | "AS" | "UK" | "HP";

export interface StateInfo {
  name: string;
  tariff: number;          // ₹/kWh — domestic slab ≤ 200 units
  peakSunHours: number;    // hours/day for solar calculation
  stateEVSubsidy2W: number; // ₹ additional state subsidy for 2-wheelers
  stateEVSubsidyCar: number;// ₹ for 4-wheelers
  roadTaxExempt: boolean;  // full road tax waiver on EVs
}

export const INDIA_STATES: Record<StateCode, StateInfo> = {
  MH: { name: "Maharashtra",     tariff: 8.42, peakSunHours: 5.2, stateEVSubsidy2W: 10000, stateEVSubsidyCar: 0,      roadTaxExempt: true  },
  KA: { name: "Karnataka",       tariff: 6.60, peakSunHours: 5.5, stateEVSubsidy2W: 10000, stateEVSubsidyCar: 100000, roadTaxExempt: true  },
  DL: { name: "Delhi",           tariff: 7.00, peakSunHours: 5.5, stateEVSubsidy2W: 5000,  stateEVSubsidyCar: 0,      roadTaxExempt: true  },
  TN: { name: "Tamil Nadu",      tariff: 6.75, peakSunHours: 5.8, stateEVSubsidy2W: 0,     stateEVSubsidyCar: 0,      roadTaxExempt: true  },
  GJ: { name: "Gujarat",         tariff: 7.35, peakSunHours: 5.9, stateEVSubsidy2W: 0,     stateEVSubsidyCar: 0,      roadTaxExempt: false },
  RJ: { name: "Rajasthan",       tariff: 8.50, peakSunHours: 6.0, stateEVSubsidy2W: 0,     stateEVSubsidyCar: 0,      roadTaxExempt: false },
  UP: { name: "Uttar Pradesh",   tariff: 6.50, peakSunHours: 5.3, stateEVSubsidy2W: 0,     stateEVSubsidyCar: 0,      roadTaxExempt: true  },
  WB: { name: "West Bengal",     tariff: 7.20, peakSunHours: 4.8, stateEVSubsidy2W: 0,     stateEVSubsidyCar: 0,      roadTaxExempt: false },
  AP: { name: "Andhra Pradesh",  tariff: 7.80, peakSunHours: 5.6, stateEVSubsidy2W: 0,     stateEVSubsidyCar: 0,      roadTaxExempt: true  },
  TS: { name: "Telangana",       tariff: 7.25, peakSunHours: 5.5, stateEVSubsidy2W: 0,     stateEVSubsidyCar: 0,      roadTaxExempt: true  },
  HR: { name: "Haryana",         tariff: 7.50, peakSunHours: 5.4, stateEVSubsidy2W: 0,     stateEVSubsidyCar: 0,      roadTaxExempt: true  },
  MP: { name: "Madhya Pradesh",  tariff: 6.60, peakSunHours: 5.5, stateEVSubsidy2W: 0,     stateEVSubsidyCar: 0,      roadTaxExempt: false },
  PB: { name: "Punjab",          tariff: 7.00, peakSunHours: 5.1, stateEVSubsidy2W: 0,     stateEVSubsidyCar: 0,      roadTaxExempt: false },
  OD: { name: "Odisha",          tariff: 6.40, peakSunHours: 5.3, stateEVSubsidy2W: 0,     stateEVSubsidyCar: 0,      roadTaxExempt: false },
  KL: { name: "Kerala",          tariff: 6.30, peakSunHours: 4.5, stateEVSubsidy2W: 0,     stateEVSubsidyCar: 0,      roadTaxExempt: false },
  BR: { name: "Bihar",           tariff: 6.80, peakSunHours: 5.2, stateEVSubsidy2W: 0,     stateEVSubsidyCar: 0,      roadTaxExempt: false },
  JH: { name: "Jharkhand",       tariff: 6.50, peakSunHours: 5.2, stateEVSubsidy2W: 0,     stateEVSubsidyCar: 0,      roadTaxExempt: false },
  AS: { name: "Assam",           tariff: 7.10, peakSunHours: 4.6, stateEVSubsidy2W: 0,     stateEVSubsidyCar: 0,      roadTaxExempt: false },
  UK: { name: "Uttarakhand",     tariff: 6.20, peakSunHours: 5.0, stateEVSubsidy2W: 0,     stateEVSubsidyCar: 0,      roadTaxExempt: false },
  HP: { name: "Himachal Pradesh",tariff: 5.80, peakSunHours: 5.3, stateEVSubsidy2W: 0,     stateEVSubsidyCar: 0,      roadTaxExempt: false },
};

// ── Vehicle Segments ─────────────────────────────────────────────────────────

export type VehicleSegment = "2W" | "3W" | "car" | "suv";

export interface SegmentDefaults {
  label: string;
  evEfficiencyWhKm: number;   // EV energy use
  iceMileageKmL: number;      // ICE mileage
  evPriceINR: number;         // typical EV on-road price ₹
  icePriceINR: number;        // comparable ICE price ₹
  fameSubsidyINR: number;     // FAME-II central subsidy ₹
  evMaintenancePerKm: number; // ₹/km EV maintenance
  iceMaintenancePerKm: number;// ₹/km ICE maintenance
  batteryKwh: number;         // typical battery
}

export const SEGMENT_DEFAULTS: Record<VehicleSegment, SegmentDefaults> = {
  "2W": {
    label: "2-Wheeler (Scooter/Bike)",
    evEfficiencyWhKm: 25,
    iceMileageKmL: 50,
    evPriceINR: 110000,
    icePriceINR: 80000,
    fameSubsidyINR: 30000,
    evMaintenancePerKm: 0.5,
    iceMaintenancePerKm: 1.5,
    batteryKwh: 3.0,
  },
  "3W": {
    label: "3-Wheeler (Auto/Rickshaw)",
    evEfficiencyWhKm: 60,
    iceMileageKmL: 25,
    evPriceINR: 250000,
    icePriceINR: 200000,
    fameSubsidyINR: 30000,
    evMaintenancePerKm: 0.8,
    iceMaintenancePerKm: 2.5,
    batteryKwh: 8.0,
  },
  "car": {
    label: "Car (Hatchback/Sedan)",
    evEfficiencyWhKm: 140,
    iceMileageKmL: 15,
    evPriceINR: 1200000,
    icePriceINR: 800000,
    fameSubsidyINR: 150000,
    evMaintenancePerKm: 1.0,
    iceMaintenancePerKm: 4.5,
    batteryKwh: 30.0,
  },
  "suv": {
    label: "SUV / MPV",
    evEfficiencyWhKm: 200,
    iceMileageKmL: 12,
    evPriceINR: 2000000,
    icePriceINR: 1500000,
    fameSubsidyINR: 150000,
    evMaintenancePerKm: 1.2,
    iceMaintenancePerKm: 5.5,
    batteryKwh: 60.0,
  },
};

// ── FAME-II / PM E-DRIVE Subsidy Data ───────────────────────────────────────

export type VehicleCategory = "2W" | "3W" | "4W" | "eBus" | "eTruck";

export interface FameSubsidy {
  centralPerKwh: number;   // ₹/kWh for 2W
  centralFlat: number;     // ₹ flat for 3W/4W/buses
  maxCap: number;          // max central subsidy ₹
  minRangeKm: number;      // min range for eligibility
  notes: string;
}

export const FAME_SUBSIDY: Record<VehicleCategory, FameSubsidy> = {
  "2W": {
    centralPerKwh: 10000,
    centralFlat: 0,
    maxCap: 40000,
    minRangeKm: 80,
    notes: "₹10,000/kWh capped at ₹40,000. Requires FAME-approved Indian manufacturer and minimum 80km real-world range.",
  },
  "3W": {
    centralPerKwh: 0,
    centralFlat: 30000,
    maxCap: 30000,
    minRangeKm: 120,
    notes: "₹30,000 flat subsidy for FAME-approved 3-wheeler models. E-rickshaws may qualify under separate scheme.",
  },
  "4W": {
    centralPerKwh: 0,
    centralFlat: 150000,
    maxCap: 150000,
    minRangeKm: 140,
    notes: "₹1.5L under PM E-DRIVE (successor to FAME-II for 4W). FAME-II phase closed for private cars; check current scheme.",
  },
  "eBus": {
    centralPerKwh: 0,
    centralFlat: 5000000,
    maxCap: 5500000,
    minRangeKm: 200,
    notes: "₹20L–55L per e-bus under FAME-II/PM e-Bus Sewa. Exact amount depends on bus length and operator category.",
  },
  "eTruck": {
    centralPerKwh: 0,
    centralFlat: 0,
    maxCap: 0,
    minRangeKm: 200,
    notes: "No direct central subsidy yet for e-trucks. Some states offer road tax waiver and registration subsidy.",
  },
};

// ── Indian EV Models (for range/charging calculators) ────────────────────────

export const INDIA_EV_MODELS = [
  { name: "Tata Nexon EV",       segment: "car"  as VehicleSegment, batteryKwh: 40.5, efficiencyWhKm: 145, cdrag: 0.32, mass: 1535 },
  { name: "Tata Nexon EV Max",   segment: "car"  as VehicleSegment, batteryKwh: 65.4, efficiencyWhKm: 155, cdrag: 0.32, mass: 1600 },
  { name: "Tata Tigor EV",       segment: "car"  as VehicleSegment, batteryKwh: 26.0, efficiencyWhKm: 130, cdrag: 0.33, mass: 1350 },
  { name: "MG ZS EV",            segment: "suv"  as VehicleSegment, batteryKwh: 50.3, efficiencyWhKm: 175, cdrag: 0.31, mass: 1640 },
  { name: "Kia EV6",             segment: "suv"  as VehicleSegment, batteryKwh: 77.4, efficiencyWhKm: 165, cdrag: 0.28, mass: 1925 },
  { name: "Hyundai Ioniq 5",     segment: "suv"  as VehicleSegment, batteryKwh: 72.6, efficiencyWhKm: 168, cdrag: 0.29, mass: 1985 },
  { name: "Ather 450X",          segment: "2W"   as VehicleSegment, batteryKwh: 3.7,  efficiencyWhKm: 26,  cdrag: 0.36, mass: 108  },
  { name: "Ola S1 Pro",          segment: "2W"   as VehicleSegment, batteryKwh: 4.0,  efficiencyWhKm: 28,  cdrag: 0.37, mass: 125  },
  { name: "TVS iQube",           segment: "2W"   as VehicleSegment, batteryKwh: 5.1,  efficiencyWhKm: 30,  cdrag: 0.38, mass: 120  },
  { name: "Bajaj Chetak",        segment: "2W"   as VehicleSegment, batteryKwh: 3.0,  efficiencyWhKm: 24,  cdrag: 0.38, mass: 120  },
  { name: "Mahindra e2o / Treo", segment: "3W"   as VehicleSegment, batteryKwh: 7.5,  efficiencyWhKm: 55,  cdrag: 0.45, mass: 700  },
];

// ── India Charging Network EVSE Rates ────────────────────────────────────────

export const INDIA_EVSE_RATES = {
  slowAC:     { label: "Slow AC (7–22 kW)",   ratePerKwh: 8,  power: 7  },
  fastDC:     { label: "Fast DC (30–60 kW)",  ratePerKwh: 18, power: 50 },
  ultraFastDC:{ label: "Ultra-fast DC (≥120 kW)", ratePerKwh: 22, power: 120 },
};

// ── India Grid Carbon Intensity ───────────────────────────────────────────────
// CEA 2023: ~710 gCO₂/kWh for India grid (grid intensity improving YoY)
export const INDIA_GRID_INTENSITY_G_CO2_KWH = 710;

// ── Fuel Defaults ─────────────────────────────────────────────────────────────
export const FUEL_DEFAULTS = {
  petrol: { label: "Petrol", pricePerL: 105, co2PerL: 2310 }, // g CO₂/litre
  diesel: { label: "Diesel", pricePerL: 95,  co2PerL: 2640 },
  cng:    { label: "CNG",    pricePerL: 90,  co2PerL: 1960 }, // ₹/kg, g CO₂/kg
};

// ── Solar Constants ───────────────────────────────────────────────────────────
export const SOLAR = {
  panelWp: 400,           // standard panel wattage
  systemEfficiency: 0.80, // system-level derating (inverter, wiring, soiling)
  costPerKwp: 65000,      // ₹/kWp installed (2024 avg including subsidy benefit)
  pm_surya_ghar_subsidy_3kw: 78000, // PM Surya Ghar subsidy ≤3kW
  pm_surya_ghar_subsidy_above_3kw: 98000,
  daysPerYear: 365,
};
