"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { NumberField, downloadCsv, toCsv, useShareUrl } from "./common";

type DutyCycle = "continuous" | "pulse" | "wltc";
type Chemistry = "lfp" | "nmc" | "nca" | "na-ion";

type Inputs = {
  chemistry: Chemistry;
  cRate: number;
  dcirMilliOhm: number;
  cellCount: number;
  ambientC: number;
  dutyCycle: DutyCycle;
  capacityAh: number;
};

const TYPICAL_DCIR: Record<Chemistry, number> = {
  lfp: 0.85,
  nmc: 1.2,
  nca: 1.1,
  "na-ion": 1.45,
};

const WLTC_PROFILE = [
  { minute: 0, load: 0.25 },
  { minute: 2, load: 0.35 },
  { minute: 4, load: 0.55 },
  { minute: 6, load: 0.75 },
  { minute: 8, load: 0.4 },
  { minute: 10, load: 0.9 },
  { minute: 12, load: 0.5 },
  { minute: 14, load: 0.3 },
  { minute: 16, load: 0.65 },
  { minute: 18, load: 0.45 },
  { minute: 20, load: 0.2 },
];

const DEFAULT_INPUTS: Inputs = {
  chemistry: "lfp",
  cRate: 1.5,
  dcirMilliOhm: TYPICAL_DCIR.lfp,
  cellCount: 128,
  ambientC: 28,
  dutyCycle: "continuous",
  capacityAh: 280,
};

