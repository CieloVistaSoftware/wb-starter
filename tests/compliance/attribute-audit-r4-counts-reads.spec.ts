import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { auditAll } from '../../scripts/lib/attribute-audit.mjs';

/**
 * R4 MEASURES WHAT AUTHORS PASS IN (#879)
 * =======================================
 * R4 is "read by code, declared by no schema": an option that works but that
 * the docs, the showcase and autocomplete cannot see. Its count held 9
 * attributes no author ever passes in: the code only SETS or REMOVES them
 * (`data-captions-missing` on a video card with no captions, the `for` a label
 * is given, `tone` on a featured mark). Those are output for CSS and tests. A
 * schema declaring them would be documenting an option that does nothing, so
 * the only honest fix is to stop counting them.
 *
 * It also held platform attributes of the host itself (<img srcset>,
 * <form method>, <ol start>) and `data-theme`, the page theme the audit already
 * exempts as `theme`. `data-` is transparent for declarations (extractData
 * strips it); this makes it transparent for the native exemption as well.
 *
 * Built against a throwaway fixture so it pins the RULE, not today's tree.
 */

function fixture(): { models: string; vm: string } {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wb-attr-audit-'));
  const models = path.join(root, 'models');
  const vm = path.join(root, 'vm');
  fs.mkdirSync(models);
  fs.mkdirSync(vm);
  fs.writeFileSync(
    path.join(models, 'probe.schema.json'),
    JSON.stringify({
      schemaFor: 'probe',
      properties: {
        size: { type: 'string', description: 'How big the probe renders.', default: 'md' },
        mode: { type: 'string', description: 'Reflected onto the host by the probe itself.', default: 'auto' },
      },
    }),
  );
  fs.writeFileSync(
    path.join(vm, 'probe.js'),
    [
      'export function probe(el) {',
      "  el.getAttribute('size');",
      "  el.setAttribute('mode', 'auto');",
      // Output only: never an option.
      "  el.setAttribute('data-probe-state', 'ready');",
      "  el.removeAttribute('probe-flag');",
      // Platform attributes and the page theme.
      "  el.getAttribute('srcset');",
      "  el.getAttribute('method');",
      "  el.getAttribute('start');",
      "  document.documentElement.getAttribute('data-theme');",
      // The one real gap: an option read in and declared nowhere.
      "  el.getAttribute('undeclared-option');",
      "  el.hasAttribute('undeclared-flag');",
      '}',
    ].join('\n'),
  );
  return { models, vm };
}

test.describe('R4 counts attributes taken in, not attributes put out (#879)', () => {
  const dirs = fixture();
  const result = auditAll(dirs);
  const undeclared = result.undeclared.map((u: any) => u.attr);

  test('a read nobody declared is still reported', () => {
    expect(undeclared).toContain('undeclared-option');
    expect(undeclared).toContain('undeclared-flag');
  });

  test('an attribute the code only sets or removes is not an option', () => {
    expect(undeclared).not.toContain('data-probe-state');
    expect(undeclared).not.toContain('probe-flag');
  });

  test('platform attributes and the page theme are not ours to declare', () => {
    for (const a of ['srcset', 'method', 'start', 'data-theme']) expect(undeclared).not.toContain(a);
  });

  test('exactly the two real gaps, nothing else', () => {
    expect(undeclared).toEqual(['undeclared-flag', 'undeclared-option']);
  });

  test('a declared attribute the code only writes still counts as consumed (R3 unchanged)', () => {
    // Writes stopped counting for R4 only. R3 asks "does anything touch this
    // declared attribute", and a setAttribute does.
    const probe = result.behaviors.find((b: any) => b.name === 'probe');
    expect(probe?.violations ?? ['missing']).toEqual([]);
  });
});
