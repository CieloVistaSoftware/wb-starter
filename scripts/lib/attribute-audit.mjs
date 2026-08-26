/**
 * THE attribute audit. One engine, one record per behavior.
 *
 * John: "we need only one official attribute audit per beh. all of our
 * controls must comply."
 *
 * There were three separate scanners answering overlapping questions about the
 * same 654 attributes, which is how the drift they were measuring got there in
 * the first place. This is the single source of truth. Everything that wants to
 * know about a behavior's attributes -- the CLI report, the compliance gate,
 * the docs generator -- calls auditAll() and reads the record. Nothing grows
 * its own copy.
 *
 * THE CONTRACT a behavior must satisfy
 *
 *   R1 AUTHORABLE  the declared key must map to exactly one attribute an author
 *                  can type. camelCase is CORRECT here and not a defect:
 *                  schema-builder's extractData() (schema-builder.js:235)
 *                  camelCases every hyphenated attribute, so `full-width` in
 *                  markup arrives as data.fullWidth and matches a `fullWidth`
 *                  property. The docs generator and the #861 probe both
 *                  kebab-case for the same reason. What R1 rejects is a key
 *                  that is NEITHER form -- one no author can reach at all.
 *   R2 SINGULAR    one concept, one declared name. No bare/`data-` pair and no
 *                  second spelling of the same word in the same behavior
 *                  (`label-position` AND `labelPosition` is the live example).
 *   R3 CONSUMED    every declared attribute is actually used, by ONE of the
 *                  three real paths -- the behavior's own source reading an
 *                  attribute literal, the schema's own $view/$methods
 *                  interpolating the data key, or wb.js's generic modifier
 *                  path for enum/boolean props. Missing all three means the
 *                  attribute is documented and inert. (#861)
 *   R4 DECLARED    every attribute the behavior reads is declared, so the docs
 *                  and the showcase can see it.
 *
 * A violation names the rule, so a failure says what to do rather than only
 * what is wrong.
 */
import fs from 'node:fs';
import path from 'node:path';
import { aliasesFor } from '../../src/core/attribute-aliases.js';

const MODELS = 'src/wb-models';
const VM = 'src/wb-viewmodels';

/** HTML attribute names are lowercased by the parser. */
export const LEGAL_ATTR = /^[a-z][a-z0-9-]*$/;
/** The data-key spelling extractData() produces from a hyphenated attribute. */
export const CAMEL_ATTR = /^[a-z][a-zA-Z0-9]*$/;

/** Property keys that are schema plumbing or a sibling behavior token. */
const isMetaProp = (p) => /^[$_]/.test(p) || /^x-/.test(p);

/** Not an attribute schema at all. */
const isNonBehavior = (s) => s?.schemaType === 'definition' || s?.schemaType === 'page' || s?.isBase === true;

export const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
export const squash = (s) => s.toLowerCase();
/** Strip data-, collapse separators: the identity of the CONCEPT. */
export const conceptOf = (s) => s.toLowerCase().replace(/^data-/, '').replace(/[-_]/g, '');

/**
 * Attributes a behavior file reads off an element.
 * Deliberately literal: a name assembled at runtime is not a contract anyone
 * can author against, and counting it as "read" is how a dead attribute passes.
 */
const ATTR_CALL = /(?:get|has|remove|set)Attribute\(\s*['"`]([a-zA-Z][\w:-]*)['"`]/g;
const READ_FLAG = /readFlag\(\s*[^,]+,\s*['"`]([a-zA-Z][\w:-]*)['"`]/g;

function jsFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) jsFiles(p, out);
    else if (e.isFile() && p.endsWith('.js')) out.push(p);
  }
  return out;
}

/** Every attribute literal read anywhere in the behavior layer, with sources. */
function readIndex(root = VM) {
  const idx = new Map(); // attr -> Set(basename)
  for (const f of jsFiles(root)) {
    const src = fs.readFileSync(f, 'utf8');
    const base = path.basename(f);
    for (const re of [ATTR_CALL, READ_FLAG]) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(src))) {
        if (!idx.has(m[1])) idx.set(m[1], new Set());
        idx.get(m[1]).add(base);
      }
    }
  }
  return idx;
}

