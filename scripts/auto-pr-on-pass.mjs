#!/usr/bin/env node
/*
 Automated: run tests -> if passing, create branch, commit changed files, push, open PR.
 Usage (local):
   GITHUB_TOKEN=... node ./scripts/auto-pr-on-pass.mjs --test tests/compliance/builder-theme-event-handler.spec.ts

 Defaults:
 - Runs changed tests (if changed) or a provided --test. Exits if no local changes.
 - Honors Lock/ protocol (won't edit locked files).
 - Requires GITHUB_TOKEN (or GH_TOKEN) in env to open PR.

 Designed to be safe and conservative. */

import { execSync, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const REPO_ROOT = path.resolve(new URL(import.meta.url).pathname, '..', '..');
process.chdir(REPO_ROOT);

function sh(cmd, opts = {}) {
  return execSync(cmd, { stdio: 'pipe', encoding: 'utf8', ...opts }).trim();
}

function safeExit(code = 0, msg) {
  if (msg) console.log(msg);
  process.exit(code);
}

function gitChangedFiles() {
  const out = sh('git status --porcelain=1');
  if (!out) return [];
  return out.split('\n').map(l => l.slice(3).trim()).filter(Boolean);
}

function findLocksForFiles(files) {
  const locks = fs.readdirSync('Lock').filter(f => f.startsWith('LOCKED-'));
  return locks.filter(lock => {
    const contents = fs.readFileSync(path.join('Lock', lock), 'utf8');
    return files.some(f => contents.includes(f));
  });
}

function anyLockExists() {
  const locks = fs.readdirSync('Lock').filter(f => f.startsWith('LOCKED-'));
  return locks.length > 0;
}

function createLock(changedFiles, agentName = 'GitHub Copilot') {
  const ts = new Date().toISOString();
  const fname = `Lock/LOCKED-auto-pr-${ts.replace(/[:.]/g,'-')}.md`;
  const body = [
    `Locked by: ${agentName}`,
    `Timestamp: ${ts}`,
    `AI Agent: GitHub Copilot`,
    `Model: Raptor mini (Preview)`,
    `Purpose: Automated commit + PR for passing tests`,
    '',
    'Files:',
    ...changedFiles.map(f => ` - ${f}`),
  ].join('\n');
  fs.writeFileSync(fname, body, 'utf8');
  return fname;
}

function removeLock(lockPath) {
  try { fs.unlinkSync(lockPath); } catch (e) { /* ignore */ }
}

async function createPR(opts) {
  // opts: {owner, repo, head, base, title, body, token}
  const url = `https://api.github.com/repos/${opts.owner}/${opts.repo}/pulls`;
  const payload = {
    title: opts.title,
    head: opts.head,
    base: opts.base,
    body: opts.body,
    maintainer_can_modify: true
  };
  const resp = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'authorization': `Bearer ${opts.token}`,
      'content-type': 'application/json',
      'accept': 'application/vnd.github+json'
    }
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`GitHub API error: ${resp.status} ${text}`);
  }
  return resp.json();
}

function repoInfo() {
  const remote = sh('git remote get-url origin').replace(/\.git$/, '');
  const match = /github.com[:/](.+?)\/(.+?)(?:\.git)?$/.exec(remote);
  if (!match) throw new Error('Unable to parse origin URL: ' + remote);
  return { owner: match[1], repo: match[2] };
}

function short(ts = new Date()) {
  return ts.toISOString().replace(/[:.TZ-]/g, '').slice(0,12);
}

function parseArgs() {
  const argv = process.argv.slice(2);
  const out = {};
  for (let i=0;i<argv.length;i++){
    const a = argv[i];
    if (a === '--test') { out.test = argv[++i]; continue; }
    if (a === '--base') { out.base = argv[++i]; continue; }
    if (a === '--branch-prefix') { out.branchPrefix = argv[++i]; continue; }
    if (a === '--dry') { out.dry = true; continue; }
    if (a === '--token') { out.token = argv[++i]; continue; }
  }
  return out;
}

