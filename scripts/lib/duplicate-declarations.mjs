/**
 * THE duplicate-declaration audit.
 *
 * John: "anything in this project that appears twice from declaratives is an
 * immediate priority 1 bug."
 *
 * A declarative is a statement of fact the system reads back later: a schema
 * property, a JSON key, a tag-map entry, a manifest row. Declared twice, one
 * of two things happens and BOTH are silent:
 *
 *   - the second wins and the first is discarded (JSON.parse keeps the last
 *     duplicate key without a word), so the file says one thing and the
 *     program does another; or
 *   - both survive into a consumer that iterates, and the duplicate is
 *     rendered twice -- which is how the generated docs listed `lazy` and
 *     `data-lazy` as two separate options that were always the same option.
 *
 * One engine, every declarative source. Consumers (CLI, compliance gate) call
 * findDuplicates() and report; nothing grows its own scanner.
 */
import fs from 'node:fs';
import path from 'node:path';

/**
 * Duplicate keys inside a single JSON object literal.
 *
 * JSON.parse cannot report these -- it silently keeps the last one -- so this
 * walks the raw text. A minimal tokenizer rather than a regex: a regex cannot
 * tell a `{` inside a string from a real object, and would either miss nested
 * objects or invent them.
 *
 * @returns {Array<{key: string, line: number, firstLine: number, pointerish: string}>}
 */
export function duplicateJsonKeys(text) {
  const dups = [];
  const stack = []; // { keys: Map<string, line>, label: string }
  let i = 0;
  let line = 1;
  let pendingKey = null;   // last string literal read at object level
  let expectValue = false; // we just saw ':'

  const readString = () => {
    // assumes text[i] === '"'
    let out = '';
    i++;
    while (i < text.length) {
      const c = text[i];
      if (c === '\\') {
        out += text[i + 1] === 'n' ? '\n' : text[i + 1];
        i += 2;
        continue;
      }
      if (c === '"') { i++; return out; }
      if (c === '\n') line++;
      out += c;
      i++;
    }
    return out;
  };

  while (i < text.length) {
    const c = text[i];

    if (c === '\n') { line++; i++; continue; }
    if (c === '"') {
      const startLine = line;
      const s = readString();
      if (!expectValue && stack.length) pendingKey = { name: s, line: startLine };
      expectValue = false;
      continue;
    }
    if (c === ':') {
      // The string just read was a KEY of the innermost object.
      if (pendingKey && stack.length) {
        const top = stack[stack.length - 1];
        if (top.keys.has(pendingKey.name)) {
          dups.push({
            key: pendingKey.name,
            line: pendingKey.line,
            firstLine: top.keys.get(pendingKey.name),
            pointerish: stack.map((f) => f.label).filter(Boolean).join('.') || '(root)',
          });
        } else {
          top.keys.set(pendingKey.name, pendingKey.line);
        }
      }
      expectValue = true;
      i++;
      continue;
    }
    if (c === '{') {
      stack.push({ keys: new Map(), label: pendingKey?.name ?? '' });
      pendingKey = null;
      expectValue = false;
      i++;
      continue;
    }
    if (c === '}') { stack.pop(); pendingKey = null; i++; continue; }
    if (c === '[') { stack.push({ keys: new Map(), label: pendingKey?.name ?? '' }); pendingKey = null; i++; continue; }
    if (c === ']') { stack.pop(); i++; continue; }
    if (c === ',') { pendingKey = null; expectValue = false; i++; continue; }
    i++;
  }
  return dups;
}

function walk(dir, ext, out = [], skip = new Set(['node_modules', '.git', 'test-results', 'playwright-report', 'out', 'dist'])) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, ext, out, skip);
    else if (e.isFile() && p.endsWith(ext)) out.push(p);
  }
  return out;
}

