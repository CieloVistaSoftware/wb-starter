import { test, expect } from '../fixtures/offline';

/**
 * #962: navigateTo() resolves when the page it loaded is BUILT -- a callback,
 * not a timer.
 *
 * John: "I never see you use callbacks ... requires no timing", and "we could
 * use callbacks for more than just wb.init". navigateTo() is async, but it
 * inserted the page and then started the scan with setTimeout(..., 10), so its
 * promise resolved while the page's behaviors were still unbuilt. Anything that
 * awaited it -- a caller, a test -- then had to guess how much longer to wait.
 *
 * Checked in the SAME task the promise resolves in: no wait of any kind is
 * allowed between the await and the check, or this proves nothing.
 */
test('await navigateTo(page) returns with the page\'s in-view behaviors already built', async ({ page }) => {
  await page.goto('/?page=about');
  // The site engine announces the page it has loaded; the fragment's HTML can
  // be in the document before window.WBSite exists (Windows CI: "reading
  // 'navigateTo' of undefined").
  await page.waitForFunction(() => (window as any).WBSite?.currentPage === 'about');
  // And the about fragment is in: past that point the first navigation only
  // scans, so it cannot overwrite the page the test navigates to next.
  await expect(page.locator('#main .page--about')).toBeAttached();

  const state = await page.evaluate(async () => {
    const site = (window as any).WBSite;
    const WB = (window as any).WB;
    await site.navigateTo('home');
    // Same task as the resolve: nothing has had a chance to run in between.
    const hero = document.querySelector('#main section[x-cardhero]');
    return {
      pageInserted: !!document.querySelector('#main .page--home'),
      heroFound: !!hero,
      heroBuilt: !!hero && (WB.isReady ? WB.isReady(hero) : hero.hasAttribute('x-ready')),
    };
  });

  expect(state.pageInserted, 'the home page was not inserted').toBe(true);
  expect(state.heroFound, 'no <section x-cardhero> on the home page').toBe(true);
  expect(state.heroBuilt, 'navigateTo resolved before the page it loaded was built').toBe(true);
});
