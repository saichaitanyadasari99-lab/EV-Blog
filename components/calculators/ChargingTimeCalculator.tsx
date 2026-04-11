"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { NumberField, downloadCsv, toCsv, useShareUrl } from "./common";

type Inputs = {
  packKwh: number;
  chargerKw: number;
  cRateLimit: number;
  startSoc: number;
  targetSoc: number;
  cvStartSoc: number;
};

export function ChargingTimeCalculator() {
  const [inputs, setInputs] = useState<Inputs>({
    packKwh: 72,
    chargerKw: 150,
    cRateLimit: 1.6,
    startSoc: 10,
    targetSoc: 80,
    cvStartSoc: 70,
  });

  const result = useMemo(() => {
    const start = Math.min(inputs.startSoc, inputs.targetSoc - 1);
    const target = Math.max(inputs.targetSoc, start + 1);
    const cvStart = Math.min(Math.max(inputs.cvStartSoc, start + 1), target - 1);

    const maxCcPower = inputs.packKwh * inputs.cRateLimit;
    const ccPower = Math.min(inputs.chargerKw, maxCcPower);

    const ccEnergy = ((cvStart - start) / 100) * inputs.packKwh;
    const cvEnergy = ((target - cvStart) / 100) * inputs.packKwh;

    const ccMinutes = (ccEnergy / ccPower) * 60;
    const cvMinutes = (cvEnergy / (ccPower * 0.58)) * 60;

    const chart = Array.from({ length: 21 }, (_, idx) => {
      const soc = start + ((target - start) * idx) / 20;
      const power = soc <= cvStart
        ? ccPower
        : ccPower * Math.max(0.2, 1 - ((soc - cvStart) / Math.max(target - cvStart, 1)) * 0.8);
      return { soc: Number(soc.toFixed(1)), powerKw: Number(power.toFixed(1)) };
    });

    return {
      start,
      target,
      cvStart,
      ccPower,
      ccMinutes,
      cvMinutes,
      totalMinutes: ccMinutes + cvMinutes,
      chart,
    };
  }, [inputs]);

  const shareUrl = useShareUrl("charging-time", {
    kwh: inputs.packKwh,
    ch: inputs.chargerKw,
    c: inputs.cRateLimit,
    s: inputs.startSoc,
    t: inputs.targetSoc,
  });

  return (
    <div className="calc-split">
      <section className="calc-panel">
        <NumberField label="Pack Energy" value={inputs.packKwh} min={10} max={250} step={1} unit="kWh" onChange={(value) => setInputs((p) => ({ ...p, packKwh: value }))} />
        <NumberField label="Charger Power" value={inputs.chargerKw} min={3} max={400} step={1} unit="kW" onChange={(value) => setInputs((p) => ({ ...p, chargerKw: value }))} />
        <NumberField label="Battery C-rate Limit" value={inputs.cRateLimit} min={0.2} max={4} step={0.05} unit="C" onChange={(value) => setInputs((p) => ({ ...p, cRateLimit: value }))} />
        <NumberField label="Start SOC" value={inputs.startSoc} min={0} max={95} step={1} unit="%" onChange={(value) => setInputs((p) => ({ ...p, startSoc: value }))} />
        <NumberField label="Target SOC" value={inputs.targetSoc} min={5} max={100} step={1} unit="%" onChange={(value) => setInputs((p) => ({ ...p, targetSoc: value }))} />
        <NumberField label="CV Phase Starts" value={inputs.cvStartSoc} min={30} max={98} step={1} unit="%" onChange={(value) => setInputs((p) => ({ ...p, cvStartSoc: value }))} />

        <div className="calc-actions">
          <button className="calc-btn" type="button" onClick={() => downloadCsv("charging-time.csv", toCsv([{ total_minutes: result.totalMinutes.toFixed(1), cc_minutes: result.ccMinutes.toFixed(1), cv_minutes: result.cvMinutes.toFixed(1), cc_power_kw: result.ccPower.toFixed(1) }]))}>Export CSV</button>
          <a className="calc-link" href={shareUrl}>Share Config URL</a>
        </div>
      </section>

      <section className="calc-panel">
        <div className="calc-results-grid">
          <article className="result-card"><p>CC Power</p><h4>{result.ccPower.toFixed(1)} kW</h4></article>
          <article className="result-card"><p>CC Duration</p><h4>{result.ccMinutes.toFixed(1)} min</h4></article>
          <article className="result-card"><p>CV Duration</p><h4>{result.cvMinutes.toFixed(1)} min</h4></article>
          <article className="result-card"><p>Total Charge Time</p><h4>{result.totalMinutes.toFixed(1)} min</h4></article>
        </div>

        <div className="calc-chart">
          <h4>CC-CV Power Profile</h4>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={result.chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="soc" stroke="var(--text2)" />
              <YAxis stroke="var(--text2)" />
              <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)" }} />
              <ReferenceLine x={result.cvStart} stroke="#ffb020" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="powerKw" stroke="var(--accent)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
