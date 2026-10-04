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

// #1452: npm start's next step, the docs manifests. On Windows it reordered
// data/docs-manifest.json (directory order is the filesystem's) and rewrote
// docs/manifest.json over its CRLF checkout, so both showed modified after
// every start although no doc had changed.
const MANIFESTS = ['data/docs-manifest.json', 'docs/manifest.json'];

// #1476: compared as DATA, minus the git-derived "modified" dates. Those come
// from each doc's last commit, so a PR that edits a doc moves them, and main's
// stamp workflow writes them after merge -- the committed copy is one commit
// behind by design, and a pre-commit hook cannot know a date that does not
// exist yet. Everything #1452 was about (reordering, line-ending rewrites, any
// other content change) still differs here.
const withoutDates = (text: string): unknown => JSON.parse(text, (key, value) => (key === 'modified' ? undefined : value));
const committed = (file: string) => execFileSync('git', ['show', `HEAD:${file}`], { encoding: 'utf8' });

test('the docs-manifest step reproduces the committed manifests (#1452, #1476)', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  expect(pkg.scripts.start, 'npm start runs the manifest step').toContain('update-docs-manifest.js');

  // Uncommitted doc edits legitimately change the manifests; say so first.
  const docEdits = execFileSync('git', ['status', '--porcelain', '--', 'docs', ':!docs/manifest.json'], { encoding: 'utf8' });
  expect(docEdits, 'precondition: no uncommitted doc edits, or the manifests may legitimately change').toBe('');

  const before = MANIFESTS.map((f) => fs.readFileSync(f, 'utf8'));
  try {
    execFileSync(process.execPath, ['scripts/update-docs-manifest.js'], { encoding: 'utf8' });
    for (const f of MANIFESTS) {
      expect(withoutDates(fs.readFileSync(f, 'utf8')), `${f}: the manifest step produced different content from the committed file`)
        .toEqual(withoutDates(committed(f)));
    }
  } finally {
    // Leave the tree exactly as the test found it.
    MANIFESTS.forEach((f, i) => fs.writeFileSync(f, before[i]));
  }
});

test('the dev server serves the local stamp as src/core/version.js (#1131)', async ({ page }) => {
  // The test makes its own stamp: CI starts the server with node server.js,
  // not npm start, so no stamp step has run there.
  execFileSync(process.execPath, ['scripts/stamp-version.js', '--local'], { encoding: 'utf8' });
  const res = await page.request.get('/src/core/version.js');
  expect(res.ok()).toBe(true);
  expect(await res.text(), 'served version.js is the .local copy').toBe(fs.readFileSync('.local/src/core/version.js', 'utf8'));
});
