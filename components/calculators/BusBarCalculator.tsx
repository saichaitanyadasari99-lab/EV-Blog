"use client";

import { useState } from "react";

type BusBarResults = {
  resistance: string;
  voltageDrop: string;
  powerLoss: string;
  currentDensity: string;
  maxCurrentCapacity: string;
};

export function BusBarCalculator() {
  const [inputs, setInputs] = useState({
    current: 200,
    length: 500,
    width: 50,
    thickness: 3,
    material: "copper",
    tempRise: 30,
  });

  const [results, setResults] = useState<BusBarResults | null>(null);

  const calculate = () => {
    const { current, length, width, thickness, material, tempRise } = inputs;
    
    const resistivity = material === "copper" ? 1.68e-8 : 2.82e-8;
    const conductivity = material === "copper" ? 380 : 230;
    
    const crossSection = (width * thickness) / 1000000;
    const resistance = (resistivity * length) / (crossSection * 1000);
    const voltageDrop = resistance * current;
    const powerLoss = voltageDrop * current;
    
    const maxCurrentDensity = conductivity * Math.sqrt(tempRise / (resistivity * length));
    
    setResults({
      resistance: (resistance * 1000).toFixed(3),
      voltageDrop: voltageDrop.toFixed(2),
      powerLoss: powerLoss.toFixed(2),
      currentDensity: (current / crossSection).toFixed(0),
      maxCurrentCapacity: (maxCurrentDensity * crossSection).toFixed(0),
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
          <label>Bus Bar Length (mm)</label>
          <input type="number" value={inputs.length} onChange={(e) => setInputs({...inputs, length: +e.target.value})} />
        </div>
        <div className="input-group">
          <label>Bus Bar Width (mm)</label>
          <input type="number" value={inputs.width} onChange={(e) => setInputs({...inputs, width: +e.target.value})} />
        </div>
        <div className="input-group">
          <label>Thickness (mm)</label>
          <input type="number" value={inputs.thickness} onChange={(e) => setInputs({...inputs, thickness: +e.target.value})} />
        </div>
        <div className="input-group">
          <label>Material</label>
          <select value={inputs.material} onChange={(e) => setInputs({...inputs, material: e.target.value})}>
            <option value="copper">Copper</option>
            <option value="aluminum">Aluminum</option>
          </select>
        </div>
        <div className="input-group">
          <label>Allowable Temp Rise (°C)</label>
          <input type="number" value={inputs.tempRise} onChange={(e) => setInputs({...inputs, tempRise: +e.target.value})} />
        </div>
      </div>
      <button className="calc-btn" onClick={calculate}>Calculate</button>
      {results && (
        <div className="calc-results">
          <h4>Results</h4>
          <div className="result-item">
            <span>Resistance:</span>
            <span className="result-value">{results.resistance} mΩ</span>
          </div>
          <div className="result-item">
            <span>Voltage Drop:</span>
            <span className="result-value">{results.voltageDrop} V</span>
          </div>
          <div className="result-item">
            <span>Power Loss:</span>
            <span className="result-value">{results.powerLoss} W</span>
          </div>
          <div className="result-item">
            <span>Current Density:</span>
            <span className="result-value">{results.currentDensity} A/mm²</span>
          </div>
          <div className="result-item">
            <span>Max Current Capacity:</span>
            <span className="result-value">{results.maxCurrentCapacity} A</span>
          </div>
        </div>
      )}
    </div>
  );
}
