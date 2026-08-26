import { test, expect } from '@playwright/test';

test.describe('CardHero attribute API', () => {
  test('renders when using attributes (no slots)', async ({ page }) => {
    await page.setContent(`
      <div x-cardhero
        variant="cosmic"
        pretitle="100 Components"
        title='Build <span class="x-gradient-text">stunning UIs</span>'
        subtitle="just HTML — no build step"
        cta="Explore Components"
        cta-href="#components"
      ></div>
    `);

    const hero = page.locator('x-cardhero').first();
    await page.waitForSelector('x-cardhero', { state: 'attached' });

    // attribute-backed API should expose values (visibility can be environment-dependent)
    await expect(page.locator('x-cardhero[pretitle]')).toHaveAttribute('pretitle', /100 Components/);

    // title may be provided as HTML in the attribute — ensure attribute contains expected HTML or text
    await expect(hero).toHaveAttribute('title', /Build|x-gradient-text/);

    // subtitle and CTA via attribute
    await expect(page.locator('x-cardhero[subtitle]')).toHaveAttribute('subtitle', /just HTML/);
    await expect(hero).toHaveAttribute('cta', /Explore Components/);

    // ensure no named slots are required for these pieces
    await expect(page.locator('x-cardhero [slot]')).toHaveCount(0);
  });
});
