/**
 * fix-demos.mjs
 * Fixes minor demo violations:
 * - Missing <title> tags
 * - Missing data-theme
 * - Missing WB import for wb-* component usage
 */
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const root = process.cwd();
const demosDir = join(root, 'demos');
const fixes = [];

// Demos missing <title>
const missingTitle = [
  'autoinject.html',
  'behaviors-card.html', 
  'code.html',
  'semantics-forms.html',
  'semantics-media.html',
  'semantics-theme.html'
];

for (const file of missingTitle) {
  const filePath = join(demosDir, file);
  let html = readFileSync(filePath, 'utf8');
  
  if (!/<title>/i.test(html)) {
    const name = file.replace('.html', '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    // Insert after last meta tag or after <head>
    if (html.includes('</head>')) {
      html = html.replace('</head>', `  <title>${name} — WB Demo</title>\n</head>`);
    } else if (/<head>/i.test(html)) {
      html = html.replace(/<head>/i, `<head>\n  <title>${name} — WB Demo</title>`);
    }
    writeFileSync(filePath, html);
    fixes.push({ file, fix: 'added <title>' });
  }
}

// Demos missing data-theme
const missingTheme = [
  'intellisense-check.html',
  'legacy-syntax-check.html',
  'stage-light.html'
];

for (const file of missingTheme) {
  const filePath = join(demosDir, file);
  let html = readFileSync(filePath, 'utf8');
  
  if (!html.includes('data-theme')) {
    html = html.replace(/<html\s+lang="en">/i, '<html lang="en" data-theme="dark">');
    // If no lang attribute
    html = html.replace(/<html>/i, '<html lang="en" data-theme="dark">');
    writeFileSync(filePath, html);
    fixes.push({ file, fix: 'added data-theme="dark"' });
  }
}

// Demos using wb-* without WB import
const missingWBImport = [
  'intellisense-check.html',
  'kitchen-sink.html',
  'wizard.html'
];

const wbImportScript = `\n  <script type="module">\n    import WB from '../src/core/wb-lazy.js';\n    WB.init();\n  </script>`;

for (const file of missingWBImport) {
  const filePath = join(demosDir, file);
  let html = readFileSync(filePath, 'utf8');
  
  if (!(/wb-lazy\.js|wb\.js/i.test(html)) && /<wb-[a-z]/i.test(html)) {
    if (html.includes('</head>')) {
      html = html.replace('</head>', `${wbImportScript}\n</head>`);
    } else if (html.includes('</body>')) {
      html = html.replace('</body>', `${wbImportScript}\n</body>`);
    }
    writeFileSync(filePath, html);
    fixes.push({ file, fix: 'added WB import + init()' });
  }
}

// Also fix the newly moved demos that may need data-theme or title
const movedDemos = ['charity-food.html', 'schema-first-architecture.html', 'button-variants-demo.html', 'button-variants-simple.html'];
for (const file of movedDemos) {
  const filePath = join(demosDir, file);
  let html;
  try { html = readFileSync(filePath, 'utf8'); } catch { continue; }
  let modified = false;
  
  if (!html.includes('data-theme')) {
    html = html.replace(/<html\s+lang="en">/i, '<html lang="en" data-theme="dark">');
    html = html.replace(/<html>/i, '<html lang="en" data-theme="dark">');
    modified = true;
    fixes.push({ file, fix: 'added data-theme' });
  }
  
  if (!/<title>/i.test(html)) {
    const name = file.replace('.html', '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    if (html.includes('</head>')) {
      html = html.replace('</head>', `  <title>${name} — WB Demo</title>\n</head>`);
      modified = true;
      fixes.push({ file, fix: 'added <title>' });
    }
  }
  
  if (modified) writeFileSync(filePath, html);
}

console.log(`\n=== Demo Fixes Applied ===`);
console.log(`Total fixes: ${fixes.length}`);
for (const f of fixes) {
  console.log(`  ✅ ${f.file}: ${f.fix}`);
}
