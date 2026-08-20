/**
 * Behaviors page browse panel — selection navigation.
 *
 * #686 — stacked (phone) layout: tapping a result must put the rendered demo
 *        and its HTML sample in view. It used to render ~300px below the fold
 *        with no cue anything had happened.
 * #687 — arrow keys must pin the selected row to the TOP of the list, and the
 *        end of the list must stay reachable.
 *
 * Both are about where things end up on screen, so every assertion here is a
 * measured rect or scroll offset, never a visibility flag — the panel was
 * always "visible" in the DOM sense while being completely off-screen.
 */
import { test, expect, Page } from '@playwright/test';

const PHONE = { width: 375, height: 812 };

async function loadBrowse(page: Page, query = 'x-tooltip') {
  await page.goto('/?page=behaviors');
  await page.waitForSelector('#behaviors-search', { timeout: 20000 });
  await page.waitForFunction(
    () => (document.querySelectorAll('.behaviors-search-results__row').length > 0),
    { timeout: 20000 },
  );
  await page.fill('#behaviors-search', query);
  await page.waitForFunction(
    () => document.querySelectorAll('.behaviors-search-results__row').length > 0,
    { timeout: 10000 },
  );
}

test.describe('#686 — stacked layout reveals the demo when a result is tapped', () => {
  test.use({ viewport: PHONE });

  test('tapping a result brings the rendered demo and its HTML into view', async ({ page }) => {
    await loadBrowse(page);

    // The layout must actually be the stacked one, or this test proves nothing.
    expect(await page.evaluate(() => matchMedia('(max-width: 60rem)').matches)).toBe(true);

    await page.evaluate(() => { document.getElementById('siteBody')!.scrollTop = 0; });
    await page.locator('.behaviors-search-results__row').first().click();
    await page.waitForTimeout(400);

    const seen = await page.evaluate(() => {
      const inView = (el: Element | null) => {
        if (!el) return false;
        const b = el.getBoundingClientRect();
        return b.top < window.innerHeight && b.bottom > 0 && b.height > 0;
      };
      return {
        stage: inView(document.getElementById('behaviors-live-stage')),
        code: inView(document.getElementById('behaviors-live-code')),
        codeText: document.getElementById('behaviors-live-code')!.textContent || '',
      };
    });

    expect(seen.stage, 'rendered demo must be on screen after a tap').toBe(true);
    expect(seen.code, 'HTML sample must be on screen after a tap').toBe(true);
    expect(seen.codeText).toContain('x-tooltip');
  });

  test('typing never moves the page away from the search box', async ({ page }) => {
    await loadBrowse(page, '');
    await page.evaluate(() => { document.getElementById('siteBody')!.scrollTop = 0; });
    await page.type('#behaviors-search', 'x-tool', { delay: 40 });
    await page.waitForTimeout(400);
    const scrollTop = await page.evaluate(() => document.getElementById('siteBody')!.scrollTop);
    expect(scrollTop, 'search must not scroll the page while the reader types').toBe(0);
  });
});

test.describe('#686 — two-column layout still does not scroll', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('picking a result leaves the page where it was', async ({ page }) => {
    await loadBrowse(page);
    expect(await page.evaluate(() => matchMedia('(max-width: 60rem)').matches)).toBe(false);

    await page.evaluate(() => { document.getElementById('siteBody')!.scrollTop = 0; });
    await page.locator('.behaviors-search-results__row').first().click();
    await page.waitForTimeout(400);

    const scrollTop = await page.evaluate(() => document.getElementById('siteBody')!.scrollTop);
    expect(scrollTop, 'side-by-side, the panel is already visible — nothing should move').toBe(0);
  });
});

