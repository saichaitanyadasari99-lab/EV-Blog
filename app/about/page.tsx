import Link from "next/link";

const marqueeTags = [
  "BMS DESIGN", "LFP / NA-ION", "IMMERSION COOLING", "SWAPPABLE BATTERY",
  "CAN / J1939", "SIMULINK MBD", "PACK ENGINEERING", "AIS-156"
];

const topics = [
  {
    icon: "🔋",
    title: "BMS & Algorithm Design",
    description: "SOC/SOH estimation, CAN architecture, J1939 protocol, Simulink MBD",
  },
  {
    icon: "⚡",
    title: "Cell Chemistry & Degradation",
    description: "LFP, NMC, Na-ion, ACIR analysis, cycle aging",
  },
  {
    icon: "🌡️",
    title: "Thermal & Pack Systems",
    description: "Immersion cooling, swappable architectures, heat recovery, pack-level safety",
  },
];

const experience = [
  {
    role: "Deputy Manager — Battery Systems",
    company: "Volvo Eicher Commercial Vehicles",
    details: "End-to-end pack development across electric buses, trucks and LCVs. From architecture to homologation.",
    duration: "3+ Years",
    type: "Commercial EVs",
  },
  {
    role: "M.E. Design Engineering",
    company: "BITS Pilani · Postgraduate",
    details: "GATE 2021 — All India Top 1%",
    duration: "Masters",
    type: "",
  },
  {
    role: "B.Tech Mechanical Engineering",
    company: "Andhra University",
    details: "",
    duration: "Undergraduate",
    type: "",
  },
];

export default function AboutPage() {
  return (
    <main className="page-main wrapper">
      {/* Hero Section */}
      <section className="about-hero-grid">
        <div className="about-hero-left">
          <p className="about-label">ABOUT VOLTPULSE</p>
          <h1 className="about-hero-heading">
            Hi, I'm<br />
            <span className="about-hero-name">Sai Chaitanya.</span>
          </h1>
          <p className="about-hero-subtitle">Battery Systems Engineer ✦</p>
          <p className="about-hero-text">
            I've spent 3+ years inside commercial EV development — designing packs, writing BMS logic, and navigating homologation. VoltPulse is where I put what I've actually learned into writing.
          </p>
          <div className="about-checkmarks">
            <span className="about-check">✓</span>
            <span>From cell to system — immersion cooling to swappable packs</span>
          </div>
          <div className="about-checkmarks">
            <span className="about-check">✓</span>
            <span>Standards-aware, not standards-obsessed</span>
          </div>
          <div className="about-checkmarks">
            <span className="about-check">✓</span>
            <span>Written from the bench, not the boardroom</span>
          </div>
          <div className="about-hero-buttons">
            <Link href="/contact" className="about-btn-black">Let's Talk</Link>
            <a href="https://www.linkedin.com/in/dasarisaisrinivasachaitanya" target="_blank" rel="noreferrer" className="about-btn-outline">LinkedIn ↗</a>
            <a href="https://github.com/saichaitanyadasari99-lab" target="_blank" rel="noreferrer" className="about-btn-outline">GitHub ↗</a>
          </div>
        </div>
        <div className="about-hero-right">
          <div className="about-avatar-box">
            <div className="about-avatar-circle">
              <img src="/profile-photo.jpg" alt="Sai Chaitanya Dasari" className="about-avatar-img" />
            </div>
            <p className="about-avatar-name">Sai Chaitanya Dasari</p>
          </div>
        </div>
      </section>

      {/* Social Links Bar */}
      <section className="about-social-bar">
        <a href="https://www.linkedin.com/in/dasarisaisrinivasachaitanya" target="_blank" rel="noreferrer">LINKEDIN</a>
        <span className="about-social-divider">|</span>
        <a href="https://github.com/saichaitanyadasari99-lab" target="_blank" rel="noreferrer">GITHUB</a>
        <span className="about-social-divider">|</span>
        <a href="mailto:saichaitanyadasari99@gmail.com">saichaitanyadasari99@gmail.com</a>
        <span className="about-social-divider">|</span>
        <Link href="/blogs">ALL ARTICLES</Link>
      </section>

      {/* Marquee Strip */}
      <section className="about-marquee">
        <div className="about-marquee-track">
          {[...marqueeTags, ...marqueeTags].map((tag, idx) => (
            <span key={idx} className="about-marquee-item">⟡ {tag}</span>
          ))}
        </div>
      </section>

      {/* Topics I Cover */}
      <section className="about-section">
        <div className="about-section-header">
          <p className="about-label">WHAT I WRITE ABOUT</p>
          <h2 className="about-section-title">Topics I cover</h2>
        </div>
        <div className="about-cards">
          {topics.map((topic, idx) => (
            <article key={idx} className="about-card">
              <div className="about-card-icon-box">{topic.icon}</div>
              <h3 className="about-card-title">{topic.title}</h3>
              <p className="about-card-desc">{topic.description}</p>
              <Link href="/blogs" className="about-card-link">Read more →</Link>
            </article>
          ))}
        </div>
      </section>

      {/* Experience */}
      <section className="about-section about-exp-section">
        <p className="about-label">EXPERIENCE</p>
        <div className="about-exp-list">
          {experience.map((exp, idx) => (
            <div key={idx} className="about-exp-row">
              <div className="about-exp-left">
                <h3 className="about-exp-role">{exp.role}</h3>
                <p className="about-exp-company">{exp.company}</p>
                {exp.details && <p className="about-exp-details">{exp.details}</p>}
              </div>
              <div className="about-exp-right">
                <span className="about-exp-duration">{exp.duration}</span>
                {exp.type && <span className="about-exp-type">{exp.type}</span>}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
