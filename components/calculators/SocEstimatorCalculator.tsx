"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { NumberField, downloadCsv, toCsv, useShareUrl } from "./common";

type Chemistry = "lfp" | "nmc" | "nca" | "na-ion";

type Inputs = {
  chemistry: Chemistry;
  ocv: number;
  tempC: number;
};

const CURVES: Record<Chemistry, Array<{ soc: number; ocv: number }>> = {
  lfp: [
    { soc: 0, ocv: 2.8 }, { soc: 10, ocv: 3.15 }, { soc: 20, ocv: 3.21 }, { soc: 30, ocv: 3.23 },
    { soc: 40, ocv: 3.25 }, { soc: 50, ocv: 3.27 }, { soc: 60, ocv: 3.29 }, { soc: 70, ocv: 3.31 },
    { soc: 80, ocv: 3.34 }, { soc: 90, ocv: 3.38 }, { soc: 100, ocv: 3.45 },
  ],
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

export function SocEstimatorCalculator() {
  const [inputs, setInputs] = useState<Inputs>({ chemistry: "lfp", ocv: 3.25, tempC: 25 });

  const result = useMemo(() => {
    const baseCurve = CURVES[inputs.chemistry];
    const tempOffset = (inputs.tempC - 25) * -0.0008;
    const adjustedCurve = baseCurve.map((p) => ({ ...p, ocv: Number((p.ocv + tempOffset).toFixed(4)) }));
    const soc = estimateSoc(adjustedCurve, inputs.ocv);
    return { adjustedCurve, soc };
  }, [inputs]);

  const shareUrl = useShareUrl("soc-estimator", {
    chem: inputs.chemistry,
    ocv: inputs.ocv,
    t: inputs.tempC,
  });

  return (
    <div className="calc-split">
      <section className="calc-panel">
        <div className="input-group">
          <label>Chemistry</label>
          <select value={inputs.chemistry} onChange={(e) => setInputs((p) => ({ ...p, chemistry: e.target.value as Chemistry }))}>
            <option value="lfp">LFP</option>
            <option value="nmc">NMC</option>
            <option value="nca">NCA</option>
            <option value="na-ion">Na-ion</option>
          </select>
        </div>
        <NumberField label="Measured OCV" value={inputs.ocv} min={2} max={4.3} step={0.001} unit="V" onChange={(value) => setInputs((p) => ({ ...p, ocv: value }))} />
        <NumberField label="Cell Temperature" value={inputs.tempC} min={-10} max={60} step={1} unit="C" onChange={(value) => setInputs((p) => ({ ...p, tempC: value }))} />

        <div className="calc-actions">
          <button
            type="button"
            className="calc-btn"
            onClick={() => downloadCsv("soc-estimate.csv", toCsv([{ chemistry: inputs.chemistry, ocv: inputs.ocv, temp_c: inputs.tempC, soc: result.soc.toFixed(1) }]))}
          >
            Export CSV
          </button>
          <a className="calc-link" href={shareUrl}>Share Config URL</a>
        </div>
      </section>

      <section className="calc-panel">
        <div className="calc-results-grid">
          <article className="result-card"><p>Estimated SOC</p><h4>{result.soc.toFixed(1)} %</h4></article>
        </div>

        <div className="calc-chart">
          <h4>OCV-SOC Curve</h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={result.adjustedCurve}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="soc" stroke="var(--text2)" />
              <YAxis stroke="var(--text2)" />
              <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)" }} />
              <Line dataKey="ocv" type="monotone" stroke="var(--accent)" strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
