#!/usr/bin/env node
/**
 * Remove an x- attribute that names the behavior its own tag already injects.
 *
 * John: "x-article doesn't need to be explicit, it automatically gets
 * injected."
 *
 * nativeMap (src/core/tag-map.js) is the contract: <article> IS a card,
 * <audio> IS an audio player, <table> IS a table. Writing
 * `<article x-article>` restates what the tag already says -- the same
 * redundancy as the x-card classes that were just removed from card markup.
 *
 * Driven off nativeMap rather than a hand-kept list, so it stays true when
 * the mapping changes.
 *
 *   node scripts/strip-redundant-behavior-attrs.mjs --dry docs demos pages
 */
import fs from 'node:fs';
import path from 'node:path';

const DRY = process.argv.includes('--dry');
const targets = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!targets.length) {
  console.error('Give at least one file or directory. Use --dry first.');
  process.exit(2);
}

const SKIP = new Set(['node_modules', '.git', 'out', 'dist', 'test-results', 'playwright-report', '.claude']);
const EXTS = ['.html', '.md', '.json', '.js'];

/** tag -> behavior, straight from the runtime's own table. */
function nativeMap() {
  const src = fs.readFileSync('src/core/tag-map.js', 'utf8');
  const block = /export const nativeMap = \{([\s\S]*?)\n\};/.exec(src);
  if (!block) throw new Error('nativeMap not found');
  const body = block[1].replace(/\/\/.*$/gm, '');
  const out = new Map();
  for (const m of body.matchAll(/'([a-z][a-z0-9-]*)'\s*:\s*'([a-z][a-z0-9-]*)'/g)) {
    out.set(m[1], m[2]);
  }
  return out;
}

const MAP = nativeMap();

function walk(p, out = []) {
  let st;
  try { st = fs.statSync(p); } catch { return out; }
  if (st.isDirectory()) {
    if (SKIP.has(path.basename(p))) return out;
    for (const e of fs.readdirSync(p)) walk(path.join(p, e), out);
  } else if (EXTS.some((x) => p.endsWith(x))) {
    out.push(p);
  }
  return out;
}


/** Byte ranges of fenced code blocks — the only markup in a Markdown file. */
function fencedRegions(md) {
  const regions = [];
  const fence = /^```.*$/gm;
  let open = null;
  let m;
  while ((m = fence.exec(md))) {
    if (open === null) open = m.index + m[0].length;
    else { regions.push([open, m.index]); open = null; }
  }
  return regions;
}

/** Apply `re` only inside the given ranges, leaving everything else alone. */
function replaceWithin(text, regions, re, replacer) {
  if (!regions.length) return text;
  let out = '';
  let cursor = 0;
  for (const [start, end] of regions) {
    out += text.slice(cursor, start);
    out += text.slice(start, end).replace(re, replacer);
    cursor = end;
  }
  return out + text.slice(cursor);
}

let files = 0;
let hits = 0;

for (const target of targets) {
  for (const file of walk(target)) {
    let text;
    try { text = fs.readFileSync(file, 'utf8'); } catch { continue; }
    const before = text;

    // PROSE IS NOT MARKUP.
    // Run blind over a .md, this rewrote sentences that name the wrong form
    // deliberately: "Do not write `<button x-button>`" became "Do not write
    // `<button>`", which tells a reader not to write a button at all. It did
    // that to eight docs in one pass. Inside a Markdown file, only fenced code
    // blocks are markup a reader would copy; everything else is someone
    // explaining something, and an explanation often has to quote the form it
    // is warning against.
    const editable = file.endsWith('.md') ? fencedRegions(text) : [[0, text.length]];

    for (const [tag, behavior] of MAP) {
      // <article ... x-article ...>  ->  <article ... ...>
      // Only inside that tag's own opening tag, and only its OWN behavior --
      // <article x-cardhero> is a deliberate replacement and must survive.
      const re = new RegExp(`(<${tag}\\b[^>]*?)\\s+x-${behavior}(?=[\\s/>])`, 'gi');
      text = replaceWithin(text, editable, re, (m, head) => { hits++; return head; });
      // Escaped form, as it appears inside JSON string examples.
      const reEsc = new RegExp(`(<${tag}\\\\?\\b[^>]*?)\\\\?\\s+x-${behavior}(?=[\\s\\\\/>])`, 'gi');
      text = replaceWithin(text, editable, reEsc, (m, head) => { hits++; return head; });
    }

    if (text !== before) {
      files++;
      console.log('  ' + file.replace(/\\/g, '/'));
      if (!DRY) fs.writeFileSync(file, text);
    }
  }
}

console.log('');
console.log(`${DRY ? 'WOULD REMOVE' : 'REMOVED'}: ${hits} redundant attribute(s) in ${files} file(s)`);
console.log(`(from ${MAP.size} tag->behavior pairs in nativeMap)`);
