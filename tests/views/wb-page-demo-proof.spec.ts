import { test, expect } from '@playwright/test';

test.describe('wb-page-demo — deterministic proof', () => {
  test('server-render includes authoritative data-theme and page paints dark even with persisted light', async ({ page, request }) => {
    // 1) prove the source HTML contains an authoritative data-theme (server-side)
    const res = await request.get('/demos/wb-page-demo.html');
    const src = await res.text();
    expect(src).toContain('html lang="en" data-theme="dark"');

    // 2) simulate a persisted light preference and ensure first paint is dark
    await page.addInitScript(() => { try { localStorage.setItem('wb-theme', 'light'); } catch (e) {} });
    await page.goto('/demos/wb-page-demo.html', { waitUntil: 'load' });

    const computedBg = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bg-color').trim());
    const htmlAttr = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));

    expect(computedBg).toBeTruthy();
    expect(computedBg).toContain('10%');
    expect(htmlAttr === 'dark' || htmlAttr === null).toBeTruthy();

    // cleanup
    await page.evaluate(() => { try { localStorage.removeItem('wb-theme'); } catch(e){} });
  });
});