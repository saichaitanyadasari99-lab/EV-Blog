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
  Area,
} from "recharts";
import { NumberField, downloadCsv, toCsv, useShareUrl, InputSection, StepByStep } from "./common";

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
  const [showSteps, setShowSteps] = useState(false);

  const result = useMemo(() => {
    const start = Math.min(inputs.startSoc, inputs.targetSoc - 1);
    const target = Math.max(inputs.targetSoc, start + 1);
    const cvStart = Math.min(Math.max(inputs.cvStartSoc, start + 1), target - 1);

    const maxCcPower = inputs.packKwh * inputs.cRateLimit;
    const ccPower = Math.min(inputs.chargerKw, maxCcPower);
    const chargerLimited = inputs.chargerKw < maxCcPower;

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

    const steps = [
      {
        title: "CC Phase Energy",
        formula: `E_cc = (CV_start - Start_SOC) / 100 × Pack_Energy\n     = (${cvStart} - ${start}) / 100 × ${inputs.packKwh} kWh\n     = ${ccEnergy.toFixed(2)} kWh`,
        result: `${ccEnergy.toFixed(2)} kWh`,
      },
      {
        title: "CV Phase Energy",
        formula: `E_cv = (Target_SOC - CV_start) / 100 × Pack_Energy\n     = (${target} - ${cvStart}) / 100 × ${inputs.packKwh} kWh\n     = ${cvEnergy.toFixed(2)} kWh`,
        result: `${cvEnergy.toFixed(2)} kWh`,
      },
      {
        title: "CC Phase Power",
        formula: `P_cc = min(Charger, Pack × C_rate_limit)\n     = min(${inputs.chargerKw}, ${inputs.packKwh} × ${inputs.cRateLimit})\n     = min(${inputs.chargerKw}, ${maxCcPower.toFixed(1)}) kW\n     = ${ccPower.toFixed(1)} kW (${chargerLimited ? "charger limited" : "battery limited"})`,
        result: `${ccPower.toFixed(1)} kW`,
      },
      {
        title: "CC Phase Time",
        formula: `t_cc = E_cc / P_cc × 60\n     = ${ccEnergy.toFixed(2)} / ${ccPower.toFixed(1)} × 60\n     = ${ccMinutes.toFixed(1)} min`,
        result: `${ccMinutes.toFixed(1)} min`,
      },
      {
        title: "CV Phase Time",
        formula: `t_cv = E_cv / (P_cc × 0.58) × 60\n     = ${cvEnergy.toFixed(2)} / (${ccPower.toFixed(1)} × 0.58) × 60\n     = ${cvMinutes.toFixed(1)} min (tapering from ${ccPower.toFixed(1)} to ${(ccPower * 0.2).toFixed(1)} kW)`,
        result: `${cvMinutes.toFixed(1)} min`,
      },
    ];

    return {
      start,
      target,
      cvStart,
      ccPower,
      ccMinutes,
      cvMinutes,
      totalMinutes: ccMinutes + cvMinutes,
      chart,
      chargerLimited,
      steps,
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
        <InputSection title="Pack & Charger">
          <NumberField label="Pack Energy" value={inputs.packKwh} min={10} max={250} step={1} unit="kWh" onChange={(value) => setInputs((p) => ({ ...p, packKwh: value }))} />
          <NumberField label="Charger Power" value={inputs.chargerKw} min={3} max={400} step={1} unit="kW" onChange={(value) => setInputs((p) => ({ ...p, chargerKw: value }))} />
          <NumberField label="Battery C-rate Limit" value={inputs.cRateLimit} min={0.2} max={4} step={0.05} unit="C" onChange={(value) => setInputs((p) => ({ ...p, cRateLimit: value }))} />
        </InputSection>

        <InputSection title="SOC Targets">
          <NumberField label="Start SOC" value={inputs.startSoc} min={0} max={95} step={1} unit="%" onChange={(value) => setInputs((p) => ({ ...p, startSoc: value }))} />
          <NumberField label="Target SOC" value={inputs.targetSoc} min={5} max={100} step={1} unit="%" onChange={(value) => setInputs((p) => ({ ...p, targetSoc: value }))} />
          <NumberField label="CV Phase Starts" value={inputs.cvStartSoc} min={30} max={98} step={1} unit="%" onChange={(value) => setInputs((p) => ({ ...p, cvStartSoc: value }))} />
        </InputSection>

        <div className="calc-actions">
          <button className="calc-btn" type="button" onClick={() => downloadCsv("charging-time.csv", toCsv([{ total_minutes: result.totalMinutes.toFixed(1), cc_minutes: result.ccMinutes.toFixed(1), cv_minutes: result.cvMinutes.toFixed(1), cc_power_kw: result.ccPower.toFixed(1) }]))}>Export CSV</button>
          <a className="calc-link" href={shareUrl}>Share Config URL</a>
          <button className="calc-btn secondary" type="button" onClick={() => setShowSteps(!showSteps)}>
            {showSteps ? "Hide Steps" : "Show Calculation Steps"}
          </button>
        </div>
      </section>

      <section className="calc-panel">
        <div className="calc-results-grid">
          <article className="result-card"><p>CC Power</p><h4>{result.ccPower.toFixed(1)} kW</h4></article>
          <article className="result-card"><p>CC Duration</p><h4>{result.ccMinutes.toFixed(1)} min</h4></article>
          <article className="result-card"><p>CV Duration</p><h4>{result.cvMinutes.toFixed(1)} min</h4></article>
          <article className="result-card"><p>Total Time</p><h4>{result.totalMinutes.toFixed(1)} min</h4></article>
        </div>

        <div className={`calc-alert ${result.chargerLimited ? "warn" : "ok"}`}>
          {result.chargerLimited 
            ? `Charger limited: ${inputs.chargerKw}kW < battery max ${(inputs.packKwh * inputs.cRateLimit).toFixed(0)}kW`
            : `Battery limited: C-rate capped at ${inputs.cRateLimit}C (${(inputs.packKwh * inputs.cRateLimit).toFixed(0)}kW)`}
        </div>

        {showSteps && <StepByStep steps={result.steps} />}

        <div className="calc-chart">
          <h4>CC-CV Power Profile</h4>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={result.chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="soc" stroke="var(--text2)" label={{ value: "SOC (%)", position: "insideBottom", offset: -5 }} />
              <YAxis stroke="var(--text2)" label={{ value: "Power (kW)", angle: -90, position: "insideLeft" }} />
              <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)" }} />
              <ReferenceLine x={result.cvStart} stroke="#f97316" strokeDasharray="5 5" label={{ value: "CV Start", fill: "#f97316", fontSize: 10 }} />
              <ReferenceLine y={inputs.packKwh * inputs.cRateLimit} stroke="#ef4444" strokeDasharray="3 3" label={{ value: `Max C-rate (${inputs.cRateLimit}C)`, fill: "#ef4444", fontSize: 10 }} />
              <Area type="monotone" dataKey="powerKw" fill="var(--accent)" fillOpacity={0.2} stroke="transparent" />
              <Line type="monotone" dataKey="powerKw" stroke="var(--accent)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="calc-legend">
            <span><span className="legend-dot" style={{ background: "var(--accent)" }}></span> Charger Power</span>
            <span><span className="legend-dot" style={{ background: "#f97316" }}></span> CV Phase Start</span>
            <span><span className="legend-dot" style={{ background: "#ef4444" }}></span> C-rate Limit</span>
          </div>
        </div>
      </section>
    </div>
  );
}