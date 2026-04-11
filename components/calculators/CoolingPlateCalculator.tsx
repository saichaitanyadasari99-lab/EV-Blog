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

type Coolant = "water-glycol" | "water" | "oil";
type PlateMaterial = "al6061" | "al3003" | "copper";

const COOLANT_DATA: Record<Coolant, { density: number; cp: number; viscosity: number; thermalK: number }> = {
  "water-glycol": { density: 1040, cp: 3500, viscosity: 0.0035, thermalK: 0.41 },
  water: { density: 998, cp: 4186, viscosity: 0.0010, thermalK: 0.60 },
  oil: { density: 870, cp: 2100, viscosity: 0.0190, thermalK: 0.14 },
};

const MATERIAL_K: Record<PlateMaterial, number> = {
  al6061: 167,
  al3003: 155,
  copper: 385,
};

type Inputs = {
  coolant: Coolant;
  inletC: number;
  outletTargetC: number;
  flowLpm: number;
  channelWidthMm: number;
  channelDepthMm: number;
  channelCount: number;
  channelLengthMm: number;
  plateMaterial: PlateMaterial;
  heatLoadW: number;
};

const DEFAULTS: Inputs = {
  coolant: "water-glycol",
  inletC: 28,
  outletTargetC: 35,
  flowLpm: 8,
  channelWidthMm: 4,
  channelDepthMm: 2.5,
  channelCount: 10,
  channelLengthMm: 520,
  plateMaterial: "al6061",
  heatLoadW: 6500,
};

