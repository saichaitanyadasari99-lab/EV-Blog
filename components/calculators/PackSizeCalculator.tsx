"use client";

import { useState } from "react";

export function PackSizeCalculator() {
  const [inputs, setInputs] = useState({
    cellLength: 148,
    cellWidth: 91,
    cellHeight: 27.4,
    cellsParallel: 96,
    cellsSeries: 96,
    moduleSize: 24,
  });

  const [results, setResults] = useState<any>(null);

  const calculate = () => {
    const { cellLength, cellWidth, cellHeight, cellsParallel, cellsSeries, moduleSize } = inputs;
    
    const cellsPerModule = Math.min(cellsParallel, moduleSize);
    const numModules = Math.ceil(cellsParallel / moduleSize) * Math.ceil(cellsSeries / moduleSize);
    
    const moduleLength = cellsPerModule * (cellWidth + 5);
    const moduleWidth = cellLength + 20;
    const moduleHeight = cellHeight + 10;
    
    const totalCells = cellsParallel * cellsSeries;
    const totalModules = numModules;
    
    const packLength = Math.ceil(cellsSeries / moduleSize) * (moduleLength + 10);
    const packWidth = Math.ceil(cellsParallel / moduleSize) * (moduleWidth + 10);
    const packHeight = moduleHeight + 50;
    
    const packVolume = (packLength * packWidth * packHeight) / 1000000000;
    const energyDensity = 300;
    const packEnergy = (totalCells * 3.7 * 200) / 1000;
    
    setResults({
      totalCells,
      numModules: totalModules,
      cellsPerModule,
      packLength: packLength.toFixed(0),
      packWidth: packWidth.toFixed(0),
      packHeight: packHeight.toFixed(0),
      packVolume: packVolume.toFixed(2),
      packEnergy: packEnergy.toFixed(0),
      moduleDimensions: `${moduleLength.toFixed(0)} x ${moduleWidth.toFixed(0)} x ${moduleHeight.toFixed(0)}`,
    });
  };

  return (
    <div className="calc-form">
      <div className="calc-inputs">
        <div className="input-group">
          <label>Cell Length (mm)</label>
          <input type="number" value={inputs.cellLength} onChange={(e) => setInputs({...inputs, cellLength: +e.target.value})} />
        </div>
        <div className="input-group">
          <label>Cell Width (mm)</label>
          <input type="number" value={inputs.cellWidth} onChange={(e) => setInputs({...inputs, cellWidth: +e.target.value})} />
        </div>
        <div className="input-group">
          <label>Cell Height (mm)</label>
          <input type="number" value={inputs.cellHeight} onChange={(e) => setInputs({...inputs, cellHeight: +e.target.value})} />
        </div>
        <div className="input-group">
          <label>Cells in Parallel</label>
          <input type="number" value={inputs.cellsParallel} onChange={(e) => setInputs({...inputs, cellsParallel: +e.target.value})} />
        </div>
        <div className="input-group">
          <label>Cells in Series</label>
          <input type="number" value={inputs.cellsSeries} onChange={(e) => setInputs({...inputs, cellsSeries: +e.target.value})} />
        </div>
        <div className="input-group">
          <label>Cells per Module</label>
          <input type="number" value={inputs.moduleSize} onChange={(e) => setInputs({...inputs, moduleSize: +e.target.value})} />
        </div>
      </div>
      <button className="calc-btn" onClick={calculate}>Calculate</button>
      {results && (
        <div className="calc-results">
          <h4>Results</h4>
          <div className="result-item">
            <span>Total Cells:</span>
            <span className="result-value">{results.totalCells}</span>
          </div>
          <div className="result-item">
            <span>Number of Modules:</span>
            <span className="result-value">{results.numModules}</span>
          </div>
          <div className="result-item">
            <span>Module Dimensions:</span>
            <span className="result-value">{results.moduleDimensions} mm</span>
          </div>
          <div className="result-item">
            <span>Pack Dimensions:</span>
            <span className="result-value">{results.packLength} x {results.packWidth} x {results.packHeight} mm</span>
          </div>
          <div className="result-item">
            <span>Pack Volume:</span>
            <span className="result-value">{results.packVolume} m³</span>
          </div>
          <div className="result-item">
            <span>Est. Pack Energy:</span>
            <span className="result-value">{results.packEnergy} kWh</span>
          </div>
        </div>
      )}
    </div>
  );
}