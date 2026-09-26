/**
 * The known-failures register only ever shrinks.
 *
 * data/test-baseline-failures.json lets a commit through when nothing NEW fails
 * (#959). The note in .husky/pre-commit has always said "it only ever shrinks",
 * but nothing enforced it, so it grew into a parking lot of ~600 tests.
 * John: "I want all the failures to stop."
 *
 * This compares the STAGED register with HEAD's and refuses any added entry.
 * A new failure is fixed, never recorded. Removing entries (a fix) is always
 * allowed. Milliseconds, git only, no Playwright.
 *
 *   node scripts/check-register-shrinks.mjs            staged vs HEAD
 *   node scripts/check-register-shrinks.mjs <base-ref> working tree vs <base-ref>
 */
import { execFileSync } from 'child_process';
import { readFileSync } from 'fs';

const REGISTER = 'data/test-baseline-failures.json';

/** Entries of the register at a git object spec, or null if it is absent. */
function entriesAt(spec) {
  try {
    const raw = execFileSync('git', ['show', spec], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    return new Set(JSON.parse(raw).failures || []);
  } catch {
    return null;
  }
}

const baseRef = process.argv[2];
const before = entriesAt(`${baseRef || 'HEAD'}:${REGISTER}`);
const after = baseRef
  ? new Set(JSON.parse(readFileSync(REGISTER, 'utf8')).failures || [])
  : entriesAt(`:${REGISTER}`);

if (!before || !after) {
  // No register on one side: nothing to compare, and the ratchet itself
  // refuses to run without one.
  process.exit(0);
}

const added = [...after].filter((e) => !before.has(e));
const removed = [...before].filter((e) => !after.has(e));

if (added.length) {
  console.error(`\n❌ ${REGISTER} gained ${added.length} entr${added.length === 1 ? 'y' : 'ies'}.`);
  console.error('   The known-failures register only shrinks. Fix these tests instead:\n');
  for (const e of added.slice(0, 25)) console.error(`     • ${e}`);
  if (added.length > 25) console.error(`     … and ${added.length - 25} more`);
  console.error('');
  process.exit(1);
}

if (removed.length) {
  console.log(`✅ Known failures: ${before.size} -> ${after.size} (${removed.length} fixed)`);
}
