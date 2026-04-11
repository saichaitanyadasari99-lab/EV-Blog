"use client";

import { useMemo, useState } from "react";
import { NumberField, downloadCsv, toCsv, useShareUrl } from "./common";

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
          <label>Fusing Requirement</label>
          <select
            value={inputs.fusingRequired ? "yes" : "no"}
            onChange={(event) => setInputs((prev) => ({ ...prev, fusingRequired: event.target.value === "yes" }))}
          >
            <option value="yes">Enabled</option>
            <option value="no">Disabled</option>
          </select>
        </div>

        <div className="calc-actions">
          <button className="calc-btn" type="button" onClick={exportResults}>Export CSV</button>
          <a className="calc-link" href={shareUrl}>Share Config URL</a>
        </div>
      </section>

      <section className="calc-panel">
        <div className="calc-results-grid">
          <article className="result-card"><p>Required Cross-section</p><h4>{primary.requiredAreaMm2.toFixed(2)} mm2</h4></article>
          <article className="result-card"><p>Resistance</p><h4>{primary.resistanceMOhm.toFixed(3)} mOhm</h4></article>
          <article className="result-card"><p>Power Loss</p><h4>{primary.powerLossW.toFixed(1)} W</h4></article>
          <article className="result-card"><p>Temp Rise</p><h4>{primary.tempRiseC.toFixed(1)} C</h4></article>
          <article className="result-card"><p>Recommended Fuse</p><h4>{fuseRating}</h4></article>
        </div>

        <div className={`calc-alert ${alertState}`}>
          {alertState === "ok"
            ? "Thermal rise is in a healthy region"
            : alertState === "warn"
              ? "Thermal rise is elevated, consider larger cross-section"
              : "Thermal rise is high, redesign required"}
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
