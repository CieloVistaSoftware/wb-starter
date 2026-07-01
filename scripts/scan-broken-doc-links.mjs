import fs from 'fs';
import path from 'path';
const ROOT = process.cwd();
const DOCS = path.join(ROOT, 'docs');
const exists = (p) => { try { return fs.statSync(p).isFile(); } catch { return false; } };
const rel = (f) => path.relative(DOCS, f).split(path.sep).join('/');

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

// basename -> relative paths, to suggest a corrected path for moved files
const byBase = new Map();
for (const f of allMd) {
  const b = path.basename(f).toLowerCase();
  if (!byBase.has(b)) byBase.set(b, []);
  byBase.get(b).push(rel(f));
}

const linkRe = /\]\(([^)]+\.md)(#[^)]*)?\)/g;
const brokenByTarget = new Map(); // target -> Set(source docs)
for (const f of allMd) {
  const src = fs.readFileSync(f, 'utf8');
  let m;
  while ((m = linkRe.exec(src)) !== null) {
    const t = m[1].trim();
    if (/^https?:/.test(t) || t.startsWith('#')) continue;
    const resolved = t.startsWith('/')
      ? path.join(DOCS, t.replace(/^\/+/, ''))
      : path.resolve(path.dirname(f), t.replace(/^\.\//, ''));
    if (!exists(resolved)) {
      if (!brokenByTarget.has(t)) brokenByTarget.set(t, new Set());
      brokenByTarget.get(t).add(rel(f));
    }
  }
}

const rows = [...brokenByTarget.entries()].sort((a, b) => b[1].size - a[1].size);
const totalOcc = [...brokenByTarget.values()].reduce((s, v) => s + v.size, 0);
console.log('UNIQUE broken link targets:', rows.length, '| broken occurrences:', totalOcc);
console.log('');
for (const [target, srcs] of rows) {
  const base = path.basename(target).toLowerCase();
  const here = target.replace(/^\/+/, '');
  const elsewhere = (byBase.get(base) || []).filter((p) => p !== here);
  const hint = elsewhere.length
    ? '  => MOVED? ' + elsewhere.slice(0, 2).join(', ')
    : '  => MISSING';
  console.log(`(${srcs.size}x) ${target}${hint}`);
}
