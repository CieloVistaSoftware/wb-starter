/**
 * Guard for #1073: every local test run gets a port of its own, and a run that
 * cannot get one refuses to start instead of falling back to a shared 3310.
 *
 * Two levels:
 *
 *   playwright.config.ts itself — transpiled with the repo's own TypeScript and
 *   imported by N concurrent node processes, exactly as N concurrent Playwright
 *   runs would evaluate it:
 *     - every run gets a real port, and no two concurrent runs get the same one;
 *     - each run's port is claimed in the shared coordination dir while it lives,
 *       and the claim goes away when it exits;
 *     - when the OS port probe cannot run, loading the config THROWS with the
 *       reason. Before the fix it silently returned 3310 (#961/#1072/#1079).
 *
 *   scripts/lib/free-port.mjs — with an injected probe, so the race the claim
 *   exists for can be forced deterministically: the OS hands two runs the same
 *   number and only one may keep it.
 *
 * Node-only, a few seconds. Uses a private claim dir; never touches ~/.wb-starter.
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

let passed = 0;
let failed = 0;
const check = (ok, name, detail = '') => {
  if (ok) { passed++; console.log(`  ✅ ${name}`); }
  else { failed++; console.log(`  ❌ ${name}${detail ? `\n     ${detail}` : ''}`); }
};

const scratch = mkdtempSync(join(tmpdir(), 'wb-port-scratch-'));
// Must sit in the repo root: the config resolves ./scripts/... relative to itself.
const probeConfig = join(ROOT, `.free-port-guard-config-${process.pid}.mjs`);

const EVALUATOR =
  "if (process.env.WB_GUARD_BREAK_CHILDREN) process.env.NODE_OPTIONS = '--import=' + process.env.WB_GUARD_BREAK_CHILDREN;" +
  "try { const m = await import(process.env.WB_GUARD_CONFIG_URL); console.log('PORT ' + m.default.webServer.port); }" +
  "catch (e) { console.log('THREW ' + JSON.stringify(String(e && e.message || e))); }" +
  "process.stdin.resume(); process.stdin.on('end', () => process.exit(0));";

function evaluate(extraEnv = {}) {
  // Claims land in <WB_TEST_LOCK_DIR>/ports: point it at a private dir, never ~/.wb-starter.
  const env = { ...process.env, WB_TEST_LOCK_DIR: claimDirParent, WB_GUARD_CONFIG_URL: pathToFileURL(probeConfig).href, ...extraEnv };
  delete env.WB_TEST_PORT;
  delete env.CI;
  delete env.NODE_OPTIONS;
  const child = spawn(process.execPath, ['--input-type=module', '-e', EVALUATOR], { cwd: ROOT, env, stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
  let out = '';
  child.stdout.on('data', (d) => { out += d; });
  child.stderr.on('data', (d) => { out += d; });
  const answered = new Promise((res) => {
    const t = setTimeout(() => res({ kind: 'TIMEOUT', value: out }), 60000);
    child.stdout.on('data', () => {
      const m = /^(PORT|THREW) (.*)$/m.exec(out);
      if (m) { clearTimeout(t); res({ kind: m[1], value: m[1] === 'PORT' ? Number(m[2]) : JSON.parse(m[2]) }); }
    });
  });
  const exited = new Promise((res) => child.on('exit', res));
  return { child, answered, exited, finish: () => { child.stdin.end(); return exited; } };
}

const claimDirParent = mkdtempSync(join(tmpdir(), 'wb-port-lockdir-'));
const portsDir = join(claimDirParent, 'ports');
const claimsNow = () => (existsSync(portsDir) ? readdirSync(portsDir).filter((f) => f.endsWith('.claim')) : []);

try {
  const src = readFileSync(join(ROOT, 'playwright.config.ts'), 'utf8');
  const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  writeFileSync(probeConfig, js);

  console.log('playwright.config.ts gives every concurrent local run its own port (#1073):');
  const N = 4;
  const runs = Array.from({ length: N }, () => evaluate());
  const answers = await Promise.all(runs.map((r) => r.answered));
  const ports = answers.map((a) => (a.kind === 'PORT' ? a.value : null));
  check(answers.every((a) => a.kind === 'PORT' && Number.isInteger(a.value) && a.value > 0),
    `each of ${N} concurrent config evaluations picks a port without throwing`, JSON.stringify(answers));
  check(new Set(ports).size === N, `the ${N} concurrent runs got ${N} different ports`, `ports: ${ports.join(', ')}`);
  check(!ports.includes(3310), 'none of them is the old hardcoded fallback 3310', `ports: ${ports.join(', ')}`);

  const held = claimsNow();
  const heldByOwner = runs.every((r, i) => {
    const f = join(portsDir, `${ports[i]}.claim`);
    try { return JSON.parse(readFileSync(f, 'utf8')).pid === r.child.pid; } catch { return false; }
  });
  check(heldByOwner, 'while a run lives, its port is claimed in the shared dir under its own pid',
    `claims present: ${JSON.stringify(held)}`);

  await Promise.all(runs.map((r) => r.finish()));
  check(claimsNow().length === 0, 'when the runs exit, their claims are released', JSON.stringify(claimsNow()));

  console.log('A run that cannot get an isolated port refuses to start (#1073):');
  // Break every node child the config spawns, the way a broken probe would.
  const breaker = join(scratch, 'break-probe.mjs');
  writeFileSync(breaker, "throw new Error('guard: the port probe child cannot start');\n");
  const broken = evaluate({ WB_GUARD_BREAK_CHILDREN: pathToFileURL(breaker).href });
  const b = await broken.answered;
  await broken.finish();
  check(b.kind === 'THREW', 'loading the config throws instead of choosing a port',
    `got ${b.kind} ${JSON.stringify(b.value)}`);
  check(b.kind === 'THREW' && /port/i.test(b.value) && /probe/i.test(b.value),
    'and the error says the port probe failed', JSON.stringify(b.value));
} finally {
  rmSync(probeConfig, { force: true });
}

console.log('scripts/lib/free-port.mjs closes the probe-to-bind window (#1073):');
let lib = null;
try { lib = await import(pathToFileURL(join(ROOT, 'scripts', 'lib', 'free-port.mjs')).href); }
catch (e) { check(false, 'scripts/lib/free-port.mjs loads', String(e && e.message || e)); }
if (lib) {
  const dir = mkdtempSync(join(tmpdir(), 'wb-port-unit-'));
  try {
    const seq = (...ps) => { let i = 0; return () => ps[Math.min(i++, ps.length - 1)]; };
    const alive = new Set([111, 222]);
    const isAlive = (pid) => alive.has(pid);

    const a = lib.claimFreePort({ dir, pid: 111, probe: seq(40001), isAlive });
    const b = lib.claimFreePort({ dir, pid: 222, probe: seq(40001, 40001, 40002), isAlive });
    check(a.port === 40001 && b.port === 40002,
      'when the OS hands two live runs the same port, the second one moves on', `a=${a.port} b=${b.port}`);

    let threw = null;
    let got = null;
    try { got = lib.claimFreePort({ dir, pid: 333, probe: seq(40001), isAlive, attempts: 5 }); }
    catch (e) { threw = e; }
    check(!!threw && /isolated test port/.test(threw.message) && !got,
      'when every candidate is held by a live run it throws, never returns a shared port',
      threw ? threw.message : `returned ${got && got.port}`);

    alive.delete(111);
    const c = lib.claimFreePort({ dir, pid: 444, probe: seq(40001), isAlive });
    check(c.port === 40001, 'a claim left by a dead run is reaped and the port reused', `got ${c.port}`);

    a.release();
    check(existsSync(join(dir, '40001.claim')), "release() never removes another run's claim");
    c.release();
    b.release();
    check(readdirSync(dir).length === 0, 'release() removes its own claim', JSON.stringify(readdirSync(dir)));

    let probeThrew = null;
    try { lib.claimFreePort({ dir, probe: () => { throw new Error('the OS port probe failed: boom'); } }); }
    catch (e) { probeThrew = e; }
    check(!!probeThrew && /probe failed/.test(probeThrew.message), 'a failing OS probe is reported, not swallowed',
      probeThrew ? probeThrew.message : 'no throw');

    const real = lib.probeFreePort();
    check(Number.isInteger(real) && real > 0 && real < 65536, 'the real OS probe returns a usable port', String(real));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

rmSync(scratch, { recursive: true, force: true });
rmSync(claimDirParent, { recursive: true, force: true });

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
