/**
 * PWA Icon Generator
 * Generates all required icon sizes from the wb logo (assets/icons/og-image.jpg)
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

// Source: the wb logo, the same file og:image and twitter:image point at
// (#1585). It used to be a hardcoded lightning-bolt SVG here, so the app
// icons and the link-share card showed two different marks (#1614). One
// source means they can't drift apart again. It is 512x512, the largest
// size below, so every icon is a downscale.
const SOURCE_IMAGE = path.join(OUTPUT_DIR, 'og-image.jpg');

async function generateIcons() {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('Generating PWA icons...');

  for (const size of ICON_SIZES) {
    const outputPath = path.join(OUTPUT_DIR, `icon-${size}.png`);
    
    try {
      // A palette PNG keeps the 512 icon well under the 100 KB ceiling in
      // header-logo-is-not-a-megabyte.spec.ts; a truecolour one of this
      // gradient-heavy logo is several times larger.
      await sharp(SOURCE_IMAGE)
        .resize(size, size)
        .png({ palette: true, quality: 90, effort: 10 })
        .toFile(outputPath);
      
      console.log(`  ✓ Generated icon-${size}.png`);
    } catch (error) {
      console.error(`  ✗ Failed to generate icon-${size}.png:`, error.message);
    }
  }

  // favicon.png -- rendered from the REAL favicon.svg (the project's actual
  // blue star, linked by index.html's <link rel="icon">), not the app-icon
  // source above. These used to be two independent sources that had drifted apart:
  // favicon.svg was updated to a blue star at some point, but this script
  // still generated favicon.png from its own hardcoded lightning-bolt
  // constant, so the two files silently disagreed (live report: favicon.png
  // was still a purple lightning bolt). Reading favicon.svg directly makes
  // this the single source of truth going forward -- can't drift again.
  try {
    const faviconSvgPath = path.join(OUTPUT_DIR, 'favicon.svg');
    const faviconSvg = fs.readFileSync(faviconSvgPath, 'utf8');
    await sharp(Buffer.from(faviconSvg))
      .resize(32, 32)
      .png()
      .toFile(path.join(OUTPUT_DIR, 'favicon.png'));
    console.log('  ✓ Generated favicon.png (from favicon.svg)');
  } catch (error) {
    console.error('  ✗ Failed to generate favicon:', error.message);
  }

  console.log('\nDone! Icons saved to:', OUTPUT_DIR);
}

generateIcons().catch(console.error);
