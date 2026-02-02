#!/usr/bin/env node
/*
  Wrapper for Playwright that lists tests first and only runs the test runner
  when there are matching tests. Prevents the noisy "No tests found" runner output
  during interactive runs.

  Usage (npm):
    npm run pw:maybe -- --grep="pattern"

  Usage (npx):
    node scripts/playwright-if-tests.js -- --grep="pattern"
*/
import { spawnSync, spawn } from 'child_process';

const argvIndex = process.argv.indexOf('--');
const rawArgs = argvIndex >= 0 ? process.argv.slice(argvIndex + 1) : process.argv.slice(2);

function runList(args) {
  const listArgs = ['playwright', 'test', '--list', '--reporter=list', ...args];
  const r = spawnSync('npx', listArgs, { encoding: 'utf8', shell: true });
  return { code: r.status, stdout: r.stdout || '', stderr: r.stderr || '' };
}

function runPlaywright(args) {
  const runArgs = ['playwright', 'test', ...args];
  const proc = spawn('npx', runArgs, { stdio: 'inherit', shell: true });
  proc.on('close', (code) => process.exit(code));
}

// If user asked for list-only, just forward
if (rawArgs.includes('--list')) {
  const proc = spawn('npx', ['playwright', 'test', ...rawArgs], { stdio: 'inherit', shell: true });
  proc.on('close', (code) => process.exit(code));
}

// First, list matching tests
const list = runList(rawArgs);
const stdout = (list.stdout || '').trim();
const stderr = (list.stderr || '').trim();

if (list.code !== 0) {
  // If listing failed for some reason, fall back to running the runner so errors surface
  console.log('playwright-if-tests: could not list tests reliably — running playwright to surface errors');
  runPlaywright(rawArgs);
  // runPlaywright will exit the process
}

// Playwright prints nothing or prints 'No tests found' when nothing matches.
const hasTests = /\d+ test[s]? found/i.test(stdout) || /\S/.test(stdout);

if (!hasTests) {
  console.log('playwright-if-tests: no matching tests found — skipping Playwright runner (exit 0)');
  process.exit(0);
}

// There are matching tests — run Playwright normally and forward exit code
runPlaywright(rawArgs);
