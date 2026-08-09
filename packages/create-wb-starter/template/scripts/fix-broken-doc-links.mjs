/**
 * fix-broken-doc-links.mjs  (#226)
 *
 * Repairs dead `[text](target.md)` links across docs/ so the doc-viewer never
 * 404s:
 *   - MOVED  — a file with the same basename exists elsewhere: rewrite the link
 *              to the correct path, relative to the source doc.
 *   - vscode://file/… editor deep-links: treated as MOVED by basename.
 *   - MISSING — no such file anywhere: unlink (keep the visible text, drop the
 *              broken href) and report it for authoring.
 *
 * Only the `.md` link target is touched; anchors (#x) are preserved. Run:
 *   node scripts/fix-broken-doc-links.mjs        (writes changes)
 *   node scripts/fix-broken-doc-links.mjs --dry  (report only)
 */
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const DOCS = path.join(ROOT, 'docs');
const DRY = process.argv.includes('--dry');
const exists = (p) => { try { return fs.statSync(p).isFile(); } catch { return false; } };
const toRel = (f) => path.relative(DOCS, f).split(path.sep).join('/');

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git'].includes(e.name)) continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) walk(abs, out);
    else if (e.name.endsWith('.md')) out.push(abs);
  }
}

const allMd = [];
walk(DOCS, allMd);
const byBase = new Map(); // basename(lower) -> [docs-relative paths]
for (const f of allMd) {
  const b = path.basename(f).toLowerCase();
  if (!byBase.has(b)) byBase.set(b, []);
  byBase.get(b).push(toRel(f));
}

// Pick the best existing candidate for a broken target: the one sharing the most
// trailing path segments with the intended target, tiebreak by shortest path.
function bestCandidate(intendedRel, candidates) {
  const want = intendedRel.toLowerCase().split('/').filter(Boolean);
  const score = (c) => {
    const got = c.toLowerCase().split('/');
    let s = 0;
    for (let i = 1; i <= Math.min(want.length, got.length); i++) {
      if (want[want.length - i] === got[got.length - i]) s++; else break;
    }
    return s;
  };
  return [...candidates].sort((a, b) => score(b) - score(a) || a.length - b.length)[0];
}

// Normalise a raw link target to a docs-root-relative path (no anchor).
function intendedDocsRel(sourceFile, rawTarget) {
  let t = rawTarget.replace(/#.*$/, '').trim();
  // vscode://file/c:/…/docs/<x>  → <x>
  const vs = t.match(/^vscode:\/\/file\/.*?\/docs\/(.+)$/i);
  if (vs) return vs[1];
  if (/^https?:/i.test(t)) return null;
  if (t.startsWith('/')) {
    // domain/site-root absolute — strip a leading /docs/ if present
    return t.replace(/^\/+/, '').replace(/^docs\//i, '');
  }
  // relative to the source doc's directory
  const abs = path.resolve(path.dirname(sourceFile), t.replace(/^\.\//, ''));
  return toRel(abs);
}

const linkRe = /(\[[^\]]*\])\(([^)]+\.md)((?:#[^)]*)?)\)/g;
let filesChanged = 0, rewrites = 0, unlinks = 0;
const missing = new Map(); // target -> Set(source)

for (const f of allMd) {
  const src = fs.readFileSync(f, 'utf8');
  let changed = false;
  const out = src.replace(linkRe, (whole, text, target, anchor) => {
    // already valid?
    const cleaned = target.replace(/#.*$/, '').trim();
    const asIs = cleaned.startsWith('/')
      ? path.join(DOCS, cleaned.replace(/^\/+/, ''))
      : path.resolve(path.dirname(f), cleaned.replace(/^\.\//, ''));
    if (!/^https?:/i.test(target) && exists(asIs)) return whole;

    const intended = intendedDocsRel(f, target);
    if (intended === null) return whole; // external

    const base = path.basename(intended).toLowerCase();
    const candidates = (byBase.get(base) || []);
    if (candidates.length) {
      const pick = bestCandidate(intended, candidates);
      const pickAbs = path.join(DOCS, pick);
      let relLink = path.relative(path.dirname(f), pickAbs).split(path.sep).join('/');
      if (!relLink.startsWith('.')) relLink = './' + relLink;
      changed = true; rewrites++;
      return `${text}(${relLink}${anchor})`;
    }
    // genuinely missing → unlink, keep the text
    if (!missing.has(intended)) missing.set(intended, new Set());
    missing.get(intended).add(toRel(f));
    changed = true; unlinks++;
    return text.slice(1, -1); // drop the [brackets] and the (broken.md) — keep plain text
  });
  if (changed) {
    filesChanged++;
    if (!DRY) fs.writeFileSync(f, out);
  }
}

console.log(`${DRY ? '[dry] ' : ''}Rewrote ${rewrites} moved link(s), unlinked ${unlinks} missing link(s) across ${filesChanged} file(s).`);
if (missing.size) {
  console.log(`\nMISSING targets (unlinked — create these docs if they should exist):`);
  for (const [t, srcs] of missing) console.log(`  ${t}   (referenced by: ${[...srcs].join(', ')})`);
}
