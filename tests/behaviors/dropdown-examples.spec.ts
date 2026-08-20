/**
 * #701 — every x-dropdown example on the behaviors showcase must be a real
 * dropdown: 4–5 options, at least one carrying an image that actually loads,
 * a trigger that opens the menu and closes it again.
 *
 * Before this, all 8 rows rendered `<div x-dropdown>Example x-dropdown
 * content</div>` — a trigger with an EMPTY menu. Nothing opened, and every
 * variant (position, trigger, closeOnSelect, closeOnOutside) described the
 * behaviour of a menu that had no items.
 *
 * John: "shouldn't x-dropdown all have 4 or 5 options, including images" /
 * "create unit test for all x-dropdown examples". So this walks EVERY
 * x-dropdown row in the browse list, not just the first.
 */
import { test, expect, Page } from '@playwright/test';

const MIN_OPTIONS = 4;
const MAX_OPTIONS = 5;

async function openShowcase(page: Page) {
  await page.goto('/?page=behaviors');
  await page.waitForSelector('#behaviors-search', { timeout: 30000 });
  await page.fill('#behaviors-search', 'dropdown');
  // Wait for the x-dropdown rows specifically. The list renders as soon as ANY
  // match exists, but the browse entries are built after the catalogue fetch
  // resolves -- waiting on "some row" raced that and left .find() undefined.
  await page.waitForFunction(
    () => [...document.querySelectorAll('.behaviors-search-results__row')]
      .some((r) => r.getAttribute('data-browse-token') === 'x-dropdown'
                && r.getAttribute('data-variant') === 'click'),
    { timeout: 30000 },
  );
}

/** Every x-dropdown row's variant label, in list order. */
async function dropdownVariants(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll('.behaviors-search-results__row')]
      .filter((r) => r.getAttribute('data-browse-token') === 'x-dropdown')
      .map((r) => r.getAttribute('data-variant') || ''),
  );
}

/** Render the nth x-dropdown row and report what its example actually built. */
async function renderNth(page: Page, index: number) {
  return page.evaluate(async (i: number) => {
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const rows = [...document.querySelectorAll('.behaviors-search-results__row')]
      .filter((r) => r.getAttribute('data-browse-token') === 'x-dropdown') as HTMLElement[];
    rows[i].click();
    await sleep(350);

    const root = document.querySelector('#behaviors-live-stage .wb-dropdown') as HTMLElement | null;
    if (!root) return null;
    const menu = root.querySelector('.wb-dropdown__menu') as HTMLElement;
    const items = [...menu.querySelectorAll('.wb-dropdown__item')] as HTMLElement[];
    const imgs = [...menu.querySelectorAll('img')] as HTMLImageElement[];

    // Wait for the avatars rather than racing them.
    for (let attempt = 0; attempt < 20 && imgs.some((im) => !im.complete); attempt++) await sleep(100);

    const trigger = (root.querySelector('.wb-dropdown__trigger') || root) as HTMLElement;
    const variant = rows[i].getAttribute('data-variant') || '';

    // trigger="hover" is pointer-driven ON PURPOSE: dropdown()'s toggle() has
    // `if (config.trigger === 'hover' && isOpen) return`, so a click cannot
    // close a hover menu -- mouseleave does, after a 150ms grace period that
    // lets the pointer travel from the trigger into the menu. Drive each
    // variant the way it is meant to be driven.
    let openedDisplay: string;
    let closedDisplay: string;
    if (variant === 'hover') {
      root.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));
      await sleep(200);
      openedDisplay = getComputedStyle(menu).display;
      root.dispatchEvent(new MouseEvent('mouseleave', { bubbles: false }));
      await sleep(400);
      closedDisplay = getComputedStyle(menu).display;
    } else {
      trigger.click();
      await sleep(200);
      openedDisplay = getComputedStyle(menu).display;
      trigger.click();
      await sleep(200);
      closedDisplay = getComputedStyle(menu).display;
    }

    return {
      variant,
      itemCount: items.length,
      imgCount: imgs.length,
      imgsLoaded: imgs.filter((im) => im.complete && im.naturalWidth > 0).length,
      itemsWithText: items.filter((el) => (el.textContent || '').trim().length > 0).length,
      alignedRows: items.filter((el) => getComputedStyle(el).display === 'flex').length,
      openedDisplay,
      closedDisplay,
    };
  }, index);
}

