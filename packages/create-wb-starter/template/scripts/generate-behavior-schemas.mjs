/**
 * generate-behavior-schemas.mjs (#716)
 *
 * 49 behaviors have no src/wb-models/<name>.schema.json, so their docs (#713)
 * have no attribute table and the showcase has nothing to read their options
 * from. This writes a schema for each, derived from the behavior's OWN source:
 *
 *   element.getAttribute('speed')        -> property `speed`   (string)
 *   element.getAttribute('x') || 'left'  -> default "left"
 *   element.hasAttribute('loop')         -> property `loop`    (boolean, false)
 *   dispatchEvent(new CustomEvent('wb:x:done'))  -> events
 *   clickAnim(element, 'fade-in', '0.5s')        -> description
 *
 * Nothing is declared that the implementation does not read — that is the #669
 * failure mode (45+ schema properties no behavior ever looked at), and it is
 * worse than having no schema at all, because the showcase and IntelliSense
 * advertise options that do nothing.
 *
 * NEVER overwrites an existing schema.
 *
 * Usage:
 *   node scripts/generate-behavior-schemas.mjs           # write missing schemas
 *   node scripts/generate-behavior-schemas.mjs --check   # report only
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { extensionMap, nativeMap } from '../src/core/tag-map.js';
import { WB_LAZY_ONLY_ATTRIBUTES } from '../src/core/wb-lazy.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const MODELS = path.join(ROOT, 'src', 'wb-models');
const VIEWMODELS = path.join(ROOT, 'src', 'wb-viewmodels');
const CHECK = process.argv.includes('--check');

const MERGED = { ...(WB_LAZY_ONLY_ATTRIBUTES || {}), ...extensionMap };
const FILENAME_SAFE = /^[a-z0-9][a-z0-9-]*$/i;

/** Attributes every element has — never a behavior's own option. */
const NOT_OPTIONS = new Set([
  'id', 'class', 'style', 'title', 'href', 'src', 'type', 'name', 'value',
  'aria-label', 'aria-hidden', 'role', 'data-theme',
]);

function sourceFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) sourceFiles(full, out);
    else if (entry.name.endsWith('.js')) out.push(full);
  }
  return out;
}

let INDEX = null;
/**
 * lowercased function name -> body, for every `export function` AND
 * `export default function` in src/wb-viewmodels. Matching on the exact name
 * missed four: control and repeater are DEFAULT exports, copybutton is exported
 * as `copyButton` (index.js aliases it), and a plain-name search cannot see
 * either shape.
 */
function buildIndex() {
  INDEX = new Map();
  for (const file of sourceFiles(VIEWMODELS)) {
    const src = fs.readFileSync(file, 'utf8');
    const re = /export (?:default )?function ([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/g;
    let m;
    while ((m = re.exec(src))) {
      const body = bodyAfter(src, m.index);
      if (body && !INDEX.has(m[1].toLowerCase())) INDEX.set(m[1].toLowerCase(), body);
    }
  }
}

/** The function body that starts at `from`, skipping the parameter list. */
function bodyAfter(src, from) {
  let i = src.indexOf('(', from);
  if (i === -1) return null;
  let parens = 0;
  for (; i < src.length; i++) {
    if (src[i] === '(') parens++;
    else if (src[i] === ')') { parens--; if (parens === 0) { i++; break; } }
  }
  const open = src.indexOf('{', i);
  if (open === -1) return null;
  let depth = 0;
  for (let j = open; j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}') { depth--; if (depth === 0) return src.slice(open + 1, j); }
  }
  return null;
}

// A few registry names differ from the function that implements them.
// src/wb-viewmodels/index.js:37 maps `image: 'img'` -- x-image is the img()
// behavior under another name, so its schema comes from the same source.
const IMPLEMENTED_BY = { image: 'img' };

function behaviorBody(name) {
  if (!INDEX) buildIndex();
  const key = (IMPLEMENTED_BY[name] || name).toLowerCase();
  return INDEX.get(key) || null;
}

/** camel or kebab as authored -> the kebab-case attribute (§31). */
const kebab = (n) => n.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());

