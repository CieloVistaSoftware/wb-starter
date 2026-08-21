/**
 * generate-behavior-docs.mjs (#713)
 *
 * Writes docs/behaviors/<name>.md for every behavior the showcase can look up
 * that has none. John, on `button`: "We need to write some doc." The panel read
 * "No doc yet for button." for 116 of 143 behaviors.
 *
 * The content is DERIVED, not invented: every line comes from the schema
 * (src/wb-models/<name>.schema.json) or the curated example catalogue
 * (data/behavior-examples.json). Attribute names, types, defaults, enum values,
 * events, methods and accessibility notes are the real declared ones — a
 * generated table of what the code actually accepts, not filler prose.
 *
 * NEVER overwrites an existing file: the 27 hand-written docs are the better
 * kind and this must not touch them. Re-running only fills new gaps.
 *
 * Usage:
 *   node scripts/generate-behavior-docs.mjs            # write missing docs
 *   node scripts/generate-behavior-docs.mjs --check    # list gaps, write nothing
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { extensionMap, nativeMap } from '../src/core/tag-map.js';
import { WB_LAZY_ONLY_ATTRIBUTES } from '../src/core/wb-lazy.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = path.join(ROOT, 'docs', 'behaviors');
const MODELS = path.join(ROOT, 'src', 'wb-models');
const EXAMPLES = path.join(ROOT, 'data', 'behavior-examples.json');
const CHECK = process.argv.includes('--check');

// The x-* surface is split across TWO registries (#666): tag-map's extensionMap
// and wb-lazy's WB_LAZY_ONLY_ATTRIBUTES. The page merges them the same way --
// reading tag-map alone under-reported the list by a third (x-fadein, x-lightbox,
// x-confirm, x-bounce and 30 others live only in the second one).
const MERGED = { ...(WB_LAZY_ONLY_ATTRIBUTES || {}), ...extensionMap };

/** The name the behaviors page fetches: the registry name, else the bare token. */
function docNameFor(token) {
  return MERGED[token] || token.replace(/^x-/, '');
}

/** Every behavior the page can show, as {token, docName}. */
function behaviors() {
  // x-as-* are aliases the page itself filters out of the list.
  const tokens = new Set(Object.keys(MERGED).filter((a) => !a.startsWith('x-as-')));
  for (const tag of Object.keys(nativeMap)) tokens.add('x-' + tag);
  return [...tokens].sort().map((token) => ({ token, docName: docNameFor(token) }));
}

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

const examples = readJson(EXAMPLES)?.examples || {};

function schemaFor(docName) {
  return readJson(path.join(MODELS, `${docName}.schema.json`));
}

/** `variant` -> `variant` | `iconPosition` -> `icon-position` (§31: kebab-case). */
function attrName(prop) {
  return prop.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());
}

function attributesTable(schema) {
  const props = schema?.properties || {};
  const rows = Object.entries(props).map(([name, def]) => {
    if (!def || typeof def !== 'object') return null;
    const values = Array.isArray(def.enum) && def.enum.length
      ? def.enum.map((v) => `\`${v}\``).join(' · ')
      : `\`${def.type || 'string'}\``;
    const dflt = def.default === undefined || def.default === ''
      ? '—' : `\`${String(def.default)}\``;
    return `| \`${attrName(name)}\` | ${values} | ${dflt} | ${(def.description || '').replace(/\|/g, '\\|')} |`;
  }).filter(Boolean);

  if (!rows.length) return null;
  return [
    '| Attribute | Values | Default | Description |',
    '| --- | --- | --- | --- |',
    ...rows,
  ].join('\n');
}

function eventsList(schema) {
  const events = schema?.events;
  if (!events) return null;
  const entries = Array.isArray(events)
    ? events.map((e) => (typeof e === 'string' ? [e, ''] : [e.name || e.event || '?', e.description || '']))
    : Object.entries(events).map(([k, v]) => [k, typeof v === 'string' ? v : (v?.description || '')]);
  const rows = entries.filter(([n]) => n && n !== '?');
  if (!rows.length) return null;
  return rows.map(([name, desc]) => `- \`${name}\`${desc ? ` — ${desc}` : ''}`).join('\n');
}

