import { test, expect } from '../fixtures/offline';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

/**
 * #1131: starting the dev server rewrote tracked files. `npm start` ran
 * scripts/stamp-version.js, which wrote this checkout's stamp (its branch, its
 * drift) into src/core/version.js and moved the ?v= cache key in index.html
 * and every page under pages/ and demos/ -- 35 files on a branch, every run.
 * The tree was never clean, and `git merge` refused to run over it.
 *
 * npm start now stamps with --local: the stamp goes to the ignored .local/
 * tree, which the dev server serves in place of the tracked version.js.
 */
const STAMPED = ['src/core/version.js', 'index.html', 'pages', 'demos'];
const status = () => execFileSync('git', ['status', '--porcelain', '--', ...STAMPED], { encoding: 'utf8' });

test('npm start stamps locally, leaving tracked files as they were (#1131)', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  expect(pkg.scripts.start, 'npm start runs the local stamp').toContain('stamp-version.js --local');

  const before = status();
  execFileSync(process.execPath, ['scripts/stamp-version.js', '--local'], { encoding: 'utf8' });
  expect(status(), 'the local stamp changed tracked files').toBe(before);
  expect(fs.existsSync('.local/src/core/version.js'), 'the local stamp was written').toBe(true);
});

test('the dev server serves the local stamp as src/core/version.js (#1131)', async ({ page }) => {
  // The test makes its own stamp: CI starts the server with node server.js,
  // not npm start, so no stamp step has run there.
  execFileSync(process.execPath, ['scripts/stamp-version.js', '--local'], { encoding: 'utf8' });
  const res = await page.request.get('/src/core/version.js');
  expect(res.ok()).toBe(true);
  expect(await res.text(), 'served version.js is the .local copy').toBe(fs.readFileSync('.local/src/core/version.js', 'utf8'));
});
