import { getPublicSupabaseClient } from "@/lib/supabase/public";
import type { PostRecord } from "@/types/post";
import fs from "fs";
import path from "path";

const SEED_DIR = path.resolve(process.cwd(), "seed-export");

type SeedPost = {
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  tags: string[];
  tier: string;
  published: boolean;
  cover_url: string;
  pullquote: string;
  stats: Array<{ value: string; label: string }>;
  references: Array<{ title: string; url: string }>;
  reading_time: number;
  created_at: string;
  updated_at: string;
  faqs: Array<{ question: string; answer: string }>;
  markdown: string;
  content: Record<string, unknown> | null;
};

function seedToPostRecord(seed: SeedPost): PostRecord {
  return {
    id: `seed-${seed.slug}`,
    title: seed.title,
    slug: seed.slug,
    excerpt: seed.excerpt || null,
    category: seed.category || null,
    tags: seed.tags || null,
    tier: (seed.tier || "intermediate") as PostRecord["tier"],
    published: seed.published ?? true,
    cover_url: seed.cover_url || null,
    pullquote: seed.pullquote || null,
    stats: seed.stats || null,
    references: seed.references || null,
    reading_time: seed.reading_time || null,
    created_at: seed.created_at,
    updated_at: seed.updated_at,
    faqs: seed.faqs || null,
    markdown_content: seed.markdown || null,
    content: seed.content ? JSON.stringify(seed.content) : null,
  };
}

function loadSeedPosts(): PostRecord[] {
  try {
    if (!fs.existsSync(SEED_DIR)) return [];
    const files = fs.readdirSync(SEED_DIR).filter((f) => f.endsWith(".json") && f !== "manifest.json");
    const posts: PostRecord[] = [];
    for (const file of files) {
      try {
        const raw = JSON.parse(fs.readFileSync(path.join(SEED_DIR, file), "utf-8"));
        if (raw.published !== false) posts.push(seedToPostRecord(raw));
      } catch { /* skip corrupt files */ }
    }
    return posts;
  } catch {
    return [];
  }
}

function loadSeedPostBySlug(slug: string): PostRecord | null {
  try {
    const filepath = path.join(SEED_DIR, `${slug}.json`);
    if (!fs.existsSync(filepath)) return null;
    const raw = JSON.parse(fs.readFileSync(filepath, "utf-8")) as SeedPost;
    if (raw.published === false) return null;
    return seedToPostRecord(raw);
  } catch {
    return null;
  }
}

const categoryAliases: Record<string, string> = {
  post: "cell-chemistry",
  "cell-chemistry": "cell-chemistry",
  "deep-dive": "bms-design",
  "bms-design": "bms-design",
  benchmark: "ev-benchmarks",
  "ev-benchmarks": "ev-benchmarks",
  review: "vehicle-reviews",
  "vehicle-reviews": "vehicle-reviews",
  standards: "standards",
  news: "news",
};

export function canonicalCategory(category?: string | null) {
  const key = (category ?? "post").trim().toLowerCase();
  return categoryAliases[key] ?? key;
}

export async function getPublishedPosts() {
  const supabase = getPublicSupabaseClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getPublishedPosts error:", error.message);
    return loadSeedPosts();
  }

  // If Supabase returned no rows (e.g. table was cleared), serve from seed files
  const posts = (data ?? []) as PostRecord[];
  if (posts.length === 0) return loadSeedPosts();
  return posts;
}

export async function getPublishedPostBySlug(slug: string) {
  const supabase = getPublicSupabaseClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug.trim().toLowerCase())
    .eq("published", true)
    .single();

  if (error) {
    console.error("getPublishedPostBySlug Supabase error:", error.message, "slug:", slug);
    const seedPost = loadSeedPostBySlug(slug);
    if (seedPost) {
      console.log("✓ Loaded from seed:", slug);
      return seedPost;
    }
    console.error("✗ Not found in seed either:", slug);
    return null;
  }

  console.log("✓ Loaded from Supabase:", slug);
  return data as PostRecord;
}

export async function getPublishedPostsByCategory(category: string) {
  const posts = await getPublishedPosts();
  const requested = canonicalCategory(category);
  return posts.filter((post) => canonicalCategory(post.category) === requested);
}

export async function searchPublishedPosts(query: string) {
  const keyword = query.trim().toLowerCase();
  if (!keyword) return [] as PostRecord[];

  const posts = await getPublishedPosts();
  return posts.filter((post) => {
    const hay = [
      post.title,
      post.excerpt ?? "",
      post.content ?? "",
      post.category ?? "",
      Array.isArray(post.tags) ? post.tags.join(" ") : typeof post.tags === "string" ? post.tags : "",
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(keyword);
  });
}
