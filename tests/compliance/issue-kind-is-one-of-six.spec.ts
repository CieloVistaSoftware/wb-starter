/**
 * The `kind` rule, guarded (#1121).
 *
 * `kind` is the field a future error matches on first, and it is required at
 * filing. Measured 2026-09-12: 88 of 189 open issues carried no Signature block
 * at all, and three used a kind that does not exist in the standard —
 * `infrastructure` (#1074), `tooling` (#1069), `dead-code` (#1068, a near-miss
 * for `dead-declaration`). All three were caught by the validator AT FILING TIME
 * and landed anyway, because that run is red for nearly every issue and red had
 * stopped meaning anything.
 *
 * Two separate defects are guarded here, and the second is the one that made
 * the count untrustworthy:
 *
 *   1. an invented kind must be rejected;
 *   2. a CRLF body must PARSE. parseSignature required `\n` immediately after
 *      the ```yaml opener, so every issue whose body carried Windows line
 *      endings — anything typed in the GitHub web UI — read as having NO
 *      Signature block whatsoever. That is a false negative indistinguishable
 *      from a genuinely empty issue, and it is how #1107, #1115 and #1116 were
 *      miscounted as bare when each had a complete block.
 *
 * No network: the rule is pure, and a gate that needs a GitHub token is a gate
 * that does not run in the commit gate. The repo-wide sweep over real issues is
 * .github/workflows/issue-kinds-sweep.yml.
 */
import { test, expect } from '@playwright/test';
import { SCHEMA, parseSignature, kindProblem } from '../../scripts/lib/signature-schema.mjs';

const block = (yaml: string) => ['## Signature', '', '```yaml', yaml, '```'].join('\n');

const COMPLETE = block(
  [
    'kind: structural',
    'subject: src/core/wb.js',
    'observed: "a thing that is wrong"',
    'expected: "the thing being right"',
  ].join('\n'),
);

test.describe('issue kind is one of the six the standard declares', () => {
  test('the six kinds are read out of the standard, not restated here', () => {
    // If this list is edited in the .md, this assertion is what notices. The
    // point of signature-schema.mjs is that there is no second copy; a test
    // that hardcoded the six would BE that second copy.
    expect([...SCHEMA.kinds].sort()).toEqual(
      ['dead-declaration', 'measured', 'process', 'runtime', 'structural', 'test-failure'],
    );
  });

  test('a valid kind passes', () => {
    expect(kindProblem(COMPLETE)).toBeNull();
    for (const kind of SCHEMA.kinds) {
      expect(kindProblem(block(`kind: ${kind}\nsubject: x`)), kind).toBeNull();
    }
  });

  // The three that actually got through, by name. This is the assertion that
  // fails if the kind check is ever removed or widened.
  for (const invented of ['dead-code', 'tooling', 'infrastructure', 'bug', 'enhancement']) {
    test(`kind "${invented}" is rejected`, () => {
      const problem = kindProblem(block(`kind: ${invented}\nsubject: x`));
      expect(problem, `kind "${invented}" must not be accepted`).toContain(invented);
      expect(problem).toContain('is not one of');
    });
  }

  test('a body with no Signature block is rejected', () => {
    expect(kindProblem('## In plain English\n\nsomething is broken.')).toContain('no Signature block');
  });

  test('a Signature block with no kind line is rejected', () => {
    expect(kindProblem(block('subject: x\nobserved: "y"'))).toContain('no kind');
  });

  // ── the parser regression ────────────────────────────────────────────────
  test('a CRLF body parses — GitHub stores CRLF for anything typed in the web UI', () => {
    const crlf = COMPLETE.split('\n').join('\r\n');
    expect(crlf).toContain('\r\n');

    const parsed = parseSignature(crlf);
    expect(parsed, 'a complete block with Windows line endings must not read as absent').not.toBeNull();
    expect(parsed!.fields.kind).toBe('structural');
    expect(kindProblem(crlf)).toBeNull();
  });

  test('an invalid kind is still caught when the body is CRLF', () => {
    // The two defects compose: before the fix, a CRLF body with kind "dead-code"
    // was reported as "no Signature block" rather than as an invalid kind, so
    // fixing the line endings without keeping this assertion would hide it again.
    const crlf = block('kind: dead-code\nsubject: x').split('\n').join('\r\n');
    expect(kindProblem(crlf)).toContain('dead-code');
  });
});
