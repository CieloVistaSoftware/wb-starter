import { test, expect } from '../fixtures/offline';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { releaseNotes, noVisibleChange } from '../../scripts/lib/release-item.mjs';
import { checkReleaseNotes } from '../../scripts/check-release-notes.mjs';

/**
 * #1533 -- John, 2026-10-05, on the Releases page: "This page tells me
 * nothing. one of these lines should be a summary of the issue, the other what
 * to do to see the change."
 *
 * Every version printed its PR title and then the same sentence again as its
 * only item (62 of 202 on 2026-10-05). Now each version leads with what the
 * issue was (the commit's `Summary:` line, else the cited issue's title) and
 * what to do to see the change (`See it:`, else "No visible change" for a
 * version of tests and tooling). A PR check requires the two lines.
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

test('a version of only tests and tooling says there is nothing to see', () => {
  expect(noVisibleChange(['test: a', 'test(x): b'])).toBe('No visible change: this version only changes the tests.');
  expect(noVisibleChange(['test: a', 'ci: b'])).toMatch(/^No visible change/);
  expect(noVisibleChange(['test: a', 'fix: b'])).toBeNull();
  expect(noVisibleChange(['Issues page: a tab'])).toBeNull();
});

test('the PR check wants both lines, in one commit', () => {
  expect(checkReleaseNotes(['feat: x\n\nSummary: a\nSee it: b']).ok).toBe(true);
  expect(checkReleaseNotes(['feat: x\n\nSummary: a', 'test: y\n\nSee it: b']).ok).toBe(false);
  expect(checkReleaseNotes(['feat: x']).ok).toBe(false);
});

test('a version that cites an issue leads with what the issue was, not its PR title again', () => {
  // 1.0.271 (#1522): its PR title and only item were the same sentence.
  const v = data.releases.find((r: { version: string }) => r.version === '1.0.271');
  expect(v, '1.0.271 is listed').toBeTruthy();
  expect(text(v.summary)).toContain(titles['1522']);
  expect(text(v.summary)).not.toContain('reads the markup stored in config/*.json (PR');
  expect(v.seeIt).toBe('No visible change: this version only changes the tests.');
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
