import { test, expect } from '../fixtures/offline';
import { wbIdle } from '../base';

const pageSpecs = [
  {
    url: '/',
    elements: [
      { selector: '[x-cardhero]', description: 'Hero section', required: true },
      // <x-card> tags were removed in 4.0.0 -- an <article> IS a card, and
      // pages/home.html authors these as <article variant="...">. The old
      // tag selectors matched nothing on any page.
      { selector: 'article[variant="float"]', description: 'Feature cards', minCount: 6 },
      { selector: 'article[variant="glass"]', description: 'Live demo glass card', required: true },
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
      await wbIdle(page);
      for (const el of spec.elements) {
        const locator = page.locator(el.selector);
        // #1092: each spec row must declare a check, or it would silently assert nothing
        expect(Boolean(el.required || el.minCount), `${el.description} (${el.selector}) declares neither required nor minCount`).toBe(true);
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