test.describe('#701 — every x-dropdown example is a real dropdown', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('the showcase actually lists x-dropdown rows to check', async ({ page }) => {
    await openShowcase(page);
    const variants = await dropdownVariants(page);
    expect(variants.length, 'expected the x-dropdown variants to be listed').toBeGreaterThan(0);
  });

  test('every x-dropdown row renders 4-5 options, with images that load', async ({ page }) => {
    test.setTimeout(120_000);
    await openShowcase(page);
    const variants = await dropdownVariants(page);

    const failures: string[] = [];
    for (let i = 0; i < variants.length; i++) {
      const r = await renderNth(page, i);
      const label = `x-dropdown/${variants[i] || '(none)'}`;

      if (!r) { failures.push(`${label}: rendered no .wb-dropdown at all`); continue; }
      if (r.itemCount < MIN_OPTIONS || r.itemCount > MAX_OPTIONS) {
        failures.push(`${label}: ${r.itemCount} options (want ${MIN_OPTIONS}-${MAX_OPTIONS})`);
      }
      if (r.itemsWithText !== r.itemCount) {
        failures.push(`${label}: ${r.itemCount - r.itemsWithText} option(s) render no text`);
      }
      if (r.imgsLoaded < 1) {
        failures.push(`${label}: ${r.imgCount} image(s) in the menu, ${r.imgsLoaded} actually loaded`);
      }
      if (r.alignedRows !== r.itemCount) {
        failures.push(`${label}: ${r.itemCount - r.alignedRows} option(s) not laid out as a flex row — an avatar and its label would not align`);
      }
      if (r.openedDisplay === 'none') failures.push(`${label}: the trigger did not open the menu`);
      if (r.closedDisplay !== 'none') failures.push(`${label}: the menu did not close again`);
    }

    expect(failures, failures.join('\n')).toEqual([]);
  });

  test('the code sample shown alongside is the example that ran', async ({ page }) => {
    await openShowcase(page);
    await renderNth(page, 0);
    const code = await page.evaluate(
      () => document.getElementById('behaviors-live-code')?.textContent || '',
    );
    expect(code, 'the sample must show the x-dropdown markup').toContain('x-dropdown');
    expect(code, 'the sample must show the options, not an empty host').toContain('<button');
    expect(code, 'the sample must show the images').toContain('<img');
  });
});

test.describe('#703 — an opened menu stays inside the stage', () => {
  for (const [name, viewport] of [
    ['phone', { width: 375, height: 812 }],
    ['desktop', { width: 1280, height: 900 }],
  ] as const) {
    test(`${name}: the open menu never reaches the code panel`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await openShowcase(page);

      const geo = await page.evaluate(async () => {
        const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
        const rows = [...document.querySelectorAll('.behaviors-search-results__row')]
          .filter((r) => r.getAttribute('data-browse-token') === 'x-dropdown') as HTMLElement[];
        // bottom-* opens downward, toward the code panel — the failing direction.
        const row = rows.find((r) => (r.getAttribute('data-variant') || '').startsWith('bottom')) || rows[0];
        row.click();
        await sleep(400);

        const stage = document.getElementById('behaviors-live-stage')!;
        const code = document.getElementById('behaviors-live-code')!;
        const root = stage.querySelector('.wb-dropdown') as HTMLElement;
        const menu = root.querySelector('.wb-dropdown__menu') as HTMLElement;
        const trigger = (root.querySelector('.wb-dropdown__trigger') || root) as HTMLElement;

        const closedHeight = Math.round(stage.getBoundingClientRect().height);
        trigger.click();
        for (let i = 0; i < 30 && getComputedStyle(menu).display === 'none'; i++) await sleep(50);
        await sleep(200);   // let the stage's rAF fit run

        const sb = stage.getBoundingClientRect();
        const mb = menu.getBoundingClientRect();
        const cb = code.getBoundingClientRect();
        return {
          closedHeight,
          openHeight: Math.round(sb.height),
          menuBottom: Math.round(mb.bottom),
          stageBottom: Math.round(sb.bottom),
          codeTop: Math.round(cb.top),
        };
      });

      expect(geo.openHeight, 'the stage must grow to hold the open menu').toBeGreaterThan(geo.closedHeight);
      expect(geo.menuBottom, 'the menu must end inside the stage (Standard §15)')
        .toBeLessThanOrEqual(geo.stageBottom + 1);
      expect(geo.menuBottom, 'the menu must not reach the code panel')
        .toBeLessThanOrEqual(geo.codeTop);
    });
  }

  test('the stage returns to its normal height for the next example', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await openShowcase(page);

    const heights = await page.evaluate(async () => {
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
      const stage = document.getElementById('behaviors-live-stage')!;
      const rows = [...document.querySelectorAll('.behaviors-search-results__row')]
        .filter((r) => r.getAttribute('data-browse-token') === 'x-dropdown') as HTMLElement[];

      rows[0].click();
      await sleep(400);
      const root = stage.querySelector('.wb-dropdown') as HTMLElement;
      const menu = root.querySelector('.wb-dropdown__menu') as HTMLElement;
      (root.querySelector('.wb-dropdown__trigger') as HTMLElement).click();
      for (let i = 0; i < 30 && getComputedStyle(menu).display === 'none'; i++) await sleep(50);
      await sleep(200);
      const opened = Math.round(stage.getBoundingClientRect().height);

      rows[1].click();          // a different example
      await sleep(500);
      const afterSwitch = Math.round(stage.getBoundingClientRect().height);
      return { opened, afterSwitch };
    });

    expect(heights.afterSwitch, 'the panel must not stay stretched after switching examples')
      .toBeLessThan(heights.opened);
  });
});

