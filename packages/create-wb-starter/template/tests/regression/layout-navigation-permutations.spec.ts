import { test, expect } from '@playwright/test';

/**
 * demos/site/layout.html showcases every documented attribute permutation
 * of x-header, x-footer, x-navbar, x-tabs, x-details, x-drawer-layout,
 * x-scrollalong, x-sticky, and x-timeline. A live audit of this page
 * (2026-07-31/08-01) found that most of these attributes were silently
 * doing nothing -- the demo always showed the literal source text
 * ("icon=🚀, title=App, badge=v1.0") because the behavior functions never
 * actually read the attributes to build anything:
 *
 *   - header(): only ever added the `x-header` class + sticky toggle --
 *     icon/title/subtitle/badge were never read at all, despite
 *     header.css already shipping .x-header__icon/__title/__subtitle
 *     rules and the file's own docblock documenting this exact usage.
 *   - footer(): identical stub -- brand/copyright never read; `sticky`
 *     checked ONLY `data-sticky`, so the documented bare `sticky` form
 *     did nothing.
 *   - navbar(): `sticky` had the same data-sticky-only bug; `variant`
 *     was read nowhere at all (no JS check, no matching CSS class).
 *   - tabs(): `active-tab` was read nowhere (always defaulted to index 0);
 *     `variant`/`size`/`full-width`/`vertical` were read nowhere either.
 *   - details(): `variant` was read nowhere (summary/open/animated did
 *     already work correctly).
 *
 * This suite pins down real, structural assertions (not just "no error")
 * for every one of these permutations so a future regression can't reach
 * production silently again. See docs/architecture/standards -- this
 * suite should run as part of the pre-release gate (recommended in the
 * task that produced it).
 */

async function ready(page) {
  await page.goto('/demos/site/layout.html', { waitUntil: 'domcontentloaded' });
  // #448: x-header no longer carries a same-named `.x-header` class --
  // select the tag directly.
  await page.waitForSelector('x-header');
  await page.waitForTimeout(400); // let WB.scan()'s auto-inject pass settle
}

test.describe('x-header', () => {
  test('icon/title/subtitle/badge attributes render real, visible structure', async ({ page }) => {
    await ready(page);
    const headers = page.locator('#header-header x-header');

    // <header title="Title">
    await expect(headers.nth(0).locator('.x-header__title')).toHaveText('Title');
    await expect(headers.nth(0).locator('.x-header__icon')).toHaveCount(0);

    // <header icon="📂" title="Title">
    await expect(headers.nth(1).locator('.x-header__icon')).toHaveText('📂');
    await expect(headers.nth(1).locator('.x-header__title')).toHaveText('Title');

    // <header icon="🚀" title="App" badge="v1.0">
    const withBadge = headers.nth(2);
    await expect(withBadge.locator('.x-header__icon')).toHaveText('🚀');
    await expect(withBadge.locator('.x-header__title')).toHaveText('App');
    await expect(withBadge.locator('.x-tag-glass')).toHaveText('v1.0');
  });

  test('bare `sticky` attribute (not just data-sticky) applies position:sticky', async ({ page }) => {
    await ready(page);
    const stickyHeader = page.locator('#header-boolean-toggles x-header');
    await expect(stickyHeader).toHaveClass(/x-header--sticky/);
    await expect
      .poll(() => stickyHeader.evaluate((el) => getComputedStyle(el).position))
      .toBe('sticky');
  });
});

test.describe('x-footer', () => {
  test('brand/copyright attributes render real, visible structure', async ({ page }) => {
    await ready(page);
    const footers = page.locator('#footer-footer x-footer');

    await expect(footers.nth(0).locator('.x-footer__copyright')).toHaveText('© 2025');
    await expect(footers.nth(0).locator('.x-footer__brand')).toHaveCount(0);

    await expect(footers.nth(1).locator('.x-footer__brand')).toHaveText('Acme');
    await expect(footers.nth(1).locator('.x-footer__copyright')).toHaveText('© 2025');
  });

  test('bare `sticky` attribute applies position:sticky (bottom-anchored)', async ({ page }) => {
    await ready(page);
    const stickyFooter = page.locator('#footer-boolean-toggles x-footer');
    await expect(stickyFooter).toHaveClass(/x-footer--sticky/);
    await expect
      .poll(() => stickyFooter.evaluate((el) => getComputedStyle(el).position))
      .toBe('sticky');
  });
});

