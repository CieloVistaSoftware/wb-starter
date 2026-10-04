/**
 * commit-msg hook body: refuse a commit whose message does not cite the issue
 * its branch is named for (#1336). See scripts/lib/commit-issue-match.mjs.
 *
 *   node scripts/check-commit-issue.mjs <path-to-commit-message-file>
 */
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { checkMessage } from './lib/commit-issue-match.mjs';

const file = process.argv[2];
if (!file) process.exit(0);

let branch = '';
try {
  branch = execFileSync('git', ['symbolic-ref', '--short', '-q', 'HEAD'], { encoding: 'utf8' }).trim();
} catch {
  process.exit(0); // detached HEAD: no branch, nothing to match against
}

const result = checkMessage(fs.readFileSync(file, 'utf8'), branch);
if (!result.ok) {
  console.error(`\n❌ Commit message does not match its branch (${branch}).\n`);
  console.error(result.reason + '\n');
  process.exit(1);
}
