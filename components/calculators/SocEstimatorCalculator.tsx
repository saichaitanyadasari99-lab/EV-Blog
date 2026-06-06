"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
  ReferenceDot,
} from "recharts";
import { NumberField, downloadCsv, toCsv, useShareUrl, InputSection, StepByStep, shareResults } from "./common";

type Chemistry = "lfp" | "nmc" | "nca" | "na-ion";

type Inputs = {
  chemistry: Chemistry;
  ocv: number;
  tempC: number;
  restTimeMin: number;
};

const LFP_DISCHARGE_CURVE = [
  { soc: 0, ocv: 2.50 }, { soc: 5, ocv: 2.90 }, { soc: 10, ocv: 3.05 }, { soc: 15, ocv: 3.15 },
  { soc: 20, ocv: 3.20 }, { soc: 25, ocv: 3.22 }, { soc: 30, ocv: 3.23 }, { soc: 35, ocv: 3.235 },
  { soc: 40, ocv: 3.24 }, { soc: 45, ocv: 3.25 }, { soc: 50, ocv: 3.26 }, { soc: 55, ocv: 3.27 },
  { soc: 60, ocv: 3.28 }, { soc: 65, ocv: 3.295 }, { soc: 70, ocv: 3.31 }, { soc: 75, ocv: 3.33 },
  { soc: 80, ocv: 3.36 }, { soc: 85, ocv: 3.40 }, { soc: 90, ocv: 3.46 }, { soc: 95, ocv: 3.55 },
  { soc: 100, ocv: 3.65 },
];

const LFP_CHARGE_CURVE = LFP_DISCHARGE_CURVE.map((p) => ({
  soc: p.soc,
  ocv: p.ocv + 0.08,
}));

const BASE_CURVES: Record<Chemistry, Array<{ soc: number; ocv: number }>> = {
  lfp: LFP_DISCHARGE_CURVE,
  nmc: [
    { soc: 0, ocv: 3.0 }, { soc: 10, ocv: 3.45 }, { soc: 20, ocv: 3.56 }, { soc: 30, ocv: 3.64 },
    { soc: 40, ocv: 3.7 }, { soc: 50, ocv: 3.75 }, { soc: 60, ocv: 3.81 }, { soc: 70, ocv: 3.89 },
    { soc: 80, ocv: 3.99 }, { soc: 90, ocv: 4.1 }, { soc: 100, ocv: 4.2 },
  ],
  nca: [
    { soc: 0, ocv: 3.0 }, { soc: 10, ocv: 3.48 }, { soc: 20, ocv: 3.6 }, { soc: 30, ocv: 3.67 },
    { soc: 40, ocv: 3.74 }, { soc: 50, ocv: 3.8 }, { soc: 60, ocv: 3.86 }, { soc: 70, ocv: 3.93 },
    { soc: 80, ocv: 4.03 }, { soc: 90, ocv: 4.13 }, { soc: 100, ocv: 4.22 },
  ],
  "na-ion": [
    { soc: 0, ocv: 2.2 }, { soc: 10, ocv: 2.48 }, { soc: 20, ocv: 2.57 }, { soc: 30, ocv: 2.65 },
    { soc: 40, ocv: 2.72 }, { soc: 50, ocv: 2.79 }, { soc: 60, ocv: 2.87 }, { soc: 70, ocv: 2.95 },
    { soc: 80, ocv: 3.02 }, { soc: 90, ocv: 3.1 }, { soc: 100, ocv: 3.19 },
  ],
};

const CHARGE_CURVES: Record<Chemistry, Array<{ soc: number; ocv: number }>> = {
  lfp: LFP_CHARGE_CURVE,
  nmc: BASE_CURVES.nmc.map((p) => ({ ...p, ocv: p.ocv + 0.05 })),
  nca: BASE_CURVES.nca.map((p) => ({ ...p, ocv: p.ocv + 0.04 })),
  "na-ion": BASE_CURVES["na-ion"].map((p) => ({ ...p, ocv: p.ocv + 0.06 })),
};

const LFP_PLATEAU_RANGE = { minSoc: 20, maxSoc: 80, minV: 3.2, maxV: 3.35 };
const NMC_PLATEAU_RANGE = { minSoc: 40, maxSoc: 80, minV: 3.7, maxV: 3.9 };

function estimateSoc(curve: Array<{ soc: number; ocv: number }>, ocv: number) {
  if (ocv <= curve[0].ocv) return 0;
  if (ocv >= curve[curve.length - 1].ocv) return 100;

  for (let idx = 1; idx < curve.length; idx += 1) {
    const prev = curve[idx - 1];
    const next = curve[idx];
    if (ocv >= prev.ocv && ocv <= next.ocv) {
      const ratio = (ocv - prev.ocv) / (next.ocv - prev.ocv);
      return prev.soc + (next.soc - prev.soc) * ratio;
    }
  }
  return 50;
}

