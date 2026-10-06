import { test, expect } from '../fixtures/offline';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

/**
 * signature-field.mjs READS A BLOCK VALUE, NOT ITS '|' (#1588)
 * ===========================================================
 * An issue's Signature can write a field as a YAML block:
 *
 *   test: |
 *     tests/behaviors/progress-fill.spec.ts guards the one confirmed casualty (#848).
 *
 * The script returned the literal '|', so #852 -- which names a runnable spec --
 * read as having no test, and the issue checks built on it agreed.
 *
 * See it by hand: save a Signature with `test: |` and an indented spec path
 * under it, and run `node scripts/signature-field.mjs <file> test --runnable`.
 * Before: it printed nothing (the value was "|"). Now: it prints the block.
 */

function read(body: string, field: string, runnable = false): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'sigfield-'));
  const file = path.join(dir, 'body.md');
  writeFileSync(file, body);
  const args = ['scripts/signature-field.mjs', file, field, ...(runnable ? ['--runnable'] : [])];
  return execFileSync(process.execPath, args, { encoding: 'utf8' });
}

const sig = (lines: string) => `## Signature\n\n\`\`\`yaml\nkind: structural\nsubject: x\n${lines}\n\`\`\`\n`;

test.describe('signature-field.mjs block values (#1588)', () => {
  test("a `test: |` block is read as its lines, and --runnable finds the spec in it (#852's shape)", () => {
    const body = sig([
      'test: |',
      '  tests/behaviors/progress-fill.spec.ts guards the one confirmed casualty (#848).',
      '  No spec covers the input/textarea/img/audio finding.',
      'fix: one line',
    ].join('\n'));
    expect(read(body, 'test')).toBe(
      'tests/behaviors/progress-fill.spec.ts guards the one confirmed casualty (#848).\n' +
      'No spec covers the input/textarea/img/audio finding.');
    expect(read(body, 'test', true), 'a block naming a spec is runnable').toContain('tests/behaviors/progress-fill.spec.ts');
    expect(read(body, 'fix'), 'the block must stop at the next field').toBe('one line');
  });

  test('a block of prose names no runnable test', () => {
    const body = sig('test: |\n  a spec is still wanted for this\nfix: x');
    expect(read(body, 'test')).toBe('a spec is still wanted for this');
    expect(read(body, 'test', true)).toBe('');
  });

  test('a block with a node command on a later line is runnable', () => {
    const body = sig('test: |-\n  run the self-test:\n  node scripts/test-free-port.mjs\nfix: x');
    expect(read(body, 'test', true)).toContain('node scripts/test-free-port.mjs');
  });

  test('a folded `>` block joins its lines with spaces', () => {
    const body = sig('test: >\n  tests/regression/a.spec.ts\n  covers it\nfix: x');
    expect(read(body, 'test')).toBe('tests/regression/a.spec.ts covers it');
  });

  test('the one-line forms read as before', () => {
    expect(read(sig('test: tests/regression/a.spec.ts\nfix: y'), 'test')).toBe('tests/regression/a.spec.ts');
    expect(read(sig('test: "tests/regression/a.spec.ts"\nfix: y'), 'test')).toBe('tests/regression/a.spec.ts');
    expect(read(sig('test: null\nfix: y'), 'test')).toBe('');
  });

  test('an empty test: still does not swallow the fix: line beneath it', () => {
    expect(read(sig('test:\nfix: the fix line'), 'test')).toBe('');
    expect(read(sig('test:\nfix: the fix line'), 'fix')).toBe('the fix line');
  });
});
