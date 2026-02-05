#!/usr/bin/env node
/* Lightweight benchmark to compare: (A) sequential playwright launches, (B) combined playwright invocation, (C) fast developer path
   - Runs a representative subset of projects to keep run-time reasonable: compliance, base, behaviors
   - Writes results to tmp/bench-results.json for attaching to PR
*/
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'tmp', 'bench-results.json');
if (!fs.existsSync(path.join(ROOT, 'tmp'))) fs.mkdirSync(path.join(ROOT, 'tmp'));

function runCmd(cmd, args, opts = {}) {
  const start = Date.now();
  const res = spawnSync(cmd, args, { stdio: 'inherit', shell: true, ...opts });
  const ms = Date.now() - start;
  return { status: res.status, ms };
}

const projects = ['compliance', 'base', 'behaviors'];
const results = { runs: [] };

console.log('BENCH: (A) Sequential playwright launches (representative subset)');
let seqTotal = 0;
for (const p of projects) {
  console.log(`--- starting project: ${p}`);
  const r = runCmd('npx', ['playwright', 'test', '-p', p, '--reporter=list']);
  results.runs.push({scenario: 'sequential', project: p, ms: r.ms, status: r.status});
  seqTotal += r.ms;
}
results.sequential = { totalMs: seqTotal };

console.log('\nBENCH: (B) Combined playwright invocation (same subset)');
const combined = runCmd('npx', ['playwright', 'test', '-p', projects.join(',') , '--reporter=list']);
results.combined = { ms: combined.ms, status: combined.status };
results.runs.push({scenario: 'combined', projects: projects.join(','), ms: combined.ms, status: combined.status});

console.log('\nBENCH: (C) Fast developer path (npm run test:fast)');
const fast = runCmd('npm', ['run', 'test:fast', '--', '--reporter=list']);
results.fast = { ms: fast.ms, status: fast.status };
results.runs.push({scenario: 'fast', ms: fast.ms, status: fast.status});

results.timestamp = new Date().toISOString();
fs.writeFileSync(OUT, JSON.stringify(results, null, 2));
console.log('\nBENCH: results written to', OUT);
console.log('\nSUMMARY:');
console.log(`  sequential total: ${results.sequential.totalMs} ms`);
console.log(`  combined total:   ${results.combined.ms} ms`);
console.log(`  fast path:        ${results.fast.ms} ms`);

process.exit(0);
