import { test, expect } from '../fixtures/offline';
import { injectAndScan } from '../helpers/inject-and-scan';

/**
 * #1465: cardproduct declared variant="compact", and choosing it changed
 * nothing -- no stylesheet rule, no class, never read. A compact product card
 * must come out measurably shorter than the default one, from the same
 * content, with its 1rem padding (§13) untouched.
 */
const PRODUCT = (variant: string) =>
  `<article id="p-${variant || 'default'}" x-cardproduct ${variant ? `variant="${variant}"` : ''} title="Wireless Headphones" ` +
  // Long enough to wrap over several lines in the default card at any width
  // this page gives it, so the compact one-line clamp has something to clamp.
  `description="${'Noise-cancelling over-ear headphones with a thirty-hour battery, a carrying case, a braided cable and memory-foam ear cushions. '.repeat(4).trim()}" ` +
  'price="$199" image="https://picsum.photos/seed/1465/600/400"></article>';

test('a compact product card is shorter than the default one (#1465)', async ({ page }) => {
  // Each card in its own block, so neither is stretched to the other's height.
  await injectAndScan(page, '<div>' + PRODUCT('') + '</div><div>' + PRODUCT('compact') + '</div>');

  const measure = (id: string) => page.locator(`#${id}`).evaluate((el) => {
    const img = el.querySelector('figure > img') as HTMLElement | null;
    const desc = el.querySelector('.x-card__product-desc') as HTMLElement | null;
    return {
      height: el.getBoundingClientRect().height,
      img: img ? img.getBoundingClientRect().height : 0,
      desc: desc ? desc.getBoundingClientRect().height : 0,
    };
  });
  const normal = await measure('p-default');
  const compact = await measure('p-compact');

  expect(normal.img, 'the default card has its product image').toBeGreaterThan(0);
  expect(compact.img, 'compact uses a shorter image').toBeLessThan(normal.img - 10);
  expect(compact.desc, 'compact keeps the description to one line').toBeLessThan(normal.desc);
  expect(compact.height, 'a compact card is shorter overall').toBeLessThan(normal.height - 20);
});
