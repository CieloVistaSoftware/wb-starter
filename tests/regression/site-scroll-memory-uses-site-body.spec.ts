import { test, expect } from '../fixtures/offline';

/**
 * #1186: the site shell remembers how far down a page you were and puts you
 * back there when you return; a page you open fresh starts at the top.
 * It saved and restored window.scrollY, but the window never scrolls in the
 * shell: .site is 100dvh with overflow hidden and #siteBody is the one scroll
 * container (site.css). So the saved offset was always 0, the restore moved
 * nothing, and a newly opened page kept the previous page's offset.
 */
const A = 'home';
const B = 'about';
const OFFSET = 400;

async function goTo(page, id: string) {
  await page.evaluate((target) => (window as any).WBSite.navigateTo(target), id);
  await page.waitForFunction((target) => (window as any).WBSite?.currentPage === target, id);
}

const scrollTop = (page) => page.evaluate(() => document.getElementById('siteBody')!.scrollTop);
const maxScroll = (page) => page.evaluate(() => {
  const b = document.getElementById('siteBody')!;
  return b.scrollHeight - b.clientHeight;
});

test('#siteBody scroll is reset on a new page and restored on return (#1186)', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 600 });
  await page.goto(`/?page=${A}`);
  await page.waitForFunction((target) => (window as any).WBSite?.currentPage === target, A);
  await expect(page.locator(`#main .page--${A}`)).toBeAttached();

  // Both pages must be tall enough for the offset, or a reset and a clamp
  // look the same and this proves nothing.
  await expect.poll(() => maxScroll(page), { message: `${A} is too short to scroll ${OFFSET}px` })
    .toBeGreaterThan(OFFSET);
  await page.evaluate((y) => { document.getElementById('siteBody')!.scrollTop = y; }, OFFSET);
  await expect.poll(() => scrollTop(page)).toBe(OFFSET);

  await goTo(page, B);
  await expect.poll(() => maxScroll(page), { message: `${B} is too short to show a stale offset` })
    .toBeGreaterThan(OFFSET);
  await expect.poll(() => scrollTop(page), { message: `a first visit to ${B} must start at the top` })
    .toBe(0);

  await goTo(page, A);
  await expect.poll(() => scrollTop(page), { message: `returning to ${A} must restore its offset` })
    .toBe(OFFSET);
});
