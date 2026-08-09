import { execSync } from 'child_process';

// Get all remote branches NOT merged into main
const raw = execSync('git branch -r --no-merged main', { encoding: 'utf8' }).trim();
const branches = raw.split('\n')
  .map(b => b.trim())
  .filter(b => b.startsWith('origin/') && !b.includes('HEAD') && !b.endsWith('/main'));

console.log(`Found ${branches.length} unmerged remote branches to delete:\n`);

const deleteCommands = branches.map(b => {
  const short = b.replace('origin/', '');
  return `git push origin --delete ${short}`;
});

deleteCommands.forEach(c => console.log(c));

console.log(`\n--- Executing deletions ---\n`);

let deleted = 0;
let failed = 0;
for (const cmd of deleteCommands) {
  try {
    execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
    console.log(`✅ ${cmd}`);
    deleted++;
  } catch (e) {
    console.log(`❌ ${cmd} — ${e.message.split('\n')[0]}`);
    failed++;
  }
}

console.log(`\nDone: ${deleted} deleted, ${failed} failed.`);
