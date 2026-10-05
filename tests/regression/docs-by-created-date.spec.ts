/**
 * #1226 -- John: "I want to be able to see all docs by creation date somehow".
 *
 * scripts/update-docs-manifest.js records each doc's creation date in
 * data/docs-manifest.json (the commit that first added it, through renames,
 * from scripts/lib/git-dates.mjs readGitCreated), and the Docs page's
 * "By date created" view lists every doc, newest first, with that date.
 */
import { test, expect } from '../fixtures/offline';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';
import { readGitCreated } from '../../scripts/lib/git-dates.mjs';

const manifest = JSON.parse(fs.readFileSync('data/docs-manifest.json', 'utf8'));

test('creation dates come from the commit that added the doc, and survive a rename', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'created-'));
  const git = (date: string, ...args: string[]) => execFileSync('git', args, {
    cwd: dir, env: { ...process.env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date }, stdio: 'pipe',
  });
  try {
    git('2026-01-01T12:00:00Z', 'init', '-q');
    git('2026-01-01T12:00:00Z', 'config', 'user.email', 't@t');
    git('2026-01-01T12:00:00Z', 'config', 'user.name', 't');
    fs.mkdirSync(path.join(dir, 'docs'));
    fs.writeFileSync(path.join(dir, 'docs', 'old.md'), '# Old\n\nwritten first, then moved\n');
    git('2026-01-01T12:00:00Z', 'add', '.');
    git('2026-01-01T12:00:00Z', 'commit', '-qm', 'old');
    fs.writeFileSync(path.join(dir, 'docs', 'new.md'), '# New\n');
    git('2026-03-01T12:00:00Z', 'add', '.');
    git('2026-03-01T12:00:00Z', 'commit', '-qm', 'new');
    git('2026-05-01T12:00:00Z', 'mv', 'docs/old.md', 'docs/moved.md');
    git('2026-05-01T12:00:00Z', 'commit', '-qm', 'move');
    const created = readGitCreated(dir, ['docs'])!;
    expect(created.get('docs/new.md')).toBe('2026-03-01');
    // Moved in May, written in January: it keeps January.
    expect(created.get('docs/moved.md')).toBe('2026-01-01');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('every doc in the manifest carries its creation date', () => {
  expect(manifest.files.length).toBe(manifest.totalFiles);
  for (const f of manifest.files) expect(f.created, f.path).toMatch(/^\d{4}-\d{2}-\d{2}$/);
});

test('the Docs page lists every doc by date created, newest first', async ({ page }) => {
  await page.goto('/?page=docs&sort=created');
  const cards = page.locator('#docs-container a.docs-card');
  await expect(cards.first()).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('#docs-sort')).toHaveValue('created');
  await expect(cards).toHaveCount(manifest.files.length);
  const dates = await page.locator('#docs-container .docs-card__meta').allTextContents();
  const created = dates.map((t) => (t.match(/Created (\d{4}-\d{2}-\d{2})/) || [])[1]);
  expect(created.every(Boolean), 'every card shows "Created <date>"').toBe(true);
  const sorted = [...created].sort().reverse();
  expect(created).toEqual(sorted);
  const newest = [...manifest.files].sort((a: { created: string }, b: { created: string }) => b.created.localeCompare(a.created))[0];
  await expect(cards.first()).toContainText(newest.created);
});
