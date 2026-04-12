"use client";

import { useMemo } from "react";

type NumberFieldProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
};

export function NumberField({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
}: NumberFieldProps) {
  return (
    <div className="input-group">
      <label>{label}</label>
      <div className="calc-field-row">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        {unit ? <span className="calc-unit">{unit}</span> : null}
      </div>
    </div>
  );
}

export function clampNumber(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return min;
  return Math.max(min, Math.min(max, value));
}

export function toCsv(rows: Array<Record<string, string | number>>) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const body = rows.map((row) =>
    headers.map((key) => JSON.stringify(row[key] ?? "")).join(","),
  );
  return [headers.join(","), ...body].join("\n");
}

export function useShareUrl(
  slug: string,
  params: Record<string, string | number | boolean>,
) {
  return useMemo(() => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      query.set(key, String(value));
    }
    return `/calculators/${slug}?${query.toString()}`;
  }, [params, slug]);
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

type InputSectionProps = {
  title: string;
  children: React.ReactNode;
};

export function InputSection({ title, children }: InputSectionProps) {
  return (
    <div className="input-section">
      <h3 className="input-section-title">{title}</h3>
      {children}
    </div>
  );
}

type Step = {
  title: string;
  formula: string;
  result: string;
};

type StepByStepProps = {
  steps: Step[];
};

export function StepByStep({ steps }: StepByStepProps) {
  return (
    <div className="step-by-step">
      <h4>Calculation Steps</h4>
      {steps.map((step, index) => (
        <div key={index} className="step">
          <div className="step-header">
            <span className="step-number">{index + 1}</span>
            <span className="step-title">{step.title}</span>
          </div>
          <div className="step-formula">{step.formula}</div>
          <div className="step-result">= {step.result}</div>
        </div>
      ))}
    </div>
  );
}
