/**
 * PWA Icon Generator
 * Generates all required icon sizes from a source SVG
 * 
 * Usage: node scripts/generate-icons.js
 * 
 * Requires: sharp npm package
 * npm install sharp --save-dev
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dynamic import for sharp
const sharp = await import('sharp').then(m => m.default);

const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'icons');

// SVG source icon (the ⚡ emoji styled)
const SVG_ICON = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366f1"/>
      <stop offset="100%" style="stop-color:#8b5cf6"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#bg)"/>
  <text x="256" y="380" font-size="320" text-anchor="middle" fill="white">⚡</text>
</svg>
`;

async function generateIcons() {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('Generating PWA icons...');

  for (const size of ICON_SIZES) {
    const outputPath = path.join(OUTPUT_DIR, `icon-${size}.png`);
    
    try {
      await sharp(Buffer.from(SVG_ICON))
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(`  ✓ Generated icon-${size}.png`);
    } catch (error) {
      console.error(`  ✗ Failed to generate icon-${size}.png:`, error.message);
    }
  }

  // favicon.png -- rendered from the REAL favicon.svg (the project's actual
  // blue star, linked by index.html's <link rel="icon">), not the ⚡ SVG_ICON
  // above. These used to be two independent sources that had drifted apart:
  // favicon.svg was updated to a blue star at some point, but this script
  // still generated favicon.png from its own hardcoded lightning-bolt
  // constant, so the two files silently disagreed (live report: favicon.png
  // was still a purple lightning bolt). Reading favicon.svg directly makes
  // this the single source of truth going forward -- can't drift again.
  try {
    const faviconSvgPath = path.join(__dirname, '..', 'favicon.svg');
    const faviconSvg = fs.readFileSync(faviconSvgPath, 'utf8');
    await sharp(Buffer.from(faviconSvg))
      .resize(32, 32)
      .png()
      .toFile(path.join(OUTPUT_DIR, '..', '..', 'favicon.png'));
    console.log('  ✓ Generated favicon.png (from favicon.svg)');
  } catch (error) {
    console.error('  ✗ Failed to generate favicon:', error.message);
  }

  console.log('\nDone! Icons saved to:', OUTPUT_DIR);
}

generateIcons().catch(console.error);
