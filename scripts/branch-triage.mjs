import { execSync } from 'child_process';

const SEP = '^^^';
const fmt = `%(refname:short)${SEP}%(committerdate:short)${SEP}%(subject)`;
const raw = execSync(`git for-each-ref --sort=-committerdate refs/remotes/origin --format="${fmt}"`, { encoding: 'utf8' }).trim();
const merged = execSync('git branch -r --merged main', { encoding: 'utf8' }).trim().split('\n').map(s => s.trim());

const lines = raw.split('\n').filter(l => {
  const name = l.split(SEP)[0];
  return !merged.includes(name) && !name.includes('HEAD') && !name.endsWith('/main');
});

console.log('Branch | Date | Commits | Subject');
console.log('---|---|---|---');

for (const l of lines) {
  const [name, date, subj] = l.split(SEP);
  const short = name.replace('origin/', '');
  let commits = '?';
  try {
    commits = execSync(`git rev-list --count origin/main..${name}`, { encoding: 'utf8' }).trim();
  } catch (e) { /* skip */ }
  console.log(`${short} | ${date} | ${commits} | ${(subj || '').substring(0, 70)}`);
}