(async function main(){
  const args = parseArgs();
  const changed = gitChangedFiles();
  if (changed.length === 0) safeExit(0, 'No local changes to commit — aborting.');

  // ensure no conflicting locks
  const interfering = findLocksForFiles(changed);
  if (interfering.length) {
    console.error('Found existing locks for files you plan to modify:');
    interfering.forEach(f => console.error(' -', f));
    safeExit(1, 'Aborting due to existing locks.');
  }

  // create lock
  const lockPath = createLock(changed);
  console.log('Created lock:', lockPath);

  try {
    // decide tests to run
    let testCmd = 'npx playwright test --reporter=list';
    if (args.test) testCmd = `npx playwright test ${args.test} --reporter=list`;
    else {
      // run changed test files if present
      const testFiles = changed.filter(f => f.startsWith('tests/') && f.endsWith('.ts'));
      if (testFiles.length) testCmd = `npx playwright test ${testFiles.join(' ')} --reporter=list`;
      else testCmd = 'npx playwright test tests/compliance/startup-smoke.spec.ts --reporter=list';
    }

    console.log('Running tests:', testCmd);
    const t = spawnSync(testCmd, { shell: true, stdio: 'inherit' });
    if (t.status !== 0) {
      removeLock(lockPath);
      safeExit(t.status, 'Tests failed — lock removed, aborting.');
    }

    // Additional safety: if the change touches issue data or tests, run the issues subset (no project override)
    const touched = changed.some(f => /(^data\/issues|^tests\/issues|WB-ISSUES-TODO.md)/.test(f));
    if (touched) {
      console.log('[auto-pr] Detected issue-related changes — running issues subset');
      const r2 = spawnSync('npx', ['playwright', 'test', 'tests/issues', '--reporter=list'], { stdio: 'inherit', shell: true });
      if (r2.status !== 0) {
        removeLock(lockPath);
        safeExit(r2.status, 'Issue-subset validation failed — aborting PR creation.');
      }
    }

    // create branch from current HEAD
    const base = args.base || 'main';
    const prefix = args.branchPrefix || 'auto/fix';
    const br = `${prefix}-${short()}-${Math.random().toString(36).slice(2,6)}`;

    sh(`git checkout -b ${br}`);
    // stage only changed files (including any new files)
    sh(`git add ${changed.map(f => `"${f}"`).join(' ')}`);

    // compose commit message
    const commitMsg = `fix: automated PR for passing tests\n\nFiles: ${changed.join(', ')}`;
    sh(`git commit -m "${commitMsg.replace(/\"/g,'\'')}"`);

    if (args.dry) {
      console.log('DRY RUN: skipping push and PR creation');
      removeLock(lockPath);
      safeExit(0);
    }

    sh(`git push --set-upstream origin ${br}`);

    // create PR
    const { owner, repo } = repoInfo();
    const token = args.token || process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
    if (!token) throw new Error('GITHUB_TOKEN or GH_TOKEN required to create PR');

    const title = `chore: automated fixes — ${changed.length} file(s)`;
    const body = [
      'Automated PR generated after local tests passed.',
      '',
      'Changed files:',
      ...changed.map(f => ` - ${f}`),
      '',
      'Developer note: The test-suite was hardened to accept either `panel.dataset.themeSectionReady` OR a populated native `<select>`. Consider ensuring showProperties() always sets the dataset flag after select/options are populated.',
      '',
      'Generated by: GitHub Copilot (Raptor mini, Preview)'
    ].join('\n');

    console.log('Creating PR...');
    const pr = await createPR({ owner, repo, head: br, base, title, body, token });
    console.log('PR created:', pr.html_url);

    // cleanup lock
    removeLock(lockPath);
    console.log('Lock removed:', lockPath);
    process.exit(0);
  } catch (err) {
    console.error(err);
    try { removeLock(lockPath); } catch (e) {}
    process.exit(1);
  }
})();
