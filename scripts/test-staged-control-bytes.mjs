/**
 * Guard for #1162: the pre-commit check refuses exactly the staged source files
 * that carry a stray control byte.
 *
 * Node-only, a few seconds, throwaway git repos only. Every fixture byte is
 * built with Buffer.from([...]) so this file itself carries none.
 *
 * Parameters (every value runs, nothing hand-picked):
 *   byte      : every value 0x00-0x1F, plus 0x7F     (TAB, LF, CR must pass)
 *   placement : scanned root file | root entry index.html | unscanned extension |
 *               skipped directory | outside the roots
 *   state     : staged | staged then fixed on disk | clean staged, dirty on disk |
 *               staged deletion
 * Oracle: a finding (and exit 1) exactly when a forbidden byte is in the INDEX
 * copy of a scanned path, named with the right line and column; otherwise exit 0.
 *
 * Plus: the hook runs the check in its fast section, and the compliance spec
 * takes its rule from the same module, so the two cannot drift (#1049).
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { Buffer } from 'node:buffer';
import { findControlBytes, isForbiddenByte } from './lib/control-bytes.mjs';
import { suiteEnv } from './lib/suite-env.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = join(ROOT, 'scripts', 'check-staged-control-bytes.mjs');
const NL = String.fromCharCode(10);

let passed = 0;
let failed = 0;
const check = (ok, name, detail = '') => {
  if (ok) { passed++; console.log(`  ✅ ${name}`); }
  else { failed++; console.log(`  ❌ ${name}${detail ? `${NL}     ${detail}` : ''}`); }
};

// The guard runs inside the hook, whose GIT_DIR names the REAL repo (#1161).
const env = suiteEnv(process.env);
const scratch = [];

function repo() {
  const dir = mkdtempSync(join(tmpdir(), 'wb-control-bytes-'));
  scratch.push(dir);
  const git = (...a) => execFileSync('git', a, { cwd: dir, env, stdio: 'pipe', encoding: 'utf8' });
  git('init', '-q', '-b', 'main');
  git('config', 'user.email', 'guard@example.invalid');
  git('config', 'user.name', 'guard');
  git('config', 'core.autocrlf', 'false');
  const put = (rel, bytes) => {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), Buffer.from(bytes));
  };
  return { dir, git, put };
}

const ascii = (s) => [...s].map((c) => c.charCodeAt(0));
/** "line one\nconst a = 1;<byte>\n": the byte sits on line 2, column 13. */
const withByte = (byte) => [...ascii('line one'), 0x0a, ...ascii('const a = 1;'), byte, 0x0a];
const clean = () => [...ascii('const a = 1;'), 0x0a];

function runCheck(dir) {
  const r = spawnSync(process.execPath, [CHECK], { cwd: dir, env, encoding: 'utf8' });
  const text = `${r.stdout}${r.stderr}`;
  const findings = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => /^\S+:\d+:\d+ /.test(l));
  return { status: r.status, findings, text };
}

// ── 1. Every byte value, in a scanned file, staged ───────────────────────────
console.log('every byte value 0x00-0x1F and 0x7F, staged in src/');
{
  const { dir, git, put } = repo();
  put('README.txt', clean());
  git('add', '-A'); git('commit', '-q', '-m', 'base');

  const bytes = [...Array(0x20).keys(), 0x7f];
  for (const b of bytes) put(`src/byte-${b.toString(16).padStart(2, '0')}.js`, withByte(b));
  git('add', '-A');

  const { status, findings, text } = runCheck(dir);
  for (const b of bytes) {
    const file = `src/byte-${b.toString(16).padStart(2, '0')}.js`;
    const hits = findings.filter((f) => f.startsWith(`${file}:`));
    const forbidden = ![0x09, 0x0a, 0x0d].includes(b);
    if (forbidden) {
      const lineTwo = b === 0x0a ? false : hits.some((h) => h.startsWith(`${file}:2:13 `));
      check(hits.length === 1 && lineTwo, `0x${b.toString(16).padStart(2, '0')} is reported at ${file}:2:13`, hits.join(' | ') || 'not reported');
    } else {
      check(hits.length === 0, `0x${b.toString(16).padStart(2, '0')} (TAB/LF/CR) is allowed`, hits.join(' | '));
    }
  }
  check(status === 1, 'exits 1 when anything is found', `exit ${status}; ${text.slice(0, 200)}`);
}

