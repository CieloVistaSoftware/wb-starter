/**
 * fix-page-fragments.mjs
 * 
 * Bulk fixes for all page fragments in pages/
 * 
 * For each page:
 * 1. Strips <!DOCTYPE>, <html>, <head>, <body> wrappers
 * 2. Extracts <style> blocks to src/styles/pages/{name}.css
 * 3. Removes <link> to site.css/themes.css
 * 4. Removes WB.init() scripts
 * 5. Adds .page__hero + h1 if missing
 * 6. Wraps content sections in .page__section if missing
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { readdirSync } from 'fs';
import { join, basename } from 'path';

const root = process.cwd();
const pagesDir = join(root, 'pages');
const stylesDir = join(root, 'src', 'styles', 'pages');

if (!existsSync(stylesDir)) mkdirSync(stylesDir, { recursive: true });

const pageFiles = readdirSync(pagesDir).filter(f => f.endsWith('.html'));
const report = [];

for (const file of pageFiles) {
  const filePath = join(pagesDir, file);
  let html = readFileSync(filePath, 'utf8');
  const fixes = [];
  const pageName = file.replace('.html', '');

  // ─── 1. Extract <style> blocks to external CSS ───
  const styleBlocks = [];
  html = html.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (match, css) => {
    styleBlocks.push(css.trim());
    return '';
  });
  
  if (styleBlocks.length > 0) {
    const cssPath = join(stylesDir, `${pageName}.css`);
    const existingCSS = existsSync(cssPath) ? readFileSync(cssPath, 'utf8') : '';
    const newCSS = styleBlocks.join('\n\n');
    if (!existingCSS.includes(newCSS.substring(0, 50))) {
      writeFileSync(cssPath, existingCSS + '\n\n/* Extracted from pages/' + file + ' */\n' + newCSS);
    }
    fixes.push(`Extracted ${styleBlocks.length} <style> block(s) to src/styles/pages/${pageName}.css`);
  }

  // ─── 2. Strip document shell ───
  // Remove <!DOCTYPE ...>
  if (/<!doctype/i.test(html)) {
    html = html.replace(/<!DOCTYPE[^>]*>/i, '');
    fixes.push('Stripped <!DOCTYPE>');
  }

  // Extract body content from <html>...<body>...</body>...</html>
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (bodyMatch) {
    html = bodyMatch[1];
    fixes.push('Extracted <body> content');
  } else if (/<html[\s>]/i.test(html)) {
    // No <body> but has <html> — extract inner content
    html = html.replace(/<\/?html[^>]*>/gi, '');
    fixes.push('Stripped <html> tags');
  }

  // Remove <head>...</head>
  html = html.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '');
  if (fixes.length === 0 || html !== readFileSync(filePath, 'utf8')) {
    // Only note if actually changed
  }

  // ─── 3. Remove links to site.css and themes.css ───
  const beforeLinks = html;
  html = html.replace(/<link[^>]*href=["'][^"']*(?:site|themes)\.css["'][^>]*>/gi, '');
  if (html !== beforeLinks) fixes.push('Removed site.css/themes.css <link>');

  // ─── 4. Remove WB.init() scripts ───
  const beforeScripts = html;
  // Remove entire <script> blocks containing WB.init
  html = html.replace(/<script[^>]*>[\s\S]*?WB\.init[\s\S]*?<\/script>/gi, '');
  if (html !== beforeScripts) fixes.push('Removed WB.init() <script>');

  // ─── 5. Add page CSS link if we extracted styles ───
  if (styleBlocks.length > 0) {
    const cssLink = `<link rel="stylesheet" href="../src/styles/pages/${pageName}.css">`;
    if (!html.includes(`pages/${pageName}.css`)) {
      html = `<!-- Page styles: src/styles/pages/${pageName}.css -->\n${cssLink}\n\n${html}`;
      fixes.push('Added page CSS <link>');
    }
  }

  // ─── 6. Add .page__hero if missing ───
  if (!html.includes('page__hero')) {
    // Try to find the first <h1> and wrap it
    const h1Match = html.match(/<h1[^>]*>[\s\S]*?<\/h1>/i);
    if (h1Match) {
      // Find the surrounding container or create one
      const h1Index = html.indexOf(h1Match[0]);
      
      // Look for a subtitle <p> right after the h1
      const afterH1 = html.substring(h1Index + h1Match[0].length);
      const pMatch = afterH1.match(/^\s*(<p[^>]*>[\s\S]*?<\/p>)/i);
      
      if (pMatch) {
        const heroContent = h1Match[0] + '\n  ' + pMatch[1];
        html = html.replace(h1Match[0] + pMatch[0], `<div class="page__hero">\n  ${heroContent}\n</div>`);
      } else {
        html = html.replace(h1Match[0], `<div class="page__hero">\n  ${h1Match[0]}\n  <p></p>\n</div>`);
      }
      fixes.push('Wrapped h1 in .page__hero');
    } else {
      // No h1 at all — add a hero
      const title = pageName.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const hero = `<div class="page__hero">\n  <h1>${title}</h1>\n  <p></p>\n</div>\n\n`;
      html = hero + html;
      fixes.push('Added .page__hero with h1');
    }
  }

  // ─── 7. Add .page__section if missing ───
  if (!html.includes('page__section')) {
    // Find <h2> tags and wrap them + following content
    if (/<h2[\s>]/i.test(html)) {
      // Find first <h2> and wrap content after hero in a section
      const heroEnd = html.indexOf('</div>', html.indexOf('page__hero'));
      if (heroEnd > -1) {
        const afterHero = html.substring(heroEnd + 6);
        if (afterHero.trim().length > 0 && !afterHero.includes('page__section')) {
          html = html.substring(0, heroEnd + 6) + '\n\n<div class="page__section">\n' + afterHero + '\n</div>';
          fixes.push('Wrapped content after hero in .page__section');
        }
      }
    } else {
      // No h2 either — wrap everything after hero in a section with an h2
      const heroEnd = html.indexOf('</div>', html.indexOf('page__hero'));
      if (heroEnd > -1) {
        const afterHero = html.substring(heroEnd + 6);
        if (afterHero.trim().length > 0) {
          html = html.substring(0, heroEnd + 6) + '\n\n<div class="page__section">\n  <h2>Content</h2>\n' + afterHero + '\n</div>';
          fixes.push('Added .page__section with h2 wrapper');
        }
      }
    }
  }

  // ─── 8. Clean up excessive whitespace ───
  html = html.replace(/\n{4,}/g, '\n\n\n');
  html = html.trim() + '\n';

  // Write back
  if (fixes.length > 0) {
    writeFileSync(filePath, html);
    report.push({ file, fixes });
  } else {
    report.push({ file, fixes: ['No changes needed'] });
  }
}

console.log('\n=== Page Fragment Fixes ===\n');
for (const r of report) {
  const status = r.fixes[0] === 'No changes needed' ? '✅' : '🔧';
  console.log(`${status} ${r.file}:`);
  for (const f of r.fixes) console.log(`   ${f}`);
}
console.log(`\nTotal files: ${report.length}`);
console.log(`Modified: ${report.filter(r => r.fixes[0] !== 'No changes needed').length}`);
