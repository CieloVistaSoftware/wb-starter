import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * #983: a since-deleted generator emitted its own injectAndScan() into ~40
 * specs. One template, ~40 copies of the same defects: a blind
 * waitForTimeout(500) after the scan, and a dead "Force eager loading" block
 * (it matched nothing, and would have thrown on setAttribute('', '')). The
 * template was fixed in 8855c5c8; the copies never were.
 *
 * There is now ONE helper, tests/helpers/inject-and-scan.ts, which waits on
 * WB.scan() and wbIdle() instead of a clock. A spec may keep its own copy only
 * when it genuinely does something else, listed here with the reason.
 */
const SHARED = 'tests/helpers/inject-and-scan.ts';
const OWN_COPY: Record<string, string> = {
  'tests/behaviors/grid-attributes-effect.spec.ts': 'sizes the container to 600px and settles on the first child',
  'tests/cards/cardvideo-aspect-ratio.spec.ts': 'loads no page first, uses its own host, scans eagerly',
  'tests/regression/regression-tests.spec.ts': 'takes the container id as an argument, waits up to 30s for WB, scans eagerly',
  'tests/regression/x-switch-lazy-schema.spec.ts': 'replaces any existing container and waits for x-schema per element',
};

function files(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'node_modules') files(p, out); }
    else if (/\.(ts|js|mjs)$/.test(e.name)) out.push(p);
  }
  return out;
}

test('one injectAndScan, and no copy sleeps or carries the dead eager block (#983)', () => {
  const root = process.cwd();
  const defining: string[] = [];
  const dead: string[] = [];
  for (const file of files(path.join(root, 'tests'))) {
    const rel = path.relative(root, file).split(path.sep).join('/');
    if (rel === 'tests/compliance/one-inject-and-scan.spec.ts') continue; // names the block it forbids
    const src = fs.readFileSync(file, 'utf8');
    if (/function\s+injectAndScan\s*\(/.test(src)) defining.push(rel);
    if (/Force eager loading/.test(src)) dead.push(`${rel}: dead "Force eager loading" block`);
  }
  expect(defining, 'the shared helper exists').toContain(SHARED);
  const stray = defining.filter((f) => f !== SHARED && !OWN_COPY[f]);
  expect(stray, `import ${SHARED} instead of defining a local injectAndScan`).toEqual([]);
  expect(dead).toEqual([]);

  const helper = fs.readFileSync(path.join(root, SHARED), 'utf8');
  expect(helper, 'the shared helper must wait on a signal, not a clock').not.toMatch(/waitForTimeout\(/);
  for (const f of Object.keys(OWN_COPY)) {
    const body = fs.readFileSync(path.join(root, f), 'utf8');
    expect(body, `${f}: a listed copy must not sleep after its scan`).not.toMatch(/injectAndScan[\s\S]{0,1500}?waitForTimeout\(500\)/);
  }
});

test('every listed own copy still exists (#983)', () => {
  const gone = Object.keys(OWN_COPY).filter((f) => !fs.existsSync(path.join(process.cwd(), f))
    || !/function\s+injectAndScan\s*\(/.test(fs.readFileSync(path.join(process.cwd(), f), 'utf8')));
  expect(gone, 'remove these from OWN_COPY').toEqual([]);
});
