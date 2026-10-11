/**
 * The behavior registry audit runs in CI, and any new disagreement fails it (#831).
 *
 * scripts/audit-behavior-registry.mjs cross-checks every place a behavior can
 * be bound to a selector -- tag-map.js's maps and aliases, the one registry
 * since #831, and the [x-{name}] route wb-lazy.js computes from index.js
 * (#1642) -- against behaviorModules and the schemas, and reports a STRAY TABLE
 * when a selector is bound anywhere else under src/. It had a --gate flag and
 * nothing ran it, so wb-lazy.js's own WB_LAZY_ONLY_ATTRIBUTES table grew from
 * 42 keys to 45 while the audit sat in package.json as
 * `npm run audit:behavior-registry`.
 *
 * The findings that remain are in the audit's REVIEWED list, each with the
 * reason it stays for now. --gate exits 1 on a finding that is not in the
 * list (a new disagreement: fix it, or argue it in REVIEWED), and on a
 * REVIEWED entry that no longer occurs (it was fixed: delete the entry so the
 * list only shrinks).
 */
import { test, expect } from '../fixtures/offline';
import { spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const AUDIT = path.join(ROOT, 'scripts/audit-behavior-registry.mjs');

function runAudit(args: string[]) {
  const r = spawnSync(process.execPath, [AUDIT, ...args], { cwd: ROOT, encoding: 'utf8' });
  return { status: r.status, stdout: r.stdout, out: `${r.stdout}${r.stderr}` };
}

test('the registry audit passes --gate: every finding is reviewed and none is stale', () => {
  const { status, out } = runAudit(['--gate']);
  expect(status, `audit --gate failed. Its report:\n\n${out}`).toBe(0);
});

test('the audit reads every source, including the computed x-{name} route', () => {
  // Parse stdout alone: a CI runner that sets an inspector flag makes every
  // child node print "Debugger listening on ws://..." to stderr, and that
  // text after the JSON made JSON.parse throw at the JSON's last byte.
  const { status, stdout, out } = runAudit(['--json']);
  expect(status, out).toBe(0);
  const result = JSON.parse(stdout);
  expect(result.missingMaps, 'a map was renamed or moved, so the audit is blind to it').toEqual([]);
  // If the computed route stopped being read, these behaviors would fall back
  // to UNREACHABLE and the gate would fail on them by name. This states the
  // model directly: dozens of behaviors are reachable only through it.
  expect(result.computedOnly.length).toBeGreaterThan(40);
  expect(result.computedOnly).toEqual(expect.arrayContaining(['sidebar', 'list', 'divider', 'hotkey']));
});

/** Copy just what the audit reads into a scratch root. */
function scratchRoot(): string {
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'registry-audit-'));
  fs.cpSync(path.join(ROOT, 'src/core'), path.join(scratch, 'src/core'), { recursive: true });
  for (const rel of ['src/wb-viewmodels/index.js']) {
    fs.mkdirSync(path.dirname(path.join(scratch, rel)), { recursive: true });
    fs.copyFileSync(path.join(ROOT, rel), path.join(scratch, rel));
  }
  fs.cpSync(path.join(ROOT, 'src/wb-models'), path.join(scratch, 'src/wb-models'), { recursive: true });
  return scratch;
}

test('a selector table outside tag-map.js fails the gate', () => {
  // The #667 failure: a behavior registered in a second table beside
  // tag-map.js. Seed the shape WB_LAZY_ONLY_ATTRIBUTES had, and a hard-coded
  // mapping like the <button-tooltip> binding #921 removed.
  const scratch = scratchRoot();
  try {
    const lazy = path.join(scratch, 'src/core/wb-lazy.js');
    fs.writeFileSync(lazy, `${fs.readFileSync(lazy, 'utf8')}
const SECOND_REGISTRY = {
  'x-divider': 'divider',
};
const MORE = [{ selector: 'button-tooltip', behavior: 'tooltip' }];
`);
    const seeded = spawnSync(process.execPath, [AUDIT, '--root', scratch, '--gate'], { encoding: 'utf8' });
    expect(seeded.stdout).toContain('NEW    strayTable: src/core/wb-lazy.js: x-divider');
    expect(seeded.stdout).toContain('NEW    strayTable: src/core/wb-lazy.js: button-tooltip');
    expect(seeded.status).toBe(1);
  } finally {
    fs.rmSync(scratch, { recursive: true, force: true });
  }
});

test('the old second registries are gone: tag-map.js is the only selector source', () => {
  const lazySrc = fs.readFileSync(path.join(ROOT, 'src/core/wb-lazy.js'), 'utf8');
  expect(lazySrc).not.toMatch(/const\s+WB_LAZY_ONLY_(ATTRIBUTES|ELEMENTS)\s*=/);
  expect(fs.existsSync(path.join(ROOT, 'src/core/semantic-attributes.js'))).toBe(false);
  // Both runtimes read their selectors from tag-map.js and nowhere else.
  for (const rel of ['src/core/wb.js', 'src/core/wb-lazy.js']) {
    const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    expect(src, rel).toMatch(/from '\.\/tag-map\.js'/);
    expect(src, rel).not.toMatch(/semantic-attributes|BEHAVIOR_ALIASES[^\n]*attribute-aliases/);
  }
});
