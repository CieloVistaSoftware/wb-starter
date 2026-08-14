import { test, expect } from '@playwright/test';

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
test.describe('wb-cardhorizontal tolerates both image-position and imageposition (#603)', () => {
  const CASES = [
    { attr: 'image-position="right"', label: 'kebab-case (documented form)' },
    { attr: 'imageposition="right"', label: 'no-hyphen (what imagePosition="..." parses down to)' },
  ];

  for (const { attr, label } of CASES) {
    test(`${label}: figure renders on the right`, async ({ page }) => {
      await page.goto('/');
      await page.setContent(`<wb-cardhorizontal
        title="Test"
        image="https://picsum.photos/400/300?random=casing-test"
        ${attr}>
        Content
      </wb-cardhorizontal>`);
      await page.addScriptTag({
        type: 'module',
        content: `
          import WB from '/src/core/wb-lazy.js';
          window.WB = WB;
          await WB.init({ autoInject: true });
          await WB.scan(document.body, { eager: true });
        `,
      });
      await page.waitForTimeout(1000);

      const card = page.locator('wb-cardhorizontal').first();
      await expect(card.locator('.wb-card__figure')).toBeVisible();

      const figBox = await card.locator('.wb-card__figure').first().boundingBox();
      const contentBox = await card.locator('.wb-card__horizontal-content').first().boundingBox();
      expect(figBox, 'figure should have a bounding box').not.toBeNull();
      expect(contentBox, 'content should have a bounding box').not.toBeNull();
      expect(figBox!.x, `${attr} should place the figure right of the content`).toBeGreaterThan(contentBox!.x);
    });
  }

  test('image-width="60%" and imagewidth="60%" both apply', async ({ page }) => {
    await page.goto('/');
    for (const attr of ['image-width="60%"', 'imagewidth="60%"']) {
      await page.setContent(`<wb-cardhorizontal
        title="Test"
        image="https://picsum.photos/400/300?random=width-test"
        ${attr}>
        Content
      </wb-cardhorizontal>`);
      await page.addScriptTag({
        type: 'module',
        content: `
          import WB from '/src/core/wb-lazy.js';
          window.WB = WB;
          await WB.init({ autoInject: true });
          await WB.scan(document.body, { eager: true });
        `,
      });
      await page.waitForTimeout(1000);

      const figure = page.locator('.wb-card__figure').first();
      await expect(figure).toBeVisible();
      const width = await figure.evaluate((el) => (el as HTMLElement).style.width);
      expect(width, `${attr} should set the figure's inline width`).toBe('60%');
    }
  });
});
