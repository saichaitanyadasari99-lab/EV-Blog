"use client";

import { useMemo, useState } from "react";
import {
  BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine,
} from "recharts";
import { INDIA_STATES, SOLAR, type StateCode } from "@/lib/india-ev-data";

const fmtINR = (n: number) => "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

export function EvSolarCalculator() {
  const [stateCode, setStateCode] = useState<StateCode>("MH");
  const [monthlyKm, setMonthlyKm] = useState(1200);
  const [evEfficiency, setEvEfficiency] = useState(140);   // Wh/km
  const [rooftopArea, setRooftopArea] = useState(20);       // m²
  const [tariff, setTariff] = useState(INDIA_STATES["MH"].tariff);
  const [solarCostPerKwp, setSolarCostPerKwp] = useState(SOLAR.costPerKwp);

  const handleStateChange = (code: StateCode) => {
    setStateCode(code);
    setTariff(INDIA_STATES[code].tariff);
  };

  const result = useMemo(() => {
    const state = INDIA_STATES[stateCode];
    const peakSunHours = state.peakSunHours;

    // EV annual energy demand
    const annualKm = monthlyKm * 12;
    const evAnnualKwh = (annualKm * evEfficiency) / 1000;

    // Solar generation
    // 1 kWp generates: peakSunHours × 365 × systemEfficiency kWh/yr
    const kwhPerKwpPerYear = peakSunHours * SOLAR.daysPerYear * SOLAR.systemEfficiency;

    // Required solar capacity for 100% EV coverage
    const requiredKwp = evAnnualKwh / kwhPerKwpPerYear;

    // What the rooftop can fit (≈1 panel per 2.5 m²)
    const panelArea = 1.9; // m² per 400W panel
    const maxPanels = Math.floor(rooftopArea / panelArea);
    const maxCapacityKwp = (maxPanels * SOLAR.panelWp) / 1000;

    const installedKwp = Math.min(requiredKwp, maxCapacityKwp);
    const installedPanels = Math.round((installedKwp * 1000) / SOLAR.panelWp);
    const annualGenerationKwh = installedKwp * kwhPerKwpPerYear;
    const selfSufficiency = Math.min(100, (annualGenerationKwh / evAnnualKwh) * 100);

    // Economics
    const systemCost = installedKwp * solarCostPerKwp;
    // PM Surya Ghar subsidy
    const solarSubsidy =
      installedKwp <= 3
        ? SOLAR.pm_surya_ghar_subsidy_3kw
        : SOLAR.pm_surya_ghar_subsidy_above_3kw;
    const netSystemCost = Math.max(0, systemCost - solarSubsidy);

    // Annual savings = energy generated × tariff (avoided grid purchase)
    const annualSavings = annualGenerationKwh * tariff;
    const paybackYears = netSystemCost / annualSavings;

    // Month-by-month generation (simplified seasonal variation ±15%)
    const monthlyChart = [
      "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"
    ].map((month, i) => {
      const seasonFactor = 1 + 0.15 * Math.sin(((i - 2) / 12) * 2 * Math.PI);
      const gen = (installedKwp * peakSunHours * 30 * SOLAR.systemEfficiency * seasonFactor);
      const demand = evAnnualKwh / 12;
      return {
        month,
        generation: Math.round(gen),
        evDemand: Math.round(demand),
        excess: Math.max(0, Math.round(gen - demand)),
      };
    });

    return {
      evAnnualKwh, requiredKwp, maxCapacityKwp,
      installedKwp, installedPanels, annualGenerationKwh,
      selfSufficiency, systemCost, solarSubsidy, netSystemCost,
      annualSavings, paybackYears, monthlyChart,
    };
  }, [stateCode, monthlyKm, evEfficiency, rooftopArea, tariff, solarCostPerKwp]);

  return (
    <div className="calc-india-wrap">
      {/* ── Inputs ─────────────────────────────────────────────────── */}
      <div className="calc-india-form">
        <div className="ci-field-group">
          <label className="ci-label">Your State</label>
          <select className="ci-select" value={stateCode}
            onChange={e => handleStateChange(e.target.value as StateCode)}>
            {Object.entries(INDIA_STATES).map(([code, info]) => (
              <option key={code} value={code}>
                {info.name} — {info.peakSunHours}h sun/day
              </option>
            ))}
          </select>
          <p className="ci-help">Solar irradiance (peak sun hours) varies significantly across India. Rajasthan gets the most sun.</p>
        </div>

        <div className="ci-field-group">
          <label className="ci-label">Monthly EV Distance</label>
          <div className="ci-slider-row">
            <input type="range" min={200} max={5000} step={100}
              value={monthlyKm} onChange={e => setMonthlyKm(+e.target.value)} />
            <input type="number" className="ci-num" value={monthlyKm}
              onChange={e => setMonthlyKm(+e.target.value)} />
            <span className="ci-unit">km/mo</span>
          </div>
        </div>

        <div className="ci-field-group">
          <label className="ci-label">EV Energy Consumption</label>
          <div className="ci-slider-row">
            <input type="range" min={15} max={300} step={5}
              value={evEfficiency} onChange={e => setEvEfficiency(+e.target.value)} />
            <input type="number" className="ci-num" value={evEfficiency}
              onChange={e => setEvEfficiency(+e.target.value)} />
            <span className="ci-unit">Wh/km</span>
          </div>
          <p className="ci-help">2-Wheeler: ~25 Wh/km · Car: ~140 Wh/km · SUV: ~200 Wh/km</p>
        </div>

        <div className="ci-field-group">
          <label className="ci-label">Available Rooftop Area</label>
          <div className="ci-slider-row">
            <input type="range" min={5} max={150} step={5}
              value={rooftopArea} onChange={e => setRooftopArea(+e.target.value)} />
            <input type="number" className="ci-num" value={rooftopArea}
              onChange={e => setRooftopArea(+e.target.value)} />
            <span className="ci-unit">m²</span>
          </div>
          <p className="ci-help">Each 400W panel needs ~1.9 m². A 20 m² rooftop fits ~10 panels (4 kWp)</p>
        </div>

        <details className="ci-advanced">
          <summary className="ci-advanced-toggle">⚙ Advanced Options</summary>
          <div className="ci-advanced-body">
            <div className="ci-field-group">
              <label className="ci-label">Electricity Tariff</label>
              <div className="ci-slider-row">
                <input type="range" min={4} max={12} step={0.1}
                  value={tariff} onChange={e => setTariff(+e.target.value)} />
                <input type="number" className="ci-num" value={tariff} step="0.1"
                  onChange={e => setTariff(+e.target.value)} />
                <span className="ci-unit">₹/kWh</span>
              </div>
            </div>
            <div className="ci-field-group">
              <label className="ci-label">Solar System Cost</label>
              <div className="ci-slider-row">
                <input type="range" min={40000} max={90000} step={1000}
                  value={solarCostPerKwp} onChange={e => setSolarCostPerKwp(+e.target.value)} />
                <input type="number" className="ci-num" value={solarCostPerKwp}
                  onChange={e => setSolarCostPerKwp(+e.target.value)} />
                <span className="ci-unit">₹/kWp</span>
              </div>
              <p className="ci-help">Installed cost including inverter, mounting, wiring. Avg 2024: ₹65,000/kWp</p>
            </div>
          </div>
        </details>
      </div>

      {/* ── Results ─────────────────────────────────────────────────── */}
      <div className="calc-india-results">
        <div className="ci-hero-grid">
          <div className="ci-hero-card accent">
            <div className="ci-hero-val">{result.installedKwp.toFixed(1)} kWp</div>
            <div className="ci-hero-label">Recommended solar system size</div>
          </div>
          <div className="ci-hero-card green">
            <div className="ci-hero-val">{result.selfSufficiency.toFixed(0)}%</div>
            <div className="ci-hero-label">EV charging covered by solar</div>
          </div>
          <div className={`ci-hero-card ${result.paybackYears < 7 ? "green" : result.paybackYears < 12 ? "amber" : "neutral"}`}>
            <div className="ci-hero-val">{result.paybackYears.toFixed(1)} yr</div>
            <div className="ci-hero-label">Payback period</div>
          </div>
        </div>

        <div className="ci-breakdown">
          <div className="ci-breakdown-title">System Summary</div>
          <table className="ci-table">
            <tbody>
              <tr><td>Panels required</td><td><strong>{result.installedPanels} panels</strong> (400W each)</td></tr>
              <tr><td>Annual EV energy demand</td><td><strong>{result.evAnnualKwh.toFixed(0)} kWh</strong></td></tr>
              <tr><td>Annual solar generation</td><td><strong>{result.annualGenerationKwh.toFixed(0)} kWh</strong></td></tr>
              <tr><td>System cost (before subsidy)</td><td><strong>{fmtINR(result.systemCost)}</strong></td></tr>
              <tr><td>PM Surya Ghar subsidy</td><td><strong className="ci-green">{fmtINR(result.solarSubsidy)}</strong></td></tr>
              <tr><td>Net system cost</td><td><strong>{fmtINR(result.netSystemCost)}</strong></td></tr>
              <tr><td>Annual electricity savings</td><td><strong className="ci-green">{fmtINR(Math.round(result.annualSavings))}</strong></td></tr>
            </tbody>
          </table>
        </div>

        <div className="ci-chart-wrap">
          <div className="ci-chart-title">Monthly Solar Generation vs EV Demand</div>
          <ResponsiveContainer width="99%" height={260}>
            <BarChart data={result.monthlyChart} margin={{ top: 5, right: 10, left: 55, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis label={{ value: "kWh", angle: -90, position: "insideLeft", offset: 10 }} />
              <Tooltip
                contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8 }}
                formatter={(v: unknown, name: unknown) => [`${v} kWh`, String(name)]} />
              <Legend />
              <Bar dataKey="generation" name="Solar generation" fill="#f0b429" radius={[4,4,0,0]} />
              <Bar dataKey="evDemand"   name="EV demand"        fill="#00c4df" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="ci-chart-caption">Summer months (Apr–Jun) generate more solar energy. Monsoon months show reduced generation due to cloud cover.</p>
        </div>
      </div>
    </div>
  );
}