function methodsList(schema) {
  const m = schema?.$methods;
  if (!m) return null;
  const entries = Array.isArray(m)
    ? m.map((x) => (typeof x === 'string' ? [x, ''] : [x.name || '?', x.description || '']))
    : Object.entries(m).map(([k, v]) => [k, typeof v === 'string' ? v : (v?.description || '')]);
  const rows = entries.filter(([n]) => n && n !== '?');
  if (!rows.length) return null;
  return rows.map(([name, desc]) => `- \`${name}()\`${desc ? ` — ${desc}` : ''}`).join('\n');
}

// ── No schema? Read the behavior's own source. ────────────────────────────────
// 34 behaviors (the animation effects, mostly) have no schema at all, and a doc
// that only says "the x-fadein behavior" is filler. Their implementations are
// short and literal -- `clickAnim(element, 'fade-in', '0.5s')` says exactly what
// the reader needs -- so take the facts from there instead of inventing prose.
const VIEWMODELS = path.join(ROOT, 'src', 'wb-viewmodels');

function allSourceFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) allSourceFiles(full, out);
    else if (entry.name.endsWith('.js')) out.push(full);
  }
  return out;
}

let SOURCES = null;
function behaviorBody(name) {
  if (!SOURCES) SOURCES = allSourceFiles(VIEWMODELS).map((f) => fs.readFileSync(f, 'utf8'));
  const re = new RegExp('export function ' + name + '\\s*' + '\\(');
  for (const src of SOURCES) {
    const m = re.exec(src);
    if (!m) continue;
    // Skip the PARAMETER list first. `function slidein(element, options = {})`
    // has a brace in its defaults, and matching from the first `{` closed the
    // body immediately -- every such behavior scraped as empty.
    let i = src.indexOf('(', m.index);
    if (i === -1) continue;
    let parens = 0;
    for (; i < src.length; i++) {
      if (src[i] === '(') parens++;
      else if (src[i] === ')') { parens--; if (parens === 0) { i++; break; } }
    }
    const open = src.indexOf('{', i);
    if (open === -1) continue;
    let depth = 0;
    for (let j = open; j < src.length; j++) {
      if (src[j] === '{') depth++;
      else if (src[j] === '}') { depth--; if (depth === 0) return src.slice(open + 1, j); }
    }
  }
  return null;
}

