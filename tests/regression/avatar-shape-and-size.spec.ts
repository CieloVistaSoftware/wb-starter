import { test, expect } from '@playwright/test';

/**
 * avatar.schema.json declares `shape` (circle/square/rounded) and `size`
 * (xs/sm/md/lg/xl/2xl) as real properties with `appliesClass` metadata, and
 * demos/site/feedback.html renders a "shape variants" and "size variants"
 * section for each enum value -- but src/styles/behaviors/avatar.css only
 * had attribute-selector rules for size="sm"/"md"/"lg"/"xl" (missing xs and
 * 2xl) and had ZERO rules for `shape` at all: every <wb-avatar> was
 * hardcoded to border-radius:50% on the base tag selector. Every shape
 * variant rendered as an identical circle regardless of shape="square" /
 * shape="rounded", and size="xs"/size="2xl" silently fell back to the
 * default 40px. Confirmed live (screenshot) before the fix: three
 * "shape variants" avatars, all circles.
 */
test.describe('wb-avatar shape and size (feedback demo page)', () => {
  test('shape="circle"/"square"/"rounded" render visibly distinct border-radius', async ({ page }) => {
    await page.goto('http://localhost:3000/demos/site/feedback.html');
    await page.waitForSelector('wb-avatar[shape="circle"]');

    const circle = page.locator('wb-avatar[shape="circle"]').first();
    const square = page.locator('wb-avatar[shape="square"]').first();
    const rounded = page.locator('wb-avatar[shape="rounded"]').first();

    const [circleRadius, squareRadius, roundedRadius] = await Promise.all([
      circle.evaluate((el) => getComputedStyle(el).borderRadius),
      square.evaluate((el) => getComputedStyle(el).borderRadius),
      rounded.evaluate((el) => getComputedStyle(el).borderRadius),
    ]);

    expect(squareRadius).toBe('0px');
    expect(circleRadius).not.toBe(squareRadius);
    expect(roundedRadius).not.toBe(squareRadius);
    expect(roundedRadius).not.toBe(circleRadius);
  });

  test('size="xs" and size="2xl" render visibly distinct dimensions from the default', async ({ page }) => {
    await page.goto('http://localhost:3000/demos/site/feedback.html');
    await page.waitForSelector('wb-avatar[size="xs"]');

    const xs = page.locator('wb-avatar[size="xs"]').first();
    const md = page.locator('wb-avatar[size="md"]').first();
    const xxl = page.locator('wb-avatar[size="2xl"]').first();

    const [xsWidth, mdWidth, xxlWidth] = await Promise.all([
      xs.evaluate((el) => getComputedStyle(el).width),
      md.evaluate((el) => getComputedStyle(el).width),
      xxl.evaluate((el) => getComputedStyle(el).width),
    ]);

    expect(xsWidth).not.toBe(mdWidth);
    expect(xxlWidth).not.toBe(mdWidth);
    expect(xxlWidth).not.toBe(xsWidth);
  });
});
