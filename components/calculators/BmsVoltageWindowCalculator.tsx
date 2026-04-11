"use client";

import { useMemo, useState } from "react";
import { NumberField, downloadCsv, toCsv, useShareUrl } from "./common";

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

  const result = useMemo(() => {
    const packMin = inputs.cellMinV * inputs.sCount;
    const packNom = inputs.cellNomV * inputs.sCount;
    const packMax = inputs.cellMaxV * inputs.sCount;

    const balancingHeadroomMv = (inputs.cellMaxV - inputs.balanceStartV) * 1000;

    const minValid = inputs.cellMinV >= 2.5;
    const maxValid = inputs.cellMaxV <= 4.25;
    const balanceValid = inputs.balanceStartV > inputs.cellNomV && inputs.balanceStartV < inputs.cellMaxV;
    const aisStyle = minValid && maxValid && balanceValid;

    return {
      packMin,
      packNom,
      packMax,
      balancingHeadroomMv,
      aisStyle,
      minValid,
      maxValid,
      balanceValid,
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
        <NumberField label="Cell Min Voltage" value={inputs.cellMinV} min={2} max={3.5} step={0.01} unit="V" onChange={(value) => setInputs((p) => ({ ...p, cellMinV: value }))} />
        <NumberField label="Cell Nominal Voltage" value={inputs.cellNomV} min={2.3} max={3.8} step={0.01} unit="V" onChange={(value) => setInputs((p) => ({ ...p, cellNomV: value }))} />
        <NumberField label="Cell Max Voltage" value={inputs.cellMaxV} min={3.2} max={4.3} step={0.01} unit="V" onChange={(value) => setInputs((p) => ({ ...p, cellMaxV: value }))} />
        <NumberField label="Series Count" value={inputs.sCount} min={8} max={300} step={1} onChange={(value) => setInputs((p) => ({ ...p, sCount: Math.round(value) }))} />
        <NumberField label="Balancing Start Voltage" value={inputs.balanceStartV} min={2.8} max={4.2} step={0.01} unit="V" onChange={(value) => setInputs((p) => ({ ...p, balanceStartV: value }))} />

        <div className="calc-actions">
          <button className="calc-btn" type="button" onClick={() => downloadCsv("bms-window.csv", toCsv([{ pack_min_v: result.packMin.toFixed(1), pack_nom_v: result.packNom.toFixed(1), pack_max_v: result.packMax.toFixed(1), balancing_headroom_mv: result.balancingHeadroomMv.toFixed(0), ais_style_ok: result.aisStyle ? "yes" : "no" }]))}>Export CSV</button>
          <a className="calc-link" href={shareUrl}>Share Config URL</a>
        </div>
      </section>

      <section className="calc-panel">
        <div className="calc-results-grid">
          <article className="result-card"><p>Pack Min Voltage</p><h4>{result.packMin.toFixed(1)} V</h4></article>
          <article className="result-card"><p>Pack Nominal Voltage</p><h4>{result.packNom.toFixed(1)} V</h4></article>
          <article className="result-card"><p>Pack Max Voltage</p><h4>{result.packMax.toFixed(1)} V</h4></article>
          <article className="result-card"><p>Balancing Headroom</p><h4>{result.balancingHeadroomMv.toFixed(0)} mV</h4></article>
        </div>

        <div className={`calc-alert ${result.aisStyle ? "ok" : "danger"}`}>
          {result.aisStyle ? "Voltage window and balancing threshold are in a compliant-like zone" : "Voltage window is outside recommended guardrails"}
        </div>

        <ul className="calc-checks">
          <li className={result.minValid ? "ok" : "danger"}>Minimum cell voltage &gt;= 2.5 V</li>
          <li className={result.maxValid ? "ok" : "danger"}>Maximum cell voltage &lt;= 4.25 V</li>
          <li className={result.balanceValid ? "ok" : "danger"}>Balancing starts between nominal and maximum</li>
        </ul>
      </section>
    </div>
  );
}
