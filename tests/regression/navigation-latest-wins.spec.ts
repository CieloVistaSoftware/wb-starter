import { test, expect } from '../fixtures/offline';
import { pagePath } from '../helpers/page-path';

// The route below holds a page fragment; a live service worker would answer
// it first and the hold would never apply (#1349).
test.use({ serviceWorkers: 'block' });

/**
 * #1519: the newest navigation wins. navigateTo() awaited the page fragment,
 * its text and its CSS, then wrote #main unconditionally. A navigation that
 * was slow to load and finished after a newer one painted its page over the
 * page the reader had asked for. currentPage still named the newer page, the
 * URL said the newer page, and the screen showed the old one.
 *
 * Here "about" is held for 3s, the reader taps "themes" while it loads, and
 * the screen must end on themes and stay there once about arrives.
 */
test('a slow earlier navigation does not paint over a newer one (#1519)', async ({ page }) => {
  let released = false;
  let releaseAbout: () => void = () => {};
  const aboutHeld = new Promise<void>((ok) => { releaseAbout = ok; });
  await page.route(/pages\/about\.html/, async (route) => {
    await aboutHeld;
    released = true;
    await route.continue();
  });

  await page.goto('/?page=home');
  await page.waitForFunction(() => !!document.querySelector('#mainPage-home'), null, { timeout: 20000 });

  // Every navigateTo() call the taps make is kept, so the test can wait for the
  // released one to RETURN -- having written #main, or having seen it was
  // superseded and stopped -- instead of guessing how long it takes (#1516).
  // The nav click calls this.navigateTo(), so the instance property catches it.
  // Home can be on screen before src/index.js assigns window.WBSite.
  await page.waitForFunction(() => typeof (window as any).WBSite?.navigateTo === 'function', null, { timeout: 20000 });
  await page.evaluate(() => {
    const site = (window as any).WBSite;
    const original = site.navigateTo.bind(site);
    (window as any).__navigations = [];
    site.navigateTo = (id: string) => {
      const run = original(id);
      (window as any).__navigations.push(Promise.resolve(run).catch(() => {}));
      return run;
    };
  });

  const tap = (p: string) => page.evaluate((href) => {
    (document.querySelector(`.nav__item[href="${href}"]`) as HTMLElement).click();
  }, pagePath(p));

  await tap('about');
  await tap('themes');
  await page.waitForFunction(() => !!document.querySelector('#mainPage-themes'), null, { timeout: 20000 });

  // Let the older navigation finish now, after the newer one has painted.
  releaseAbout();
  await expect.poll(() => released, { timeout: 5000 }).toBe(true);
  // The released navigation has run to its end: it would write #main after
  // the fragment, its text and its CSS (capped at 2s) resolve, and its promise
  // settles only after that point. Two frames for anything it scheduled.
  expect(await page.evaluate(() => (window as any).__navigations.length), 'both taps reached navigateTo()').toBeGreaterThanOrEqual(2);
  await page.evaluate(() => Promise.all((window as any).__navigations));
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

  const state = await page.evaluate(() => ({
    currentPage: (window as any).WBSite?.currentPage,
    shown: [...document.getElementById('main')!.children].map((c) => c.id),
  }));
  expect(state, 'the page on screen must be the one last asked for').toEqual({
    currentPage: 'themes',
    shown: ['mainPage-themes'],
  });
});
