"use client";

import { useState } from "react";

type HeatGenerationResults = {
  powerLoss: string;
  energy: string;
  voltageDrop: string;
  efficiency: string;
};

export function HeatGenerationCalculator() {
  const [inputs, setInputs] = useState({
    current: 100,
    voltage: 400,
    internalResistance: 0.05,
    duration: 3600,
  });

  const [results, setResults] = useState<HeatGenerationResults | null>(null);

  const calculate = () => {
    const { current, internalResistance, duration } = inputs;
    
    const powerLoss = Math.pow(current, 2) * internalResistance;
    const energy = powerLoss * (duration / 3600);
    
    const ohm = current * internalResistance;
    
    setResults({
      powerLoss: powerLoss.toFixed(2),
      energy: energy.toFixed(2),
      voltageDrop: ohm.toFixed(2),
      efficiency: ((1 - powerLoss / inputs.voltage) * 100).toFixed(1),
    });
  };

  return (
    <div className="calc-form">
      <div className="calc-inputs">
        <div className="input-group">
          <label>Current (A)</label>
          <input type="number" value={inputs.current} onChange={(e) => setInputs({...inputs, current: +e.target.value})} />
        </div>
        <div className="input-group">
          <label>System Voltage (V)</label>
          <input type="number" value={inputs.voltage} onChange={(e) => setInputs({...inputs, voltage: +e.target.value})} />
        </div>
        <div className="input-group">
          <label>Cell Internal Resistance (Ω)</label>
          <input type="number" step="0.001" value={inputs.internalResistance} onChange={(e) => setInputs({...inputs, internalResistance: +e.target.value})} />
        </div>
        <div className="input-group">
          <label>Duration (seconds)</label>
          <input type="number" value={inputs.duration} onChange={(e) => setInputs({...inputs, duration: +e.target.value})} />
        </div>
      </div>
      <button className="calc-btn" onClick={calculate}>Calculate</button>
      {results && (
        <div className="calc-results">
          <h4>Results</h4>
          <div className="result-item">
            <span>Heat Generation:</span>
            <span className="result-value">{results.powerLoss} W</span>
          </div>
          <div className="result-item">
            <span>Energy Dissipated:</span>
            <span className="result-value">{results.energy} Wh</span>
          </div>
          <div className="result-item">
            <span>Voltage Drop:</span>
            <span className="result-value">{results.voltageDrop} V</span>
          </div>
          <div className="result-item">
            <span>System Efficiency:</span>
            <span className="result-value">{results.efficiency}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
