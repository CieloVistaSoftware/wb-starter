import { test, expect } from '@playwright/test';

// Visual regression tests for templates/pages changed in the templates inline-style refactor.
// To (re)generate baseline images locally: `npm run test:visual:update`

const pages = [
  { path: '/pages/about.html', name: 'about' },
  { path: '/templates/presets/portfolio/pages/home.html', name: 'portfolio-home' },
  { path: '/templates/presets/saas/pages/pricing.html', name: 'saas-pricing' },
  { path: '/templates/presets/portfolio/pages/contact.html', name: 'portfolio-contact' },
];

for (const p of pages) {
  test(`visual: ${p.name}`, async ({ page }) => {
    await page.goto(p.path, { waitUntil: 'networkidle' });
    await page.setViewportSize({ width: 1200, height: 900 });

    // Remove or stabilize elements that may cause flakiness (none expected for these templates,
    // but keep pattern here for future tests)
    await page.evaluate(() => {
      document.querySelectorAll('[data-dynamic], script[type="module"]').forEach(n => n.remove());
    });

    const screenshotName = `${p.name}.png`;
    await expect(page).toHaveScreenshot(screenshotName, { animations: 'disabled', fullPage: false });
  });
}
