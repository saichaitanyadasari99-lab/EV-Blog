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

type Inputs = {
  packKwh: number;
  vehicleMassKg: number;
  dragCoeff: number;
  frontalAreaM2: number;
  rollingCrr: number;
  drivetrainEff: number;
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
  });

  const result = useMemo(() => {
    const speedCurve = Array.from({ length: 14 }, (_, idx) => 30 + idx * 10).map((speedKmh) => {
      const speedMs = speedKmh / 3.6;
      const dragPower = 0.5 * AIR_DENSITY * inputs.dragCoeff * inputs.frontalAreaM2 * Math.pow(speedMs, 3);
      const rollingPower = inputs.vehicleMassKg * G * inputs.rollingCrr * speedMs;
      const totalPower = (dragPower + rollingPower) / Math.max(inputs.drivetrainEff, 0.6);
      const whPerKm = (totalPower / speedKmh) * 1000;
      const rangeKm = (inputs.packKwh * 1000) / Math.max(whPerKm, 1);
      return {
        speedKmh,
        whPerKm: Number(whPerKm.toFixed(1)),
        rangeKm: Number(rangeKm.toFixed(1)),
      };
    });

    const nominal = speedCurve.find((row) => row.speedKmh === 90) ?? speedCurve[6];
    return { speedCurve, nominal };
  }, [inputs]);

  const shareUrl = useShareUrl("range-estimator", {
    kwh: inputs.packKwh,
    m: inputs.vehicleMassKg,
    cd: inputs.dragCoeff,
    area: inputs.frontalAreaM2,
  });

  return (
    <div className="calc-split">
      <section className="calc-panel">
        <NumberField label="Pack Energy" value={inputs.packKwh} min={10} max={250} step={1} unit="kWh" onChange={(value) => setInputs((p) => ({ ...p, packKwh: value }))} />
        <NumberField label="Vehicle Mass" value={inputs.vehicleMassKg} min={600} max={6000} step={10} unit="kg" onChange={(value) => setInputs((p) => ({ ...p, vehicleMassKg: value }))} />
        <NumberField label="Drag Coefficient" value={inputs.dragCoeff} min={0.18} max={0.75} step={0.01} onChange={(value) => setInputs((p) => ({ ...p, dragCoeff: value }))} />
        <NumberField label="Frontal Area" value={inputs.frontalAreaM2} min={1.6} max={4.5} step={0.05} unit="m2" onChange={(value) => setInputs((p) => ({ ...p, frontalAreaM2: value }))} />
        <NumberField label="Rolling Resistance" value={inputs.rollingCrr} min={0.006} max={0.03} step={0.001} onChange={(value) => setInputs((p) => ({ ...p, rollingCrr: value }))} />
        <NumberField label="Drivetrain Efficiency" value={inputs.drivetrainEff} min={0.7} max={0.97} step={0.01} onChange={(value) => setInputs((p) => ({ ...p, drivetrainEff: value }))} />

        <div className="calc-actions">
          <button className="calc-btn" type="button" onClick={() => downloadCsv("range-estimator.csv", toCsv(result.speedCurve))}>Export CSV</button>
          <a className="calc-link" href={shareUrl}>Share Config URL</a>
        </div>
      </section>

      <section className="calc-panel">
        <div className="calc-results-grid">
          <article className="result-card"><p>Nominal (90km/h)</p><h4>{result.nominal.rangeKm.toFixed(0)} km</h4></article>
          <article className="result-card"><p>Energy Consumption</p><h4>{result.nominal.whPerKm.toFixed(0)} Wh/km</h4></article>
        </div>

        <div className="calc-chart">
          <h4>Range vs Speed Curve</h4>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={result.speedCurve}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="speedKmh" stroke="var(--text2)" />
              <YAxis stroke="var(--text2)" />
              <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)" }} />
              <Line type="monotone" dataKey="rangeKm" stroke="var(--accent)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