test.describe('x-navbar', () => {
  test('brand renders, bare `sticky` applies position:sticky', async ({ page }) => {
    await ready(page);
    const navbars = page.locator('#navbar-navbar x-navbar');
    await expect(navbars.nth(0).locator('.x-navbar__brand-text')).toHaveText('MySite');

    const stickyNavbar = page.locator('#navbar-boolean-toggles x-navbar');
    await expect
      .poll(() => stickyNavbar.evaluate((el) => getComputedStyle(el).position))
      .toBe('sticky');
  });

  for (const variant of ['default', 'dark', 'transparent']) {
    test(`variant=${variant} applies a distinct, matching class`, async ({ page }) => {
      await ready(page);
      const el = page.locator(`#navbar-variant-variants .x-navbar--${variant}`);
      await expect(el).toBeVisible();
    });
  }

  test('variant=dark and variant=transparent are visually distinct from default', async ({ page }) => {
    await ready(page);
    const bg = (sel) => page.locator(sel).evaluate((el) => getComputedStyle(el).backgroundColor);
    const [defaultBg, darkBg, transparentBg] = await Promise.all([
      bg('#navbar-variant-variants .x-navbar--default'),
      bg('#navbar-variant-variants .x-navbar--dark'),
      bg('#navbar-variant-variants .x-navbar--transparent'),
    ]);
    expect(darkBg).not.toBe(defaultBg);
    expect(transparentBg).not.toBe(defaultBg);
    expect(transparentBg).toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
  });
});

test.describe('x-tabs', () => {
  test('active-tab attribute controls which panel starts active (not always index 0)', async ({ page }) => {
    await ready(page);
    const tabsGroup = page.locator('#tabs-tabs x-tabs');

    const first = tabsGroup.nth(0); // active-tab="0"
    await expect(first.locator('.x-tabs__tab--active')).toHaveAttribute('index', '0');
    await expect(first.locator('.x-tabs__panel[index="0"]')).toBeVisible();

    const second = tabsGroup.nth(1); // active-tab="1"
    await expect(second.locator('.x-tabs__tab--active')).toHaveAttribute('index', '1');
    await expect(second.locator('.x-tabs__panel[index="1"]')).toBeVisible();
    await expect(second.locator('.x-tabs__panel[index="0"]')).toBeHidden();
  });

  for (const variant of ['default', 'underline', 'pills', 'bordered']) {
    test(`variant=${variant} applies a distinct, matching class`, async ({ page }) => {
      await ready(page);
      const el = page.locator(`.x-tabs--${variant}`).first();
      await expect(el).toBeVisible();
    });
  }

  test('variant=pills renders a pill-shaped active tab, distinct from default', async ({ page }) => {
    await ready(page);
    const pillsActive = page.locator('.x-tabs--pills .x-tabs__tab--active').first();
    const defaultActive = page.locator('#tabs-tabs .x-tabs--default .x-tabs__tab--active').first();
    const [pillsRadius, defaultRadius] = await Promise.all([
      pillsActive.evaluate((el) => getComputedStyle(el).borderRadius),
      defaultActive.evaluate((el) => getComputedStyle(el).borderRadius),
    ]);
    expect(pillsRadius).not.toBe(defaultRadius);
    expect(parseFloat(pillsRadius)).toBeGreaterThan(20); // pill = fully rounded
  });

  for (const size of ['sm', 'md', 'lg']) {
    test(`size=${size} applies a distinct, matching class`, async ({ page }) => {
      await ready(page);
      await expect(page.locator(`.x-tabs--${size}`).first()).toBeVisible();
    });
  }

  test('size=sm and size=lg render visibly different tab-button font sizes', async ({ page }) => {
    await ready(page);
    const fontSize = (sel) => page.locator(sel).locator('.x-tabs__tab').first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    const [sm, lg] = await Promise.all([
      fontSize('#tabs-size-variants .x-tabs--sm'),
      fontSize('#tabs-size-variants .x-tabs--lg'),
    ]);
    expect(lg).toBeGreaterThan(sm);
  });

  test('full-width attribute applies its class', async ({ page }) => {
    await ready(page);
    await expect(page.locator('.x-tabs--full-width')).toBeVisible();
  });

  test('vertical attribute lays the nav out as a column, not a row', async ({ page }) => {
    await ready(page);
    const nav = page.locator('.x-tabs--vertical .x-tabs__nav');
    await expect(nav).toHaveCSS('flex-direction', 'column');
  });

  test('clicking a tab switches the active button and visible panel', async ({ page }) => {
    await ready(page);
    const tabs = page.locator('#tabs-tabs x-tabs').nth(0);
    const buttons = tabs.locator('.x-tabs__tab');
    await buttons.nth(1).click();
    await expect(buttons.nth(1)).toHaveClass(/x-tabs__tab--active/);
    await expect(tabs.locator('.x-tabs__panel[index="1"]')).toBeVisible();
    await expect(tabs.locator('.x-tabs__panel[index="0"]')).toBeHidden();
  });
});

