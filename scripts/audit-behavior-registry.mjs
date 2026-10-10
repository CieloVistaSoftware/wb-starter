#!/usr/bin/env node
/**
 * Behavior registry consistency audit.
 *
 * WHY THIS EXISTS
 *
 * A behavior is only usable if several separate files agree about it:
 *
 *   src/core/tag-map.js            THE selector registry (#831):
 *                                  elementMap / nativeMap / extensionMap
 *                                  / propertyMap / legacyLazyMap, and
 *                                  BEHAVIOR_ALIASES for renamed x- names
 *   src/wb-viewmodels/index.js     behaviorModules — behavior -> module file
 *   src/wb-models/*.schema.json    the declared model
 *   src/wb-viewmodels/**.js        the code that actually runs
 *
 * Nothing else checks that they agree, so a behavior can be half-registered in
 * several different ways and each one fails differently:
 *
 *   - a module and a schema, no selector  -> ships, unreachable, invisible
 *   - a selector, no module entry         -> resolves, then fails to load
 *   - a selector table outside tag-map.js -> works, but a read of tag-map.js
 *                                            says it does not exist
 *
 * That last one is not hypothetical. Until #831 there were six selector maps
 * in three files: wb-lazy.js kept WB_LAZY_ONLY_ELEMENTS and
 * WB_LAZY_ONLY_ATTRIBUTES, and semantic-attributes.js kept
 * SEMANTIC_PROPERTY_ATTRIBUTES. Reviewing this repo by grepping tag-map.js
 * alone produced two wrong conclusions in a row — `pagination`, `steps`,
 * `breadcrumb` and `stat` reported as unreachable when all four were
 * registered in wb-lazy.js. Those maps now live in tag-map.js, and this audit
 * reports a STRAY TABLE if a selector -> behavior entry appears anywhere else
 * under src/, so the split cannot quietly come back.
 *
 * WHY IT PARSES THE WAY IT DOES
 *
 * The maps are not imported, so --root can point at a checkout without its
 * dependencies, and index.js touches browser globals at module scope.
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
 *   node scripts/audit-behavior-registry.mjs --gate    exit 1 on anything not in REVIEWED
 *
 * Without --gate it always exits 0. With it, it exits 1 on any finding that
 * is not in the REVIEWED list below, on a REVIEWED entry that is no longer a
 * finding, and on a source it could not read.
 * tests/compliance/behavior-registry-audit-gate.spec.ts runs it in CI (#831).
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
  return readLiteral(file, name);
}

/**
 * Same, for any literal: `{...}`, `[...]`, and either one wrapped as
 * `Object.freeze({...})` or `new Set([...])`. The wrapper is skipped and the
 * literal inside is evaluated; a Set comes back as its array.
 */
function readLiteral(file, name) {
  const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const decl = new RegExp(`(?:export\\s+)?const\\s+${name}\\s*=\\s*(?:Object\\.freeze\\(\\s*|new\\s+Set\\(\\s*)?([\\[{])`).exec(src);
  if (!decl) return null;

  const open = decl[1];
  const close = open === '{' ? '}' : ']';
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

    if (c === open) depth++;
    else if (c === close) {
      depth--;
      if (depth === 0) {
        const literal = src.slice(start, i + 1);
        return new Function(`return (${literal});`)();
      }
    }
  }
  return null;
}

/** Every place a selector can be bound to a behavior: all in tag-map.js (#831). */
const REGISTRY = 'src/core/tag-map.js';
const SELECTOR_SOURCES = [
  { file: REGISTRY, name: 'elementMap',    label: 'tag-map:element' },
  { file: REGISTRY, name: 'nativeMap',     label: 'tag-map:native' },
  { file: REGISTRY, name: 'extensionMap',  label: 'tag-map:extension' },
  // Plain property attributes: `tooltip=`, `badge=`, `ripple`, `toast-message=`.
  { file: REGISTRY, name: 'propertyMap',   label: 'tag-map:property' },
  // [data-tooltip], which only wb-lazy.js applies.
  { file: REGISTRY, name: 'legacyLazyMap', label: 'tag-map:legacy-lazy' },
];

