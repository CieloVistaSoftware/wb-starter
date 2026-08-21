/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Showcase examples must not carry a redundant x-{behavior} attribute (#749)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * John: "autoinject makes x-fieldset non mandatory", "we are now running
 * autoinject true".
 *
 * With autoInject on, a semantic host gets its mapped behavior from the tag
 * alone. `<fieldset x-fieldset>` and `<figure x-figure>` teach a duplication
 * the framework exists to remove — and #746 showed the redundant form is not
 * merely noise: `<button x-button>` actively suppressed the behavior for
 * three releases.
 *
 * The tag→behavior pairs are read from tag-map.js's own nativeMap, so a
 * mapping added there is enforced here automatically rather than needing this
 * list to be maintained by hand.
 *
 * NOT flagged: an x-{behavior} naming a DIFFERENT behavior than the host tag's
 * own — `<button x-dialog>` is a button that opens a dialog, which is the
 * whole point of the example and carries no duplication.
 */

import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

const root = process.cwd();

/** tag → behavior, parsed from tag-map.js's nativeMap. */
function nativeMap(): Record<string, string> {
  const src = readFileSync(join(root, 'src/core/tag-map.js'), 'utf8');
  const block = src.match(/export const nativeMap = \{([\s\S]*?)\n\};/);
  if (!block) throw new Error('nativeMap not found in tag-map.js');
  const out: Record<string, string> = {};
  for (const m of block[1].matchAll(/'([^']+)':\s*'([^']+)'/g)) {
    // Selector forms like input[type="checkbox"] have no single tag to
    // compare a bare `<tag x-attr>` against; the plain-tag entries are the
    // ones this rule is about.
    if (/^[a-z][a-z0-9]*$/.test(m[1])) out[m[1]] = m[2];
  }
  return out;
}

function everySource(): { where: string; source: string }[] {
  const data = JSON.parse(
    readFileSync(join(root, 'data/behavior-examples.json'), 'utf8')
  );
  const found: { where: string; source: string }[] = [];
  const walk = (node: any, path: string) => {
    if (Array.isArray(node)) node.forEach((v, i) => walk(v, `${path}[${i}]`));
    else if (node && typeof node === 'object') {
      for (const [k, v] of Object.entries(node)) {
        if (k === 'source' && typeof v === 'string') found.push({ where: path, source: v });
        else walk(v, `${path}.${k}`);
      }
    }
  };
  walk(data, '$');
  return found;
}

test('no example carries an x-{behavior} its own tag already auto-injects', () => {
  const map = nativeMap();
  expect(Object.keys(map).length, 'nativeMap parsed empty — the rule would pass vacuously')
    .toBeGreaterThan(0);

  const offenders: string[] = [];
  for (const { where, source } of everySource()) {
    for (const m of source.matchAll(/<([a-zA-Z][a-zA-Z0-9]*)((?:\s[^<>]*?)?)(\/?>)/gs)) {
      const behavior = map[m[1].toLowerCase()];
      if (!behavior) continue;
      const redundant = new RegExp(`\\sx-${behavior}(?=[\\s/>]|$)`);
      if (redundant.test(m[2])) {
        offenders.push(`${where}: <${m[1]} x-${behavior}> — autoInject already applies "${behavior}" to <${m[1]}>`);
      }
    }
  }

  expect(offenders, `Redundant dispatch attributes found:\n  ${offenders.join('\n  ')}`)
    .toEqual([]);
});
