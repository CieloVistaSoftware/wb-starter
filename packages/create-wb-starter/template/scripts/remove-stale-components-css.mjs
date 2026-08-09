/**
 * remove-stale-components-css.mjs
 *
 * Removes the dead `.../src/styles/components.css` stylesheet reference from
 * page/site schema JSON. That file was consolidated into the behavior CSS
 * (button/input/data/dialog/progress/themecontrol.css), all imported globally
 * by src/styles/site.css — so the reference just 404s on every page. Leaves
 * `src/styles/pages/components.css` (the components-page CSS) untouched.
 *
 * Line-based edit to preserve surrounding formatting; fixes the trailing comma
 * when the removed entry was the last array element.
 */
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const files = [
  'src/wb-models/pages/badge-showcase.page.json',
  'src/wb-models/pages/behaviors-card-code.page.json',
  'src/wb-models/pages/cardnotification-showcase.page.json',
  'src/wb-models/pages/cardportfolio-showcase.page.json',
  'src/wb-models/pages/defaults/wb-page-defaults.json',
  'src/wb-models/pages/multi-component-demo.page.json',
  'src/wb-models/pages/progress-showcase.page.json',
  'src/wb-models/sites/wb-library.site.json',
];

// Matches the stale ref but NOT .../styles/pages/components.css
const STALE = /styles\/components\.css",?\s*$/;
const isPages = (s) => /styles\/pages\/components\.css/.test(s);

let changed = 0;
for (const rel of files) {
  const abs = path.join(ROOT, rel);
  const raw = fs.readFileSync(abs, 'utf8');
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  const lines = raw.split(/\r?\n/);
  const idx = lines.findIndex((l) => STALE.test(l) && !isPages(l));
  if (idx === -1) { console.log(`(skip) ${rel} — no stale ref`); continue; }

  const line = lines[idx];
  const hadOwnComma = /,\s*$/.test(line);
  lines.splice(idx, 1);
  if (!hadOwnComma) {
    // It was the last array element — drop the trailing comma on the prior entry.
    for (let i = idx - 1; i >= 0; i--) {
      if (lines[i].trim() === '') continue;
      lines[i] = lines[i].replace(/,(\s*)$/, '$1');
      break;
    }
  }
  const out = lines.join(eol);
  JSON.parse(out); // validate before writing
  fs.writeFileSync(abs, out);
  changed++;
  console.log(`fixed ${rel}`);
}
console.log(`\nRemoved stale components.css ref from ${changed} file(s).`);