/*
 * ROUTES COMPUTED FROM THE REGISTRY (#1642)
 *
 * wb-lazy.js no longer needs a table entry for an x-{name} attribute.
 * unroutedBehaviorAttributes() gives `[x-{name}]` to every name in
 * index.js's behaviorModules that no table above routes, except the
 * DIRECTIVES (x-behavior, x-ignore, ...) and move()'s four direction helpers,
 * which x-move wires on its own buttons. wb.js has always done the same from
 * Object.keys(behaviors). A renamed behavior's old name is routed too
 * (BEHAVIOR_ALIASES, #668).
 *
 * Before this was modelled the audit reported 60 UNREACHABLE behaviors. 45
 * of them are reached only by this route and answer `<div x-NAME>` with
 * x-ready on both engines (tests/regression/
 * registry-audit-computed-route-injects.spec.ts); four more are move()'s
 * parent-wired buttons, and drawer-layout runs as drawerLayout through
 * x-drawer-layout. Seven were schemas that say they are not behaviors.
 * The model is re-derived
 * here from the same inputs the runtime uses, and the audit refuses to run
 * blind if the runtime stops computing the route: see ROUTE_MARKERS.
 */
const ROUTE_INPUTS = {
  directives:  { file: 'src/core/replacement-guard.js', name: 'DIRECTIVES' },
  parentWired: { file: 'src/core/wb-lazy.js',           name: 'PARENT_WIRED_BEHAVIORS' },
  aliases:     { file: REGISTRY,                        name: 'BEHAVIOR_ALIASES' },
};
// Text that must still be in wb-lazy.js for the computed route to exist. If
// either goes, every behavior below loses its only selector, so the audit
// reports the model as unreadable instead of quietly calling them reachable.
const ROUTE_MARKERS = ['function unroutedBehaviorAttributes()', '...unroutedBehaviorAttributes(),'];

/*
 * REVIEWED DISAGREEMENTS
 *
 * Every finding the gate knows about and has a reason to keep for now. The
 * gate fails on a finding that is not here, and on an entry here that is no
 * longer a finding (it was fixed: delete the line so it cannot come back
 * unnoticed). Adding a line is a decision, so it needs a reason a reviewer
 * can check.
 */
const REVIEWED = {
  naming: {
    'x-article': '9f85773ce removed x-article on purpose (John: "an article is a card in this system"). '
      + 'x-card is the attribute form; an unregistered x-article is reported by the unknown-attribute check '
      + 'instead of silently applying a different behavior, the failure #834 was about.',
  },
  unreachable: {},
  strayTable: {},
};

// Schemas that schema.schema.json's own _schemaTypes say are not behaviors.
const NON_BEHAVIOR_SCHEMA_TYPES = new Set(['base', 'definition', 'page']);

