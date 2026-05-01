#!/usr/bin/env npx tsx
/**
 * EVPulse Article Normalizer
 * 
 * Processes markdown articles to standardize format, fix image blocks, and prepare for publishing.
 * Handles [IMAGE_SEARCH], [FIGURE], COVER blocks per EVPulse standards.
 * 
 * Usage:
 *   npx tsx scripts/normalize-article..ts articles/my-article.md
 *   npm run normalize articles/my-article.md
 */ 
import fs from 'fs';
import path from 'path';

interface NormalizeOptions {
  checkImages: boolean;
  fixFormatting: boolean;
  dryRun: boolean;
}

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.svg'];
const VALID_LICENSES = [
  'CC0', 'CC BY', 'CC BY-SA', 'Public Domain',
  'Unsplash License', 'Pexels License', 'MIT'
];

function parseFrontmatter(content: string): { meta: Record<string, any>; body: string } | null {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;
  
  const metaLines = match[1].split('\n');
  const meta: Record<string, any> = {};
  
  for (const line of metaLines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.substring(0, colonIdx).trim();
    let value = line.substring(colonIdx + 1).trim();
    
    if (value.startsWith('[')) {
      try { meta[key] = JSON.parse(value); } catch { meta[key] = value; }
    } else {
      meta[key] = value;
    }
  }
  
  return { meta, body: match[2] };
}

function findImageBlocks(content: string): { type: string; block: string; start: number; end: number }[] {
  const blocks: { type: string; block: string; start: number; end: number }[] = [];
  
  const patterns = [
    { type: 'IMAGE_SEARCH', regex: /\[IMAGE_SEARCH\][\s\S]*?\[\/IMAGE_SEARCH\]/gi },
    { type: 'FIGURE', regex: /\[FIGURE\][\s\S]*?\[\/FIGURE\]/gi },
    { type: 'COVER', regex: /COVER URL:\s*\[SEARCH:[^\]]+\]/gi },
  ];
  
  for (const { type, regex } of patterns) {
    let match;
    regex.lastIndex = 0;
    while ((match = regex.exec(content)) !== null) {
      blocks.push({ type, block: match[0], start: match.index, end: match.index + match[0].length });
    }
  }
  
  return blocks.sort((a, b) => a.start - b.start);
}

function validateFigureBlock(block: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const fields = ['src', 'alt', 'caption', 'credit', 'creditUrl', 'license'];
  
  for (const field of fields) {
    if (!block.includes(`${field}:`)) {
      errors.push(`Missing ${field}`);
    }
  }
  
  const srcMatch = block.match(/src:\s*(https?:\/\/[^\s]+)/i);
  if (srcMatch) {
    try {
      const ext = path.extname(new URL(srcMatch[1]).pathname).toLowerCase();
      if (!IMAGE_EXTENSIONS.some(e => ext.endsWith(e))) {
        errors.push(`Invalid image extension: ${ext}`);
      }
    } catch { errors.push('Invalid URL'); }
  }
  
  const licenseMatch = block.match(/license:\s*(.+)/i);
  if (licenseMatch) {
    const license = licenseMatch[1].trim();
    if (!VALID_LICENSES.some(l => license.toLowerCase().includes(l.toLowerCase()))) {
      errors.push(`Unknown license: ${license}`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}

async function checkImageUrl(url: string): Promise<{ accessible: boolean; status: number }> {
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    return { accessible: res.ok, status: res.status };
  } catch { return { accessible: false, status: 0 }; }
}

async function processFile(filePath: string, options: NormalizeOptions): Promise<void> {
  console.log(`\nProcessing: ${filePath}\n${'='.repeat(50)}`);
  
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const blocks = findImageBlocks(content);
  
  console.log(`Found ${blocks.length} image-related blocks:\n`);
  
  let hasIssues = false;
  let processed = 0;
  
  for (const { type, block, start } of blocks) {
    const lineNum = content.substring(0, start).split('\n').length;
    
    if (type === 'IMAGE_SEARCH') {
      console.log(`  Line ${lineNum}: [IMAGE_SEARCH] - needs image search`);
      console.log(`    ${block.replace(/\n/g, ' ').slice(0, 80)}...`);
      processed++;
    } else if (type === 'FIGURE') {
      const validation = validateFigureBlock(block);
      console.log(`  Line ${lineNum}: [FIGURE]`);
      
      if (validation.errors.length > 0) {
        hasIssues = true;
        console.log(`    ERRORS:`);
        for (const err of validation.errors) {
          console.log(`      - ${err}`);
        }
      } else {
        const srcMatch = block.match(/src:\s*(https?:\/\/[^\s]+)/i);
        if (srcMatch && options.checkImages) {
          const check = await checkImageUrl(srcMatch[1]);
          if (!check.accessible) {
            hasIssues = true;
            console.log(`    ERROR: Image not accessible (${check.status})`);
          } else {
            console.log(`    ✓ Valid and accessible`);
          }
        } else {
          console.log(`    ✓ Structure valid`);
        }
      }
      processed++;
    } else if (type === 'COVER') {
      const coverMatch = block.match(/COVER URL:\s*\[SEARCH:([^\]]+)\]/i);
      if (coverMatch) {
        console.log(`  Line ${lineNum}: COVER URL [SEARCH] - needs image search`);
        console.log(`    Keyword: ${coverMatch[1]}`);
      }
      processed++;
    }
  }
  
  if (processed > 0) {
    console.log(`\n${'─'.repeat(50)}`);
    console.log(`Total blocks: ${processed}`);
    console.log(`Issues: ${hasIssues ? 'YES' : 'None'}`);
  }
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
EVPulse Article Normalizer
========================
Processes markdown articles for EVPulse blog standards.

Usage:
  npx tsx scripts/normalize-article..ts [file.md]
  npx tsx scripts/normalize-article..ts --all
  
  Checks:        --check (-c)     Verify image URLs are accessible
  Dry run:       --dry (-d)      Don't write changes
  All files:     --all         Process all .md files
    `);
    process.exit(0);
  }
  
  const options: NormalizeOptions = {
    checkImages: args.includes('--check') || args.includes('-c'),
    fixFormatting: false,
    dryRun: args.includes('--dry') || args.includes('-d'),
  };
  
  const allMode = args.includes('--all');
  const files = allMode
    ? fs.readdirSync('.').filter(f => f.endsWith('.md') && !f.includes('.processed.'))
    : args.filter(f => !f.startsWith('--'));
  
  for (const file of files) {
    processFile(file, options).catch(console.error);
  }
}

main();