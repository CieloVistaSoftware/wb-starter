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

/**
 * #1243 -- John: the badge "must always represent the proper release it
 * displays" -- "it's the only way we stay in sync".
 *
 * Two ways it lied. `ahead` counted commits ahead of origin/main, so a checkout
 * level with main but 12 commits past the v1.0.0 tag read a bare "v1.0.0". And
 * uncommitted edits were a lone `*`: "v1.0.0 ⚠*" served a behavior doc that the
 * v1.0.0 tag does not contain. The count now comes from the tag, and edits are
 * spelled out.
 */
test('level with origin/main but 12 commits past the release tag reads "+12", not the bare release', async ({ page }) => {
  const badge = await badgeFor(page, 0, { release: '1.0.0', sinceRelease: 12, version: '1.0.0' });
  await expect(badge).toHaveText('v1.0.0 +12');
  await expect(badge).toHaveAttribute('title', /12 unreleased commits past release 1\.0\.0/);
});

test('the release name comes from the tag, not package.json', async ({ page }) => {
  const badge = await badgeFor(page, 0, { release: '1.0.0', sinceRelease: 0, version: '1.0.1' });
  await expect(badge).toHaveText('v1.0.0');
});

test('uncommitted edits are spelled out, never shown as the bare release', async ({ page }) => {
  const badge = await badgeFor(page, 0, { release: '1.0.0', sinceRelease: 0, dirty: true });
  await expect(badge).toHaveText('v1.0.0 · edited');
  await expect(badge).toHaveAttribute('title', /not release 1\.0\.0 as tagged/);
});
