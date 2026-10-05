/**
 * NEVER CREDIT A SPEC TO AN ISSUE IT DOES NOT MENTION
 * ===================================================
 * #1090, second half. #1075 was reported `committed` on the strength of its
 * `test:` field, which named scan-awaits-auto-injected-behaviors.spec.ts -- a
 * file with zero occurrences of 1075. Both issues were fixed in one commit and
 * the spec belonged to the sibling. "Has a test" stopped meaning "has a test
 * for this", so the verdict could not be used to close anything.
 *
 * The engine now reports `test-unrelated` instead of crediting such a spec.
 * The sibling spec, issue-state-finds-an-unrecorded-test.spec.ts, holds the
 * first half (a test title naming the issue is found).
 *
 * The last test holds a gap found on the way: `unrecorded-test` was returned by
 * assess() but missing from STATES, so its counter read NaN and the summary
 * never printed it.
 */
import { test, expect } from '../fixtures/offline';
import { readFileSync } from 'fs';
import { specMentionsIssue } from '../../scripts/lib/test-citations.mjs';

test.describe('#1090 — a recorded spec must mention its issue', () => {
  test('a spec with zero occurrences of the number is not credited', () => {
    // The shape that mis-credited #1075: the sibling's spec, naming only #1078.
    const src = "test('a mid-boot setContent does not leave injections stuck forever (#1078)', () => {});";
    expect(specMentionsIssue(src, 1075)).toBe(false);
  });

  test('a mention anywhere in the file backs the recorded claim', () => {
    expect(specMentionsIssue('/** REGRESSION (#1075): the loop threw its promises away. */', 1075)).toBe(true);
    expect(specMentionsIssue("test('scan awaits every injection (#1075)', () => {});", 1075)).toBe(true);
  });

  test('a longer number is not a mention', () => {
    expect(specMentionsIssue('see #10750 and #21075', 1075)).toBe(false);
  });

  test('a bare number without a hash is not a mention', () => {
    expect(specMentionsIssue("test('builds 1075 demos', () => {});", 1075)).toBe(false);
  });

  test('every state assess() can return is a listed state', () => {
    const src = readFileSync('scripts/issue-state.mjs', 'utf8');
    const listed = src.match(/export const STATES = \[([\s\S]*?)\];/);
    expect(listed, 'STATES is not declared where expected').not.toBeNull();
    const states = new Set([...listed![1].matchAll(/'([a-z-]+)'/g)].map((m) => m[1]));
    const returned = new Set([...src.matchAll(/say\('([a-z-]+)'/g)].map((m) => m[1]));
    const unlisted = [...returned].filter((s) => !states.has(s));
    expect(unlisted, 'a state missing from STATES counts as NaN and is never printed').toEqual([]);
    expect(returned.has('test-unrelated'), 'assess() must report a spec that does not name the issue').toBe(true);
  });
});
