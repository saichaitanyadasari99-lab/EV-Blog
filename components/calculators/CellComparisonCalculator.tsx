"use client";

import { useMemo, useState } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { downloadCsv, toCsv } from "./common";

type CellProfile = {
  id: string;
  name: string;
  energyDensity: number;
  powerDensity: number;
  cycleLife: number;
  costScore: number;
  tempRange: number;
};

const CELLS: CellProfile[] = [
  { id: "catl-lfp-280", name: "CATL LFP 280Ah", energyDensity: 165, powerDensity: 340, cycleLife: 7000, costScore: 9.0, tempRange: 70 },
  { id: "samsung-nmc811", name: "Samsung NMC 811", energyDensity: 250, powerDensity: 520, cycleLife: 2200, costScore: 6.4, tempRange: 60 },
  { id: "svolt-196", name: "SVOLT LFP 196Ah", energyDensity: 172, powerDensity: 360, cycleLife: 5500, costScore: 8.4, tempRange: 68 },
  { id: "panasonic-nca", name: "Panasonic NCA", energyDensity: 265, powerDensity: 560, cycleLife: 1800, costScore: 5.8, tempRange: 58 },
  { id: "catl-na-ion", name: "CATL Na-ion", energyDensity: 145, powerDensity: 300, cycleLife: 3000, costScore: 8.8, tempRange: 72 },
];

const METRICS: Array<keyof Omit<CellProfile, "id" | "name">> = [
  "energyDensity",
  "powerDensity",
  "cycleLife",
  "costScore",
  "tempRange",
];

function normalize(value: number, min: number, max: number) {
  if (max === min) return 50;
  return ((value - min) / (max - min)) * 100;
}

export function CellComparisonCalculator() {
  const [selectedIds, setSelectedIds] = useState<string[]>(["catl-lfp-280", "samsung-nmc811", "catl-na-ion"]);

  const selected = useMemo(
    () => CELLS.filter((cell) => selectedIds.includes(cell.id)).slice(0, 3),
    [selectedIds],
  );

  const radarData = useMemo(() => {
    const ranges = METRICS.map((metric) => {
      const values = CELLS.map((cell) => cell[metric]);
      return { metric, min: Math.min(...values), max: Math.max(...values) };
    });

    return ranges.map(({ metric, min, max }) => {
      const row: Record<string, string | number> = { metric };
      selected.forEach((cell) => {
        row[cell.name] = Number(normalize(cell[metric], min, max).toFixed(1));
      });
      return row;
    });
  }, [selected]);

  return (
    <div className="calc-split">
      <section className="calc-panel">
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
            }))))}
          >
            Export CSV
          </button>
        </div>
      </section>

      <section className="calc-panel">
        <div className="calc-chart">
          <h4>Radar Comparison</h4>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <Tooltip />
              {selected[0] ? <Radar dataKey={selected[0].name} stroke="#00b7cc" fill="#00b7cc" fillOpacity={0.25} /> : null}
              {selected[1] ? <Radar dataKey={selected[1].name} stroke="#ff6b35" fill="#ff6b35" fillOpacity={0.2} /> : null}
              {selected[2] ? <Radar dataKey={selected[2].name} stroke="#00d68f" fill="#00d68f" fillOpacity={0.2} /> : null}
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="calc-table-wrap">
          <h4>Raw Specs</h4>
          <table className="calc-table">
            <thead>
              <tr><th>Cell</th><th>Wh/kg</th><th>W/kg</th><th>Cycles</th><th>Cost</th><th>Temp Range</th></tr>
            </thead>
            <tbody>
              {selected.map((cell) => (
                <tr key={cell.id}>
                  <td>{cell.name}</td>
                  <td>{cell.energyDensity}</td>
                  <td>{cell.powerDensity}</td>
                  <td>{cell.cycleLife}</td>
                  <td>{cell.costScore.toFixed(1)}</td>
                  <td>{cell.tempRange} C</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
