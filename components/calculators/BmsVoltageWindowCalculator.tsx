"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
  Cell,
} from "recharts";
import { NumberField, downloadCsv, toCsv, useShareUrl, InputSection, StepByStep } from "./common";

type Inputs = {
  cellMinV: number;
  cellNomV: number;
  cellMaxV: number;
  sCount: number;
  balanceStartV: number;
};

export function BmsVoltageWindowCalculator() {
  const [inputs, setInputs] = useState<Inputs>({
    cellMinV: 2.8,
    cellNomV: 3.2,
    cellMaxV: 3.65,
    sCount: 120,
    balanceStartV: 3.45,
  });
  const [showSteps, setShowSteps] = useState(false);

  const result = useMemo(() => {
    const packMin = inputs.cellMinV * inputs.sCount;
    const packNom = inputs.cellNomV * inputs.sCount;
    const packMax = inputs.cellMaxV * inputs.sCount;

    const deadBandV = inputs.cellMinV;
    const usableV = inputs.balanceStartV - inputs.cellMinV;
    const balancingV = inputs.cellMaxV - inputs.balanceStartV;
    const ovpBufferV = inputs.cellMaxV * 0.05;

    const balancingHeadroomMv = (inputs.cellMaxV - inputs.balanceStartV) * 1000;
    const usableSoc = ((inputs.balanceStartV - inputs.cellMinV) / (inputs.cellMaxV - inputs.cellMinV)) * 100;

    const minValid = inputs.cellMinV >= 2.5;
    const maxValid = inputs.cellMaxV <= 4.25;
    const balanceValid = inputs.balanceStartV > inputs.cellNomV && inputs.balanceStartV < inputs.cellMaxV;
    const aisStyle = minValid && maxValid && balanceValid;

    const stackData = [
      { name: "Dead Band", value: inputs.cellMinV, color: "#ef4444", label: `${inputs.cellMinV.toFixed(2)}V` },
      { name: "Usable", value: usableV, color: "#22c55e", label: `${usableV.toFixed(2)}V (${usableSoc.toFixed(0)}% SOC)` },
      { name: "Balancing", value: balancingV, color: "#eab308", label: `${balancingV.toFixed(2)}V` },
      { name: "OVP Buffer", value: ovpBufferV, color: "#f97316", label: `${ovpBufferV.toFixed(2)}V` },
    ];

    const steps = [
      {
        title: "Pack Voltage Limits",
        formula: `V_pack_min = Cell_min × S = ${inputs.cellMinV} × ${inputs.sCount} = ${packMin.toFixed(1)} V\nV_pack_nom = Cell_nom × S = ${inputs.cellNomV} × ${inputs.sCount} = ${packNom.toFixed(1)} V\nV_pack_max = Cell_max × S = ${inputs.cellMaxV} × ${inputs.sCount} = ${packMax.toFixed(1)} V`,
        result: `${packMin.toFixed(1)} / ${packNom.toFixed(1)} / ${packMax.toFixed(1)} V`,
      },
      {
        title: "Usable SOC Window",
        formula: `Usable_range = (Balance_start - Cell_min) / (Cell_max - Cell_min)\n           = (${inputs.balanceStartV} - ${inputs.cellMinV}) / (${inputs.cellMaxV} - ${inputs.cellMinV})\n           = ${usableSoc.toFixed(1)}%`,
        result: `${usableSoc.toFixed(1)}% usable SOC window`,
      },
      {
        title: "Balancing Headroom",
        formula: `ΔV_balance = Cell_max - Balance_start\n           = ${inputs.cellMaxV} - ${inputs.balanceStartV}\n           = ${(inputs.cellMaxV - inputs.balanceStartV).toFixed(2)}V\nAt S=${inputs.sCount}: ΔV_pack = ${(inputs.cellMaxV - inputs.balanceStartV).toFixed(2)} × ${inputs.sCount} = ${balancingHeadroomMv.toFixed(0)} mV headroom`,
        result: `${balancingHeadroomMv.toFixed(0)} mV (per cell)`,
      },
      {
        title: "Compliance Check",
        formula: `Cell_min ≥ 2.5V (AIS-038 / UN ECE R100): ${inputs.cellMinV >= 2.5 ? "✓" : "✗"}\nCell_max ≤ 4.25V (standard NMC limit): ${inputs.cellMaxV <= 4.25 ? "✓" : "✗"}\nBalance start between nominal and max: ${balanceValid ? "✓" : "✗"}`,
        result: aisStyle ? "PASS - Compliant" : "FAIL - Review required",
      },
    ];

    return {
      packMin,
      packNom,
      packMax,
      balancingHeadroomMv,
      usableSoc,
      stackData,
      aisStyle,
      minValid,
      maxValid,
      balanceValid,
      steps,
    };
  }, [inputs]);

  const shareUrl = useShareUrl("bms-window-checker", {
    min: inputs.cellMinV,
    nom: inputs.cellNomV,
    max: inputs.cellMaxV,
    s: inputs.sCount,
    bal: inputs.balanceStartV,
  });

  return (
    <div className="calc-split">
      <section className="calc-panel">
        <InputSection title="Cell Voltage Thresholds">
          <NumberField label="Cell Min Voltage" value={inputs.cellMinV} min={2} max={3.5} step={0.01} unit="V" onChange={(value) => setInputs((p) => ({ ...p, cellMinV: value }))} />
          <NumberField label="Cell Nominal Voltage" value={inputs.cellNomV} min={2.3} max={3.8} step={0.01} unit="V" onChange={(value) => setInputs((p) => ({ ...p, cellNomV: value }))} />
          <NumberField label="Cell Max Voltage" value={inputs.cellMaxV} min={3.2} max={4.3} step={0.01} unit="V" onChange={(value) => setInputs((p) => ({ ...p, cellMaxV: value }))} />
        </InputSection>

        <InputSection title="Pack Topology">
          <NumberField label="Series Count" value={inputs.sCount} min={8} max={300} step={1} onChange={(value) => setInputs((p) => ({ ...p, sCount: Math.round(value) }))} />
        </InputSection>

        <InputSection title="Balancing">
          <NumberField label="Balancing Start Voltage" value={inputs.balanceStartV} min={2.8} max={4.2} step={0.01} unit="V" onChange={(value) => setInputs((p) => ({ ...p, balanceStartV: value }))} />
        </InputSection>

        <div className="calc-actions">
          <button className="calc-btn" type="button" onClick={() => downloadCsv("bms-window.csv", toCsv([{ pack_min_v: result.packMin.toFixed(1), pack_nom_v: result.packNom.toFixed(1), pack_max_v: result.packMax.toFixed(1), balancing_headroom_mv: result.balancingHeadroomMv.toFixed(0), ais_style_ok: result.aisStyle ? "yes" : "no" }]))}>Export CSV</button>
          <a className="calc-link" href={shareUrl}>Share Config URL</a>
          <button className="calc-btn secondary" type="button" onClick={() => setShowSteps(!showSteps)}>
            {showSteps ? "Hide Steps" : "Show Calculation Steps"}
          </button>
        </div>
      </section>

      <section className="calc-panel">
        <div className="calc-results-grid">
          <article className="result-card"><p>Pack Min Voltage</p><h4>{result.packMin.toFixed(1)} V</h4></article>
          <article className="result-card"><p>Pack Nominal Voltage</p><h4>{result.packNom.toFixed(1)} V</h4></article>
          <article className="result-card"><p>Pack Max Voltage</p><h4>{result.packMax.toFixed(1)} V</h4></article>
          <article className="result-card"><p>Balancing Headroom</p><h4>{result.balancingHeadroomMv.toFixed(0)} mV</h4></article>
          <article className="result-card"><p>Usable SOC</p><h4>{result.usableSoc.toFixed(1)}%</h4></article>
        </div>

        <div className={`calc-alert ${result.aisStyle ? "ok" : "danger"}`}>
          {result.aisStyle ? "Voltage window and balancing threshold are in a compliant-like zone" : "Voltage window is outside recommended guardrails"}
        </div>

        {showSteps && <StepByStep steps={result.steps} />}

        <div className="calc-chart">
          <h4>Cell Voltage Stack (Per Cell)</h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={result.stackData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" stroke="var(--text2)" label={{ value: "Voltage (V)", position: "insideBottom", offset: -5 }} />
              <YAxis type="category" dataKey="name" stroke="var(--text2)" width={100} />
              <Tooltip 
                contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                formatter={(value, name, props) => [String((props as { payload?: { label?: string } })?.payload?.label ?? value), String(name)]}
              />
              <ReferenceLine x={inputs.balanceStartV} stroke="#22c55e" strokeDasharray="5 5" label={{ value: "Balance", fill: "#22c55e", fontSize: 10 }} />
              <Bar dataKey="value" radius={4}>
                {result.stackData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="calc-legend">
            <span><span className="legend-dot" style={{ background: "#ef4444" }}></span> Dead Band</span>
            <span><span className="legend-dot" style={{ background: "#22c55e" }}></span> Usable</span>
            <span><span className="legend-dot" style={{ background: "#eab308" }}></span> Balancing</span>
            <span><span className="legend-dot" style={{ background: "#f97316" }}></span> OVP Buffer</span>
          </div>
        </div>

        <ul className="calc-checks">
          <li className={result.minValid ? "ok" : "danger"}>Minimum cell voltage &gt;= 2.5 V {result.minValid ? "✓" : "✗"}</li>
          <li className={result.maxValid ? "ok" : "danger"}>Maximum cell voltage &lt;= 4.25 V {result.maxValid ? "✓" : "✗"}</li>
          <li className={result.balanceValid ? "ok" : "danger"}>Balancing starts between nominal and max {result.balanceValid ? "✓" : "✗"}</li>
        </ul>
      </section>
    </div>
  );
}