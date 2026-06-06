import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface SeedPost {
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
  markdown?: string;
  content?: Record<string, unknown>;
}

async function seedArticles() {
  console.log('🌱 Starting article seeding process...\n');

  const seedDir = path.resolve(process.cwd(), 'seed-export');

  if (!fs.existsSync(seedDir)) {
    console.error('❌ seed-export directory not found');
    process.exit(1);
  }

  // Get all JSON files from seed-export
  const files = fs.readdirSync(seedDir)
    .filter(f => f.endsWith('.json') && f !== 'manifest.json');

  console.log(`📂 Found ${files.length} seed articles\n`);

  let successCount = 0;
  let failureCount = 0;

  for (const file of files) {
    try {
      const filepath = path.join(seedDir, file);
      const raw = JSON.parse(fs.readFileSync(filepath, 'utf-8')) as SeedPost;

      // Skip unpublished articles
      if (raw.published === false) {
        console.log(`⏭️  Skipped (unpublished): ${file}`);
        continue;
      }

      // Prepare data for insertion
      const postData = {
        title: raw.title,
        slug: raw.slug,
        excerpt: raw.excerpt || null,
        category: raw.category || null,
        tags: raw.tags || [],
        tier: (raw.tier || 'intermediate') as string,
        published: raw.published ?? true,
        cover_url: raw.cover_url || null,
        pullquote: raw.pullquote || null,
        stats: raw.stats || [],
        references: raw.references || [],
        reading_time: raw.reading_time || null,
        created_at: raw.created_at,
        updated_at: raw.updated_at,
        faqs: raw.faqs || [],
        markdown_content: raw.markdown || null,
        content: raw.content ? JSON.stringify(raw.content) : null,
      };

      // Insert into Supabase
      const { data, error } = await supabase
        .from('posts')
        .insert([postData])
        .select();

      if (error) {
        console.error(`❌ Failed: ${file}`);
        console.error(`   Error: ${error.message}`);
        failureCount++;
      } else {
        console.log(`✅ Seeded: ${raw.title}`);
        successCount++;
      }
    } catch (err) {
      console.error(`❌ Error processing ${file}:`);
      console.error(`   ${err instanceof Error ? err.message : String(err)}`);
      failureCount++;
    }
  }

  console.log(`\n📊 Seeding Summary:`);
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${failureCount}`);
  console.log(`   📝 Total: ${successCount + failureCount}\n`);

  if (failureCount === 0 && successCount > 0) {
    console.log('🎉 All articles seeded successfully!');
    console.log('📖 Visit http://localhost:3000/blogs to see your articles with new styling\n');
  }

  process.exit(failureCount > 0 ? 1 : 0);
}

seedArticles().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
