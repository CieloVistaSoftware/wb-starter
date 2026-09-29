#!/usr/bin/env node
/**
 * backfill-opt-out-docs.mjs — teach every auto-injecting doc how to say no
 * ========================================================================
 * #1094. John: "if you don't want our additional behavior put in the opt out."
 *
 * `generate-behavior-docs.mjs` now emits a "Declining it" section, but it never
 * overwrites an existing doc — deliberately, so hand-written prose survives.
 * That rule is right and it means the 178 docs already on disk would never learn
 * this. So: insert the section once, into the docs that need it, and nowhere
 * else.
 *
 * WHICH DOCS NEED IT
 *
 * Only behaviors whose SEMANTIC TAG auto-injects them. `<header>` gets header
 * support whether or not anyone asked, so the reader needs a way out. An
 * attribute-only behavior (`x-ripple`, `x-tooltip`) is already declined by not
 * writing the attribute — adding an opt-out note there would be noise.
 *
 * WHERE IT GOES
 *
 * Immediately after the "> Do not write `<tag x-tag>`" warning, which is the
 * point in the page where the reader has just been told what NOT to do and is
 * most likely to ask "then how do I turn it off?".
 *
 *   node scripts/backfill-opt-out-docs.mjs
 *   node scripts/backfill-opt-out-docs.mjs --check
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';

const CHECK = process.argv.includes('--check');
const DOCS = 'docs/behaviors';

/** tag -> behavior, for tags that auto-inject (a key with no x- prefix). */
function autoInjectingTags() {
  const src = readFileSync('src/core/tag-map.js', 'utf8');
  const out = new Map();
  for (const m of src.matchAll(/^\s*'([^']+)'\s*:\s*'([^']+)'/gm)) {
    const [, key, value] = m;
    if (key.includes('[type=')) continue;
    if (/^\[?x-/.test(key)) continue;          // attribute form, not a tag
    if (!/^[a-z][a-z0-9-]*$/.test(key)) continue;
    out.set(value.trim(), key);                 // behavior name -> tag
  }
  return out;
}

const section = (tag) => [
  '### Declining it',
  '',
  `A \`<${tag}>\` **is** the ${tag} behavior, so it arrives with the element. To keep `
  + `the semantic element and decline the behavior, add \`x-ignore\`:`,
  '',
  '```html',
  `<${tag} x-ignore>`,
  `  <!-- a plain ${tag}: no behavior is injected -->`,
  `</${tag}>`,
  '```',
  '',
  'Reaching for a different element instead is the wrong fix — it trades correct HTML '
  + 'for a workaround. See [escape hatches](../escape-hatches.md).',
  '',
].join('\n');

const tagFor = autoInjectingTags();
let changed = 0;
const skipped = [];

for (const file of readdirSync(DOCS).filter((f) => f.endsWith('.md'))) {
  const name = file.replace(/\.md$/, '');
  const tag = tagFor.get(name);
  if (!tag) continue;                                   // attribute-only: no opt-out needed

  const path = `${DOCS}/${file}`;
  const src = readFileSync(path, 'utf8');
  if (/###\s+Declining it/.test(src)) { skipped.push(`${name} (already has it)`); continue; }

  // Preferred anchor: the redundant-form warning. It sits exactly where a
  // reader has just been told what NOT to write and is most likely to ask "then
  // how do I turn it off?".
  //
  // But only 6 of 22 auto-injecting docs carry it — the other 16 are
  // hand-written or predate the warning, and they need the opt-out just as
  // much. Anchoring solely on it would have quietly skipped three quarters of
  // the docs that matter, which is the shape of every silent-pass defect in
  // this repo. So fall back to placing it before the Attributes table, which
  // every doc has, and only give up if neither exists.
  const warn = src.match(/^> Do not write .*$/m);
  let at;
  if (warn) {
    at = warn.index + warn[0].length;
  } else {
    const attrs = src.match(/^##\s+Attributes.*$/m);
    if (!attrs) { skipped.push(`${name} (no anchor: no warning, no Attributes heading)`); continue; }
    at = attrs.index;
  }
  const next = src.slice(0, at) + '\n\n' + section(tag) + src.slice(at);
  if (!CHECK) writeFileSync(path, next);
  console.log(`${CHECK ? 'would add' : 'added'} to ${path} (<${tag}>)`);
  changed += 1;
}

console.log(`\n${CHECK ? 'would change' : 'changed'}: ${changed} doc(s)`);
if (skipped.length) {
  console.log(`skipped ${skipped.length}:`);
  for (const s of skipped.slice(0, 15)) console.log(`  ${s}`);
  if (skipped.length > 15) console.log(`  …and ${skipped.length - 15} more`);
}
