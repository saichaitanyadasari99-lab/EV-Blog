export default function AboutPage() {
  return (
    <main className="page-main wrapper">
      <section className="page-hero">
        <div className="hero-badge">ABOUT VOLTPULSE</div>
        <h1 className="page-title">Technical EV journalism with engineering depth.</h1>
        <p className="page-subtitle">
          VoltPulse focuses on battery design, pack systems, BMS controls, charging behavior, and market-level EV
          performance. The goal is to publish readable but rigorous technical content.
        </p>
      </section>

      <section className="info-grid">
        <article className="info-card">
          <h2>What We Cover</h2>
          <p>Cell chemistry, degradation, thermal safety, charging standards, and vehicle benchmark studies.</p>
        </article>
        <article className="info-card">
          <h2>Publishing Style</h2>
          <p>Editorial clarity and technical substance, with practical conclusions and evidence-backed comparisons.</p>
        </article>
        <article className="info-card">
          <h2>Who It&apos;s For</h2>
          <p>Engineers, EV founders, researchers, and curious readers tracking battery innovation.</p>
        </article>
      </section>
    </main>
  );
}