export function CoolingPlateCalculator() {
  const [inputs, setInputs] = useState<Inputs>(DEFAULTS);

  const results = useMemo(() => {
    const coolant = COOLANT_DATA[inputs.coolant];
    const areaOneChannel = (inputs.channelWidthMm / 1000) * (inputs.channelDepthMm / 1000);
    const totalArea = areaOneChannel * inputs.channelCount;

    const volumetricFlowM3s = inputs.flowLpm / 60_000;
    const velocity = volumetricFlowM3s / Math.max(totalArea, 1e-7);

    const hydraulicDiameter =
      (2 * (inputs.channelWidthMm / 1000) * (inputs.channelDepthMm / 1000)) /
      ((inputs.channelWidthMm + inputs.channelDepthMm) / 1000);

    const reynolds = (coolant.density * velocity * hydraulicDiameter) / coolant.viscosity;
    const regime = reynolds < 2300 ? "laminar" : reynolds < 4000 ? "transition" : "turbulent";

    const prandtl = (coolant.cp * coolant.viscosity) / coolant.thermalK;
    const nusselt = reynolds < 2300 ? 3.66 : 0.023 * Math.pow(reynolds, 0.8) * Math.pow(prandtl, 0.4);
    const h = (nusselt * coolant.thermalK) / hydraulicDiameter;

    const deltaT = Math.max(inputs.outletTargetC - inputs.inletC, 1);
    const requiredFlowM3s = inputs.heatLoadW / (coolant.density * coolant.cp * deltaT);
    const requiredFlowLpm = requiredFlowM3s * 60_000;

    const f = reynolds < 2300 ? 64 / Math.max(reynolds, 1) : 0.3164 / Math.pow(Math.max(reynolds, 1), 0.25);
    const channelLengthM = inputs.channelLengthMm / 1000;
    const dpPa = f * (channelLengthM / Math.max(hydraulicDiameter, 1e-5)) * (coolant.density * velocity * velocity / 2);
    const dpBar = dpPa / 100_000;

    const plateK = MATERIAL_K[inputs.plateMaterial];
    const conductancePenalty = 1 + 180 / plateK;

    const flowCurve = Array.from({ length: 12 }, (_, idx) => {
      const flow = 2 + idx * 1.5;
      const q = flow / 60_000;
      const vel = q / Math.max(totalArea, 1e-7);
      const re = (coolant.density * vel * hydraulicDiameter) / coolant.viscosity;
      const nu = re < 2300 ? 3.66 : 0.023 * Math.pow(re, 0.8) * Math.pow(prandtl, 0.4);
      const hLocal = (nu * coolant.thermalK) / hydraulicDiameter;
      const heatFlux = (hLocal * (inputs.outletTargetC - inputs.inletC)) / conductancePenalty;
      return { flowLpm: Number(flow.toFixed(1)), heatFlux: Number(heatFlux.toFixed(0)) };
    });

    const pumpHeadM = (dpPa / (coolant.density * 9.81)).toFixed(2);

    return {
      reynolds,
      regime,
      nusselt,
      h,
      requiredFlowLpm,
      dpPa,
      dpBar,
      pumpHeadM,
      flowCurve,
    };
  }, [inputs]);

  const shareUrl = useShareUrl("cooling-plate", {
    flow: inputs.flowLpm,
    q: inputs.heatLoadW,
    cool: inputs.coolant,
    w: inputs.channelWidthMm,
    d: inputs.channelDepthMm,
  });

  const exportResults = () => {
    const csv = toCsv([
      {
        coolant: inputs.coolant,
        reynolds: results.reynolds.toFixed(0),
        regime: results.regime,
        nusselt: results.nusselt.toFixed(2),
        heat_transfer_coefficient: results.h.toFixed(0),
        required_flow_lpm: results.requiredFlowLpm.toFixed(2),
        pressure_drop_pa: results.dpPa.toFixed(0),
        pressure_drop_bar: results.dpBar.toFixed(3),
      },
    ]);
    downloadCsv("cooling-system-sizing.csv", csv);
  };

  const regimeClass = results.regime === "turbulent" ? "ok" : results.regime === "transition" ? "warn" : "danger";

  return (
    <div className="calc-split">
      <section className="calc-panel">
        <div className="input-group">
          <label>Coolant</label>
          <select value={inputs.coolant} onChange={(event) => setInputs((prev) => ({ ...prev, coolant: event.target.value as Coolant }))}>
            <option value="water-glycol">Water-glycol 50/50</option>
            <option value="water">Pure water</option>
            <option value="oil">Dielectric oil</option>
          </select>
        </div>

        <div className="input-group">
          <label>Plate Material</label>
          <select value={inputs.plateMaterial} onChange={(event) => setInputs((prev) => ({ ...prev, plateMaterial: event.target.value as PlateMaterial }))}>
            <option value="al6061">Al 6061</option>
            <option value="al3003">Al 3003</option>
            <option value="copper">Copper</option>
          </select>
        </div>

        <NumberField
          label="Heat Load"
          value={inputs.heatLoadW}
          min={500}
          max={20000}
          step={100}
          unit="W"
          onChange={(value) => setInputs((prev) => ({ ...prev, heatLoadW: value }))}
        />

        <NumberField
          label="Inlet Temperature"
          value={inputs.inletC}
          min={5}
          max={60}
          step={1}
          unit="C"
          onChange={(value) => setInputs((prev) => ({ ...prev, inletC: value }))}
        />

        <NumberField
          label="Target Outlet Temperature"
          value={inputs.outletTargetC}
          min={10}
          max={75}
          step={1}
          unit="C"
          onChange={(value) => setInputs((prev) => ({ ...prev, outletTargetC: value }))}
        />

        <NumberField
          label="Flow Rate"
          value={inputs.flowLpm}
          min={1}
          max={30}
          step={0.2}
          unit="LPM"
          onChange={(value) => setInputs((prev) => ({ ...prev, flowLpm: value }))}
        />

        <NumberField
          label="Channel Width"
          value={inputs.channelWidthMm}
          min={1}
          max={12}
          step={0.1}
          unit="mm"
          onChange={(value) => setInputs((prev) => ({ ...prev, channelWidthMm: value }))}
        />

        <NumberField
          label="Channel Depth"
          value={inputs.channelDepthMm}
          min={0.6}
          max={8}
          step={0.1}
          unit="mm"
          onChange={(value) => setInputs((prev) => ({ ...prev, channelDepthMm: value }))}
        />

        <NumberField
          label="Number of Channels"
          value={inputs.channelCount}
          min={2}
          max={40}
          step={1}
          onChange={(value) => setInputs((prev) => ({ ...prev, channelCount: Math.round(value) }))}
        />

        <NumberField
          label="Channel Length"
          value={inputs.channelLengthMm}
          min={80}
          max={1200}
          step={10}
          unit="mm"
          onChange={(value) => setInputs((prev) => ({ ...prev, channelLengthMm: value }))}
        />

        <div className="calc-actions">
          <button className="calc-btn" type="button" onClick={exportResults}>Export CSV</button>
          <a className="calc-link" href={shareUrl}>Share Config URL</a>
        </div>
      </section>

      <section className="calc-panel">
        <div className="calc-results-grid">
          <article className="result-card"><p>Reynolds Number</p><h4>{results.reynolds.toFixed(0)}</h4></article>
          <article className="result-card"><p>Nusselt Number</p><h4>{results.nusselt.toFixed(2)}</h4></article>
          <article className="result-card"><p>Heat Transfer Coeff.</p><h4>{results.h.toFixed(0)} W/m2K</h4></article>
          <article className="result-card"><p>Required Flow</p><h4>{results.requiredFlowLpm.toFixed(2)} LPM</h4></article>
          <article className="result-card"><p>Pressure Drop</p><h4>{results.dpPa.toFixed(0)} Pa</h4></article>
          <article className="result-card"><p>Pressure Drop</p><h4>{results.dpBar.toFixed(3)} bar</h4></article>
        </div>

        <div className={`calc-alert ${regimeClass}`}>
          Flow regime: {results.regime}. Recommended pump head: {results.pumpHeadM} m, rated flow {Math.max(results.requiredFlowLpm, inputs.flowLpm).toFixed(1)} LPM.
        </div>

        <div className="calc-chart">
          <h4>Heat Flux vs Flow Rate</h4>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={results.flowCurve}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="flowLpm" stroke="var(--text2)" />
              <YAxis stroke="var(--text2)" />
              <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)" }} />
              <Line type="monotone" dataKey="heatFlux" stroke="var(--accent)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
