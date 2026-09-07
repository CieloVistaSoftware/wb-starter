#!/usr/bin/env node
/**
 * The replacement-guard signature, found statically — and fixable.
 *
 * `<article>` already IS the card behavior (nativeMap: article -> card), so
 * `<article x-card>` states the same thing twice. The runtime guard reports this
 * correctly and even says what to do:
 *
 *   "<article x-card> says the same thing twice: <article> already IS the card
 *    behavior, so x-card adds nothing. Drop it and keep <article> -- the
 *    behavior still runs."
 *
 * What it cannot say is WHERE, because at runtime the source file is gone. That
 * is the whole difference between an error you read and an error you can act on.
 *
 *   node scripts/find-redundant-behavior-attrs.mjs          # report
 *   node scripts/find-redundant-behavior-attrs.mjs --fix    # remove them
 *   node scripts/find-redundant-behavior-attrs.mjs --json
 *
 * WHY THIS PARSES INSTEAD OF MATCHING TEXT
 * ----------------------------------------
 * The first version regexed `\bx-([a-zA-Z0-9-]+)` across a tag's raw attribute
 * text and swept every `<tag …>` in the file, comments included. `--fix` then
 * damaged 13 files in one run:
 *
 *   class="x-button x-button--primary"        -> x-button stripped from a VALUE
 *   copy-text="Copied from a x-button!"       -> "Copied from a!"
 *   <!-- never write <button x-button> -->    -> the explanation itself edited
 *
 * Six of its 28 reported instances were class values rather than attributes.
 * The fix-registry entry has sat at `fixable: false` ever since, with the reason
 * recorded (data/fix-registry.json, `blocked_by`).
 *
 * So: attribute NAMES only, from a tokenizer that CONSUMES values, so nothing
 * inside a quoted value can be read as a name; regions where markup is content
 * rather than markup (comments, <script>, <style>, <pre>, <code>, <textarea>,
 * and fenced or inline code in Markdown) are skipped entirely; and --fix edits
 * by byte span, back to front, never by re-matching text.
 *
 * Markdown is scanned too. The instance found on 2026-09-05 was in
 * docs/behaviors-reference.md inside a <div x-demo> — a live demo, not an
 * example — and an .html-only sweep could not see it.
 */

import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const doFix = args.includes('--fix');
const asJson = args.includes('--json');
const rootArg = args.indexOf('--root');
const ROOT = rootArg >= 0 ? args[rootArg + 1] : '.';

const SKIP_DIRS = new Set(['node_modules', '.git', '.claude', 'dist', 'coverage', 'error-log-archive']);

/**
 * A behavior's family, DERIVED from the registry — never restated here.
 *
 * `src/wb-viewmodels/index.js` maps `article: 'card'`, which is the system
 * saying in one place that an <article> IS a card. familyRoot() in
 * replacement-guard.js is this same read, and its comment is the warning this
 * function exists to heed: #765 inferred family from the SPELLING of the names
 * and went silently inert when nativeMap moved article -> article (#880),
 * because 'card'.startsWith('article') is false.
 *
 * This detector made the identical mistake in its first parsing version: it
 * compared the attribute name to the nativeMap VALUE ('article'), so
 * `<article x-card>` — the very case the runtime had just logged — reported
 * zero hits. Comparing against the family root is what makes the static check
 * agree with the runtime guard by construction.
 */
