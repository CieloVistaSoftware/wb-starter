import { test, expect } from '@playwright/test';

const pageSpecs = [
  {
    url: '/',
    elements: [
      { selector: 'wb-cardhero', description: 'Hero section', required: true },
      { selector: 'wb-card[variant="float"]', description: 'Feature cards', minCount: 6 },
      { selector: 'wb-card[variant="glass"]', description: 'Live demo glass card', required: true },
      { selector: 'h2:has-text("Ready to build something")', description: 'CTA heading', required: true },
      { selector: 'a:has-text("Get Started")', description: 'Get Started link', required: true },
      { selector: 'a:has-text("GitHub")', description: 'GitHub link', required: true }
    ]
  },
  // Add more page specs here
];

test.describe('Universal Compliance', () => {
  for (const spec of pageSpecs) {
    test(`Universal compliance: ${spec.url}`, async ({ page }) => {
      await page.goto(spec.url);
      await page.waitForTimeout(1000); // Wait for hydration
      for (const el of spec.elements) {
        const locator = page.locator(el.selector);
        if (el.required) {
          await expect(locator, `${el.description} (${el.selector})`).toBeVisible();
        }
        if (el.minCount) {
          const count = await locator.count();
          expect(count, `${el.description} (${el.selector})`).toBeGreaterThanOrEqual(el.minCount);
        }
      }
    });
  }
});
