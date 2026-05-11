import { MetadataRoute } from "next";
import { getPublicSupabaseClient } from "@/lib/supabase/public";

const CALCULATOR_SLUGS = [
  "pack-size", "heat-generation", "cooling-plate", "bus-bar",
  "bms-window-checker", "charging-time", "cell-comparison",
  "range-estimator", "soc-estimator",
];

const CATEGORY_SLUGS = [
  "cell-chemistry", "bms-design", "ev-benchmarks",
  "vehicle-reviews", "standards", "news",
  "thermal", "charging",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.evpulse.co.in";

  const supabase = getPublicSupabaseClient();
  const { data: posts } = await supabase
    .from("posts")
    .select("slug, updated_at, created_at")
    .eq("published", true) as unknown as { data: { slug: string; updated_at: string | null; created_at: string }[] | null };

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/blogs`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/calculators`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/search`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.5 },
    { url: `${baseUrl}/glossary`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
  ];

  const calculatorPages: MetadataRoute.Sitemap = CALCULATOR_SLUGS.map((slug) => ({
    url: `${baseUrl}/calculators/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const categoryPages: MetadataRoute.Sitemap = CATEGORY_SLUGS.map((slug) => ({
    url: `${baseUrl}/category/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const blogPages: MetadataRoute.Sitemap = (posts ?? []).map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updated_at || post.created_at),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [
    ...staticPages,
    ...calculatorPages,
    ...categoryPages,
    ...blogPages,
  ];
}