test.describe('#704 — a hover dropdown closes again', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('trigger="hover" opens on pointer entry and closes on leave', async ({ page }) => {
    await openShowcase(page);
    const state = await page.evaluate(async () => {
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
      const row = [...document.querySelectorAll('.behaviors-search-results__row')]
        .find((r) => r.getAttribute('data-browse-token') === 'x-dropdown'
                  && r.getAttribute('data-variant') === 'hover') as HTMLElement;
      row.click();
      await sleep(400);
      const root = document.querySelector('#behaviors-live-stage .wb-dropdown') as HTMLElement;
      const menu = root.querySelector('.wb-dropdown__menu') as HTMLElement;

      root.dispatchEvent(new MouseEvent('mouseenter'));
      await sleep(250);
      const opened = getComputedStyle(menu).display;

      root.dispatchEvent(new MouseEvent('mouseleave'));
      await sleep(600);   // 150ms grace + slack
      const closed = getComputedStyle(menu).display;
      return { opened, closed };
    });

    expect(state.opened, 'hovering must open it').not.toBe('none');
    expect(state.closed, 'leaving must close it — toggle() swallowed this before #704').toBe('none');
  });
});

test.describe('#705 — selecting leaves the example alone and gets logged', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('picking an option does not navigate or re-render, and appears in the event log', async ({ page }) => {
    await openShowcase(page);

    const result = await page.evaluate(async () => {
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
      const row = [...document.querySelectorAll('.behaviors-search-results__row')]
        .find((r) => r.getAttribute('data-browse-token') === 'x-dropdown'
                  && r.getAttribute('data-variant') === 'click') as HTMLElement;
      row.click();
      await sleep(400);

      const urlBefore = location.href;
      const root = document.querySelector('#behaviors-live-stage .wb-dropdown') as HTMLElement;
      const menu = root.querySelector('.wb-dropdown__menu') as HTMLElement;
      (root.querySelector('.wb-dropdown__trigger') as HTMLElement).click();
      await sleep(300);

      const item = menu.querySelector('.wb-dropdown__item') as HTMLElement;
      const itemTag = item.tagName;
      item.click();
      await sleep(400);

      return {
        itemTag,
        urlUnchanged: location.href === urlBefore,
        stillRendered: !!document.querySelector('#behaviors-live-stage .wb-dropdown'),
        logged: [...document.querySelectorAll('.behaviors-live__events-type')].map((e) => e.textContent || ''),
      };
    });

    expect(result.itemTag, 'a pickable option is a button — an <a href="#"> navigates').toBe('BUTTON');
    expect(result.urlUnchanged, 'selecting must not change the route').toBe(true);
    expect(result.stillRendered, 'the example must still be there after a selection').toBe(true);
    expect(result.logged, "the behavior's own event must reach the panel")
      .toContain('wb:dropdown:select');
  });
});

