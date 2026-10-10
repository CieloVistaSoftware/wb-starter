/**
 * Move every `<div x-demo>` onto `<figure x-demo>` (#917).
 *
 * DEMOS-AND-DOCS-STANDARDS.md §1: a live example carries x-demo on the closest
 * semantic element, and an example IS a figure -- a self-contained
 * illustration referenced from the text. 4.0.0's tag migration put every
 * `<wb-demo>` on a neutral `<div>` (scripts/migrate-wb-tags.mjs), which is
 * where the 1,598 this issue counted came from.
 *
 * Only ELEMENTS move. scripts/lib/demo-hosts.mjs pairs each demo's opening tag
 * with the `</div>` that actually closes it (a stack of open <div>s, the way the
 * parser pairs them), and this rewrites exactly those two tags. A
 * `<div x-demo>` string that is not an element -- in a comment, in a script, in
 * an inline code span, in a ```text vocabulary fence -- is reported and left.
 *
 * Usage:
 *   node scripts/migrate-demo-hosts.mjs            dry run: what would change
 *   node scripts/migrate-demo-hosts.mjs --apply    write
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { scanDemoHosts } from './lib/demo-hosts.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIRS = ['pages', 'demos', 'docs'];
const apply = process.argv.includes('--apply');

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return walk(full);
    return /\.(html|md)$/.test(e.name) ? [full] : [];
  });
}

/** Rewrite each paired host's two tags, last first so earlier offsets stay valid. */
export function migrate(text, kind) {
  const { hosts, unmatched, other } = scanDemoHosts(text, kind);
  const edits = [];
  for (const h of hosts) {
    edits.push({ start: h.open.start, end: h.open.start + 4, to: '<figure' });          // "<div"
    edits.push({ start: h.close.start, end: h.close.start + 5, to: '</figure' });       // "</div"
  }
  edits.sort((a, b) => b.start - a.start);
  let out = text;
  for (const e of edits) out = out.slice(0, e.start) + e.to + out.slice(e.end);
  return { out, moved: hosts.length, unmatched, other };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  let moved = 0;
  let files = 0;
  const left = {};
  for (const file of DIRS.flatMap((d) => walk(path.join(ROOT, d)))) {
    const text = fs.readFileSync(file, 'utf8');
    if (!/<div\s+x-demo/.test(text)) continue;
    const rel = path.relative(ROOT, file).split(path.sep).join('/');
    const r = migrate(text, file.endsWith('.md') ? 'md' : 'html');
    for (const u of r.unmatched) console.error(`UNMATCHED ${rel}:${text.slice(0, u.start).split('\n').length}`);
    for (const o of r.other) (left[o.region] ??= []).push(`${rel}:${text.slice(0, o.start).split('\n').length}`);
    if (r.moved) {
      files++;
      moved += r.moved;
      if (apply) fs.writeFileSync(file, r.out);
    }
  }
  console.log(`${apply ? 'Moved' : 'Would move'} ${moved} <div x-demo> elements to <figure x-demo> in ${files} files.`);
  for (const [region, where] of Object.entries(left)) {
    console.log(`Left (not an element, ${region}): ${where.length}`);
  }
}
