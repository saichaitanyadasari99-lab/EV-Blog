"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid, Line, LineChart, Legend,
  ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine,
} from "recharts";
import {
  SEGMENT_DEFAULTS, INDIA_STATES, FUEL_DEFAULTS,
  INDIA_GRID_INTENSITY_G_CO2_KWH, type VehicleSegment, type StateCode,
} from "@/lib/india-ev-data";

const fmt = (n: number, dec = 0) =>
  n.toLocaleString("en-IN", { maximumFractionDigits: dec });

const fmtINR = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

export function EvVsPetrolCalculator() {
  const [segment, setSegment] = useState<VehicleSegment>("car");
  const [annualKm, setAnnualKm] = useState(15000);
  const [fuelType, setFuelType] = useState<"petrol" | "diesel" | "cng">("petrol");
  const [fuelPrice, setFuelPrice] = useState(105);
  const [evPrice, setEvPrice] = useState(1200000);
  const [icePrice, setIcePrice] = useState(800000);
  const [stateCode, setStateCode] = useState<StateCode>("MH");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loanYears, setLoanYears] = useState(5);
  const [interestRate, setInterestRate] = useState(9.5);

  const seg = SEGMENT_DEFAULTS[segment];
  const stateInfo = INDIA_STATES[stateCode];

  // derived (editable via advanced)
  const [evEfficiency, setEvEfficiency] = useState(seg.evEfficiencyWhKm);
  const [iceMileage, setIceMileage] = useState(seg.iceMileageKmL);
  const [fameSubsidy, setFameSubsidy] = useState(seg.fameSubsidyINR);

  // update defaults when segment changes
  const handleSegmentChange = (s: VehicleSegment) => {
    setSegment(s);
    const d = SEGMENT_DEFAULTS[s];
    setEvEfficiency(d.evEfficiencyWhKm);
    setIceMileage(d.iceMileageKmL);
    setFameSubsidy(d.fameSubsidyINR);
    setEvPrice(d.evPriceINR);
    setIcePrice(d.icePriceINR);
  };

  const result = useMemo(() => {
    const tariff = stateInfo.tariff;
    const fuelDef = FUEL_DEFAULTS[fuelType];

    // Annual energy/fuel costs
    const evKwhPerYear = (annualKm * evEfficiency) / 1000;
    const evFuelCostPerYear = evKwhPerYear * tariff;

    const iceL = annualKm / iceMileage;
    const iceFuelCostPerYear = iceL * (fuelType === "cng" ? 90 : fuelPrice);

    // Maintenance
    const evMaint = annualKm * seg.evMaintenancePerKm;
    const iceMaint = annualKm * seg.iceMaintenancePerKm;

    // Net EV premium (after FAME subsidy)
    const effectiveEvPrice = evPrice - fameSubsidy - stateInfo.stateEVSubsidy2W;
    const priceDiff = Math.max(0, effectiveEvPrice - icePrice);

    // Annual savings
    const annualFuelSaving = iceFuelCostPerYear - evFuelCostPerYear;
    const annualMaintSaving = iceMaint - evMaint;
    const totalAnnualSaving = annualFuelSaving + annualMaintSaving;

    // Break-even
    const breakEvenYears = totalAnnualSaving > 0 ? priceDiff / totalAnnualSaving : Infinity;

    // EMI comparison (simple reducing balance)
    const monthlyRate = interestRate / 100 / 12;
    const n = loanYears * 12;
    const emiEV  = monthlyRate > 0 ? effectiveEvPrice  * monthlyRate * Math.pow(1 + monthlyRate, n) / (Math.pow(1 + monthlyRate, n) - 1) : effectiveEvPrice / n;
    const emiICE = monthlyRate > 0 ? icePrice * monthlyRate * Math.pow(1 + monthlyRate, n) / (Math.pow(1 + monthlyRate, n) - 1) : icePrice / n;

    // CO₂ avoided
    const evCo2 = (evKwhPerYear * INDIA_GRID_INTENSITY_G_CO2_KWH) / 1000; // kg/yr
    const iceCo2 = (iceL * fuelDef.co2PerL) / 1000; // kg/yr
    const co2Saved = Math.max(0, iceCo2 - evCo2);

    // 7-year chart
    const chart = Array.from({ length: 8 }, (_, yr) => ({
      year: yr,
      ev:  Math.round(effectiveEvPrice + (evFuelCostPerYear + evMaint) * yr),
      ice: Math.round(icePrice + (iceFuelCostPerYear + iceMaint) * yr),
    }));

    const fiveYearSaving = totalAnnualSaving * 5 - priceDiff;

    return {
      evFuelCostPerYear, iceFuelCostPerYear,
      evMaint, iceMaint,
      annualFuelSaving, annualMaintSaving, totalAnnualSaving,
      breakEvenYears, fiveYearSaving,
      emiEV, emiICE, priceDiff, effectiveEvPrice,
      co2Saved, chart,
    };
  }, [segment, annualKm, fuelType, fuelPrice, evPrice, icePrice,
      stateCode, evEfficiency, iceMileage, fameSubsidy, loanYears, interestRate,
      seg, stateInfo]);

  const breakEvenLabel =
    result.breakEvenYears === Infinity
      ? "Never (EV already cheaper)"
      : result.breakEvenYears <= 0
      ? "Day 1 (EV cheaper upfront)"
      : `${result.breakEvenYears.toFixed(1)} years`;

  return (
    <div className="calc-india-wrap">
      {/* ── Inputs ─────────────────────────────────────────────────── */}
      <div className="calc-india-form">
        {/* Vehicle segment */}
        <div className="ci-field-group">
          <label className="ci-label">Vehicle Segment</label>
          <div className="ci-seg-grid">
            {(["2W", "3W", "car", "suv"] as VehicleSegment[]).map((s) => (
              <button
                key={s}
                className={`ci-seg-btn${segment === s ? " active" : ""}`}
                onClick={() => handleSegmentChange(s)}
              >
                {s === "2W" ? "🛵 2-Wheeler" : s === "3W" ? "🛺 3-Wheeler" : s === "car" ? "🚗 Car" : "🚙 SUV"}
              </button>
            ))}
          </div>
        </div>

        {/* Annual KM */}
        <div className="ci-field-group">
          <label className="ci-label">Annual Distance Driven</label>
          <div className="ci-slider-row">
            <input type="range" min={3000} max={60000} step={1000}
              value={annualKm} onChange={e => setAnnualKm(+e.target.value)} />
            <input type="number" className="ci-num" value={annualKm}
              onChange={e => setAnnualKm(+e.target.value)} />
            <span className="ci-unit">km/yr</span>
          </div>
          <p className="ci-help">Typical: 10,000–20,000 km/year for personal use</p>
        </div>

        {/* Fuel type */}
        <div className="ci-field-group">
          <label className="ci-label">Current Fuel Type</label>
          <div className="ci-radio-row">
            {(["petrol", "diesel", "cng"] as const).map(f => (
              <label key={f} className={`ci-radio${fuelType === f ? " active" : ""}`}>
                <input type="radio" name="fuel" value={f}
                  checked={fuelType === f} onChange={() => {
                    setFuelType(f);
                    setFuelPrice(FUEL_DEFAULTS[f].pricePerL);
                  }} />
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </label>
            ))}
          </div>
        </div>

        {/* Fuel price */}
        <div className="ci-field-group">
          <label className="ci-label">Fuel Price</label>
          <div className="ci-slider-row">
            <input type="range" min={60} max={140} step={1}
              value={fuelPrice} onChange={e => setFuelPrice(+e.target.value)} />
            <input type="number" className="ci-num" value={fuelPrice}
              onChange={e => setFuelPrice(+e.target.value)} />
            <span className="ci-unit">₹/{fuelType === "cng" ? "kg" : "L"}</span>
          </div>
        </div>

        {/* State */}
        <div className="ci-field-group">
          <label className="ci-label">Your State <span className="ci-tag">electricity tariff</span></label>
          <select className="ci-select"
            value={stateCode} onChange={e => setStateCode(e.target.value as StateCode)}>
            {Object.entries(INDIA_STATES).map(([code, info]) => (
              <option key={code} value={code}>
                {info.name} — ₹{info.tariff}/kWh
              </option>
            ))}
          </select>
          <p className="ci-help">Domestic electricity tariff used for home charging cost</p>
        </div>

        {/* Vehicle prices */}
        <div className="ci-two-col">
          <div className="ci-field-group">
            <label className="ci-label">EV On-Road Price</label>
            <div className="ci-prefix-row">
              <span className="ci-prefix">₹</span>
              <input type="number" className="ci-num-wide" value={evPrice}
                onChange={e => setEvPrice(+e.target.value)} />
            </div>
          </div>
          <div className="ci-field-group">
            <label className="ci-label">ICE Vehicle Price</label>
            <div className="ci-prefix-row">
              <span className="ci-prefix">₹</span>
              <input type="number" className="ci-num-wide" value={icePrice}
                onChange={e => setIcePrice(+e.target.value)} />
            </div>
          </div>
        </div>

        {/* Advanced */}
        <details className="ci-advanced" open={showAdvanced}
          onToggle={e => setShowAdvanced((e.target as HTMLDetailsElement).open)}>
          <summary className="ci-advanced-toggle">⚙ Advanced Options</summary>
          <div className="ci-advanced-body">
            <div className="ci-field-group">
              <label className="ci-label">EV Energy Consumption</label>
              <div className="ci-slider-row">
                <input type="range" min={15} max={300} step={5}
                  value={evEfficiency} onChange={e => setEvEfficiency(+e.target.value)} />
                <input type="number" className="ci-num" value={evEfficiency}
                  onChange={e => setEvEfficiency(+e.target.value)} />
                <span className="ci-unit">Wh/km</span>
              </div>
              <p className="ci-help">Typical: 2W=25, Car=140, SUV=200</p>
            </div>
            <div className="ci-field-group">
              <label className="ci-label">ICE Vehicle Mileage</label>
              <div className="ci-slider-row">
                <input type="range" min={5} max={80} step={1}
                  value={iceMileage} onChange={e => setIceMileage(+e.target.value)} />
                <input type="number" className="ci-num" value={iceMileage}
                  onChange={e => setIceMileage(+e.target.value)} />
                <span className="ci-unit">km/L</span>
              </div>
            </div>
            <div className="ci-field-group">
              <label className="ci-label">FAME-II / Central Subsidy Applied</label>
              <div className="ci-prefix-row">
                <span className="ci-prefix">₹</span>
                <input type="number" className="ci-num-wide" value={fameSubsidy}
                  onChange={e => setFameSubsidy(+e.target.value)} />
              </div>
              <p className="ci-help">Pre-filled from segment. Adjust for your exact model.</p>
            </div>
            <div className="ci-two-col">
              <div className="ci-field-group">
                <label className="ci-label">Loan Tenure</label>
                <div className="ci-slider-row">
                  <input type="range" min={1} max={8} step={1}
                    value={loanYears} onChange={e => setLoanYears(+e.target.value)} />
                  <input type="number" className="ci-num" value={loanYears}
                    onChange={e => setLoanYears(+e.target.value)} />
                  <span className="ci-unit">yr</span>
                </div>
              </div>
              <div className="ci-field-group">
                <label className="ci-label">Interest Rate</label>
                <div className="ci-slider-row">
                  <input type="range" min={6} max={18} step={0.5}
                    value={interestRate} onChange={e => setInterestRate(+e.target.value)} />
                  <input type="number" className="ci-num" value={interestRate}
                    step="0.5" onChange={e => setInterestRate(+e.target.value)} />
                  <span className="ci-unit">%</span>
                </div>
              </div>
            </div>
          </div>
        </details>
      </div>

      {/* ── Results ────────────────────────────────────────────────── */}
      <div className="calc-india-results">
        {/* Hero metrics */}
        <div className="ci-hero-grid">
          <div className="ci-hero-card accent">
            <div className="ci-hero-val">{fmtINR(Math.round(result.totalAnnualSaving))}</div>
            <div className="ci-hero-label">Annual savings (fuel + maintenance)</div>
          </div>
          <div className={`ci-hero-card ${result.breakEvenYears <= 4 ? "green" : result.breakEvenYears <= 7 ? "amber" : "neutral"}`}>
            <div className="ci-hero-val">{breakEvenLabel}</div>
            <div className="ci-hero-label">Break-even point</div>
          </div>
          <div className={`ci-hero-card ${result.fiveYearSaving >= 0 ? "green" : "amber"}`}>
            <div className="ci-hero-val">{fmtINR(Math.abs(Math.round(result.fiveYearSaving)))}</div>
            <div className="ci-hero-label">{result.fiveYearSaving >= 0 ? "5-year net saving" : "5-year extra cost"}</div>
          </div>
        </div>

        {/* Breakdown table */}
        <div className="ci-breakdown">
          <div className="ci-breakdown-title">Annual Cost Breakdown</div>
          <table className="ci-table">
            <thead>
              <tr><th>Cost Item</th><th>EV</th><th>ICE / CNG</th><th>You Save</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>Fuel / Charging</td>
                <td>{fmtINR(Math.round(result.evFuelCostPerYear))}</td>
                <td>{fmtINR(Math.round(result.iceFuelCostPerYear))}</td>
                <td className="ci-save">{fmtINR(Math.round(result.annualFuelSaving))}</td>
              </tr>
              <tr>
                <td>Maintenance</td>
                <td>{fmtINR(Math.round(result.evMaint))}</td>
                <td>{fmtINR(Math.round(result.iceMaint))}</td>
                <td className="ci-save">{fmtINR(Math.round(result.annualMaintSaving))}</td>
              </tr>
              <tr className="ci-total-row">
                <td>Total Annual</td>
                <td>{fmtINR(Math.round(result.evFuelCostPerYear + result.evMaint))}</td>
                <td>{fmtINR(Math.round(result.iceFuelCostPerYear + result.iceMaint))}</td>
                <td className="ci-save">{fmtINR(Math.round(result.totalAnnualSaving))}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* EMI + subsidies */}
        <div className="ci-info-row">
          <div className="ci-info-box">
            <div className="ci-info-label">EV effective price (after subsidies)</div>
            <div className="ci-info-val">{fmtINR(result.effectiveEvPrice)}</div>
            <div className="ci-info-sub">FAME: {fmtINR(fameSubsidy)} + State: {fmtINR(stateInfo.stateEVSubsidy2W)}</div>
          </div>
          <div className="ci-info-box">
            <div className="ci-info-label">Monthly EMI — EV</div>
            <div className="ci-info-val">{fmtINR(Math.round(result.emiEV))}/mo</div>
            <div className="ci-info-sub">vs ICE {fmtINR(Math.round(result.emiICE))}/mo on {loanYears}yr @ {interestRate}%</div>
          </div>
          <div className="ci-info-box green">
            <div className="ci-info-label">CO₂ avoided per year</div>
            <div className="ci-info-val">{fmt(result.co2Saved, 0)} kg</div>
            <div className="ci-info-sub">vs India grid intensity 710 gCO₂/kWh</div>
          </div>
        </div>

        {/* Chart */}
        <div className="ci-chart-wrap">
          <div className="ci-chart-title">Cumulative Cost Over 7 Years</div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={result.chart} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="year" label={{ value: "Year", position: "insideBottom", offset: -2 }} tickFormatter={v => `Yr ${v}`} />
              <YAxis tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`} />
              <Tooltip formatter={(v: unknown) => fmtINR(Number(v))} labelFormatter={(l: unknown) => `Year ${l}`}
                contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8 }} />
              <Legend />
              {result.chart.some((d, i) => i > 0 && d.ev < d.ice) && (
                <ReferenceLine
                  x={result.chart.findIndex((d, i) => i > 0 && d.ev <= d.ice)}
                  stroke="var(--brand)" strokeDasharray="4 2"
                  label={{ value: "Break-even", fill: "var(--brand)", fontSize: 11 }}
                />
              )}
              <Line type="monotone" dataKey="ev"  name="EV Total Cost"  stroke="#00c4df" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="ice" name="ICE Total Cost" stroke="#f0b429" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <p className="ci-chart-caption">Includes purchase price, fuel/charging, and maintenance. Excludes depreciation and insurance.</p>
        </div>
      </div>
    </div>
  );
}
