/**
 * Guard for scripts/lib/pages-deploy-state.mjs (#1361): the deployed-smoke gate
 * judges a deploy by the Actions run for main's head, and never calls a
 * cancelled (superseded) build a failure.
 *
 *   node scripts/test-pages-deploy-state.mjs   (npm run test:pages-deploy-state)
 */
import { pagesDeployState } from './lib/pages-deploy-state.mjs';

let passed = 0;
let failed = 0;
function check(name, actual, expected) {
  if (actual === expected) { passed++; console.log(`  ✅ ${name}`); }
  else { failed++; console.log(`  ❌ ${name}\n     expected ${expected}, got ${actual}`); }
}

const HEAD = '62545f26c1a07ca6eed85c860876187a92091b55';
const OLD = '08892483aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const run = (headSha, status, conclusion) => ({ headSha, status, conclusion });

console.log('pages-deploy-state (#1361):');

// The case that produced the false alarm on 2026-10-04: a cancelled sibling
// beside a successful run for the same head commit.
check('cancelled + success for head -> built (the 2026-10-04 false alarm)',
  pagesDeployState([run(HEAD, 'completed', 'cancelled'), run(HEAD, 'completed', 'success')], HEAD).state, 'built');
check('success for head -> built', pagesDeployState([run(HEAD, 'completed', 'success')], HEAD).state, 'built');
check('only cancelled for head -> waiting, never errored',
  pagesDeployState([run(HEAD, 'completed', 'cancelled')], HEAD).state, 'waiting');
check('in progress for head -> building', pagesDeployState([run(HEAD, 'in_progress', null)], HEAD).state, 'building');
check('queued for head -> building', pagesDeployState([run(HEAD, 'queued', null)], HEAD).state, 'building');
check('cancelled + in progress for head -> building',
  pagesDeployState([run(HEAD, 'completed', 'cancelled'), run(HEAD, 'in_progress', null)], HEAD).state, 'building');
check('failure for head -> errored', pagesDeployState([run(HEAD, 'completed', 'failure')], HEAD).state, 'errored');
check('timed_out for head -> errored', pagesDeployState([run(HEAD, 'completed', 'timed_out')], HEAD).state, 'errored');
check('a success for an OLDER commit does not count -> waiting',
  pagesDeployState([run(OLD, 'completed', 'success')], HEAD).state, 'waiting');
check('a failure for an OLDER commit does not count -> waiting',
  pagesDeployState([run(OLD, 'completed', 'failure')], HEAD).state, 'waiting');
check('no runs at all -> waiting', pagesDeployState([], HEAD).state, 'waiting');

console.log(`\n${failed === 0 ? '✅' : '❌'} ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