function collect() {
  const selectors = new Map();   // behavior -> [{ source, selector }]
  const missingMaps = [];
  const maps = {};

  const bind = (behavior, source, selector) => {
    if (!selectors.has(behavior)) selectors.set(behavior, []);
    selectors.get(behavior).push({ source, selector });
  };

  for (const src of SELECTOR_SOURCES) {
    const map = readObjectLiteral(src.file, src.name);
    if (!map) { missingMaps.push(`${src.file} → ${src.name}`); continue; }
    maps[src.name] = map;
    for (const [selector, behavior] of Object.entries(map)) {
      if (typeof behavior !== 'string') continue;
      bind(behavior, src.label, selector);
    }
  }

  const behaviorModules = readObjectLiteral('src/wb-viewmodels/index.js', 'behaviorModules') || {};

  // The seventh source, modelled on unroutedBehaviorAttributes().
  const input = {};
  for (const [key, { file, name }] of Object.entries(ROUTE_INPUTS)) {
    input[key] = readLiteral(file, name);
    if (!input[key]) missingMaps.push(`${file} → ${name}`);
  }
  const lazySrc = fs.readFileSync(path.join(ROOT, 'src/core/wb-lazy.js'), 'utf8');
  const routeIntact = ROUTE_MARKERS.every((m) => lazySrc.includes(m));
  if (!routeIntact) missingMaps.push('src/core/wb-lazy.js → unroutedBehaviorAttributes() (the computed x-{name} route)');

  const computed = [];
  if (routeIntact && input.directives && input.parentWired && input.aliases) {
    const directives = new Set(input.directives);
    const parentWired = new Set(input.parentWired);
    const routed = new Set([
      ...Object.keys(maps.extensionMap || {}),
      ...Object.keys(input.aliases).map((old) => `x-${old}`),
    ]);
    // index.js registers each alias's old name too, so listBehaviors() has it.
    const registered = [...Object.keys(behaviorModules), ...Object.keys(input.aliases)];
    for (const [old, now] of Object.entries(input.aliases)) bind(now, 'alias', `x-${old}`);
    const exportAliases = readObjectLiteral('src/wb-viewmodels/index.js', 'exportAliases') || {};
    const fnOf = (name) => `${behaviorModules[name]}#${exportAliases[name] || name}`;
    const routedTo = maps.extensionMap || {};
    for (const name of registered) {
      // x-NAME is routed, but to a different registry key. When both keys load
      // the same export of the same module (drawer-layout and drawerLayout),
      // x-NAME runs this behavior's code under the other name: reachable.
      const other = routedTo[`x-${name}`];
      if (other && other !== name && behaviorModules[name] && fnOf(name) === fnOf(other)) {
        bind(name, 'same-function', `x-${name} (runs as ${other})`);
        continue;
      }
      if (routed.has(`x-${name}`) || directives.has(name)) continue;
      if (parentWired.has(name)) {
        if (behaviorModules.move) bind(name, 'parent-wired', `x-${name} inside x-move`);
        continue;
      }
      bind(name, 'computed', `x-${name}`);
      computed.push(name);
    }
  }

  const schemas = new Set();
  const notBehaviors = [];
  for (const f of fs.readdirSync(path.join(ROOT, 'src/wb-models')).filter((x) => x.endsWith('.schema.json'))) {
    const name = f.replace('.schema.json', '');
    let schema = {};
    try { schema = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/wb-models', f), 'utf8')); } catch { /* every-schema-parses owns that */ }
    const kind = schema.isBase ? 'base' : schema.schemaType;
    if (NON_BEHAVIOR_SCHEMA_TYPES.has(kind)) notBehaviors.push({ name, kind });
    else schemas.add(name);
  }

  const attrIndex = {};
  for (const [beh, bound] of selectors) {
    for (const { selector } of bound) if (selector.startsWith('x-') && !selector.includes(' ')) attrIndex[selector] = beh;
  }

  const aliasTargets = new Set(Object.values(input.aliases || {}));
  const strays = findStrayTables(new Set([...Object.keys(behaviorModules), ...aliasTargets]));

  return {
    selectors, behaviorModules, schemas, notBehaviors, missingMaps, computed, strays,
    nativeMapRaw: maps.nativeMap || {}, attrIndex,
  };
}

/*
 * STRAY TABLES
 *
 * One registry is only one while nothing else binds a selector. WB_LAZY_ONLY_*
 * and SEMANTIC_PROPERTY_ATTRIBUTES were each "a few entries the other file
 * doesn't cover" when they started. This walks every .js file under src/
 * except tag-map.js and reports two shapes of binding:
 *
 *   'x-name': 'behavior'          an object-literal row (also '[selector]': ...)
 *   { selector: '...', behavior: 'behavior' }   a hard-coded mapping
 *
 * Only rows whose value is a behavior that loads count, so a table of class
 * names or CSS files is not mistaken for a registry.
 */
const ROW = /^\s*(['"])(x-[a-z0-9-]+|\[[^\]]+\])\1\s*:\s*(['"])([A-Za-z][\w-]*)\3/;
const HARDCODED = /selector:\s*(['"`])([^'"`]+)\1\s*,\s*behavior:\s*(['"])([\w-]+)\3/g;

function findStrayTables(behaviorNames) {
  const found = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { walk(full); continue; }
      if (!entry.name.endsWith('.js')) continue;
      const rel = path.relative(ROOT, full).replace(/\\/g, '/');
      if (rel === REGISTRY) continue;
      fs.readFileSync(full, 'utf8').split('\n').forEach((text, i) => {
        const row = ROW.exec(text);
        if (row && behaviorNames.has(row[4])) found.push({ file: rel, line: i + 1, selector: row[2], behavior: row[4] });
        for (const m of text.matchAll(HARDCODED)) {
          if (behaviorNames.has(m[4])) found.push({ file: rel, line: i + 1, selector: m[2], behavior: m[4] });
        }
      });
    }
  };
  walk(path.join(ROOT, 'src'));
  return found;
}

/* ── The findings ─────────────────────────────────────────────────────── */

function audit() {
  const {
    selectors, behaviorModules, schemas, notBehaviors, missingMaps, computed, strays,
    nativeMapRaw, attrIndex,
  } = collect();

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
      computedOnly: bound.length > 0 && bound.every((b) => b.source === 'computed'),
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

    // A second registry — a selector bound outside tag-map.js (#831).
    strayTable: strays,

    // Informational.
    schemaNoSelector: rows.filter((r) => r.hasSchema && !r.selectors.length),
    selectorNoSchema: rows.filter((r) => r.selectors.length && !r.hasSchema),
  };

  // The gate's view: which findings are reviewed, which are new, which
  // reviewed entries no longer occur.
  const keyOf = (category, f) => {
    if (category === 'naming') return f.attr;
    if (category === 'strayTable') return `${f.file}: ${f.selector}`;
    return f.behavior;
  };
  const unreviewed = [];
  const stale = [];
  for (const category of Object.keys(REVIEWED).concat('noModule')) {
    const found = new Set((findings[category] || []).map((f) => keyOf(category, f)));
    const allowed = REVIEWED[category] || {};
    for (const key of found) if (!Object.prototype.hasOwnProperty.call(allowed, key)) unreviewed.push({ category, key });
    for (const key of Object.keys(allowed)) if (!found.has(key)) stale.push({ category, key });
  }

  return { rows, findings, missingMaps, computed, notBehaviors, unreviewed, stale, keyOf };
}

