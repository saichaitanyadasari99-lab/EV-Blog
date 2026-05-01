#!/usr/bin/env npx tsx
/**
 * EVPulse Image Agent
 * 
 * Processes markdown articles with [IMAGE_SEARCH] blocks.
 * Searches for relevant images from credible sources with clear licenses.
 * 
 * Usage:
 *   npx tsx scripts/image-agent.ts [file.md]
 *   npx tsx scripts/image-agent.ts articles/my-article.md
 */

import fs from 'fs';
import path from 'path';

interface Figure {
  src: string;
  alt: string;
  caption: string;
  credit: string;
  creditUrl: string;
  license: string;
}

interface ImageSource {
  name: string;
  searchUrl: string;
  license: string;
  licenseUrls: string[];
}

// Credible image sources with clear licensing
const IMAGE_SOURCES: ImageSource[] = [
  {
    name: 'Unsplash',
    searchUrl: 'https://unsplash.com/s/photos/',
    license: 'Unsplash License',
    licenseUrls: ['https://unsplash.com/license'],
  },
  {
    name: 'Pexels',
    searchUrl: 'https://www.pexels.com/search/',
    license: 'Pexels License',
    licenseUrls: ['https://www.pexels.com/photo-license'],
  },
  {
    name: 'Wikimedia Commons',
    searchUrl: 'https://commons.wikimedia.org/w/index.php?search=',
    license: 'Public Domain / CC BY-SA',
    licenseUrls: [
      'https://commons.wikimedia.org/wiki/Commons:License',
      'https://creativecommons.org/licenses/by-sa/4.0',
    ],
  },
  {
    name: 'NASA Images',
    searchUrl: 'https://images.nasa.gov/search/images?q=',
    license: 'Public Domain',
    licenseUrls: ['https://www.nasa.gov/multimedia/guidelines/index.html'],
  },
  {
    name: 'NIST',
    searchUrl: 'https://www.nist.gov/image-library/search?search=',
    license: 'Public Domain',
    licenseUrls: ['https://www.nist.gov/public-access'],
  },
  {
    name: 'DOE',
    searchUrl: 'https://imagebank.energy.gov/search?search=',
    license: 'Public Domain',
    licenseUrls: ['https://www.energy.gov/public-access-plans'],
  },
];

// Technical/engineering specific sources
const TECHNICAL_SOURCES: ImageSource[] = [
  {
    name: 'IEEE Xplore',
    searchUrl: 'https://ieeexplore.ieee.org/search/search.jsp?searchField=All&searchText=',
    license: 'IEEE',
    licenseUrls: ['https://www.ieee.org/publications/rights/index.html'],
  },
  {
    name: 'ResearchGate',
    searchUrl: 'https://www.researchgate.net/search/search.html?q=',
    license: 'CC BY',
    licenseUrls: ['https://www.researchgate.net/aboutus/terms'],
  },
  {
    name: 'PubChem',
    searchUrl: 'https://pubchem.ncbi.nlm.nih.gov/compound/',
    license: 'Public Domain',
    licenseUrls: ['https://pubchem.ncbi.nlm.nih.gov/help'],
  },
];

// Battery/EV specific search terms
const BATTERY_TERMS: Record<string, string> = {
  'lithium-ion': 'lithium ion battery diagram',
  'nmc': 'NMC battery cathode',
  'nca': 'NCA battery chemistry',
  'lfp': 'LFP lithium iron phosphate',
  'thermal': 'battery thermal management',
  'soc': 'state of charge battery',
  'bms': 'battery management system',
  'charging': 'EV charging station',
  'cell': 'battery cell structure',
  'pack': 'battery pack EV',
  'cooling': 'battery cooling plate',
  'heat': 'heat generation battery',
  'degradation': 'battery degradation',
  'solid-state': 'solid state battery',
  'anode': 'battery anode material',
  'cathode': 'battery cathode chemistry',
};

function parseImageSearchBlock(content: string): { keyword: string; context: string } | null {
  const match = content.match(/\[IMAGE_SEARCH\]([\s\S]*?)\[\/IMAGE_SEARCH\]/i);
  if (!match) return null;
  
  const blockContent = match[1].trim();
  const lines = blockContent.split('\n').map(l => l.trim()).filter(Boolean);
  const keyword = lines[0] || '';
  const context = lines.slice(1).join(' ') || '';
  
  return { keyword, context };
}

function parseCoverUrlBlock(content: string): string | null {
  const match = content.match(/COVER URL:\s*\[SEARCH:\s*([^\]]+)\]/i);
  return match ? match[1].trim() : null;
}

