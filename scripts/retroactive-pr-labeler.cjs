#!/usr/bin/env node
// scripts/retroactive-pr-labeler.cjs
const {execSync} = require('child_process');
const fs = require('fs');
const MAX = parseInt(process.argv[2] || process.env.MAX_PR_CHECK || '50', 10);
const APPLY = process.argv.includes('--apply');
const OWNER = 'CieloVistaSoftware';
const REPO = 'wb-starter';
function run(cmd){
  try{ return execSync(cmd, {encoding: 'utf8'}).trim(); }catch(e){ return null; }
}
console.log(`Retroactive Tier-1 labeler — max=${MAX} apply=${APPLY}`);
const prsJson = run(`gh pr list --state open --json number,headRefName,headRefOid,labels -L ${MAX}`);
if(!prsJson) { console.error('failed to list PRs or no PRs'); process.exit(1); }
const prs = JSON.parse(prsJson).map(p => ({ number: p.number, headRefName: p.headRefName, headSha: p.headRefOid, labels: p.labels }));
let labeled = 0;
for(const pr of prs){
  const num = pr.number;
  const sha = pr.headSha;
  const hasLabel = (pr.labels||[]).some(l=>l.name==='needs-tests');
  const checksRaw = run(`gh api repos/${OWNER}/${REPO}/commits/${sha}/check-runs --paginate --jq '.check_runs'`);
  let tier1 = null;
  if(checksRaw){
    try{ const checks = JSON.parse(checksRaw); tier1 = checks.find(c=>/compliance|tier-?1/i.test(c.name)); }catch(e){ tier1 = null; }
  }
  const needs = (!tier1) || (tier1 && tier1.conclusion !== 'success');
  if(!needs){
    console.log(`#${num} - Tier-1 OK (${tier1 && tier1.conclusion})`);
    continue;
  }
  if(hasLabel){
    console.log(`#${num} - needs-tests label already present`);
    continue;
  }
  console.log(`#${num} - will label (Tier-1 missing/failed)`);
  if(APPLY){
    run(`gh pr edit ${num} --add-label needs-tests`);
    run(`gh issue comment ${num} --body "⚠️ Automated: Tier‑1 checks are missing/failing for this PR — please run \`npm test\` locally and fix failing tests before marking this PR ready for review. If debugging, convert to Draft and document failing test(s)."`);
    labeled++;
  }
}
console.log(`Done — labeled ${labeled} PR(s) (apply=${APPLY}).`);
if(!APPLY){ console.log('Run with --apply to actually add labels/comments.'); }
