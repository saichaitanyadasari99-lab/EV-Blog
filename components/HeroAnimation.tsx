"use client";

import { useEffect, useRef } from "react";

export function HeroAnimation() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced && svgRef.current) {
      svgRef.current.querySelectorAll("animate, animateTransform").forEach((el) => el.remove());
    }
  }, []);

  return (
    <div className="hero-visual-wrap">
      <svg ref={svgRef} viewBox="0 0 400 340" className="hero-visual-svg" aria-hidden="true">
        <defs>
          <linearGradient id="bg-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a1a2e" />
            <stop offset="100%" stopColor="#16213e" />
          </linearGradient>
          <linearGradient id="cell-fill" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#4ade80" />
          </linearGradient>
          <linearGradient id="cell-fill-glow" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#4ade80" stopOpacity="0" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="soft-glow">
            <feGaussianBlur stdDeviation="2" />
          </filter>
        </defs>

        {/* Background */}
        <rect x="0" y="0" width="400" height="340" rx="16" fill="url(#bg-grad)" />

        {/* Subtle grid pattern */}
        <g opacity="0.06" stroke="#4ade80" strokeWidth="0.5">
          {Array.from({ length: 12 }).map((_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 30} x2="400" y2={i * 30} />
          ))}
          {Array.from({ length: 14 }).map((_, i) => (
            <line key={`v${i}`} x1={i * 30} y1="0" x2={i * 30} y2="340" />
          ))}
        </g>

        {/* === BATTERY CELL (hero element) === */}
        <g transform="translate(200, 170)">
          {/* Cell body */}
          <rect x="-60" y="-90" width="120" height="180" rx="12" fill="none" stroke="#22c55e" strokeWidth="2" opacity="0.6" />
          <rect x="-56" y="-86" width="112" height="148" rx="8" fill="none" stroke="#22c55e" strokeWidth="1" opacity="0.15" />
          
          {/* Positive terminal */}
          <rect x="-12" y="-96" width="24" height="10" rx="3" fill="#22c55e" opacity="0.8" />
          <rect x="-8" y="-106" width="16" height="12" rx="2" fill="#22c55e" opacity="0.6" />
          
          {/* Negative terminal */}
          <rect x="-12" y="86" width="24" height="10" rx="3" fill="#4ade80" opacity="0.8" />
          
          {/* Animated fill level */}
          <rect x="-56" y="-86" width="112" height="148" rx="8" fill="url(#cell-fill-glow)" />
          <rect x="-52" y="-82" width="104" height="0" rx="6" fill="url(#cell-fill)" opacity="0.85">
            <animate attributeName="height" values="20;140;20" dur="4s" repeatCount="indefinite" />
            <animate attributeName="y" values="62;-78;62" dur="4s" repeatCount="indefinite" />
          </rect>

          {/* Charge percentage text */}
          <text x="0" y="10" textAnchor="middle" fontSize="24" fontWeight="bold" fill="#4ade80" fontFamily="system-ui, sans-serif" opacity="0.9">
            <animate attributeName="opacity" values="0.9;0.6;0.9" dur="2s" repeatCount="indefinite" />
            <tspan>85</tspan><tspan fontSize="12" fill="#22c55e">%</tspan>
          </text>

          {/* Label */}
          <text x="0" y="38" textAnchor="middle" fontSize="9" fill="#6b7280" fontFamily="system-ui, sans-serif" letterSpacing="2">LFP CELL</text>

          {/* Charge indicators on sides */}
          <circle cx="-66" cy="-20" r="3" fill="#22c55e" opacity="0.8">
            <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1.2s" repeatCount="indefinite" />
          </circle>
          <circle cx="-66" cy="0" r="3" fill="#22c55e" opacity="0.8">
            <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1.2s" begin="0.4s" repeatCount="indefinite" />
          </circle>
          <circle cx="-66" cy="20" r="3" fill="#22c55e" opacity="0.8">
            <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1.2s" begin="0.8s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* === ENERGY PARTICLES FLOWING INTO BATTERY === */}
        {/* Particle stream from top-right */}
        <circle r="2.5" fill="#4ade80" filter="url(#glow)">
          <animate attributeName="cx" values="360;300;250;200" dur="2.5s" repeatCount="indefinite" />
          <animate attributeName="cy" values="60;80;100;120" dur="2.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;0.8;0.8;0" dur="2.5s" repeatCount="indefinite" />
          <animate attributeName="r" values="1;3;3;1" dur="2.5s" repeatCount="indefinite" />
        </circle>
        <circle r="2" fill="#22c55e" filter="url(#glow)">
          <animate attributeName="cx" values="370;310;260;210" dur="3s" begin="0.5s" repeatCount="indefinite" />
          <animate attributeName="cy" values="50;70;90;110" dur="3s" begin="0.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;0.7;0.7;0" dur="3s" begin="0.5s" repeatCount="indefinite" />
          <animate attributeName="r" values="1;2.5;2.5;1" dur="3s" begin="0.5s" repeatCount="indefinite" />
        </circle>
        <circle r="2" fill="#4ade80" filter="url(#glow)">
          <animate attributeName="cx" values="350;290;240;190" dur="2.8s" begin="1.2s" repeatCount="indefinite" />
          <animate attributeName="cy" values="70;90;110;130" dur="2.8s" begin="1.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;0.9;0.9;0" dur="2.8s" begin="1.2s" repeatCount="indefinite" />
          <animate attributeName="r" values="1;3;3;1" dur="2.8s" begin="1.2s" repeatCount="indefinite" />
        </circle>

        {/* Particle stream from bottom-left */}
        <circle r="2.5" fill="#4ade80" filter="url(#glow)">
          <animate attributeName="cx" values="40;100;150;200" dur="2.5s" begin="0.8s" repeatCount="indefinite" />
          <animate attributeName="cy" values="280;260;240;220" dur="2.5s" begin="0.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;0.8;0.8;0" dur="2.5s" begin="0.8s" repeatCount="indefinite" />
          <animate attributeName="r" values="1;3;3;1" dur="2.5s" begin="0.8s" repeatCount="indefinite" />
        </circle>
        <circle r="2" fill="#22c55e" filter="url(#glow)">
          <animate attributeName="cx" values="30;90;140;190" dur="2.7s" begin="1.8s" repeatCount="indefinite" />
          <animate attributeName="cy" values="290;270;250;230" dur="2.7s" begin="1.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;0.7;0.7;0" dur="2.7s" begin="1.8s" repeatCount="indefinite" />
          <animate attributeName="r" values="1;2.5;2.5;1" dur="2.7s" begin="1.8s" repeatCount="indefinite" />
        </circle>

        {/* === ENERGY WAVES EMITTING === */}
        <g transform="translate(200, 170)">
          <circle cx="0" cy="0" r="80" fill="none" stroke="#22c55e" strokeWidth="1" opacity="0.15">
            <animate attributeName="r" values="80;130" dur="2.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.15;0" dur="2.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="0" cy="0" r="80" fill="none" stroke="#4ade80" strokeWidth="1" opacity="0.15">
            <animate attributeName="r" values="80;130" dur="2.5s" begin="1.25s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.15;0" dur="2.5s" begin="1.25s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* === CIRCUIT PATHS === */}
        {/* Top circuit */}
        <g opacity="0.3" stroke="#22c55e" strokeWidth="1" fill="none">
          <path d="M20 50 L100 50 L100 80 L140 80">
            <animate attributeName="stroke-dashoffset" from="0" to="-200" dur="3s" repeatCount="indefinite" />
          </path>
          <circle cx="20" cy="50" r="2" fill="#22c55e" />
          <circle cx="140" cy="80" r="2" fill="#22c55e">
            <animate attributeName="r" values="2;3;2" dur="1s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* Bottom circuit */}
        <g opacity="0.3" stroke="#4ade80" strokeWidth="1" fill="none">
          <path d="M380 290 L300 290 L300 260 L260 260">
            <animate attributeName="stroke-dashoffset" from="0" to="-200" dur="3.5s" repeatCount="indefinite" />
          </path>
          <circle cx="380" cy="290" r="2" fill="#4ade80" />
          <circle cx="260" cy="260" r="2" fill="#4ade80">
            <animate attributeName="r" values="2;3;2" dur="1s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* Left circuit */}
        <g opacity="0.2" stroke="#22c55e" strokeWidth="0.8" fill="none" strokeDasharray="4 4">
          <path d="M30 100 L30 240" />
          <path d="M25 110 L35 110" />
          <path d="M25 140 L35 140" />
          <path d="M25 170 L35 170" />
          <path d="M25 200 L35 200" />
          <path d="M25 230 L35 230" />
        </g>

        {/* Right circuit */}
        <g opacity="0.2" stroke="#4ade80" strokeWidth="0.8" fill="none" strokeDasharray="4 4">
          <path d="M370 100 L370 240" />
          <path d="M365 110 L375 110" />
          <path d="M365 140 L375 140" />
          <path d="M365 170 L375 170" />
          <path d="M365 200 L375 200" />
          <path d="M365 230 L375 230" />
        </g>

        {/* === FLOATING SPECS === */}
        <g fontFamily="system-ui, sans-serif" fontSize="9" fill="#6b7280">
          <text x="30" y="40" opacity="0.6">3.2V</text>
          <text x="355" y="40" opacity="0.6">100Ah</text>
          <text x="30" y="315" opacity="0.6">LFP</text>
          <text x="355" y="315" opacity="0.6">1C</text>
        </g>

        {/* === BOTTOM GLOW BAR === */}
        <rect x="100" y="330" width="200" height="3" rx="1.5" fill="#22c55e" opacity="0.4" filter="url(#soft-glow)">
          <animate attributeName="opacity" values="0.4;0.7;0.4" dur="2s" repeatCount="indefinite" />
        </rect>

        {/* Corner accents */}
        <path d="M10 10 L40 10" stroke="#22c55e" strokeWidth="1.5" opacity="0.3" />
        <path d="M10 10 L10 40" stroke="#22c55e" strokeWidth="1.5" opacity="0.3" />
        <path d="M390 10 L360 10" stroke="#4ade80" strokeWidth="1.5" opacity="0.3" />
        <path d="M390 10 L390 40" stroke="#4ade80" strokeWidth="1.5" opacity="0.3" />
        <path d="M10 330 L40 330" stroke="#22c55e" strokeWidth="1.5" opacity="0.3" />
        <path d="M10 330 L10 300" stroke="#22c55e" strokeWidth="1.5" opacity="0.3" />
        <path d="M390 330 L360 330" stroke="#4ade80" strokeWidth="1.5" opacity="0.3" />
        <path d="M390 330 L390 300" stroke="#4ade80" strokeWidth="1.5" opacity="0.3" />
      </svg>
    </div>
  );
}
