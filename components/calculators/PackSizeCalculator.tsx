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
import { NumberField, clampNumber, downloadCsv, toCsv, useShareUrl, InputSection, StepByStep, shareResults } from "./common";

type Chemistry = "lfp" | "nmc" | "nca" | "na-ion";
type UnitSystem = "metric" | "imperial";

type CellPreset = {
  id: string;
  label: string;
  chemistry: Chemistry;
  nominalVoltage: number;
  capacityAh: number;
  cellWeightKg: number;
  cellLengthMm: number;
  cellWidthMm: number;
  cellHeightMm: number;
};

const CELL_PRESETS: CellPreset[] = [
  {
    id: "catl-lfp-280",
    label: "CATL LFP 280Ah",
    chemistry: "lfp",
    nominalVoltage: 3.2,
    capacityAh: 280,
    cellWeightKg: 5.4,
    cellLengthMm: 174,
    cellWidthMm: 72,
    cellHeightMm: 207,
  },
  {
    id: "samsung-nmc811",
    label: "Samsung NMC 811 (60Ah)",
    chemistry: "nmc",
    nominalVoltage: 3.65,
    capacityAh: 60,
    cellWeightKg: 1.0,
    cellLengthMm: 148,
    cellWidthMm: 91,
    cellHeightMm: 27,
  },
  {
    id: "svolt-196",
    label: "SVOLT LFP 196Ah",
    chemistry: "lfp",
    nominalVoltage: 3.2,
    capacityAh: 196,
    cellWeightKg: 3.9,
    cellLengthMm: 173,
    cellWidthMm: 54,
    cellHeightMm: 204,
  },
  {
    id: "catl-na-ion-160",
    label: "CATL Na-ion 160Ah",
    chemistry: "na-ion",
    nominalVoltage: 2.95,
    capacityAh: 160,
    cellWeightKg: 3.2,
    cellLengthMm: 170,
    cellWidthMm: 60,
    cellHeightMm: 200,
  },
];

type Inputs = {
  presetId: string;
  chemistry: Chemistry;
  nominalVoltage: number;
  capacityAh: number;
  targetPackVoltage: number;
  useTargetVoltage: boolean;
  sCount: number;
  pCount: number;
  cellsPerModule: number;
  thermalGapMm: number;
  busbarThicknessMm: number;
  compressionThicknessMm: number;
  cellWeightKg: number;
  cellLengthMm: number;
  cellWidthMm: number;
  cellHeightMm: number;
  powerDrawKw: number;
  unitSystem: UnitSystem;
};

function defaultInputs(): Inputs {
  const preset = CELL_PRESETS[0];
  return {
    presetId: preset.id,
    chemistry: preset.chemistry,
    nominalVoltage: preset.nominalVoltage,
    capacityAh: preset.capacityAh,
    targetPackVoltage: 400,
    useTargetVoltage: true,
    sCount: 124,
    pCount: 1,
    cellsPerModule: 16,
    thermalGapMm: 2,
    busbarThicknessMm: 2,
    compressionThicknessMm: 6,
    cellWeightKg: preset.cellWeightKg,
    cellLengthMm: preset.cellLengthMm,
    cellWidthMm: preset.cellWidthMm,
    cellHeightMm: preset.cellHeightMm,
    powerDrawKw: 80,
    unitSystem: "metric",
  };
}

const CHEMISTRY_LIMITS: Record<Chemistry, { maxChargeC: number; maxDischargeC: number }> = {
  lfp: { maxChargeC: 0.5, maxDischargeC: 3 },
  nmc: { maxChargeC: 1.0, maxDischargeC: 3 },
  nca: { maxChargeC: 0.8, maxDischargeC: 3 },
  "na-ion": { maxChargeC: 1.0, maxDischargeC: 3 },
};

function mmToInches(mm: number) {
  return mm / 25.4;
}

