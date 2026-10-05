import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * #1429: a schema property's appliesClass says "this option puts class X on
 * the element". 160 of 310 declared values named a class no stylesheet
 * styles -- a renamed hook (table's --hoverable vs the real --hover, #1353), an
 * option actually styled by an attribute selector, or a template never
 * expanded (card's single-brace {value}). Readers and tooling were pointed at
 * hooks that do nothing.
 *
 * Every appliesClass value, {{value}} expanded over the enum (or the literal
 * for a boolean), must name a class some rule under src/styles styles. The
 * one exemption is the property's default: rendering the default needs no
 * modifier class, and the builder deliberately adds none for "default".
 */
function cssFiles(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) cssFiles(p, out); else if (e.name.endsWith('.css')) out.push(p);
  }
  return out;
}

/**
 * Known, filed exceptions -- each names its issue and goes when that closes.
 * (#1464's four span variants were the last; span.css now styles them.)
 */
const FILED: Record<string, string> = {};

function jsFiles(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) jsFiles(p, out); else if (e.name.endsWith('.js')) out.push(p);
  }
  return out;
}

test('every appliesClass names a class a stylesheet styles (#1429)', () => {
  const root = process.cwd();
  const css = cssFiles(path.join(root, 'src', 'styles'))
    .map((f) => fs.readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, ''))
    .join('\n');
  const styled = new Set([...css.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1]));
  // Some behaviors inject their own stylesheet (button.js BUTTON_CSS, ...).
  // An injected stylesheet styles a class as surely as a file does, so CSS
  // selectors inside behavior JS count -- but only in rule position, a class
  // followed on the same line by `{` with no quote or `;` between, so a
  // querySelector('.x-foo') string is not mistaken for styling.
  for (const file of jsFiles(path.join(root, 'src', 'wb-viewmodels'))) {
    const src = fs.readFileSync(file, 'utf8');
    // Lookahead, not a consuming match: `.x-a--top, .x-a--bottom {` styles both,
    // and a selector list may break across lines before its `{` (tooltip.js).
    // Newlines are safe to cross: a JS identifier cannot contain `-`, so `.x-…`
    // outside quotes only occurs in CSS text.
    for (const m of src.matchAll(/\.(x-[\w-]+)(?=[^{};'"]*\{)/g)) styled.add(m[1]);
  }

  const modelsDir = path.join(root, 'src', 'wb-models');
  let checked = 0;
  const missing: string[] = [];
  const stillFiled = new Set<string>();
  for (const file of fs.readdirSync(modelsDir).filter((n) => n.endsWith('.schema.json'))) {
    const schema = JSON.parse(fs.readFileSync(path.join(modelsDir, file), 'utf8'));
    const name = file.replace('.schema.json', '');
    for (const [prop, def] of Object.entries<any>(schema.properties || {})) {
      if (!def || !def.appliesClass) continue;
      const template = String(def.appliesClass);
      expect(template, `${name}.${prop}: appliesClass uses {value}; the expansion form is {{value}}`)
        .not.toMatch(/(^|[^{])\{value\}([^}]|$)/);
      const values: string[] = Array.isArray(def.enum) ? def.enum.map(String) : def.type === 'boolean' ? ['true'] : [];
      for (const value of values) {
        if (value === 'default' || value === String(def.default)) continue;
        const cls = template.replace(/\{\{value\}\}/g, value);
        checked++;
        const key = `${name}.${prop}=${value}`;
        if (FILED[key]) { stillFiled.add(key); continue; }
        if (!styled.has(cls)) missing.push(`${key} -> .${cls}`);
      }
    }
  }
  expect(checked, 'the scan found appliesClass declarations to check').toBeGreaterThan(50);
  // A filed exception whose value no longer exists is stale: drop it.
  expect(Object.keys(FILED).filter((k) => !stillFiled.has(k)), 'FILED entries that no longer match a declaration').toEqual([]);
  expect(missing, `${missing.length} appliesClass value(s) name a class nothing styles`).toEqual([]);
});
