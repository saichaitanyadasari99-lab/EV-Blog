"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  ComposedChart,
  Line,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
  ReferenceDot,
} from "recharts";
import { NumberField, downloadCsv, toCsv, useShareUrl, InputSection, StepByStep, shareResults } from "./common";

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
  const [showSteps, setShowSteps] = useState(false);

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

    const flowCurve = Array.from({ length: 20 }, (_, idx) => {
      const flow = 2 + idx * 1.2;
      const q = flow / 60_000;
      const vel = q / Math.max(totalArea, 1e-7);
      const re = (coolant.density * vel * hydraulicDiameter) / coolant.viscosity;
      const nu = re < 2300 ? 3.66 : 0.023 * Math.pow(re, 0.8) * Math.pow(prandtl, 0.4);
      const hLocal = (nu * coolant.thermalK) / hydraulicDiameter;
      const heatFlux = (hLocal * (inputs.outletTargetC - inputs.inletC)) / conductancePenalty;
      const fLocal = re < 2300 ? 64 / Math.max(re, 1) : 0.3164 / Math.pow(Math.max(re, 1), 0.25);
      const dpLocal = fLocal * (channelLengthM / Math.max(hydraulicDiameter, 1e-5)) * (coolant.density * vel * vel / 2);
      return {
        flowLpm: Number(flow.toFixed(1)),
        heatFlux: Number(heatFlux.toFixed(0)),
        pressureDrop: Number((dpLocal / 1000).toFixed(1)),
        reynolds: re,
      };
    });

    const pumpHeadM = (dpPa / (coolant.density * 9.81)).toFixed(2);

    const steps = [
      {
        title: "Hydraulic Diameter",
        formula: `D_h = (4 × A_cross) / Perimeter\n   = (4 × ${(areaOneChannel * 1e6).toFixed(1)}mm²) / (2 × (${inputs.channelWidthMm} + ${inputs.channelDepthMm})mm)\n   = ${(hydraulicDiameter * 1000).toFixed(2)} mm`,
        result: `${(hydraulicDiameter * 1000).toFixed(2)} mm`,
      },
      {
        title: "Reynolds Number",
        formula: `Re = (ρ × v × D_h) / μ\n   = (${coolant.density} × ${velocity.toFixed(4)} × ${(hydraulicDiameter * 1000).toFixed(2)}) / ${coolant.viscosity}\n   = ${reynolds.toFixed(0)}`,
        result: `${reynolds.toFixed(0)} - ${regime}`,
      },
      {
        title: "Nusselt Number",
        formula: regime === "laminar" 
          ? "Nu = 3.66 (constant wall temp, laminar)"
          : `Nu = 0.023 × Re^0.8 × Pr^0.4\n   = 0.023 × ${reynolds.toFixed(0)}^0.8 × ${prandtl.toFixed(2)}^0.4\n   = ${nusselt.toFixed(2)}`,
        result: `${nusselt.toFixed(2)}`,
      },
      {
        title: "Heat Transfer Coefficient",
        formula: `h = Nu × k_fluid / D_h\n   = ${nusselt.toFixed(2)} × ${coolant.thermalK} / ${(hydraulicDiameter * 1000).toFixed(3)}mm\n   = ${h.toFixed(0)} W/m²K`,
        result: `${h.toFixed(0)} W/m²K`,
      },
      {
        title: "Required Flow Rate",
        formula: `Q_req = P_heat / (ρ × Cp × ΔT)\n   = ${inputs.heatLoadW} / (${coolant.density} × ${coolant.cp} × ${deltaT})\n   = ${(requiredFlowM3s * 60_000).toFixed(2)} LPM`,
        result: `${requiredFlowLpm.toFixed(2)} LPM`,
      },
      {
        title: "Pressure Drop",
        formula: `ΔP = f × (L/D_h) × (ρv²/2)\n   = ${f.toFixed(4)} × (${channelLengthM.toFixed(3)} / ${(hydraulicDiameter * 1000).toFixed(3)}) × (${coolant.density} × ${velocity.toFixed(4)}² / 2)\n   = ${dpPa.toFixed(0)} Pa`,
        result: `${dpPa.toFixed(0)} Pa (${dpBar.toFixed(3)} bar)`,
      },
    ];

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
      hydraulicDiameter,
      steps,
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

  const shareResultsFn = () => {
    shareResults("Cooling Plate Sizing Results", {
      Coolant: inputs.coolant,
      Reynolds: results.reynolds.toFixed(0),
      Regime: results.regime,
      "Nusselt Number": results.nusselt.toFixed(2),
      "HTC": `${results.h.toFixed(0)} W/m²K`,
      "Required Flow": `${results.requiredFlowLpm.toFixed(2)} LPM`,
      "Pressure Drop": `${results.dpPa.toFixed(0)} Pa`,
    });
  };

  const regimeClass = results.regime === "turbulent" ? "ok" : results.regime === "transition" ? "warn" : "danger";
  const flowSufficient = inputs.flowLpm >= results.requiredFlowLpm;

  return (
    <div className="calc-split">
      <section className="calc-panel">
        <InputSection title="Coolant Properties">
          <div className="input-group">
            <label>Coolant Type</label>
            <select value={inputs.coolant} onChange={(event) => setInputs((prev) => ({ ...prev, coolant: event.target.value as Coolant }))}>
              <option value="water-glycol">Water-glycol 50/50</option>
              <option value="water">Pure water</option>
              <option value="oil">Dielectric oil</option>
            </select>
          </div>

          <div className="input-group">
            <label>Plate Material</label>
            <select value={inputs.plateMaterial} onChange={(event) => setInputs((prev) => ({ ...prev, plateMaterial: event.target.value as PlateMaterial }))}>
              <option value="al6061">Al 6061 (167 W/mK)</option>
              <option value="al3003">Al 3003 (155 W/mK)</option>
              <option value="copper">Copper (385 W/mK)</option>
            </select>
          </div>

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
        </InputSection>

        <InputSection title="Channel Geometry">
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
        </InputSection>

        <InputSection title="Heat Source">
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
            label="Flow Rate"
            value={inputs.flowLpm}
            min={1}
            max={30}
            step={0.2}
            unit="LPM"
            onChange={(value) => setInputs((prev) => ({ ...prev, flowLpm: value }))}
          />
        </InputSection>

        <div className="calc-actions">
          <button className="calc-btn" type="button" onClick={exportResults}>Export CSV</button>
          <button className="calc-btn" type="button" onClick={shareResultsFn}>Share Results</button>
          <a className="calc-link" href={shareUrl}>Share Config URL</a>
          <button className="calc-btn secondary" type="button" onClick={() => setShowSteps(!showSteps)}>
            {showSteps ? "Hide Steps" : "Show Calculation Steps"}
          </button>
        </div>
      </section>

      <section className="calc-panel">
        <div className="calc-results-grid">
          <article className="result-card"><p>Reynolds</p><h4>{results.reynolds.toFixed(0)}</h4></article>
          <article className="result-card"><p>Flow Regime</p><h4 className={regimeClass}>{results.regime}</h4></article>
          <article className="result-card"><p>Nusselt</p><h4>{results.nusselt.toFixed(2)}</h4></article>
          <article className="result-card"><p>Heat Transfer (h)</p><h4>{results.h.toFixed(0)} W/m²K</h4></article>
          <article className="result-card"><p>Required Flow</p><h4>{results.requiredFlowLpm.toFixed(2)} LPM</h4></article>
          <article className="result-card"><p>Pressure Drop</p><h4>{results.dpPa.toFixed(0)} Pa</h4></article>
        </div>

        <div className={`calc-alert ${flowSufficient ? "ok" : "warn"}`}>
          {flowSufficient 
            ? `Flow sufficient - ${inputs.flowLpm.toFixed(1)} LPM exceeds required ${results.requiredFlowLpm.toFixed(1)} LPM`
            : `Insufficient flow - ${inputs.flowLpm.toFixed(1)} LPM is below required ${results.requiredFlowLpm.toFixed(1)} LPM`}
        </div>

        {showSteps && <StepByStep steps={results.steps} />}

        <div className="calc-chart">
          <h4>Heat Transfer & Pressure Drop vs Flow Rate</h4>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={results.flowCurve}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="flowLpm" stroke="var(--text2)" label={{ value: "Flow Rate (LPM)", position: "insideBottom", offset: -5 }} />
              <YAxis yAxisId="left" stroke="var(--text2)" label={{ value: "Heat Flux (W/cm²)", angle: -90, position: "insideLeft" }} />
              <YAxis yAxisId="right" orientation="right" stroke="var(--text2)" label={{ value: "Pressure Drop (kPa)", angle: 90, position: "insideRight" }} />
              <Tooltip 
                contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                formatter={(value, name) => {
                  if (name === "heatFlux") return [`${value} W/cm²`, "Heat Flux"];
                  return [`${value} kPa`, "Pressure Drop"];
                }}
              />
              <ReferenceLine x={results.requiredFlowLpm} stroke="#22c55e" strokeDasharray="5 5" label={{ value: "Required", fill: "#22c55e", fontSize: 10 }} />
              <Line yAxisId="left" type="monotone" dataKey="heatFlux" stroke="var(--accent)" strokeWidth={2} dot={false} name="Heat Flux" />
              <Line yAxisId="right" type="monotone" dataKey="pressureDrop" stroke="#f97316" strokeWidth={2} dot={false} name="Pressure Drop" />
              <Area yAxisId="left" dataKey="heatFlux" fill="var(--accent)" fillOpacity={0.1} />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="calc-legend">
            <span><span className="legend-dot" style={{ background: "var(--accent)" }}></span> Heat Flux</span>
            <span><span className="legend-dot" style={{ background: "#f97316" }}></span> Pressure Drop</span>
            <span><span className="legend-dot" style={{ background: "#22c55e" }}></span> Your flow rate</span>
            <span><span className="legend-dot" style={{ background: "#22c55e" }}></span> Required flow</span>
          </div>
        </div>

        <div className="calc-dimensions">
          <h4>Flow Regime Zones</h4>
          <p>Re &lt; 2300: <span className="zone-label laminar">Laminar</span> | 2300-4000: <span className="zone-label transition">Transition</span> | Re &gt; 4000: <span className="zone-label turbulent">Turbulent</span></p>
        </div>
      </section>
    </div>
  );
}