/**
 * THE BADGE NAMES THE RELEASE, THEN COUNTS THE COMMITS PAST IT
 * ============================================================
 * #1139 -- John, 2026-09-28, on "v4.0.5.23": "i can't figure out what's going
 * on." A fourth version segment reads as a release nobody ever cut. The badge
 * now shows the release and the unreleased commits beside it -- "v4.0.5 +23" --
 * and the tooltip says it in words.
 *
 * The served tree's own stamp is usually 0 ahead, so a stamp 23 commits ahead
 * is served here instead of relying on whatever state the checkout is in.
 */
import { test, expect } from '../fixtures/offline';

const stamp = (ahead: number) => `export const VERSION = ${JSON.stringify({
  version: '4.0.5', commit: 'abc1234', builtAt: '2026-09-28T12:00:00.000Z',
  branch: 'main', dirty: false, ahead, behind: 0, upstream: 'origin/main',
})};`;

async function badgeFor(page: import('@playwright/test').Page, ahead: number) {
  await page.route('**/src/core/version.js*', (route) =>
    route.fulfill({ contentType: 'text/javascript', body: stamp(ahead) }));
  await page.goto('/?page=home');
  const badge = page.locator('#headerVersion[x-release]');
  await expect(badge).toHaveAttribute('x-ready', '');
  return badge;
}

test('23 commits past 4.0.5 reads "v4.0.5 +23", never "4.0.5.23"', async ({ page }) => {
  const badge = await badgeFor(page, 23);
  await expect(badge).toHaveText('v4.0.5 +23');
  await expect(badge).toHaveAttribute('title', /23 unreleased commits past release 4\.0\.5/);
});

test('on the release itself the badge is just the release', async ({ page }) => {
  const badge = await badgeFor(page, 0);
  await expect(badge).toHaveText('v4.0.5');
  expect(await badge.getAttribute('title')).not.toMatch(/unreleased/);
});
