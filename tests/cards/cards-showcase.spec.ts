/**
 * Cards Showcase Tests
 * ====================
 * Tests every card variant rendered on demos/site/cards.html.
 *
 * #863: this spec used to navigate to /demos/cards-showcase.html, which has
 * returned 404 since d4278513 consolidated the demos. page.goto() does not
 * throw on a 404, so all 74 tests ran against the 404 body: 26 failed and 47
 * "passed" without asserting anything, because their entire bodies sat inside
 * `if (await x.count() > 0)` guards or looped over zero-length locator lists.
 *
 * FOUR RULES for this file, all load-bearing. The first two keep the spec
 * honest; the last two keep it from lying in the other direction (failing on
 * timing rather than on the product).
 *
 *   1. NO `if (await x.count() > 0)` guards. A guard turns "the element is
 *      missing" into a pass, which is exactly how this spec stayed green for
 *      months while testing nothing. Assert the element exists.
 *
 *   2. NO loop over `.all()` without first asserting the list is non-empty.
 *      A zero-iteration loop asserts nothing.
 *
 *   3. Locate cards by their WB-APPLIED class, not just the authored
 *      attribute: `.x-card[elevated]`, not `[elevated]`. The authored element
 *      is in the DOM from the first byte of HTML; the styles, roles and child
 *      structure only exist after WB upgrades it. A bare attribute selector
 *      resolves instantly to a raw, un-upgraded element, and reading a
 *      computed style off it gets pre-upgrade values. Under --workers=8 that
 *      cost 9 failures that all passed in isolation.
 *      (cardnotification is the exception: it upgrades to `.x-notification`,
 *      not `.x-card`.)
 *
 *   4. NO one-shot `await locator.count()` / `textContent()` in an assertion.
 *      Those do not retry, so they capture whatever the page happened to look
 *      like at that instant. Use auto-retrying matchers, or `expect.poll`.
 *
 * Same repoint + tag-to-attribute selector fix as #843 did for
 * cardimage-render.spec.ts / card-image-render.spec.ts.
 */

import { test, expect as baseExpect, type Page } from '@playwright/test';

/**
 * Every assertion in this file gets a 15s budget instead of Playwright's
 * default 5s.
 *
 * The 5s default is not a statement about correctness, it is a guess about
 * machine speed -- and it is the wrong guess for THIS page. cards.html is
 * ~39,000px with 281 cards and 293 x-demo code panels, and `--workers=8`
 * renders eight copies of it at once. Cards far down the document take
 * measurably longer than 5s to upgrade under that load, so a 5s gate reports
 * "element(s) not found" for a card that renders perfectly well.
 *
 * Observed directly: two consecutive `--workers=8 --repeat-each=2` runs each
 * came back 123/124, failing on a DIFFERENT test each time, every failure a
 * timeout and none an assertion about the product. That is a budget problem,
 * not a defect.
 *
 * This widens patience only. Nothing is skipped, softened, or made
 * conditional -- a genuinely broken page still fails, 10 seconds later.
 */
const expect = baseExpect.configure({ timeout: 15000 });

const CARDS_PAGE = '/demos/site/cards.html';

/**
 * Block until WB has actually finished upgrading the page.
 *
 * This replaces a fixed `waitForTimeout(1500)`. 1.5s was enough on an idle
 * machine and NOT enough under `--workers=8`, where 9 tests failed reading
 * markup WB had not produced yet -- every one of them green in isolation.
 * A fixed sleep cannot be right at both loads; the readiness condition can.
 *
 * Polls `.x-card` count until it stops growing. querySelectorAll does not
 * force layout, so this stays cheap on a ~39,000px, 281-card document --
 * unlike polling `scrollHeight`, which reflows the whole thing and measured
 * 8-9s per test when tried.
 *
 * Throws on timeout rather than continuing quietly: if WB genuinely never
 * initializes, that is a real failure and this spec should say so.
 */
async function waitForWbReady(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const w = window as unknown as { __wbCardCount?: number; __wbStableTicks?: number };
    const n = document.querySelectorAll('.x-card').length;
    if (n === 0) {
      w.__wbCardCount = 0;
      w.__wbStableTicks = 0;
      return false;
    }
    if (w.__wbCardCount === n) {
      w.__wbStableTicks = (w.__wbStableTicks ?? 0) + 1;
    } else {
      w.__wbCardCount = n;
      w.__wbStableTicks = 0;
    }
    return (w.__wbStableTicks ?? 0) >= 3;
  }, null, { timeout: 30000, polling: 200 });
}