export function PackSizeCalculator() {
  const [inputs, setInputs] = useState<Inputs>(defaultInputs);
  const [showSteps, setShowSteps] = useState(false);

  const computed = useMemo(() => {
    const series = inputs.useTargetVoltage
      ? Math.max(1, Math.round(inputs.targetPackVoltage / inputs.nominalVoltage))
      : clampNumber(inputs.sCount, 1, 300);

    const parallel = clampNumber(inputs.pCount, 1, 50);
    const totalCells = series * parallel;

    const packVoltage = series * inputs.nominalVoltage;
    const packCapacityAh = parallel * inputs.capacityAh;
    const packEnergyKwh = (packVoltage * packCapacityAh) / 1000;

    const moduleCount = Math.ceil(totalCells / Math.max(1, inputs.cellsPerModule));

    const spanS = Math.max(1, Math.ceil(series / Math.sqrt(parallel)));
    const cellPitchMm = inputs.cellWidthMm + inputs.thermalGapMm;
    const rows = Math.max(1, Math.ceil(totalCells / spanS));

    const packLengthMm = spanS * cellPitchMm + 2 * inputs.compressionThicknessMm;
    const packWidthMm = rows * (inputs.cellLengthMm + inputs.thermalGapMm) +
      2 * inputs.compressionThicknessMm;
    const packHeightMm =
      inputs.cellHeightMm + 2 * inputs.busbarThicknessMm + inputs.compressionThicknessMm;

    const packVolumeL = (packLengthMm * packWidthMm * packHeightMm) / 1_000_000;

    const cellMass = totalCells * inputs.cellWeightKg;
    const packMassLow = cellMass * 1.22;
    const packMassHigh = cellMass * 1.4;

    const gravimetricWhKgLow = (packEnergyKwh * 1000) / packMassHigh;
    const gravimetricWhKgHigh = (packEnergyKwh * 1000) / packMassLow;
    const volumetricWhL = (packEnergyKwh * 1000) / Math.max(packVolumeL, 0.1);

    const packCurrentAtLoad = (inputs.powerDrawKw * 1000) / Math.max(packVoltage, 1);
    const cRateAtLoad = packCurrentAtLoad / Math.max(packCapacityAh, 1);

    const chemLimits = CHEMISTRY_LIMITS[inputs.chemistry];

    const bands = [48, 96, 400, 800];
    const nearest = bands.reduce((acc, v) => (Math.abs(v - packVoltage) < Math.abs(acc - packVoltage) ? v : acc), bands[0]);
    const deltaPct = Math.abs(packVoltage - nearest) / nearest;
    const bandStatus: "ok" | "warn" | "danger" = deltaPct <= 0.1 ? "ok" : deltaPct <= 0.25 ? "warn" : "danger";

    const powerCurve = Array.from({ length: 15 }, (_, idx) => {
      const powerKw = (idx + 1) * 20;
      const current = (powerKw * 1000) / Math.max(packVoltage, 1);
      const cRate = current / Math.max(packCapacityAh, 1);
      const dcirOhm = inputs.chemistry === "lfp" ? 0.00085 : 0.0012;
      const heatW = current * current * dcirOhm;
      return {
        powerKw,
        cRate: Number(cRate.toFixed(2)),
        heatPerCell: Number(heatW.toFixed(1)),
        inDangerZone: cRate > chemLimits.maxChargeC,
        inWarningZone: cRate > chemLimits.maxChargeC * 0.8,
      };
    });

    const steps = [
      {
        title: "Series Count",
        formula: `S = Target Voltage / Cell Nominal Voltage = ${inputs.targetPackVoltage} / ${inputs.nominalVoltage.toFixed(2)}`,
        result: `${series} cells`,
      },
      {
        title: "Parallel Count",
        formula: `P = User input = ${parallel}`,
        result: `${parallel} strings`,
      },
      {
        title: "Pack Capacity",
        formula: `Pack Ah = Cell Ah × P = ${inputs.capacityAh} × ${parallel}`,
        result: `${packCapacityAh.toFixed(1)} Ah`,
      },
      {
        title: "Gross Energy",
        formula: `E = (S × V_cell × Ah) / 1000 = (${series} × ${inputs.nominalVoltage.toFixed(2)} × ${inputs.capacityAh}) / 1000`,
        result: `${packEnergyKwh.toFixed(2)} kWh`,
      },
      {
        title: "Pack Dimensions",
        formula: `L = ${spanS} × (${inputs.cellWidthMm} + ${inputs.thermalGapMm}) + end_plates = ${packLengthMm.toFixed(0)}mm\nW = ${rows} × (${inputs.cellLengthMm} + ${inputs.thermalGapMm}) + compression = ${packWidthMm.toFixed(0)}mm\nH = ${inputs.cellHeightMm} + busbar + compression = ${packHeightMm.toFixed(0)}mm`,
        result: `${packLengthMm.toFixed(0)} × ${packWidthMm.toFixed(0)} × ${packHeightMm.toFixed(0)} mm`,
      },
      {
        title: "Volumetric Density",
        formula: `Wh/L = E_gross / Volume = ${packEnergyKwh.toFixed(2)} / ${packVolumeL.toFixed(2)}`,
        result: `${volumetricWhL.toFixed(1)} Wh/L`,
      },
      {
        title: "C-rate at Rated Power",
        formula: `C = Power / Energy = ${inputs.powerDrawKw} / ${packEnergyKwh.toFixed(2)}`,
        result: `${cRateAtLoad.toFixed(2)}C`,
      },
    ];

    return {
      series,
      parallel,
      totalCells,
      packVoltage,
      packCapacityAh,
      packEnergyKwh,
      moduleCount,
      rows,
      spanS,
      packLengthMm,
      packWidthMm,
      packHeightMm,
      packVolumeL,
      packMassLow,
      packMassHigh,
      gravimetricWhKgLow,
      gravimetricWhKgHigh,
      volumetricWhL,
      cRateAtLoad,
      nearest,
      bandStatus,
      powerCurve,
      chemLimits,
      steps,
    };
  }, [inputs]);

  const shareUrl = useShareUrl("pack-size", {
    s: computed.series,
    p: inputs.pCount,
    cap: inputs.capacityAh,
    cellv: inputs.nominalVoltage,
    chem: inputs.chemistry,
  });

  const exportResults = () => {
    const csv = toCsv([
      {
        chemistry: inputs.chemistry,
        series: computed.series,
        parallel: computed.parallel,
        pack_voltage_v: computed.packVoltage.toFixed(1),
        pack_capacity_ah: computed.packCapacityAh.toFixed(1),
        pack_energy_kwh: computed.packEnergyKwh.toFixed(2),
        volumetric_wh_l: computed.volumetricWhL.toFixed(1),
        gravimetric_wh_kg_low: computed.gravimetricWhKgLow.toFixed(1),
        gravimetric_wh_kg_high: computed.gravimetricWhKgHigh.toFixed(1),
        c_rate_at_load: computed.cRateAtLoad.toFixed(2),
      },
    ]);
    downloadCsv("battery-pack-designer.csv", csv);
  };

  const shareResultsFn = () => {
    shareResults("Battery Pack Designer Results", {
      Chemistry: inputs.chemistry,
      "Series (S)": computed.series,
      "Parallel (P)": computed.parallel,
      "Pack Voltage": `${computed.packVoltage.toFixed(1)} V`,
      "Pack Capacity": `${computed.packCapacityAh.toFixed(1)} Ah`,
      "Pack Energy": `${computed.packEnergyKwh.toFixed(2)} kWh`,
      "Volumetric Density": `${computed.volumetricWhL.toFixed(1)} Wh/L`,
      "C-rate @ Load": `${computed.cRateAtLoad.toFixed(2)} C`,
    });
  };

  const applyPreset = (presetId: string) => {
    const preset = CELL_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;

    setInputs((previous) => ({
      ...previous,
      presetId,
      chemistry: preset.chemistry,
      nominalVoltage: preset.nominalVoltage,
      capacityAh: preset.capacityAh,
      cellWeightKg: preset.cellWeightKg,
      cellLengthMm: preset.cellLengthMm,
      cellWidthMm: preset.cellWidthMm,
      cellHeightMm: preset.cellHeightMm,
    }));
  };

  const dimensionUnit = inputs.unitSystem === "metric" ? "mm" : "in";
  const lengthDisplay = inputs.unitSystem === "metric"
    ? computed.packLengthMm
    : mmToInches(computed.packLengthMm);
  const widthDisplay = inputs.unitSystem === "metric"
    ? computed.packWidthMm
    : mmToInches(computed.packWidthMm);
  const heightDisplay = inputs.unitSystem === "metric"
    ? computed.packHeightMm
    : mmToInches(computed.packHeightMm);

  const currentPowerPoint = computed.powerCurve.find(p => Math.abs(p.powerKw - inputs.powerDrawKw) < 15);

  return (
    <div className="calc-split">
      <section className="calc-panel">
        <InputSection title="Cell Definition">
          <div className="input-group">
            <label>Cell Preset</label>
            <select value={inputs.presetId} onChange={(event) => applyPreset(event.target.value)}>
              {CELL_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>{preset.label}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>Chemistry</label>
            <select
              value={inputs.chemistry}
              onChange={(event) => setInputs((previous) => ({ ...previous, chemistry: event.target.value as Chemistry }))}
            >
              <option value="lfp">LFP</option>
              <option value="nmc">NMC</option>
              <option value="nca">NCA</option>
              <option value="na-ion">Na-ion</option>
            </select>
          </div>

          <NumberField
            label="Cell Nominal Voltage"
            value={inputs.nominalVoltage}
            min={2}
            max={4.3}
            step={0.01}
            unit="V"
            onChange={(value) => setInputs((previous) => ({ ...previous, nominalVoltage: value }))}
          />

          <NumberField
            label="Cell Capacity"
            value={inputs.capacityAh}
            min={10}
            max={320}
            step={1}
            unit="Ah"
            onChange={(value) => setInputs((previous) => ({ ...previous, capacityAh: value }))}
          />

          <NumberField
            label="Cell Weight"
            value={inputs.cellWeightKg}
            min={0.2}
            max={8}
            step={0.05}
            unit="kg"
            onChange={(value) => setInputs((previous) => ({ ...previous, cellWeightKg: value }))}
          />
        </InputSection>

        <InputSection title="Pack Architecture">
          <div className="input-group">
            <label>Voltage Input Mode</label>
            <select
              value={inputs.useTargetVoltage ? "target" : "series"}
              onChange={(event) => setInputs((previous) => ({ ...previous, useTargetVoltage: event.target.value === "target" }))}
            >
              <option value="target">Target Pack Voltage</option>
              <option value="series">Manual Series Count</option>
            </select>
          </div>

          {inputs.useTargetVoltage ? (
            <NumberField
              label="Target Pack Voltage"
              value={inputs.targetPackVoltage}
              min={24}
              max={1000}
              step={1}
              unit="V"
              onChange={(value) => setInputs((previous) => ({ ...previous, targetPackVoltage: value }))}
            />
          ) : (
            <NumberField
              label="Series Count (S)"
              value={inputs.sCount}
              min={1}
              max={300}
              step={1}
              onChange={(value) => setInputs((previous) => ({ ...previous, sCount: Math.round(value) }))}
            />
          )}

          <NumberField
            label="Parallel Count (P)"
            value={inputs.pCount}
            min={1}
            max={50}
            step={1}
            onChange={(value) => setInputs((previous) => ({ ...previous, pCount: Math.round(value) }))}
          />

          <NumberField
            label="Cells Per Module"
            value={inputs.cellsPerModule}
            min={4}
            max={96}
            step={1}
            onChange={(value) => setInputs((previous) => ({ ...previous, cellsPerModule: Math.round(value) }))}
          />

          <div className="input-group">
            <label>Unit System</label>
            <select
              value={inputs.unitSystem}
              onChange={(event) => setInputs((previous) => ({ ...previous, unitSystem: event.target.value as UnitSystem }))}
            >
              <option value="metric">Metric</option>
              <option value="imperial">Imperial</option>
            </select>
          </div>
        </InputSection>

        <InputSection title="Mechanical Allowances">
          <NumberField
            label="Thermal Gap"
            value={inputs.thermalGapMm}
            min={0.5}
            max={8}
            step={0.1}
            unit="mm"
            onChange={(value) => setInputs((previous) => ({ ...previous, thermalGapMm: value }))}
          />

          <NumberField
            label="Busbar Thickness"
            value={inputs.busbarThicknessMm}
            min={0.5}
            max={10}
            step={0.1}
            unit="mm"
            onChange={(value) => setInputs((previous) => ({ ...previous, busbarThicknessMm: value }))}
          />

          <NumberField
            label="Compression Plate Thickness"
            value={inputs.compressionThicknessMm}
            min={1}
            max={20}
            step={0.5}
            unit="mm"
            onChange={(value) => setInputs((previous) => ({ ...previous, compressionThicknessMm: value }))}
          />
        </InputSection>

        <InputSection title="Operating Point">
          <NumberField
            label="Power Draw"
            value={inputs.powerDrawKw}
            min={5}
            max={500}
            step={1}
            unit="kW"
            onChange={(value) => setInputs((previous) => ({ ...previous, powerDrawKw: value }))}
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
          <article className="result-card"><p>Pack Voltage</p><h4>{computed.packVoltage.toFixed(1)} V</h4></article>
          <article className="result-card"><p>Pack Capacity</p><h4>{computed.packCapacityAh.toFixed(1)} Ah</h4></article>
          <article className="result-card"><p>Pack Energy</p><h4>{computed.packEnergyKwh.toFixed(2)} kWh</h4></article>
          <article className="result-card"><p>Volumetric Density</p><h4>{computed.volumetricWhL.toFixed(1)} Wh/L</h4></article>
          <article className="result-card"><p>Gravimetric Density</p><h4>{computed.gravimetricWhKgLow.toFixed(0)}-{computed.gravimetricWhKgHigh.toFixed(0)} Wh/kg</h4></article>
          <article className="result-card"><p>C-rate @ {inputs.powerDrawKw}kW</p><h4>{computed.cRateAtLoad.toFixed(2)} C</h4></article>
          <article className="result-card"><p>Modules</p><h4>{computed.moduleCount}</h4></article>
          <article className="result-card"><p>Weight Range</p><h4>{computed.packMassLow.toFixed(1)}-{computed.packMassHigh.toFixed(1)} kg</h4></article>
        </div>

        <div className={`calc-alert ${computed.bandStatus}`}>
          {computed.bandStatus === "ok"
            ? `Voltage aligns with ${computed.nearest}V class`
            : computed.bandStatus === "warn"
              ? `Voltage is near ${computed.nearest}V band but outside preferred tolerance`
              : `Voltage is outside common 48/96/400/800V bands`}
        </div>

        {showSteps && <StepByStep steps={computed.steps} />}

        <div className="calc-diagram-card">
          <h4>Pack Layout Diagram ({computed.spanS}S × {computed.rows}P = {computed.totalCells} cells)</h4>
          <svg viewBox="0 0 400 180" className="pack-diagram" role="img" aria-label="Pack layout">
            <defs>
              <pattern id="modulePattern" patternUnits="userSpaceOnUse" width="36" height="36">
                <rect width="36" height="36" fill="#f0f0f0" />
                <rect x="0" y="0" width="18" height="18" fill="#e8e8e8" />
                <rect x="18" y="18" width="18" height="18" fill="#e8e8e8" />
              </pattern>
            </defs>
            {Array.from({ length: Math.min(computed.totalCells, 200) }, (_, index) => {
              const cols = Math.max(1, Math.min(computed.spanS, 20));
              const x = (index % cols) * 19 + 4;
              const y = Math.floor(index / cols) * 19 + 4;
              const moduleIndex = Math.floor(index / inputs.cellsPerModule);
              const isAlternateModule = moduleIndex % 2 === 1;
              return (
                <rect
                  key={index}
                  x={x}
                  y={y}
                  width="16"
                  height="16"
                  rx="2"
                  fill={isAlternateModule ? "#00a5b5" : "#00b7cc"}
                  opacity="0.85"
                />
              );
            })}
          </svg>
          <p className="calc-note">
            {computed.spanS} series × {computed.rows} rows = {computed.totalCells} cells across {computed.moduleCount} modules
          </p>
        </div>

        <div className="calc-chart">
          <h4>Power Draw vs C-rate & Heat Generation</h4>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={computed.powerCurve}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="powerKw" stroke="var(--text2)" label={{ value: "Power (kW)", position: "insideBottom", offset: -5 }} />
              <YAxis yAxisId="left" stroke="var(--text2)" label={{ value: "C-rate", angle: -90, position: "insideLeft" }} />
              <YAxis yAxisId="right" orientation="right" stroke="var(--text2)" label={{ value: "Heat (W/cell)", angle: 90, position: "insideRight" }} />
              <Tooltip
                contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                labelFormatter={(value) => `Power: ${value} kW`}
                formatter={(value, name) => {
                  const numVal = Number(value);
                  if (name === "cRate") return [`${numVal.toFixed(2)} C`, "C-rate"];
                  return [`${numVal.toFixed(1)} W`, "Heat/cell"];
                }}
              />
              <ReferenceLine yAxisId="left" y={computed.chemLimits.maxChargeC} stroke="#ef4444" strokeDasharray="5 5" label={{ value: "Max Charge C", fill: "#ef4444", fontSize: 10 }} />
              {currentPowerPoint && (
                <ReferenceDot
                  x={inputs.powerDrawKw}
                  y={currentPowerPoint.cRate}
                  yAxisId="left"
                  r={6}
                  fill="#22c55e"
                  stroke="white"
                  strokeWidth={2}
                />
              )}
              <Line yAxisId="left" type="monotone" dataKey="cRate" stroke="var(--accent)" strokeWidth={2} dot={false} name="C-rate" />
              <Line yAxisId="right" type="monotone" dataKey="heatPerCell" stroke="#f97316" strokeWidth={2} dot={false} name="Heat/cell" />
              <Area yAxisId="left" dataKey="cRate" fill="var(--accent)" fillOpacity={0.1} />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="calc-legend">
            <span><span className="legend-dot" style={{ background: "var(--accent)" }}></span> C-rate</span>
            <span><span className="legend-dot" style={{ background: "#f97316" }}></span> Heat/cell</span>
            <span><span className="legend-dot" style={{ background: "#22c55e" }}></span> Your design point</span>
          </div>
        </div>

        <div className="calc-dimensions">
          <h4>Estimated Pack Dimensions</h4>
          <p>{lengthDisplay.toFixed(1)} × {widthDisplay.toFixed(1)} × {heightDisplay.toFixed(1)} {dimensionUnit}</p>
          {inputs.unitSystem === "imperial" ? (
            <p className="calc-note">
              Metric reference: {computed.packLengthMm.toFixed(0)} × {computed.packWidthMm.toFixed(0)} × {computed.packHeightMm.toFixed(0)} mm
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