test.describe('#687 — arrow keys align the selection to the top of the list', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('each ArrowDown puts the selected row at the top of the list viewport', async ({ page }) => {
    await loadBrowse(page, 'x-');

    await page.locator('.behaviors-search-results__row').first().focus();

    const offsets: number[] = [];
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(120);
      offsets.push(await page.evaluate(() => {
        const list = document.getElementById('behaviors-search-results')!;
        const cur = list.querySelector('[aria-current="true"]') as HTMLElement;
        return Math.round((cur.offsetTop - list.offsetTop) - list.scrollTop);
      }));
    }

    for (const [i, delta] of offsets.entries()) {
      expect(Math.abs(delta), `press ${i + 1}: selected row sat ${delta}px from the top`).toBeLessThanOrEqual(2);
    }
  });

  test('ArrowUp aligns to the top as well', async ({ page }) => {
    await loadBrowse(page, 'x-');
    await page.locator('.behaviors-search-results__row').first().focus();
    for (let i = 0; i < 6; i++) { await page.keyboard.press('ArrowDown'); }
    await page.waitForTimeout(150);
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(150);

    const delta = await page.evaluate(() => {
      const list = document.getElementById('behaviors-search-results')!;
      const cur = list.querySelector('[aria-current="true"]') as HTMLElement;
      return Math.round((cur.offsetTop - list.offsetTop) - list.scrollTop);
    });
    expect(Math.abs(delta)).toBeLessThanOrEqual(2);
  });

  test('End reaches the last row and leaves it fully visible', async ({ page }) => {
    await loadBrowse(page, 'x-');
    await page.locator('.behaviors-search-results__row').first().focus();
    await page.keyboard.press('End');
    await page.waitForTimeout(250);

    const end = await page.evaluate(() => {
      const list = document.getElementById('behaviors-search-results')!;
      const rows = [...list.querySelectorAll('.behaviors-search-results__row')];
      const cur = list.querySelector('[aria-current="true"]') as HTMLElement;
      const cb = cur.getBoundingClientRect(), lb = list.getBoundingClientRect();
      return {
        isLast: rows.indexOf(cur) === rows.length - 1,
        atBottom: Math.abs((list.scrollHeight - list.clientHeight) - list.scrollTop) <= 2,
        fullyVisible: cb.top >= lb.top - 2 && cb.bottom <= lb.bottom + 2,
      };
    });

    expect(end.isLast, 'End must select the last row').toBe(true);
    expect(end.atBottom, 'the list must page all the way to the end').toBe(true);
    expect(end.fullyVisible, 'the last row must be fully in the list viewport').toBe(true);
  });

  test('clicking a row leaves the list scroll exactly where the reader put it', async ({ page }) => {
    await loadBrowse(page, 'x-');
    await page.evaluate(() => { document.getElementById('behaviors-search-results')!.scrollTop = 500; });
    await page.waitForTimeout(80);

    const rows = page.locator('.behaviors-search-results__row');
    await rows.nth(12).click();
    await page.waitForTimeout(300);

    const after = await page.evaluate(() => document.getElementById('behaviors-search-results')!.scrollTop);
    expect(Math.round(after), 'a click must not yank the list').toBe(500);
  });
});

test.describe('#699 — the token column never wraps and never crosses the variant column', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('a long token stays on one line and stops before the variant', async ({ page }) => {
    await loadBrowse(page, 'checkbox');

    // input[type="checkbox"] is the longest token in the registry and is one
    // unbroken string -- the exact case that painted over the variant column.
    const geo = await page.evaluate(() => {
      const tokens = [...document.querySelectorAll('.behaviors-search-results__token')] as HTMLElement[];
      const t = tokens[0];
      const v = t.parentElement!.querySelector('.behaviors-search-results__variant') as HTMLElement;
      const cs = getComputedStyle(t);
      const lh = parseFloat(cs.lineHeight) || 16;
      const tb = t.getBoundingClientRect(), vb = v.getBoundingClientRect();
      return {
        text: t.textContent || '',
        whiteSpace: cs.whiteSpace,
        lines: Math.round(tb.height / lh),
        gapToVariant: Math.round(vb.left - tb.right),
        title: t.title,
      };
    });

    expect(geo.text, 'expected the checkbox token').toContain('checkbox');
    expect(geo.whiteSpace, 'the token is code — it must not wrap (Standard §6)').toBe('nowrap');
    expect(geo.lines, 'the token must render on exactly one line').toBe(1);
    expect(geo.gapToVariant, 'the token must stop before the variant column, not paint into it')
      .toBeGreaterThanOrEqual(0);
    expect(geo.title, 'a truncated token must still be readable via its title').toContain('checkbox');
  });

  test('forced past its column width it truncates — it does not wrap or overlap', async ({ page }) => {
    await loadBrowse(page, 'checkbox');

    const geo = await page.evaluate(async () => {
      const tokens = [...document.querySelectorAll('.behaviors-search-results__token')] as HTMLElement[];
      // Force the overflow condition a zoomed-in browser produces.
      tokens.forEach((e) => { e.style.fontSize = '2.4rem'; });
      await new Promise((r) => setTimeout(r, 150));
      const t = tokens[0];
      const v = t.parentElement!.querySelector('.behaviors-search-results__variant') as HTMLElement;
      const lh = parseFloat(getComputedStyle(t).lineHeight) || 16;
      const tb = t.getBoundingClientRect(), vb = v.getBoundingClientRect();
      const out = {
        lines: Math.round(tb.height / lh),
        gapToVariant: Math.round(vb.left - tb.right),
        truncated: t.scrollWidth > t.clientWidth + 1,
      };
      tokens.forEach((e) => { e.style.fontSize = ''; });
      return out;
    });

    expect(geo.lines, 'still one line when the text no longer fits').toBe(1);
    expect(geo.gapToVariant, 'still no overlap with the variant column').toBeGreaterThanOrEqual(0);
    expect(geo.truncated, 'the overflow is absorbed by the ellipsis, not by spilling').toBe(true);
  });
});

