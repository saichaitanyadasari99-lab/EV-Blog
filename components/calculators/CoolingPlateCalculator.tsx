"use client";

import { useState } from "react";

export function CoolingPlateCalculator() {
  const [inputs, setInputs] = useState({
    heatLoad: 500,
    inletTemp: 25,
    outletTemp: 35,
    plateLength: 300,
    plateWidth: 200,
    thickness: 3,
    flowRate: 2,
  });

  const [results, setResults] = useState<any>(null);

  const calculate = () => {
    const { heatLoad, inletTemp, outletTemp, plateLength, plateWidth, flowRate } = inputs;
    const Cp = 4186;
    const rho = 1000;
    const k = 200;
    const thicknessM = inputs.thickness / 1000;
    
    const deltaT = outletTemp - inletTemp;
    const massFlow = (flowRate / 60) * rho;
    const requiredFlow = heatLoad / (Cp * deltaT);
    
    const area = (plateLength / 1000) * (plateWidth / 1000);
    const q = heatLoad / area;
    const U = k / thicknessM;
    const LMTD = ((outletTemp - inletTemp) / Math.log(1 + (outletTemp - inletTemp) / (inletTemp - 25))) || deltaT;
    
    setResults({
      requiredFlowRate: requiredFlow.toFixed(2),
      massFlow: massFlow.toFixed(2),
      heatFlux: q.toFixed(0),
      deltaT: deltaT.toFixed(1),
      requiredFlowRateLmin: (requiredFlow * 60 / rho).toFixed(2),
    });
  };

  return (
    <div className="calc-form">
      <div className="calc-inputs">
        <div className="input-group">
          <label>Heat Load (W)</label>
          <input type="number" value={inputs.heatLoad} onChange={(e) => setInputs({...inputs, heatLoad: +e.target.value})} />
        </div>
        <div className="input-group">
          <label>Inlet Temperature (°C)</label>
          <input type="number" value={inputs.inletTemp} onChange={(e) => setInputs({...inputs, inletTemp: +e.target.value})} />
        </div>
        <div className="input-group">
          <label>Outlet Temperature (°C)</label>
          <input type="number" value={inputs.outletTemp} onChange={(e) => setInputs({...inputs, outletTemp: +e.target.value})} />
        </div>
        <div className="input-group">
          <label>Plate Length (mm)</label>
          <input type="number" value={inputs.plateLength} onChange={(e) => setInputs({...inputs, plateLength: +e.target.value})} />
        </div>
        <div className="input-group">
          <label>Plate Width (mm)</label>
          <input type="number" value={inputs.plateWidth} onChange={(e) => setInputs({...inputs, plateWidth: +e.target.value})} />
        </div>
        <div className="input-group">
          <label>Channel Thickness (mm)</label>
          <input type="number" value={inputs.thickness} onChange={(e) => setInputs({...inputs, thickness: +e.target.value})} />
        </div>
        <div className="input-group">
          <label>Flow Rate (L/min)</label>
          <input type="number" value={inputs.flowRate} onChange={(e) => setInputs({...inputs, flowRate: +e.target.value})} />
        </div>
      </div>
      <button className="calc-btn" onClick={calculate}>Calculate</button>
      {results && (
        <div className="calc-results">
          <h4>Results</h4>
          <div className="result-item">
            <span>Required Flow Rate:</span>
            <span className="result-value">{results.requiredFlowRateLmin} L/min</span>
          </div>
          <div className="result-item">
            <span>Heat Flux:</span>
            <span className="result-value">{results.heatFlux} W/m²</span>
          </div>
          <div className="result-item">
            <span>Temperature Rise:</span>
            <span className="result-value">{results.deltaT} °C</span>
          </div>
        </div>
      )}
    </div>
  );
}