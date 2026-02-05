#!/usr/bin/env node
/* Quick benchmark helper — runs one of: baseline | combined | fast
   Usage: node scripts/benchmark-playwright.js baseline
*/
import { spawnSync } from 'child_process';
const mode = process.argv[2] || 'fast';
const ROOT = process.cwd();

const commands = {
  baseline: [
    ['npx', ['playwright', 'test', '--project=compliance']],
    ['npx', ['playwright','test','--project=regression']],
    ['npx', ['playwright','test','--project=base']],
    ['npx', ['playwright','test','--project=behaviors']],
    ['npx', ['playwright','test','--project=performance']]
  ],
  combined: [ ['npx', ['playwright','test','-p','compliance','-p','regression','-p','base','-p','behaviors','-p','performance']] ,
  ],
  fast: [ ['npm', ['run','test:fast']] ]
};

if (!commands[mode]) {
  console.error('Unknown mode. Use: baseline | combined | fast');
  process.exit(2);
}

function run(cmd, args) {
  const start = process.hrtime.bigint();
  const r = spawnSync(cmd, args, { encoding: 'utf8', stdio: ['inherit','pipe','pipe'] });
  const end = process.hrtime.bigint();
  const ms = Number(end - start) / 1_000_000;
  return { code: r.status === null ? 1 : r.status, ms, stdout: r.stdout ? r.stdout.slice(0, 32_000) : '', stderr: r.stderr ? r.stderr.slice(0, 32_000) : '' };
}

(async function main() {
  const results = [];
  for (const c of commands[mode]) {
    const [cmd, args] = c;
    console.log(`\n=== RUNNING: ${cmd} ${args.join(' ')} ===`);
    const r = run(cmd, args);
    console.log(`exit=${r.code}  ms=${Math.round(r.ms)}`);
    results.push({ cmd: `${cmd} ${args.join(' ')}`, ms: Math.round(r.ms), code: r.code });
    if (r.stdout) console.log(r.stdout.split('\n').slice(0,6).join('\n'));
  }
  const total = results.reduce((s, x) => s + x.ms, 0);
  const exitCodes = Array.from(new Set(results.map(r=>r.code)));
  const summary = { mode, totalMs: Math.round(total), results, exitCodes };
  console.log('\n=== SUMMARY ===');
  console.log(JSON.stringify(summary, null, 2));
  // exit non-zero if any command failed
  process.exit(exitCodes.some(c=>c!==0) ? 1 : 0);
})();
