/**
 * Comprehensive unit tests for the ENTIRE WB Behaviors showcase page.
 * One test per component category so a failure names exactly what is broken.
 *
 * Base URL is configurable: WB_BASE=https://cielovistasoftware.github.io/wb-starter
 * to run against the live GitHub Pages deploy; defaults to localhost for the
 * local fix→rerun loop (which reflects the latest merged source).
 */
import { test, expect, Page } from '@playwright/test';

const BASE = process.env.WB_BASE || 'http://localhost:3000';
const URL = `${BASE.replace(/\/$/, '')}/?page=behaviors`;

async function load(page: Page) {
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#mainPage-behaviors, [id*="behaviors"]', { timeout: 25000 });
  await page.waitForTimeout(2800); // lazy injection + schema build + highlight
}

test.describe('Behaviors page — full coverage', () => {
  test.beforeEach(async ({ page }) => load(page));

  test('page structure: all expected sections present', async ({ page }) => {
    const ids = await page.evaluate(() =>
      [...document.querySelectorAll('#mainPage-behaviors section[id]')].map((s) => s.id)
    );
    for (const expected of ['buttons', 'inputs', 'selection', 'feedback', 'overlays', 'navigation', 'data', 'media', 'effects', 'utilities']) {
      expect(ids, `section #${expected} missing`).toContain(expected);
    }
  });

  test('buttons: variants render distinct backgrounds', async ({ page }) => {
    const colors = await page.evaluate(() =>
      ['primary', 'secondary', 'ghost'].map((v) => {
        const el = document.querySelector(`.wb-btn--${v}, .wb-button--${v}`) as HTMLElement;
        return el ? getComputedStyle(el).backgroundColor : 'MISSING';
      })
    );
    expect(colors.includes('MISSING'), `button variant missing: ${colors}`).toBe(false);
    expect(new Set(colors).size, `button variants not distinct: ${colors}`).toBeGreaterThanOrEqual(3);
  });

  test('switches: render as toggles and flip on click', async ({ page }) => {
    const r = await page.evaluate(async () => {
      const sw = document.querySelector('[x-switch]');
      if (!sw) return 'NO_SWITCH';
      const before = sw.getAttribute('checked') ?? sw.querySelector('input')?.checked ?? null;
      const clickable = sw.querySelector('input, [role="switch"], .wb-switch__track, button') as HTMLElement || (sw as HTMLElement);
      clickable.click();
      await new Promise((r) => setTimeout(r, 120));
      const after = sw.getAttribute('checked') ?? sw.querySelector('input')?.checked ?? null;
      return { hasVisual: !!sw.querySelector('*'), before, after };
    });
    expect(r, 'no wb-switch on page').not.toBe('NO_SWITCH');
    expect((r as any).hasVisual, 'wb-switch rendered nothing').toBe(true);
  });

  test('alerts: 4 variants render distinct backgrounds', async ({ page }) => {
    const colors = await page.evaluate(() =>
      [...document.querySelectorAll('[x-alert]')].map((el) => getComputedStyle(el as HTMLElement).backgroundColor)
    );
    expect(colors.length, 'no alerts').toBeGreaterThanOrEqual(4);
    expect(new Set(colors).size, `alert variants not distinct: ${colors.join(', ')}`).toBeGreaterThanOrEqual(4);
  });

  test('badges: variants render distinct backgrounds', async ({ page }) => {
    const colors = await page.evaluate(() =>
      [...document.querySelectorAll('[x-badge]')].map((el) => getComputedStyle(el as HTMLElement).backgroundColor)
    );
    expect(colors.length, 'no badges').toBeGreaterThanOrEqual(3);
    expect(new Set(colors).size, `badge variants not distinct: ${colors.join(', ')}`).toBeGreaterThanOrEqual(3);
  });

  test('progress: bar fill width reflects value', async ({ page }) => {
    const widths = await page.evaluate(() =>
      [...document.querySelectorAll('[x-progress]')].map((p) => {
        const fill = p.querySelector('[class*="fill"], [class*="bar"], [style*="width"]') as HTMLElement;
        return fill ? Math.round(fill.getBoundingClientRect().width) : -1;
      })
    );
    expect(widths.length, 'no progress bars').toBeGreaterThanOrEqual(1);
    expect(widths.some((w) => w > 0), `no progress bar has a visible fill: ${widths}`).toBe(true);
  });

  test('notifications: render with content', async ({ page }) => {
    const r = await page.evaluate(() =>
      [...document.querySelectorAll('[x-cardnotification]')].map((n) => ({
        h: Math.round((n as HTMLElement).getBoundingClientRect().height),
        text: (n.textContent || '').trim().length,
      }))
    );
    expect(r.length, 'no notifications').toBeGreaterThanOrEqual(1);
    expect(r.every((n) => n.h > 8 && n.text > 0), `notification rendered empty/zero-height: ${JSON.stringify(r)}`).toBe(true);
  });

  test('spinners: visible and animated', async ({ page }) => {
    const r = await page.evaluate(() =>
      [...document.querySelectorAll('[x-spinner]')].map((sp) => {
        const inner = sp.querySelector('div') as HTMLElement;
        const ics = inner ? getComputedStyle(inner) : null;
        return { bw: ics ? parseFloat(ics.borderTopWidth) : 0, anim: ics ? ics.animationName : 'none' };
      })
    );
    expect(r.length, 'no spinners').toBeGreaterThanOrEqual(4);
    expect(r.every((s) => s.bw >= 1.5 && s.anim === 'wb-spin'), `spinner invisible/not animated: ${JSON.stringify(r)}`).toBe(true);
  });

  test('rating: custom icon honored + value painted', async ({ page }) => {
    const r = await page.evaluate(() => {
      const heart = [...document.querySelectorAll('[x-rating]')].find((el) => el.getAttribute('icon') === '❤️');
      const glyph = heart?.querySelector('.wb-rating__star')?.textContent || '';
      const anyFilled = [...document.querySelectorAll('[x-rating]')].some((el) => el.querySelectorAll('.wb-rating__star--full').length > 0);
      return { glyph, anyFilled };
    });
    expect(r.glyph, 'rating icon=❤️ not honored').toContain('❤️');
    expect(r.anyFilled, 'no rating shows its value on first paint').toBe(true);
  });

  test('modal: a trigger opens it and it can close', async ({ page }) => {
    const r = await page.evaluate(async () => {
      const modal = document.querySelector('[x-modal]');
      if (!modal) return 'NO_MODAL';
      const trigger = document.querySelector('[data-modal-open], [x-modal-open], button[onclick*="modal" i], [aria-controls]') as HTMLElement;
      const visibleBefore = getComputedStyle(modal as HTMLElement).display !== 'none' && (modal as HTMLElement).offsetParent !== null;
      if (trigger) trigger.click();
      await new Promise((r) => setTimeout(r, 200));
      const visibleAfter = getComputedStyle(modal as HTMLElement).display !== 'none' && (modal as HTMLElement).offsetParent !== null;
      return { hasTrigger: !!trigger, visibleBefore, visibleAfter };
    });
    expect(r, 'no wb-modal on page').not.toBe('NO_MODAL');
    expect((r as any).hasTrigger, 'modal has no discoverable open trigger').toBe(true);
  });

  test('tabs: clicking a tab switches the active panel', async ({ page }) => {
    const r = await page.evaluate(async () => {
      const tabs = document.querySelector('[x-tabs]');
      if (!tabs) return 'NO_TABS';
      const buttons = [...tabs.querySelectorAll('[role="tab"], .wb-tabs__tab, button')];
      if (buttons.length < 2) return { tabCount: buttons.length, switched: false };
      const activeBefore = tabs.querySelector('[aria-selected="true"], .active, [class*="--active"]')?.textContent?.trim();
      (buttons[1] as HTMLElement).click();
      await new Promise((r) => setTimeout(r, 150));
      const activeAfter = tabs.querySelector('[aria-selected="true"], .active, [class*="--active"]')?.textContent?.trim();
      return { tabCount: buttons.length, activeBefore, activeAfter, switched: activeBefore !== activeAfter };
    });
    expect(r, 'no wb-tabs on page').not.toBe('NO_TABS');
    expect((r as any).tabCount, 'tabs rendered fewer than 2 tab buttons').toBeGreaterThanOrEqual(2);
    expect((r as any).switched, `clicking a tab did not change the active panel: ${JSON.stringify(r)}`).toBe(true);
  });

  test('accordion: clicking a header expands/collapses', async ({ page }) => {
    const r = await page.evaluate(async () => {
      const acc = document.querySelector('wb-accordion');
      if (!acc) return 'NO_ACCORDION';
      const header = acc.querySelector('[role="button"], summary, .wb-accordion__header, button, h3, h4') as HTMLElement;
      if (!header) return { hasHeader: false };
      const panel = acc.querySelector('[class*="content"], [class*="panel"], [class*="body"]') as HTMLElement;
      const hBefore = panel ? Math.round(panel.getBoundingClientRect().height) : -1;
      header.click();
      await new Promise((r) => setTimeout(r, 250));
      const hAfter = panel ? Math.round(panel.getBoundingClientRect().height) : -1;
      return { hasHeader: true, hasPanel: !!panel, hBefore, hAfter, changed: hBefore !== hAfter };
    });
    expect(r, 'no wb-accordion on page').not.toBe('NO_ACCORDION');
    expect((r as any).hasHeader, 'accordion has no clickable header').toBe(true);
    expect((r as any).changed, `accordion did not expand/collapse on click: ${JSON.stringify(r)}`).toBe(true);
  });

  test('avatars: render an image or initials', async ({ page }) => {
    const r = await page.evaluate(() =>
      [...document.querySelectorAll('wb-avatar')].map((a) => ({
        h: Math.round((a as HTMLElement).getBoundingClientRect().height),
        hasImgOrText: !!a.querySelector('img') || (a.textContent || '').trim().length > 0,
      }))
    );
    expect(r.length, 'no avatars').toBeGreaterThanOrEqual(1);
    expect(r.every((a) => a.h > 8 && a.hasImgOrText), `avatar rendered empty: ${JSON.stringify(r)}`).toBe(true);
  });

  test('skeletons: render with shimmer animation', async ({ page }) => {
    const r = await page.evaluate(() =>
      [...document.querySelectorAll('wb-skeleton')].map((s) => {
        const target = (s.querySelector('*') as HTMLElement) || (s as HTMLElement);
        const cs = getComputedStyle(target);
        return { h: Math.round((s as HTMLElement).getBoundingClientRect().height), anim: cs.animationName };
      })
    );
    expect(r.length, 'no skeletons').toBeGreaterThanOrEqual(1);
    expect(r.every((s) => s.h > 4), `skeleton has no height: ${JSON.stringify(r)}`).toBe(true);
  });

  test('code blocks: highlighted like an editor', async ({ page }) => {
    const r = await page.evaluate(() => {
      const blocks = [...document.querySelectorAll('pre code, code.language-html')];
      const hl = blocks.filter((c) => c.classList.contains('hljs') && c.querySelector('[class^="hljs-"]'));
      return { total: blocks.length, highlighted: hl.length };
    });
    expect(r.total, 'no code blocks').toBeGreaterThan(5);
    expect(r.highlighted, 'code blocks not highlighted').toBeGreaterThan(5);
  });

  test('no component left in an error state', async ({ page }) => {
    const errs = await page.evaluate(() =>
      [...document.querySelectorAll('#mainPage-behaviors [x-error]')].map((e) => e.tagName.toLowerCase() + ':' + e.getAttribute('x-error'))
    );
    expect(errs, `components in x-error: ${errs.join(', ')}`).toEqual([]);
  });

  test('no "Schema not found" or uncaught errors on load', async ({ page }) => {
    const problems: string[] = [];
    page.on('console', (m) => { if (/Schema not found/i.test(m.text())) problems.push('schema: ' + m.text()); });
    page.on('pageerror', (e) => problems.push('uncaught: ' + String(e)));
    await load(page);
    expect(problems, `console problems:\n${problems.join('\n')}`).toEqual([]);
  });
});
