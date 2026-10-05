import { test, expect } from '../fixtures/offline';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { releaseNotes, seeItProblems } from '../../scripts/lib/release-item.mjs';
import { checkReleaseNotes } from '../../scripts/check-release-notes.mjs';

/**
 * #1533 -- John, 2026-10-05, on the Releases page: "This page tells me
 * nothing. one of these lines should be a summary of the issue, the other what
 * to do to see the change."
 *
 * Every version printed its PR title and then the same sentence again as its
 * only item (62 of 202 on 2026-10-05). Now each version leads with what the
 * issue was (the commit's `Summary:` line, else the cited issue's title) and
 * how to recreate the change by hand (`See it:`). A PR check requires the two
 * lines.
 *
 * John, the same day, on 1.0.262 and 1.0.261: "still not good enough, tell the
 * user what to do to manually recreate this" -- and "I don't do anything
 * manually that's your job". Every version, old ones included, now says what
 * to do, what you saw Before and what you see Now (data/release-see-it.json,
 * written from each issue's body). "No visible change" is refused.
 */
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'releases.json'), 'utf8'));
const titles = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'issue-titles.json'), 'utf8'));
const text = (html: string) => html.replace(/<[^>]+>/g, '').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');

test('a commit message carries the two release lines', () => {
  expect(releaseNotes('fix: x\n\nSummary: The dialog kept its close button.\nSee it: Open Behaviors → dialog.\n'))
    .toEqual({ summary: 'The dialog kept its close button.', seeIt: 'Open Behaviors → dialog.' });
  expect(releaseNotes('fix: x\n\nNo lines here.')).toEqual({ summary: null, seeIt: null });
});

test('a See it line says what to do, what you saw before and what you see now', () => {
  const good = 'Run `npx playwright test tests/x.spec.ts`. Before: xs and xl both read 16px. Now: xs is 12px, xl 20px.';
  expect(seeItProblems(good)).toEqual([]);
  expect(seeItProblems('Open Search and type "dialog". Before: 112 dead hits. Now: every result opens a page.')).toEqual([]);
  // A short lead-in may set the scene before the step.
  expect(seeItProblems('In a worktree without node_modules, run `npm test`. Before: it failed. Now: it runs.')).toEqual([]);
  // The lines John rejected.
  expect(seeItProblems('No visible change: this version only changes the tests.').join()).toMatch(/No visible change/);
  expect(seeItProblems('Behaviors page looks right now.').join()).toMatch(/what to do/);
  expect(seeItProblems('Open the Error Log: one row, count 2.').join()).toMatch(/Before:/);
  expect(seeItProblems('Open it. Before: a. Now: b.', 'Open it. Before: a. Now: b.').join()).toMatch(/repeats the Summary/);
  expect(seeItProblems(null).join()).toMatch(/no See it/);
});

test('the PR check wants both lines in one commit, and a See it line that can be followed', () => {
  const steps = 'Open Releases. Before: each version repeated its title. Now: each says how to see it.';
  expect(checkReleaseNotes([`feat: x\n\nSummary: a\nSee it: ${steps}`]).ok).toBe(true);
  expect(checkReleaseNotes(['feat: x\n\nSummary: a', `test: y\n\nSee it: ${steps}`]).ok).toBe(false);
  expect(checkReleaseNotes(['feat: x']).ok).toBe(false);
  const vague = checkReleaseNotes(['test: x\n\nSummary: a\nSee it: No visible change: tests only.']);
  expect(vague.ok).toBe(false);
  expect(vague.problems.join()).toMatch(/No visible change/);
});

test('every version, old ones included, says how to recreate it by hand', () => {
  const bad = data.releases
    .map((r: { version: string, summary: string, seeIt?: string }) => ({ v: r.version, p: seeItProblems(r.seeIt ? text(r.seeIt) : null, text(r.summary)) }))
    .filter((r: { p: string[] }) => r.p.length)
    .map((r: { v: string, p: string[] }) => `${r.v}: ${r.p.join('; ')}`);
  expect(bad, 'versions whose See it line cannot be followed').toEqual([]);
});

test('the two versions John pointed at are no longer generic', () => {
  for (const version of ['1.0.262', '1.0.261']) {
    const v = data.releases.find((r: { version: string }) => r.version === version);
    expect(v?.seeIt, `${version} has a See it line`).toBeTruthy();
    expect(text(v.seeIt)).not.toMatch(/No visible change/);
  }
});

test('a version that cites an issue leads with what the issue was, not its PR title again', () => {
  // 1.0.271 (#1522): its PR title and only item were the same sentence.
  const v = data.releases.find((r: { version: string }) => r.version === '1.0.271');
  expect(v, '1.0.271 is listed').toBeTruthy();
  expect(text(v.summary)).toContain(titles['1522']);
  expect(text(v.summary)).not.toContain('reads the markup stored in config/*.json (PR');
  expect(seeItProblems(text(v.seeIt))).toEqual([]);
});

test('no generated version repeats its summary as its only item any more', () => {
  // Versions after 1.0.89 (push-count.mjs's anchor) are generated from git on
  // every stamp; older 1.0.N entries are kept as they were written.
  const strip = (s: string) => text(s).replace(/\(PR \d+(, PR \d+)*\)|#\d+/g, '').replace(/^[a-z]+(\([^)]*\))?!?:\s*/i, '').trim().toLowerCase();
  const repeats = data.releases
    .filter((r: { version: string }) => /^1\.0\.\d+$/.test(r.version) && Number(r.version.split('.')[2]) > 89)
    .filter((r: { summary: string, items: { html: string }[] }) => r.items.length === 1 && strip(r.summary) === strip(r.items[0].html))
    .map((r: { version: string }) => r.version);
  expect(repeats, 'versions whose summary is their only item, word for word').toEqual([]);
});

test('the page shows "See it" under the summary, and says each commit is a release', async ({ page }) => {
  await page.goto('/?page=releases');
  await expect(page.locator('#releases-list')).toHaveAttribute('rendered', '1', { timeout: 15_000 });
  await expect(page.locator('#releases-hero-note')).toContainText('Each commit to main is a new release');
  const first = data.releases.find((r: { seeIt?: string }) => r.seeIt);
  const id = `release-${first.version.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`;
  const seeIt = page.locator(`#${id}-see-it`);
  await expect(seeIt).toBeVisible();
  await expect(seeIt).toContainText('See it:');
  // Directly under the summary.
  const order = await page.locator(`#${id} > p`).evaluateAll((ps) => ps.map((p) => p.id));
  expect(order.slice(0, 2)).toEqual([`${id}-summary`, `${id}-see-it`]);
});
