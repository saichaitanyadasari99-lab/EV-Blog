import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import { getCategoryTone } from "@/lib/category-theme";
import { getPublishedPostsByCategory } from "@/lib/posts";
import { PostCard } from "@/components/PostCard";

type Params = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 60;

const CATEGORY_META: Record<string, { title: string; description: string }> = {
  "cell-chemistry": {
    title: "Cell Chemistry — LFP, NMC, Na-ion Battery Analysis",
    description: "Deep-dive analysis of lithium-ion cell chemistry including LFP, NMC 811, NCA, sodium-ion, DCIR rise, OCV-SOC hysteresis, silicon anode, and calendar aging.",
  },
  "bms-design": {
    title: "BMS Design — Battery Management Systems Engineering",
    description: "Technical articles on BMS algorithm design including SOC/SOH estimation, EKF vs UKF, active balancing topologies, CAN FD vs Ethernet, ISO 26262 safety goals, and thermal runaway detection.",
  },
  "ev-benchmarks": {
    title: "EV Benchmarks — Real-World EV Performance Data",
    description: "Real-world EV performance benchmarks including DC fast charge taper curves, winter range loss, regenerative braking efficiency, and HVAC load sensitivity.",
  },
  "vehicle-reviews": {
    title: "Vehicle Reviews — EV Range & Thermal Behavior Analysis",
    description: "In-depth EV reviews analyzing real-world range consistency, thermal behavior, and long-term efficiency across popular electric vehicle models.",
  },
  "standards": {
    title: "EV Standards — UN ECE R100, UL 2580, ISO 15118 Compliance",
    description: "Technical guides on EV battery safety standards including UN ECE R100, UL 2580, AIS-156, ISO 15118 plug and charge, and IEC 61851 charging protocols.",
  },
  "news": {
    title: "EV Battery Industry News & Updates",
    description: "Latest news and updates in the EV battery industry — new cell technologies, regulatory changes, charging infrastructure developments, and production announcements.",
  },
};

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const meta = CATEGORY_META[slug];
  if (!meta) {
    const displayName = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return { title: `${displayName} — EV Battery Articles`, description: `Technical articles under the ${displayName} category.` };
  }
  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
    },
  };
}

export default async function CategoryPage({ params }: Params) {
  const { slug } = await params;
  const posts = await getPublishedPostsByCategory(slug);

  const toneStyle = { ["--tone" as string]: getCategoryTone(slug) } as CSSProperties;
  const displayName = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <main className="page-main wrapper">
      <section className="page-hero" style={toneStyle}>
        <div className="hero-badge" style={{ background: "var(--tone)", color: "#000" }}>
          CATEGORY
        </div>
        <h1 className="page-title" style={{ textTransform: "capitalize" }}>
          {displayName}
        </h1>
        <p className="page-subtitle">Technical posts under the {displayName} category.</p>
        <Link href="/blogs" className="sec-link" style={{ marginTop: 8, display: "inline-flex" }}>
          Browse all blogs {"->"}
        </Link>
      </section>

      <section className="sec-head">
        <h2 className="sec-title">Articles</h2>
      </section>
      <section className="articles-grid">
        {posts.length > 0 ? (
          posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))
        ) : (
          <article className="a-card">
            <div className="a-card-body">
              <h3 className="a-title">No articles yet</h3>
              <p className="a-excerpt">There are no published articles in this category yet. Check back soon or browse all blogs.</p>
            </div>
          </article>
        )}
      </section>
    </main>
  );
}



