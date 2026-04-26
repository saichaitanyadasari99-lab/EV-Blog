const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.evpulse.co.in";

export const ORGANIZATION_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "VoltPulse",
  url: baseUrl,
  logo: `${baseUrl}/favicon.ico`,
  description: "Battery and EV technology newsroom with deep-dive technical analysis, battery engineering insights, and EV benchmarks.",
  sameAs: [
    "https://twitter.com/voltpulse",
    "https://linkedin.com/company/voltpulse",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    email: "chaitanya_dasari@evpulse.co.in",
    contactType: "customer service",
  },
};

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
}) {
  return {
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
      name: article.author || "VoltPulse Team",
    },
    publisher: {
      "@type": "Organization",
      name: "VoltPulse",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/favicon.ico`,
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