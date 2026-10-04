import { test, expect } from '../fixtures/offline';

/**
 * #1100 -- arriving at a section by its anchor shows it built, not blank.
 *
 * wb-lazy.js decorates elements as they near the viewport (IntersectionObserver).
 * John opened demos/site/cards.html#cardfile-file-card and saw raw, undecorated
 * cards: the anchor jump put the reader on a region the observer had not built.
 *
 * Holds: once the page reports idle (WB.whenIdle(), the runtime's own signal),
 * every behavior element in the viewport has been built (x-ready).
 */
const URL = '/demos/site/cards.html#cardfile-file-card';

test('an anchor jump lands on a built section, not raw markup', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  // The page's init awaits WB.scan(), and scan() resolves only once every
  // in-view element is built (#962) -- so an init that never finishes IS the
  // landed region never being built.
  await expect.poll(
    () => page.evaluate(() => (window as any).__WB_DEMO_INITIALIZED__ === true),
    { timeout: 30_000, message: 'the page never finished building what the anchor jump landed on' },
  ).toBe(true);

  const state = await page.evaluate(async () => {
    await (window as any).WB.whenIdle({ timeout: 20_000 });
    const vh = window.innerHeight;
    const inView = Array.from(document.querySelectorAll('#cardfile-file-card *')).filter((el) => {
      if (!Array.from(el.attributes).some((a) => a.name.startsWith('x-') && a.name !== 'x-ready')) return false;
      const r = el.getBoundingClientRect();
      return r.bottom > 0 && r.top < vh && r.width > 0;
    });
    return {
      scrollY: window.scrollY,
      inView: inView.length,
      unbuilt: inView.filter((el) => !el.hasAttribute('x-ready')).map((el) => `<${el.tagName.toLowerCase()} ${Array.from(el.attributes).map((a) => a.name).filter((n) => n.startsWith('x-')).join(' ')}>`),
    };
  });

  expect(state.scrollY, 'the anchor jump did not happen -- the test is not measuring arrival').toBeGreaterThan(0);
  expect(state.inView, 'no behavior elements in view after the jump -- the section moved').toBeGreaterThan(0);
  expect(state.unbuilt, 'elements in view, still raw after the page reported idle').toEqual([]);
});
