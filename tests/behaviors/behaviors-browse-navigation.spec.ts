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


test.describe('#720 — the stage can go fullscreen and come back unchanged', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('the control is wired to the STAGE, not the page', async ({ page }) => {
    await loadBrowse(page, 'table');
    await page.locator('.behaviors-search-results__row').first().click();
    await page.waitForTimeout(400);

    const wiring = await page.evaluate(() => {
      const btn = document.getElementById('behaviors-live-fullscreen') as HTMLElement;
      return {
        exists: !!btn,
        label: (btn?.textContent || '').trim(),
        upgraded: btn?.classList.contains('wb-fullscreen'),
        target: btn?.getAttribute('target'),
      };
    });

    expect(wiring.exists, 'the panel needs a fullscreen control').toBe(true);
    expect(wiring.upgraded, "it must be the framework's own x-fullscreen behavior").toBe(true);
    expect(wiring.target, 'it must target the stage, not the document').toBe('#behaviors-live-stage');
    expect(wiring.label.length, 'the control must be labelled').toBeGreaterThan(0);
  });

  test('a fullscreen round trip leaves the stage exactly where it was', async ({ page }) => {
    await loadBrowse(page, 'table');
    await page.locator('.behaviors-search-results__row').first().click();
    await page.waitForTimeout(400);

    const trip = await page.evaluate(async () => {
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
      const stage = document.getElementById('behaviors-live-stage')!;
      const btn = document.getElementById('behaviors-live-fullscreen') as HTMLElement;
      const before = stage.getBoundingClientRect();

      // requestFullscreen needs a user gesture, which a scripted click has not
      // got — so spy on it to prove WHERE it was requested, then drive the
      // restore path the behavior listens for.
      let requestedOn: string | null = null;
      const original = Element.prototype.requestFullscreen;
      Element.prototype.requestFullscreen = function (this: Element) {
        requestedOn = this.id || this.tagName;
        return Promise.resolve();
      };
      btn.click();
      await sleep(200);
      Element.prototype.requestFullscreen = original;

      const during = { height: stage.style.height, overflow: stage.style.overflow };
      document.dispatchEvent(new Event('fullscreenchange'));   // fullscreenElement is null → exit path
      await sleep(300);
      const after = stage.getBoundingClientRect();

      const same = (a: DOMRect, b: DOMRect) =>
        Math.round(a.width) === Math.round(b.width) && Math.round(a.height) === Math.round(b.height)
        && Math.round(a.top) === Math.round(b.top) && Math.round(a.left) === Math.round(b.left);

      return {
        requestedOn,
        during,
        cleared: !stage.style.height && !stage.style.overflow,
        sameRect: same(before, after),
        example: !!stage.firstElementChild,
      };
    });

    expect(trip.requestedOn, 'fullscreen must be requested on the stage').toBe('behaviors-live-stage');
    expect(trip.during.height, 'the stage fills the viewport while fullscreen').toBe('100vh');
    expect(trip.cleared, 'the inline styles must be cleared on the way out').toBe(true);
    expect(trip.sameRect, 'the stage must return to the same position and size').toBe(true);
    expect(trip.example, 'the example must survive the round trip').toBe(true);
  });
});

test.describe('#728 — arrow keys move the selection, the list stays put', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('a selection already on screen does not scroll the list', async ({ page }) => {
    await loadBrowse(page, 'x-');

    const walk = await page.evaluate(async () => {
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
      const list = document.getElementById('behaviors-search-results')!;
      const rows = [...list.querySelectorAll('.behaviors-search-results__row')] as HTMLElement[];
      const press = (key: string) => list.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
      const state = () => {
        const cur = list.querySelector('[aria-current="true"]') as HTMLElement;
        const rb = cur.getBoundingClientRect(), lb = list.getBoundingClientRect();
        return {
          scrollTop: Math.round(list.scrollTop),
          visible: rb.top >= lb.top - 1 && rb.bottom <= lb.bottom + 1,
        };
      };
      rows[0].focus();
      const out = [];
      for (let i = 0; i < 8; i++) { press('ArrowDown'); await sleep(120); out.push(state()); }
      return { out, padding: list.style.paddingBottom };
    });

    expect(walk.out.every((s) => s.visible), 'the selected row must stay visible').toBe(true);
    expect(walk.out.every((s) => s.scrollTop === 0),
      'the list must not move while the selection is already on screen (#728 replaced #687 align-to-top)').toBe(true);
    expect(walk.padding, 'no trailing padding — that existed only for align-to-top (#717)').toBe('');
  });

  test('it scrolls by the minimum once the selection would leave the viewport', async ({ page }) => {
    test.setTimeout(120_000);
    await loadBrowse(page, 'x-');

    const result = await page.evaluate(async () => {
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
      const list = document.getElementById('behaviors-search-results')!;
      const rows = [...list.querySelectorAll('.behaviors-search-results__row')] as HTMLElement[];
      const press = (key: string) => list.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
      const state = () => {
        const cur = list.querySelector('[aria-current="true"]') as HTMLElement;
        const rb = cur.getBoundingClientRect(), lb = list.getBoundingClientRect();
        return {
          scrollTop: Math.round(list.scrollTop),
          visible: rb.top >= lb.top - 1 && rb.bottom <= lb.bottom + 1,
          fromTop: Math.round(rb.top - lb.top),
        };
      };
      rows[0].focus();
      const scrolls = [];
      for (let i = 0; i < 40 && scrolls.length < 4; i++) {
        press('ArrowDown');
        await sleep(80);
        const s = state();
        if (s.scrollTop > 0) scrolls.push(s);
      }
      press('End');
      await sleep(400);
      // PITCH, not height: rows sit 5px apart, so one row of scroll is
      // offsetHeight + gap. Measuring height alone made the assertion fail at
      // 55px for a 50px row -- the behavior was right, the tolerance was wrong.
      const pitch = rows.length > 1
        ? Math.round(rows[1].offsetTop - rows[0].offsetTop)
        : Math.round(rows[0].offsetHeight);
      return { scrolls, end: state(), rowPitch: pitch };
    });

    expect(result.scrolls.length, 'expected the list to start scrolling eventually').toBeGreaterThan(2);
    expect(result.scrolls.every((s) => s.visible), 'the selection stays visible while scrolling').toBe(true);

    // Minimum scroll = about one row per press, and the row sits at the BOTTOM
    // edge — not pulled to the top.
    const steps = result.scrolls.slice(1).map((s, i) => s.scrollTop - result.scrolls[i].scrollTop);
    for (const step of steps) {
      expect(step, `scrolled ${step}px for one row pitch of ${result.rowPitch}px`)
        .toBeLessThanOrEqual(result.rowPitch + 2);
    }

    expect(result.end.visible, 'End must leave the last row visible').toBe(true);
  });

  test('clicking a row still leaves the list scroll where the reader put it', async ({ page }) => {
    await loadBrowse(page, 'x-');
    await page.evaluate(() => { document.getElementById('behaviors-search-results')!.scrollTop = 500; });
    await page.waitForTimeout(80);
    await page.locator('.behaviors-search-results__row').nth(12).click();
    await page.waitForTimeout(300);
    const after = await page.evaluate(() => document.getElementById('behaviors-search-results')!.scrollTop);
    expect(Math.round(after), 'a click must not move the list').toBe(500);
  });
});

