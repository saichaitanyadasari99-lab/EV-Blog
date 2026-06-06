#!/usr/bin/env npx tsx
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://emzrbrlfgkxsyogogjbn.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtenJicmxmZ2t4c3lvZ29namJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MjIzMTEsImV4cCI6MjA5MDA5ODMxMX0.rOcxSFiBwuN7NKFx8ZGMEA-h0lMlkSUITvuy1H0sMfU";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const SEED_DIR = path.resolve(import.meta.dirname, "..", "seed-export");

type ExportPost = {
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

async function main() {
  if (!fs.existsSync(SEED_DIR)) {
    console.error(`Directory not found: ${SEED_DIR}`);
    console.log("Run 'npm run export-articles' first to create the seed files.");
    process.exit(1);
  }

  const files = fs.readdirSync(SEED_DIR).filter(f => f.endsWith(".json") && f !== "manifest.json");

  if (files.length === 0) {
    console.log("No JSON files found in seed-export/.");
    process.exit(0);
  }

  console.log(`Found ${files.length} article files. Starting seed...`);

  let imported = 0;
  let skipped = 0;
  let failed = 0;

  for (const file of files) {
    const filepath = path.join(SEED_DIR, file);
    let post: ExportPost;

    try {
      const raw = fs.readFileSync(filepath, "utf-8");
      post = JSON.parse(raw);
    } catch (err) {
      console.error(`Error reading ${file}:`, err);
      failed++;
      continue;
    }

    if (!post.title || !post.slug) {
      console.log(`Skipping ${file}: missing title or slug`);
      skipped++;
      continue;
    }

    const contentJson = post.content
      ? JSON.stringify(post.content)
      : JSON.stringify({ type: "doc", content: [{ type: "paragraph" }] });

    const { error } = await supabase.from("posts").upsert({
      title: post.title.trim(),
      slug: post.slug,
      content: contentJson,
      markdown_content: post.markdown || null,
      excerpt: post.excerpt?.slice(0, 220) || "",
      cover_url: post.cover_url || null,
      category: post.category?.toLowerCase().trim() || "cell-chemistry",
      tags: post.tags || [],
      published: post.published ?? true,
      reading_time: post.reading_time || 1,
      tier: post.tier || "intermediate",
      pullquote: post.pullquote || null,
      stats: post.stats || [],
      references: post.references || [],
      faqs: post.faqs || [],
      created_at: post.created_at || new Date().toISOString(),
      updated_at: post.updated_at || new Date().toISOString(),
    }, { onConflict: "slug", ignoreDuplicates: false });

    if (error) {
      console.error(`Error importing ${post.slug}:`, error.message);
      failed++;
    } else {
      console.log(`✅ ${post.slug} — ${post.title}`);
      imported++;
    }
  }

  console.log(`\nDone! Imported: ${imported}, Skipped: ${skipped}, Failed: ${failed}`);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
