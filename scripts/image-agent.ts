#!/usr/bin/env npx tsx
/**
 * EVPulse Image Agent (Semi-Automated Option B)
 *
 * Processes .md articles to find [IMAGE_SEARCH] blocks and COVER URL searches,
 * searches trusted technical websites for images with proper licenses,
 * presents 3-5 options for user selection, then replaces blocks with [FIGURE] format.
 *
 * Usage:
 *   npx tsx scripts/image-agent.ts articles/my-article.md
 *   npm run image-agent articles/my-article.md
 */

import fs from 'fs';
import path from 'path';

// Trusted technical image sources (no stock/Google Images)
const TRUSTED_DOMAINS = [
  'wikimedia.org',
  'wikipedia.org',
  'researchgate.net',
  'arxiv.org',
  'nrel.gov',
  'energy.gov',
  'ieeexplore.ieee.org',
  'springer.com',
  'mdpi.com',
  'sciencedirect.com',
  'nature.com',
];

const VALID_LICENSES = ['CC0', 'CC BY', 'CC BY-SA', 'CC BY 4.0', 'CC BY-SA 4.0', 'CC0 1.0', 'Public Domain'];
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif'];

interface ImageCandidate {
  src: string;
  alt: string;
  caption: string;
  credit: string;
  creditUrl: string;
  license: string;
  score: number;
}

interface ImageSearchBlock {
  keyword: string;
  context: string;
  full: string;
  start: number;
  end: number;
  line: number;
}

interface CoverSearchBlock {
  keyword: string;
  full: string;
  start: number;
  end: number;
  line: number;
}

function findImageSearchBlocks(content: string): ImageSearchBlock[] {
  const blocks: ImageSearchBlock[] = [];
  const regex = /\[IMAGE_SEARCH\]([\s\S]*?)\[\/IMAGE_SEARCH\]/gi;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const blockContent = match[1];
    const lines = blockContent.split('\n').map(l => l.trim()).filter(l => l);
    const keyword = lines[0] || '';
    const context = lines[1] || '';

    blocks.push({
      keyword,
      context,
      full: match[0],
      start: match.index,
      end: match.index + match[0].length,
      line: content.substring(0, match.index).split('\n').length,
    });
  }

  return blocks;
}

function findCoverSearchBlocks(content: string): CoverSearchBlock[] {
  const blocks: CoverSearchBlock[] = [];
  const regex = /^(COVER URL:\s*\[SEARCH:\s*([^\]]+)\])$/gm;
  let match;

  while ((match = regex.exec(content)) !== null) {
    blocks.push({
      keyword: match[2].trim(),
      full: match[1],
      start: match.index,
      end: match.index + match[1].length,
      line: content.substring(0, match.index).split('\n').length,
    });
  }

  return blocks;
}

function replaceImageSearchBlock(
  content: string,
  block: ImageSearchBlock,
  choice: ImageCandidate
): string {
  const figureBlock = `[FIGURE]
src: ${choice.src}
alt: ${choice.alt}
caption: ${choice.caption}
credit: ${choice.credit}
creditUrl: ${choice.creditUrl}
license: ${choice.license}
[/FIGURE]`;

  return content.substring(0, block.start) + figureBlock + content.substring(block.end);
}

function replaceCoverSearchBlock(
  content: string,
  block: CoverSearchBlock,
  choice: ImageCandidate
): string {
  const url = new URL(choice.creditUrl);
  const coverBlock = `COVER URL: ${choice.src}
COVER CREDIT: ${choice.credit} via ${url.hostname}
COVER CREDIT URL: ${choice.creditUrl}`;

  return content.substring(0, block.start) + coverBlock + content.substring(block.end);
}

function generateSearchUrls(keyword: string): string[] {
  const queries = [
    `https://commons.wikimedia.org/w/index.php?search=${encodeURIComponent(keyword)}&title=Special:MediaSearch&type=image`,
    `https://commons.wikimedia.org/w/index.php?search=${encodeURIComponent(keyword + ' diagram')}&title=Special:MediaSearch&type=image`,
    `https://commons.wikimedia.org/w/index.php?search=${encodeURIComponent(keyword + ' chart')}&title=Special:MediaSearch&type=image`,
  ];
  return queries;
}

async function processFile(filePath: string, dryRun: boolean = false): Promise<void> {
  console.log(`\n${'#'.repeat(70)}`);
  console.log(`Processing: ${filePath}`);
  console.log(`${'#'.repeat(70)}\n`);

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const imageBlocks = findImageSearchBlocks(content);
  const coverBlocks = findCoverSearchBlocks(content);

  console.log(`Found ${imageBlocks.length} [IMAGE_SEARCH] block(s)`);
  console.log(`Found ${coverBlocks.length} COVER URL search(es)\n`);

  // Output search URLs for each block
  for (const block of imageBlocks) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`LINE ${block.line}: [IMAGE_SEARCH] "${block.keyword}"`);
    console.log(`${'='.repeat(70)}`);
    console.log(`Context: ${block.context.slice(0, 80)}...\n`);
    console.log('Search URLs:');
    const urls = generateSearchUrls(block.keyword);
    urls.forEach((url, i) => console.log(`  [${i + 1}] ${url}`));
    console.log('\nAfter finding image, manually update the block with [FIGURE] format.');
  }

  for (const block of coverBlocks) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`COVER IMAGE (LINE ${block.line}): "${block.keyword}"`);
    console.log(`${'='.repeat(70)}\n`);
    console.log('Search for landscape/horizontal images:');
    console.log(`  https://commons.wikimedia.org/w/index.php?search=${encodeURIComponent(block.keyword + ' horizontal landscape')}&title=Special:MediaSearch&type=image`);
  }

  console.log(`\n${'-'.repeat(70)}`);
  console.log('NEXT STEPS:');
  console.log('1. Visit the search URLs above');
  console.log('2. Find images with CC0, CC BY, or CC BY-SA licenses');
  console.log('3. Verify direct image URL (ends in .jpg/.png/.svg)');
  console.log('4. Replace [IMAGE_SEARCH] blocks with [FIGURE] format');
  console.log(`5. Replace COVER URL: [SEARCH:...] with direct URL + credit lines`);
  console.log(`\nExample [FIGURE] format:`);
  console.log(`[FIGURE]
src: https://upload.wikimedia.org/wikipedia/commons/...
alt: Description of image
caption: How image relates to article content
credit: Author Name
creditUrl: https://commons.wikimedia.org/wiki/File:...
license: CC BY-SA 4.0
[/FIGURE]`);
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry');
  const files = args.filter(f => f.endsWith('.md') && !f.startsWith('--'));

  if (files.length === 0) {
    console.log(`
EVPulse Image Agent (Semi-Automated Option B)

Usage:
  npx tsx scripts/image-agent.ts articles/file.md
  npm run image-agent articles/file.md

Options:
  --dry    Dry run (don't write changes)

This script:
  1. Finds [IMAGE_SEARCH] blocks and COVER URL searches in markdown files
  2. Generates search URLs for trusted technical sites (Wikimedia Commons)
  3. User manually searches and selects images
  4. User updates blocks with [FIGURE] format (see example article)

NOTE: Full automation requires Wikimedia API or Exa API integration.
      Currently outputs search URLs for manual image selection.

Example processed article: articles/example-image-article.md
    `);
    process.exit(0);
  }

  for (const file of files) {
    processFile(file, dryRun).catch(console.error);
  }
}

main();