function readBehaviorModules() {
  const src = fs.readFileSync('src/wb-viewmodels/index.js', 'utf8');
  const map = {};
  for (const m of src.matchAll(/['"]?([a-zA-Z0-9-]+)['"]?\s*:\s*['"]([a-zA-Z0-9/\\-]+)['"]/g)) {
    map[m[1].toLowerCase()] = m[2].toLowerCase();
  }
  return map;
}

/** basename of the module a behavior loads: 'semantics/timeline' -> 'timeline' */
function familyRoot(behavior, modules) {
  const mod = modules[behavior];
  if (!mod) return behavior;
  return String(mod).split('/').pop() || behavior;
}

/** Read nativeMap from tag-map.js: the tags that already ARE a behavior. */
function readNativeMap() {
  const src = fs.readFileSync('src/core/tag-map.js', 'utf8');
  const block = src.match(/nativeMap\s*=\s*\{([\s\S]*?)\n\}/);
  const map = {};
  if (!block) return map;
  for (const line of block[1].split('\n')) {
    if (line.trim().startsWith('//')) continue;
    const m = line.match(/['"]?([a-zA-Z0-9-]+)['"]?\s*:\s*['"]([a-zA-Z0-9-]+)['"]/);
    if (m) map[m[1].toLowerCase()] = m[2].toLowerCase();
  }
  return map;
}

function sourceFiles(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) sourceFiles(p, out);
    else if (e.name.endsWith('.html') || e.name.endsWith('.md')) out.push(p);
  }
  return out;
}

/**
 * Byte ranges where a `<tag …>` is content rather than markup: HTML comments,
 * raw-text elements, and Markdown code. A tag starting inside one is skipped.
 */
function skipRanges(src, isMarkdown) {
  const ranges = [];
  const push = (re) => {
    let m;
    while ((m = re.exec(src)) !== null) ranges.push([m.index, m.index + m[0].length]);
  };

  push(/<!--[\s\S]*?-->/g);
  push(/<(script|style|pre|code|textarea)\b[^>]*>[\s\S]*?<\/\1>/gi);

  if (isMarkdown) {
    push(/^```[\s\S]*?^```/gm);   // fenced blocks
    push(/`[^`\n]*`/g);           // inline code
  }
  return ranges;
}

const inRange = (ranges, i) => ranges.some(([a, b]) => i >= a && i < b);

/**
 * Attributes of one opening tag, as NAME plus the exact span the name and its
 * value occupy in the file. The value alternatives are part of the pattern, so
 * a quoted value is consumed in the same match as its name and can never be
 * scanned for names of its own.
 */
function attributesOf(attrText, attrStart) {
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(\s*=\s*("[^"]*"|'[^']*'|[^\s"'`=<>]+))?/g;
  const out = [];
  let m;
  while ((m = re.exec(attrText)) !== null) {
    if (!m[1]) continue;
    out.push({
      name: m[1].toLowerCase(),
      start: attrStart + m.index,
      end: attrStart + m.index + m[0].length,
    });
  }
  return out;
}

const nativeMap = readNativeMap();
const behaviorModules = readBehaviorModules();
const files = sourceFiles(ROOT);
const hits = [];

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const ranges = skipRanges(src, file.endsWith('.md'));
  const tagRe = /<([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g;
  let m;
  while ((m = tagRe.exec(src)) !== null) {
    if (inRange(ranges, m.index)) continue;          // a tag inside content, not markup
    const tag = m[1].toLowerCase();
    const behavior = nativeMap[tag];
    if (!behavior) continue;

    // What the tag already runs, expressed the way the runtime expresses it.
    const family = familyRoot(behavior, behaviorModules);

    const attrStart = m.index + 1 + m[1].length;
    for (const attr of attributesOf(m[2], attrStart)) {
      if (!attr.name.startsWith('x-')) continue;
      const name = attr.name.slice(2);
      // EXACT duplicate only — replacement-guard.js's `other === family`.
      // <article x-card> is redundant: the tag already means card.
      // <article x-cardimage> is NOT: it selects a variant of the card, and
      // dropping it would change what renders.
      if (name !== family && name !== tag) continue;
      hits.push({
        file: file.replace(/\\/g, '/'),
        line: src.slice(0, m.index).split('\n').length,
        tag,
        attribute: attr.name,
        behavior,
        start: attr.start,
        end: attr.end,
      });
    }
  }
}

if (doFix) {
  const byFile = new Map();
  for (const h of hits) {
    if (!byFile.has(h.file)) byFile.set(h.file, []);
    byFile.get(h.file).push(h);
  }
  let removed = 0;
  for (const [file, list] of byFile) {
    let src = fs.readFileSync(file, 'utf8');
    // Back to front: every edit shortens the file, and a forward pass would
    // invalidate every later span. The spans come from the parse, so nothing is
    // re-matched and no other occurrence can be hit by accident.
    for (const h of [...list].sort((a, b) => b.start - a.start)) {
      let from = h.start;
      while (from > 0 && /\s/.test(src[from - 1])) from -= 1;   // eat the separating space
      src = src.slice(0, from) + src.slice(h.end);
      removed += 1;
    }
    fs.writeFileSync(file, src, 'utf8');
  }
  console.log(`removed ${removed} redundant attribute(s) across ${byFile.size} file(s)`);
  console.log('verify with: node scripts/find-redundant-behavior-attrs.mjs   (must report 0)');
  process.exit(0);
}

if (asJson) {
  console.log(JSON.stringify({ count: hits.length, hits }, null, 2));
} else {
  console.log(`redundant behavior attributes (tag already IS the behavior): ${hits.length}`);
  const byFile = {};
  for (const h of hits) byFile[h.file] = (byFile[h.file] || 0) + 1;
  for (const [f, n] of Object.entries(byFile).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(4)}  ${f}`);
  }
  if (hits.length) {
    console.log('\nfirst few:');
    for (const h of hits.slice(0, 5)) {
      console.log(`  ${h.file}:${h.line}  <${h.tag} ${h.attribute}>  -> drop ${h.attribute}`);
    }
    console.log('\nfix with: node scripts/find-redundant-behavior-attrs.mjs --fix');
  }
}

process.exit(hits.length ? 1 : 0);
