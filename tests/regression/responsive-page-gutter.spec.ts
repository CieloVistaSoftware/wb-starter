import { test, expect } from '@playwright/test';

const MOBILE = { width: 375, height: 812 };
const DESKTOP = { width: 1280, height: 800 };

const SURFACES = [
  { path: '/demos/site/content.html', selector: 'body.demo-page', desktop: 24 },
  { path: '/demos/site/learn-more.html', selector: 'body > .page', desktop: 41.9 },
  { path: '/public/doc-viewer.html?page=docs', selector: '#doc-viewer-body', desktop: 32 },
];

test.describe('responsive page gutters (#450)', () => {
  for (const surface of SURFACES) {
    test(`${surface.path} reduces flat mobile padding without changing desktop spacing`, async ({ page }) => {
      await page.setViewportSize(MOBILE);
      await page.goto(surface.path, { waitUntil: 'domcontentloaded' });
      const mobilePadding = await page.locator(surface.selector).evaluate((element) => (
        parseFloat(getComputedStyle(element).paddingLeft)
      ));
      const mobileRootFontSize = await page.evaluate(() => (
        parseFloat(getComputedStyle(document.documentElement).fontSize)
      ));

      expect(mobilePadding, 'mobile page gutter should be one design-token step').toBeCloseTo(mobileRootFontSize, 1);

      await page.setViewportSize(DESKTOP);
      await page.reload({ waitUntil: 'domcontentloaded' });
      const desktopPadding = await page.locator(surface.selector).evaluate((element) => (
        parseFloat(getComputedStyle(element).paddingLeft)
      ));

      expect(desktopPadding, 'desktop page gutter must retain its existing spacing').toBeCloseTo(surface.desktop, 1);
    });
  }
});