export function HeatGenerationCalculator() {
  const [inputs, setInputs] = useState<Inputs>(DEFAULT_INPUTS);

  const results = useMemo(() => {
    const currentA = inputs.cRate * inputs.capacityAh;
    const dcirOhm = inputs.dcirMilliOhm / 1000;

    const dutyFactor =
      inputs.dutyCycle === "continuous" ? 1 : inputs.dutyCycle === "pulse" ? 0.62 : 0.58;

    const heatPerCellW = currentA * currentA * dcirOhm * dutyFactor;
    const totalHeatW = heatPerCellW * inputs.cellCount;

    const thermalMassJPerC = inputs.cellCount * 980;

    const timePointsMinutes = Array.from({ length: 16 }, (_, idx) => idx * 2);

    const riseCurve = timePointsMinutes.map((minute) => {
      const t = minute * 60;
      const noCooling = (totalHeatW * t) / thermalMassJPerC;
      const airCooling = noCooling * 0.52;
      const liquidCooling = noCooling * 0.26;
      return {
        minute,
        noCooling: Number(noCooling.toFixed(1)),
        airCooling: Number(airCooling.toFixed(1)),
        liquidCooling: Number(liquidCooling.toFixed(1)),
      };
    });

    const maxLiquidRise = riseCurve[riseCurve.length - 1]?.liquidCooling ?? 0;
    const estimatedMaxTemp = inputs.ambientC + maxLiquidRise;
    const requiredCoolingW = Math.max(0, totalHeatW - ((45 - inputs.ambientC) * thermalMassJPerC) / 1800);
    const runawayMargin = 120 - estimatedMaxTemp;

    const wltcHeat = WLTC_PROFILE.map((point) => {
      const profileCurrent = currentA * point.load;
      const heat = profileCurrent * profileCurrent * dcirOhm * inputs.cellCount;
      return {
        minute: point.minute,
        heatKw: Number((heat / 1000).toFixed(2)),
      };
    });

    return {
      currentA,
      heatPerCellW,
      totalHeatW,
      totalHeatKw: totalHeatW / 1000,
      riseCurve,
      requiredCoolingW,
      runawayMargin,
      estimatedMaxTemp,
      wltcHeat,
    };
  }, [inputs]);

  const shareUrl = useShareUrl("heat-generation", {
    c: inputs.cRate,
    dcir: inputs.dcirMilliOhm,
    cells: inputs.cellCount,
    amb: inputs.ambientC,
    mode: inputs.dutyCycle,
  });

  const exportResults = () => {
    const csv = toCsv([
      {
        chemistry: inputs.chemistry,
        duty_mode: inputs.dutyCycle,
        c_rate: inputs.cRate,
        dcir_milliohm: inputs.dcirMilliOhm,
        heat_per_cell_w: results.heatPerCellW.toFixed(2),
        total_heat_w: results.totalHeatW.toFixed(1),
        required_cooling_w: results.requiredCoolingW.toFixed(1),
        runaway_margin_c: results.runawayMargin.toFixed(1),
      },
    ]);
    downloadCsv("thermal-load-analyzer.csv", csv);
  };

  const safetyStatus: "ok" | "warn" | "danger" =
    results.runawayMargin > 30 ? "ok" : results.runawayMargin > 15 ? "warn" : "danger";

  return (
    <div className="calc-split">
      <section className="calc-panel">
        <div className="input-group">
          <label>Chemistry Preset</label>
          <select
            value={inputs.chemistry}
            onChange={(event) => {
              const chemistry = event.target.value as Chemistry;
              setInputs((prev) => ({
                ...prev,
                chemistry,
                dcirMilliOhm: TYPICAL_DCIR[chemistry],
              }));
            }}
          >
            <option value="lfp">LFP</option>
            <option value="nmc">NMC</option>
            <option value="nca">NCA</option>
            <option value="na-ion">Na-ion</option>
          </select>
          <p className="calc-note">Typical DCIR for {inputs.chemistry.toUpperCase()}: {TYPICAL_DCIR[inputs.chemistry]} mOhm</p>
        </div>

        <NumberField
          label="C-rate"
          value={inputs.cRate}
          min={0.1}
          max={5}
          step={0.1}
          unit="C"
          onChange={(value) => setInputs((prev) => ({ ...prev, cRate: value }))}
        />

        <NumberField
          label="DCIR"
          value={inputs.dcirMilliOhm}
          min={0.2}
          max={5}
          step={0.01}
          unit="mOhm"
          onChange={(value) => setInputs((prev) => ({ ...prev, dcirMilliOhm: value }))}
        />

        <NumberField
          label="Cell Count"
          value={inputs.cellCount}
          min={16}
          max={400}
          step={1}
          onChange={(value) => setInputs((prev) => ({ ...prev, cellCount: Math.round(value) }))}
        />

        <NumberField
          label="Cell Capacity"
          value={inputs.capacityAh}
          min={20}
          max={320}
          step={1}
          unit="Ah"
          onChange={(value) => setInputs((prev) => ({ ...prev, capacityAh: value }))}
        />

        <NumberField
          label="Ambient Temperature"
          value={inputs.ambientC}
          min={-10}
          max={50}
          step={1}
          unit="C"
          onChange={(value) => setInputs((prev) => ({ ...prev, ambientC: value }))}
        />

        <div className="input-group">
          <label>Duty Cycle Mode</label>
          <select
            value={inputs.dutyCycle}
            onChange={(event) => setInputs((prev) => ({ ...prev, dutyCycle: event.target.value as DutyCycle }))}
          >
            <option value="continuous">Continuous</option>
            <option value="pulse">Pulse</option>
            <option value="wltc">WLTC Profile</option>
          </select>
        </div>

        <div className="calc-actions">
          <button className="calc-btn" type="button" onClick={exportResults}>Export CSV</button>
          <a className="calc-link" href={shareUrl}>Share Config URL</a>
        </div>
      </section>

      <section className="calc-panel">
        <div className="calc-results-grid">
          <article className="result-card"><p>Pack Current</p><h4>{results.currentA.toFixed(1)} A</h4></article>
          <article className="result-card"><p>Heat Per Cell</p><h4>{results.heatPerCellW.toFixed(2)} W</h4></article>
          <article className="result-card"><p>Total Heat Load</p><h4>{results.totalHeatW.toFixed(1)} W</h4></article>
          <article className="result-card"><p>Total Heat Load</p><h4>{results.totalHeatKw.toFixed(2)} kW</h4></article>
          <article className="result-card"><p>Required Cooling</p><h4>{results.requiredCoolingW.toFixed(0)} W</h4></article>
          <article className="result-card"><p>Predicted Peak Temp</p><h4>{results.estimatedMaxTemp.toFixed(1)} C</h4></article>
        </div>

        <div className={`calc-alert ${safetyStatus}`}>
          {safetyStatus === "ok"
            ? "Thermal runaway margin is healthy"
            : safetyStatus === "warn"
              ? "Thermal margin is shrinking, review cooling"
              : "Thermal margin is low, unsafe operating region"}
        </div>

        <div className="calc-chart">
          <h4>Temperature Rise Curve (Delta T)</h4>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={results.riseCurve}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="minute" stroke="var(--text2)" />
              <YAxis stroke="var(--text2)" />
              <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)" }} />
              <Legend />
              <Line type="monotone" dataKey="noCooling" stroke="#ff4545" dot={false} />
              <Line type="monotone" dataKey="airCooling" stroke="#ffb020" dot={false} />
              <Line type="monotone" dataKey="liquidCooling" stroke="#00b7cc" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="calc-chart">
          <h4>WLTC/Drive Cycle Heat Generation</h4>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={results.wltcHeat}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="minute" stroke="var(--text2)" />
              <YAxis stroke="var(--text2)" />
              <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)" }} />
              <Area type="monotone" dataKey="heatKw" stroke="var(--accent)" fill="var(--accent-dim)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