function getUncertainty(chemistry: Chemistry, ocv: number) {
  if (chemistry === "lfp") {
    if (ocv >= LFP_PLATEAU_RANGE.minV && ocv <= LFP_PLATEAU_RANGE.maxV) {
      return { level: "high", range: "±30%", description: "In LFP plateau region - OCV-SOC unreliable" };
    }
  } else if (chemistry === "nmc" || chemistry === "nca") {
    if (ocv >= NMC_PLATEAU_RANGE.minV && ocv <= NMC_PLATEAU_RANGE.maxV) {
      return { level: "medium", range: "±10%", description: "In NMC plateau region - moderate uncertainty" };
    }
  }
  return { level: "low", range: "±5%", description: "Outside plateau - reliable estimate" };
}

export function SocEstimatorCalculator() {
  const [inputs, setInputs] = useState<Inputs>({ chemistry: "lfp", ocv: 3.25, tempC: 25, restTimeMin: 30 });
  const [showSteps, setShowSteps] = useState(false);

  const result = useMemo(() => {
    const baseDischarge = BASE_CURVES[inputs.chemistry];
    const baseCharge = CHARGE_CURVES[inputs.chemistry];
    
    const tempOffset = (inputs.tempC - 25) * (inputs.chemistry === "lfp" ? -0.0002 : -0.0008);
    
    const adjustedDischarge = baseDischarge.map((p) => ({ 
      soc: p.soc, 
      ocv: Number((p.ocv + tempOffset).toFixed(4)),
      type: "discharge"
    }));
    
    const adjustedCharge = baseCharge.map((p) => ({ 
      soc: p.soc, 
      ocv: Number((p.ocv + tempOffset).toFixed(4)),
      type: "charge"
    }));

    const socDischarge = estimateSoc(adjustedDischarge, inputs.ocv);
    const socCharge = estimateSoc(adjustedCharge, inputs.ocv);
    
    const soc = (socDischarge + socCharge) / 2;
    
    const uncertainty = getUncertainty(inputs.chemistry, inputs.ocv);
    
    const restFactor = Math.min(1, inputs.restTimeMin / 60);
    const adjustedSoc = soc * restFactor + socDischarge * (1 - restFactor);
    
    const steps = [
      {
        title: "Temperature Correction",
        formula: `OCV_corrected = OCV_measured - (dOCV/dT × (T - 25))\nFor ${inputs.chemistry.toUpperCase()}: dOCV/dT = ${Math.abs(tempOffset / (inputs.tempC - 25) * 1000).toFixed(2)} mV/°C\nOCV at 25°C = ${inputs.ocv.toFixed(3)}V - (${tempOffset.toFixed(4)}V) = ${(inputs.ocv - tempOffset).toFixed(3)}V`,
        result: `${(inputs.ocv - tempOffset).toFixed(3)}V adjusted`,
      },
      {
        title: "SOC Lookup (Discharge Curve)",
        formula: `Using ${inputs.chemistry.toUpperCase()} OCV-SOC table\nOCV = ${(inputs.ocv - tempOffset).toFixed(3)}V → interpolate`,
        result: `~${socDischarge.toFixed(1)}% (discharge)`,
      },
      {
        title: "SOC Lookup (Charge Curve)",
        formula: `Using ${inputs.chemistry.toUpperCase()} charge curve\nOCV = ${(inputs.ocv - tempOffset).toFixed(3)}V → interpolate`,
        result: `~${socCharge.toFixed(1)}% (charge)`,
      },
      {
        title: "Rest Time Adjustment",
        formula: `Rest factor: ${inputs.restTimeMin}min → ${(restFactor * 100).toFixed(0)}% equilibrium\nAdjusted SOC = ${soc.toFixed(1)} × ${restFactor.toFixed(2)} + ${socDischarge.toFixed(1)} × ${(1 - restFactor).toFixed(2)}`,
        result: `${adjustedSoc.toFixed(1)}%`,
      },
      {
        title: "Uncertainty Assessment",
        formula: uncertainty.description,
        result: `${uncertainty.range} uncertainty (${uncertainty.level.toUpperCase()})`,
      },
    ];

    return { 
      adjustedDischarge, 
      adjustedCharge,
      soc: adjustedSoc,
      uncertainty,
      steps,
    };
  }, [inputs]);

  const shareUrl = useShareUrl("soc-estimator", {
    chem: inputs.chemistry,
    ocv: inputs.ocv,
    t: inputs.tempC,
    rest: inputs.restTimeMin,
  });

  const shareResultsFn = () => {
    shareResults("SOC Estimator Results", {
      Chemistry: inputs.chemistry,
      "Measured OCV": `${inputs.ocv} V`,
      "Temperature": `${inputs.tempC}°C`,
      "Rest Time": `${inputs.restTimeMin} min`,
      "Estimated SOC": `${(result.soc * 100).toFixed(1)}%`,
      "Uncertainty": result.uncertainty.range,
    });
  };

  return (
    <div className="calc-split">
      <section className="calc-panel">
        <InputSection title="Cell & Measurement">
          <div className="input-group">
            <label>Chemistry</label>
            <select value={inputs.chemistry} onChange={(e) => setInputs((p) => ({ ...p, chemistry: e.target.value as Chemistry }))}>
              <option value="lfp">LFP (LiFePO4)</option>
              <option value="nmc">NMC (LiNiMnCo)</option>
              <option value="nca">NCA (LiNiCoAl)</option>
              <option value="na-ion">Na-ion</option>
            </select>
          </div>

          <NumberField 
            label="Measured OCV" 
            value={inputs.ocv} 
            min={2} 
            max={4.3} 
            step={0.001} 
            unit="V" 
            onChange={(value) => setInputs((p) => ({ ...p, ocv: value }))} 
          />

          <NumberField 
            label="Rest Time" 
            value={inputs.restTimeMin} 
            min={5} 
            max={120} 
            step={5} 
            unit="min" 
            onChange={(value) => setInputs((p) => ({ ...p, restTimeMin: value }))} 
          />
        </InputSection>

        <InputSection title="Thermal Correction">
          <NumberField 
            label="Cell Temperature" 
            value={inputs.tempC} 
            min={-10} 
            max={60} 
            step={1} 
            unit="C" 
            onChange={(value) => setInputs((p) => ({ ...p, tempC: value }))} 
          />
        </InputSection>

        <div className="calc-actions">
          <button
            type="button"
            className="calc-btn"
            onClick={() => downloadCsv("soc-estimate.csv", toCsv([{ 
              chemistry: inputs.chemistry, 
              ocv: inputs.ocv, 
              temp_c: inputs.tempC, 
              rest_min: inputs.restTimeMin,
              soc: result.soc.toFixed(1),
              uncertainty: result.uncertainty.range 
            }]))}
          >
            Export CSV
          </button>
          <button className="calc-btn" type="button" onClick={shareResultsFn}>Share Results</button>
          <a className="calc-link" href={shareUrl}>Share Config URL</a>
          <button className="calc-btn secondary" type="button" onClick={() => setShowSteps(!showSteps)}>
            {showSteps ? "Hide Steps" : "Show Calculation Steps"}
          </button>
        </div>
      </section>

      <section className="calc-panel">
        <div className="calc-results-grid">
          <article className="result-card">
            <p>Estimated SOC</p>
            <h4>{result.soc.toFixed(1)} %</h4>
          </article>
          <article className="result-card">
            <p>Uncertainty</p>
            <h4 className={result.uncertainty.level === "high" ? "danger" : result.uncertainty.level === "medium" ? "warn" : "ok"}>
              {result.uncertainty.range}
            </h4>
          </article>
        </div>

        <div className={`calc-alert ${result.uncertainty.level === "high" ? "warn" : result.uncertainty.level === "medium" ? "ok" : "ok"}`}>
          {result.uncertainty.description}
        </div>

        {showSteps && <StepByStep steps={result.steps} />}

        <div className="calc-chart">
          <h4>OCV-SOC Curve with Hysteresis</h4>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="soc" stroke="var(--text2)" label={{ value: "SOC (%)", position: "insideBottom", offset: -5 }} />
              <YAxis stroke="var(--text2)" label={{ value: "OCV (V)", angle: -90, position: "insideLeft" }} />
              <Tooltip 
                contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                formatter={(value) => [`${Number(value).toFixed(3)} V`, "OCV"]}
              />
              <ReferenceLine x={inputs.restTimeMin < 30 ? 20 : 50} stroke="var(--text2)" strokeDasharray="3 3" opacity={0.5} />
              <Area 
                data={result.adjustedCharge.map((p, i) => ({ 
                  soc: p.soc, 
                  charge: p.ocv, 
                  discharge: result.adjustedDischarge[i]?.ocv 
                })).filter(d => d.discharge)}
                type="monotone"
                dataKey="charge"
                stroke="transparent"
                fill="var(--accent)"
                fillOpacity={0.1}
                name="Hysteresis Band"
              />
              <Line 
                data={result.adjustedDischarge} 
                type="monotone" 
                dataKey="ocv" 
                stroke="var(--accent)" 
                strokeWidth={2} 
                dot={false} 
                name="Discharge (nominal)"
              />
              <Line 
                data={result.adjustedCharge} 
                type="monotone" 
                dataKey="ocv" 
                stroke="#f97316" 
                strokeWidth={1.5} 
                strokeDasharray="5 5"
                dot={false} 
                name="Charge (+80mV offset)"
              />
              <ReferenceDot 
                x={result.soc} 
                y={inputs.ocv} 
                r={6} 
                fill="#22c55e" 
                stroke="white" 
                strokeWidth={2} 
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="calc-legend">
            <span><span className="legend-dot" style={{ background: "var(--accent)" }}></span> Discharge</span>
            <span><span className="legend-dot" style={{ background: "#f97316" }}></span> Charge</span>
            <span><span className="legend-dot" style={{ background: "#22c55e" }}></span> Your measurement</span>
          </div>
        </div>

        {inputs.chemistry === "lfp" && (
          <div className="calc-note">
            <strong>LFP Note:</strong> The flat plateau (3.2-3.3V from 20-80% SOC) makes OCV-SOC lookup unreliable in this region. Consider using coulomb counting for better accuracy.
          </div>
        )}
      </section>
    </div>
  );
}