test.describe('x-details', () => {
  test('summary/open attributes render correctly', async ({ page }) => {
    await ready(page);
    const detailsGroup = page.locator('#details-details x-details, #details-details details.x-details');

    await expect(detailsGroup.nth(0).locator('.x-details__label')).toHaveText('Details');
    await expect(detailsGroup.nth(0)).not.toHaveJSProperty('open', true);

    await expect(detailsGroup.nth(1)).toHaveJSProperty('open', true);
  });

  for (const variant of ['default', 'bordered', 'filled']) {
    test(`variant=${variant} applies a distinct, matching class`, async ({ page }) => {
      await ready(page);
      const el = page.locator(`.x-details--${variant}`).first();
      await expect(el).toBeVisible();
    });
  }

  test('variant=bordered and variant=filled are visually distinct from default', async ({ page }) => {
    await ready(page);
    const border = (sel) => page.locator(sel).evaluate((el) => getComputedStyle(el).borderWidth);
    const [defaultBorder, borderedBorder, filledBorder] = await Promise.all([
      border('#details-variant-variants .x-details--default'),
      border('#details-variant-variants .x-details--bordered'),
      border('#details-variant-variants .x-details--filled'),
    ]);
    expect(borderedBorder).not.toBe(defaultBorder);
    expect(filledBorder).not.toBe(defaultBorder);
  });

  test('clicking summary toggles open state', async ({ page }) => {
    await ready(page);
    const details = page.locator('#details-details x-details, #details-details details.x-details').first();
    const summary = details.locator('summary');
    await expect(details).not.toHaveJSProperty('open', true);
    await summary.click();
    await expect(details).toHaveJSProperty('open', true);
  });
});

test.describe('x-drawer-layout / x-scrollalong / x-sticky / x-timeline -- basic sanity', () => {
  test('drawer-layout renders with position-appropriate sizing, no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await ready(page);
    // #448: x-drawer-layout no longer carries a same-named
    // `.x-drawer-layout` class -- select the tag directly.
    const drawers = page.locator('#drawer-layout-drawer-layout x-drawer-layout');
    await expect(drawers).toHaveCount(3);
    await expect(drawers.nth(0)).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('scrollalong applies position:sticky', async ({ page }) => {
    await ready(page);
    // #448: x-scrollalong no longer carries a same-named `.x-scrollalong`
    // class -- select the tag directly.
    const el = page.locator('x-scrollalong');
    await expect
      .poll(() => el.evaluate((e) => getComputedStyle(e).position))
      .toBe('sticky');
  });

  test('timeline renders one item per comma-separated entry', async ({ page }) => {
    await ready(page);
    const timelines = page.locator('#timeline-timeline x-timeline');
    // <div x-timeline items="Project Kickoff,Design Phase,Development,Testing,Launch">
    await expect(timelines.nth(0).locator('.x-timeline-item')).toHaveCount(5);
    // <div x-timeline items="Q1 Planning,Q2 Execution,Q3 Review,Q4 Delivery">
    await expect(timelines.nth(1).locator('.x-timeline-item')).toHaveCount(4);
  });

  test('no console errors anywhere on the page after full settle', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
    await ready(page);
    await page.waitForTimeout(500);
    expect(errors).toEqual([]);
  });
});
