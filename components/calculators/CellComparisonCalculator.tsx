"use client";

import { useMemo, useState } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { downloadCsv, toCsv, useShareUrl, InputSection, StepByStep, shareResults } from "./common";

type UseCase = "passenger" | "bus" | "truck" | "storage";

type CellProfile = {
  id: string;
  name: string;
  energyDensity: number;
  powerDensity: number;
  cycleLife: number;
  costScore: number;
  tempRange: number;
  safetyScore: number;
};

const CELLS: CellProfile[] = [
  { id: "catl-lfp-280", name: "CATL LFP 280Ah", energyDensity: 165, powerDensity: 340, cycleLife: 7000, costScore: 9.0, tempRange: 70, safetyScore: 95 },
  { id: "samsung-nmc811", name: "Samsung NMC 811", energyDensity: 250, powerDensity: 520, cycleLife: 2200, costScore: 6.4, tempRange: 60, safetyScore: 70 },
  { id: "svolt-196", name: "SVOLT LFP 196Ah", energyDensity: 172, powerDensity: 360, cycleLife: 5500, costScore: 8.4, tempRange: 68, safetyScore: 90 },
  { id: "panasonic-nca", name: "Panasonic NCA", energyDensity: 265, powerDensity: 560, cycleLife: 1800, costScore: 5.8, tempRange: 58, safetyScore: 65 },
  { id: "catl-na-ion", name: "CATL Na-ion", energyDensity: 145, powerDensity: 300, cycleLife: 3000, costScore: 8.8, tempRange: 72, safetyScore: 85 },
];

const USE_CASE_TARGETS: Record<UseCase, Record<string, number>> = {
  passenger: { energyDensity: 80, powerDensity: 80, cycleLife: 60, costScore: 70, tempRange: 70, safetyScore: 70 },
  bus: { energyDensity: 50, powerDensity: 40, cycleLife: 90, costScore: 80, tempRange: 80, safetyScore: 90 },
  truck: { energyDensity: 40, powerDensity: 60, cycleLife: 95, costScore: 90, tempRange: 75, safetyScore: 85 },
  storage: { energyDensity: 30, powerDensity: 20, cycleLife: 100, costScore: 100, tempRange: 90, safetyScore: 80 },
};

const METRICS = [
  { key: "energyDensity", label: "Energy Density", unit: "Wh/kg" },
  { key: "powerDensity", label: "Power Density", unit: "W/kg" },
  { key: "cycleLife", label: "Cycle Life", unit: "cycles" },
  { key: "costScore", label: "Cost Efficiency", unit: "score" },
  { key: "tempRange", label: "Temp Range", unit: "°C" },
  { key: "safetyScore", label: "Safety Score", unit: "score" },
];

function normalize(value: number, min: number, max: number) {
  if (max === min) return 50;
  return ((value - min) / (max - min)) * 100;
}

