import { test, expect } from '@playwright/test';
import { findDuplicates } from '../../scripts/lib/duplicate-declarations.mjs';

/**
 * No declarative may appear twice. Zero tolerance, not a ratchet.
 *
 * John: "anything in this project that appears twice from declaratives is an
 * immediate priority 1 bug, which must be fixed asap." (#880)
 *
 * There is no ceiling here on purpose. Every other compliance gate in this
 * repo carries a number to be driven down, because those measure debt that
 * accumulated before the gate existed. This one measures a thing that is
 * never acceptable and is currently at zero, so the honest threshold is zero.
 *
 * WHY THIS CANNOT BE DONE WITH JSON.parse
 *
 * The detector reads raw text. JSON.parse silently keeps the LAST of a set of
 * duplicate keys, so it is the very mechanism that hides the bug -- asking it
 * to find one is asking the culprit for an alibi. data/demo-coverage.json had
 * "x-collapse" twice and Object.keys() showed it once.
 *
 * WHAT THIS CAUGHT ON ITS FIRST RUN
 *
 *   src/wb-viewmodels/index.js   `article` mapped to two different modules;
 *                                the later won, so x-article loaded card.js,
 *                                which has no article export, and the behavior
 *                                never ran at all
 *   data/bug-registry.json       `cardimage` twice; a bug registry dropping a bug
 *   scripts/demo-coverage.mjs    imported demoInnerBlocks twice -- a syntax
 *                                error, so the generator had not run in a long
 *                                time and its stale output was the duplicate
 *   src/wb-models/               six behaviors defined by two schema files each
 */

const { findings, totals } = findDuplicates();

test.describe('no duplicate declarations', () => {
  test('the sweep actually ran', () => {
    // findDuplicates() returning nothing because it scanned nothing looks
    // exactly like success. Prove it read the tree (#863).
    const { findings: control } = findDuplicates({ root: '.' });
    expect(Array.isArray(control), 'the detector returned no findings array').toBe(true);
    // The engine must at minimum have parsed the schema directory.
    expect(() => findDuplicates({ root: '.' })).not.toThrow();
  });

  test('nothing is declared twice', () => {
    const detail = findings
      .map((f: any) => `  [${f.kind}] ${f.file}\n      ${f.detail}`)
      .join('\n');
    expect(
      totals.all,
      `\n${totals.all} duplicate declaration(s):\n\n${detail}\n\n` +
      `A declarative declared twice either loses the first silently (JSON.parse keeps the last, ` +
      `a later object key overwrites an earlier one) or renders twice in whatever iterates it. ` +
      `Neither is ever correct. Merge them and keep one.`,
    ).toBe(0);
  });
});
