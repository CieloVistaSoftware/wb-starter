/**
 * build-behavior-examples.mjs — the one-way migration that lifted the curated
 * <div x-demo> examples out of pages/behaviors.html into
 * data/behavior-examples.json (#666).
 *
 * The Behaviors page's live-preview panel used to read its examples straight off
 * the DOM (`demo._rawSource`), which meant ~13,000px of demo sections had to
 * stay on the page purely as a data source. This lifted them into a data file so
 * the sections could be removed while every curated example survived — the real
 * src/title/content values, not a generated stub.
 *
 * IMPORTANT: this has already run, and the demo sections are gone. A re-run
 * extracts nothing, so the write path REFUSES to shrink the catalogue.
 * data/behavior-examples.json is the source of truth now — edit it directly, or
 * point SOURCE at a page that still has demos.
 *
 * Usage:
 *   node scripts/build-behavior-examples.mjs           # extract (guarded)
 *   node scripts/build-behavior-examples.mjs --check   # assert the catalogue is present
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = path.join(ROOT, 'pages', 'behaviors.html');
const OUT = path.join(ROOT, 'data', 'behavior-examples.json');

/** Meta-attributes, not behaviors. */
const IGNORE = new Set(['x-behavior', 'x-schema', 'x-ignore']);

function readCatalogue() {
  if (!fs.existsSync(OUT)) return { count: 0, raw: '' };
  const raw = fs.readFileSync(OUT, 'utf8');
  try {
    const parsed = JSON.parse(raw);
    return { count: parsed && parsed.examples ? Object.keys(parsed.examples).length : 0, raw };
  } catch (err) {
    return { count: 0, raw, corrupt: true };
  }
}

// ─── --check runs FIRST, before any extraction ─────────────────────
// Post-migration the source page has no demos, so "extraction matches the file"
// is the wrong test — it would report stale forever. What matters is that the
// catalogue is present, parses, and is not empty.
if (process.argv.includes('--check')) {
  const held = readCatalogue();
  if (held.corrupt) {
    console.error('data/behavior-examples.json is not valid JSON.');
    process.exit(1);
  }
  if (held.count === 0) {
    console.error('data/behavior-examples.json is missing or empty.');
    process.exit(1);
  }
  console.log(`behavior examples present (${held.count} tokens).`);
  process.exit(0);
}

// ─── extraction ────────────────────────────────────────────────────
const html = fs.readFileSync(SOURCE, 'utf8');
const blocks = [...html.matchAll(/<div x-demo[^>]*>([\s\S]*?)<\/x-demo>/g)].map((m) => m[1].trim());

/** Every distinct x-* token used as a real attribute or tag in a block. */
function tokensIn(src) {
  const out = new Set();
  const re = /[<\s](x-[a-z0-9-]+)(?=[\s>=/])/gi;
  let m;
  while ((m = re.exec(src))) {
    const t = m[1].toLowerCase();
    if (!IGNORE.has(t)) out.add(t);
  }
  return [...out];
}

const examples = {};
let claimed = 0;

for (const src of blocks) {
  for (const token of tokensIn(src)) {
    if (!examples[token]) {
      examples[token] = { source: src, alternates: [] };
      claimed++;
    } else if (examples[token].source !== src) {
      // Several demos can share a token; keep the extras rather than dropping
      // them, since the page ordered them simplest-first for a reason.
      examples[token].alternates.push(src);
    }
  }
}

const payload = {
  generatedBy: 'scripts/build-behavior-examples.mjs',
  source: 'pages/behaviors.html',
  count: Object.keys(examples).length,
  demoBlocks: blocks.length,
  examples,
};

// ─── the guard ─────────────────────────────────────────────────────
// Without this, re-running (or a CI "regenerate" step) would silently overwrite
// 48 curated examples with an empty object, and no copy would exist anywhere.
const held = readCatalogue();
if (held.count > payload.count) {
  console.error(
    [
      `Refusing to overwrite ${path.relative(ROOT, OUT)}`,
      `  existing:  ${held.count} examples`,
      `  extracted: ${payload.count} from ${blocks.length} <div x-demo> blocks in ${path.relative(ROOT, SOURCE)}`,
      '',
      '  The demo sections were removed from that page once their contents were',
      '  migrated here, so extraction now yields less than the file already holds.',
      '  data/behavior-examples.json is the source of truth — edit it directly.',
    ].join('\n')
  );
  process.exit(1);
}

fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n');
const alts = Object.values(examples).reduce((n, e) => n + e.alternates.length, 0);
console.log(`Extracted ${payload.count} tokens from ${blocks.length} <div x-demo> blocks.`);
console.log(`  Output: ${path.relative(ROOT, OUT)}`);
console.log(`  ${claimed} primary examples, ${alts} alternates preserved.`);
