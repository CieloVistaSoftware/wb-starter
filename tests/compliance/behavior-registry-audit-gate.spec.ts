/**
 * The behavior registry audit runs in CI, and any new disagreement fails it (#831).
 *
 * scripts/audit-behavior-registry.mjs cross-checks every place a behavior can
 * be bound to a selector: tag-map.js's three maps, wb-lazy.js's tables,
 * SEMANTIC_PROPERTY_ATTRIBUTES, the [x-{name}] route wb-lazy.js computes from
 * index.js (#1642), behaviorModules and the schemas. It had a --gate flag and
 * nothing ran it, so WB_LAZY_ONLY_ATTRIBUTES grew from 42 keys to 45 while the
 * audit sat in package.json as `npm run audit:behavior-registry`.
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

test('a new entry in the wb-lazy table fails the gate', () => {
  // Copy just what the audit reads into a scratch root and add one line to
  // WB_LAZY_ONLY_ATTRIBUTES: the #667 failure, a behavior registered in the
  // second registry instead of tag-map.js (or left to the computed route).
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'registry-audit-'));
  try {
    for (const rel of [
      'src/core/tag-map.js', 'src/core/wb-lazy.js', 'src/core/semantic-attributes.js',
      'src/core/replacement-guard.js', 'src/core/attribute-aliases.js', 'src/wb-viewmodels/index.js',
    ]) {
      fs.mkdirSync(path.dirname(path.join(scratch, rel)), { recursive: true });
      fs.copyFileSync(path.join(ROOT, rel), path.join(scratch, rel));
    }
    fs.cpSync(path.join(ROOT, 'src/wb-models'), path.join(scratch, 'src/wb-models'), { recursive: true });

    const lazy = path.join(scratch, 'src/core/wb-lazy.js');
    const src = fs.readFileSync(lazy, 'utf8');
    const decl = 'export const WB_LAZY_ONLY_ATTRIBUTES = {';
    expect(src).toContain(decl);
    fs.writeFileSync(lazy, src.replace(decl, `${decl}\n  'x-divider': 'divider',`));

    const seeded = spawnSync(process.execPath, [AUDIT, '--root', scratch, '--gate'], { encoding: 'utf8' });
    expect(seeded.stdout).toContain('NEW    lazyOnly: divider');
    expect(seeded.status).toBe(1);
  } finally {
    fs.rmSync(scratch, { recursive: true, force: true });
  }
});
