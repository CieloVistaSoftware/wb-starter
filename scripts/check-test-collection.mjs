#!/usr/bin/env node
/**
 * Every Playwright project must actually COLLECT tests.
 *
 * A test cannot detect that its own project failed to load — by then nothing
 * in that project is running. Only an outside check can, so this is a script
 * rather than a spec, and it runs before the suite.
 *
 * Three separate causes produced the identical, silent outcome in one day:
 *
 *   1. `new RegExp('<' + '[x-demo]\\b...')` — `[x-demo]` is a character class
 *      and `x-d` is a reversed range, so it threw at module load.
 *      `npm run test:compliance` printed "Total: 0 tests" and exited 0-ish.
 *   2. Two entries in doc-viewer-wb-demo.spec.ts shared a test title.
 *      `npm run test:fast` printed "Total: 0 tests".
 *   3. Eleven `\b` escapes were literal backspace bytes, so the regexes built
 *      from them matched nothing and their checks passed vacuously (#888).
 *
 * Playwright treats ANY throw during collection as fatal for the whole
 * project. One bad module takes down thousands of unrelated tests, and the
 * only evidence is a single line above a summary that otherwise reads like a
 * clean run. That is worse than a red suite: a red suite gets fixed.
 *
 *   node scripts/check-test-collection.mjs
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

/** Read project names straight from the config, so a new project is covered. */
function projectNames() {
  const config = ['playwright.config.ts', 'playwright.config.js', 'playwright.config.mjs']
    .map((f) => path.resolve(f))
    .find((f) => fs.existsSync(f));
  if (!config) {
    console.error('No playwright config found.');
    process.exit(2);
  }
  const text = fs.readFileSync(config, 'utf8');
  const names = [...text.matchAll(/^\s*name:\s*'([^']+)'/gm)].map((m) => m[1]);
  return [...new Set(names)];
}

/** How many tests does this project collect? -1 if collection itself failed. */
function collectedCount(project) {
  try {
    // execSync, not execFileSync: on Windows `npx` is a .cmd shim that cannot
    // be spawned directly, and without a shell every project reported "failed
    // to load" -- this guard would itself have been giving a false reading.
    // The project name comes from the Playwright config, not from input.
    const out = execSync(
      `npx playwright test --project ${project} --list --reporter=list`,
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 },
    );
    const total = /Total:\s*(\d+)\s*test/i.exec(out);
    if (total) return Number(total[1]);
    // No summary line: fall back to counting listed test lines.
    return out.split('\n').filter((l) => l.includes(' › ')).length;
  } catch (err) {
    const text = `${err.stdout || ''}${err.stderr || ''}`;
    const reason = /(SyntaxError|Error): [^\n]+/.exec(text);
    console.error(`   ${project}: collection FAILED — ${reason ? reason[0] : 'see output below'}`);
    if (!reason) console.error(text.split('\n').slice(-15).join('\n'));
    return -1;
  }
}

const projects = projectNames();
if (!projects.length) {
  console.error('No projects found in the Playwright config.');
  process.exit(2);
}

console.log('');
console.log('🔍 Test collection check — every project must load its tests\n');

const broken = [];
for (const project of projects) {
  const count = collectedCount(project);
  if (count > 0) {
    console.log(`   ✅ ${project.padEnd(22)} ${count} test(s)`);
  } else {
    console.log(`   ❌ ${project.padEnd(22)} ${count === 0 ? 'collected NOTHING' : 'failed to load'}`);
    broken.push(project);
  }
}

console.log('');
if (broken.length) {
  console.error(`❌ ${broken.length} project(s) collect no tests: ${broken.join(', ')}`);
  console.error('');
  console.error('   A project that collects nothing reports a clean run while testing');
  console.error('   nothing at all. Usual causes: a module-level throw (a bad RegExp, a');
  console.error('   missing import) or two tests sharing a title.');
  console.error('');
  process.exit(1);
}

console.log(`✅ All ${projects.length} projects collect tests.\n`);
