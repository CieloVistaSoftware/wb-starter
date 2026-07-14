/**
 * Behaviors page (?page=behaviors) — component coverage suite.
 * Loads the real SPA route and asserts each section's components actually
 * upgrade and render. Behaviors lazy-load on scroll, so each check scrolls
 * its target into view first.
 */
import { test, expect, Page, Locator } from '@playwright/test';

async function loadPage(page: Page) {
  await page.goto('/?page=behaviors');
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 20000 });
  await page.waitForSelector('[x-badge], .behavior-card, .demo-area', { timeout: 20000 });
  // scroll through the whole page so every lazy (IntersectionObserver) behavior injects
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 50)); }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(800);
}

// best-effort reveal; tolerant of zero-box elements so it never hard-hangs
async function reveal(loc: Locator) {
  try { await loc.first().scrollIntoViewIfNeeded({ timeout: 4000 }); } catch { /* zero-box ok */ }
  await loc.page().waitForTimeout(200);
}

test.describe('Behaviors page — health', () => {
  test('loads with no page/console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => { if (m.type() === 'error' && !/favicon|ERR_|Failed to load resource|404/.test(m.text())) errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
    await loadPage(page);
    expect(errors, errors.join('\n')).toHaveLength(0);
  });

  test('no behavior throws (no [x-error] elements)', async ({ page }) => {
    await loadPage(page);
    // scroll through the whole page so every lazy behavior gets a chance to inject
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(800);
    const errs = await page.locator('[x-error="true"]').evaluateAll((els) => els.map((e) => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '')));
    expect(errs, 'elements with x-error: ' + errs.join(', ')).toHaveLength(0);
  });
});

test.describe('Behaviors page — Feedback', () => {
  test('badges upgrade', async ({ page }) => {
    await loadPage(page);
    const b = page.locator('[x-badge]');
    await reveal(b);
    expect(await b.count()).toBeGreaterThan(0);
    await expect(b.first()).toHaveClass(/wb-badge/);
  });

  test('alerts upgrade with role=alert', async ({ page }) => {
    await loadPage(page);
    const a = page.locator('[x-alert]');
    await reveal(a);
    expect(await a.count()).toBeGreaterThan(0);
    await expect(a.first()).toHaveAttribute('role', 'alert');
  });

  test('progress bars render a fill child', async ({ page }) => {
    await loadPage(page);
    const p = page.locator('[x-progress]');
    await reveal(p);
    expect(await p.count()).toBeGreaterThan(0);
    await expect(p.first().locator('.wb-progress__bar')).toHaveCount(1);
  });

  test('spinners animate', async ({ page }) => {
    await loadPage(page);
    const s = page.locator('[x-spinner]');
    await reveal(s);
    expect(await s.count()).toBeGreaterThan(0);
    const anim = await s.first().evaluate((el) => { const d = el.querySelector('div'); return d ? getComputedStyle(d).animationName : 'none'; });
    expect(anim).not.toBe('none');
  });

  test('skeletons render', async ({ page }) => {
    await loadPage(page);
    const sk = page.locator('wb-skeleton');
    await reveal(sk);
    expect(await sk.count()).toBeGreaterThan(0);
    await expect(sk.first()).toBeVisible();
  });

  test('toast fires with the correct type', async ({ page }) => {
    await loadPage(page);
    const btn = page.locator('[x-toast][data-type="success"]').first();
    await reveal(btn);
    await btn.click();
    await expect(page.locator('.wb-toast--success').first()).toBeVisible();
  });
});

test.describe('Behaviors page — Navigation', () => {
  test('tabs show real labels (not "Tab 1")', async ({ page }) => {
    await loadPage(page);
    const tabs = page.locator('[x-tabs] .wb-tabs__tab');
    await reveal(page.locator('[x-tabs]'));
    expect(await tabs.count()).toBeGreaterThanOrEqual(2);
    await expect(tabs.first()).not.toHaveText(/^Tab \d+$/);
  });

  test('accordion upgrades (correct tag)', async ({ page }) => {
    await loadPage(page);
    const acc = page.locator('wb-accordion');
    await reveal(acc);
    expect(await acc.count()).toBeGreaterThan(0);
    expect(await page.locator('wb-accordian').count()).toBe(0); // misspelling gone
    await expect(acc.first()).not.toHaveAttribute('x-error', 'true');
  });

  test('breadcrumb renders items', async ({ page }) => {
    await loadPage(page);
    const bc = page.locator('[x-breadcrumb]').first();
    await reveal(bc);
    await expect(bc).toHaveClass(/wb-breadcrumb/);
    await expect(bc.locator('[aria-current="page"]')).toHaveCount(1);
  });

  test('steps wizard renders items', async ({ page }) => {
    await loadPage(page);
    const st = page.locator('[x-steps]').first();
    await reveal(st);
    expect(await st.locator('.wb-steps__item').count()).toBeGreaterThan(0);
  });
});

test.describe('Behaviors page — Data & Selection', () => {
  test('avatars render content', async ({ page }) => {
    await loadPage(page);
    const av = page.locator('wb-avatar');
    await reveal(av);
    expect(await av.count()).toBeGreaterThan(0);
    const filled = await av.first().evaluate((el) => (el.textContent || '').trim().length > 0 || !!el.querySelector('img'));
    expect(filled).toBe(true);
  });

  test('switch toggles upgrade', async ({ page }) => {
    await loadPage(page);
    const sw = page.locator('[x-switch]');
    await reveal(sw);
    expect(await sw.count()).toBeGreaterThan(0);
    await expect(sw.first()).not.toHaveAttribute('x-error', 'true');
  });

  test('rating upgrades', async ({ page }) => {
    await loadPage(page);
    const r = page.locator('[x-rating]');
    await reveal(r);
    expect(await r.count()).toBeGreaterThan(0);
    await expect(r.first()).not.toHaveAttribute('x-error', 'true');
  });

  // (input data-variant demo lives on the Components page — covered by input-variant.spec.ts)
});
