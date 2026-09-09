#!/usr/bin/env node
/**
 * sync-attribute-descriptions.mjs — carry real schema descriptions into the docs
 * ============================================================================
 * #1093 / #749. `scripts/generate-behavior-docs.mjs` deliberately NEVER
 * overwrites an existing doc — the hand-written ones are better than anything it
 * can produce, and that rule protects them. The cost is that a description
 * written into a schema today reaches no doc that already exists, which is all
 * 159 of them.
 *
 * So this does the one narrow thing that is safe: where a doc's attribute row
 * says `Read by foo().` — the generator's filler, which by definition contains
 * no author's work — replace THAT CELL with the schema's description. Nothing
 * else in the file is touched. A row someone has actually written is left alone,
 * because the generator's rule is right and this is not a licence to rewrite
 * prose.
 *
 * Filler looks like:
 *
 *   | `caption-position` | `string` | `bottom` | Read by figure(). |
 *   | `zoom` | `boolean` | `false` | Read by figure(). Bare attribute. |
 *
 * It says the attribute IS READ. Not what it does, what its values mean, or
 * where the effect shows — the three things John asked for.
 *
 *   node scripts/sync-attribute-descriptions.mjs
 *   node scripts/sync-attribute-descriptions.mjs --check   # report, change nothing
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';

const CHECK = process.argv.includes('--check');
const DOCS = 'docs/behaviors';
const MODELS = 'src/wb-models';

/** attribute -> description, for descriptions that are not themselves filler. */
function realDescriptions(name) {
  const p = `${MODELS}/${name}.schema.json`;
  if (!existsSync(p)) return null;
  let json;
  try { json = JSON.parse(readFileSync(p, 'utf8')); } catch { return null; }
  const out = new Map();
  for (const [attr, node] of Object.entries(json.properties || {})) {
    const d = node && typeof node.description === 'string' ? node.description.trim() : '';
    if (d && !/^Read by/.test(d)) out.set(attr, d);
  }
  return out;
}

let filesChanged = 0;
let rowsChanged = 0;
const stillFiller = [];

for (const file of readdirSync(DOCS).filter((f) => f.endsWith('.md'))) {
  const name = file.replace(/\.md$/, '');
  const docPath = `${DOCS}/${file}`;
  const src = readFileSync(docPath, 'utf8');
  if (!/Read by \w+\(\)/.test(src)) continue;

  const descriptions = realDescriptions(name);
  const lines = src.split('\n');
  let touched = 0;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!/Read by \w+\(\)/.test(line)) continue;
    // A markdown table row: | `attr` | `type` | `default` | description |
    const m = line.match(/^\|\s*`([^`]+)`\s*\|/);
    if (!m) continue;
    const attr = m[1];
    let desc = descriptions?.get(attr);

    // `data-lazy` is the data- spelling of `lazy`. The behaviors read both —
    // plain first, data- as fallback (#752 closed that gap across 32 files) —
    // so the row is real, but describing it twice would drift. Point at the
    // plain form, which carries the description, and say which to prefer.
    if (!desc && attr.startsWith('data-')) {
      const plain = attr.slice(5);
      const plainDesc = descriptions?.get(plain);
      if (plainDesc) {
        desc = `The \`data-\` spelling of \`${plain}\`, read as a fallback when the plain form is absent (#752). Identical effect; prefer \`${plain}\`.`;
      }
    }

    if (!desc) { stillFiller.push(`${docPath} :: ${attr}`); continue; }

    // Replace ONLY the final cell, preserving the row's own column layout.
    const cells = line.split('|');
    if (cells.length < 5) continue;
    // The description is the last non-empty cell before the trailing delimiter.
    let last = cells.length - 1;
    while (last > 0 && cells[last].trim() === '') last -= 1;
    cells[last] = ` ${desc} `;
    lines[i] = cells.join('|');
    touched += 1;
  }

  if (!touched) continue;
  rowsChanged += touched;
  filesChanged += 1;
  if (!CHECK) writeFileSync(docPath, lines.join('\n'));
  console.log(`${CHECK ? 'would update' : 'updated'} ${docPath}: ${touched} row(s)`);
}

console.log(`\n${CHECK ? 'would change' : 'changed'}: ${rowsChanged} row(s) in ${filesChanged} file(s)`);
if (stillFiller.length) {
  console.log(`\nstill filler — no real description in the schema yet (${stillFiller.length}):`);
  for (const s of stillFiller.slice(0, 20)) console.log(`  ${s}`);
  if (stillFiller.length > 20) console.log(`  …and ${stillFiller.length - 20} more`);
}