function extractKeywords(text: string): string[] {
  const words = text.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 4);
  
  // Prioritize battery/EV terms
  const prioritized: string[] = [];
  for (const [term, search] of Object.entries(BATTERY_TERMS)) {
    if (text.toLowerCase().includes(term)) {
      prioritized.push(search);
    }
  }
  
  return [...prioritized, ...words.slice(0, 10)];
}

function buildFigureBlock(figure: Figure): string {
  return `[FIGURE]
src: ${figure.src}
alt: ${figure.alt}
caption: ${figure.caption}
credit: ${figure.credit}
creditUrl: ${figure.creditUrl}
license: ${figure.license}
[/FIGURE]`;
}

function buildCoverBlock(url: string, credit: string, creditUrl: string): string {
  return `COVER URL: ${url}
COVER CREDIT: ${credit}
COVER CREDIT URL: ${creditUrl}`;
}

async function searchImage(keyword: string, context: string): Promise<Figure | null> {
  console.log(`  Searching: "${keyword}"`);
  
  const sources = [...IMAGE_SOURCES, ...TECHNICAL_SOURCES];
  const searchTerms = [keyword, ...extractKeywords(context)].filter(Boolean);
  
  for (const source of sources) {
    for (const term of searchTerms.slice(0, 3)) {
      try {
        const searchUrl = `${source.searchUrl}${encodeURIComponent(term)}`;
        console.log(`    Trying: ${source.name}`);
        
        // For now, return a placeholder - real implementation would:
        // 1. Fetch the search page
        // 2. Parse results for direct image URLs
        // 3. Verify license
        // 4. Return the best match
        
        // TODO: Implement actual image search
        // This requires more complex HTML parsing and API integration
      } catch (e) {
        continue;
      }
    }
  }
  
  return null;
}

async function processFile(filePath: string): Promise<void> {
  console.log(`\nProcessing: ${filePath}\n`);
  
  const content = fs.readFileSync(filePath, 'utf-8');
  let updated = content;
  let processed = 0;
  
  // Check for [IMAGE_SEARCH] blocks
  const imageSearchRegex = /\[IMAGE_SEARCH\][\s\S]*?\[\/IMAGE_SEARCH\]/gi;
  const matches = content.match(imageSearchRegex);
  
  if (matches) {
    for (const match of matches) {
      const parsed = parseImageSearchBlock(match);
      if (!parsed) continue;
      
      console.log(`\nFound [IMAGE_SEARCH] block:`);
      console.log(`  Keyword: ${parsed.keyword}`);
      console.log(`  Context: ${parsed.context.slice(0, 100)}...`);
      
      const figure = await searchImage(parsed.keyword, parsed.context);
      
      if (figure) {
        const replacement = buildFigureBlock(figure);
        updated = updated.replace(match, replacement);
        console.log(`  Replaced with: ${figure.src.slice(0, 60)}...`);
        processed++;
      } else {
        console.log(`  No suitable image found`);
        updated = updated.replace(match, '[IMAGE_NOT_FOUND]');
        processed++;
      }
    }
  }
  
  // Check for cover image
  const coverMatch = content.match(/COVER URL:\s*\[SEARCH:[^\]]+\]/i);
  if (coverMatch) {
    const parsed = parseCoverUrlBlock(content);
    if (parsed) {
      console.log(`\nFound COVER URL search: ${parsed}`);
      
      const figure = await searchImage(parsed, '');
      
      if (figure) {
        const credit = `${figure.credit} via ${figure.creditUrl}`;
        const replacement = buildCoverBlock(figure.src, credit, figure.creditUrl);
        updated = updated.replace(coverMatch[0], replacement);
        console.log(`  Replaced cover with: ${figure.src.slice(0, 60)}...`);
      }
    }
  }
  
  if (processed > 0) {
    const outputPath = filePath.replace('.md', '.processed.md');
    fs.writeFileSync(outputPath, updated);
    console.log(`\nWrote: ${outputPath}`);
  }
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
EVPulse Image Agent

Usage:
  npx tsx scripts/image-agent.ts [file.md]
  npx tsx scripts/image-agent.ts articles/my-article.md
  npx tsx scripts/image-agent.ts --all

Process a single markdown file or all .md files in the current directory.
    `);
    process.exit(0);
  }
  
  const allMode = args[0] === '--all';
  
  if (allMode) {
    const files = fs.readdirSync('.')
      .filter(f => f.endsWith('.md') && !f.includes('.processed.'));
    
    console.log(`\nFound ${files.length} markdown files\n`);
    
    for (const file of files) {
      processFile(file).catch(console.error);
    }
  } else {
    processFile(args[0]).catch(console.error);
  }
}

main();