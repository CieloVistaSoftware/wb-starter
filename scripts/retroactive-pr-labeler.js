#!/usr/bin/env node
// scripts/retroactive-pr-labeler.js (ESM)
// Safe retroactive labeler for Tier-1 checks (limited batch)
// Usage: node scripts/retroactive-pr-labeler.js [--max N] [--apply]

import { execSync } from 'child_process';
import fs from 'fs';
import { join } from 'path';

function getArgValue(name){
  for(const a of process.argv.slice(2)){
    if(a.startsWith(`--${name}=`)) return a.split('=')[1];
    if(a === `--${name}`){ const i = process.argv.indexOf(a); return process.argv[i+1]; }
    if(a.startsWith(`-${name[0]}=`)) return a.split('=')[1];
  }
  return null;
}

let MAX = parseInt(getArgValue('max') || getArgValue('limit') || process.env.MAX_PR_CHECK || '50', 10);
if (!Number.isFinite(MAX) || MAX <= 0) {
  console.warn(`Invalid --max value provided; falling back to 50`);
  MAX = 50;
}
const APPLY = process.argv.includes('--apply');
const OWNER = 'CieloVistaSoftware';
const REPO = 'wb-starter';


function run(cmd){
  try{ return execSync(cmd, {encoding: 'utf8'}).trim(); }catch(e){ return null; }
}

console.log(`Retroactive Tier-1 labeler — max=${MAX} apply=${APPLY}`);
// Use fields supported by gh CLI: headRefName (branch) and headRefOid (commit SHA)
const prsJson = run(`gh pr list --state open --json number,headRefName,headRefOid,labels -L ${MAX}`);
if(!prsJson) { console.error('failed to list PRs or no PRs'); process.exit(1); }
let prs;
try{ prs = JSON.parse(prsJson); }catch(e){ console.error('could not parse PR list JSON:', e.message); process.exit(1); }
let labeled = 0;
const reportRows = [];
for(const pr of prs){
  const num = pr.number;
  const sha = pr.headRefOid || pr.headSha || '';
  const headRef = pr.headRefName || pr.headRef || '';
  const hasLabel = (pr.labels||[]).some(l=>l.name==='needs-tests');
  const checksRaw = sha ? run(`gh api repos/${OWNER}/${REPO}/commits/${sha}/check-runs --paginate --jq '.check_runs'`) : null;
  let tier1 = null;
  if(checksRaw){
    try{ const checks = JSON.parse(checksRaw); tier1 = checks.find(c=>/compliance|tier-?1/i.test(c.name)); }catch(e){ /* ignore parse errors */ }
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
  reportRows.push({number: num, headRef, headSha: sha, reason: 'missing-or-failing-tier1'});
  if(APPLY){
    run(`gh pr edit ${num} --add-label needs-tests`);
    run(`gh issue comment ${num} --body "⚠️ Automated: Tier‑1 checks are missing/failing for this PR — please run \`npm test\` locally and fix failing tests before marking this PR ready for review. If debugging, convert to Draft and document failing test(s)."`);
    labeled++;
  }
}

// write a dry-run CSV report for auditing
try{
  const outDir = join(process.cwd(), 'data');
  if(!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const csvPath = join(outDir, 'retro-labeler-report.csv');
  if(reportRows.length){
    const csv = ['prNumber,headRef,headSha,reason', ...reportRows.map(r=>`${r.number},${r.headRef || ''},${r.headSha || ''},${r.reason}`)].join('\n');
    fs.writeFileSync(csvPath, csv, 'utf8');
    console.log(`Wrote dry-run report: ${csvPath}`);
  } else {
    // remove any previous report to avoid stale artifacts
    const maybe = join(outDir, 'retro-labeler-report.csv');
    try{ if(fs.existsSync(maybe)) fs.unlinkSync(maybe); }catch(e){}
  }
}catch(e){ console.warn('Could not write report CSV:', e.message); }

console.log(`Done — labeled ${labeled} PR(s) (apply=${APPLY}).`);
if(!APPLY){ console.log('Run with --apply to actually add labels/comments.'); }
