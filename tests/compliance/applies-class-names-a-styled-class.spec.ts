import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { styledClasses } from '../helpers/styled-classes';

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

/**
 * Known, filed exceptions -- each names its issue and goes when that closes.
 * (#1464's four window-dot variants were the last; status.css now styles them.)
 */
const FILED: Record<string, string> = {};

test('every appliesClass names a class a stylesheet styles (#1429)', () => {
  const root = process.cwd();
  // Stylesheet rules plus the CSS behaviors inject themselves; see the helper.
  const styled = styledClasses(root);

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
