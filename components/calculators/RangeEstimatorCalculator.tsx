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
  ReferenceLine,
  ReferenceDot,
  Area,
  ComposedChart,
} from "recharts";
import { NumberField, downloadCsv, toCsv, useShareUrl, InputSection, StepByStep, shareResults } from "./common";

type Inputs = {
  packKwh: number;
  vehicleMassKg: number;
  dragCoeff: number;
  frontalAreaM2: number;
  rollingCrr: number;
  drivetrainEff: number;
  roadGradientPct: number;
  auxiliaryLoadW: number;
  cruiseSpeedKmh: number;
};

const AIR_DENSITY = 1.225;
const G = 9.81;

export function RangeEstimatorCalculator() {
  const [inputs, setInputs] = useState<Inputs>({
    packKwh: 75,
    vehicleMassKg: 2100,
    dragCoeff: 0.26,
    frontalAreaM2: 2.3,
    rollingCrr: 0.011,
    drivetrainEff: 0.9,
    roadGradientPct: 0,
    auxiliaryLoadW: 0,
    cruiseSpeedKmh: 90,
  });
  const [showSteps, setShowSteps] = useState(false);

  const result = useMemo(() => {
    const calculateForGradient = (gradientPct: number, auxLoadW: number, label: string) => {
      return Array.from({ length: 15 }, (_, idx) => {
        const speedKmh = 20 + idx * 10;
        const speedMs = speedKmh / 3.6;
        
        const dragForce = 0.5 * AIR_DENSITY * inputs.dragCoeff * inputs.frontalAreaM2 * Math.pow(speedMs, 2);
        const rollingForce = inputs.vehicleMassKg * G * inputs.rollingCrr;
        const gradeAngle = Math.atan(gradientPct / 100);
        const gradeForce = inputs.vehicleMassKg * G * Math.sin(gradeAngle);
        
        const totalTractiveForce = dragForce + rollingForce + gradeForce;
        const auxPowerW = auxLoadW;
        
        const wheelPowerW = totalTractiveForce * speedMs + auxPowerW;
        const batteryPowerW = wheelPowerW / Math.max(inputs.drivetrainEff, 0.6);
        
        const whPerKm = (batteryPowerW / speedKmh);
        const rangeKm = (inputs.packKwh * 1000) / Math.max(whPerKm, 1);
        
        return {
          speedKmh,
          rangeKm: Number(rangeKm.toFixed(1)),
          whPerKm: Number(whPerKm.toFixed(1)),
          label,
        };
      });
    };

    const currentCurve = calculateForGradient(inputs.roadGradientPct, inputs.auxiliaryLoadW, "Current");
    const flatNoAux = calculateForGradient(0, 0, "Flat, No Aux");
    const grade5Curve = calculateForGradient(5, inputs.auxiliaryLoadW, "5% Grade");

    const currentAtSpeed = currentCurve.find(c => c.speedKmh === inputs.cruiseSpeedKmh) ?? currentCurve[7];
    
    const maxRange = Math.max(...currentCurve.map(c => c.rangeKm));
    const optimalSpeed = currentCurve.find(c => c.rangeKm === maxRange)?.speedKmh ?? 60;

    const steps = [
      {
        title: "Aerodynamic Drag Force",
        formula: `F_aero = 0.5 × ρ × Cd × A × v²\n     = 0.5 × 1.225 × ${inputs.dragCoeff} × ${inputs.frontalAreaM2} × (${(inputs.cruiseSpeedKmh/3.6).toFixed(1)} m/s)²\n     = ${(0.5 * AIR_DENSITY * inputs.dragCoeff * inputs.frontalAreaM2 * Math.pow(inputs.cruiseSpeedKmh/3.6, 2)).toFixed(1)} N`,
        result: `${(0.5 * AIR_DENSITY * inputs.dragCoeff * inputs.frontalAreaM2 * Math.pow(inputs.cruiseSpeedKmh/3.6, 2)).toFixed(0)} N`,
      },
      {
        title: "Rolling Resistance Force",
        formula: `F_roll = Crr × m × g\n     = ${inputs.rollingCrr} × ${inputs.vehicleMassKg} × 9.81\n     = ${(inputs.rollingCrr * inputs.vehicleMassKg * G).toFixed(1)} N`,
        result: `${(inputs.rollingCrr * inputs.vehicleMassKg * G).toFixed(0)} N`,
      },
      {
        title: "Grade Force" + (inputs.roadGradientPct > 0 ? ` (${inputs.roadGradientPct}%)` : ""),
        formula: inputs.roadGradientPct > 0 
          ? `F_grade = m × g × sin(θ) = ${inputs.vehicleMassKg} × 9.81 × sin(${inputs.roadGradientPct}°)\n     = ${(inputs.vehicleMassKg * G * Math.sin(inputs.roadGradientPct * Math.PI / 180)).toFixed(1)} N`
          : `F_grade = 0 N (flat road)`,
        result: inputs.roadGradientPct > 0 
          ? `${(inputs.vehicleMassKg * G * Math.sin(inputs.roadGradientPct * Math.PI / 180)).toFixed(0)} N` 
          : "0 N",
      },
      {
        title: "Total Tractive Force",
        formula: `F_total = F_aero + F_roll + F_grade\n     = ${(0.5 * AIR_DENSITY * inputs.dragCoeff * inputs.frontalAreaM2 * Math.pow(inputs.cruiseSpeedKmh/3.6, 2) + inputs.rollingCrr * inputs.vehicleMassKg * G + (inputs.roadGradientPct > 0 ? inputs.vehicleMassKg * G * Math.sin(inputs.roadGradientPct * Math.PI / 180) : 0)).toFixed(0)} N`,
        result: `${(0.5 * AIR_DENSITY * inputs.dragCoeff * inputs.frontalAreaM2 * Math.pow(inputs.cruiseSpeedKmh/3.6, 2) + inputs.rollingCrr * inputs.vehicleMassKg * G + (inputs.roadGradientPct > 0 ? inputs.vehicleMassKg * G * Math.sin(inputs.roadGradientPct * Math.PI / 180) : 0)).toFixed(0)} N`,
      },
      {
        title: "Power from Battery",
        formula: `P_battery = (F_total × v + P_aux) / η_drivetrain\n     = (F_total × ${(inputs.cruiseSpeedKmh/3.6).toFixed(1)} + ${inputs.auxiliaryLoadW}) / ${inputs.drivetrainEff}`,
        result: `${(((0.5 * AIR_DENSITY * inputs.dragCoeff * inputs.frontalAreaM2 * Math.pow(inputs.cruiseSpeedKmh/3.6, 2) + inputs.rollingCrr * inputs.vehicleMassKg * G + (inputs.roadGradientPct > 0 ? inputs.vehicleMassKg * G * Math.sin(inputs.roadGradientPct * Math.PI / 180) : 0)) * (inputs.cruiseSpeedKmh/3.6) + inputs.auxiliaryLoadW) / inputs.drivetrainEff / 1000).toFixed(2)} kW`,
      },
      {
        title: "Energy Consumption",
        formula: `E_cons = P_battery / v = ... / ${inputs.cruiseSpeedKmh} = ${currentAtSpeed.whPerKm} Wh/km`,
        result: `${currentAtSpeed.whPerKm} Wh/km`,
      },
      {
        title: "Range",
        formula: `Range = Pack_Energy / E_cons = ${inputs.packKwh} / (${currentAtSpeed.whPerKm} / 1000)`,
        result: `${currentAtSpeed.rangeKm} km`,
      },
    ];

    return { 
      currentCurve, 
      flatNoAux, 
      grade5Curve,
      nominal: currentAtSpeed,
      maxRange,
      optimalSpeed,
      steps,
    };
  }, [inputs]);

  const shareUrl = useShareUrl("range-estimator", {
    kwh: inputs.packKwh,
    m: inputs.vehicleMassKg,
    cd: inputs.dragCoeff,
    area: inputs.frontalAreaM2,
    crr: inputs.rollingCrr,
    eff: inputs.drivetrainEff,
    grad: inputs.roadGradientPct,
    aux: inputs.auxiliaryLoadW,
  });

  const shareResultsFn = () => {
    shareResults("Range Estimator Results", {
      "Pack Energy": `${inputs.packKwh} kWh`,
      "Cruise Speed": `${inputs.cruiseSpeedKmh} km/h`,
      "Vehicle Mass": `${inputs.vehicleMassKg} kg`,
      "Drag Coefficient": inputs.dragCoeff,
      "Estimated Range": `${result.nominal.rangeKm} km`,
      "Energy Consumption": `${result.nominal.whPerKm} Wh/km`,
      "Optimal Speed": `${result.optimalSpeed} km/h`,
    });
  };

  return (
    <div className="calc-split">
      <section className="calc-panel">
        <InputSection title="Vehicle & Pack">
          <NumberField label="Pack Energy" value={inputs.packKwh} min={10} max={250} step={1} unit="kWh" onChange={(value) => setInputs((p) => ({ ...p, packKwh: value }))} />
          <NumberField label="Vehicle Mass" value={inputs.vehicleMassKg} min={600} max={6000} step={10} unit="kg" onChange={(value) => setInputs((p) => ({ ...p, vehicleMassKg: value }))} />
        </InputSection>

        <InputSection title="Aerodynamics">
          <NumberField label="Drag Coefficient (Cd)" value={inputs.dragCoeff} min={0.18} max={0.75} step={0.01} onChange={(value) => setInputs((p) => ({ ...p, dragCoeff: value }))} />
          <NumberField label="Frontal Area" value={inputs.frontalAreaM2} min={1.6} max={4.5} step={0.05} unit="m2" onChange={(value) => setInputs((p) => ({ ...p, frontalAreaM2: value }))} />
        </InputSection>

        <InputSection title="Drivetrain & Rolling">
          <NumberField label="Rolling Resistance (Crr)" value={inputs.rollingCrr} min={0.006} max={0.03} step={0.001} onChange={(value) => setInputs((p) => ({ ...p, rollingCrr: value }))} />
          <NumberField label="Drivetrain Efficiency" value={inputs.drivetrainEff} min={0.7} max={0.97} step={0.01} onChange={(value) => setInputs((p) => ({ ...p, drivetrainEff: value }))} />
        </InputSection>

        <InputSection title="Operating Conditions">
          <NumberField label="Road Gradient" value={inputs.roadGradientPct} min={-15} max={15} step={0.5} unit="%" onChange={(value) => setInputs((p) => ({ ...p, roadGradientPct: value }))} />
          <NumberField label="Auxiliary Load" value={inputs.auxiliaryLoadW} min={0} max={2000} step={50} unit="W" onChange={(value) => setInputs((p) => ({ ...p, auxiliaryLoadW: value }))} />
          <NumberField label="Cruise Speed" value={inputs.cruiseSpeedKmh} min={20} max={160} step={5} unit="km/h" onChange={(value) => setInputs((p) => ({ ...p, cruiseSpeedKmh: value }))} />
        </InputSection>

        <div className="calc-actions">
          <button className="calc-btn" type="button" onClick={() => downloadCsv("range-estimator.csv", toCsv(result.currentCurve))}>Export CSV</button>
          <button className="calc-btn" type="button" onClick={shareResultsFn}>Share Results</button>
          <a className="calc-link" href={shareUrl}>Share Config URL</a>
          <button className="calc-btn secondary" type="button" onClick={() => setShowSteps(!showSteps)}>
            {showSteps ? "Hide Steps" : "Show Calculation Steps"}
          </button>
        </div>
      </section>

      <section className="calc-panel">
        <div className="calc-results-grid">
          <article className="result-card"><p>Range @ {inputs.cruiseSpeedKmh} km/h</p><h4>{result.nominal.rangeKm.toFixed(0)} km</h4></article>
          <article className="result-card"><p>Energy Consumption</p><h4>{result.nominal.whPerKm.toFixed(0)} Wh/km</h4></article>
          <article className="result-card"><p>Max Range</p><h4>{result.maxRange.toFixed(0)} km</h4></article>
          <article className="result-card"><p>Optimal Speed</p><h4>{result.optimalSpeed} km/h</h4></article>
        </div>

        {showSteps && <StepByStep steps={result.steps} />}

        <div className="calc-chart">
          <h4>Range vs Speed</h4>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="speedKmh" stroke="var(--text2)" label={{ value: "Speed (km/h)", position: "insideBottom", offset: -5 }} />
              <YAxis stroke="var(--text2)" label={{ value: "Range (km)", angle: -90, position: "insideLeft" }} />
              <Tooltip 
                contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                formatter={(value) => [`${value} km`, "Range"]}
              />
              <ReferenceLine x={inputs.cruiseSpeedKmh} stroke="#22c55e" strokeDasharray="5 5" />
              <ReferenceLine y={100} stroke="var(--text2)" strokeDasharray="3 3" opacity={0.3} />
              <ReferenceLine y={200} stroke="var(--text2)" strokeDasharray="3 3" opacity={0.3} />
              <ReferenceLine y={300} stroke="var(--text2)" strokeDasharray="3 3" opacity={0.3} />
              <Area type="monotone" dataKey="rangeKm" data={result.currentCurve} fill="var(--accent)" fillOpacity={0.1} stroke="transparent" />
              <Line type="monotone" data={result.currentCurve} dataKey="rangeKm" stroke="var(--accent)" strokeWidth={2} dot={false} name="Current Config" />
              <Line type="monotone" data={result.flatNoAux} dataKey="rangeKm" stroke="#22c55e" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Flat, No Aux" />
              <Line type="monotone" data={result.grade5Curve} dataKey="rangeKm" stroke="#f97316" strokeWidth={1.5} strokeDasharray="3 3" dot={false} name="5% Grade" />
              <ReferenceDot x={inputs.cruiseSpeedKmh} y={result.nominal.rangeKm} r={6} fill="#22c55e" stroke="white" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="calc-legend">
            <span><span className="legend-dot" style={{ background: "var(--accent)" }}></span> Current</span>
            <span><span className="legend-dot" style={{ background: "#22c55e" }}></span> Flat, No Aux</span>
            <span><span className="legend-dot" style={{ background: "#f97316" }}></span> 5% Grade</span>
            <span><span className="legend-dot" style={{ background: "#22c55e" }}></span> Your speed</span>
          </div>
        </div>
      </section>
    </div>
  );
}
