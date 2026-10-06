import { test, expect } from '../fixtures/offline';

/**
 * #603: John pasted a real example using `imageposition="right"` (no
 * hyphen) -- didn't work. card.js's cardhorizontal() only checked
 * getAttribute('image-position') (kebab-case). An author typing the
 * camelCase schema property name directly into HTML (imagePosition="right")
 * gets it parsed down to "imageposition" (attribute names lowercase on
 * parse, no hyphen ever gets inserted) -- which doesn't match the
 * kebab-case lookup either. This is the natural, expected typo when the
 * mental model is a camelCase JS property name.
 *
 * Fix: card.js now also checks the no-hyphen form for both imagePosition
 * and imageWidth, alongside the existing kebab-case lookup.
 */
test.describe('[x-cardhorizontal] tolerates both image-position and imageposition (#603)', () => {
  const CASES = [
    { attr: 'image-position="right"', label: 'kebab-case (documented form)' },
    { attr: 'imageposition="right"', label: 'no-hyphen (what imagePosition="..." parses down to)' },
  ];

  for (const { attr, label } of CASES) {
    test(`${label}: figure renders on the right`, async ({ page }) => {
      await page.goto('/');
      await page.setContent(`<div x-cardhorizontal
        title="Test"
        image="https://picsum.photos/400/300?random=casing-test"
        ${attr}>
        Content
      </div>`);
      await page.addScriptTag({
        type: 'module',
        content: `
          import WB from '/src/core/wb-lazy.js';
          window.WB = WB;
          await WB.init({ autoInject: true });
          await WB.scan(document.body, { eager: true });
        `,
      });

      const card = page.locator('[x-cardhorizontal]').first();
      await expect(card.locator('.x-card__figure')).toBeVisible();

      const figBox = await card.locator('.x-card__figure').first().boundingBox();
      const contentBox = await card.locator('.x-card__horizontal-content').first().boundingBox();
      expect(figBox, 'figure should have a bounding box').not.toBeNull();
      expect(contentBox, 'content should have a bounding box').not.toBeNull();
      expect(figBox!.x, `${attr} should place the figure right of the content`).toBeGreaterThan(contentBox!.x);
    });
  }

  test('image-width="60%" and imagewidth="60%" both apply', async ({ page }) => {
    await page.goto('/');
    for (const attr of ['image-width="60%"', 'imagewidth="60%"']) {
      await page.setContent(`<div x-cardhorizontal
        title="Test"
        image="https://picsum.photos/400/300?random=width-test"
        ${attr}>
        Content
      </div>`);
      await page.addScriptTag({
        type: 'module',
        content: `
          import WB from '/src/core/wb-lazy.js';
          window.WB = WB;
          await WB.init({ autoInject: true });
          await WB.scan(document.body, { eager: true });
        `,
      });

      const figure = page.locator('.x-card__figure').first();
      await expect(figure).toBeVisible();
      // Measured, not read off an inline style: the width now reaches the
      // figure as the --horizontal-image-width custom property that card.css's
      // `.x-card__horizontal-figure` rule consumes (Law 9), so `style.width`
      // is empty by design. What must hold for BOTH spellings is the rendered
      // result -- the figure takes 60% of the card's content box.
      const ratio = await figure.evaluate((el) => {
        const card = el.parentElement as HTMLElement;
        const cs = getComputedStyle(card);
        const content = card.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
        return el.getBoundingClientRect().width / content;
      });
      expect(ratio, `${attr} should size the figure to 60% of the card`).toBeGreaterThan(0.58);
      expect(ratio, `${attr} should size the figure to 60% of the card`).toBeLessThan(0.62);
    }
  });
});
