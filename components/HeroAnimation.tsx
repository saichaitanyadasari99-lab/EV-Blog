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
      <svg ref={svgRef} viewBox="0 0 640 340" className="hero-visual-svg" aria-hidden="true">
        <defs>
          <linearGradient id="vis-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--surface)" />
            <stop offset="60%" stopColor="var(--surface2)" />
            <stop offset="100%" stopColor="var(--surface3)" />
          </linearGradient>
          <linearGradient id="vis-glow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.15" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="vis-battery-fill" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="color-mix(in srgb, var(--accent) 70%, white)" />
          </linearGradient>
          <linearGradient id="vis-station-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--surface2)" />
            <stop offset="100%" stopColor="var(--surface3)" />
          </linearGradient>
          <filter id="vis-glow-filter">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="vis-soft-glow">
            <feGaussianBlur stdDeviation="3" />
          </filter>
          <clipPath id="vis-battery-clip-car">
            <rect x="0" y="0" width="16" height="22" rx="2" />
          </clipPath>
        </defs>

        {/* Sky */}
        <rect x="0" y="0" width="640" height="340" fill="url(#vis-sky)" />

        {/* Horizon glow */}
        <rect x="0" y="180" width="640" height="160" fill="url(#vis-glow)" />

        {/* Distant hills */}
        <path d="M0 280 Q80 240 160 265 Q240 250 320 270 Q400 245 480 260 Q560 250 640 275 L640 300 L0 300Z" fill="var(--surface3)" opacity="0.5" />

        {/* Ground */}
        <rect x="0" y="290" width="640" height="50" fill="var(--surface3)" opacity="0.3" />

        {/* Road */}
        <rect x="0" y="300" width="640" height="30" fill="var(--surface2)" opacity="0.6" />
        <line x1="0" y1="315" x2="40" y2="315" stroke="var(--border)" strokeWidth="1.5" strokeDasharray="20 16" opacity="0.4">
          <animate attributeName="x1" from="0" to="40" dur="0.8s" repeatCount="indefinite" />
          <animate attributeName="x2" from="40" to="80" dur="0.8s" repeatCount="indefinite" />
        </line>

        {/* Wind turbine */}
        <g className="vis-turbine" transform="translate(80, 180)">
          <line x1="0" y1="0" x2="0" y2="110" stroke="var(--border)" strokeWidth="2.5" />
          <circle cx="0" cy="0" r="3" fill="var(--accent)" />
          <g className="vis-turbine-blades">
            <path d="M0 0 L-20 -25 L-3 -3Z" fill="var(--accent)" opacity="0.7" />
            <path d="M0 0 L20 -25 L3 -3Z" fill="var(--accent)" opacity="0.7" />
            <path d="M0 0 L0 28 L0 5Z" fill="var(--accent)" opacity="0.7" />
            <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="4s" repeatCount="indefinite" />
          </g>
        </g>

        {/* EV battery icon - large left */}
        <g transform="translate(40, 70)" className="vis-battery-icon">
          <rect x="0" y="0" width="32" height="48" rx="4" fill="none" stroke="var(--border2)" strokeWidth="1.5" />
          <rect x="12" y="-6" width="8" height="6" rx="2" fill="none" stroke="var(--border2)" strokeWidth="1.5" />
          {/* Battery fill */}
          <rect x="3" y="3" width="26" height="42" rx="2" fill="url(#vis-battery-fill)" opacity="0.8">
            <animate attributeName="y" from="20" to="3" dur="3s" repeatCount="indefinite" />
            <animate attributeName="height" from="25" to="42" dur="3s" repeatCount="indefinite" />
          </rect>
          {/* Charge bolt */}
          <path d="M16 12 L10 24 H16 L14 34 L22 20 H16Z" fill="var(--surface)" opacity="0.9">
            <animate attributeName="opacity" values="0.9;0.5;0.9" dur="1.5s" repeatCount="indefinite" />
          </path>
        </g>

        {/* Small battery icon - right */}
        <g transform="translate(560, 65)" className="vis-battery-icon-sm">
          <rect x="0" y="0" width="22" height="34" rx="3" fill="none" stroke="var(--border2)" strokeWidth="1.5" />
          <rect x="8" y="-5" width="6" height="5" rx="1.5" fill="none" stroke="var(--border2)" strokeWidth="1.5" />
          <rect x="3" y="3" width="16" height="28" rx="2" fill="url(#vis-battery-fill)" opacity="0.7">
            <animate attributeName="y" from="15" to="3" dur="2.5s" repeatCount="indefinite" />
            <animate attributeName="height" from="16" to="28" dur="2.5s" repeatCount="indefinite" />
          </rect>
        </g>

        {/* Energy particles floating */}
        <circle cx="120" cy="130" r="2" fill="var(--accent)" opacity="0.6">
          <animate attributeName="cy" from="130" to="110" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;0;0.6" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="135" cy="140" r="1.5" fill="var(--accent)" opacity="0.5">
          <animate attributeName="cy" from="140" to="115" dur="3.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.5;0;0.5" dur="3.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="500" cy="120" r="2" fill="var(--accent)" opacity="0.5">
          <animate attributeName="cy" from="120" to="100" dur="4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.5;0;0.5" dur="4s" repeatCount="indefinite" />
        </circle>

        {/* --- CHARGING STATION --- */}
        <g transform="translate(270, 170)" className="vis-station">
          {/* Station body */}
          <rect x="0" y="0" width="90" height="120" rx="6" fill="url(#vis-station-grad)" stroke="var(--border2)" strokeWidth="1.5" />
          {/* Screen */}
          <rect x="15" y="10" width="60" height="30" rx="3" fill="var(--surface)" stroke="var(--border)" strokeWidth="1" />
          {/* Screen content */}
          <text x="45" y="28" textAnchor="middle" fontSize="7" fill="var(--accent)" fontFamily="monospace">CHARGING</text>
          {/* LED indicators */}
          <circle cx="25" cy="50" r="3" fill="var(--accent)" className="vis-led" />
          <circle cx="45" cy="50" r="3" fill="var(--accent)" className="vis-led" style={{ animationDelay: "0.3s" }} />
          <circle cx="65" cy="50" r="3" fill="var(--accent)" className="vis-led" style={{ animationDelay: "0.6s" }} />
          {/* Power rating */}
          <text x="45" y="68" textAnchor="middle" fontSize="8" fill="var(--text2)" fontFamily="monospace">350 kW</text>
          {/* Cable ports */}
          <rect x="8" y="80" width="12" height="8" rx="2" fill="var(--surface)" stroke="var(--border)" strokeWidth="1" />
          <rect x="38" y="80" width="12" height="8" rx="2" fill="var(--surface)" stroke="var(--border)" strokeWidth="1" />
          <rect x="68" y="80" width="12" height="8" rx="2" fill="var(--surface)" stroke="var(--border)" strokeWidth="1" />
          {/* Base */}
          <rect x="10" y="112" width="70" height="8" rx="2" fill="var(--surface3)" stroke="var(--border)" strokeWidth="1" />
        </g>

        {/* --- BATTERY PACK ON GROUND --- */}
        <g transform="translate(390, 285)" className="vis-pack">
          <rect x="0" y="0" width="60" height="25" rx="4" fill="var(--surface3)" stroke="var(--border2)" strokeWidth="1.5" />
          <rect x="5" y="5" width="50" height="15" rx="2" fill="var(--surface)" />
          {/* Cells visible */}
          <rect x="8" y="8" width="8" height="9" rx="1" fill="var(--accent)" opacity="0.4" />
          <rect x="19" y="8" width="8" height="9" rx="1" fill="var(--accent)" opacity="0.6" />
          <rect x="30" y="8" width="8" height="9" rx="1" fill="var(--accent)" opacity="0.5" />
          <rect x="41" y="8" width="8" height="9" rx="1" fill="var(--accent)" opacity="0.7" />
          {/* Terminals */}
          <rect x="25" y="-4" width="10" height="5" rx="1.5" fill="var(--border2)" />
          <circle cx="30" cy="-8" r="3" fill="none" stroke="var(--accent)" strokeWidth="1" />
        </g>

        {/* Cable from station to pack */}
        <path d="M340 240 Q360 265 375 285" fill="none" stroke="var(--accent)" strokeWidth="2" opacity="0.6" strokeDasharray="4 3" className="vis-cable" />

        {/* --- EV SEDAN --- */}
        <g transform="translate(160, 260)" className="vis-car">
          {/* Body */}
          <path d="M10 25 L5 35 L65 35 L70 25 L60 10 L20 10Z" fill="var(--surface2)" stroke="var(--accent)" strokeWidth="1.5" />
          {/* Roof */}
          <path d="M22 10 L25 0 L55 0 L58 10Z" fill="var(--surface3)" stroke="var(--accent)" strokeWidth="1" />
          {/* Windshield */}
          <path d="M22 10 L25 2 L35 2 L35 10Z" fill="var(--surface)" opacity="0.7" />
          <path d="M45 10 L45 2 L55 2 L58 10Z" fill="var(--surface)" opacity="0.7" />
          {/* Windows */}
          <rect x="26" y="3" width="7" height="6" rx="1" fill="var(--surface)" opacity="0.5" />
          <rect x="47" y="3" width="7" height="6" rx="1" fill="var(--surface)" opacity="0.5" />
          {/* Door line */}
          <line x1="40" y1="10" x2="40" y2="25" stroke="var(--border)" strokeWidth="0.5" />
          {/* Headlights */}
          <rect x="66" y="20" width="4" height="4" rx="1" fill="var(--accent)" opacity="0.8" />
          <rect x="66" y="26" width="4" height="3" rx="1" fill="var(--accent)" opacity="0.6" />
          {/* Tail lights */}
          <rect x="4" y="21" width="3" height="3" rx="0.5" fill="#f97316" opacity="0.8" />
          {/* Wheels */}
          <circle cx="18" cy="35" r="7" fill="var(--surface3)" stroke="var(--border)" strokeWidth="1.5" />
          <circle cx="18" cy="35" r="3" fill="var(--border2)" />
          <circle cx="52" cy="35" r="7" fill="var(--surface3)" stroke="var(--border)" strokeWidth="1.5" />
          <circle cx="52" cy="35" r="3" fill="var(--border2)" />
          {/* Battery indicator on side */}
          <rect x="30" y="15" width="12" height="4" rx="1" fill="none" stroke="var(--accent)" strokeWidth="0.8" />
          <rect x="31" y="16" width="6" height="2" rx="0.5" fill="var(--accent)" opacity="0.7">
            <animate attributeName="width" from="2" to="6" dur="2s" repeatCount="indefinite" />
          </rect>
          {/* Charge port glow */}
          <circle cx="54" cy="18" r="2" fill="var(--accent)" filter="url(#vis-glow-filter)" opacity="0.6">
            <animate attributeName="opacity" values="0.6;1;0.6" dur="1s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* Cable from station to car */}
        <path d="M280 200 Q260 230 195 265" fill="none" stroke="var(--accent)" strokeWidth="1.5" opacity="0.7" strokeDasharray="4 3" className="vis-cable-2" />

        {/* Energy particles along cable */}
        <circle r="2" fill="var(--accent)" opacity="0.8">
          <animate attributeName="cx" from="195" to="280" dur="2s" repeatCount="indefinite" />
          <animate attributeName="cy" from="265" to="200" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
        </circle>

        {/* --- EV SUV --- */}
        <g transform="translate(445, 255)" className="vis-suv">
          {/* Body */}
          <path d="M8 28 L3 38 L67 38 L72 28 L62 12 L18 12Z" fill="var(--surface2)" stroke="var(--accent)" strokeWidth="1.5" />
          {/* Roof */}
          <path d="M20 12 L23 2 L57 2 L60 12Z" fill="var(--surface3)" stroke="var(--accent)" strokeWidth="1" />
          {/* Windows */}
          <path d="M22 12 L25 4 L38 4 L38 12Z" fill="var(--surface)" opacity="0.7" />
          <path d="M42 12 L42 4 L55 4 L58 12Z" fill="var(--surface)" opacity="0.7" />
          {/* Headlights */}
          <rect x="68" y="23" width="4" height="5" rx="1" fill="var(--accent)" opacity="0.8" />
          {/* Tail lights */}
          <rect x="2" y="24" width="4" height="3" rx="0.5" fill="#f97316" opacity="0.8" />
          {/* Wheels */}
          <circle cx="18" cy="38" r="8" fill="var(--surface3)" stroke="var(--border)" strokeWidth="1.5" />
          <circle cx="18" cy="38" r="3.5" fill="var(--border2)" />
          <circle cx="52" cy="38" r="8" fill="var(--surface3)" stroke="var(--border)" strokeWidth="1.5" />
          <circle cx="52" cy="38" r="3.5" fill="var(--border2)" />
          {/* Battery charge indicator */}
          <rect x="32" y="18" width="10" height="3" rx="1" fill="none" stroke="var(--accent)" strokeWidth="0.8" />
          <rect x="33" y="19" width="7" height="1.5" rx="0.5" fill="var(--accent)" opacity="0.7">
            <animate attributeName="width" from="3" to="7" dur="2.5s" repeatCount="indefinite" />
          </rect>
        </g>

        {/* Cable from station to SUV */}
        <path d="M350 210 Q380 230 488 262" fill="none" stroke="var(--accent)" strokeWidth="1.5" opacity="0.7" strokeDasharray="4 3" className="vis-cable-3" />

        {/* Energy particle along cable 2 */}
        <circle r="2" fill="var(--accent)" opacity="0.8">
          <animate attributeName="cx" from="488" to="350" dur="2.2s" repeatCount="indefinite" />
          <animate attributeName="cy" from="262" to="210" dur="2.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;0;0.8" dur="2.2s" repeatCount="indefinite" />
        </circle>

        {/* --- MICRO/GRASS EV (small scooter) on road --- */}
        <g transform="translate(550, 305)" className="vis-scooter">
          <rect x="0" y="0" width="20" height="10" rx="3" fill="var(--accent)" opacity="0.6" stroke="var(--accent)" strokeWidth="1" />
          <circle cx="5" cy="10" r="4" fill="var(--surface3)" stroke="var(--border)" strokeWidth="1" />
          <circle cx="5" cy="10" r="1.5" fill="var(--border2)" />
          <circle cx="15" cy="10" r="4" fill="var(--surface3)" stroke="var(--border)" strokeWidth="1" />
          <circle cx="15" cy="10" r="1.5" fill="var(--border2)" />
          <line x1="10" y1="0" x2="12" y2="-6" stroke="var(--accent)" strokeWidth="1.5" />
          <rect x="8" y="-10" width="8" height="5" rx="1.5" fill="var(--surface2)" stroke="var(--accent)" strokeWidth="0.8" />
        </g>

        {/* --- DATA FLOW NODES (floating) --- */}
        <g className="vis-nodes">
          <circle cx="200" cy="100" r="3" fill="var(--accent)" opacity="0.5" filter="url(#vis-glow-filter)">
            <animate attributeName="r" values="3;4;3" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="320" cy="130" r="2.5" fill="var(--accent)" opacity="0.4">
            <animate attributeName="r" values="2.5;3.5;2.5" dur="2.3s" repeatCount="indefinite" />
          </circle>
          <circle cx="450" cy="110" r="2.5" fill="var(--accent)" opacity="0.4" filter="url(#vis-glow-filter)">
            <animate attributeName="r" values="2.5;3.5;2.5" dur="2.7s" repeatCount="indefinite" />
          </circle>
          {/* Data lines between nodes */}
          <line x1="200" y1="100" x2="320" y2="130" stroke="var(--accent)" strokeWidth="0.8" opacity="0.15" strokeDasharray="3 4">
            <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="1.5s" repeatCount="indefinite" />
          </line>
          <line x1="320" y1="130" x2="450" y2="110" stroke="var(--accent)" strokeWidth="0.8" opacity="0.15" strokeDasharray="3 4">
            <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="1.8s" repeatCount="indefinite" />
          </line>
        </g>

        {/* Waveform at bottom */}
        <path d="M0 338 Q10 334 20 338 T40 338 T60 338 T80 338 T100 338" fill="none" stroke="var(--accent)" strokeWidth="1" opacity="0.2">
          <animate attributeName="d" values="M0 338 Q10 334 20 338 T40 338 T60 338 T80 338 T100 338;M0 338 Q10 342 20 338 T40 338 T60 338 T80 338 T100 338;M0 338 Q10 334 20 338 T40 338 T60 338 T80 338 T100 338" dur="2s" repeatCount="indefinite" />
        </path>
      </svg>
    </div>
  );
}