export function CellComparisonCalculator() {
  const [selectedIds, setSelectedIds] = useState<string[]>(["catl-lfp-280", "samsung-nmc811", "catl-na-ion"]);
  const [useCase, setUseCase] = useState<UseCase>("passenger");
  const [showSteps, setShowSteps] = useState(false);

  const shareUrl = useShareUrl("cell-comparison", {
    cells: selectedIds.join(","),
    uc: useCase,
  });

  const shareResultsFn = () => {
    shareResults("Cell Comparison Results", {
      "Use Case": useCase,
      ...Object.fromEntries(selected.map((cell, i) => [`Cell ${i + 1}`, cell.name])),
      ...Object.fromEntries(selected.map((cell, i) => [`Score ${i + 1}`, `${scores[i]?.score ?? 0}/100`])),
    });
  };

  const selected = useMemo(
    () => CELLS.filter((cell) => selectedIds.includes(cell.id)).slice(0, 3),
    [selectedIds],
  );

  const radarData = useMemo(() => {
    const ranges = METRICS.map((metric) => {
      const values = CELLS.map((cell) => cell[metric.key as keyof CellProfile] as number);
      return { metric: metric.label, min: Math.min(...values), max: Math.max(...values), key: metric.key };
    });

    const targetData = METRICS.map((metric) => ({
      metric: metric.label,
      value: USE_CASE_TARGETS[useCase][metric.key] || 50,
    }));

    return {
      cells: ranges.map(({ metric, min, max, key }) => {
        const row: Record<string, string | number> = { metric };
        selected.forEach((cell) => {
          const val = cell[key as keyof CellProfile] as number;
          row[cell.name] = Number(normalize(val, min, max).toFixed(1));
        });
        return row;
      }),
      target: targetData,
    };
  }, [selected, useCase]);

  const scores = useMemo(() => {
    return selected.map((cell) => {
      const target = USE_CASE_TARGETS[useCase];
      const total = METRICS.reduce((sum, metric) => {
        const cellVal = cell[metric.key as keyof CellProfile] as number;
        const cellNorm = normalize(cellVal, 
          Math.min(...CELLS.map(c => c[metric.key as keyof CellProfile] as number)),
          Math.max(...CELLS.map(c => c[metric.key as keyof CellProfile] as number))
        );
        const targetVal = target[metric.key];
        const diff = Math.abs(cellNorm - targetVal);
        return sum + (100 - diff);
      }, 0);
      const score = Math.round(total / METRICS.length);
      return { cell, score };
    }).sort((a, b) => b.score - a.score);
  }, [selected, useCase]);

  const winner = scores[0];
  const runnerUp = scores[1];

  const getWinnerText = () => {
    if (!winner) return "";
    
    if (useCase === "truck" || useCase === "bus") {
      return `For ${useCase}: ${winner.cell.name} wins on cycle life and safety - ideal for commercial vehicles with high cycle requirements.`;
    } else if (useCase === "storage") {
      return `For stationary storage: ${winner.cell.name} wins on cycle life and cost efficiency - best for grid-scale applications.`;
    }
    return `For passenger car: ${winner.cell.name} wins on safety and cycle life; ${selected[1]?.name || "NMC"} wins on energy density - choose based on your priority.`;
  };

  const steps = selected.map((cell, idx) => ({
    title: `${cell.name} Normalized Scores`,
    formula: METRICS.map(m => {
      const val = cell[m.key as keyof CellProfile] as number;
      const min = Math.min(...CELLS.map(c => c[m.key as keyof CellProfile] as number));
      const max = Math.max(...CELLS.map(c => c[m.key as keyof CellProfile] as number));
      return `${m.label}: ${normalize(val, min, max).toFixed(0)}%`;
    }).join("\n"),
    result: `Overall match score: ${scores.find(s => s.cell.id === cell.id)?.score || 0}%`,
  }));

  return (
    <div className="calc-split">
      <section className="calc-panel">
        <InputSection title="Cell Selection">
          {[0, 1, 2].map((slot) => (
            <div className="input-group" key={slot}>
              <label>Cell {slot + 1}</label>
              <select
                value={selectedIds[slot] ?? ""}
                onChange={(event) => {
                  const next = [...selectedIds];
                  next[slot] = event.target.value;
                  setSelectedIds(next);
                }}
              >
                {CELLS.map((cell) => (
                  <option key={cell.id} value={cell.id}>{cell.name}</option>
                ))}
              </select>
            </div>
          ))}
        </InputSection>

        <InputSection title="Application Context">
          <div className="input-group">
            <label>Use Case</label>
            <select value={useCase} onChange={(e) => setUseCase(e.target.value as UseCase)}>
              <option value="passenger">Passenger Car</option>
              <option value="bus">City Bus</option>
              <option value="truck">Long-haul Truck</option>
              <option value="storage">Stationary Storage</option>
            </select>
          </div>
        </InputSection>

        <div className="calc-actions">
          <button
            className="calc-btn"
            type="button"
            onClick={() => downloadCsv("cell-comparison.csv", toCsv(selected.map((cell) => ({
              name: cell.name,
              energy_density: cell.energyDensity,
              power_density: cell.powerDensity,
              cycle_life: cell.cycleLife,
              cost_score: cell.costScore,
              temp_range_c: cell.tempRange,
              safety_score: cell.safetyScore,
            }))))}
          >
            Export CSV
          </button>
          <button className="calc-btn" type="button" onClick={shareResultsFn}>Share Results</button>
          <a className="calc-link" href={shareUrl}>Share Config URL</a>
          <button className="calc-btn secondary" type="button" onClick={() => setShowSteps(!showSteps)}>
            {showSteps ? "Hide Steps" : "Show Calculation Steps"}
          </button>
        </div>
      </section>

      <section className="calc-panel">
        <div className="calc-chart">
          <h4>Radar Comparison (Target: {useCase.charAt(0).toUpperCase() + useCase.slice(1)})</h4>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={radarData.cells}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
              <Tooltip 
                contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                formatter={(value) => [`${value}%`, "Score"]}
              />
              {selected[0] && <Radar dataKey={selected[0].name} stroke="#00b7cc" fill="#00b7cc" fillOpacity={0.2} name={selected[0].name} />}
              {selected[1] && <Radar dataKey={selected[1].name} stroke="#f97316" fill="#f97316" fillOpacity={0.15} name={selected[1].name} />}
              {selected[2] && <Radar dataKey={selected[2].name} stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} name={selected[2].name} />}
            </RadarChart>
          </ResponsiveContainer>
          <div className="calc-legend">
            {selected.map((cell, idx) => (
              <span key={cell.id}>
                <span className="legend-dot" style={{ background: idx === 0 ? "#00b7cc" : idx === 1 ? "#f97316" : "#22c55e" }}></span>
                {cell.name}
              </span>
            ))}
          </div>
        </div>

        {showSteps && <StepByStep steps={steps} />}

        {winner && (
          <div className="calc-winner-badge">
            <span className="winner-label">Winner for {useCase}:</span>
            <span className="winner-name">{winner.cell.name}</span>
            <span className="winner-score">Match Score: {winner.score}%</span>
            <p className="winner-summary">{getWinnerText()}</p>
          </div>
        )}

        <div className="calc-table-wrap">
          <h4>Raw Specifications</h4>
          <table className="calc-table">
            <thead>
              <tr><th>Cell</th><th>Wh/kg</th><th>W/kg</th><th>Cycles</th><th>Cost</th><th>Temp°C</th><th>Safety</th></tr>
            </thead>
            <tbody>
              {selected.map((cell, idx) => (
                <tr key={cell.id} className={idx === 0 ? "winner-row" : ""}>
                  <td>{cell.name}</td>
                  <td>{cell.energyDensity}</td>
                  <td>{cell.powerDensity}</td>
                  <td>{cell.cycleLife}</td>
                  <td>{cell.costScore.toFixed(1)}</td>
                  <td>{cell.tempRange}</td>
                  <td>{cell.safetyScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}