// ── 2. Placement: only the paths the compliance sweep covers ─────────────────
console.log('\nplacement');
const PLACEMENTS = [
  ['src/a.js', true], ['scripts/lib/b.mjs', true], ['tests/c.spec.ts', true], ['pages/d.html', true],
  ['demos/e.css', true], ['src/f.json', true], ['index.html', true], ['project-index.html', true],
  ['src/image.png', false], ['src/notes.md', false], ['tests/node_modules/pkg/x.js', false],
  ['scripts/.claude/y.js', false], ['docs/z.js', false], ['other/w.html', false], ['root.js', false],
];
for (const [rel, scanned] of PLACEMENTS) {
  const { dir, git, put } = repo();
  put('README.txt', clean());
  git('add', '-A'); git('commit', '-q', '-m', 'base');
  put(rel, withByte(0x1b));
  git('add', '-A');
  const { status, findings } = runCheck(dir);
  const reported = findings.some((f) => f.startsWith(`${rel}:`));
  check(reported === scanned && status === (scanned ? 1 : 0),
    `${rel} ${scanned ? 'is' : 'is not'} checked`, `reported ${reported}, exit ${status}`);
}

// ── 3. The index is what counts, not the working tree (#1065) ────────────────
console.log('\nindex versus working tree');
{
  const { dir, git, put } = repo();
  put('src/a.js', clean());
  git('add', '-A'); git('commit', '-q', '-m', 'base');
  put('src/a.js', withByte(0x08)); git('add', '-A');
  put('src/a.js', clean());                                  // fixed on disk, not restaged
  const r = runCheck(dir);
  check(r.status === 1 && r.findings.some((f) => f.startsWith('src/a.js:2:13 ')),
    'a byte still staged is refused even when the file on disk is fixed', `exit ${r.status}: ${r.findings.join(' | ')}`);
}
{
  const { dir, git, put } = repo();
  put('src/a.js', clean());
  git('add', '-A'); git('commit', '-q', '-m', 'base');
  put('src/b.js', clean()); git('add', '-A');
  put('src/b.js', withByte(0x08));                           // only in an unstaged edit
  const r = runCheck(dir);
  check(r.status === 0 && r.findings.length === 0,
    'a byte only in an unstaged edit is not this commit\'s problem', `exit ${r.status}: ${r.findings.join(' | ')}`);
}
{
  const { dir, git, put } = repo();
  put('src/a.js', withByte(0x1b));
  git('add', '-A'); git('commit', '-q', '-m', 'base with a bad byte');
  git('rm', '-q', 'src/a.js');
  const r = runCheck(dir);
  check(r.status === 0, 'a staged deletion of a bad file does not fail or crash', `exit ${r.status}: ${r.text.slice(0, 200)}`);
}
{
  const { dir, git, put } = repo();
  put('README.txt', clean());
  git('add', '-A'); git('commit', '-q', '-m', 'base');
  const r = runCheck(dir);
  check(r.status === 0, 'nothing staged exits 0', `exit ${r.status}: ${r.text.slice(0, 200)}`);
}

// ── 4. Line and column counting ──────────────────────────────────────────────
console.log('\nline and column');
{
  const buf = Buffer.from([0x61, 0x0a, 0x0a, 0x62, 0x63, 0x08, 0x0d, 0x0a, 0x1b]);
  const hits = findControlBytes(buf).map((h) => `${h.line}:${h.column}:${h.byte}`);
  check(hits.join(',') === '3:3:8,4:1:27', 'findControlBytes reports every byte with its own line and column', hits.join(','));
  check(!isForbiddenByte(0x20) && !isForbiddenByte(0x7e) && isForbiddenByte(0x7f), 'printable ASCII passes, DEL does not');
}

// ── 5. Wired where it is fast, and one rule for both checks ─────────────────
console.log('\nwiring');
{
  const hook = readFileSync(join(ROOT, '.husky', 'pre-commit'), 'utf8');
  const at = hook.indexOf('node scripts/check-staged-control-bytes.mjs || exit 1');
  const gate = hook.indexOf('COUNT_FILE=');
  check(at !== -1 && gate !== -1 && at < gate,
    'pre-commit runs the check in its fast section, before the 10th-commit gate', `check at ${at}, gate at ${gate}`);
  const spec = readFileSync(join(ROOT, 'tests', 'compliance', 'no-control-characters-in-source.spec.ts'), 'utf8');
  check(spec.includes('scripts/lib/control-bytes.mjs') && !/const ROOTS = \[/.test(spec),
    'the compliance spec takes its rule from scripts/lib/control-bytes.mjs, with no second copy');
}

for (const d of scratch) {
  try { rmSync(d, { recursive: true, force: true }); } catch { /* a locked temp dir is not a guard failure */ }
}
console.log(`${NL}${failed ? '❌' : '✅'} ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
