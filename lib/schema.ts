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

const TIER_MAP: Record<string, string> = {
  basic: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  expert: "Expert",
};

const CATEGORY_TERM_MAP: Record<string, { name: string; description: string }> = {
  "cell-chemistry": {
    name: "Battery Cell Chemistry",
    description: "The study of electrochemical materials and reactions in battery cells including LFP, NMC, NCA, and sodium-ion chemistries.",
  },
  "bms-design": {
    name: "Battery Management System",
    description: "An electronic system that manages a rechargeable battery by monitoring its state, calculating secondary data, reporting data, and protecting the battery.",
  },
  "ev-benchmarks": {
    name: "Electric Vehicle Benchmarking",
    description: "Real-world performance testing and data collection of electric vehicle range, efficiency, charging behavior, and thermal characteristics.",
  },
  "vehicle-reviews": {
    name: "Electric Vehicle Review",
    description: "In-depth analysis of electric vehicle performance including range consistency, thermal behavior, and long-term efficiency.",
  },
  "standards": {
    name: "EV Battery Safety Standards",
    description: "Regulatory frameworks and compliance requirements for electric vehicle battery packs including UN ECE R100, UL 2580, AIS-156, and ISO 15118.",
  },
  "thermal": {
    name: "Battery Thermal Management",
    description: "Systems and strategies for controlling battery temperature including cooling plates, immersion cooling, heat pumps, and thermal runaway prevention.",
  },
  "charging": {
    name: "EV Charging Infrastructure",
    description: "Technologies and standards for electric vehicle charging including CCS, CHAdeMO, GB/T, AC charging, DC fast charging, and V2G.",
  },
  "news": {
    name: "EV Industry News",
    description: "Latest developments and updates in the electric vehicle and battery technology industry.",
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

const HOWTO_STEPS: Record<string, Array<{ name: string; text: string }>> = {
  "pack-size": [
    { name: "Enter cell specifications", text: "Input cell voltage (nominal, min, max), capacity in Ah, and cell dimensions." },
    { name: "Configure pack architecture", text: "Set the number of cells in series (S) and parallel (P) to define your pack configuration." },
    { name: "Review pack outputs", text: "The calculator computes pack voltage, total energy in kWh, energy density, mass estimate, and packaging dimensions." },
  ],
  "heat-generation": [
    { name: "Set cell parameters", text: "Enter cell DCIR, mass, specific heat capacity, and number of cells in the pack." },
    { name: "Choose duty cycle", text: "Select continuous, pulse, or WLTC drive cycle to model the current profile." },
    { name: "Analyze thermal load", text: "View per-cell and total pack heat generation, temperature rise estimates, and cooling requirements." },
  ],
  "cooling-plate": [
    { name: "Define plate geometry", text: "Enter channel dimensions (width, height, length), number of channels, and coolant properties." },
    { name: "Set flow conditions", text: "Input coolant flow rate, inlet temperature, and material thermal conductivity." },
    { name: "Review thermal performance", text: "Get Reynolds number, Nusselt number, heat transfer coefficient, pressure drop, and outlet temperature." },
  ],
  "bus-bar": [
    { name: "Enter electrical parameters", text: "Input continuous current, peak current, ambient temperature, and material (copper or aluminum)." },
    { name: "Set bar dimensions", text: "Specify bus bar length, width, and thickness or let the calculator suggest based on current." },
    { name: "Review results", text: "View cross-sectional area, electrical resistance, power loss, temperature rise, and fuse recommendations." },
  ],
  "soc-estimator": [
    { name: "Select cell chemistry", text: "Choose LFP, NMC, or NCA chemistry for the appropriate OCV-SOC curve model." },
    { name: "Enter measured values", text: "Input the measured open-circuit voltage and cell temperature." },
    { name: "Get SOC estimate", text: "The calculator estimates state-of-charge using temperature-compensated OCV-SOC curve fitting." },
  ],
  "charging-time": [
    { name: "Set battery parameters", text: "Enter pack energy capacity, nominal voltage, and maximum charge C-rate." },
    { name: "Configure charger", text: "Input charger power, voltage, and current limits." },
    { name: "Calculate charging time", text: "View CC phase duration, CV taper phase, and total charging time to full or target SOC." },
  ],
  "range-estimator": [
    { name: "Enter vehicle parameters", text: "Input vehicle mass, frontal area, drag coefficient, rolling resistance coefficient, and drivetrain efficiency." },
    { name: "Set driving conditions", text: "Choose speed range and ambient conditions." },
    { name: "Predict range", text: "View energy consumption per km, total range across speeds, and breakdown of aerodynamic vs rolling losses." },
  ],
  "cell-comparison": [
    { name: "Add cell data", text: "Enter specifications for up to three cell candidates including energy density, power density, cycle life, cost, and operating temperature range." },
    { name: "Compare metrics", text: "Review normalized scores across all parameters." },
    { name: "Select the best cell", text: "Use the radar chart and comparison table to identify the optimal cell for your application." },
  ],
  "bms-window-checker": [
    { name: "Enter cell limits", text: "Input cell voltage limits (Vmin, Vmax), nominal voltage, and number of series cells." },
    { name: "Set BMS thresholds", text: "Configure balancing start voltage, imbalance threshold, and over/under-voltage protection setpoints." },
    { name: "Validate pack window", text: "Review pack-level voltage window, balancing trigger points, and protection threshold margins." },
  ],
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

export function getHowToSchema(slug: string, name: string) {
  const steps = HOWTO_STEPS[slug];
  if (!steps) return null;
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `How to use the ${name}`,
    description: CALCULATOR_SCHEMA_MAP[slug] || `Step-by-step guide for the ${name}.`,
    step: steps.map((step, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: step.name,
      text: step.text,
    })),
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
  tier?: string | null | undefined;
  categorySlug?: string | null | undefined;
}) {
  const definedTerm = article.categorySlug ? CATEGORY_TERM_MAP[article.categorySlug] : null;
  const educationalLevel = article.tier ? TIER_MAP[article.tier] : undefined;

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
      worksFor: {
        "@type": "Organization",
        name: "Volvo Eicher Commercial Vehicles (VECV)",
      },
      alumniOf: {
        "@type": "CollegeOrUniversity",
        name: "BITS Pilani",
      },
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
    keywords: Array.isArray(article.tags) ? article.tags.join(", ") : typeof article.tags === "string" ? article.tags : "",
    timeRequired: article.reading_time ? `PT${article.reading_time}M` : undefined,
    inLanguage: "en-IN",
  };

  if (educationalLevel) {
    schema.educationalLevel = educationalLevel;
  }

  if (definedTerm) {
    schema.about = {
      "@type": "DefinedTerm",
      name: definedTerm.name,
      description: definedTerm.description,
    };
  }

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

export function getDefinedTermSetSchema(terms: Array<{ name: string; description: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    name: "EV Battery Engineering Glossary",
    description: "Comprehensive glossary of battery systems, BMS, and EV charging terms with engineering-grade definitions.",
    hasDefinedTerm: terms.map((term) => ({
      "@type": "DefinedTerm",
      name: term.name,
      description: term.description,
    })),
  };
}
