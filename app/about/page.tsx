import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="page-main wrapper">
      <section className="page-hero">
        <div className="hero-badge">ABOUT VOLTPULSE</div>
        <h1 className="page-title">Technical EV journalism written by someone who builds the systems.</h1>
        <p className="page-subtitle">
          VoltPulse is an independent publication focused on battery technology, BMS design, EV powertrain architecture, and the real engineering behind electric mobility — written from inside the industry, not from a press room.
        </p>
      </section>

      <section className="article-content">
        <h3>Hi, I'm Dasari Sai Srinivasa Chaitanya.</h3>
        <p>
          I'm a battery systems engineer at Volvo Eicher Commercial Vehicles (VECV), where I work as a Deputy Manager in the EV engineering team. My day job involves designing and developing battery packs for commercial electric vehicles — buses, trucks, and LCVs — across chemistries like LFP and Na-ion, and voltage architectures ranging from 96V to 600V.
        </p>
        <p>
          On the technical side, I work on BMS algorithm development in MATLAB/Simulink, CAN/J1939 communication architecture, thermal management systems, and homologation under AIS-156 and AIS-038 standards. I've been doing this for 3+ years, and I started VoltPulse because I kept running into EV content that was either too shallow for engineers or too jargon-heavy to be useful to anyone else.
        </p>
        <p>
          So I write the content I'd want to read — technically honest, practically grounded, and without the PR gloss.
        </p>
        <p>
          <a href="mailto:saichaitanyadasari99@gmail.com" style={{ color: "var(--accent)", textDecoration: "underline" }}>
            📧 saichaitanyadasari99@gmail.com
          </a>
        </p>
        <p>
          <a href="https://www.linkedin.com/in/dasarisaisrinivasachaitanya" target="_blank" rel="noreferrer" style={{ color: "var(--accent)", textDecoration: "underline" }}>
            🔗 LinkedIn
          </a>
        </p>
      </section>

      <section className="info-grid">
        <article className="info-card">
          <h2>What VoltPulse Covers</h2>
          <ul style={{ marginTop: 10, paddingLeft: 20 }}>
            <li><strong>Cell chemistry & degradation</strong> — LFP, NMC, Na-ion, ACIR analysis, cycle aging</li>
            <li><strong>BMS design</strong> — SOC/SOH estimation, CAN architecture, algorithm benchmarks</li>
            <li><strong>Thermal management</strong> — pack-level cooling strategies, safety margins, heat recovery</li>
            <li><strong>Charging behavior</strong> — CC-CV dynamics, fast charging limits, protocol standards</li>
            <li><strong>Commercial EV benchmarking</strong> — real-world range, powertrain sizing, India-market analysis</li>
          </ul>
        </article>
        <article className="info-card">
          <h2>Who It's For</h2>
          <p>
            Engineers in EV, battery, or power electronics. Founders building EV products. Researchers tracking battery behavior beyond lab papers. And anyone curious enough to want the real story behind electric mobility.
          </p>
        </article>
      </section>
    </main>
  );
}
