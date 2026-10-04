/**
 * Guard for #1194: a --grep pattern given to `npm run test:async` must reach
 * Playwright as exactly ONE argument, whatever characters it contains.
 *
 * The runner used to start Playwright through a shell with the arguments joined
 * unquoted, so "|" became a pipe and spaces split the pattern. This guard:
 *   - runs the launcher's real invocation against a FAKE Playwright CLI that
 *     writes down exactly the arguments it was given, for patterns containing
 *     every shell-special character it could meet, and requires them verbatim;
 *   - runs the OLD way (shell: true) against the same recorder and requires it to
 *     mangle at least one of them, so a pass above proves something;
 *   - confirms the real Playwright CLI resolves to a file, and that
 *     scripts/test-async.mjs no longer asks for a shell.
 * Node-only, well under a second.
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { playwrightCli, playwrightInvocation } from './lib/playwright-launch.mjs';

let passed = 0;
let failed = 0;
const check = (ok, name, detail = '') => {
  if (ok) { passed++; console.log(`  ✅ ${name}`); }
  else { failed++; console.log(`  ❌ ${name}${detail ? `\n     ${detail}` : ''}`); }
};

const HERE = dirname(fileURLToPath(import.meta.url));
const dir = mkdtempSync(join(tmpdir(), 'wb-launch-'));
const fakeCli = join(dir, 'fake-playwright-cli.mjs');
const recorded = join(dir, 'received.json');
writeFileSync(fakeCli,
  "import { writeFileSync } from 'node:fs';\n" +
  "writeFileSync(process.env.FAKE_OUT, JSON.stringify(process.argv.slice(2)));\n");

// Patterns a person or an agent really writes, plus every shell-special character.
const PATTERNS = [
  'a|b',
  'Live examples render|particle effects|x',
  'two words',
  'has "double" quotes',
  "has 'single' quotes",
  'amp & amp',
  'both && and ||',
  'percent %PATH% sign',
  'caret ^ and ^^',
  'redirect > out.txt',
  'redirect < in.txt',
  'semi ; colon',
  'back\\slash',
  'dollar $HOME',
  'backtick-free (parens) [brackets] {braces}',
  'unicode ✓ é',
  'trailing space ',
  '--grep=pipe|in-equals-form',
  '',
];

/**
 * What the fake CLI recorded, or null if it recorded nothing readable.
 *
 * #1367: the shell:true control below hands cmd.exe patterns containing & and |,
 * which it splits into two commands running at once. Both can write the
 * recorder file, and a shorter write over a longer one leaves something like
 * ["test","--grep","amp"]nt","%PATH%","sign"] -- unparseable. That is exactly a
 * mangled launch, which the control counts; parsing it unguarded crashed the
 * whole gate self-test instead. An unreadable recording is "not what was sent".
 */
function read() {
  if (!existsSync(recorded)) return null;
  try {
    return JSON.parse(readFileSync(recorded, 'utf8'));
  } catch {
    return null;
  }
}

try {
  console.log('The async runner hands Playwright its arguments verbatim (#1194):');

  const saved = process.env.WB_PLAYWRIGHT_CLI;
  process.env.WB_PLAYWRIGHT_CLI = fakeCli;
  try {
    for (const pattern of PATTERNS) {
      rmSync(recorded, { force: true });
      const given = ['--workers=1', '--grep', pattern];
      const { command, args } = playwrightInvocation(['playwright', 'test', ...given]);
      const r = spawnSync(command, args, { env: { ...process.env, FAKE_OUT: recorded }, encoding: 'utf8' });
      const want = ['test', ...given];
      const got = read();
      check(r.status === 0 && JSON.stringify(got) === JSON.stringify(want),
        `pattern ${JSON.stringify(pattern)} arrives as one argument`,
        `wanted ${JSON.stringify(want)}\n     got    ${JSON.stringify(got)}  (exit ${r.status}, ${String(r.stderr).trim().slice(0, 120)})`);
    }

    // A spec path and a numeric flag still pass through in order.
    rmSync(recorded, { force: true });
    const { command, args } = playwrightInvocation(['playwright', 'test', '--workers=8', 'tests/a.spec.ts', '--repeat-each=3']);
    spawnSync(command, args, { env: { ...process.env, FAKE_OUT: recorded } });
    check(JSON.stringify(read()) === JSON.stringify(['test', '--workers=8', 'tests/a.spec.ts', '--repeat-each=3']),
      'a spec path and flags keep their order', JSON.stringify(read()));

    // Control: the OLD way (a shell and unquoted joining) must mangle something, or the
    // checks above would pass on code that never fixed anything.
    let mangled = 0;
    for (const pattern of PATTERNS) {
      rmSync(recorded, { force: true });
      const given = ['test', '--grep', pattern];
      spawnSync(process.execPath, [fakeCli, ...given], { shell: true, env: { ...process.env, FAKE_OUT: recorded }, stdio: 'ignore' });
      if (JSON.stringify(read()) !== JSON.stringify(given)) mangled += 1;
    }
    check(mangled >= 5, 'control: the old shell: true launch mangles the same patterns', `only ${mangled} of ${PATTERNS.length} were mangled`);
  } finally {
    if (saved === undefined) delete process.env.WB_PLAYWRIGHT_CLI; else process.env.WB_PLAYWRIGHT_CLI = saved;
  }

  console.log('\nThe real launcher uses it:');
  check(existsSync(playwrightCli()), 'Playwright\'s CLI resolves to a real file', playwrightCli());
  const source = readFileSync(join(HERE, 'test-async.mjs'), 'utf8');
  check(/playwrightInvocation/.test(source), 'test-async.mjs builds the command with playwrightInvocation');
  check(!/shell:\s*true/.test(source), 'test-async.mjs no longer asks for a shell');
  check(!/spawn\(\s*["']npx["']/.test(source), 'test-async.mjs no longer starts Playwright through npx');
} finally {
  rmSync(dir, { recursive: true, force: true });
}

console.log(`\n${failed ? '❌' : '✅'} ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
