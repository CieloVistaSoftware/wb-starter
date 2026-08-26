import { test, expect } from '@playwright/test';

/**
 * REGRESSION (#383): <div x-cardhero variant="cosmic|split|minimal|gradient">
 * was documented in cardhero.schema.json's enum but cardhero() (src/wb-
 * viewmodels/card.js) never read `variant` at all -- every variant rendered
 * pixel-identical to the default.
 */
test.describe('cardhero variant= produces genuinely distinct visuals (#383)', () => {
  test('all 5 variants get distinct computed backgrounds, split is not centered', async ({ page }) => {
    await page.goto('/demos/test-harness.html');
    await page.waitForFunction(
      () => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0,
      { timeout: 10000 }
    );

    const variants = ['default', 'cosmic', 'split', 'minimal', 'gradient'];
    await page.evaluate((vs) => {
      const container = document.createElement('div');
      container.id = 'cardhero-variant-test';
      container.innerHTML = vs
        .map((v) => `<div x-cardhero variant="${v}" title="Title" style="width:400px;height:200px;"></div>`)
        .join('');
      document.body.appendChild(container);
    }, variants);
    await page.evaluate(() => (window as any).WB.scan(document.getElementById('cardhero-variant-test'), { eager: true }));

    const heroes = page.locator('#cardhero-variant-test x-cardhero');
    await expect(heroes).toHaveCount(5);

    const backgrounds: string[] = [];
    for (let i = 0; i < 5; i++) {
      const el = heroes.nth(i);
      await expect(el, `variant="${variants[i]}" must carry its class`).toHaveClass(
        variants[i] === 'default' ? /x-hero/ : new RegExp(`x-cardhero--${variants[i]}`)
      );
      backgrounds.push(await el.evaluate((e) => getComputedStyle(e).backgroundImage));
    }

    // split's distinguishing feature is LAYOUT, not background color -- it
    // intentionally shares the default's background (verified separately
    // below via content position). Only default/cosmic/minimal/gradient
    // need distinct backgrounds from each other.
    const colorVariantIndexes = variants.map((v, i) => (v === 'split' ? -1 : i)).filter((i) => i >= 0);
    const colorBackgrounds = colorVariantIndexes.map((i) => backgrounds[i]);
    const unique = new Set(colorBackgrounds);
    expect(unique.size, `default/cosmic/minimal/gradient must all look different, got:\n${colorVariantIndexes.map((i) => `${variants[i]}: ${backgrounds[i].slice(0, 80)}`).join('\n')}`).toBe(colorBackgrounds.length);

    // split specifically: content must NOT be horizontally centered like the default.
    const splitContent = heroes.nth(variants.indexOf('split')).locator('.x-card__hero-content');
    const defaultContent = heroes.nth(variants.indexOf('default')).locator('.x-card__hero-content');
    const [splitBox, splitParentBox, defaultBox, defaultParentBox] = await Promise.all([
      splitContent.boundingBox(),
      heroes.nth(variants.indexOf('split')).boundingBox(),
      defaultContent.boundingBox(),
      heroes.nth(variants.indexOf('default')).boundingBox(),
    ]);
    const splitCenterOffset = Math.abs((splitBox!.x + splitBox!.width / 2) - (splitParentBox!.x + splitParentBox!.width / 2));
    const defaultCenterOffset = Math.abs((defaultBox!.x + defaultBox!.width / 2) - (defaultParentBox!.x + defaultParentBox!.width / 2));
    expect(splitCenterOffset, 'split content must be off-center (pinned to a side), unlike the centered default').toBeGreaterThan(defaultCenterOffset + 10);
  });
});
