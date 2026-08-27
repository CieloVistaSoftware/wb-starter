/**
 * audit-schema-vs-behavior.mjs — find properties a schema PROMISES that its
 * behavior never reads (#669).
 *
 * John, looking at the Behaviors page: "none of the dialogs work" and "audio
 * showdisplay shows nothing". Both turned out to be the same defect, and it is
 * not a page defect:
 *
 *   audio.schema.json declares showEq, showDisplay, showPlayButton.
 *   audio.js reads src, controls, volume, playlist, show-eq, autoplay, loop.
 *   -> showDisplay and showPlayButton are wired to NOTHING.
 *   -> showEq is published under a name the code does not read (it reads show-eq).
 *
 * dialog.js:18 already records the same thing about its own variants:
 * "Schema declares variant: default/centered/fullscreen ... but this was never
 * read anywhere -- every variant produced an identical dialog."
 *
 * Anything that trusts the schema -- the Behaviors selector, IntelliSense, the
 * docs -- faithfully advertises options that do nothing. This audit turns that
 * from anecdote into a list.
 *
 * Usage:
 *   node scripts/audit-schema-vs-behavior.mjs          # human report
 *   node scripts/audit-schema-vs-behavior.mjs --json   # machine-readable
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const MODELS = path.join(ROOT, 'src', 'wb-models');
const VM = path.join(ROOT, 'src', 'wb-viewmodels');

/** Properties every behavior gets for free / handled generically. */
const IGNORED = new Set(['data', 'columns', 'content', 'class', 'id', 'style', 'children']);

/** Every .js under wb-viewmodels, so a behavior can live in a subfolder. */
function collectSources(dir) {
  const out = new Map();
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      for (const [k, v] of collectSources(full)) out.set(k, v);
    } else if (entry.name.endsWith('.js')) {
      out.set(entry.name.replace(/\.js$/, ''), fs.readFileSync(full, 'utf8'));
    }
  }
  return out;
}

const sources = collectSources(VM);

/**
 * Is this property name referenced anywhere in the behavior source?
 * Checks the declared name, its kebab-case form, and its dataset form, because
 * the codebase legitimately uses all three (`show-eq`, `dataset.showEq`).
 */
function isRead(src, prop) {
  const kebab = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
  const forms = new Set([prop, kebab, prop.toLowerCase()]);
  for (const form of forms) {
    // Quoted attribute name, dataset access, or destructured option.
    if (new RegExp(`['"\`]${form}['"\`]`).test(src)) return true;
    if (new RegExp(`\\.${form}\\b`).test(src)) return true;
  }
  return false;
}

const results = [];
for (const file of fs.readdirSync(MODELS).filter((f) => f.endsWith('.schema.json'))) {
  const name = file.replace('.schema.json', '');
  let schema;
  try {
    schema = JSON.parse(fs.readFileSync(path.join(MODELS, file), 'utf8'));
  } catch (err) {
    continue;
  }
  const props = Object.keys(schema.properties || {}).filter((p) => !IGNORED.has(p));
  if (!props.length) continue;

  const src = sources.get(name);
  if (!src) {
    results.push({ behavior: name, status: 'no-source', declared: props.length, unread: props });
    continue;
  }
  const unread = props.filter((p) => !isRead(src, p));
  if (unread.length) {
    results.push({ behavior: name, status: 'unread-properties', declared: props.length, unread });
  }
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ count: results.length, results }, null, 2));
  process.exit(0);
}

const noSource = results.filter((r) => r.status === 'no-source');
const unread = results.filter((r) => r.status === 'unread-properties');
const totalUnread = unread.reduce((n, r) => n + r.unread.length, 0);

console.log('Schema promises vs behavior reality\n');
console.log(`  schemas with properties declared but never read : ${unread.length}`);
console.log(`  properties affected                             : ${totalUnread}`);
console.log(`  schemas with no matching behavior source        : ${noSource.length}\n`);

console.log('Worst offenders:');
unread
  .sort((a, b) => b.unread.length - a.unread.length)
  .slice(0, 15)
  .forEach((r) => {
    console.log(`  ${r.behavior.padEnd(18)} ${String(r.unread.length).padStart(2)}/${r.declared}  ${r.unread.slice(0, 6).join(', ')}`);
  });

if (noSource.length) {
  console.log('\nNo behavior source found for:');
  console.log('  ' + noSource.map((r) => r.behavior).join(', '));
}
