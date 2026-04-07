import Link from "next/link";

const marqueeTags = [
  "BMS DESIGN", "LFP / Na-ION", "THERMAL ARCHITECTURE",
  "CAN/J1939", "SIMULINK MBD", "PACK ENGINEERING", "AIS-156"
];

const topics = [
  {
    icon: "🔋",
    title: "BMS & Algorithm Design",
    description: "SOC/SOH estimation, CAN architecture, J1939, Simulink MBD",
  },
  {
    icon: "⚡",
    title: "Cell Chemistry & Degradation",
    description: "LFP, NMC, Na-ion, ACIR analysis, cycle aging",
  },
  {
    icon: "🌡️",
    title: "Thermal & Pack Systems",
    description: "Cooling strategies, heat recovery, pack-level safety",
  },
];

const experience = [
  {
    role: "Deputy Manager — Battery Systems",
    company: "VECV",
    details: "96S LFP BMS development, Na-ion pack design, CAN/J1939, AIS-156 homologation",
  },
  {
    role: "M.E. Design Engineering",
    company: "BITS Pilani",
    details: "GPA 8.35 · GATE 2021 Top 1%",
  },
  {
    role: "B.Tech Mechanical Engineering",
    company: "Andhra University",
    details: "",
  },
];

export default function AboutPage() {
  return (
    <main className="page-main wrapper">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-hero-content">
          <p className="about-greeting">👋 Hello! I'm Sai Chaitanya Dasari</p>
          <h1 className="about-title">Battery Systems Engineer ✦</h1>
          <p className="about-intro">
            I'm a battery systems engineer at VECV, building the packs and BMS that power India's electric future.
            I write here because most EV content doesn't go deep enough.
          </p>
          <div className="about-checkmarks">
            <span>✓ Engineering-first perspective</span>
            <span>✓ Real systems, real tradeoffs</span>
            <span>✓ No PR fluff, no paywalls</span>
          </div>
          <div className="about-hero-actions">
            <Link href="/contact" className="about-btn-primary">Let's Talk →</Link>
            <a href="https://www.linkedin.com/in/dasarisaisrinivasachaitanya" target="_blank" rel="noreferrer" className="about-btn-secondary">LinkedIn ↗</a>
          </div>
        </div>
      </section>

      {/* Social Links Bar */}
      <section className="about-social-bar">
        <a href="https://www.linkedin.com/in/dasarisaisrinivasachaitanya" target="_blank" rel="noreferrer">LinkedIn</a>
        <a href="mailto:saichaitanyadasari99@gmail.com">Email</a>
        <Link href="/blogs">VoltPulse Blogs</Link>
      </section>

      {/* Marquee Strip */}
      <section className="about-marquee">
        <div className="about-marquee-track">
          {[...marqueeTags, ...marqueeTags].map((tag, idx) => (
            <span key={idx} className="about-marquee-item">⟡ {tag}</span>
          ))}
        </div>
      </section>

      {/* What I Write About */}
      <section className="about-section">
        <h2 className="about-section-title">WHAT I WRITE ABOUT</h2>
        <div className="about-cards">
          {topics.map((topic, idx) => (
            <article key={idx} className="about-card">
              <span className="about-card-icon">{topic.icon}</span>
              <h3 className="about-card-title">{topic.title}</h3>
              <p className="about-card-desc">{topic.description}</p>
              <Link href="/blogs" className="about-card-link">Read More →</Link>
            </article>
          ))}
        </div>
      </section>

      {/* Experience */}
      <section className="about-section">
        <h2 className="about-section-title">EXPERIENCE</h2>
        <div className="about-timeline">
          {experience.map((exp, idx) => (
            <div key={idx} className="about-timeline-row">
              <div className="about-timeline-role">{exp.role}</div>
              <div className="about-timeline-company">{exp.company}</div>
              {exp.details && <div className="about-timeline-details">{exp.details}</div>}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
