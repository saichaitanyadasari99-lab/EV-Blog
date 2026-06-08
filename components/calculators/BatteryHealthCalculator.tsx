"use client";

import { useMemo, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from "recharts";

type Chemistry = "LFP" | "NMC";
type FastCharge = "never" | "weekly" | "daily";

const CHEMISTRY_PARAMS: Record<Chemistry, {
  degradationPerCycle: number; // % capacity loss per cycle at 25°C
  tempSensitivity: number;     // multiplier per 10°C above 35°C
  warrantySOH: number;         // manufacturer typical warranty threshold %
  typicalCycles: number;       // expected life at nominal
}> = {
  LFP: { degradationPerCycle: 0.003, tempSensitivity: 1.8, warrantySOH: 80, typicalCycles: 3500 },
  NMC: { degradationPerCycle: 0.005, tempSensitivity: 2.0, warrantySOH: 70, typicalCycles: 2000 },
};

const FAST_CHARGE_MULTIPLIER: Record<FastCharge, number> = {
  never: 1.0, weekly: 1.12, daily: 1.25,
};

export function BatteryHealthCalculator() {
  const [chemistry, setChemistry] = useState<Chemistry>("LFP");
  const [originalKwh, setOriginalKwh] = useState(40.5);
  const [currentKwh, setCurrentKwh] = useState(37.5);
  const [cycles, setCycles] = useState(600);
  const [avgTemp, setAvgTemp] = useState(32);
  const [fastCharge, setFastCharge] = useState<FastCharge>("weekly");

  const params = CHEMISTRY_PARAMS[chemistry];

  const result = useMemo(() => {
    const currentSOH = Math.min(100, (currentKwh / originalKwh) * 100);

    // Temperature derating (doubles per 10°C above 35°C)
    const tempAbove35 = Math.max(0, avgTemp - 35);
    const tempMultiplier = Math.pow(params.tempSensitivity, tempAbove35 / 10);

    // Effective degradation rate per cycle
    const effectiveDegPerCycle = params.degradationPerCycle * tempMultiplier * FAST_CHARGE_MULTIPLIER[fastCharge];

    // Implied current SOH from cycles (for cross-check)
    const sohFromCycles = Math.max(0, 100 - cycles * effectiveDegPerCycle);

    // Use measured SOH as ground truth, cycles to project future
    const sohAtWarranty = params.warrantySOH;
    const remainingCapacityLoss = currentSOH - sohAtWarranty;
    const remainingCycles = remainingCapacityLoss > 0
      ? Math.round(remainingCapacityLoss / effectiveDegPerCycle)
      : 0;

    // Assume 300 cycles/year (roughly 1 charge/day)
    const cyclesPerYear = 300;
    const remainingYears = remainingCycles / cyclesPerYear;

    // Health label
    const healthLabel =
      currentSOH >= 90 ? "Excellent" :
      currentSOH >= 80 ? "Good" :
      currentSOH >= 70 ? "Fair" :
      "Replace Soon";

    const healthColor =
      currentSOH >= 90 ? "green" :
      currentSOH >= 80 ? "green" :
      currentSOH >= 70 ? "amber" : "red";

    // Projection chart
    const totalProjectYears = 10;
    const chart = Array.from({ length: totalProjectYears + 1 }, (_, yr) => {
      const projectedCycles = cycles + yr * cyclesPerYear;
      const projSOH = Math.max(0, 100 - projectedCycles * effectiveDegPerCycle);
      return {
        year: `Yr ${yr === 0 ? "now" : `+${yr}`}`,
        soh: Math.round(projSOH * 10) / 10,
        current: yr === 0 ? Math.round(currentSOH * 10) / 10 : null,
      };
    });

    return {
      currentSOH, sohFromCycles, sohAtWarranty,
      remainingCycles, remainingYears,
      effectiveDegPerCycle, healthLabel, healthColor,
      chart,
    };
  }, [chemistry, originalKwh, currentKwh, cycles, avgTemp, fastCharge, params]);

  return (
    <div className="calc-india-wrap">
      {/* ── Inputs ─────────────────────────────────────────────────── */}
      <div className="calc-india-form">
        <div className="ci-field-group">
          <label className="ci-label">Battery Chemistry</label>
          <div className="ci-radio-row">
            {(["LFP", "NMC"] as Chemistry[]).map(c => (
              <label key={c} className={`ci-radio${chemistry === c ? " active" : ""}`}>
                <input type="radio" name="chemistry" checked={chemistry === c}
                  onChange={() => {
                    setChemistry(c);
                    setOriginalKwh(c === "LFP" ? 40.5 : 77.4);
                    setCurrentKwh(c === "LFP" ? 37.5 : 70.0);
                  }} />
                {c === "LFP" ? "LFP (Iron-Phosphate)" : "NMC (Nickel-Manganese-Cobalt)"}
              </label>
            ))}
          </div>
          <p className="ci-help">
            {chemistry === "LFP"
              ? "LFP degrades slower, tolerates heat better, warrants to 80% SOH. Used in Tata Nexon EV, MG ZS EV."
              : "NMC has higher energy density but degrades faster in heat. Used in Kia EV6, Hyundai Ioniq 5."}
          </p>
        </div>

        <div className="ci-two-col">
          <div className="ci-field-group">
            <label className="ci-label">Original Rated Capacity</label>
            <div className="ci-slider-row">
              <input type="range" min={2} max={150} step={0.5}
                value={originalKwh} onChange={e => setOriginalKwh(+e.target.value)} />
              <input type="number" className="ci-num" value={originalKwh} step="0.5"
                onChange={e => setOriginalKwh(+e.target.value)} />
              <span className="ci-unit">kWh</span>
            </div>
            <p className="ci-help">From vehicle spec sheet (new battery)</p>
          </div>
          <div className="ci-field-group">
            <label className="ci-label">Current Measured Capacity</label>
            <div className="ci-slider-row">
              <input type="range" min={1} max={150} step={0.5}
                value={currentKwh} onChange={e => setCurrentKwh(+e.target.value)} />
              <input type="number" className="ci-num" value={currentKwh} step="0.5"
                onChange={e => setCurrentKwh(+e.target.value)} />
              <span className="ci-unit">kWh</span>
            </div>
            <p className="ci-help">From BMS diagnostic (vehicle health report or OBD)</p>
          </div>
        </div>

        <div className="ci-field-group">
          <label className="ci-label">Charge Cycles Completed</label>
          <div className="ci-slider-row">
            <input type="range" min={0} max={5000} step={50}
              value={cycles} onChange={e => setCycles(+e.target.value)} />
            <input type="number" className="ci-num" value={cycles}
              onChange={e => setCycles(+e.target.value)} />
            <span className="ci-unit">cycles</span>
          </div>
          <p className="ci-help">Estimate: total km ÷ WLTP range. E.g. 60,000 km ÷ 300 km = 200 cycles</p>
        </div>

        <div className="ci-field-group">
          <label className="ci-label">Average Operating Temperature</label>
          <div className="ci-slider-row">
            <input type="range" min={10} max={55} step={1}
              value={avgTemp} onChange={e => setAvgTemp(+e.target.value)} />
            <input type="number" className="ci-num" value={avgTemp}
              onChange={e => setAvgTemp(+e.target.value)} />
            <span className="ci-unit">°C</span>
          </div>
          <p className="ci-help">
            {avgTemp <= 30 ? "✅ Good — below 30°C causes minimal extra degradation" :
             avgTemp <= 40 ? "⚠️ Moderate — 30–40°C accelerates degradation noticeably" :
             "🔴 High — above 40°C causes significant accelerated aging"}
          </p>
        </div>

        <div className="ci-field-group">
          <label className="ci-label">DC Fast Charging Frequency</label>
          <div className="ci-radio-row">
            {(["never", "weekly", "daily"] as FastCharge[]).map(f => (
              <label key={f} className={`ci-radio${fastCharge === f ? " active" : ""}`}>
                <input type="radio" name="fastcharge" checked={fastCharge === f}
                  onChange={() => setFastCharge(f)} />
                {f === "never" ? "Never / Rarely" : f === "weekly" ? "Weekly" : "Daily"}
              </label>
            ))}
          </div>
          <p className="ci-help">DC fast charging (CCS/CHAdeMO) causes additional lithium plating stress</p>
        </div>
      </div>

      {/* ── Results ─────────────────────────────────────────────────── */}
      <div className="calc-india-results">
        <div className="ci-hero-grid">
          <div className={`ci-hero-card ${result.healthColor}`}>
            <div className="ci-hero-val">{result.currentSOH.toFixed(1)}%</div>
            <div className="ci-hero-label">Current State of Health (SOH)</div>
          </div>
          <div className={`ci-hero-card ${result.healthColor}`}>
            <div className="ci-hero-val">{result.healthLabel}</div>
            <div className="ci-hero-label">Battery condition rating</div>
          </div>
          <div className="ci-hero-card neutral">
            <div className="ci-hero-val">{result.remainingYears.toFixed(1)} yr</div>
            <div className="ci-hero-label">Estimated remaining useful life</div>
          </div>
        </div>

        <div className="ci-breakdown">
          <div className="ci-breakdown-title">Health Analysis</div>
          <table className="ci-table">
            <tbody>
              <tr>
                <td>Current SOH (measured)</td>
                <td><strong>{result.currentSOH.toFixed(1)}%</strong></td>
              </tr>
              <tr>
                <td>Manufacturer warranty threshold</td>
                <td><strong>{result.sohAtWarranty}% SOH</strong></td>
              </tr>
              <tr>
                <td>Remaining capacity above warranty</td>
                <td><strong>{(result.currentSOH - result.sohAtWarranty).toFixed(1)}%</strong></td>
              </tr>
              <tr>
                <td>Estimated remaining cycles</td>
                <td><strong>~{result.remainingCycles.toLocaleString("en-IN")} cycles</strong></td>
              </tr>
              <tr>
                <td>Degradation rate (at your conditions)</td>
                <td><strong>{result.effectiveDegPerCycle.toFixed(4)}%/cycle</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        {result.currentSOH < 70 && (
          <div className="ci-alert warn">
            <strong>Battery at {result.currentSOH.toFixed(1)}% SOH</strong> — below typical warranty threshold.
            Consider requesting a battery health check from the manufacturer or authorised service centre.
          </div>
        )}

        <div className="ci-chart-wrap">
          <div className="ci-chart-title">SOH Projection Over 10 Years</div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={result.chart} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="year" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" />
              <YAxis domain={[40, 100]} tickFormatter={v => `${v}%`} />
              <Tooltip formatter={(v: unknown) => v != null ? `${v}%` : "—"}
                contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8 }} />
              <Legend />
              <ReferenceLine y={params.warrantySOH} stroke="#f87171" strokeDasharray="5 3"
                label={{ value: `Warranty threshold (${params.warrantySOH}%)`, fill: "#f87171", fontSize: 11 }} />
              <ReferenceLine y={70} stroke="#f0b429" strokeDasharray="3 2"
                label={{ value: "Replace Soon (70%)", fill: "#f0b429", fontSize: 11 }} />
              <Line type="monotone" dataKey="soh" name="Projected SOH"
                stroke="#00c4df" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <p className="ci-chart-caption">
            Projection assumes ~300 cycles/year at current conditions. Cooler storage and slower charging will extend life significantly.
          </p>
        </div>
      </div>
    </div>
  );
}
