const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.evpulse.co.in";

export const ORGANIZATION_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "EVPulse",
  url: baseUrl,
  logo: `${baseUrl}/icon.svg`,
  description: "Battery and EV technology newsroom with deep-dive technical analysis, battery engineering insights, and EV benchmarks.",
  sameAs: [
    "https://www.linkedin.com/company/evpulse",
    "https://www.evpulse.co.in",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    email: "chaitanya_dasari@evpulse.co.in",
    contactType: "customer service",
  },
};

export const WEBSITE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "EVPulse",
  url: baseUrl,
  description: "Battery and EV technology newsroom — deep-dive technical analysis, BMS design, cell chemistry, thermal management, charging infrastructure, and EV benchmarks.",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${baseUrl}/search?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

const CALCULATOR_SCHEMA_MAP: Record<string, string> = {
  "pack-size": "Battery pack SxP architecture designer with voltage, energy, density, and mass calculations",
  "heat-generation": "EV battery thermal load analyzer for continuous, pulse, and WLTC duty cycles",
  "cooling-plate": "Cold plate cooling system sizing with Reynolds, Nusselt, and pressure-drop analysis",
  "bus-bar": "High-voltage bus bar and fusing calculator with cross-section, loss, and thermal rise",
  "soc-estimator": "Battery state-of-charge estimator from OCV and temperature with chemistry-specific curves",
  "charging-time": "EV charging time calculator with CC-CV phase analysis and C-rate constraints",
  "range-estimator": "Electric vehicle range estimator across speeds with aero, rolling, and drivetrain losses",
  "cell-comparison": "Multi-cell comparison tool for energy density, power, cycle life, cost, and temperature",
  "bms-window-checker": "BMS voltage window checker for cell limits, pack range, and balancing thresholds",
};

export function getWebApplicationSchema(slug: string, name: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: `${name} — EVPulse`,
    url: `${baseUrl}/calculators/${slug}`,
    description: CALCULATOR_SCHEMA_MAP[slug] || `EV battery engineering calculator: ${name}`,
    applicationCategory: "EngineeringApplication",
    operatingSystem: "Web",
    browserRequirements: "Requires JavaScript",
    author: {
      "@type": "Organization",
      name: "EVPulse",
      url: baseUrl,
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };
}

export function getArticleSchema(article: {
  title: string;
  description: string;
  slug: string;
  cover_url?: string | null | undefined;
  author?: string;
  publishedAt?: string | null | undefined;
  modifiedAt?: string | null | undefined;
  category?: string | null | undefined;
  tags?: string[] | null | undefined;
  reading_time?: number | null | undefined;
  faqs?: Array<{ question: string; answer: string }> | null | undefined;
}) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    image: article.cover_url,
    url: `${baseUrl}/blog/${article.slug}`,
    datePublished: article.publishedAt,
    dateModified: article.modifiedAt,
    author: {
      "@type": "Person",
      name: article.author || "Sai Chaitanya Dasari",
      jobTitle: "Battery Systems Engineer",
      url: "https://www.linkedin.com/in/dasarisaisrinivasachaitanya",
    },
    publisher: {
      "@type": "Organization",
      name: "EVPulse",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/icon.svg`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${baseUrl}/blog/${article.slug}`,
    },
    articleSection: article.category,
    keywords: article.tags?.join(", "),
    timeRequired: article.reading_time ? `PT${article.reading_time}M` : undefined,
  };

  if (article.faqs && article.faqs.length > 0) {
    schema.about = {
      "@type": "FAQPage",
      mainEntity: article.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    };
  }

  return schema;
}

export function getBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function getFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}
