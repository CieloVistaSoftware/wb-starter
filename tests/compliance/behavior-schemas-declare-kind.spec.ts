/**
 * EVERY BEHAVIOR SCHEMA DECLARES ITS KIND (#835)
 * ==============================================
 * Behaviors come in two kinds, and until #835 nothing said which:
 *
 *   element    what one semantic element BECOMES, named for the element
 *              <article> -> card, <table>, <details>
 *              { "kind": "element", "element": "article" }
 *   decorator  extra function laid on ANY element, named for what it adds
 *              x-ripple, x-tooltip, x-glow, x-draggable
 *              { "kind": "decorator" }
 *
 * John: "for ripple and tooltip that is just extra function for any element."
 *
 * Tooling had to infer the kind -- the behaviors page string-matched example
 * markup for `<` + host (#767's '\b'-as-backspace bug lived there). With the
 * kind declared, it reads the field.
 *
 * Which schemas: the component tier (schemaType absent or "component"). Base,
 * definition and page schemas are not behaviors -- schema.schema.json's own
 * _schemaTypes says so -- and carry no kind.
 */
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { HTML_ELEMENTS } from '../helpers/html-elements';

const ROOT = process.cwd();
const MODELS = path.join(ROOT, 'src', 'wb-models');

type Schema = { schemaType?: string; schemaFor?: string; kind?: string; element?: string };

/** Every *.schema.json under src/wb-models, subfolders included, but the meta-schema. */
function schemaFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.schema.json') && entry.name !== 'schema.schema.json') out.push(full);
    }
  };
  walk(MODELS);
  return out.sort();
}

const read = (file: string): Schema => JSON.parse(fs.readFileSync(file, 'utf8'));
const rel = (file: string) => path.relative(ROOT, file).replace(/\\/g, '/');
const isBehavior = (s: Schema) => !s.schemaType || s.schemaType === 'component';

const meta = JSON.parse(fs.readFileSync(path.join(MODELS, 'schema.schema.json'), 'utf8'));

test('schema.schema.json declares kind and element, and requires kind on behaviors', () => {
  expect(meta.properties.kind?.enum, 'kind is declared with its two values').toEqual(['element', 'decorator']);
  expect(meta.properties.element?.type, 'element is declared').toBe('string');
  expect(meta._schemaTypes.component.required, 'the component tier requires kind').toContain('kind');
});

test('every behavior schema declares kind; element names a real tag exactly when kind is element', () => {
  const kinds: string[] = meta.properties.kind.enum;
  const behaviors = schemaFiles().map((f) => ({ f, s: read(f) })).filter(({ s }) => isBehavior(s));
  expect(behaviors.length, 'the schemas were read, so this can fail').toBeGreaterThan(100);

  const problems: string[] = [];
  for (const { f, s } of behaviors) {
    if (!s.kind) { problems.push(`${rel(f)}: no "kind"`); continue; }
    if (!kinds.includes(s.kind)) { problems.push(`${rel(f)}: kind "${s.kind}" is not one of ${kinds.join(', ')}`); continue; }
    if (s.kind === 'element') {
      if (!s.element) problems.push(`${rel(f)}: kind "element" names no "element"`);
      else if (!HTML_ELEMENTS.has(s.element)) problems.push(`${rel(f)}: element "${s.element}" is not an HTML element`);
    } else if (s.element !== undefined) {
      problems.push(`${rel(f)}: a decorator names element "${s.element}" -- only kind "element" has one`);
    }
  }
  expect(problems, 'add { "kind": "element", "element": "<tag>" } or { "kind": "decorator" }').toEqual([]);
});

test('non-behavior schemas (base, definition, page) carry no kind', () => {
  const stray = schemaFiles().map((f) => ({ f, s: read(f) }))
    .filter(({ s }) => !isBehavior(s) && (s.kind !== undefined || s.element !== undefined))
    .map(({ f, s }) => `${rel(f)} (${s.schemaType})`);
  expect(stray).toEqual([]);
});

test('a behavior an element auto-injects declares that element (nativeMap agrees with kind)', async () => {
  const { nativeMap } = await import(pathToFileURL(path.join(ROOT, 'src/core/tag-map.js')).href);
  const bySchemaFor = new Map<string, Schema & { file: string }>();
  for (const f of schemaFiles()) {
    const s = read(f);
    if (isBehavior(s) && s.schemaFor && !f.includes('.base.')) bySchemaFor.set(s.schemaFor, { ...s, file: rel(f) });
  }
  const entries = Object.entries(nativeMap as Record<string, string>);
  expect(entries.length, 'nativeMap was read').toBeGreaterThan(10);

  const wrong: string[] = [];
  for (const [selector, behavior] of entries) {
    // 'input[type="checkbox"]' -> input
    const tag = (selector.match(/^[a-z][a-z0-9]*/) || [''])[0];
    const s = bySchemaFor.get(behavior);
    if (!s) { wrong.push(`${selector} -> ${behavior}: no schema`); continue; }
    if (s.kind !== 'element' || s.element !== tag) {
      wrong.push(`${selector} -> ${behavior}: ${s.file} says ${JSON.stringify({ kind: s.kind, element: s.element })}, expected { kind: "element", element: "${tag}" }`);
    }
  }
  expect(wrong).toEqual([]);
});

test('data/schema-index.json carries kind and element for the behaviors page', () => {
  const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'schema-index.json'), 'utf8'));
  const missing: string[] = [];
  for (const entry of index.schemas as Array<{ file: string; name: string; kind?: string; element?: string }>) {
    const s = read(path.join(MODELS, entry.file));
    if (!isBehavior(s)) continue;
    if (entry.kind !== s.kind || entry.element !== s.element) {
      missing.push(`${entry.file}: index has ${JSON.stringify({ kind: entry.kind, element: entry.element })}, schema has ${JSON.stringify({ kind: s.kind, element: s.element })}`);
    }
  }
  expect(missing, 'run node scripts/build-schema-index.mjs').toEqual([]);
});
