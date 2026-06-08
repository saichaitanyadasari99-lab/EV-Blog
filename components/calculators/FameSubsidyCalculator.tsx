"use client";

import { useMemo, useState } from "react";
import { INDIA_STATES, FAME_SUBSIDY, type StateCode, type VehicleCategory } from "@/lib/india-ev-data";

const fmtINR = (n: number) => "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

const CATEGORY_LABELS: Record<VehicleCategory, string> = {
  "2W":    "⚡ Electric 2-Wheeler",
  "3W":    "🛺 Electric 3-Wheeler",
  "4W":    "🚗 Electric Car / 4W",
  "eBus":  "🚌 Electric Bus",
  "eTruck":"🚛 Electric Truck",
};

const CATEGORY_ICONS: Record<VehicleCategory, string> = {
  "2W": "🛵", "3W": "🛺", "4W": "🚗", "eBus": "🚌", "eTruck": "🚛",
};

export function FameSubsidyCalculator() {
  const [category, setCategory] = useState<VehicleCategory>("2W");
  const [batteryKwh, setBatteryKwh] = useState(3.0);
  const [onRoadPrice, setOnRoadPrice] = useState(110000);
  const [stateCode, setStateCode] = useState<StateCode>("MH");

  const state = INDIA_STATES[stateCode];
  const fame = FAME_SUBSIDY[category];

  const result = useMemo(() => {
    // Central subsidy
    let centralSubsidy = 0;
    if (fame.centralPerKwh > 0) {
      centralSubsidy = Math.min(batteryKwh * fame.centralPerKwh, fame.maxCap);
    } else {
      centralSubsidy = fame.centralFlat;
    }

    // State subsidy (simplified — use stateEVSubsidy2W for 2W, car for 4W)
    const stateSubsidy =
      category === "2W" ? state.stateEVSubsidy2W :
      category === "4W" ? state.stateEVSubsidyCar : 0;

    // Road tax waiver (approximate — 6% of ex-showroom ~ 5% of on-road)
    const roadTaxWaiver = state.roadTaxExempt ? Math.round(onRoadPrice * 0.05) : 0;

    const totalIncentive = centralSubsidy + stateSubsidy + roadTaxWaiver;
    const netPrice = Math.max(0, onRoadPrice - totalIncentive);
    const incentivePct = (totalIncentive / onRoadPrice) * 100;

    return {
      centralSubsidy, stateSubsidy, roadTaxWaiver,
      totalIncentive, netPrice, incentivePct,
    };
  }, [category, batteryKwh, onRoadPrice, stateCode, fame, state]);

  const isEligible = fame.centralFlat > 0 || fame.centralPerKwh > 0;

  return (
    <div className="calc-india-wrap">
      {/* ── Inputs ─────────────────────────────────────────────────── */}
      <div className="calc-india-form">
        <div className="ci-field-group">
          <label className="ci-label">Vehicle Category</label>
          <div className="ci-cat-grid">
            {(Object.keys(CATEGORY_LABELS) as VehicleCategory[]).map(cat => (
              <button key={cat}
                className={`ci-cat-btn${category === cat ? " active" : ""}`}
                onClick={() => {
                  setCategory(cat);
                  if (cat === "2W") { setBatteryKwh(3); setOnRoadPrice(110000); }
                  if (cat === "3W") { setBatteryKwh(8); setOnRoadPrice(250000); }
                  if (cat === "4W") { setBatteryKwh(30); setOnRoadPrice(1200000); }
                  if (cat === "eBus") { setBatteryKwh(200); setOnRoadPrice(10000000); }
                  if (cat === "eTruck") { setBatteryKwh(150); setOnRoadPrice(5000000); }
                }}>
                <span className="ci-cat-icon">{CATEGORY_ICONS[cat]}</span>
                <span className="ci-cat-label">{cat}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="ci-field-group">
          <label className="ci-label">Battery Capacity</label>
          <div className="ci-slider-row">
            <input type="range"
              min={category === "2W" ? 1 : category === "3W" ? 4 : category === "4W" ? 15 : 80}
              max={category === "2W" ? 10 : category === "3W" ? 20 : category === "4W" ? 100 : 400}
              step={category === "2W" ? 0.5 : 5}
              value={batteryKwh} onChange={e => setBatteryKwh(+e.target.value)} />
            <input type="number" className="ci-num" value={batteryKwh} step="0.5"
              onChange={e => setBatteryKwh(+e.target.value)} />
            <span className="ci-unit">kWh</span>
          </div>
          <p className="ci-help">
            {category === "2W" ? "Typical 2W EVs: 2–6 kWh (e.g. Ather 450X = 3.7 kWh)" :
             category === "3W" ? "Typical e-rickshaws: 5–15 kWh" :
             category === "4W" ? "Typical cars: 25–75 kWh (Nexon EV = 40.5 kWh)" :
             "e-Buses: 100–400 kWh depending on length"}
          </p>
        </div>

        <div className="ci-field-group">
          <label className="ci-label">On-Road Price (before subsidies)</label>
          <div className="ci-prefix-row">
            <span className="ci-prefix">₹</span>
            <input type="number" className="ci-num-wide" value={onRoadPrice}
              onChange={e => setOnRoadPrice(+e.target.value)} />
          </div>
        </div>

        <div className="ci-field-group">
          <label className="ci-label">Your State</label>
          <select className="ci-select" value={stateCode}
            onChange={e => setStateCode(e.target.value as StateCode)}>
            {Object.entries(INDIA_STATES).map(([code, info]) => (
              <option key={code} value={code}>{info.name}</option>
            ))}
          </select>
          <p className="ci-help">Used to calculate state-level top-up subsidy and road tax waiver</p>
        </div>
      </div>

      {/* ── Results ─────────────────────────────────────────────────── */}
      <div className="calc-india-results">
        {!isEligible ? (
          <div className="ci-alert warn">
            <strong>No central subsidy currently available</strong> for {CATEGORY_LABELS[category]}.
            State subsidies and road tax waivers may still apply. Check your state EV policy.
          </div>
        ) : null}

        <div className="ci-hero-grid">
          <div className="ci-hero-card accent">
            <div className="ci-hero-val">{fmtINR(result.totalIncentive)}</div>
            <div className="ci-hero-label">Total incentive (central + state)</div>
          </div>
          <div className="ci-hero-card green">
            <div className="ci-hero-val">{fmtINR(result.netPrice)}</div>
            <div className="ci-hero-label">Effective price after all incentives</div>
          </div>
          <div className="ci-hero-card neutral">
            <div className="ci-hero-val">{result.incentivePct.toFixed(1)}%</div>
            <div className="ci-hero-label">Savings on on-road price</div>
          </div>
        </div>

        {/* Subsidy breakdown */}
        <div className="ci-breakdown">
          <div className="ci-breakdown-title">Incentive Breakdown</div>
          <div className="ci-subsidy-list">
            <div className={`ci-subsidy-row${result.centralSubsidy > 0 ? " active" : " inactive"}`}>
              <div className="ci-subsidy-icon">🏛</div>
              <div className="ci-subsidy-info">
                <div className="ci-subsidy-name">Central Subsidy (FAME-II / PM E-DRIVE)</div>
                <div className="ci-subsidy-desc">
                  {fame.centralPerKwh > 0
                    ? `₹${fame.centralPerKwh.toLocaleString("en-IN")}/kWh × ${batteryKwh} kWh = ${fmtINR(Math.round(batteryKwh * fame.centralPerKwh))} (cap: ${fmtINR(fame.maxCap)})`
                    : fmtINR(fame.centralFlat) + " flat"}
                </div>
              </div>
              <div className="ci-subsidy-amount">{fmtINR(result.centralSubsidy)}</div>
            </div>

            <div className={`ci-subsidy-row${result.stateSubsidy > 0 ? " active" : " inactive"}`}>
              <div className="ci-subsidy-icon">🏳</div>
              <div className="ci-subsidy-info">
                <div className="ci-subsidy-name">State Subsidy — {INDIA_STATES[stateCode].name}</div>
                <div className="ci-subsidy-desc">
                  {result.stateSubsidy > 0
                    ? `${INDIA_STATES[stateCode].name} provides ${fmtINR(result.stateSubsidy)} additional subsidy`
                    : "No additional state subsidy for this category in this state"}
                </div>
              </div>
              <div className="ci-subsidy-amount">{fmtINR(result.stateSubsidy)}</div>
            </div>

            <div className={`ci-subsidy-row${result.roadTaxWaiver > 0 ? " active" : " inactive"}`}>
              <div className="ci-subsidy-icon">📋</div>
              <div className="ci-subsidy-info">
                <div className="ci-subsidy-name">Road Tax Waiver</div>
                <div className="ci-subsidy-desc">
                  {state.roadTaxExempt
                    ? `${INDIA_STATES[stateCode].name} offers full road tax exemption (~5% of on-road price)`
                    : `${INDIA_STATES[stateCode].name} does not currently offer full road tax waiver`}
                </div>
              </div>
              <div className="ci-subsidy-amount">{fmtINR(result.roadTaxWaiver)}</div>
            </div>

            <div className="ci-subsidy-row total">
              <div className="ci-subsidy-icon">✅</div>
              <div className="ci-subsidy-info">
                <div className="ci-subsidy-name">Total Incentive</div>
                <div className="ci-subsidy-desc">{result.incentivePct.toFixed(1)}% of on-road price</div>
              </div>
              <div className="ci-subsidy-amount accent">{fmtINR(result.totalIncentive)}</div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="ci-policy-note">
          <div className="ci-policy-title">📌 Policy Note</div>
          <p>{fame.notes}</p>
          <p>Subsidy amounts subject to change. Verify with dealer and Ministry of Heavy Industries before purchase.</p>
        </div>
      </div>
    </div>
  );
}
