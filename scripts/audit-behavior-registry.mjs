#!/usr/bin/env node
/**
 * Behavior registry consistency audit.
 *
 * WHY THIS EXISTS
 *
 * A behavior is only usable if several separate files agree about it, and
 * they are edited independently:
 *
 *   src/core/tag-map.js            elementMap / nativeMap / extensionMap
 *                                  — selector -> behavior
 *   src/core/wb-lazy.js            WB_LAZY_ONLY_ELEMENTS / _ATTRIBUTES
 *                                  — MORE selector -> behavior, invisible to
 *                                    anything that reads only tag-map.js
 *   src/core/semantic-attributes.js SEMANTIC_PROPERTY_ATTRIBUTES
 *                                  — and MORE again: tooltip=, badge=, ripple
 *   src/wb-viewmodels/index.js     behaviorModules — behavior -> module file
 *   src/wb-models/*.schema.json    the declared model
 *   src/wb-viewmodels/**.js        the code that actually runs
 *
 * Nothing checks that they agree, so a behavior can be half-registered in
 * several different ways and each one fails differently:
 *
 *   - a module and a schema, no selector  -> ships, unreachable, invisible
 *   - a selector, no module entry         -> resolves, then fails to load
 *   - registered only in wb-lazy.js       -> works, but a grep of tag-map
 *                                            says it does not exist
 *
 * That last one is not hypothetical. Reviewing this repo by grepping
 * tag-map.js alone produced two wrong conclusions in a row — `pagination`,
 * `steps`, `breadcrumb` and `stat` reported as unreachable when all four are
 * registered in wb-lazy.js. wb-lazy.js's own comment says of extensionMap:
 * "wb.js's own single source of truth -- and had drifted".
 *
 * The goal is ONE registry. This audit is the evidence for getting there:
 * it prints exactly which behaviors are split across files, so the merge can
 * be done knowing what moves.
 *
 * WHY IT PARSES THE WAY IT DOES
 *
 * The maps are not imported. tag-map.js could be, but wb-lazy.js touches
 * browser globals at module scope and WB_LAZY_ONLY_ELEMENTS is not exported.
 * Regex over the source is what produced the wrong answers above, so instead
 * each object literal is located by name, brace-matched to its true end, and
 * evaluated as JavaScript. Comments, multi-line entries and mixed quoting all
 * parse correctly because the JS engine does the parsing.
 *
 * USAGE
 *
 *   node scripts/audit-behavior-registry.mjs
 *   node scripts/audit-behavior-registry.mjs --root <path>
 *   node scripts/audit-behavior-registry.mjs --json
 *   node scripts/audit-behavior-registry.mjs --gate    exit 1 on hard errors
 *
 * Without --gate it always exits 0: the split-registration findings are a
 * known state to be worked down, not a build failure.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const argv = process.argv.slice(2);
const rootFlag = argv.indexOf('--root');
// Defaults to the repo this script lives in; --root lets it be pointed at a
// checkout elsewhere (another worktree, a consuming site's node_modules copy).
const ROOT = rootFlag !== -1
  ? path.resolve(argv[rootFlag + 1])
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const asJson = argv.includes('--json');
const gating = argv.includes('--gate');

/* ── Reading the maps ─────────────────────────────────────────────────── */

/**
 * Pull a named object literal out of a source file and evaluate it.
 *
 * Brace-matched rather than regex-terminated: a regex stopping at the first
 * `\n}` truncates any map containing a nested object or a braced comment, and
 * silently returns a partial map — which reads exactly like "this behavior is
 * not registered".
 */
function readObjectLiteral(file, name) {
  const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const decl = new RegExp(`(?:export\\s+)?const\\s+${name}\\s*=\\s*\\{`).exec(src);
  if (!decl) return null;

  const start = decl.index + decl[0].length - 1;
  let depth = 0;
  let inString = null;
  let inLine = false;
  let inBlock = false;

  for (let i = start; i < src.length; i++) {
    const c = src[i];
    const next = src[i + 1];

    if (inLine) { if (c === '\n') inLine = false; continue; }
    if (inBlock) { if (c === '*' && next === '/') { inBlock = false; i++; } continue; }
    if (inString) {
      if (c === '\\') { i++; continue; }
      if (c === inString) inString = null;
      continue;
    }
    if (c === '/' && next === '/') { inLine = true; i++; continue; }
    if (c === '/' && next === '*') { inBlock = true; i++; continue; }
    if (c === '"' || c === "'" || c === '`') { inString = c; continue; }

    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) {
        const literal = src.slice(start, i + 1);
        return new Function(`return (${literal});`)();
      }
    }
  }
  return null;
}