/**
 * Audit every behavior schema.
 * @returns {{behaviors: Array, totals: object}}
 */
export function auditAll({ models = MODELS, vm = VM } = {}) {
  const reads = readIndex(vm);
  const readNames = new Set(reads.keys());
  const behaviors = [];

  // Which files claim which behavior. Computed over EVERY behavior schema,
  // including ones declaring no properties -- a second definition that happens
  // to be empty is still a second definition (R6).
  const claimedBy = new Map();

  for (const file of fs.readdirSync(models).filter((f) => f.endsWith('.schema.json'))) {
    let schema;
    try {
      schema = JSON.parse(fs.readFileSync(path.join(models, file), 'utf8'));
    } catch {
      continue;
    }
    if (isNonBehavior(schema)) continue;

    const name = String(schema.schemaFor || file.replace('.schema.json', '')).replace(/^x-/, '');
    if (!claimedBy.has(name)) claimedBy.set(name, []);
    claimedBy.get(name).push(file);

    const props = Object.keys(schema.properties || {}).filter((p) => !isMetaProp(p));
    if (!props.length) continue;

    // One registry, not sixteen inline lists (#879).
    const aliases = new Set();
    for (const p of props) for (const a of aliasesFor(name, p)) aliases.add(String(a));

    const violations = [];

    // ---- R1 AUTHORABLE ---------------------------------------------------
    // kebab (`full-width`) and camelCase (`fullWidth`) both resolve to the same
    // authorable attribute. Anything else -- a dot, an underscore, a leading
    // capital -- reaches no attribute at all.
    for (const p of props) {
      if (!LEGAL_ATTR.test(p) && !CAMEL_ATTR.test(p)) {
        violations.push({
          rule: 'R1',
          attr: p,
          detail:
            'declared "' + p + '" is neither kebab-case nor camelCase, so it maps to no attribute an ' +
            'author can type. Declare "' + kebab(p.replace(/[^a-zA-Z0-9]+/g, '-')) + '".',
        });
      }
    }

    // ---- R5 CENTRAL ------------------------------------------------------
    // An alias declared inline is an alias defined twice the moment the
    // registry also knows about it, and invisible to every other consumer
    // when it does not.
    for (const p of props) {
      if (Array.isArray(schema.properties[p]?.aliases)) {
        violations.push({
          rule: 'R5',
          attr: p,
          detail:
            'declares `aliases` inline. Aliases live in src/core/attribute-aliases.js, ' +
            'one place, one time -- move it there and delete this field.',
        });
      }
    }

    // ---- R2 SINGULAR -----------------------------------------------------
    const byConcept = new Map();
    for (const p of props) {
      const c = conceptOf(p);
      if (!byConcept.has(c)) byConcept.set(c, []);
      byConcept.get(c).push(p);
    }
    for (const [, spellings] of byConcept) {
      if (spellings.length > 1) {
        violations.push({
          rule: 'R2',
          attr: spellings.join(' / '),
          detail:
            'one concept declared ' + spellings.length + ' times (' + spellings.join(', ') +
            '). Declare one name; make the rest `aliases`.',
        });
      }
    }

    // ---- R3 CONSUMED -----------------------------------------------------
    // The schema's own view layer counts: buildStructure() interpolates
    // {{prop}} and evaluates createdWhen against the SAME data keys, so a
    // property the $view consumes is live even though no .js mentions it.
    const viewBlob = JSON.stringify([schema.$view, schema.$methods, schema.compliance, schema.$css]);

    for (const p of props) {
      const def = schema.properties[p] || {};
      const candidates = new Set([p, kebab(p), squash(p), ...aliasesFor(name, p)]);

      const bySource = [...candidates].some((c) => readNames.has(c));
      const byView = viewBlob.includes(p) || viewBlob.includes(kebab(p));
      // wb.js applyDeclaredModifiers() mints a modifier class generically for
      // enum and boolean props without the behavior reading anything.
      const byGeneric = Array.isArray(def.enum) ? def.enum.length > 0 : def.type === 'boolean';

      if (!bySource && !byView && !byGeneric) {
        violations.push({
          rule: 'R3',
          attr: p,
          detail:
            'declared and documented, but consumed by nothing: no source reads it (tried ' +
            [...candidates].join(', ') + '), the $view never interpolates it, and it is neither ' +
            'enum nor boolean so the generic modifier path skips it.',
        });
      }
    }

    behaviors.push({
      name,
      file,
      declared: props,
      aliases: [...aliases],
      violations,
      compliant: violations.length === 0,
    });
  }

  // ---- R4 DECLARED (global: read but declared by nobody) -----------------
  const declaredEverywhere = new Set();
  for (const b of behaviors) {
    for (const p of b.declared) {
      declaredEverywhere.add(p);
      declaredEverywhere.add(kebab(p));
      declaredEverywhere.add(squash(p));
    }
    for (const a of b.aliases) declaredEverywhere.add(a);
  }

  // Native/global HTML attributes and behavior tokens are not options we own.
  const NATIVE = new Set([
    'class', 'id', 'tabindex', 'type', 'value', 'accept', 'autocomplete', 'alt', 'src', 'href',
    'slot', 'key', 'index', 'default', 'off', 'once', 'from', 'top', 'bottom', 'center', 'side',
    'tag', 'theme', 'style', 'title', 'role', 'name', 'width', 'height', 'target', 'disabled',
    'checked', 'selected', 'placeholder', 'required', 'readonly', 'multiple', 'step', 'min', 'max',
  ]);
  // `data-` is transparent (extractData strips it), so a code read of
  // `data-lazy` is satisfied by a declared `lazy`. Comparing the raw spelling
  // would report the same attribute as undeclared purely because the author
  // used the prefixed form.
  const isDeclared = (a) => declaredEverywhere.has(a) || (a.startsWith('data-') && declaredEverywhere.has(a.slice(5)));
  const undeclared = [...readNames]
    .filter((a) => !isDeclared(a))
    .filter((a) => !NATIVE.has(a) && !a.startsWith('aria-') && !a.startsWith('x-') && a !== 'wb' && a !== 'behavior')
    .sort()
    .map((a) => ({ attr: a, readBy: [...reads.get(a)].sort() }));

  const duplicateDefinitions = [...claimedBy.entries()]
    .filter(([, files]) => files.length > 1)
    .map(([name, files]) => ({ behavior: name, files }))
    .sort((a, b) => a.behavior.localeCompare(b.behavior));

  const totals = {
    behaviors: behaviors.length,
    declared: behaviors.reduce((n, b) => n + b.declared.length, 0),
    compliant: behaviors.filter((b) => b.compliant).length,
    violations: behaviors.reduce((n, b) => n + b.violations.length, 0),
    byRule: ['R1', 'R2', 'R3', 'R5'].reduce((acc, r) => {
      acc[r] = behaviors.reduce((n, b) => n + b.violations.filter((v) => v.rule === r).length, 0);
      return acc;
    }, {}),
    undeclared: undeclared.length,
  };
  totals.byRule.R4 = undeclared.length;
  totals.byRule.R6 = duplicateDefinitions.length;

  return {
    behaviors: behaviors.sort((a, b) => a.name.localeCompare(b.name)),
    undeclared,
    duplicateDefinitions,
    totals,
  };
}

export const RULES = {
  R1: 'AUTHORABLE — the declared key maps to an attribute an author can type',
  R2: 'SINGULAR  — one concept, one declared name',
  R3: 'CONSUMED   — every declared attribute is actually used',
  R4: 'DECLARED  — every attribute the code reads is declared',
  R5: 'CENTRAL   — aliases are defined once, in the registry',
  R6: 'DISTINCT  — one behavior, one schema file',
};
