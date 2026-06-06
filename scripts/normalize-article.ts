#!/usr/bin/env npx tsx
/**
 * EVPulse Article Normalizer
 * 
 * Processes markdown articles to standardize format, fix image blocks, and prepare for publishing.
 * Handles [IMAGE_ SEARCH], [FIGURE], COVER blocks per EVPulse standards.
 * 
 * Usage:
 *   npx tsx scripts/normalize-article.ts articles/my-article.md
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
  
  const meta: Record<string, any> = {};
  const lines = match[1].split('\n');
  
  for (const line of lines) {
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

interface ImageSearchBlock {
  keyword: string;
  context: string;
  placement: string;
  full: string;
  start: number;
  end: number;
  line: number;
}

function findImageSearchBlocks(content: string): ImageSearchBlock[] {
  const blocks: ImageSearchBlock[] = [];
  const regex = /\[IMAGE_SEARCH\]([\s\S]*?)\[\/IMAGE_SEARCH]/gi;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const block = match[1];
    const keywordMatch = block.match(/keyword:\s*(.+)/i);
    const contextMatch = block.match(/context:\s*(.+)/i);
    const placementMatch = block.match(/placement:\s*(.+)/i);

    blocks.push({
      keyword: keywordMatch ? keywordMatch[1].trim() : '',
      context: contextMatch ? contextMatch[1].trim() : '',
      placement: placementMatch ? placementMatch[1].trim() : '',
      full: match[0],
      start: match.index,
      end: match.index + match[0].length,
      line: content.substring(0, match.index).split('\n').length,
    });
  }

  return blocks;
}

interface FigureBlock {
  src: string;
  alt: string;
  caption: string;
  credit: string;
  creditUrl: string;
  license: string;
  full: string;
  start: number;
  end: number;
  line: number;
}

function findFigureBlocks(content: string): FigureBlock[] {
  const blocks: FigureBlock[] = [];
  const regex = /\[FIGURE\]([\s\S]*?)\[\/FIGURE\]/gi;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const block = match[1];
    const srcMatch = block.match(/src:\s*(https?:\/\/[^\s]+)/i);
    const altMatch = block.match(/alt:\s*(.+)/i);
    const captionMatch = block.match(/caption:\s*(.+)/i);
    const creditMatch = block.match(/credit:\s*(.+)/i);
    const creditUrlMatch = block.match(/creditUrl:\s*(https?:\/\/[^\s]+)/i);
    const licenseMatch = block.match(/license:\s*(.+)/i);

    blocks.push({
      src: srcMatch ? srcMatch[1].trim() : '',
      alt: altMatch ? altMatch[1].trim() : '',
      caption: captionMatch ? captionMatch[1].trim() : '',
      credit: creditMatch ? creditMatch[1].trim() : '',
      creditUrl: creditUrlMatch ? creditUrlMatch[1].trim() : '',
      license: licenseMatch ? licenseMatch[1].trim() : '',
      full: match[0],
      start: match.index,
      end: match.index + match[0].length,
      line: content.substring(0, match.index).split('\n').length,
    });
  }

  return blocks;
}

function validateFigureBlock(block: FigureBlock): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const required = ['src', 'alt', 'caption', 'credit', 'creditUrl', 'license'];

  for (const field of required) {
    if (!block[field as keyof FigureBlock]) {
      errors.push(`Missing ${field}`);
    }
  }

  const srcMatch = block.src.match(/https?:\/\/[^\s]+/i);
  if (srcMatch) {
    try {
      const ext = path.extname(new URL(srcMatch[0]).pathname).toLowerCase();
      if (!IMAGE_EXTENSIONS.some(e => ext.endsWith(e))) {
        errors.push(`Invalid image extension: ${ext}`);
      }
    } catch { errors.push('Invalid URL'); }
  }

  const licenseMatch = block.license.match(/(.+)/i);
  if (licenseMatch) {
    const license = licenseMatch[1].trim();
    if (!VALID_LICENSES.some(l => license.toLowerCase().includes(l.toLowerCase()))) {
      errors.push(`Unknown license: ${license}`);
    }
  }

  return { valid: errors. length === 0, errors };
}

async function checkImageUrl(url: string): Promise<{ accessible: boolean; status: number }> {
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    return { accessible: res.ok, status: res.status };
  } catch { return { accessible: false, status: 0 }; }
}

async function processFile(filePath: string, options: NormalizeOptions): Promise<void> {
  console.log(`\nProcessing: ${filePath}`);
  console.log('='.repeat(60));

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const searchBlocks = findImageSearchBlocks(content);
  const figureBlocks = findFigureBlocks(content);

  console.log(`\nFound ${searchBlocks.length} [IMAGE_SEARCH] blocks`);
  console.log(`Found ${figureBlocks.length} [FIGURE] blocks\n`);

  let hasIssues = false;
  let pendingImages = 0;

  // Report IMAGE_SEARCH blocks
  for (const block of searchBlocks) {
    console.log(`  Line ${block.line}: [IMAGE_SEARCH]`);
    console.log(`    keyword: ${block.keyword}`);
    console.log(`    context: ${block.context.slice(0, 80)}...`);
    if (block.placement) {
      console.log(`    placement: ${block.placement}`);
    }
    pendingImages++;
  }

  // Validate FIGURE blocks
  for (const block of figureBlocks) {
    console.log(`  Line ${block.line}: [FIGURE]`);
    console.log(`    src: ${block.src.slice(0, 60)}...`);
    console.log(`    alt: ${block.alt.slice(0, 50)}...`);

    const validation = validateFigureBlock(block);

    if (validation.errors. length > 0) {
      hasIssues = true;
      console.log(`    ERRORS:`);
      for (const err of validation.errors) {
        console.log(`      - ${err}`);
      }
    } else if (options.checkImages) {
      const check = await checkImageUrl(block.src);
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

  // Check COVER URL
  const coverMatch = content.match(/COVER URL:\s*\[SEARCH:([^\]]+)\]/i);
  if (coverMatch) {
    console.log(`\nCover image: [SEARCH: ${coverMatch[1]}]`);
    pendingImages++;
  }

  console.log(`\n${'-'.repeat(60)}`);
  console.log(`Total [IMAGE_SEARCH] blocks: ${pendingImages}`);
  console.log(`Total [FIGURE] blocks: ${figureBlocks. length}`);
  console.log(`Image status: ${hasIssues ? 'ISSUES FOUND' : 'PENDING SEARCH'}`);
}

function main() {
  const args = process.argv.slice(2);

  if (args. length === 0) {
    console.log(`
EVPulse Article Normalizer
========================
Processes markdown articles for EVPulse blog standards.

Usage:
  npx tsx scripts/normalize-article.ts articles/file.md
  npm run normalize articles/file.md

  --check         Verify image URLs are accessible
  --dry           Dry run (don't write changes)
  --all           Process all .md files
    `);
    process.exit(0);
  }

  const options: NormalizeOptions = {
    checkImages: args.includes('--check'),
    fixFormatting: false,
    dryRun: args.includes('--dry'),
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