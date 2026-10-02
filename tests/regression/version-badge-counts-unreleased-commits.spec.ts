/**
 * THE BADGE IS ONE PLAIN VERSION: THE RELEASE, MOVED ON BY THE COMMITS SINCE IT
 * ============================================================================
 * John, 2026-10-02: "I want port 3000 to show 1.0.what the latest push is e.g.
 * 1.0.41 simple." v1.0.0 plus 41 commits reads "v1.0.41". Always three
 * segments (#1139: a fourth, "4.0.5.23", read as a release nobody cut), and
 * counted by git from the GitHub tag (#1243: never from package.json or the
 * upstream, which showed a bare "v1.0.0" for 48 commits past it).
 *
 * The served tree's own stamp is whatever the checkout is, so each case serves
 * a stamp of its own instead.
 */
import { test, expect } from '../fixtures/offline';

const stamp = (ahead: number, extra: Record<string, unknown> = {}) => `export const VERSION = ${JSON.stringify({
  version: '4.0.5', commit: 'abc1234', builtAt: '2026-09-28T12:00:00.000Z',
  branch: 'main', dirty: false, ahead, behind: 0, upstream: 'origin/main',
  ...extra,
})};`;

async function badgeFor(page: import('@playwright/test').Page, ahead: number, extra: Record<string, unknown> = {}) {
  await page.route('**/src/core/version.js*', (route) =>
    route.fulfill({ contentType: 'text/javascript', body: stamp(ahead, extra) }));
  await page.goto('/?page=home');
  const badge = page.locator('#headerVersion[x-release]');
  await expect(badge).toHaveAttribute('x-ready', '');
  return badge;
}

test('41 commits past the v1.0.0 tag reads "v1.0.41"', async ({ page }) => {
  const badge = await badgeFor(page, 0, { release: '1.0.0', sinceRelease: 41, version: '1.0.0' });
  await expect(badge).toHaveText('v1.0.41');
  await expect(badge).toHaveAttribute('title', /41 commits since the v1\.0\.0 tag/);
});

test('on the tag itself the badge is the release', async ({ page }) => {
  const badge = await badgeFor(page, 0, { release: '1.0.0', sinceRelease: 0, version: '1.0.0' });
  await expect(badge).toHaveText('v1.0.0');
  expect(await badge.getAttribute('title')).not.toMatch(/since the/);
});

test('never a fourth segment: 23 commits past 4.0.5 reads "v4.0.28"', async ({ page }) => {
  const badge = await badgeFor(page, 0, { release: '4.0.5', sinceRelease: 23 });
  await expect(badge).toHaveText('v4.0.28');
});

test('the count comes from the tag, not from commits ahead of origin/main', async ({ page }) => {
  // Level with origin/main (ahead 0) but 48 commits past the tag: #1243.
  const badge = await badgeFor(page, 0, { release: '1.0.0', sinceRelease: 48, version: '1.0.0' });
  await expect(badge).toHaveText('v1.0.48');
});

test('the release comes from the tag, not package.json', async ({ page }) => {
  const badge = await badgeFor(page, 0, { release: '1.0.0', sinceRelease: 0, version: '1.0.9' });
  await expect(badge).toHaveText('v1.0.0');
});

// Local edits keep John's compact mark (`*`, "release-modification format",
// behaviors-header-controls-aligned.spec.ts); the tooltip says it in words.
test('uncommitted edits are marked', async ({ page }) => {
  const badge = await badgeFor(page, 0, { release: '1.0.0', sinceRelease: 41, dirty: true });
  await expect(badge).toHaveText('v1.0.41 *');
  await expect(badge).toHaveAttribute('title', /not 1\.0\.41 as committed/);
});
