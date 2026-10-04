import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

/**
 * #1143: pages/home.html said "generated from home-page.schema.json" while it
 * had been edited by hand into twice the generated length (130 lines against
 * 63; 147 lines differ). Running the documented command would have replaced it.
 * home.html now says it is hand-authored, and the generator refuses to
 * overwrite any page whose first line does not say it was generated.
 */
const GEN = path.resolve('scripts/generate-page-from-schema.mjs');
const SCHEMA = path.resolve('src/wb-models/home-page.schema.json');

// Run from the target's own temp directory: the generator also writes
// data/page-from-schema-result.json relative to its cwd, which in the repo is
// a tracked file this test must not touch.
function generate(target: string, extra: string[] = []) {
  return spawnSync(process.execPath, [GEN, SCHEMA, target, ...extra], { cwd: path.dirname(target), encoding: 'utf8' });
}

test('home.html does not claim to be generated (#1143)', () => {
  const first = fs.readFileSync('pages/home.html', 'utf8').split(/\r?\n/)[0];
  expect(first).not.toMatch(/generated from/i);
  expect(first).toMatch(/hand-authored/);
});

test('the generator refuses to overwrite a hand-authored page, and replaces a generated one (#1143)', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wb-1143-'));
  fs.mkdirSync(path.join(dir, 'data')); // where the generator writes its result file
  try {
    const hand = path.join(dir, 'hand.html');
    fs.writeFileSync(hand, '<!-- written by a person -->\n<p>keep me</p>\n');
    const refused = generate(hand);
    expect(refused.status, 'refuses: ' + refused.stderr).toBe(1);
    expect(fs.readFileSync(hand, 'utf8'), 'the hand-written page is untouched').toContain('keep me');

    const generated = path.join(dir, 'generated.html');
    fs.writeFileSync(generated, '<!-- Home Page — generated from home-page.schema.json -->\n<p>old</p>\n');
    const replaced = generate(generated);
    expect(replaced.status, replaced.stderr).toBe(0);
    expect(fs.readFileSync(generated, 'utf8')).not.toContain('<p>old</p>');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
