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

  // favicon.png -- the browser-tab icon (index.html and 404.html's
  // <link rel="icon">, config/site.json's browserTabIcon). It comes from the
  // same wb logo as the app icons (#1621). It used to be rendered from
  // favicon.svg, a blue star, so the tab showed a different mark from
  // everything else. favicon.svg is still committed: it is the generic
  // placeholder logo in generate-site.mjs and the navbar schema example.
  //
  // The logo sits on a wide white margin. At 16-32 px that margin would
  // leave a dot in the tab, so trim() crops to the logo tile before resizing.
  try {
    const tile = await sharp(SOURCE_IMAGE).trim({ background: '#ffffff', threshold: 20 }).toBuffer();
    await sharp(tile)
      .resize(32, 32, { fit: 'contain', background: '#ffffff' })
      .png()
      .toFile(path.join(OUTPUT_DIR, 'favicon.png'));
    console.log('  ✓ Generated favicon.png (from og-image.jpg, cropped to the logo)');
  } catch (error) {
    console.error('  ✗ Failed to generate favicon:', error.message);
  }

  console.log('\nDone! Icons saved to:', OUTPUT_DIR);
}

generateIcons().catch(console.error);
