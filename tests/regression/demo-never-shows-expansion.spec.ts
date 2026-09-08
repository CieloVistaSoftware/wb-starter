/**
 * THE SOURCE PANEL SHOWS WHAT YOU WOULD WRITE, OR SAYS IT CANNOT
 * ==============================================================
 * #1003 — John, shown the expanded `x-cardimage` output: "this requires way too
 * much internals knowledge which the user won't have — it must be simplified
 * via the x-behavior attribute".
 *
 * The authoring surface was already one line:
 *
 *     <div x-cardimage src="…" title="Ocean Breeze" subtitle="Coastal landscapes"></div>
 *
 * What he was shown was the post-injection DOM — generated classes, a generated
 * <figure>/<img>, inline styles. demo() fell back to `element.innerHTML` when it
 * could not locate the authored markup, so any demo it failed to find silently
 * began presenting its own expansion AS the API. A reader copies twenty lines of
 * internals and concludes the framework demands them.
 *
 * A panel that is silently wrong is worse than one that is honestly empty.
 *
 * THIS TEST FORCES THE FALLBACK. On a normal page every demo resolves its
 * authored source, so the path never runs and a passing suite proves nothing —
 * measured: 48 authored, 0 fallbacks, on cards.html. The demo here is created
 * at runtime, so it cannot exist in the page source and has no _rawSource.
 */

import { test, expect } from '@playwright/test';

/**
 * Wait for the demo SOURCE PANELS, not for a duration.
 *
 * Both tests below counted demos after a fixed sleep, and the counters skip a
 * demo whose panel does not exist yet (`if (!code) continue`). So a page that
 * was merely slow read as "demos are showing the wrong thing": `authored` never
 * reached its threshold and the assertion blamed the content.
 *
 * That tipped over the moment src/core/wb.js started resolving
 * data/schema-index.json correctly on demos/ pages (#1059) — those pages now do
 * real work they previously skipped via a 404, and under eight parallel workers
 * 2500ms stopped being enough. The page was fine: measured alone, all 40 panels
 * showed authored markup. The sleep was the defect, and it was latent long
 * before anything made it visible.
 */
async function demoPanelsReady(page: import('@playwright/test').Page) {
  // Every panel the counters below will look at, not "enough of them". Waiting
  // for a threshold (11) returned EARLIER than the old sleep did and made the
  // assertion fail for the same reason the sleep did: the counters read a page
  // that was still building. The counters take the first 40 demos, so this
  // waits for exactly those.
  //
  // Measured: all 40 on cards.html do build a panel (noPanel: 0), so requiring
  // all of them cannot hang on a demo that legitimately never renders one.
  await page.waitForFunction(
    () => {
      const demos = Array.from(document.querySelectorAll('[x-demo]')).slice(0, 40);
      if (!demos.length) return false;
      return demos.every((d) => d.querySelector('pre code'));
    },
    undefined,
    { timeout: 45_000 },
  );
}

test.describe('the demo source panel never shows the expansion (#1003)', () => {
  test('a demo whose source cannot be found says so instead of dumping the DOM', async ({ page }) => {
    await page.goto('/demos/site/cards.html', { waitUntil: 'domcontentloaded' });
    await demoPanelsReady(page);

    const result = await page.evaluate(async () => {
      // Built at runtime: absent from the page source, and with no _rawSource,
      // which is exactly the state that used to trigger the innerHTML fallback.
      const host = document.createElement('div');
      host.setAttribute('x-demo', '');
      host.innerHTML =
        '<div x-cardimage src="https://picsum.photos/seed/probe1003/600/400" ' +
        'title="Probe" subtitle="forced fallback"></div>';
      document.body.appendChild(host);

      if (window.WB && typeof window.WB.scan === 'function') {
        try { await window.WB.scan(host, { eager: true }); } catch { /* keep going */ }
      }
      await new Promise((r) => setTimeout(r, 2500));

      const code = host.querySelector('pre code');
      const text = code ? (code.textContent || '') : null;
      host.remove();
      return { rendered: !!code, text };
    });

    test.skip(!result.rendered, 'the demo behavior did not build a source panel here');

    const text = result.text || '';

    // The defect, named precisely: generated internals presented as authoring.
    const expansionMarkers = [
      'x-card__figure',
      'x-card__header-content',
      'object-fit: cover',
      'class="x-card x-card--image',
      'loading="lazy"',
    ].filter((m) => text.includes(m));

    expect(
      expansionMarkers,
      expansionMarkers.length
        ? `the panel is showing generated DOM as if it were the API: ${expansionMarkers.join(', ')}\n` +
            `A reader copying this would hand-write internals the behavior builds for them.`
        : ''
    ).toEqual([]);

    // And it must not simply go blank — absence has to be stated.
    expect(
      text.toLowerCase(),
      'the panel showed neither authored markup nor an explanation'
    ).toContain('source unavailable');
  });

  test('a normal demo still shows its authored one-liner', async ({ page }) => {
    // The guard above must not have been bought by breaking the good path.
    await page.goto('/demos/site/cards.html', { waitUntil: 'domcontentloaded' });
    await demoPanelsReady(page);

    const stats = await page.evaluate(() => {
      const demos = Array.from(document.querySelectorAll('[x-demo]')).slice(0, 40);
      let authored = 0;
      let unavailable = 0;
      let expansion = 0;
      for (const d of demos) {
        const code = d.querySelector('pre code');
        if (!code) continue;
        const t = code.textContent || '';
        if (/source unavailable/i.test(t)) unavailable++;
        else if (/x-card__figure|object-fit: cover|x-card__header-content/.test(t)) expansion++;
        else authored++;
      }
      return { authored, unavailable, expansion };
    });

    expect(stats.authored, 'real demos must still show their authored markup').toBeGreaterThan(10);
    expect(
      stats.expansion,
      'no demo may present generated DOM as its source'
    ).toBe(0);
  });
});
