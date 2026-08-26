import { test, expect } from '@playwright/test';
import { auditAll, RULES } from '../../scripts/lib/attribute-audit.mjs';

/**
 * THE attribute compliance gate.
 *
 * John: "we need only one official attribute audit per beh. all of our
 * controls must comply."
 *
 * One test per rule, driven by the one audit engine. There is deliberately no
 * second implementation here -- an earlier version of this work had three
 * separate scanners disagreeing about the same 654 attributes, which is how
 * the drift they were measuring survived in the first place. This spec only
 * asserts; scripts/lib/attribute-audit.mjs decides.
 *
 * CEILINGS, NOT TOLERANCES
 *
 * R2/R3/R4 carry a number equal to today's measured count. They exist so the
 * gate is green at HEAD while still failing the moment a new violation lands.
 * Every one of them is a real defect to be driven to zero -- lower the number
 * as they are fixed, never raise it. R1 is already at zero and is asserted as
 * zero, because a key no author can type has no defensible reason to exist.
 */

const { behaviors, undeclared, duplicateDefinitions, totals } = auditAll();

/** Ratchet. Lower as fixed; raising one hides a regression. */
const CEILING = {
  R1: 0,   // AUTHORABLE — extinct, keep it that way
  R2: 0,   // SINGULAR   — fixed: 15 data- duplicates collapsed
  R3: 11,  // CONSUMED   — declared, documented, inert (the #861 residue)
  R4: 100, // DECLARED   — read by code, declared by no schema
  R5: 0,   // CENTRAL    — aliases live in the registry, never inline
  R6: 6,   // DISTINCT   — one behavior defined by two schema files
};

/** A violation reads as an instruction, not just a complaint. */
function report(rule: keyof typeof CEILING): string {
  const hits = behaviors.flatMap((b: any) =>
    b.violations.filter((v: any) => v.rule === rule).map((v: any) => `  x-${b.name}  ${v.attr}\n      ${v.detail}`),
  );
  return `\n${RULES[rule]}\n\n${hits.join('\n')}\n`;
}

test.describe('attribute compliance — one audit, every control', () => {
  test('the audit actually ran', () => {
    // A gate measuring nothing reports green forever. This is the cheapest
    // guard against the engine silently returning an empty set (#863).
    expect(totals.behaviors, 'no behaviors audited — the engine found no schemas').toBeGreaterThan(100);
    expect(totals.declared, 'no attributes declared — schemas parsed but yielded nothing').toBeGreaterThan(600);
  });

  test('R1 AUTHORABLE: no behavior declares a key no author can type', () => {
    expect(totals.byRule.R1, report('R1')).toBe(0);
  });

  test('R2 SINGULAR: one concept, one declared name', () => {
    expect(
      totals.byRule.R2,
      `${report('R2')}\nCeiling is ${CEILING.R2}. Declare one name and move the rest to \`aliases\` — ` +
      `schema-builder.js:244 already honours aliases, so this is a data change.`,
    ).toBeLessThanOrEqual(CEILING.R2);
  });

  test('R3 CONSUMED: no attribute is documented and inert', () => {
    expect(
      totals.byRule.R3,
      `${report('R3')}\nCeiling is ${CEILING.R3}. Each of these is declared in a schema, rendered into ` +
      `the docs and shown in the showcase, and reaches no code by any of the three paths (#861).`,
    ).toBeLessThanOrEqual(CEILING.R3);
  });

  test('R4 DECLARED: no attribute works in secret', () => {
    const list = undeclared.map((u: any) => `  ${u.attr.padEnd(24)} ${u.readBy.join(', ')}`).join('\n');
    expect(
      undeclared.length,
      `\n${RULES.R4}\n\n${list}\n\nCeiling is ${CEILING.R4}. These are read by behavior source but ` +
      `declared by no schema, so the docs, the showcase and autocomplete cannot see them. ` +
      `They work; nobody can discover them.`,
    ).toBeLessThanOrEqual(CEILING.R4);
  });

  test('R5 CENTRAL: aliases are defined once, in the registry', () => {
    expect(
      totals.byRule.R5,
      `${report('R5')}
An alias is a promise that two spellings mean the same option. ` +
      `Declared inline it is a promise repeated per schema; src/core/attribute-aliases.js ` +
      `is the one place it is kept.`,
    ).toBe(0);
  });

  test('R6 DISTINCT: one behavior, one schema file', () => {
    const list = duplicateDefinitions
      .map((d: any) => `  x-${d.behavior.padEnd(16)} ${d.files.join('   +   ')}`)
      .join('\n');
    expect(
      duplicateDefinitions.length,
      `\n${RULES.R6}\n\n${list}\n\nCeiling is ${CEILING.R6}. Two files defining one behavior is two ` +
      `places for its contract to drift. Merge each pair and delete the loser. Note the empty ` +
      `half of a pair still counts -- a second definition that declares nothing is still a ` +
      `second definition, and that is why the per-record uniqueness check did not catch these.`,
    ).toBeLessThanOrEqual(CEILING.R6);
  });

  test('every behavior has exactly one audit record', () => {
    // "One official audit per behavior" is only true if the records are unique.
    const names = behaviors.map((b: any) => b.name);
    expect(new Set(names).size, `duplicate audit records: ${names.filter((n: string, i: number) => names.indexOf(n) !== i)}`).toBe(names.length);
  });
});