/** Every place a selector can be bound to a behavior. */
const SELECTOR_SOURCES = [
  { file: 'src/core/tag-map.js', name: 'elementMap',              label: 'tag-map:element' },
  { file: 'src/core/tag-map.js', name: 'nativeMap',               label: 'tag-map:native' },
  { file: 'src/core/tag-map.js', name: 'extensionMap',            label: 'tag-map:extension' },
  { file: 'src/core/wb-lazy.js', name: 'WB_LAZY_ONLY_ELEMENTS',   label: 'wb-lazy:element' },
  { file: 'src/core/wb-lazy.js', name: 'WB_LAZY_ONLY_ATTRIBUTES', label: 'wb-lazy:attribute' },
  // A sixth source. wb-lazy.js folds semanticPropertyMappings into the same
  // selector list, so `tooltip=`, `badge=`, `ripple` and friends bind
  // behaviors without appearing in either of the two maps above. Omitting it
  // would give this audit the exact blind spot it exists to detect.
  { file: 'src/core/semantic-attributes.js', name: 'SEMANTIC_PROPERTY_ATTRIBUTES', label: 'semantic-attr' },
];

function collect() {
  const selectors = new Map();   // behavior -> [{ source, selector }]
  const missingMaps = [];

  for (const src of SELECTOR_SOURCES) {
    const map = readObjectLiteral(src.file, src.name);
    if (!map) { missingMaps.push(`${src.file} → ${src.name}`); continue; }
    for (const [selector, behavior] of Object.entries(map)) {
      if (typeof behavior !== 'string') continue;
      if (!selectors.has(behavior)) selectors.set(behavior, []);
      selectors.get(behavior).push({ source: src.label, selector });
    }
  }

  const behaviorModules = readObjectLiteral('src/wb-viewmodels/index.js', 'behaviorModules') || {};

  const schemas = new Set(
    fs.readdirSync(path.join(ROOT, 'src/wb-models'))
      .filter((f) => f.endsWith('.schema.json'))
      .map((f) => f.replace('.schema.json', '')),
  );

  const nativeMapRaw = readObjectLiteral('src/core/tag-map.js', 'nativeMap') || {};
  const attrIndex = {};
  for (const src of SELECTOR_SOURCES) {
    const map = readObjectLiteral(src.file, src.name);
    if (!map) continue;
    for (const [sel, beh] of Object.entries(map)) if (sel.startsWith('x-')) attrIndex[sel] = beh;
  }

  return { selectors, behaviorModules, schemas, missingMaps, nativeMapRaw, attrIndex };
}

/* ── The findings ─────────────────────────────────────────────────────── */

