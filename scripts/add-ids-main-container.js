#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');

const SCAN_DIRS = [
  'pages', 'demos', 'public', 'templates', 'articles', 'index.html', 'project-index.html', 'builder.html', 'preview.html', 'setup.html'
];

const SKIP_FILES = [
  'tests/', 'public/papers/', 'demos/behaviors.html'
];

const SKIP_TAGS = new Set(['script','style','svg','template','head','meta','link']);

function walkDir(dir) {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return [];
  const stat = fs.statSync(full);
  if (stat.isFile()) return [full];
  if (stat.isDirectory()) {
    let out = [];
    for (const f of fs.readdirSync(full)) {
      out = out.concat(walkDir(path.join(dir, f)));
    }
    return out;
  }
  return [];
}

function shouldSkip(relPath) {
  return SKIP_FILES.some(skip => relPath.includes(skip.replace(/\//g, path.sep)) || relPath.includes(skip));
}

function hasId(attrs) {
  return (/\sid\s*=\s*['"][^'"]+['"]/i).test(attrs);
}

function extractId(attrs) {
  const m = attrs.match(/\sid\s*=\s*['"]([^'"]+)['"]/i);
  return m ? m[1] : null;
}

function processFile(filePath) {
  const relPath = path.relative(ROOT, filePath);
  if (shouldSkip(relPath)) return null;
  const ext = path.extname(filePath);
  if (ext !== '.html') return null;

  const raw = fs.readFileSync(filePath, 'utf8');
  const tokens = [];
  const tagRegex = /<\/?([a-z][a-z0-9-]*)\b([^>]*)>/ig;
  let match;
  while ((match = tagRegex.exec(raw)) !== null) {
    const full = match[0];
    const isClosing = full.startsWith('</');
    const tag = match[1].toLowerCase();
    const attrs = match[2];
    const start = match.index;
    const end = tagRegex.lastIndex;
    const selfClose = /\/\>\s*$/.test(full);
    tokens.push({ full, tag, attrs, isClosing, start, end, selfClose });
  }

  const stack = [];
  const toAdd = []; // {openStart, openEnd, tag}

  for (let i=0;i<tokens.length;i++) {
    const t = tokens[i];
    if (t.isClosing) {
      let popped = stack.pop();
      while (popped && popped.tag !== t.tag) popped = stack.pop();
      if (popped) {
        if (!popped.hasId && popped.childCount >= 1 && popped.inMain && !SKIP_TAGS.has(popped.tag)) {
          toAdd.push({ openStart: popped.openStart, openEnd: popped.openEnd, tag: popped.tag });
        }
        const parent = stack[stack.length-1];
        if (parent) parent.childCount++;
      }
    } else {
      if (t.selfClose) {
        if (stack.length>0) stack[stack.length-1].childCount++;
        continue;
      }
      const node = {
        tag: t.tag,
        openStart: t.start,
        openEnd: t.end,
        attrs: t.attrs,
        hasId: hasId(t.attrs),
        childCount: 0,
        inMain: false
      };
      // Determine if this node is (or is inside) #main-container
      if (stack.length > 0 && stack[stack.length-1].inMain) node.inMain = true;
      const nodeId = extractId(t.attrs);
      if (nodeId === 'main-container') node.inMain = true;
      stack.push(node);
    }
  }

  if (toAdd.length === 0) return { changed: false, relPath, additions: 0 };

  let out = '';
  let lastIndex = 0;
  let idCounter = 1;
  const prefix = relPath.replace(/[\\/]/g, '-').replace(/[^a-zA-Z0-9\-]/g, '');

  toAdd.sort((a,b)=>a.openStart - b.openStart);

  for (const a of toAdd) {
    const insertPosInOpen = a.openEnd - 1; // before '>'
    const id = `auto-${prefix}-${idCounter++}`;
    const insertion = ` id="${id}"`;
    out += raw.slice(lastIndex, insertPosInOpen) + insertion;
    lastIndex = insertPosInOpen;
    if (VERBOSE) console.log(`  ${relPath}: will add id ${id} to <${a.tag}> at ${a.openStart}`);
  }
  out += raw.slice(lastIndex);

  if (!DRY_RUN) {
    fs.writeFileSync(filePath, out, 'utf8');
    return { changed: true, relPath, additions: toAdd.length };
  }

  return { changed: false, relPath, additions: toAdd.length };
}

let files = [];
for (const d of SCAN_DIRS) files = files.concat(walkDir(d));

let totalAdd = 0;
let changedFiles = 0;

for (const f of files) {
  const res = processFile(f);
  if (!res) continue;
  if (res.additions > 0) {
    console.log(`📄 ${res.relPath} → ${res.additions} additions`);
    totalAdd += res.additions;
    if (res.changed) changedFiles++;
  }
}

console.log('\nSummary');
console.log(`  Files scanned: ${files.length}`);
console.log(`  Potential additions: ${totalAdd}`);
console.log(`  Files modified: ${changedFiles}${DRY_RUN? ' (dry-run - not saved)':''}`);

if (DRY_RUN && totalAdd>0) console.log('\nRun without --dry-run to apply changes.');