/** Duplicate object-literal keys in a JS/TS source map, e.g. tag-map.js. */
export function duplicateJsObjectKeys(text) {
  // Only flags keys repeated at the SAME brace depth inside one file, which is
  // what a lookup table is. Deliberately conservative: a key repeated at a
  // different depth is a different object and not a duplicate.
  const dups = [];
  const seen = new Map(); // depth -> Map(key, line)
  let depth = 0;
  const lines = text.split('\n');
  const KEY = /^\s*['"`]?([A-Za-z0-9_$-]+)['"`]?\s*:/;
  lines.forEach((raw, idx) => {
    const line = raw.replace(/\/\/.*$/, '');
    const m = KEY.exec(line);
    if (m) {
      if (!seen.has(depth)) seen.set(depth, new Map());
      const at = seen.get(depth);
      if (at.has(m[1])) dups.push({ key: m[1], line: idx + 1, firstLine: at.get(m[1]), depth });
      else at.set(m[1], idx + 1);
    }
    for (const ch of line) {
      if (ch === '{') depth++;
      else if (ch === '}') { seen.delete(depth); depth--; }
    }
  });
  return dups;
}

/**
 * Sweep every declarative source in the repo.
 * @returns {{findings: Array, totals: object}}
 */
export function findDuplicates({ root = '.' } = {}) {
  const findings = [];

  // ---- 1. duplicate keys in any JSON declarative -------------------------
  for (const dir of ['src', 'docs', 'data', 'public', 'pages']) {
    for (const file of walk(path.join(root, dir), '.json')) {
      // Generated caches restate their inputs; a duplicate there is an echo of
      // a duplicate we already report at the source.
      if (/search-index|test-results|test-status|\.min\.json$/.test(file)) continue;
      let text;
      try { text = fs.readFileSync(file, 'utf8'); } catch { continue; }
      for (const d of duplicateJsonKeys(text)) {
        findings.push({
          kind: 'json-key',
          file: path.relative(root, file).replace(/\\/g, '/'),
          detail: `"${d.key}" declared twice in the same object (${d.pointerish}) at line ${d.firstLine} and line ${d.line}. JSON.parse keeps the LAST silently.`,
        });
      }
    }
  }
  for (const file of ['package.json', 'tsconfig.json', 'playwright.config.ts'].map((f) => path.join(root, f))) {
    if (!fs.existsSync(file) || !file.endsWith('.json')) continue;
    for (const d of duplicateJsonKeys(fs.readFileSync(file, 'utf8'))) {
      findings.push({
        kind: 'json-key',
        file: path.relative(root, file).replace(/\\/g, '/'),
        detail: `"${d.key}" declared twice at line ${d.firstLine} and line ${d.line}.`,
      });
    }
  }

  // ---- 2. duplicate keys in JS lookup tables ----------------------------
  for (const rel of ['src/core/tag-map.js', 'src/core/semantic-attributes.js', 'src/wb-viewmodels/index.js']) {
    const file = path.join(root, rel);
    if (!fs.existsSync(file)) continue;
    for (const d of duplicateJsObjectKeys(fs.readFileSync(file, 'utf8'))) {
      findings.push({
        kind: 'js-map-key',
        file: rel,
        detail: `"${d.key}" mapped twice at line ${d.firstLine} and line ${d.line}. The later entry wins.`,
      });
    }
  }

  // ---- 3. one behavior, one schema file ---------------------------------
  const models = path.join(root, 'src/wb-models');
  if (fs.existsSync(models)) {
    const claims = new Map();
    const ids = new Map();
    for (const f of fs.readdirSync(models).filter((x) => x.endsWith('.schema.json'))) {
      let s;
      try { s = JSON.parse(fs.readFileSync(path.join(models, f), 'utf8')); } catch { continue; }
      if (s?.schemaType === 'definition' || s?.schemaType === 'page' || s?.isBase) continue;
      const name = String(s.schemaFor || f.replace('.schema.json', '')).replace(/^x-/, '');
      if (!claims.has(name)) claims.set(name, []);
      claims.get(name).push(f);
      if (s.$id) {
        if (!ids.has(s.$id)) ids.set(s.$id, []);
        ids.get(s.$id).push(f);
      }
    }
    for (const [name, files] of claims) {
      if (files.length > 1) {
        findings.push({ kind: 'schema-behavior', file: 'src/wb-models', detail: `x-${name} is defined by ${files.length} schema files: ${files.join(', ')}` });
      }
    }
    for (const [id, files] of ids) {
      if (files.length > 1) {
        findings.push({ kind: 'schema-id', file: 'src/wb-models', detail: `$id "${id}" claimed by ${files.join(', ')}` });
      }
    }
  }

  // ---- 4. duplicate rows in the docs manifest ---------------------------
  const manifest = path.join(root, 'docs/manifest.json');
  if (fs.existsSync(manifest)) {
    try {
      const m = JSON.parse(fs.readFileSync(manifest, 'utf8'));
      const paths = new Map();
      const collect = (node) => {
        if (Array.isArray(node)) return node.forEach(collect);
        if (node && typeof node === 'object') {
          const p = node.path || node.file || node.href;
          if (typeof p === 'string') paths.set(p, (paths.get(p) || 0) + 1);
          Object.values(node).forEach(collect);
        }
      };
      collect(m);
      for (const [p, n] of paths) {
        if (n > 1) findings.push({ kind: 'manifest-row', file: 'docs/manifest.json', detail: `"${p}" listed ${n} times` });
      }
    } catch { /* a manifest that will not parse is a different bug */ }
  }

  const totals = findings.reduce((acc, f) => { acc[f.kind] = (acc[f.kind] || 0) + 1; return acc; }, {});
  totals.all = findings.length;
  return { findings, totals };
}