function sourceFacts(docName) {
  const body = behaviorBody(docName);
  if (!body) return null;
  const anim = /clickAnim\(\s*element\s*,\s*[`'"]([^`'"]+)[`'"]\s*,\s*[`'"]([^`'"]+)[`'"]/.exec(body);
  const attrs = [...new Set([...body.matchAll(/getAttribute\(\s*'([^']+)'/g)].map((m) => m[1]))];
  const events = [...new Set([...body.matchAll(/CustomEvent\(\s*'([^']+)'/g)].map((m) => m[1]))];
  const classes = [...new Set([...body.matchAll(/classList\.add\(\s*'([^']+)'/g)].map((m) => m[1]))];
  return { anim, attrs, events, classes };
}

/** semanticElement is { tagName, implicitRole } in every schema that has one. */
function semanticTag(schema) {
  const el = schema?.semanticElement;
  if (!el) return null;
  return typeof el === 'string' ? el : (el.tagName || null);
}

/**
 * #754: does `tag` already auto-inject the behavior `token` names? If so the
 * attribute must NOT appear in the usage block — `<figure x-figure>` is the
 * duplication autoInject exists to remove, and #746 showed the redundant form
 * can suppress the behavior outright. nativeMap is the authority; its keys are
 * selectors, so only bare-tag entries can be compared against a host tag.
 */
function autoInjects(tag, token) {
  return nativeMap[tag] === token.replace(/^x-/, '');
}

function usage(token, schema) {
  const fromCatalogue = examples[token]?.source;
  if (fromCatalogue) return fromCatalogue;
  const el = semanticTag(schema);
  if (el) {
    return autoInjects(el, token)
      ? `<${el}>\n  …\n</${el}>`
      : `<${el} ${token}>\n  …\n</${el}>`;
  }
  // A <div> auto-injects nothing, so the attribute is load-bearing here.
  return `<div ${token}>\n  …\n</div>`;
}

function buildDoc({ token, docName }) {
  const schema = schemaFor(docName);
  const title = schema?.title || docName.replace(/(^|-)(\w)/g, (_, s, c) => (s ? ' ' : '') + c.toUpperCase());
  const summary = schema?.description || `The \`${token}\` behavior.`;

  const out = [`# ${title}`, '', summary, ''];

  const tag = semanticTag(schema);
  if (tag) {
    out.push(`Applies to \`<${tag}>\`, and to any element carrying \`${token}\`.`, '');
  } else {
    out.push(`Apply \`${token}\` to any element.`, '');
  }

  out.push('## Usage', '', '```html', usage(token, schema), '```', '');

  const attrs = attributesTable(schema);
  if (attrs) out.push('## Attributes', '', attrs, '');

  // No schema -- say what the implementation actually does instead of nothing.
  const facts = schema ? null : sourceFacts(docName);
  if (facts) {
    if (facts.anim) {
      out.push(
        '## What it does',
        '',
        `On click, plays the \`${facts.anim[1].replace(/\$\{(\w+)\}/g, '<$1>')}\` animation for \`${facts.anim[2]}\` and removes it when it finishes.`,
        '',
      );
    }
    if (facts.classes.length) {
      out.push('## Classes applied', '', facts.classes.map((c) => `- \`${c}\``).join('\n'), '');
    }
    if (facts.attrs.length) {
      out.push(
        '## Attributes read',
        '',
        facts.attrs.map((a) => `- \`${a}\``).join('\n'),
        '',
        '<sub>Taken from the behavior source — these are the attribute names it actually reads.</sub>',
        '',
      );
    }
    if (facts.events.length) {
      out.push('## Events', '', facts.events.map((e) => `- \`${e}\``).join('\n'), '');
    }
  }

  const events = eventsList(schema);
  if (events) out.push('## Events', '', events, '');

  const methods = methodsList(schema);
  if (methods) out.push('## Methods', '', methods, '');

  if (schema?.accessibility) {
    const a = schema.accessibility;
    const lines = typeof a === 'string' ? [a] : Object.entries(a).map(([k, v]) => `- **${k}** — ${typeof v === 'string' ? v : JSON.stringify(v)}`);
    out.push('## Accessibility', '', lines.join('\n'), '');
  }

  out.push(
    '## Live example',
    '',
    `See \`${token}\` on the [Behaviors showcase](/?page=behaviors) — search for \`${token}\` to run it and copy its markup.`,
    '',
    '---',
    '',
    schema
      ? `<sub>Generated from \`src/wb-models/${docName}.schema.json\` by \`scripts/generate-behavior-docs.mjs\` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>`
      : `<sub>Stub generated by \`scripts/generate-behavior-docs.mjs\` (#713). There is no schema for \`${docName}\`, so this file has only what the registry knows. Worth writing by hand.</sub>`,
    '',
  );

  return out.join('\n');
}

const all = behaviors();
// A selector-shaped token (input[type="checkbox"]) has no legal filename, and
// the page never fetches a doc for one either -- it looks up the behavior name.
const FILENAME_SAFE = /^[a-z0-9][a-z0-9-]*$/i;
const skipped = all.filter(({ docName }) => !FILENAME_SAFE.test(docName));
const usable = all.filter(({ docName }) => FILENAME_SAFE.test(docName));
const missing = usable.filter(({ docName }) => !fs.existsSync(path.join(DOCS, `${docName}.md`)));
const noSchema = missing.filter(({ docName }) => !schemaFor(docName));

if (CHECK) {
  console.log(`[behavior-docs] ${usable.length - missing.length}/${usable.length} documented, ${missing.length} missing`);
  if (missing.length) console.log(missing.map((m) => `  ${m.token} -> docs/behaviors/${m.docName}.md`).join('\n'));
  process.exit(missing.length ? 1 : 0);
}

if (!fs.existsSync(DOCS)) fs.mkdirSync(DOCS, { recursive: true });
let written = 0;
for (const b of missing) {
  fs.writeFileSync(path.join(DOCS, `${b.docName}.md`), buildDoc(b), 'utf8');
  written++;
}

console.log(`[behavior-docs] wrote ${written} doc(s); ${usable.length - missing.length} already existed and were left alone.`);
if (skipped.length) {
  console.log(`[behavior-docs] skipped ${skipped.length} selector-shaped token(s) with no legal filename: ` +
    skipped.map((s2) => s2.docName).join(', '));
}
if (noSchema.length) {
  console.log(`[behavior-docs] ${noSchema.length} of those have NO schema, so they are thin and want a human:\n  ` +
    noSchema.map((m) => m.docName).join(', '));
}
