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
  ComposedChart,
  Bar,
} from "recharts";
import { NumberField, downloadCsv, toCsv, useShareUrl, InputSection, StepByStep } from "./common";

type Material = "copper" | "aluminum";
type SurfaceFinish = "bare" | "tin" | "nickel";

type Inputs = {
  material: Material;
  operatingC: number;
  ambientC: number;
  continuousA: number;
  peakA: number;
  lengthMm: number;
  surface: SurfaceFinish;
  fusingRequired: boolean;
  selectedWidthMm: number;
};

const RESISTIVITY_20C: Record<Material, number> = {
  copper: 1.68e-8,
  aluminum: 2.82e-8,
};

const TEMP_COEFF: Record<Material, number> = {
  copper: 0.0039,
  aluminum: 0.0041,
};

const BASE_CURRENT_DENSITY: Record<Material, number> = {
  copper: 3.6,
  aluminum: 2.2,
};

const SURFACE_FACTOR: Record<SurfaceFinish, number> = {
  bare: 1,
  tin: 1.04,
  nickel: 0.96,
};

const DEFAULTS: Inputs = {
  material: "copper",
  operatingC: 70,
  ambientC: 30,
  continuousA: 350,
  peakA: 500,
  lengthMm: 400,
  surface: "tin",
  fusingRequired: true,
  selectedWidthMm: 30,
};

type ComparisonRow = {
  material: Material;
  requiredAreaMm2: number;
  resistanceMOhm: number;
  powerLossW: number;
  tempRiseC: number;
};

function computeForMaterial(inputs: Inputs, material: Material): ComparisonRow {
  const deltaT = Math.max(inputs.operatingC - inputs.ambientC, 1);
  const densityBase = BASE_CURRENT_DENSITY[material] * SURFACE_FACTOR[inputs.surface];
  const tempDerate = Math.max(0.45, 1 - deltaT / 190);
  const allowableDensity = densityBase * tempDerate;

  const requiredAreaCont = inputs.continuousA / Math.max(allowableDensity, 0.1);
  const requiredAreaPeak = inputs.peakA / Math.max(allowableDensity * 1.25, 0.1);
  const requiredAreaMm2 = Math.max(requiredAreaCont, requiredAreaPeak);

  const areaM2 = requiredAreaMm2 / 1_000_000;
  const lengthM = inputs.lengthMm / 1000;

  const rho20 = RESISTIVITY_20C[material];
  const rhoHot = rho20 * (1 + TEMP_COEFF[material] * (inputs.operatingC - 20));
  const resistance = (rhoHot * lengthM) / Math.max(areaM2, 1e-9);

  const resistanceMOhm = resistance * 1000;
  const powerLossW = inputs.continuousA * inputs.continuousA * resistance;

  const exposedAreaM2 = 2 * lengthM * Math.sqrt(areaM2);
  const convectionCoeff = 7.5;
  const tempRiseC = powerLossW / Math.max(exposedAreaM2 * convectionCoeff, 0.1);

  return {
    material,
    requiredAreaMm2,
    resistanceMOhm,
    powerLossW,
    tempRiseC,
  };
}

function dimensionOptions(requiredAreaMm2: number) {
  const widths = [20, 25, 30, 40, 50, 60, 80];
  return widths
    .map((width) => {
      const thickness = requiredAreaMm2 / width;
      return { width, thickness };
    })
    .filter((item) => item.thickness >= 1.2 && item.thickness <= 12)
    .slice(0, 4);
}