test.describe('#710 — the list matches the panel height', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('both columns are the same height, and the list still scrolls itself', async ({ page }) => {
    await loadBrowse(page, 'x-');           // all 585 rows — the case that blew up
    await page.locator('.behaviors-search-results__row').first().click();
    await page.waitForTimeout(500);

    const geo = await page.evaluate(() => {
      const list = document.getElementById('behaviors-search-results')!;
      const panel = document.getElementById('behaviors-live')!;
      return {
        listH: Math.round(list.getBoundingClientRect().height),
        panelH: Math.round(panel.getBoundingClientRect().height),
        rows: list.querySelectorAll('.behaviors-search-results__row').length,
        scrollsInternally: list.scrollHeight > list.clientHeight + 1,
      };
    });

    expect(geo.rows, 'expected the full list').toBeGreaterThan(100);
    expect(Math.abs(geo.listH - geo.panelH), 'the two columns must be the same height')
      .toBeLessThanOrEqual(2);
    expect(geo.scrollsInternally, 'the list must scroll inside itself, not stretch the page')
      .toBe(true);
    expect(geo.listH, 'a column taller than a few thousand px means the cap was lost')
      .toBeLessThan(3000);
  });

  test('stacked, the list keeps its own cap', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await loadBrowse(page, 'x-');
    const maxH = await page.evaluate(
      () => document.getElementById('behaviors-search-results')!.style.maxHeight,
    );
    expect(maxH, 'no inline cap is applied when there is no second column to match').toBe('');
  });
});

test.describe('#711 — the example is centred in the stage', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  for (const [name, token, variant] of [
    ['a block example', 'x-card', 'glass'],
    ['an inline example', 'x-button', ''],
  ] as const) {
    test(`${name} sits with equal space above and below`, async ({ page }) => {
      await loadBrowse(page, 'x-');

      const geo = await page.evaluate(async ([tok, want]) => {
        const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
        const rows = [...document.querySelectorAll('.behaviors-search-results__row')] as HTMLElement[];
        const row = rows.find((r) => r.getAttribute('data-browse-token') === tok
          && (!want || r.getAttribute('data-variant') === want)) || rows[0];
        row.click();
        await sleep(500);
        const stage = document.getElementById('behaviors-live-stage')!;
        const el = stage.firstElementChild as HTMLElement;
        const sb = stage.getBoundingClientRect(), eb = el.getBoundingClientRect();
        return {
          tag: el.tagName.toLowerCase(),
          above: Math.round(eb.top - sb.top),
          below: Math.round(sb.bottom - eb.bottom),
          elWidth: Math.round(eb.width),
          stageWidth: Math.round(sb.width),
        };
      }, [token, variant] as const);

      expect(Math.abs(geo.above - geo.below), `${geo.tag}: ${geo.above}px above vs ${geo.below}px below`)
        .toBeLessThanOrEqual(2);
      if (geo.tag === 'button') {
        expect(geo.elWidth, 'an inline example must keep its intrinsic width')
          .toBeLessThan(geo.stageWidth * 0.9);
      }
    });
  }
});
