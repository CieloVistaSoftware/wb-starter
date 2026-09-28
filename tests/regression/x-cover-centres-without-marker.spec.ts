/**
 * x-cover centres its content with no marker attribute.
 *
 * It used to centre only a child marked `data-principal` -- an undocumented
 * data-* hook (John: "what is data-principal? remove it"). Without it the
 * content sat at the top, so the behaviors-page example ("Vertically
 * centred") never was. Now: <header>/<footer> pin to the edges and what is
 * between them is centred; with neither, all content is centred.
 */
import { test, expect, Page } from '../fixtures/offline';

async function render(page: Page, html: string) {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB?.behaviors);
  await page.evaluate(async (markup) => {
    const host = document.createElement('div');
    host.id = 'cover-test';
    host.style.width = '600px';
    // Margins zeroed: site headings carry asymmetric margins, which would
    // measure as off-centre when the layout is exactly right. The auto
    // margins x-cover itself gives the first/last middle child are left
    // alone: they are a stylesheet rule now (#779), not an inline style, and
    // this id-scoped reset would otherwise out-rank them -- zeroing the very
    // centring under test.
    host.innerHTML = '<style>#cover-test [x-cover] > :not(.x-cover__middle-start):not(.x-cover__middle-end) { margin-block: 0; }</style>' + markup;
    document.body.appendChild(host);
    await (window as any).WB.scan(host, { eager: true });
  }, html);
  const cover = page.locator('#cover-test [x-cover]');
  await expect(cover).toHaveClass(/x-cover/);
  return cover;
}

/** Distance of `sel`'s vertical centre from the cover's content-box centre. */
function offCentre(cover: ReturnType<Page['locator']>, sel: string) {
  return cover.evaluate((c, s) => {
    const box = c.getBoundingClientRect();
    const el = c.querySelector(s)!.getBoundingClientRect();
    return Math.abs((el.top + el.height / 2) - (box.top + box.height / 2));
  }, sel);
}

test('header and footer pin to the edges; the content between is centred', async ({ page }) => {
  const cover = await render(page, `
    <div x-cover min-height="300px" padding="0">
      <header>Top</header>
      <h2>Middle</h2>
      <footer>Bottom</footer>
    </div>`);
  const pos = await cover.evaluate((c) => {
    const b = c.getBoundingClientRect();
    const r = (s: string) => c.querySelector(s)!.getBoundingClientRect();
    const gapMid = (r('header').bottom + r('footer').top) / 2;
    const h2 = r('h2');
    return {
      headerTop: r('header').top - b.top,
      footerBottom: b.bottom - r('footer').bottom,
      middleOff: Math.abs(h2.top + h2.height / 2 - gapMid),
    };
  });
  expect(pos.headerTop, 'header at the top edge').toBeLessThanOrEqual(1);
  expect(pos.footerBottom, 'footer at the bottom edge').toBeLessThanOrEqual(1);
  // Centred in the space BETWEEN header and footer (they need not be equal height).
  expect(pos.middleOff, 'the middle child is centred between header and footer').toBeLessThanOrEqual(2);
});

test('with no header or footer, the content is centred', async ({ page }) => {
  const cover = await render(page, `
    <div x-cover min-height="300px" padding="0">
      <h3>Vertically centred</h3>
    </div>`);
  expect(await offCentre(cover, 'h3')).toBeLessThanOrEqual(3);
});