function audit() {
  const { selectors, behaviorModules, schemas, missingMaps, nativeMapRaw, attrIndex } = collect();

  const names = new Set([
    ...selectors.keys(),
    ...Object.keys(behaviorModules),
    ...schemas,
  ]);

  const rows = [];
  for (const name of [...names].sort()) {
    const bound = selectors.get(name) || [];
    rows.push({
      behavior: name,
      selectors: bound,
      sources: [...new Set(bound.map((b) => b.source))],
      inTagMap: bound.some((b) => b.source.startsWith('tag-map')),
      inWbLazy: bound.some((b) => b.source.startsWith('wb-lazy')),
      hasModule: Object.prototype.hasOwnProperty.call(behaviorModules, name),
      hasSchema: schemas.has(name),
    });
  }

  // #834 -- clause 1 of the naming rule: if a behavior is what a native
  // element becomes, the x- name must BE that element's tag and must reach
  // the same behavior. A mismatch here is the worst kind of naming bug: it
  // does not error, it silently applies a different component. x-article
  // reached the `article` behavior while <article> auto-injected `card`.
  //
  // Clause 2 -- behaviors with no corresponding element (x-ripple, x-tooltip)
  // are named for what they do and are deliberately not checked.
  const namingViolations = [];
  for (const [selector, behavior] of Object.entries(nativeMapRaw)) {
    // On a type-qualified selector the semantic identity is the type:
    // input[type="checkbox"] is a checkbox, so the attribute is x-checkbox.
    const typed = /\[type=["']([a-z]+)["']\]/.exec(selector);
    const tag = typed ? typed[1] : selector.replace(/\[.*\]$/, '');
    const attr = `x-${tag}`;
    const reaches = attrIndex[attr];
    if (reaches !== behavior) namingViolations.push({ selector, behavior, attr, reaches: reaches || null });
  }

  const findings = {
    naming: namingViolations,
    // Hard errors — something is genuinely broken.
    unreachable: rows.filter((r) => !r.selectors.length && (r.hasModule || r.hasSchema)),
    noModule:    rows.filter((r) => r.selectors.length && !r.hasModule),

    // Split-brain — works today, but only because two files happen to agree.
    splitRegistration: rows.filter((r) => r.inTagMap && r.inWbLazy),
    lazyOnly:          rows.filter((r) => r.inWbLazy && !r.inTagMap),

    // Informational.
    schemaNoSelector: rows.filter((r) => r.hasSchema && !r.selectors.length),
    selectorNoSchema: rows.filter((r) => r.selectors.length && !r.hasSchema),
  };

  return { rows, findings, missingMaps };
}

/* ── Report ───────────────────────────────────────────────────────────── */

function line(r) {
  const where = r.selectors.map((s) => `${s.selector} (${s.source})`).join(', ');
  return `  ${r.behavior.padEnd(18)} ${where || '—'}`;
}

function report(result) {
  const { rows, findings, missingMaps } = result;
  const out = [];

  out.push(`behavior registry audit — ${rows.length} behavior names across ${SELECTOR_SOURCES.length} selector maps\n`);

  if (missingMaps.length) {
    out.push('COULD NOT READ (a map was renamed or moved — this audit is now blind to it):');
    missingMaps.forEach((m) => out.push(`  ${m}`));
    out.push('');
  }

  if (findings.naming?.length) {
    out.push(`NAMING (#834) — ${findings.naming.length} native tag(s) whose x- name does not reach the same behavior.`);
    out.push("  An x- name matching an element MUST apply that element's behavior. Anything else");
    out.push('  hands back a different component with no error.');
    findings.naming.forEach((n) => out.push(
      `    <${n.selector}> -> ${n.behavior}   but ${n.attr} -> ${n.reaches || 'NOT REGISTERED'}`,
    ));
    out.push('');
  }

  if (findings.unreachable.length) {
    out.push(`UNREACHABLE — ${findings.unreachable.length} behavior(s) ship with a module and/or schema but no selector.`);
    out.push('  Nothing in markup can trigger these. They load, cost bytes, and a test written');
    out.push('  against them fails in a way that reads as a product bug.');
    findings.unreachable.forEach((r) => out.push(
      `    ${r.behavior.padEnd(18)} module:${r.hasModule ? 'yes' : 'no '}  schema:${r.hasSchema ? 'yes' : 'no'}`,
    ));
    out.push('');
  }

  if (findings.noModule.length) {
    out.push(`DANGLING SELECTOR — ${findings.noModule.length} selector(s) point at a behavior with no entry in behaviorModules.`);
    out.push('  These resolve at scan time and then fail to load.');
    findings.noModule.forEach((r) => out.push(line(r)));
    out.push('');
  }

  if (findings.splitRegistration.length) {
    out.push(`SPLIT REGISTRATION — ${findings.splitRegistration.length} behavior(s) are registered in BOTH tag-map.js and wb-lazy.js.`);
    out.push('  Works today; drifts tomorrow. Two files must be kept in agreement by hand,');
    out.push('  and wb-lazy.js already records that this drifted once before.');
    findings.splitRegistration.forEach((r) => out.push(line(r)));
    out.push('');
  }

  if (findings.lazyOnly.length) {
    out.push(`LAZY-ONLY — ${findings.lazyOnly.length} behavior(s) are registered ONLY in wb-lazy.js.`);
    out.push('  They work, but tag-map.js is where a reader looks, so grepping it reports');
    out.push('  them as missing. This is the single biggest source of wrong answers about');
    out.push('  this codebase — the reason this audit exists.');
    findings.lazyOnly.forEach((r) => out.push(line(r)));
    out.push('');
  }

  if (findings.schemaNoSelector.length) {
    out.push(`SCHEMA, NO SELECTOR — ${findings.schemaNoSelector.length}: a declared model nothing can instantiate.`);
    out.push('  ' + findings.schemaNoSelector.map((r) => r.behavior).join(', '));
    out.push('');
  }

  if (findings.selectorNoSchema.length) {
    out.push(`REACHABLE, NO SCHEMA — ${findings.selectorNoSchema.length}: usable but undeclared,`);
    out.push('  so no validation, no intellisense, no permutation tests.');
    out.push('  ' + findings.selectorNoSchema.map((r) => r.behavior).join(', '));
    out.push('');
  }

  const hard = findings.unreachable.length + findings.noModule.length;
  const split = findings.splitRegistration.length + findings.lazyOnly.length;
  out.push('─'.repeat(72));
  out.push(`  ${hard} hard error(s)   ${split} behavior(s) affected by the split registry`);
  if (split) {
    out.push('');
    out.push('  The split is the root cause, not a symptom. One registry means these');
    out.push('  numbers become impossible rather than merely absent.');
  }

  return out.join('\n');
}

const result = audit();

if (asJson) {
  console.log(JSON.stringify({
    counts: Object.fromEntries(Object.entries(result.findings).map(([k, v]) => [k, v.length])),
    findings: Object.fromEntries(Object.entries(result.findings).map(([k, v]) => [k, v.map((r) => r.behavior)])),
    missingMaps: result.missingMaps,
  }, null, 2));
} else {
  console.log(report(result));
}

if (gating) {
  const hard = result.findings.unreachable.length
    + result.findings.noModule.length
    + result.findings.naming.length
    + result.missingMaps.length;
  process.exit(hard > 0 ? 1 : 0);
}