function analyse(name) {
  const body = behaviorBody(name);
  if (!body) return null;

  const properties = {};

  // `getAttribute('speed') || '40'`  /  `?? 'left'` -> a default we can state.
  for (const m of body.matchAll(/getAttribute\(\s*'([^']+)'\s*\)\s*(?:\|\||\?\?)\s*'([^']*)'/g)) {
    const attr = kebab(m[1]);
    if (NOT_OPTIONS.has(attr)) continue;
    properties[attr] = { type: 'string', description: `Read by ${name}().`, default: m[2] };
  }
  // Any other getAttribute -> a string option with no stated default.
  for (const m of body.matchAll(/getAttribute\(\s*'([^']+)'/g)) {
    const attr = kebab(m[1]);
    if (NOT_OPTIONS.has(attr) || properties[attr]) continue;
    properties[attr] = { type: 'string', description: `Read by ${name}().` };
  }
  // hasAttribute -> a bare boolean (§20).
  for (const m of body.matchAll(/hasAttribute\(\s*'([^']+)'/g)) {
    const attr = kebab(m[1]);
    if (NOT_OPTIONS.has(attr)) continue;
    properties[attr] = { type: 'boolean', description: `Read by ${name}(). Bare attribute.`, default: false };
  }

  const events = [...new Set([...body.matchAll(/CustomEvent\(\s*'([^']+)'/g)].map((m) => m[1]))];
  const anim = /clickAnim\(\s*element\s*,\s*[`'"]([^`'"]+)[`'"]\s*,\s*[`'"]([^`'"]+)[`'"]/.exec(body);

  return { properties, events, anim };
}

function buildSchema(name, token, facts) {
  const title = name.replace(/(^|-)(\w)/g, (_, s, c) => (s ? ' ' : '') + c.toUpperCase());
  const description = facts.anim
    ? `On click, plays the ${facts.anim[1].replace(/\$\{(\w+)\}/g, '<$1>')} animation for ${facts.anim[2]}.`
    : `Behavior applied with ${token}.`;

  const schema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $id: `${name}.schema.json`,
    title,
    description,
    schemaFor: token,
    properties: facts.properties,
  };
  if (facts.events.length) {
    schema.events = Object.fromEntries(facts.events.map((e) => [e, `Fired by ${name}().`]));
  }
  schema._metadata = {
    generatedBy: 'scripts/generate-behavior-schemas.mjs (#716)',
    derivedFrom: 'the behavior implementation — every property here is one the code actually reads',
    note: 'Expand by hand: enums, richer descriptions and accessibility notes cannot be read from source.',
  };
  return schema;
}

const tokens = [...new Set([
  ...Object.keys(MERGED).filter((a) => !a.startsWith('x-as-')),
  ...Object.keys(nativeMap).map((t) => 'x-' + t),
])].sort();

const missing = [];
for (const token of tokens) {
  const name = MERGED[token] || token.replace(/^x-/, '');
  if (!FILENAME_SAFE.test(name)) continue;
  if (fs.existsSync(path.join(MODELS, `${name}.schema.json`))) continue;
  missing.push({ token, name });
}

let written = 0;
const unscrapeable = [];
for (const { token, name } of missing) {
  const facts = analyse(name);
  if (!facts) { unscrapeable.push(name); continue; }
  if (CHECK) continue;
  const schema = buildSchema(name, token, facts);
  fs.writeFileSync(path.join(MODELS, `${name}.schema.json`), JSON.stringify(schema, null, 2) + '\n', 'utf8');
  written++;
}

if (CHECK) {
  console.log(`[behavior-schemas] ${missing.length} behavior(s) have no schema; ${missing.length - unscrapeable.length} can be derived from source.`);
} else {
  console.log(`[behavior-schemas] wrote ${written} schema(s).`);
}
if (unscrapeable.length) {
  console.log(`[behavior-schemas] no exported implementation found for: ${unscrapeable.join(', ')} — these need a hand-written schema.`);
}