/*
 * GEOMETRY NOTE -- read before adding any test that measures layout.
 *
 * demos/site/cards.html is ~39,000px tall with 281 cards and ~100 remote
 * images, so the document keeps reflowing after load. Two SEPARATE
 * `boundingBox()` calls can straddle a reflow and compare coordinates from
 * two different layouts: that is what produced a 29,053px gap between the
 * figure and the content of a horizontal card that is, in fact, side by side.
 *
 * Take related measurements ATOMICALLY inside a single evaluate(), never as
 * two awaited boundingBox() calls.
 */

test.describe('Cards Showcase Page', () => {
  // 60s instead of the behaviors project's default 30s, scoped here rather
  // than in playwright.config.ts so it applies to this page only.
  //
  // Same reasoning the `integration` project already documents for its own
  // 60s: "under a full parallel run browsers are CPU-starved and the default
  // 30s timeout flakes". That comment is about a page with 38 x-demos.
  // demos/site/cards.html has 293, plus 281 cards, in a ~39,000px document --
  // and 8 workers render 8 copies of it at once.
  //
  // This MUST be describe.configure, not test.setTimeout() inside beforeEach:
  // the `page` fixture is constructed BEFORE the hook body runs, so a
  // setTimeout() call in the hook comes too late to cover it. Measured at
  // --workers=8: 5 tests died on `browserContext.newPage: Test timeout of
  // 30000ms exceeded` with setTimeout(60_000) as the hook's first statement.
  test.describe.configure({ timeout: 60_000 });

  test.beforeEach(async ({ page }) => {
    // waitUntil:'domcontentloaded', NOT the default 'load'. Every test gets a
    // fresh context with a cold cache, and this page pulls ~100 images from
    // picsum.photos / i.pravatar.cc -- waiting on all of them measured ~60s
    // per test once those hosts started throttling. Nothing here asserts on a
    // decoded bitmap.
    const response = await page.goto(CARDS_PAGE, { waitUntil: 'domcontentloaded' });

    // #863: assert the target actually exists. goto() resolves on a 404, so
    // without this the whole file silently degrades to testing an error page
    // again the next time a demo gets moved.
    expect(response?.status(), `${CARDS_PAGE} must exist`).toBe(200);

    // NO global "wait for WB to finish" barrier here, deliberately.
    //
    // Readiness is expressed per assertion instead: every locator in this
    // file is gated on the WB-applied class (`.x-card[...]`), which cannot
    // match until that card is upgraded, and Playwright auto-waits for it.
    // A test that needs one profile card should wait for one profile card.
    //
    // A global barrier forced all 281 cards + 293 code panels to hydrate in
    // EVERY test, in all 8 worker contexts at once. On a 15.7GB box that ran
    // the machine to 0.8GB free and 100% CPU, and the starvation showed up as
    // `browserContext.newPage: Test timeout of 60000ms exceeded` -- tests
    // dying before they touched the page at all. Raising the timeout again
    // would only have hidden that; doing less work per test fixes it.
    //
    // Tests that genuinely need the WHOLE page hydrated (the two that measure
    // every .x-card) call waitForWbReady() themselves.
  });

  // ═══════════════════════════════════════════════════════════════════════
  // PAGE STRUCTURE & INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════
  test.describe('Page Structure', () => {
    test('page loads without console errors', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error' && !msg.text().includes('favicon')) {
          errors.push(msg.text());
        }
      });

      await page.reload({ waitUntil: 'domcontentloaded' });
      await waitForWbReady(page);

      const unexpectedErrors = errors.filter(e =>
        !e.includes('net::ERR') &&
        !e.includes('Failed to load resource') &&
        !e.includes('404')
      );

      expect(unexpectedErrors).toHaveLength(0);
    });

    test('page has heading with title', async ({ page }) => {
      // demos/site/cards.html is a demo-site sub-page: a bare <h1>, not the
      // <header> chrome the deleted standalone showcase page carried. This
      // doubles as the 404 tripwire -- an error body has no such heading.
      const heading = page.locator('h1').first();
      await expect(heading).toBeVisible();
      await expect(heading).toContainText('Card');
    });

    test('every card variant is present on the page', async ({ page }) => {
      // #863: the single most important assertion in this file. If the page
      // ever loses its cards (moved again, renamed, 404), every downstream
      // test must fail loudly rather than quietly find nothing.
      const variants = [
        'x-card', 'x-cardstats', 'x-cardprofile', 'x-cardpricing',
        'x-cardimage', 'x-cardbutton', 'x-cardtestimonial', 'x-cardproduct',
        'x-cardnotification', 'x-cardfile', 'x-cardhero', 'x-cardlink',
        'x-cardhorizontal', 'x-cardoverlay', 'x-cardexpandable',
        'x-cardminimizable', 'x-carddraggable',
      ];

      for (const variant of variants) {
        await expect(
          page.locator(`[${variant}]`),
          `[${variant}] should be demonstrated on ${CARDS_PAGE}`
        ).not.toHaveCount(0);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CARD TYPE: card (base)
  // ═══════════════════════════════════════════════════════════════════════
  test.describe('Card (Base)', () => {
    test('basic card renders with title', async ({ page }) => {
      // 4.0.0: attributes are bare (title=), not data-prefixed.
      const card = page.locator('article.x-card[title="Welcome"]');
      await expect(card).toBeVisible();
      await expect(card.locator('.x-card__title')).toContainText('Welcome');
    });

    test('elevated card has shadow', async ({ page }) => {
      const card = page.locator('.x-card[elevated]').first();
      await expect(card).toBeVisible();
      await expect.poll(() => card.evaluate(el =>
        window.getComputedStyle(el).boxShadow
      )).not.toBe('none');
    });

    test('clickable card shows cursor pointer', async ({ page }) => {
      const card = page.locator('.x-card[clickable]').first();
      await expect(card).toBeVisible();
      await expect.poll(() => card.evaluate(el =>
        window.getComputedStyle(el).cursor
      )).toBe('pointer');
    });

    test('clickable card has role button', async ({ page }) => {
      const card = page.locator('.x-card[clickable]').first();
      await expect(card).toBeVisible();
      await expect(card).toHaveAttribute('role', 'button');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CARD TYPE: cardstats
  // ═══════════════════════════════════════════════════════════════════════
  test.describe('Card Stats', () => {
    test('stats card renders value', async ({ page }) => {
      const statsCard = page.locator('.x-card[x-cardstats]').first();
      await expect(statsCard).toBeVisible();

      const value = statsCard.locator('.x-card__stats-value');
      await expect(value).toBeVisible();
    });

    test('stats card shows label', async ({ page }) => {
      const statsCard = page.locator('.x-card[x-cardstats][label]').first();
      const label = statsCard.locator('.x-card__stats-label');
      await expect(label).toBeVisible();
    });

    test('stats card with trend up shows up arrow', async ({ page }) => {
      // 4.0.0: attribute form, not the x-cardstats[...] tag form.
      const statsCard = page.locator('.x-card[x-cardstats][trend="up"]').first();
      await expect(statsCard).toBeVisible();
      const trend = statsCard.locator('.x-card__stats-trend');
      await expect(trend).toContainText('↑');
    });

    test('stats card with trend down shows down arrow', async ({ page }) => {
      const statsCard = page.locator('.x-card[x-cardstats][trend="down"]').first();
      await expect(statsCard).toBeVisible();
      const trend = statsCard.locator('.x-card__stats-trend');
      await expect(trend).toContainText('↓');
    });

    test('stats card shows icon', async ({ page }) => {
      const statsCard = page.locator('.x-card[x-cardstats][icon]').first();
      const icon = statsCard.locator('.x-card__icon');
      await expect(icon).toBeVisible();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CARD TYPE: cardprofile
  // ═══════════════════════════════════════════════════════════════════════
  test.describe('Card Profile', () => {
    test('profile card renders avatar', async ({ page }) => {
      const profileCard = page.locator('.x-card[x-cardprofile][avatar]').first();
      await expect(profileCard).toBeVisible();

      const avatar = profileCard.locator('.x-card__avatar');
      await expect(avatar).toBeVisible();
    });

    test('profile card shows name', async ({ page }) => {
      const profileCard = page.locator('.x-card[x-cardprofile][name]').first();
      const name = profileCard.locator('.x-card__name');
      await expect(name).toBeVisible();
    });

    test('profile card shows role', async ({ page }) => {
      const profileCard = page.locator('.x-card[x-cardprofile][role]').first();
      const roleEl = profileCard.locator('.x-card__role');
      await expect(roleEl).toBeVisible();
    });

    test('profile card shows bio', async ({ page }) => {
      const profileCard = page.locator('.x-card[x-cardprofile][bio]').first();
      const bio = profileCard.locator('.x-card__bio');
      await expect(bio).toBeVisible();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CARD TYPE: cardpricing
  // ═══════════════════════════════════════════════════════════════════════
  test.describe('Card Pricing', () => {
    test('pricing card renders plan name', async ({ page }) => {
      const pricingCard = page.locator('.x-card[x-cardpricing]').first();
      await expect(pricingCard).toBeVisible();

      const plan = pricingCard.locator('.x-card__plan');
      await expect(plan).toBeVisible();
    });

    test('pricing card shows price', async ({ page }) => {
      const pricingCard = page.locator('.x-card[x-cardpricing]').first();
      const price = pricingCard.locator('.x-card__amount');
      await expect(price).toBeVisible();
    });

    test('pricing card shows features list', async ({ page }) => {
      const pricingCard = page.locator('.x-card[x-cardpricing][features]').first();
      const features = pricingCard.locator('.x-card__features');
      await expect(features).toBeVisible();

      await expect(pricingCard.locator('.x-card__feature')).not.toHaveCount(0);
    });

    test('pricing card has CTA button', async ({ page }) => {
      const pricingCard = page.locator('.x-card[x-cardpricing]').first();
      const cta = pricingCard.locator('.x-card__cta');
      await expect(cta).toBeVisible();
    });

    test('featured pricing card is scaled up', async ({ page }) => {
      // 4.0.0: boolean attribute, not featured="true".
      const featuredCard = page.locator('.x-card[x-cardpricing][featured]').first();
      await expect(featuredCard).toBeVisible();
      await expect.poll(() => featuredCard.evaluate(el =>
        window.getComputedStyle(el).transform
      )).toContain('matrix');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CARD TYPE: cardimage
  // ═══════════════════════════════════════════════════════════════════════
  test.describe('Card Image', () => {
    test('image card renders image', async ({ page }) => {
      const imageCard = page.locator('.x-card[x-cardimage]').first();
      await expect(imageCard).toBeVisible();

      const img = imageCard.locator('img').first();
      await expect(img).toBeVisible();
    });

    test('image card respects aspect ratio', async ({ page }) => {
      const imageCard = page.locator('.x-card[x-cardimage][aspect]').first();
      await expect(imageCard).toBeVisible();
      const figure = imageCard.locator('.x-card__figure').first();
      await expect(figure).toBeAttached();
      await expect.poll(() => figure.evaluate(el =>
        window.getComputedStyle(el).aspectRatio
      )).not.toBe('auto');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CARD TYPE: cardbutton
  // ═══════════════════════════════════════════════════════════════════════
  test.describe('Card Button', () => {
    test('button card renders action buttons', async ({ page }) => {
      const buttonCard = page.locator('.x-card[x-cardbutton][primary]').first();
      await expect(buttonCard).toBeVisible();

      await expect(buttonCard.locator('.x-card__btn')).not.toHaveCount(0);
    });

    test('primary button is styled differently', async ({ page }) => {
      const primaryBtn = page.locator('.x-card__btn--primary').first();
      await expect(primaryBtn).toBeVisible();
      const bg = await primaryBtn.evaluate(el =>
        window.getComputedStyle(el).backgroundColor
      );
      expect(bg).not.toBe('transparent');
      expect(bg).not.toBe('rgba(0, 0, 0, 0)');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CARD TYPE: cardtestimonial
  // ═══════════════════════════════════════════════════════════════════════
  test.describe('Card Testimonial', () => {
    test('testimonial card shows quote', async ({ page }) => {
      const testimonialCard = page.locator('.x-card[x-cardtestimonial]').first();
      await expect(testimonialCard).toBeVisible();

      const quote = testimonialCard.locator('.x-card__quote');
      await expect(quote).toBeVisible();
    });

    test('testimonial card shows author', async ({ page }) => {
      const testimonialCard = page.locator('.x-card[x-cardtestimonial][author]').first();
      const author = testimonialCard.locator('.x-card__author');
      await expect(author).toBeVisible();
    });

    test('testimonial card shows rating stars', async ({ page }) => {
      const testimonialCard = page.locator('.x-card[x-cardtestimonial][rating]').first();
      await expect(testimonialCard).toBeVisible();
      const rating = testimonialCard.locator('.x-card__rating');
      await expect(rating).toBeVisible();
      await expect(rating).toContainText('★');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CARD TYPE: cardproduct
  // ═══════════════════════════════════════════════════════════════════════
  test.describe('Card Product', () => {
    test('product card shows image', async ({ page }) => {
      const productCard = page.locator('.x-card[x-cardproduct][image]').first();
      await expect(productCard).toBeVisible();

      const img = productCard.locator('img').first();
      await expect(img).toBeVisible();
    });

    test('product card shows price', async ({ page }) => {
      const productCard = page.locator('.x-card[x-cardproduct]').first();
      const price = productCard.locator('.x-card__price-current');
      await expect(price).toBeVisible();
    });

    test('product card has add to cart button', async ({ page }) => {
      const productCard = page.locator('.x-card[x-cardproduct]').first();
      const cta = productCard.locator('.x-card__product-cta');
      await expect(cta).toBeVisible();
    });

    test('product card with original price shows strikethrough', async ({ page }) => {
      // 4.0.0: original-price, not data-original-price.
      const productCard = page.locator('.x-card[x-cardproduct][original-price]').first();
      await expect(productCard).toBeVisible();
      const original = productCard.locator('.x-card__price-original');
      await expect(original).toBeAttached();
      await expect.poll(() => original.evaluate(el =>
        window.getComputedStyle(el).textDecoration
      )).toContain('line-through');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CARD TYPE: cardnotification
  // NOTE: cardnotification upgrades to .x-notification, NOT .x-card.
  // ═══════════════════════════════════════════════════════════════════════
  test.describe('Card Notification', () => {
    test('notification cards render all variants', async ({ page }) => {
      // 4.0.0: variant=, not type=, and attribute form not tag form.
      const variants = ['info', 'success', 'warning', 'error'];

      for (const variant of variants) {
        const card = page.locator(`.x-notification[x-cardnotification][variant="${variant}"]`);
        await expect(card, `variant="${variant}" should be demonstrated`).not.toHaveCount(0);
        await expect(card.first()).toBeVisible();
      }
    });

    test('notification card has role alert', async ({ page }) => {
      const notification = page.locator('.x-notification[x-cardnotification]').first();
      await expect(notification).toBeVisible();
      await expect(notification).toHaveAttribute('role', 'alert');
    });

    test('dismissible notification has close button', async ({ page }) => {
      // cardnotification is dismissible by default (card.js:1735), and the
      // rendered class is .x-notification__dismiss -- the spec's old
      // .x-card__notification-dismiss exists nowhere in src/.
      const notification = page.locator('.x-notification[x-cardnotification]').first();
      const closeBtn = notification.locator('.x-notification__dismiss');
      await expect(closeBtn).toBeVisible();
    });

    test('clicking dismiss removes notification', async ({ page }) => {
      // Target a UNIQUE notification, not `.first()`. Playwright locators
      // re-resolve on every assertion, so `.first()` silently slides onto the
      // NEXT notification once the first one is removed -- the assertion then
      // checks the wrong element and reports the dismiss as broken.
      const notification = page.locator('[x-cardnotification][title="Changes Saved!"]');
      await expect(notification).toHaveCount(1);

      const closeBtn = notification.locator('.x-notification__dismiss');
      await expect(closeBtn).toBeVisible();

      await closeBtn.click();

      await expect(notification).toHaveCount(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CARD TYPE: cardfile
  // ═══════════════════════════════════════════════════════════════════════
  test.describe('Card File', () => {
    test('file card shows filename', async ({ page }) => {
      const fileCard = page.locator('.x-card[x-cardfile]').first();
      await expect(fileCard).toBeVisible();

      const filename = fileCard.locator('.x-card__filename');
      await expect(filename).toBeVisible();
    });

    test('file card shows file type icon', async ({ page }) => {
      const fileCard = page.locator('.x-card[x-cardfile]').first();
      await expect(fileCard).toBeVisible();
      // toContainText auto-retries; a one-shot textContent() read the card
      // before its icon had been rendered under --workers=8.
      await expect(fileCard).toContainText(/📄|📝|🖼️|🎬|🎵|📦|📁/);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CARD TYPE: cardhero
  // ═══════════════════════════════════════════════════════════════════════
  test.describe('Card Hero', () => {
    test('hero card has minimum height', async ({ page }) => {
      const heroCard = page.locator('.x-card[x-cardhero][height]').first();
      await expect(heroCard).toBeVisible();

      await expect.poll(async () => (await heroCard.boundingBox())?.height ?? 0)
        .toBeGreaterThan(200);
    });

    test('hero card shows title', async ({ page }) => {
      const heroCard = page.locator('.x-card[x-cardhero][title]').first();
      const title = heroCard.locator('.x-card__hero-title');
      await expect(title).toBeVisible();
    });

    test('hero card has background image or gradient', async ({ page }) => {
      const heroCard = page.locator('.x-card[x-cardhero][background]').first();
      await expect(heroCard).toBeVisible();
      await expect.poll(() => heroCard.evaluate(el =>
        window.getComputedStyle(el).backgroundImage
      )).not.toBe('none');
    });

    test('hero card with overlay has overlay element', async ({ page }) => {
      // card.js:986 -- overlay is on unless explicitly overlay="false", so the
      // old x-cardhero[overlay="true"] selector never matched anything.
      const heroCard = page.locator('.x-card[x-cardhero]:not([overlay="false"])').first();
      await expect(heroCard).toBeVisible();
      const overlay = heroCard.locator('.x-card__overlay');
      await expect(overlay).toBeAttached();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CARD TYPE: cardlink
  // ═══════════════════════════════════════════════════════════════════════
  test.describe('Card Link', () => {
    test('link card is clickable', async ({ page }) => {
      const linkCard = page.locator('.x-card[x-cardlink]').first();
      await expect(linkCard).toBeVisible();

      await expect.poll(() => linkCard.evaluate(el =>
        window.getComputedStyle(el).cursor
      )).toBe('pointer');
    });

    test('link card navigates via a real stretched anchor', async ({ page }) => {
      // This test used to assert role="link". card.js deliberately replaced
      // that with a real <a> stretched over the card (documented Samsung
      // Internet viewport bug), so no cardlink carries a role attribute --
      // [role="link"] is 0 across the whole page. The stretched anchor is the
      // current contract; assert that instead.
      // NOTE: src/wb-models/cardlink.schema.json:208 still declares
      // accessibility.role = "link". That schema drift is tracked in #863.
      const linkCard = page.locator('.x-card[x-cardlink][href]').first();
      await expect(linkCard).toBeVisible();

      const anchor = linkCard.locator('a[href]');
      await expect(anchor).toHaveCount(1);
      await expect(anchor).toHaveAttribute('aria-label', /.+/);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CARD TYPE: cardhorizontal
  // ═══════════════════════════════════════════════════════════════════════
  test.describe('Card Horizontal', () => {
    test('horizontal card uses row layout', async ({ page }) => {
      const horizCard = page.locator('.x-card[x-cardhorizontal]').first();
      await expect(horizCard).toBeVisible();

      await expect.poll(() => horizCard.evaluate(el =>
        window.getComputedStyle(el).flexDirection
      )).toMatch(/row/);
    });

    test('horizontal card has image and content side by side', async ({ page }) => {
      const horizCard = page.locator('.x-card[x-cardhorizontal][image]').first();
      await expect(horizCard).toBeVisible();

      await expect(horizCard.locator('.x-card__figure')).toHaveCount(1);
      await expect(horizCard.locator('.x-card__horizontal-content')).toHaveCount(1);

      // Measure both boxes in ONE evaluate so they cannot straddle a reflow.
      const { figureY, contentY, figureRight, contentLeft } = await horizCard.evaluate(card => {
        const f = card.querySelector('.x-card__figure')!.getBoundingClientRect();
        const c = card.querySelector('.x-card__horizontal-content')!.getBoundingClientRect();
        return { figureY: f.y, contentY: c.y, figureRight: f.right, contentLeft: c.left };
      });

      // They should be side by side, not stacked
      expect(Math.abs(figureY - contentY)).toBeLessThan(50);
      expect(contentLeft).toBeGreaterThanOrEqual(figureRight - 1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CARD TYPE: cardoverlay
  // ═══════════════════════════════════════════════════════════════════════
  test.describe('Card Overlay', () => {
    test('overlay card has background image', async ({ page }) => {
      const overlayCard = page.locator('.x-card[x-cardoverlay][image]').first();
      await expect(overlayCard).toBeVisible();

      await expect.poll(() => overlayCard.evaluate(el =>
        window.getComputedStyle(el).backgroundImage
      )).not.toBe('none');
    });

    test('overlay card has content overlay', async ({ page }) => {
      const overlayCard = page.locator('.x-card[x-cardoverlay]').first();
      const content = overlayCard.locator('.x-card__overlay-content');
      await expect(content).toBeVisible();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CARD TYPE: cardexpandable
  // ═══════════════════════════════════════════════════════════════════════
  test.describe('Card Expandable', () => {
    test('expandable card has expand button', async ({ page }) => {
      const expandCard = page.locator('.x-card[x-cardexpandable]').first();
      await expect(expandCard).toBeVisible();

      const btn = expandCard.locator('.x-card__expand-btn');
      await expect(btn).toBeVisible();
    });

    test('clicking expand button toggles content', async ({ page }) => {
      const expandCard = page.locator('.x-card[x-cardexpandable]').first();
      await expect(expandCard).toBeVisible();

      const btn = expandCard.locator('.x-card__expand-btn');
      const content = expandCard.locator('.x-card__expandable-content');
      await expect(btn).toBeVisible();
      await expect(content).toBeAttached();

      const initialHeight = await content.evaluate(el => (el as HTMLElement).style.maxHeight);

      await btn.click();

      await expect.poll(() =>
        content.evaluate(el => (el as HTMLElement).style.maxHeight)
      ).not.toBe(initialHeight);
    });

    test('expand button has aria-expanded attribute', async ({ page }) => {
      const expandCard = page.locator('.x-card[x-cardexpandable]').first();
      const btn = expandCard.locator('.x-card__expand-btn');
      await expect(btn).toBeVisible();
      await expect(btn).toHaveAttribute('aria-expanded', /true|false/);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CARD TYPE: cardminimizable
  // ═══════════════════════════════════════════════════════════════════════
  test.describe('Card Minimizable', () => {
    test('minimizable card has minimize button', async ({ page }) => {
      const minCard = page.locator('.x-card[x-cardminimizable]').first();
      await expect(minCard).toBeVisible();

      const btn = minCard.locator('.x-card__minimize-btn');
      await expect(btn).toBeVisible();
    });

    test('clicking minimize button toggles content', async ({ page }) => {
      const minCard = page.locator('.x-card[x-cardminimizable]').first();
      await expect(minCard).toBeVisible();

      const btn = minCard.locator('.x-card__minimize-btn');
      const content = minCard.locator('.x-card__minimizable-content');
      await expect(btn).toBeVisible();
      await expect(content).toBeAttached();

      const initialOpacity = await content.evaluate(el =>
        window.getComputedStyle(el).opacity
      );

      await btn.click();

      await expect.poll(() =>
        content.evaluate(el => window.getComputedStyle(el).opacity)
      ).not.toBe(initialOpacity);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CARD TYPE: carddraggable
  // ═══════════════════════════════════════════════════════════════════════
  test.describe('Card Draggable', () => {
    test('draggable card has drag handle', async ({ page }) => {
      const dragCard = page.locator('.x-card[x-carddraggable]').first();
      await expect(dragCard).toBeVisible();

      const handle = dragCard.locator('.x-card__drag-handle');
      await expect(handle).toBeVisible();
    });

    test('drag handle has grab cursor', async ({ page }) => {
      const dragCard = page.locator('.x-card[x-carddraggable]').first();
      const handle = dragCard.locator('.x-card__drag-handle');
      await expect(handle).toBeVisible();

      await expect.poll(() => handle.evaluate(el =>
        window.getComputedStyle(el).cursor
      )).toBe('grab');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CODE EXAMPLES
  // ═══════════════════════════════════════════════════════════════════════
  test.describe('Code Examples', () => {
    test('code blocks are present after card demos', async ({ page }) => {
      // x-demo hydrates its <pre> panels independently of card upgrade, so
      // this needs its own retry -- a one-shot count() read 0 under
      // --workers=8 while cards were already up.
      const codeBlocks = page.locator('.x-demo__code, [x-mdhtml], pre code');
      await expect.poll(() => codeBlocks.count()).toBeGreaterThan(5);
    });

    test('code blocks are contained and do not overflow', async ({ page }) => {
      // Measure the SCROLL CONTAINER (`pre` / `.x-demo__code`), not the inner
      // `<code>`. A `<code>` inside an overflow-x:auto `<pre>` is legitimately
      // as wide as its longest line -- 48 of them measure up to 2964px here --
      // and asserting on it says nothing about containment. The container is
      // what must stay inside the viewport. The old `< 1500` magic number was
      // never exercised: the loop it lived in always had zero iterations.
      const codeBlocks = page.locator('.x-demo__code, [x-mdhtml] pre, pre');
      await expect.poll(() => codeBlocks.count()).toBeGreaterThan(0);

      const viewportWidth = await page.evaluate(() => window.innerWidth);
      await expect.poll(() => codeBlocks.evaluateAll((els, vw) =>
        els.filter(el => el.getBoundingClientRect().width > vw).length,
        viewportWidth
      )).toBe(0);

      // ...and the code blocks must not push the page itself sideways.
      await expect.poll(() => page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth
      )).toBeLessThanOrEqual(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // ACCESSIBILITY
  // ═══════════════════════════════════════════════════════════════════════
  test.describe('Accessibility', () => {
    test('interactive cards are focusable', async ({ page }) => {
      const clickableCards = page.locator('[clickable], [role="button"], [role="link"]');
      await expect.poll(() => clickableCards.count()).toBeGreaterThan(0);

      await expect.poll(() => clickableCards.evaluateAll(els =>
        els.slice(0, 5)
          .filter(el => {
            const tabindex = el.getAttribute('tabindex');
            const role = el.getAttribute('role');
            return !(tabindex !== null || role === 'button' || role === 'link');
          })
          .map(el => el.tagName + '.' + String(el.className).slice(0, 40))
      )).toEqual([]);
    });

    test('notification cards have role=alert', async ({ page }) => {
      const notifications = page.locator('[x-cardnotification]');
      await expect.poll(() => notifications.count()).toBeGreaterThan(0);

      await expect.poll(() => notifications.evaluateAll(els =>
        els.filter(el => el.getAttribute('role') !== 'alert').length
      )).toBe(0);
    });

    test('expand buttons have aria-expanded', async ({ page }) => {
      const expandBtns = page.locator('.x-card__expand-btn');
      await expect.poll(() => expandBtns.count()).toBeGreaterThan(0);

      await expect.poll(() => expandBtns.evaluateAll(els =>
        els.filter(el => !/^(true|false)$/.test(el.getAttribute('aria-expanded') ?? '')).length
      )).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // RESPONSIVE BEHAVIOR
  // ═══════════════════════════════════════════════════════════════════════
  test.describe('Responsive Behavior', () => {
    test('cards do not overflow container horizontally', async ({ page }) => {
      // Measures every .x-card, so it needs the whole page hydrated.
      await waitForWbReady(page);

      const cards = page.locator('.x-card');
      await expect.poll(() => cards.count()).toBeGreaterThan(0);

      const viewportWidth = await page.evaluate(() => window.innerWidth);
      await expect.poll(() => cards.evaluateAll((els, vw) =>
        els.slice(0, 10)
          .filter(el => {
            const box = el.getBoundingClientRect();
            return box.x + box.width > vw + 20;
          })
          .map(el => String(el.className).slice(0, 40)),
        viewportWidth
      )).toEqual([]);
    });

    test('text does not overflow cards', async ({ page }) => {
      // KNOWN DEFECT -- see #864. x-cardhero and x-cardpricing lay out content
      // wider than the card and rely on overflow:hidden to clip it, so 46
      // elements (up to 135px past the right edge) are silently truncated.
      // This is marked test.fail() rather than skipped so it flips the suite
      // RED the moment #864 is fixed and the marker must be removed. It was
      // passing vacuously before #863 because the 404 page had zero .x-card.
      test.fail(true, 'x-cardhero / x-cardpricing content overflow -- see #864');

      // test.fail() inverts the result, so an under-rendered page would report
      // as a FAILURE here. This one measures every .x-card AND depends on the
      // page being fully laid out, so wait for real completion, then pin down
      // that the two overflowing variants specifically have rendered.
      await waitForWbReady(page);
      await expect(page.locator('.x-card[x-cardhero]').first()).toBeVisible();
      await expect(page.locator('.x-card[x-cardpricing]').first()).toBeVisible();

      const overflows = await page.evaluate(() => {
        const issues: string[] = [];
        document.querySelectorAll('.x-card').forEach(card => {
          const cardRect = card.getBoundingClientRect();
          card.querySelectorAll('h3, p, span, div').forEach(el => {
            const elRect = el.getBoundingClientRect();
            if (elRect.right > cardRect.right + 5) {
              issues.push(`Text overflow in ${el.tagName}`);
            }
          });
        });
        return issues;
      });

      expect(overflows.length).toBe(0);
    });
  });
});
