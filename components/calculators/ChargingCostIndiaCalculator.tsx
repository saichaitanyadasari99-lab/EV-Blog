"use client";

import { useMemo, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from "recharts";
import {
  INDIA_STATES, SEGMENT_DEFAULTS, INDIA_EVSE_RATES,
  type StateCode, type VehicleSegment,
} from "@/lib/india-ev-data";

const fmtINR = (n: number) => "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

export function ChargingCostIndiaCalculator() {
  const [stateCode, setStateCode] = useState<StateCode>("MH");
  const [monthlyKm, setMonthlyKm] = useState(1200);
  const [segment, setSegment] = useState<VehicleSegment>("car");
  const [homePct, setHomePct] = useState(70);
  const [evseType, setEvseType] = useState<keyof typeof INDIA_EVSE_RATES>("fastDC");
  const [petrolPrice, setPetrolPrice] = useState(105);
  const [petrolMileage, setPetrolMileage] = useState(15);

  const state = INDIA_STATES[stateCode];
  const seg = SEGMENT_DEFAULTS[segment];
  const evse = INDIA_EVSE_RATES[evseType];

  const result = useMemo(() => {
    const efficiencyWhKm = seg.evEfficiencyWhKm;
    const monthlyKwh = (monthlyKm * efficiencyWhKm) / 1000;

    const homeKwh = monthlyKwh * (homePct / 100);
    const publicKwh = monthlyKwh * ((100 - homePct) / 100);

    const homeChargingCost = homeKwh * state.tariff;
    const publicChargingCost = publicKwh * evse.ratePerKwh;
    const totalMonthly = homeChargingCost + publicChargingCost;

    const perKmCost = totalMonthly / monthlyKm;
    const annualTotal = totalMonthly * 12;

    // petrol equivalent
    const petrolMonthlyL = monthlyKm / petrolMileage;
    const petrolMonthlyCost = petrolMonthlyL * petrolPrice;
    const annualSavingVsPetrol = (petrolMonthlyCost - totalMonthly) * 12;

    // chart data for all states
    const stateChart = Object.entries(INDIA_STATES).map(([code, info]) => ({
      state: code,
      home: Math.round((monthlyKwh * (homePct / 100)) * info.tariff),
      public: Math.round(publicKwh * evse.ratePerKwh),
    }));

    return {
      homeChargingCost, publicChargingCost, totalMonthly,
      perKmCost, annualTotal, annualSavingVsPetrol,
      petrolMonthlyCost, monthlyKwh, homeKwh, publicKwh,
      stateChart,
    };
  }, [stateCode, monthlyKm, segment, homePct, evseType, petrolPrice, petrolMileage,
      state, seg, evse]);

  return (
    <div className="calc-india-wrap">
      {/* ── Inputs ─────────────────────────────────────────────────── */}
      <div className="calc-india-form">
        <div className="ci-field-group">
          <label className="ci-label">Your State</label>
          <select className="ci-select" value={stateCode}
            onChange={e => setStateCode(e.target.value as StateCode)}>
            {Object.entries(INDIA_STATES).map(([code, info]) => (
              <option key={code} value={code}>
                {info.name} — ₹{info.tariff}/kWh
              </option>
            ))}
          </select>
          <p className="ci-help">Domestic electricity tariff (first 200 units slab)</p>
        </div>

        <div className="ci-field-group">
          <label className="ci-label">Vehicle Segment</label>
          <div className="ci-seg-grid">
            {(["2W", "3W", "car", "suv"] as VehicleSegment[]).map(s => (
              <button key={s}
                className={`ci-seg-btn${segment === s ? " active" : ""}`}
                onClick={() => setSegment(s)}>
                {s === "2W" ? "🛵 2W" : s === "3W" ? "🛺 3W" : s === "car" ? "🚗 Car" : "🚙 SUV"}
              </button>
            ))}
          </div>
          <p className="ci-help">Sets default energy consumption ({SEGMENT_DEFAULTS[segment].evEfficiencyWhKm} Wh/km)</p>
        </div>

        <div className="ci-field-group">
          <label className="ci-label">Monthly Distance</label>
          <div className="ci-slider-row">
            <input type="range" min={200} max={5000} step={100}
              value={monthlyKm} onChange={e => setMonthlyKm(+e.target.value)} />
            <input type="number" className="ci-num" value={monthlyKm}
              onChange={e => setMonthlyKm(+e.target.value)} />
            <span className="ci-unit">km/mo</span>
          </div>
        </div>

        <div className="ci-field-group">
          <label className="ci-label">
            Home Charging Split — <strong>{homePct}% home / {100 - homePct}% public</strong>
          </label>
          <input type="range" className="ci-range-full" min={0} max={100} step={5}
            value={homePct} onChange={e => setHomePct(+e.target.value)} />
          <div className="ci-range-labels">
            <span>0% home</span><span>50/50</span><span>100% home</span>
          </div>
        </div>

        <div className="ci-field-group">
          <label className="ci-label">Public Charger Type</label>
          <div className="ci-radio-row">
            {(Object.entries(INDIA_EVSE_RATES) as [keyof typeof INDIA_EVSE_RATES, typeof INDIA_EVSE_RATES[keyof typeof INDIA_EVSE_RATES]][]).map(([key, val]) => (
              <label key={key} className={`ci-radio${evseType === key ? " active" : ""}`}>
                <input type="radio" name="evse" checked={evseType === key}
                  onChange={() => setEvseType(key)} />
                {val.label.split("(")[0].trim()}
                <span className="ci-radio-rate">₹{val.ratePerKwh}/kWh</span>
              </label>
            ))}
          </div>
        </div>

        <div className="ci-section-divider">Compare with Petrol</div>

        <div className="ci-two-col">
          <div className="ci-field-group">
            <label className="ci-label">Petrol Price</label>
            <div className="ci-slider-row">
              <input type="range" min={80} max={140} step={1}
                value={petrolPrice} onChange={e => setPetrolPrice(+e.target.value)} />
              <input type="number" className="ci-num" value={petrolPrice}
                onChange={e => setPetrolPrice(+e.target.value)} />
              <span className="ci-unit">₹/L</span>
            </div>
          </div>
          <div className="ci-field-group">
            <label className="ci-label">ICE Mileage</label>
            <div className="ci-slider-row">
              <input type="range" min={5} max={60} step={1}
                value={petrolMileage} onChange={e => setPetrolMileage(+e.target.value)} />
              <input type="number" className="ci-num" value={petrolMileage}
                onChange={e => setPetrolMileage(+e.target.value)} />
              <span className="ci-unit">km/L</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Results ─────────────────────────────────────────────────── */}
      <div className="calc-india-results">
        <div className="ci-hero-grid">
          <div className="ci-hero-card accent">
            <div className="ci-hero-val">{fmtINR(Math.round(result.totalMonthly))}/mo</div>
            <div className="ci-hero-label">Total monthly charging cost</div>
          </div>
          <div className="ci-hero-card green">
            <div className="ci-hero-val">{fmtINR(Math.round(result.annualSavingVsPetrol))}/yr</div>
            <div className="ci-hero-label">Annual saving vs petrol</div>
          </div>
          <div className="ci-hero-card neutral">
            <div className="ci-hero-val">₹{result.perKmCost.toFixed(2)}/km</div>
            <div className="ci-hero-label">Per-km charging cost</div>
          </div>
        </div>

        <div className="ci-breakdown">
          <div className="ci-breakdown-title">Monthly Cost Breakdown</div>
          <table className="ci-table">
            <thead>
              <tr><th>Source</th><th>Energy</th><th>Rate</th><th>Cost</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>🏠 Home charging ({homePct}%)</td>
                <td>{result.homeKwh.toFixed(1)} kWh</td>
                <td>₹{state.tariff}/kWh</td>
                <td>{fmtINR(Math.round(result.homeChargingCost))}</td>
              </tr>
              <tr>
                <td>⚡ Public charging ({100 - homePct}%)</td>
                <td>{result.publicKwh.toFixed(1)} kWh</td>
                <td>₹{evse.ratePerKwh}/kWh</td>
                <td>{fmtINR(Math.round(result.publicChargingCost))}</td>
              </tr>
              <tr className="ci-total-row">
                <td>Total EV charging</td>
                <td>{result.monthlyKwh.toFixed(1)} kWh</td>
                <td>—</td>
                <td>{fmtINR(Math.round(result.totalMonthly))}</td>
              </tr>
              <tr className="ci-compare-row">
                <td>🛢 Petrol equivalent</td>
                <td>—</td>
                <td>₹{petrolPrice}/L @ {petrolMileage} km/L</td>
                <td>{fmtINR(Math.round(result.petrolMonthlyCost))}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="ci-chart-wrap">
          <div className="ci-chart-title">Monthly Charging Cost by State (home {homePct}% + public {100-homePct}%)</div>
          <ResponsiveContainer width="99%" height={260}>
            <BarChart data={result.stateChart} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="state" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={v => `₹${v}`} />
              <Tooltip formatter={(v: unknown) => fmtINR(Number(v))}
                contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8 }} />
              <Legend />
              <Bar dataKey="home"   name="Home charging" fill="#00c4df" stackId="a" radius={[0,0,0,0]} />
              <Bar dataKey="public" name="Public charging" fill="#f0b429" stackId="a" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="ci-chart-caption">Stacked bars show total charging cost across all Indian states for your usage pattern.</p>
        </div>
      </div>
    </div>
  );
}
