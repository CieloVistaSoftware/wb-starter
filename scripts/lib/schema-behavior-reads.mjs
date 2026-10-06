/**
 * schema-behavior-reads.mjs -- does the behavior behind each schema actually
 * read every property the schema declares? (#669)
 *
 * A schema is a promise: the Behaviors page, IntelliSense and the docs all
 * repeat it. A declared property the behavior never reads is an option that
 * does nothing, silently -- "audio showdisplay shows nothing", "none of the
 * dialogs work".
 *
 * RESOLUTION. The first audit matched a schema to src/wb-viewmodels/<name>.js
 * by filename, so every behavior living in a grouped file (alert in
 * feedback.js, center in layouts.js) came back "no behavior source found" --
 * 78 schemas, a third of the surface, unaudited and reported as nothing. This
 * resolves the way the runtime does: the behavior registry in
 * src/wb-viewmodels/index.js (behaviorModules) names the module each behavior
 * loads from, looked up by the schema's schemaFor, then its filename.
 *
 * A PROPERTY COUNTS AS READ when any of these implements it:
 *   - the module source names it (quoted, or as `.name`), in any of the
 *     spellings the codebase uses: declared, kebab-case, camelCase, lowercase;
 *   - the schema builder applies it: `appliesClass`, `appliesAttribute`, or a
 *     `{{name}}` / condition reference in the schema's own $view;
 *   - an enum value becomes a modifier class a stylesheet defines
 *     (`.x-avatar--square`), which the schema builder adds generically;
 *   - a stylesheet styles the attribute on the behavior's own host
 *     (`[x-avatar][bordered]`, `.x-details[variant="filled"]`).
 *
 * The module is read whole, so a grouped file counts a property as read if a
 * sibling behavior in it reads the same name. That makes the unread list a
 * floor -- but a resolved floor, where the old one skipped 78 schemas.
 */

import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

/**
 * Schemas that are not components at all: no behavior is meant to implement
 * them. Shared with audit-orphan-schemas.mjs (#670) -- one list, not two.
 */
export const NOT_COMPONENTS = new Set([
  'schema', 'views', 'search-index', 'home-page', 'behaviors',
  'x-behavior', 'x-collapse', 'x-copy', 'x-draggable', 'x-effects', 'x-enhancements',
]);

/** Properties every component gets for free / handled generically. */
const IGNORED = new Set(['data', 'columns', 'content', 'class', 'id', 'style', 'children']);

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function readTree(dir, ext, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) readTree(full, ext, acc);
    else if (e.name.endsWith(ext)) acc.push(fs.readFileSync(full, 'utf8'));
  }
  return acc;
}

/** Every spelling a property can be read under in this codebase. */
function spellings(prop) {
  const kebab = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
  const camel = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  return [...new Set([prop, kebab, camel, prop.toLowerCase()])];
}

function readInSource(src, prop) {
  return spellings(prop).some((form) =>
    new RegExp(`['"\`]${escape(form)}['"\`]`).test(src) ||
    new RegExp(`\\.${escape(form)}\\b`).test(src));
}

function styledInCss(css, host, base, prop, def) {
  const hosts = [`\\[${escape(host)}\\]`, `\\.${escape(base)}`].join('|');
  const attr = spellings(prop).map((f) => escape(f.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase()))).join('|');
  if (new RegExp(`(?:${hosts})\\[(?:${attr})(?:[\\]=~|^$*])`).test(css)) return true;
  return Array.isArray(def.enum) && def.enum.some((v) =>
    typeof v === 'string' && v !== 'default' && css.includes(`.${base}--${v}`));
}

function usedByView(schema, prop) {
  const view = JSON.stringify(schema.$view ?? '');
  return new RegExp(`\\{\\{${escape(prop)}\\}\\}|"${escape(prop)}"`).test(view);
}

/**
 * @param {string} root repository root
 * @returns {Promise<{ checked: number, unresolved: string[], unread: Array<{ schema: string, module: string, declared: number, unread: string[] }> }>}
 */
export async function auditSchemaReads(root) {
  const models = path.join(root, 'src', 'wb-models');
  const vm = path.join(root, 'src', 'wb-viewmodels');
  const { behaviorModules } = await import(pathToFileURL(path.join(vm, 'index.js')).href);
  const byLower = new Map(Object.keys(behaviorModules).map((k) => [k.toLowerCase(), k]));
  const css = readTree(path.join(root, 'src', 'styles'), '.css').join('\n');

  const unresolved = [];
  const unread = [];
  let checked = 0;
  for (const file of fs.readdirSync(models).filter((f) => f.endsWith('.schema.json')).sort()) {
    const name = file.replace('.schema.json', '');
    if (NOT_COMPONENTS.has(name)) continue;
    let schema;
    try {
      schema = JSON.parse(fs.readFileSync(path.join(models, file), 'utf8'));
    } catch {
      continue; // every-schema-parses.spec.ts owns a schema that does not parse
    }
    const props = Object.keys(schema.properties || {}).filter((p) => !IGNORED.has(p));
    if (!props.length) continue;

    const key = [schema.schemaFor, schema.behavior, name]
      .filter(Boolean)
      .map((c) => String(c).replace(/^x-/, ''))
      .map((c) => (behaviorModules[c] ? c : byLower.get(c.toLowerCase())))
      .find(Boolean);
    if (!key) {
      unresolved.push(name);
      continue;
    }

    checked++;
    const module = `${behaviorModules[key]}.js`;
    const src = fs.readFileSync(path.join(vm, module), 'utf8');
    const base = schema.compliance?.baseClass || `x-${key}`;
    const missing = props.filter((p) => {
      const def = schema.properties[p] || {};
      if (def.appliesClass || def.appliesAttribute) return false;
      if (usedByView(schema, p)) return false;
      if (styledInCss(css, `x-${key}`, base, p, def)) return false;
      return !readInSource(src, p);
    });
    if (missing.length) unread.push({ schema: name, module, declared: props.length, unread: missing });
  }
  return { checked, unresolved, unread };
}
