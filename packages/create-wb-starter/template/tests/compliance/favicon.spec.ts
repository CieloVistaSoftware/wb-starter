/**
 * Neither index.html nor project-index.html ever declared a <link
 * rel="icon">, so the browser fell back to its implicit /favicon.ico
 * probe -- which 404'd (no such file at the root) on every single page
 * load, every browser, every time. site-engine.js's updateFavicon() sets
 * a *dynamic* icon from config/site.json's branding.browserTabIcon, but
 * only for pages that boot through WBSite (the main SPA) -- project-index.html
 * and every standalone demos/*.html page never call it at all, so those
 * had literally no way to get a favicon.
 *
 * Fixed: a real favicon.svg at the project root (a blue star, already
 * existed but was never referenced by anything -- pure orphaned asset),
 * a static <link rel="icon"> in both index.html and project-index.html,
 * and config/site.json's browserTabIcon now points at the same file so
 * the dynamic override stays consistent instead of fighting the static tag.
 */
import { test, expect } from '@playwright/test';

for (const path of ['/', '/project-index.html']) {
  test(`${path}: has a working <link rel="icon">, no implicit /favicon.ico 404`, async ({ page }) => {
    const failed: string[] = [];
    page.on('requestfailed', (req) => { if (req.url().endsWith('/favicon.ico')) failed.push(req.url()); });
    page.on('response', (res) => { if (res.url().endsWith('/favicon.ico') && res.status() === 404) failed.push(res.url()); });

    await page.goto(path);
    await page.waitForTimeout(500);

    const icon = page.locator('link[rel="icon"]');
    await expect(icon).toHaveCount(1);
    const href = await icon.getAttribute('href');
    expect(href).toBeTruthy();

    const iconResponse = await page.request.get(new URL(href!, page.url()).href);
    expect(iconResponse.status()).toBe(200);

    expect(failed, 'no request for the implicit /favicon.ico should ever happen or 404').toEqual([]);
  });
}
