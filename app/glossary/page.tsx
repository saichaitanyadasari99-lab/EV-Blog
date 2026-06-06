import type { Metadata } from "next";
import { glossaryTerms } from "@/lib/glossary";
import { getDefinedTermSetSchema } from "@/lib/schema";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.evpulse.co.in";

export const metadata: Metadata = {
  title: `EV Battery Engineering Glossary — ${glossaryTerms.length}+ Technical Terms Defined`,
  description: "Comprehensive glossary of EV battery, BMS, cell chemistry, thermal management, and charging infrastructure terms with engineering-grade definitions. SOC, SOH, LFP, NMC, EKF, DCIR, and more.",
  alternates: { canonical: `${baseUrl}/glossary` },
  openGraph: {
    title: `EV Battery Engineering Glossary | EVPulse`,
    description: `${glossaryTerms.length}+ battery systems, BMS, cell chemistry, and EV charging terms with engineering-grade definitions.`,
  },
};

function groupByFirstLetter(terms: typeof glossaryTerms) {
  const groups: Record<string, typeof glossaryTerms> = {};
  for (const term of terms) {
    const firstLetter = term.term[0].toUpperCase();
    if (!groups[firstLetter]) groups[firstLetter] = [];
    groups[firstLetter].push(term);
  }
  const sorted = Object.keys(groups).sort();
  return sorted.map((letter) => ({ letter, terms: groups[letter] }));
}

export default function GlossaryPage() {
  const groups = groupByFirstLetter(glossaryTerms);
  const definedTermSchema = getDefinedTermSetSchema(
    glossaryTerms.map((t) => ({ name: t.term, description: t.definition }))
  );
  const categories = [...new Set(glossaryTerms.map((t) => t.category))].sort();

  return (
    <main className="page-main wrapper">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(definedTermSchema) }}
      />

      <section className="page-hero page-hero-center">
        <div className="hero-badge">REFERENCE</div>
        <h1 className="page-title">EV Battery Engineering Glossary</h1>
        <p className="page-subtitle">
          {glossaryTerms.length} technical terms covering battery systems, BMS algorithms, cell chemistry, thermal management, charging infrastructure, and EV standards. Engineering-grade definitions you can cite.
        </p>
      </section>

      {/* Filter by category */}
      <section className="glossary-categories">
        <h2 className="sec-title">Browse by Category</h2>
        <div className="glossary-cat-list">
          {categories.map((cat) => {
            const count = glossaryTerms.filter((t) => t.category === cat).length;
            return (
              <a key={cat} href={`#cat-${cat.replace(/\s+/g, "-")}`} className="glossary-cat-tag">
                {cat} <span className="glossary-cat-count">({count})</span>
              </a>
            );
          })}
        </div>
      </section>

      {/* Terms by category */}
      {categories.map((cat) => {
        const catTerms = glossaryTerms.filter((t) => t.category === cat);
        return (
          <section key={cat} className="glossary-section" id={`cat-${cat.replace(/\s+/g, "-")}`}>
            <h2 className="sec-title">{cat}</h2>
            <dl className="glossary-list">
              {catTerms.map((item) => (
                <div key={item.term} className="glossary-item" id={`term-${item.term.toLowerCase().replace(/\s+/g, "-")}`}>
                  <dt className="glossary-term">{item.term}</dt>
                  <dd className="glossary-def">{item.definition}</dd>
                </div>
              ))}
            </dl>
          </section>
        );
      })}

      {/* Alphabetical index */}
      <section className="glossary-index">
        <h2 className="sec-title">Alphabetical Index</h2>
        <div className="glossary-alpha-list">
          {groups.map(({ letter, terms }) => (
            <div key={letter} className="glossary-alpha-group">
              <h3 className="glossary-alpha-letter">{letter}</h3>
              <ul className="glossary-alpha-terms">
                {terms.map((item) => (
                  <li key={item.term}>
                    <a href={`#term-${item.term.toLowerCase().replace(/\s+/g, "-")}`}>
                      {item.term}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
