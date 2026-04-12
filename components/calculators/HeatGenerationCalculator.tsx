"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { NumberField, downloadCsv, toCsv, useShareUrl, InputSection, StepByStep } from "./common";

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

const CHEMISTRY_LIMITS: Record<Chemistry, { maxTemp: number }> = {
  lfp: { maxTemp: 60 },
  nmc: { maxTemp: 45 },
  nca: { maxTemp: 45 },
  "na-ion": { maxTemp: 55 },
};

const WLTC_PROFILE = [
  { minute: 0, load: 0.25, phase: "Low" },
  { minute: 2, load: 0.35, phase: "Low" },
  { minute: 4, load: 0.55, phase: "Medium" },
  { minute: 6, load: 0.75, phase: "Medium" },
  { minute: 8, load: 0.4, phase: "Medium" },
  { minute: 10, load: 0.9, phase: "High" },
  { minute: 12, load: 0.5, phase: "High" },
  { minute: 14, load: 0.3, phase: "Extra-High" },
  { minute: 16, load: 0.65, phase: "Extra-High" },
  { minute: 18, load: 0.45, phase: "Extra-High" },
  { minute: 20, load: 0.2, phase: "Extra-High" },
];

const WLTC_PHASES = [
  { start: 0, end: 6, label: "Low" },
  { start: 6, end: 12, label: "Medium/High" },
  { start: 12, end: 20, label: "Extra-High" },
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
  const [showSteps, setShowSteps] = useState(false);

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
        tempNoCooling: Number(noCooling.toFixed(1)),
        tempAirCooling: Number(airCooling.toFixed(1)),
        tempLiquidCooling: Number(liquidCooling.toFixed(1)),
        tempNoCoolingAbs: Number((inputs.ambientC + noCooling).toFixed(1)),
        tempAirCoolingAbs: Number((inputs.ambientC + airCooling).toFixed(1)),
        tempLiquidCoolingAbs: Number((inputs.ambientC + liquidCooling).toFixed(1)),
      };
    });

    const maxLiquidRise = riseCurve[riseCurve.length - 1]?.tempLiquidCooling ?? 0;
    const estimatedMaxTemp = inputs.ambientC + maxLiquidRise;
    const requiredCoolingW = Math.max(0, totalHeatW - ((45 - inputs.ambientC) * thermalMassJPerC) / 1800);
    const runawayMargin = 120 - estimatedMaxTemp;

    const chemLimit = CHEMISTRY_LIMITS[inputs.chemistry];

    const wltcHeat = WLTC_PROFILE.map((point) => {
      const profileCurrent = currentA * point.load;
      const heat = profileCurrent * profileCurrent * dcirOhm * inputs.cellCount;
      return {
        minute: point.minute,
        phase: point.phase,
        heatKw: Number((heat / 1000).toFixed(2)),
        heatW: heat,
      };
    });

    const peakHeat = Math.max(...wltcHeat.map(h => h.heatW));

    const steps = [
      {
        title: "Pack Current",
        formula: `I_pack = C-rate × Cell_Ah = ${inputs.cRate} × ${inputs.capacityAh}`,
        result: `${currentA.toFixed(1)} A`,
      },
      {
        title: "Joule Heat Per Cell",
        formula: `Q_joule = I² × DCIR = ${currentA.toFixed(1)}² × ${dcirOhm.toFixed(5)}`,
        result: `${heatPerCellW.toFixed(1)} W/cell`,
      },
      {
        title: "Total Pack Heat",
        formula: `Q_total = Q_joule × N_cells = ${heatPerCellW.toFixed(1)} × ${inputs.cellCount}`,
        result: `${totalHeatW.toFixed(0)} W (${(totalHeatW/1000).toFixed(2)} kW)`,
      },
      {
        title: "Duty Cycle Factor",
        formula: `${inputs.dutyCycle === "continuous" ? "100%" : inputs.dutyCycle === "pulse" ? "62%" : "58%"} duty factor applied`,
        result: `${(dutyFactor * 100).toFixed(0)}% effective`,
      },
      {
        title: "Required Cooling",
        formula: `Q_cooling = Total Heat - Thermal Management Capacity`,
        result: `${requiredCoolingW.toFixed(0)} W`,
      },
    ];

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
      peakHeat,
      chemLimit,
      steps,
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
        <InputSection title="Cell & Pack Definition">
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
            <p className="calc-note">Max temp: {results.chemLimit.maxTemp}°C | DCIR: {inputs.dcirMilliOhm} mΩ</p>
          </div>

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
            label="Cell Count"
            value={inputs.cellCount}
            min={16}
            max={400}
            step={1}
            onChange={(value) => setInputs((prev) => ({ ...prev, cellCount: Math.round(value) }))}
          />
        </InputSection>

        <InputSection title="Electrical Operating Point">
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
        </InputSection>

        <InputSection title="Thermal Boundary">
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
          <article className="result-card"><p>Pack Current</p><h4>{results.currentA.toFixed(1)} A</h4></article>
          <article className="result-card"><p>Heat Per Cell</p><h4>{results.heatPerCellW.toFixed(1)} W</h4></article>
          <article className="result-card"><p>Total Heat</p><h4>{results.totalHeatKw.toFixed(2)} kW</h4></article>
          <article className="result-card"><p>Required Cooling</p><h4>{results.requiredCoolingW.toFixed(0)} W</h4></article>
          <article className="result-card"><p>Peak Temp</p><h4>{results.estimatedMaxTemp.toFixed(1)} C</h4></article>
          <article className="result-card"><p>Runaway Margin</p><h4>{results.runawayMargin.toFixed(1)} C</h4></article>
        </div>

        <div className={`calc-alert ${safetyStatus}`}>
          {safetyStatus === "ok"
            ? "Thermal margin healthy - operating safely"
            : safetyStatus === "warn"
              ? "Thermal margin shrinking - review cooling needs"
              : "Low thermal margin - unsafe operating region"}
        </div>

        {showSteps && <StepByStep steps={results.steps} />}

        <div className="calc-chart">
          <h4>Temperature Rise Curve</h4>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={results.riseCurve}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="minute" stroke="var(--text2)" label={{ value: "Time (minutes)", position: "insideBottom", offset: -5 }} />
              <YAxis stroke="var(--text2)" label={{ value: "Temperature Rise (°C)", angle: -90, position: "insideLeft" }} />
              <Tooltip 
                contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                labelFormatter={(v) => `Time: ${v} min`}
                formatter={(value, name) => {
                  const numVal = Number(value);
                  const temp = inputs.ambientC + numVal;
                  const label = typeof name === 'string' ? name.replace('temp', 'Absolute ') : 'Temperature';
                  return [`${temp.toFixed(1)}°C (${numVal.toFixed(1)}°C rise)`, label];
                }}
              />
              <ReferenceLine y={15} stroke="#22c55e" strokeDasharray="5 5" label={{ value: "Optimal", fill: "#22c55e", fontSize: 10 }} />
              <ReferenceLine y={35} stroke="#eab308" strokeDasharray="5 5" label={{ value: "Derate", fill: "#eab308", fontSize: 10 }} />
              <ReferenceLine y={45} stroke="#f97316" strokeDasharray="5 5" label={{ value: "Warning", fill: "#f97316", fontSize: 10 }} />
              <ReferenceLine y={results.chemLimit.maxTemp - inputs.ambientC} stroke="#ef4444" strokeDasharray="5 5" label={{ value: `${results.chemLimit.maxTemp}°C limit`, fill: "#ef4444", fontSize: 10 }} />
              <Legend />
              <Line type="monotone" dataKey="tempNoCooling" stroke="#ef4444" strokeWidth={2} dot={false} name="No Cooling" />
              <Line type="monotone" dataKey="tempAirCooling" stroke="#f97316" strokeWidth={2} dot={false} name="Air Cooling" />
              <Line type="monotone" dataKey="tempLiquidCooling" stroke="#22c55e" strokeWidth={2} dot={false} name="Liquid Cooling" />
            </LineChart>
          </ResponsiveContainer>
          <div className="calc-chart-legend">
            <span className="zone green"></span> Optimal (15-35°C)
            <span className="zone yellow"></span> Derate (35-45°C)
            <span className="zone orange"></span> Warning (45-60°C)
            <span className="zone red"></span> Danger (&gt;60°C)
          </div>
        </div>

        <div className="calc-chart">
          <h4>WLTC Drive Cycle Heat Generation</h4>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={results.wltcHeat}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="minute" stroke="var(--text2)" label={{ value: "Time (min)", position: "insideBottom", offset: -5 }} />
              <YAxis stroke="var(--text2)" label={{ value: "Heat (kW)", angle: -90, position: "insideLeft" }} />
              <Tooltip 
                contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                formatter={(value) => [`${Number(value).toFixed(2)} kW`, "Heat"]}
                labelFormatter={(v) => `Time: ${v} min`}
              />
              <ReferenceLine x={6} stroke="var(--text2)" strokeDasharray="3 3" />
              <ReferenceLine x={12} stroke="var(--text2)" strokeDasharray="3 3" />
              <Area type="monotone" dataKey="heatKw" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="calc-wltc-labels">
            <span>Low</span>
            <span>Medium/High</span>
            <span>Extra-High</span>
          </div>
        </div>
      </section>
    </div>
  );
}