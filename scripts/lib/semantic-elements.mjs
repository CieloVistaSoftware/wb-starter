/**
 * semantic-elements.mjs -- which behaviors promise a real native element (#1832).
 *
 * A schema's `semanticElement.tagName` promises that the live component is a
 * superset of that native element (see #360). tests/regression/
 * semantic-element-fidelity.spec.ts holds every schema to that promise, and
 * packages/site-migrate holds the page it proposes to it. Both read the list
 * from here, so they cannot disagree about which tags count.
 *
 * Only tags with no adequate ARIA-only substitute are checked: select, table,
 * dialog, details and textarea get real browser behavior (keyboard handling,
 * native pickers, form participation) that role="..." alone cannot replicate.
 * The spec's docblock gives the reasons button and progress are left out.
 */
import fs from 'node:fs';
import path from 'node:path';

export const STRICT_TAGS = new Set(['select', 'table', 'dialog', 'details', 'textarea']);

/**
 * Every schema in `schemaDir` that declares a STRICT_TAGS semanticElement.tagName.
 * @param {string} schemaDir
 * @returns {{file: string, schemaFor: string, tagName: string, setupHtml: string}[]}
 */
export function strictSemanticSchemas(schemaDir) {
  if (!fs.existsSync(schemaDir)) return [];
  const results = [];
  for (const file of fs.readdirSync(schemaDir)) {
    if (!file.endsWith('.schema.json') || file.includes('.base.')) continue;
    let schema;
    try {
      schema = JSON.parse(fs.readFileSync(path.join(schemaDir, file), 'utf-8'));
    } catch {
      continue;
    }
    const tagName = schema?.semanticElement?.tagName;
    if (!tagName || !STRICT_TAGS.has(tagName)) continue;
    const setupHtml = schema?.test?.setup?.[0];
    if (!setupHtml) continue;
    results.push({ file, schemaFor: schema.schemaFor, tagName, setupHtml });
  }
  return results;
}
