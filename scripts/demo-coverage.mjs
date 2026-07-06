#!/usr/bin/env node
/**
 * #268: demo coverage report — the ground truth for the demos/ redo.
 *
 * Enumerates every registered wb-* tag (src/core/tag-map.js) and x-* behavior
 * (src/core/wb-lazy.js selector map), then scans demos/**.html for where each is
 * demonstrated — distinguishing usage inside a <wb-demo> (standards-compliant:
 * live control + source, §16) from bare usage.
 *
 * Output: data/demo-coverage.json + console summary of
 *   - MISSING: tags/behaviors with no demo anywhere
 *   - BARE-ONLY: demonstrated, but never inside a <wb-demo>
 *   - DUPES: demonstrated across many files (overlap to consolidate)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ── registered tags & behaviors ─────────────────────────────────────────────
const tagMapSrc = fs.readFileSync(path.join(ROOT, 'src/core/tag-map.js'), 'utf8');
const TAGS = [...tagMapSrc.matchAll(/'(wb-[a-z0-9-]+)'\s*:/g)].map((m) => m[1]);

const lazySrc = fs.readFileSync(path.join(ROOT, 'src/core/wb-lazy.js'), 'utf8');
const BEHAVIORS = [...new Set(
  [...lazySrc.matchAll(/\[x-([a-z][a-z0-9-]*)\]|selector:\s*'\[?x-([a-z][a-z0-9-]*)/g)]
    .map((m) => 'x-' + (m[1] || m[2]))
)];

// ── scan demos ───────────────────────────────────────────────────────────────
const demoFiles = fs.readdirSync(path.join(ROOT, 'demos'))
  .filter((f) => f.endsWith('.html'))
  .map((f) => 'demos/' + f);

const coverage = {}; // name -> { inWbDemo: [files], bare: [files] }
const seen = (name) => (coverage[name] = coverage[name] || { inWbDemo: [], bare: [] });

for (const rel of demoFiles) {
  const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  // Split into wb-demo blocks vs the rest.
  const wbDemoBlocks = [...src.matchAll(/<wb-demo[^>]*>([\s\S]*?)<\/wb-demo>/gi)].map((m) => m[1]).join('\n');
  const stripped = src.replace(/<wb-demo[^>]*>[\s\S]*?<\/wb-demo>/gi, '');

  for (const tag of TAGS) {
    const re = new RegExp('<' + tag + '(?![a-z0-9-])', 'i');
    if (re.test(wbDemoBlocks)) seen(tag).inWbDemo.push(rel);
    else if (re.test(stripped)) seen(tag).bare.push(rel);
  }
  for (const b of BEHAVIORS) {
    const re = new RegExp('\\s' + b + '(?![a-z0-9-])', 'i');
    if (re.test(wbDemoBlocks)) seen(b).inWbDemo.push(rel);
    else if (re.test(stripped)) seen(b).bare.push(rel);
  }
}

// ── report ───────────────────────────────────────────────────────────────────
const all = [...TAGS, ...BEHAVIORS];
const missing = all.filter((n) => !coverage[n] || (coverage[n].inWbDemo.length + coverage[n].bare.length) === 0);
const bareOnly = all.filter((n) => coverage[n] && coverage[n].inWbDemo.length === 0 && coverage[n].bare.length > 0);
const dupes = all
  .map((n) => ({ n, files: coverage[n] ? [...new Set([...coverage[n].inWbDemo, ...coverage[n].bare])] : [] }))
  .filter((x) => x.files.length >= 4);

const out = {
  generated: 'demo-coverage',
  totals: { tags: TAGS.length, behaviors: BEHAVIORS.length, demoFiles: demoFiles.length },
  missing, bareOnly,
  dupes: Object.fromEntries(dupes.map((d) => [d.n, d.files])),
  coverage,
};
fs.mkdirSync(path.join(ROOT, 'data'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'data/demo-coverage.json'), JSON.stringify(out, null, 2));

console.log(`Registered: ${TAGS.length} wb-* tags, ${BEHAVIORS.length} x-* behaviors; ${demoFiles.length} demo files.`);
console.log(`\nMISSING (no demo anywhere): ${missing.length}`);
missing.forEach((n) => console.log('  ' + n));
console.log(`\nBARE-ONLY (never inside <wb-demo>): ${bareOnly.length}`);
bareOnly.slice(0, 40).forEach((n) => console.log('  ' + n));
console.log(`\nHEAVY OVERLAP (in 4+ files): ${dupes.length}`);
dupes.slice(0, 20).forEach((d) => console.log(`  ${d.n}: ${d.files.length} files`));
console.log('\nWrote data/demo-coverage.json');
