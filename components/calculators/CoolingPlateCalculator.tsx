"use client";

import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type CoolingResults = {
  requiredFlowRate: string;
  massFlow: string;
  heatFlux: string;
  deltaT: string;
  requiredFlowRateLmin: string;
};

type CoolingChartPoint = {
  flowRate: number;
  tempRise: number;
  heatFlux: number;
};

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

  const [results, setResults] = useState<CoolingResults | null>(null);
  const [chartData, setChartData] = useState<CoolingChartPoint[]>([]);

  const calculate = () => {
    const { heatLoad, inletTemp, outletTemp, plateLength, plateWidth, flowRate } = inputs;
    const Cp = 4186;
    const rho = 1000;
    
    const deltaT = outletTemp - inletTemp;
    const massFlow = (flowRate / 60) * rho;
    const requiredFlow = heatLoad / (Cp * deltaT);
    
    const area = (plateLength / 1000) * (plateWidth / 1000);
    const q = heatLoad / area;
    
    const flowData = [];
    for (let f = 0.5; f <= 5; f += 0.5) {
      const tempRise = heatLoad / (Cp * (f / 60) * rho);
      flowData.push({
        flowRate: f,
        tempRise: parseFloat(tempRise.toFixed(1)),
        heatFlux: parseFloat(q.toFixed(0)),
      });
    }
    
    setResults({
      requiredFlowRate: requiredFlow.toFixed(2),
      massFlow: massFlow.toFixed(2),
      heatFlux: q.toFixed(0),
      deltaT: deltaT.toFixed(1),
      requiredFlowRateLmin: (requiredFlow * 60 / rho).toFixed(2),
    });
    setChartData(flowData);
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
      <button className="calc-btn" onClick={calculate}>Run</button>
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
      {chartData.length > 0 && (
        <div className="calc-chart">
          <h4>Flow Rate vs Temperature Rise</h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="flowRate" stroke="var(--text2)" fontSize={12} />
              <YAxis stroke="var(--text2)" fontSize={12} />
              <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)' }} />
              <Line type="monotone" dataKey="tempRise" stroke="var(--accent)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