test.describe('#707 — the menu is sized to what it shows', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('no option label wraps, and the menu stays inside the stage', async ({ page }) => {
    await openShowcase(page);

    const geo = await page.evaluate(async () => {
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
      const row = [...document.querySelectorAll('.behaviors-search-results__row')]
        .find((r) => r.getAttribute('data-browse-token') === 'x-dropdown'
                  && r.getAttribute('data-variant') === 'click') as HTMLElement;
      row.click();
      await sleep(400);
      const stage = document.getElementById('behaviors-live-stage')!;
      const root = stage.querySelector('.wb-dropdown') as HTMLElement;
      const menu = root.querySelector('.wb-dropdown__menu') as HTMLElement;
      (root.querySelector('.wb-dropdown__trigger') as HTMLElement).click();
      await sleep(350);

      // Count the LINE BOXES the text actually occupies -- an item's height is
      // no use here, a 28px avatar makes every row look like two lines.
      const lineCount = (el: Element) => {
        let n = 0;
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        let node: Node | null;
        while ((node = walker.nextNode())) {
          if (!node.nodeValue || !node.nodeValue.trim()) continue;
          const range = document.createRange();
          range.selectNodeContents(node);
          n = Math.max(n, range.getClientRects().length);
        }
        return n;
      };

      const items = [...menu.querySelectorAll('.wb-dropdown__item')];
      return {
        wrapped: items.filter((i) => lineCount(i) > 1).map((i) => (i.textContent || '').trim()),
        menuWidth: Math.round(menu.getBoundingClientRect().width),
        stageWidth: Math.round(stage.getBoundingClientRect().width),
        itemCount: items.length,
      };
    });

    expect(geo.itemCount, 'expected the options to be there to measure').toBeGreaterThan(0);
    expect(geo.wrapped, 'no option label may wrap — the menu sizes to its content').toEqual([]);
    expect(geo.menuWidth, 'the menu must not overflow the stage').toBeLessThanOrEqual(geo.stageWidth);
  });
});

test.describe('#708 — the select event says WHICH option', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('every option reports its own index, id and value', async ({ page }) => {
    await openShowcase(page);

    const picks = await page.evaluate(async () => {
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
      const row = [...document.querySelectorAll('.behaviors-search-results__row')]
        .find((r) => r.getAttribute('data-browse-token') === 'x-dropdown'
                  && r.getAttribute('data-variant') === 'click') as HTMLElement;

      const seen: any[] = [];
      for (const index of [0, 2, 4]) {
        row.click();                       // re-render, so each pick starts clean
        await sleep(400);
        const root = document.querySelector('#behaviors-live-stage .wb-dropdown') as HTMLElement;
        const menu = root.querySelector('.wb-dropdown__menu') as HTMLElement;
        (root.querySelector('.wb-dropdown__trigger') as HTMLElement).click();
        await sleep(250);

        let detail: any = null;
        root.addEventListener('wb:dropdown:select', (e: any) => { detail = e.detail; }, { once: true });
        const items = [...menu.querySelectorAll('.wb-dropdown__item')] as HTMLElement[];
        const expectedText = (items[index].textContent || '').trim();
        items[index].click();
        await sleep(250);
        seen.push({ index, expectedText, detail });
      }
      return seen;
    });

    for (const pick of picks) {
      expect(pick.detail, `option ${pick.index} fired no wb:dropdown:select`).not.toBeNull();
      expect(pick.detail.index, `option ${pick.index} reported the wrong index`).toBe(pick.index);
      expect(pick.detail.value, `option ${pick.index} reported the wrong value`).toBe(pick.expectedText);
      expect(pick.detail, 'the payload must carry an id field').toHaveProperty('id');
      expect(pick.detail, 'the payload must keep href').toHaveProperty('href');
    }

    // The last option is the one an off-by-one would miss.
    expect(picks[picks.length - 1].detail.index, 'the last option must report its real index').toBe(4);
  });

  test('the handler snippet teaches that event, not a generic click', async ({ page }) => {
    await openShowcase(page);
    await renderNth(page, 0);
    const snippet = await page.evaluate(
      () => document.getElementById('behaviors-live-events-snippet')?.textContent || '',
    );
    expect(snippet, 'Standard 27 — teach the event the control actually fires').toContain('wb:dropdown:select');
    expect(snippet, 'and the payload a reader needs').toContain('index');
  });
});
