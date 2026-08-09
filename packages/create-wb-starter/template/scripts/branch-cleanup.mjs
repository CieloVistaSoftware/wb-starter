import { execSync } from 'child_process';

// Get all remote branches except main and HEAD
const raw = execSync('git branch -r', { encoding: 'utf8' }).trim().split('\n')
  .map(b => b.trim())
  .filter(b => !b.includes('HEAD') && !b.endsWith('/main'));

console.log(`Deleting ${raw.length} remote branches...`);

let deleted = 0;
let failed = 0;

for (const branch of raw) {
  const short = branch.replace('origin/', '');
  try {
    execSync(`git push origin --delete ${short}`, { encoding: 'utf8', stdio: 'pipe' });
    deleted++;
    console.log(`✅ ${short}`);
  } catch (e) {
    failed++;
    console.log(`❌ ${short} — ${e.message.split('\n')[0]}`);
  }
}

// Clean up local tracking refs
execSync('git remote prune origin', { encoding: 'utf8' });

// Delete local branches except main
const local = execSync('git branch', { encoding: 'utf8' }).trim().split('\n')
  .map(b => b.trim().replace('* ', ''))
  .filter(b => b !== 'main');

let localDeleted = 0;
for (const branch of local) {
  try {
    execSync(`git branch -D ${branch}`, { encoding: 'utf8', stdio: 'pipe' });
    localDeleted++;
  } catch (e) { /* skip */ }
}

console.log(`\nDone: ${deleted} remote deleted, ${failed} failed, ${localDeleted} local cleaned up`);
