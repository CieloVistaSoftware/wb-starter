import { test, expect, Page } from '@playwright/test';

const REQUIRED_BEHAVIORS = [
  'card', 'cardimage', 'cardbutton', 'cardhero', 'cardoverlay', 
  'cardproduct', 'cardprofile', 'cardportfolio', 'progressbar', 'spinner', 'chip'
];

test.describe('Behaviors Registry', () => {
  test('should have all required card behaviors registered', async ({ page }: { page: Page }) => {
    await page.goto('/index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0);
    const missing = await page.evaluate((required: string[]) => {
      if (!(window as any).WB || !(window as any).WB.behaviors) return required;
      return required.filter(name => !(name in (window as any).WB.behaviors));
    }, REQUIRED_BEHAVIORS);
    expect(missing, `Missing behaviors: ${missing.join(', ')}`).toEqual([]);
  });

  test('should have more than 100 behaviors registered', async ({ page }: { page: Page }) => {
    await page.goto('/index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
    const count = await page.evaluate(() => Object.keys((window as any).WB.behaviors).length);
    expect(count).toBeGreaterThan(100);
  });
});
