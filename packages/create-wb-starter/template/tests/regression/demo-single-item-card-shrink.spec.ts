import { test, expect } from '@playwright/test';

const CASES = [
  { name: 'pricing', file: 'docs/behaviors/cards/cardpricing.md', selector: 'x-cardpricing' },
  { name: 'stats', file: 'docs/behaviors/cards/cardstats.md', selector: 'x-cardstats' },
];

for (const cardCase of CASES) {
  test(`${cardCase.name} canonical demo stays usable when §7 shrinks one item`, async ({ page }) => {
    await page.goto('/public/doc-viewer.html?file=' + encodeURIComponent(cardCase.file), {
      waitUntil: 'domcontentloaded',
    });

    const demo = page.locator('x-demo').first();
    const card = demo.locator(`.x-demo__grid ${cardCase.selector}`).first();
    const code = demo.locator('.x-demo__code').first();
    await expect(card).toBeVisible({ timeout: 20000 });
    await expect(code).toBeVisible({ timeout: 20000 });

    const metrics = await demo.evaluate((demoElement) => {
      const grid = demoElement.querySelector('.x-demo__grid') as HTMLElement | null;
      const cardElement = grid?.firstElementChild as HTMLElement | null;
      const pre = demoElement.querySelector('.x-demo__code') as HTMLElement | null;
      if (!grid || !cardElement || !pre) throw new Error('canonical demo did not build');
      return {
        cardWidth: cardElement.getBoundingClientRect().width,
        gridWidth: grid.getBoundingClientRect().width,
        demoWidth: demoElement.getBoundingClientRect().width,
        codeWidth: pre.getBoundingClientRect().width,
        codeScrollWidth: pre.scrollWidth,
        viewportWidth: window.innerWidth,
      };
    });

    expect(metrics.cardWidth, `${cardCase.name} card must not collapse`).toBeGreaterThanOrEqual(200);
    expect(metrics.gridWidth, `${cardCase.name} grid should shrink to its one card`).toBeLessThan(
      metrics.viewportWidth * 0.75
    );
    expect(metrics.demoWidth, `${cardCase.name} demo should not fill the content column`).toBeLessThan(
      metrics.viewportWidth * 0.75
    );
    expect(metrics.codeWidth, `${cardCase.name} code panel must retain the 50vw cap`).toBeLessThanOrEqual(
      metrics.viewportWidth * 0.5 + 2
    );
    expect(metrics.codeWidth, `${cardCase.name} code panel must show its available source width`).toBeGreaterThanOrEqual(
      Math.min(metrics.codeScrollWidth, metrics.viewportWidth * 0.5) - 2
    );
  });
}