export function BusBarCalculator() {
  const [inputs, setInputs] = useState<Inputs>(DEFAULTS);
  const [showSteps, setShowSteps] = useState(false);

  const primary = useMemo(() => computeForMaterial(inputs, inputs.material), [inputs]);
  const comparison = useMemo<ComparisonRow[]>(
    () => [computeForMaterial(inputs, "copper"), computeForMaterial(inputs, "aluminum")],
    [inputs],
  );

  const fuseRating = useMemo(() => {
    if (!inputs.fusingRequired) return "Not required";
    const target = inputs.continuousA * 1.25;
    const standard = [80, 100, 125, 160, 200, 250, 315, 355, 400, 500, 630, 800, 1000];
    return `${standard.find((v) => v >= target) ?? Math.ceil(target / 100) * 100} A`;
  }, [inputs.continuousA, inputs.fusingRequired]);

  const densityCurve = useMemo(() => {
    const widths = [10, 15, 20, 25, 30, 35, 40, 50, 60, 70, 80];
    const thickness = primary.requiredAreaMm2 / inputs.selectedWidthMm;
    
    return widths.map((w) => {
      const area = w * thickness;
      const density = inputs.continuousA / Math.max(area, 0.1);
      return {
        width: w,
        density: Number(density.toFixed(2)),
        safe: density < 3,
        warning: density >= 3 && density < 5,
        danger: density >= 5,
      };
    });
  }, [inputs.continuousA, inputs.selectedWidthMm, primary.requiredAreaMm2]);

  const currentDensity = inputs.continuousA / Math.max(primary.requiredAreaMm2, 0.1);

  const steps = [
    {
      title: "Required Cross-sectional Area",
      formula: `A = I_continuous / J_allowable\nJ for ${inputs.material}, ${inputs.surface}, enclosed = ${(BASE_CURRENT_DENSITY[inputs.material] * SURFACE_FACTOR[inputs.surface] * Math.max(0.45, 1 - (inputs.operatingC - inputs.ambientC) / 190)).toFixed(2)} A/mm²\nA = ${inputs.continuousA} / ${(BASE_CURRENT_DENSITY[inputs.material] * SURFACE_FACTOR[inputs.surface] * Math.max(0.45, 1 - (inputs.operatingC - inputs.ambientC) / 190)).toFixed(2)} = ${primary.requiredAreaMm2.toFixed(2)} mm²`,
      result: `${primary.requiredAreaMm2.toFixed(2)} mm²`,
    },
    {
      title: "Resistance",
      formula: `R = ρ × L / A\nρ_${inputs.material}@${inputs.operatingC}°C = ${(RESISTIVITY_20C[inputs.material] * (1 + TEMP_COEFF[inputs.material] * (inputs.operatingC - 20))).toExponential(2)} Ω·m\nR = ${(RESISTIVITY_20C[inputs.material] * (1 + TEMP_COEFF[inputs.material] * (inputs.operatingC - 20)) * (inputs.lengthMm / 1000) / (primary.requiredAreaMm2 / 1_000_000)).toExponential(2)} Ω\n= ${primary.resistanceMOhm.toFixed(3)} mΩ`,
      result: `${primary.resistanceMOhm.toFixed(3)} mΩ`,
    },
    {
      title: "Power Loss",
      formula: `P = I² × R = ${inputs.continuousA}² × ${(primary.resistanceMOhm / 1000).toExponential(2)} Ω\n= ${primary.powerLossW.toFixed(2)} W`,
      result: `${primary.powerLossW.toFixed(2)} W`,
    },
    {
      title: "Temperature Rise",
      formula: `ΔT = P / (h × A_surface)\nA_surface = 2 × L × √A = 2 × ${inputs.lengthMm/1000} × √${primary.requiredAreaMm2/1e6} = ${(2 * (inputs.lengthMm / 1000) * Math.sqrt(primary.requiredAreaMm2 / 1_000_000)).toFixed(4)} m²\nΔT = ${primary.powerLossW} / (7.5 × ${(2 * (inputs.lengthMm / 1000) * Math.sqrt(primary.requiredAreaMm2 / 1_000_000)).toFixed(4)}) = ${primary.tempRiseC.toFixed(1)}°C`,
      result: `${primary.tempRiseC.toFixed(1)}°C rise`,
    },
    {
      title: "Fuse Rating",
      formula: `I_fuse = 1.25 × I_continuous = 1.25 × ${inputs.continuousA} = ${(inputs.continuousA * 1.25).toFixed(0)} A → rounded to standard`,
      result: fuseRating,
    },
  ];

  const shareUrl = useShareUrl("bus-bar", {
    mat: inputs.material,
    i: inputs.continuousA,
    peak: inputs.peakA,
    len: inputs.lengthMm,
    t: inputs.operatingC,
  });

  const exportResults = () => {
    const csv = toCsv(
      comparison.map((item) => ({
        material: item.material,
        required_area_mm2: item.requiredAreaMm2.toFixed(2),
        resistance_mohm: item.resistanceMOhm.toFixed(3),
        power_loss_w: item.powerLossW.toFixed(1),
        temp_rise_c: item.tempRiseC.toFixed(1),
      })),
    );
    downloadCsv("busbar-fusing-calculator.csv", csv);
  };

  const alertState: "ok" | "warn" | "danger" =
    primary.tempRiseC < 25 ? "ok" : primary.tempRiseC < 40 ? "warn" : "danger";

  return (
    <div className="calc-split">
      <section className="calc-panel">
        <InputSection title="Material & Finish">
          <div className="input-group">
            <label>Material</label>
            <select
              value={inputs.material}
              onChange={(event) => setInputs((prev) => ({ ...prev, material: event.target.value as Material }))}
            >
              <option value="copper">Copper</option>
              <option value="aluminum">Aluminum</option>
            </select>
          </div>

          <div className="input-group">
            <label>Surface Finish</label>
            <select
              value={inputs.surface}
              onChange={(event) => setInputs((prev) => ({ ...prev, surface: event.target.value as SurfaceFinish }))}
            >
              <option value="bare">Bare</option>
              <option value="tin">Tin-plated</option>
              <option value="nickel">Nickel-plated</option>
            </select>
          </div>
        </InputSection>

        <InputSection title="Geometry">
          <NumberField
            label="Length"
            value={inputs.lengthMm}
            min={50}
            max={2000}
            step={10}
            unit="mm"
            onChange={(value) => setInputs((prev) => ({ ...prev, lengthMm: value }))}
          />
          
          <div className="input-group">
            <label>Selected Width for Chart</label>
            <select
              value={inputs.selectedWidthMm}
              onChange={(event) => setInputs((prev) => ({ ...prev, selectedWidthMm: Number(event.target.value) }))}
            >
              {[20, 25, 30, 40, 50, 60, 80].map((w) => (
                <option key={w} value={w}>{w} mm</option>
              ))}
            </select>
          </div>
        </InputSection>

        <InputSection title="Electrical Load">
          <NumberField
            label="Continuous Current"
            value={inputs.continuousA}
            min={20}
            max={1500}
            step={5}
            unit="A"
            onChange={(value) => setInputs((prev) => ({ ...prev, continuousA: value }))}
          />

          <NumberField
            label="Peak Current"
            value={inputs.peakA}
            min={20}
            max={2200}
            step={5}
            unit="A"
            onChange={(value) => setInputs((prev) => ({ ...prev, peakA: value }))}
          />
        </InputSection>

        <InputSection title="Thermal Boundary">
          <NumberField
            label="Operating Temperature"
            value={inputs.operatingC}
            min={20}
            max={140}
            step={1}
            unit="C"
            onChange={(value) => setInputs((prev) => ({ ...prev, operatingC: value }))}
          />

          <NumberField
            label="Ambient Temperature"
            value={inputs.ambientC}
            min={-10}
            max={60}
            step={1}
            unit="C"
            onChange={(value) => setInputs((prev) => ({ ...prev, ambientC: value }))}
          />

          <div className="input-group">
            <label>Fusing Requirement</label>
            <select
              value={inputs.fusingRequired ? "yes" : "no"}
              onChange={(event) => setInputs((prev) => ({ ...prev, fusingRequired: event.target.value === "yes" }))}
            >
              <option value="yes">Enabled</option>
              <option value="no">Disabled</option>
            </select>
          </div>
        </InputSection>

        <div className="calc-actions">
          <button className="calc-btn" type="button" onClick={exportResults}>Export CSV</button>
          <a className="calc-link" href={shareUrl}>Share Config URL</a>
          <button className="calc-btn secondary" type="button" onClick={() => setShowSteps(!showSteps)}>
            {showSteps ? "Hide Steps" : "Show Calculation Steps"}
          </button>
        </div>
      </section>

      <section className="calc-panel">
        <div className="calc-results-grid">
          <article className="result-card"><p>Required Cross-section</p><h4>{primary.requiredAreaMm2.toFixed(2)} mm2</h4></article>
          <article className="result-card"><p>Current Density</p><h4>{currentDensity.toFixed(2)} A/mm2</h4></article>
          <article className="result-card"><p>Resistance</p><h4>{primary.resistanceMOhm.toFixed(3)} mOhm</h4></article>
          <article className="result-card"><p>Power Loss</p><h4>{primary.powerLossW.toFixed(1)} W</h4></article>
          <article className="result-card"><p>Temp Rise</p><h4>{primary.tempRiseC.toFixed(1)} C</h4></article>
          <article className="result-card"><p>Fuse Rating</p><h4>{fuseRating}</h4></article>
        </div>

        <div className={`calc-alert ${alertState}`}>
          {alertState === "ok"
            ? "Thermal rise is in a healthy region"
            : alertState === "warn"
              ? "Thermal rise is elevated, consider larger cross-section"
              : "Thermal rise is high, redesign required"}
        </div>

        {showSteps && <StepByStep steps={steps} />}

        <div className="calc-chart">
          <h4>Current Density vs Width (at {inputs.selectedWidthMm}mm width)</h4>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={densityCurve}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="width" stroke="var(--text2)" label={{ value: "Width (mm)", position: "insideBottom", offset: -5 }} />
              <YAxis stroke="var(--text2)" label={{ value: "A/mm²", angle: -90, position: "insideLeft" }} />
              <Tooltip 
                contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                formatter={(value, name) => {
                  const numVal = Number(value);
                  if (name === "density") {
                    const status = numVal < 3 ? "Safe" : numVal < 5 ? "Warning" : "Danger";
                    return [`${numVal.toFixed(2)} A/mm² (${status})`, "Density"];
                  }
                  return [numVal, String(name)];
                }}
              />
              <ReferenceLine y={3} stroke="#22c55e" strokeDasharray="5 5" label={{ value: "Safe", fill: "#22c55e", fontSize: 10 }} />
              <ReferenceLine y={5} stroke="#ef4444" strokeDasharray="5 5" label={{ value: "Danger", fill: "#ef4444", fontSize: 10 }} />
              <ReferenceLine x={inputs.selectedWidthMm} stroke="#22c55e" strokeDasharray="5 5" label={{ value: "Selected", fill: "#22c55e", fontSize: 10 }} />
              <Bar dataKey="density" fill="var(--accent)" />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="calc-legend">
            <span><span className="legend-dot" style={{ background: "#22c55e" }}></span> Safe (&lt;3 A/mm²)</span>
            <span><span className="legend-dot" style={{ background: "#eab308" }}></span> Warning (3-5 A/mm²)</span>
            <span><span className="legend-dot" style={{ background: "#ef4444" }}></span> Danger (&gt;5 A/mm²)</span>
          </div>
        </div>

        <div className="calc-table-wrap">
          <h4>Dimension Options ({inputs.material})</h4>
          <table className="calc-table">
            <thead>
              <tr><th>Width (mm)</th><th>Thickness (mm)</th></tr>
            </thead>
            <tbody>
              {dimensionOptions(primary.requiredAreaMm2).map((item) => (
                <tr key={`${item.width}-${item.thickness}`}>
                  <td>{item.width}</td>
                  <td>{item.thickness.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="calc-table-wrap">
          <h4>Cu vs Al Comparison</h4>
          <table className="calc-table">
            <thead>
              <tr>
                <th>Material</th>
                <th>Area (mm2)</th>
                <th>R (mOhm)</th>
                <th>Loss (W)</th>
                <th>Delta T (C)</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((row) => (
                <tr key={row.material}>
                  <td>{row.material}</td>
                  <td>{row.requiredAreaMm2.toFixed(2)}</td>
                  <td>{row.resistanceMOhm.toFixed(3)}</td>
                  <td>{row.powerLossW.toFixed(1)}</td>
                  <td>{row.tempRiseC.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}