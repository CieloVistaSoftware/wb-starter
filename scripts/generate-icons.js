/**
 * PWA Icon Generator
 * Generates all required icon sizes from a source SVG
 * 
 * Usage: node scripts/generate-icons.js
 * 
 * Requires: sharp npm package
 * npm install sharp --save-dev
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('Installing sharp...');
  require('child_process').execSync('npm install sharp --save-dev');
  sharp = require('sharp');
}

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

  // Generate favicon.ico (16x16 and 32x32)
  try {
    const favicon16 = await sharp(Buffer.from(SVG_ICON))
      .resize(16, 16)
      .png()
      .toBuffer();
    
    const favicon32 = await sharp(Buffer.from(SVG_ICON))
      .resize(32, 32)
      .png()
      .toBuffer();
    
    // Save as PNG favicons (browsers support PNG favicons)
    await sharp(favicon32).toFile(path.join(OUTPUT_DIR, '..', '..', 'favicon.png'));
    console.log('  ✓ Generated favicon.png');
  } catch (error) {
    console.error('  ✗ Failed to generate favicon:', error.message);
  }

  console.log('\nDone! Icons saved to:', OUTPUT_DIR);
}

generateIcons().catch(console.error);
