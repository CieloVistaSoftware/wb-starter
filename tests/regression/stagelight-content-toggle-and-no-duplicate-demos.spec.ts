import { test, expect } from '@playwright/test';

/**
 * #656 — <wb-stagelight>text</wb-stagelight> discarded its authored content,
 *        and stagelight.schema.json's $view raced stagelight() to build
 *        .wb-stagelight__spot (both create it; last writer wins via its own
 *        innerHTML = ''). Fixed by adding wb-stagelight to SCHEMA_EXCLUDED_TAGS.
 * #657 — demos/site/effects.html rendered the identical <wb-snow> demo twice.
 * #658 — the spotlight had no off switch, though the fixture variant of the
 *        same component has toggled since it shipped.
 */

test.describe('wb-stagelight renders content, builds one overlay, and toggles (#656/#658)', () => {
  test('every <wb-stagelight> keeps its authored text', async ({ page }) => {
    await page.goto('/demos/site/effects.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelectorAll('wb-stagelight').length > 0, null, {
      timeout: 30000,
    });
    await page.waitForTimeout(2000);

    const texts = await page.evaluate(() =>
      [...document.querySelectorAll('wb-stagelight')].map((e) => (e.textContent ?? '').trim())
    );

    expect(texts.length, 'expected stagelight demos on the page').toBeGreaterThan(0);
    for (const t of texts) {
      // Standard §1: every example must visibly render. Before the fix the
      // schema pass wiped this to "".
      expect(t.length, 'a <wb-stagelight> rendered with no content').toBeGreaterThan(0);
    }
  });

  test('exactly one .wb-stagelight__spot per spotlight host (no schema/behavior race)', async ({ page }) => {
    await page.goto('/demos/site/effects.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!document.querySelector('.wb-stagelight__spot'), null, {
      timeout: 30000,
    });
    await page.waitForTimeout(1500);

    const counts = await page.evaluate(() => ({
      hosts: document.querySelectorAll('.wb-stagelight--spotlight').length,
      spots: document.querySelectorAll('.wb-stagelight__spot').length,
    }));

    expect(counts.hosts).toBeGreaterThan(0);
    expect(counts.spots, 'schema and behavior must not both build the overlay').toBe(counts.hosts);
  });

  test('the spotlight can be switched off, and its content stays readable', async ({ page }) => {
    await page.goto('/demos/site/effects.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!document.querySelector('.wb-stagelight--spotlight'), null, {
      timeout: 30000,
    });
    await page.waitForTimeout(1500);

    const result = await page.evaluate(async () => {
      const host = document.querySelector('.wb-stagelight--spotlight') as HTMLElement & {
        wbStageLight?: any;
      };
      const overlay = () =>
        getComputedStyle(host.querySelector('.wb-stagelight__spot') as HTMLElement).display;

      const onDisplay = overlay();
      const onState = host.wbStageLight.isOn;

      host.wbStageLight.toggle();
      await new Promise((r) => setTimeout(r, 80));
      const offDisplay = overlay();
      const offState = host.wbStageLight.isOn;
      const textWhileOff = (host.textContent ?? '').trim();

      host.wbStageLight.toggle();
      await new Promise((r) => setTimeout(r, 80));
      const backOnDisplay = overlay();

      return {
        onDisplay, offDisplay, backOnDisplay,
        onState, offState,
        textWhileOff,
        role: host.getAttribute('role'),
        tabindex: host.getAttribute('tabindex'),
      };
    });

    expect(result.onDisplay).not.toBe('none');
    expect(result.offDisplay, 'toggling off must hide the overlay').toBe('none');
    expect(result.backOnDisplay, 'toggling on must restore it').not.toBe('none');

    // isOn must be a LIVE read -- copying the API by object spread froze it.
    expect(result.onState).toBe(true);
    expect(result.offState, 'isOn must reflect the current state, not a snapshot').toBe(false);

    // The whole point of an off switch is reading what is underneath.
    expect(result.textWhileOff.length, 'content must stay visible while off').toBeGreaterThan(0);

    // It is an interactive control now, not decoration.
    expect(result.role).toBe('switch');
    expect(result.tabindex).toBe('0');
  });
});

test.describe('effects.html has no duplicate demos (#657)', () => {
  test('no two <wb-demo> blocks contain byte-identical live markup', async ({ page }) => {
    await page.goto('/demos/site/effects.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelectorAll('wb-demo').length > 0, null, {
      timeout: 30000,
    });

    // Compare the AUTHORED source of each demo, read from the page's own HTML,
    // so this cannot be fooled by behaviors mutating the live DOM differently.
    const dupes = await page.evaluate(async () => {
      const html = await (await fetch(location.pathname)).text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const seen = new Map<string, number>();
      for (const d of [...doc.querySelectorAll('wb-demo')]) {
        const key = d.innerHTML.replace(/\s+/g, ' ').trim();
        seen.set(key, (seen.get(key) ?? 0) + 1);
      }
      return [...seen.entries()].filter(([, n]) => n > 1).map(([k, n]) => ({ markup: k.slice(0, 120), n }));
    });

    expect(dupes, `duplicate demo blocks: ${JSON.stringify(dupes, null, 2)}`).toEqual([]);
  });
});
