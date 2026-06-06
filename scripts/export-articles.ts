#!/usr/bin/env npx tsx
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://emzrbrlfgkxsyogogjbn.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtenJicmxmZ2t4c3lvZ29namJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MjIzMTEsImV4cCI6MjA5MDA5ODMxMX0.rOcxSFiBwuN7NKFx8ZGMEA-h0lMlkSUITvuy1H0sMfU";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const OUTPUT_DIR = path.resolve(import.meta.dirname, "..", "seed-export");

type PostRecord = {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  slug: string;
  content: string | null;
  markdown_content: string | null;
  excerpt: string | null;
  cover_url: string | null;
  category: string | null;
  tags: string[] | null;
  published: boolean;
  reading_time: number | null;
  tier: string | null;
  pullquote: string | null;
  stats: Array<{ value: string; label: string }> | null;
  references: Array<{ title: string; url: string }> | null;
  faqs: Array<{ question: string; answer: string }> | null;
};

async function main() {
  console.log("Connecting to Supabase...");
  const { data: posts, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching posts:", error.message);
    process.exit(1);
  }

  if (!posts || posts.length === 0) {
    console.log("No posts found.");
    process.exit(0);
  }

  console.log(`Found ${posts.length} posts. Exporting...`);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const manifest: Array<{ slug: string; title: string; published: boolean }> = [];
  let exported = 0;
  let skipped = 0;

  for (const post of posts as PostRecord[]) {
    const safeSlug = post.slug?.replace(/[^a-z0-9-]/g, "") || `post-${post.id}`;
    const filename = `${safeSlug}.json`;
    const filepath = path.join(OUTPUT_DIR, filename);

    const exportData = {
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || "",
      category: post.category || "cell-chemistry",
      tags: post.tags || [],
      tier: post.tier || "intermediate",
      published: post.published,
      cover_url: post.cover_url || "",
      pullquote: post.pullquote || "",
      stats: post.stats || [],
      references: post.references || [],
      reading_time: post.reading_time || 1,
      created_at: post.created_at,
      updated_at: post.updated_at,
      faqs: post.faqs || [],
      markdown: post.markdown_content || "",
      content: post.content ? JSON.parse(post.content) : null,
    };

    try {
      fs.writeFileSync(filepath, JSON.stringify(exportData, null, 2), "utf-8");
      manifest.push({ slug: post.slug, title: post.title, published: post.published });
      exported++;
    } catch (err) {
      console.error(`Error writing ${filename}:`, err);
      skipped++;
    }
  }

  fs.writeFileSync(
    path.join(OUTPUT_DIR, "manifest.json"),
    JSON.stringify({
      exported_at: new Date().toISOString(),
      total: posts.length,
      exported,
      skipped,
      posts: manifest,
    }, null, 2),
    "utf-8"
  );

  console.log(`\nDone! Exported ${exported} articles to seed-export/${exported > 0 ? " (" + exported + " files)" : ""}`);
  if (skipped > 0) console.log(`Skipped: ${skipped}`);
  console.log(`Manifest written to seed-export/manifest.json`);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