/* ── Report ───────────────────────────────────────────────────────────── */

function line(r) {
  const where = r.selectors.map((s) => `${s.selector} (${s.source})`).join(', ');
  return `  ${r.behavior.padEnd(18)} ${where || '—'}`;
}

function report(result) {
  const { rows, findings, missingMaps, computed, notBehaviors, unreviewed, stale, keyOf } = result;
  const out = [];
  const tag = (category, f) => (Object.prototype.hasOwnProperty.call(REVIEWED[category] || {}, keyOf(category, f)) ? '' : '   <- NOT REVIEWED');

  out.push(`behavior registry audit — ${rows.length} behavior names across ${SELECTOR_SOURCES.length} selector maps`
    + ` in ${REGISTRY} + its aliases + the computed x-{name} route\n`);

  if (missingMaps.length) {
    out.push('COULD NOT READ (a map was renamed or moved — this audit is now blind to it):');
    missingMaps.forEach((m) => out.push(`  ${m}`));
    out.push('');
  }

  const computedOnly = rows.filter((r) => r.computedOnly).map((r) => r.behavior);
  out.push(`COMPUTED ROUTE (#1642) — ${computedOnly.length} behavior(s) reachable as [x-NAME] only because`);
  out.push('  wb-lazy.js computes the selector from index.js. No table lists them; this is not a finding.');
  out.push(`  (${computed.length} names get the computed selector in all; the rest are also bound elsewhere.)`);
  out.push('  ' + computedOnly.join(', '));
  out.push('');

  if (findings.naming?.length) {
    out.push(`NAMING (#834) — ${findings.naming.length} native tag(s) whose x- name does not reach the same behavior.`);
    out.push("  An x- name matching an element MUST apply that element's behavior. Anything else");
    out.push('  hands back a different component with no error.');
    findings.naming.forEach((n) => out.push(
      `    <${n.selector}> -> ${n.behavior}   but ${n.attr} -> ${n.reaches || 'NOT REGISTERED'}${tag('naming', n)}`,
    ));
    out.push('');
  }

  if (findings.unreachable.length) {
    out.push(`UNREACHABLE — ${findings.unreachable.length} behavior(s) ship with a module and/or schema but no selector.`);
    out.push('  Nothing in markup can trigger these, including the computed x-{name} route.');
    findings.unreachable.forEach((r) => out.push(
      `    ${r.behavior.padEnd(18)} module:${r.hasModule ? 'yes' : 'no '}  schema:${r.hasSchema ? 'yes' : 'no'}${tag('unreachable', r)}`,
    ));
    out.push('');
  }

  if (findings.noModule.length) {
    out.push(`DANGLING SELECTOR — ${findings.noModule.length} selector(s) point at a behavior with no entry in behaviorModules.`);
    out.push('  These resolve at scan time and then fail to load.');
    findings.noModule.forEach((r) => out.push(line(r) + tag('noModule', r)));
    out.push('');
  }

  if (findings.strayTable.length) {
    out.push(`STRAY TABLE — ${findings.strayTable.length} selector(s) bound to a behavior outside ${REGISTRY}.`);
    out.push('  A second registry: it works, and a read of tag-map.js says it does not exist.');
    out.push(`  Move each one into ${REGISTRY}.`);
    findings.strayTable.forEach((f) => out.push(
      `    ${f.file}:${f.line}  ${f.selector} -> ${f.behavior}${tag('strayTable', f)}`,
    ));
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

  if (notBehaviors.length) {
    out.push(`NOT A BEHAVIOR — ${notBehaviors.length} schema(s) whose schemaType says so (base / definition / page),`);
    out.push('  so they are not expected to have a selector.');
    out.push('  ' + notBehaviors.map((n) => `${n.name} (${n.kind})`).join(', '));
    out.push('');
  }

  const hard = findings.unreachable.length + findings.noModule.length + findings.strayTable.length;
  out.push('─'.repeat(72));
  out.push(`  ${hard} hard error(s)   ${findings.strayTable.length} selector(s) bound outside ${REGISTRY}`);
  out.push(`  ${unreviewed.length} finding(s) not in REVIEWED   ${stale.length} REVIEWED entr${stale.length === 1 ? 'y' : 'ies'} no longer found`);
  unreviewed.forEach((u) => out.push(`    NEW    ${u.category}: ${u.key} — fix it, or add it to REVIEWED with a reason`));
  stale.forEach((s) => out.push(`    FIXED  ${s.category}: ${s.key} — delete its REVIEWED entry`));

  return out.join('\n');
}

const result = audit();

if (asJson) {
  console.log(JSON.stringify({
    counts: Object.fromEntries(Object.entries(result.findings).map(([k, v]) => [k, v.length])),
    findings: Object.fromEntries(Object.entries(result.findings).map(([k, v]) => [k, v.map((f) => result.keyOf(k, f))])),
    computedOnly: result.rows.filter((r) => r.computedOnly).map((r) => r.behavior),
    notBehaviors: result.notBehaviors,
    unreviewed: result.unreviewed,
    stale: result.stale,
    missingMaps: result.missingMaps,
  }, null, 2));
} else {
  console.log(report(result));
}

// --gate: fail on anything not reviewed, on a reviewed entry that has been
// fixed (so the list only ever shrinks), and on a source it could not read.
if (gating) {
  const failures = result.unreviewed.length + result.stale.length + result.missingMaps.length;
  process.exit(failures > 0 ? 1 : 0);
}
