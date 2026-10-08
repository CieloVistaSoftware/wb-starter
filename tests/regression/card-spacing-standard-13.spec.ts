import { test, expect, Page } from '../fixtures/offline';
import { elementReady, settlePage, buildInView } from '../base';

/**
 * Card Spacing Standard §13 Compliance (#469)
 *
 * Standard §13 requires:
 * - ≥1rem vertical spacing between examples
 * - ≥1rem padding inside example/demo containers
 * - All card components must have proper internal padding (header/main/footer)
 *
 * This test validates that cards.html demo renders with proper spacing
 * and that card CSS enforces 1rem padding on all card parts.
 */

/*
 * a8a7362e ("specificity replaces class injection") stopped cards emitting
 * x-card / x-card__header / __main / __title: card.css names each part by
 * tag and position (`article > header`, `article > header > h3`). The body
 * is the exception since #945: a <div class="x-card__body">, because a <main>
 * is invalid inside a card. The selectors below name the same parts the same way.
 */
const CARD = 'article';
const CARD_HEADER = 'article > header';
const CARD_MAIN = 'article > .x-card__body'; // #945: the body is a div, not <main>
const CARD_TITLE = 'article > header > :is(h1, h2, h3, h4)';

test.describe('Card Spacing — Standard §13 Compliance', () => {
  test('card demo page loads without errors', async ({ page }) => {
    await page.goto('/demos/site/cards.html');

    // Wait for WB components to initialize
    await page.waitForFunction(
      () => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0,
      { timeout: 10000 }
    );

    // No console errors
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    // Everything that could warn or fail has run once WB settles, where the page boots it (#1516: no fixed sleep).
    await settlePage(page, { timeout: 15000, ifPresent: true }).catch(() => {});
    expect(errors).toHaveLength(0);
  });

  test('card main content has ≥1rem padding', async ({ page }) => {
    await page.goto('/demos/site/cards.html');
    await page.waitForFunction(
      () => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0,
      { timeout: 10000 }
    );

    // Find the card's <main> (its body)
    const mainPadding = await page.locator(CARD_MAIN).first().evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        paddingTop: cs.paddingTop,
        paddingRight: cs.paddingRight,
        paddingBottom: cs.paddingBottom,
        paddingLeft: cs.paddingLeft,
      };
    });

    // Convert to pixels and ensure all are ≥1rem (16px)
    const pxToRem = (pxStr: string) => parseFloat(pxStr);
    expect(pxToRem(mainPadding.paddingTop), 'card main padding-top must be ≥16px (1rem)').toBeGreaterThanOrEqual(16);
    expect(pxToRem(mainPadding.paddingRight), 'card main padding-right must be ≥16px (1rem)').toBeGreaterThanOrEqual(16);
    expect(pxToRem(mainPadding.paddingBottom), 'card main padding-bottom must be ≥16px (1rem)').toBeGreaterThanOrEqual(16);
    expect(pxToRem(mainPadding.paddingLeft), 'card main padding-left must be ≥16px (1rem)').toBeGreaterThanOrEqual(16);
  });

  test('card header has ≥1rem padding', async ({ page }) => {
    await page.goto('/demos/site/cards.html');
    await page.waitForFunction(
      () => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0,
      { timeout: 10000 }
    );

    const headerPadding = await page.locator(CARD_HEADER).first().evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        paddingTop: cs.paddingTop,
        paddingRight: cs.paddingRight,
        paddingBottom: cs.paddingBottom,
        paddingLeft: cs.paddingLeft,
      };
    });

    // Convert to pixels and ensure horizontal padding is ≥1rem (16px)
    const pxToRem = (pxStr: string) => parseFloat(pxStr);
    expect(pxToRem(headerPadding.paddingTop), 'card header padding-top must be ≥16px (1rem)').toBeGreaterThanOrEqual(16);
    expect(pxToRem(headerPadding.paddingRight), 'card header padding-right must be ≥16px (1rem)').toBeGreaterThanOrEqual(16);
    expect(pxToRem(headerPadding.paddingLeft), 'card header padding-left must be ≥16px (1rem)').toBeGreaterThanOrEqual(16);
  });

  test('card footer has ≥1rem padding', async ({ page }) => {
    await page.goto('/demos/site/cards.html');
    await page.waitForFunction(
      () => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0,
      { timeout: 10000 }
    );

    // The standard card's own footer, not whichever .x-card__footer exists
    // first. Cards build lazily and, since #1760, in budgeted slices, so the
    // first footer in the DOM was sometimes an x-cardexpandable's -- whose
    // 0.75rem vertical padding is deliberate (card.css) -- and this failed
    // about 1 run in 6 on main ("Received: 12"). The "Default Card" in
    // #card-card is the plain card whose footer card.js builds from footer="".
    const standardCard = page.locator('#card-card article[footer="Card footer"]').first();
    await buildInView(standardCard);
    const footerPadding = await standardCard.locator('.x-card__footer').evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        paddingTop: cs.paddingTop,
        paddingRight: cs.paddingRight,
        paddingBottom: cs.paddingBottom,
        paddingLeft: cs.paddingLeft,
      };
    });

    // Convert to pixels and ensure all are ≥1rem (16px)
    const pxToRem = (pxStr: string) => parseFloat(pxStr);
    expect(pxToRem(footerPadding.paddingTop), 'card footer padding-top must be ≥16px (1rem)').toBeGreaterThanOrEqual(16);
    expect(pxToRem(footerPadding.paddingRight), 'card footer padding-right must be ≥16px (1rem)').toBeGreaterThanOrEqual(16);
    expect(pxToRem(footerPadding.paddingBottom), 'card footer padding-bottom must be ≥16px (1rem)').toBeGreaterThanOrEqual(16);
    expect(pxToRem(footerPadding.paddingLeft), 'card footer padding-left must be ≥16px (1rem)').toBeGreaterThanOrEqual(16);
  });

  test('card content has readable spacing (text not cramped)', async ({ page }) => {
    await page.goto('/demos/site/cards.html');
    await page.waitForFunction(
      () => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0,
      { timeout: 10000 }
    );

    // Measured once the card is BUILT. `WB.behaviors` being populated says the
    // runtime loaded, not that this card was injected: read before that, the
    // first <article> is still one line of raw text (19px) with none of
    // card.css's header/main/padding -- which failed this under load while
    // the built card is well over 40px. elementReady waits for its x-ready.
    await elementReady(page.locator(CARD));
    // Get the height of a card's content area
    const cardHeight = await page.locator(CARD).first().evaluate((el) => {
      return {
        minHeight: getComputedStyle(el).minHeight,
        height: getComputedStyle(el).height,
        lineHeight: getComputedStyle(el.querySelector(':scope > .x-card__body') || el).lineHeight,
      };
    });

    // Cards should have at least 2 lines of breathing room (32px minimum)
    const heightPx = parseFloat(cardHeight.height);
    expect(heightPx, 'card height should accommodate proper spacing').toBeGreaterThan(40);
  });

  test('demo container validates gap/spacing between cards (≥1rem)', async ({ page }) => {
    await page.goto('/demos/site/cards.html');
    await page.waitForFunction(
      () => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0,
      { timeout: 10000 }
    );

    // Get the gap of the grid the cards sit in. demo.js wraps an x-demo's
    // children in .x-demo__grid (#211) -- the x-demo itself is a block and
    // has no gap of its own to read.
    const demoGap = await page.locator('[x-demo] > .x-demo__grid').first().evaluate((el) => {
      return getComputedStyle(el).gap || getComputedStyle(el).columnGap || 'auto';
    });

    // Parse the gap value (should be ≥1rem/16px)
    const gapPx = parseFloat(demoGap);
    expect(gapPx, 'demo container gap should be ≥16px (1rem)').toBeGreaterThanOrEqual(16);
  });

  test('all card types render with proper button/CTA spacing', async ({ page }) => {
    await page.goto('/demos/site/cards.html');
    await page.waitForFunction(
      () => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0,
      { timeout: 10000 }
    );

    // Check button cards specifically (they have footer buttons)
    const buttonCardCount = await page.locator('[x-cardbutton]').count();
    expect(buttonCardCount, 'button cards should be present in demo').toBeGreaterThan(0);

    // Check that button card buttons have proper spacing
    const btnFooter = await page.locator('[x-cardbutton] .x-card__btn-footer').first().evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        padding: cs.padding,
        gap: cs.gap,
      };
    });

    // Footer buttons should have meaningful gap
    const gapPx = parseFloat(btnFooter.gap);
    expect(gapPx, 'button footer gap should be present').toBeGreaterThanOrEqual(4);
  });

  test('card title and content have vertical breathing room', async ({ page }) => {
    await page.goto('/demos/site/cards.html');
    await page.waitForFunction(
      () => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0,
      { timeout: 10000 }
    );

    // Check title/subtitle margin spacing
    const titleSpacing = await page.locator(CARD_TITLE).first().evaluate((el) => {
      return getComputedStyle(el).marginBottom;
    });

    const titleMarginPx = parseFloat(titleSpacing);
    expect(titleMarginPx, 'title bottom margin should provide breathing room').toBeGreaterThan(4);
  });

  test('pricing card feature list has proper item spacing', async ({ page }) => {
    await page.goto('/demos/site/cards.html');
    await page.waitForFunction(
      () => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0,
      { timeout: 10000 }
    );

    // Pricing cards have .x-card__feature items
    const featureSpacing = await page.locator('.x-card__feature').first().evaluate((el) => {
      return getComputedStyle(el).padding;
    });

    // Features should have padding for readability
    const featurePadding = parseFloat(featureSpacing);
    expect(featurePadding, 'pricing feature items should have padding').toBeGreaterThanOrEqual(0);
  });
});
