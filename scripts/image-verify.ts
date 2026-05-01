#!/usr/bin/env npx tsx
/**
 * EVPulse Image Verifier
 * 
 * Verifies image URLs, licenses, and metadata from FIGURE blocks.
 * Ensures images are accessible and properly attributed.
 * 
 * Usage:
 *   npx tsx scripts/image-verify.ts [file.md]
 *   npx tsx scripts/image-verify.ts articles/my-article.md
 */ 
import fs from 'fs';

interface FigureData {
  src: string;
  alt: string;
  caption: string;
  credit: string;
  creditUrl: string;
  license: string;
  line: number;
}

interface VerificationResult {
  url_accessible: boolean;
  url_format_valid: boolean;
  license_valid: boolean;
  attribution_complete: boolean;
  errors: string[];
}

const VALID_LICENSES = [
  'CC0',
  'CC BY',
  'CC BY-SA',
  'CC BY-NC',
  'CC BY-NC-SA',
  'Public Domain',
  'Unsplash License',
  'Pexels License',
  'Wikimedia Commons',
];

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif', '.bmp'];

function parseFigureBlocks(content: string): FigureData[] {  
  const figures: FigureData[] = [];
  const blockRegex = /\[FIGURE\][\s\S]*?\[\/FIGURE\]/gi;
  let match;
  
  while ((match = blockRegex.exec(content)) !== null) {
    const block = match[0];
    const srcMatch = block.match(/src:\s*(.+)/i);
    const altMatch = block.match(/alt:\s*(.+)/i);
    const captionMatch = block.match(/caption:\s*(.+)/i);
    const creditMatch = block.match(/credit:\s*(.+)/i);
    const creditUrlMatch = block.match(/creditUrl:\s*(.+)/i);
    const licenseMatch = block.match(/license:\s*(.+)/i);
    
    if (srcMatch) {
      figures.push({
        src: srcMatch[1].trim(),
        alt: altMatch ? altMatch[1].trim() : '',
        caption: captionMatch ? captionMatch[1].trim() : '',
        credit: creditMatch ? creditMatch[1].trim() : '',
        creditUrl: creditUrlMatch ? creditUrlMatch[1].trim() : '',
        license: licenseMatch ? licenseMatch[1].trim() : '',
        line: content.substring(0, match.index).split('\n').length,
      });
    }
  }
  
  return figures;
}

function parseCoverBlock(content: string): { url: string; credit: string; creditUrl: string; line: number } | null {
  const coverMatch = content.match(/COVER URL:\s*(https?:\/\/[^\s]+)/i);
  const creditMatch = content.match(/COVER CREDIT:\s*(.+)/i);
  const creditUrlMatch = content.match(/COVER CREDIT URL:\s*(https?:\/\/[^\s]+)/i);
  
  if (coverMatch) {
    return {
      url: coverMatch[1].trim(),
      credit: creditMatch ? creditMatch[1].trim() : '',
      creditUrl: creditUrlMatch ? creditUrlMatch[1].trim() : '',
      line: content.substring(0, coverMatch.index).split('\n').length,
    };
  }
  
  return null;
}

function verifyUrl(url: string): { valid: boolean; format: string } {
  try {
    const parsed = new URL(url);
    const ext = path.extname(parsed.pathname).toLowerCase();
    return { valid: IMAGE_EXTENSIONS.includes(ext), format: ext };
  } catch {
    return { valid: false, format: '' };
  }
}

function verifyLicense(license: string): boolean {
  return VALID_LICENSES.some(l => license.toLowerCase().includes(l.toLowerCase()));
}

async function verifyImageUrl(url: string): Promise<{ accessible: boolean; status?: number }> {
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      redirect: 'follow',
    });
    return { accessible: response.ok, status: response.status };
  } catch (e) {
    return { accessible: false };
  }
}

async function verifyFigure(fig: FigureData): Promise<VerificationResult> {
  const errors: string[] = [];
  
  const urlCheck = verifyUrl(fig.src);
  if (!urlCheck.format) {
    errors.push(`Invalid URL format: ${fig.src}`);
  } else if (!urlCheck.valid) {
    errors.push(`Image extension not standard: ${urlCheck.format}`);
  }
  
  if (!verifyLicense(fig.license)) {
    errors.push(`License unclear: ${fig.license}`);
  }
  
  if (!fig.credit) {
    errors.push('Missing attribution (credit)'); 
  }
  
  if (!fig.creditUrl) {
    errors.push('Missing credit URL');
  }
  
  const urlAccessible = await verifyImageUrl(fig.src);
  if (!urlAccessible.accessible) {
    errors.push(`Image not accessible: ${urlAccessible.status || 'error'}`);
  }
  
  return {
    url_accessible: urlAccessible.accessible,
    url_format_valid: urlCheck.valid,
    license_valid: verifyLicense(fig.license),
    attribution_complete: Boolean(fig.credit && fig.creditUrl),
    errors,
  };
}

async function processFile(filePath: string): Promise<void> {
  console.log(`\nVerifying: ${filePath}\n`);
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const figures = parseFigureBlocks(content);
  const cover = parseCoverBlock(content);
  
  let hasErrors = false;
  
  if (figures.length > 0) {
    console.log(`Found ${figures.length} FIGURE blocks\n`);
    
    for (const fig of figures) {
      const result = await verifyFigure(fig);
      
      console.log(`Line ${fig.line}:`);
      console.log(`  URL: ${fig.src.slice(0, 70)}...`);
      console.log(`  Alt: ${fig.alt.slice(0, 50)}...`);
      
      if (result.errors.length > 0) {
        hasErrors = true;
        console.log(`  ERRORS:`);
        for (const err of result.errors) {
          console.log(`    - ${err}`);
        }
      } else {
        console.log(`  ✓ All checks passed`);
      }
    }
  }
  
  if (cover) {
    console.log(`\nCover image (line ${cover.line}):`);
    console.log(`  URL: ${cover.url}`);
    
    const urlCheck = verifyUrl(cover.url);
    const urlAccessible = await verifyImageUrl(cover.url);
    
    if (!urlCheck.valid) {
      hasErrors = true;
      console.log(`  ERROR: Invalid image URL format`);
    } else if (!urlAccessible.accessible) {
      hasErrors = true;
      console.log(`  ERROR: Image not accessible`);
    } else {
      console.log(`  ✓ Cover URL valid and accessible`);
    }
    
    if (!cover.credit) {
      hasErrors = true;
      console.log(`  ERROR: Missing COVER CREDIT`);
    }
  }
  
  console.log(`\n${hasErrors ? 'ISSUES FOUND' : 'ALL CHECKS PASSED'}`);
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
EVPulse Image Verifier

Usage:
  npx tsx scripts/image-verify.ts [file.md]
  npx tsx scripts/image-verify.ts articles/my-article.md
  npx tsx scripts/image-verify.ts --all
  
Verifies all images in a markdown file:
  - URL accessibility
  - Valid image format
  - Clear license
  - Complete attribution
    `);
    process.exit(0);
  }
  
  const filePath = args[0];
  
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }
  
  processFile(filePath).catch(console.error);
}

import path from 'path';
main();