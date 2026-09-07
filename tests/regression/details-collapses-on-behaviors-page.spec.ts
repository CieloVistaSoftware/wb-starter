import { test, expect } from '@playwright/test';

/**
 * #996 — a closed native <details> must actually hide its content.
 *
 * Reported as: a bare `<details><summary>s</summary><ul>…</ul></details>`,
 * appended and never touched, reads `open === false` while its content still
 * measures 371px tall — with no author rule anywhere setting `display` or
 * `content-visibility` on it.
 *
 * HOW THE ORIGINAL MEASUREMENT MISLED, which is worth keeping:
 * `getBoundingClientRect().height` on the hidden <ul> still returns a non-zero
 * number (66px measured here) even when the user agent has correctly hidden it.
 * A rect is not a visibility test. The honest probes are the height of the
 * <details> ITSELF — a collapsed one is just its summary — and
 * `Element.checkVisibility()`, which answers the question directly.
 *
 * So this asserts the property that actually matters to a reader: opening the
 * thing changes what is on screen, and closing it puts it back.
 */

const PAGE = '/?page=behaviors';

test.describe('#996: native <details> collapses on the behaviors page', () => {
  test('a bare details hides its content when closed and reveals it when open', async ({ page }) => {
    await page.goto(PAGE, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => (window as any).WB);

    const m = await page.evaluate(() => {
      const d = document.createElement('details');
      d.innerHTML = '<summary>s</summary><ul><li>a</li><li>b</li><li>c</li></ul>';
      document.body.appendChild(d);
      const ul = d.querySelector('ul') as HTMLElement;

      // Force layout without requestAnimationFrame: a hidden tab never paints,
      // so a rAF-based probe hangs rather than measures.
      void d.offsetHeight;
      const closedH = d.getBoundingClientRect().height;
      const closedVisible = ul.checkVisibility ? ul.checkVisibility() : null;

      d.open = true;
      void d.offsetHeight;
      const openH = d.getBoundingClientRect().height;
      const openVisible = ul.checkVisibility ? ul.checkVisibility() : null;

      d.open = false;
      void d.offsetHeight;
      const reclosedH = d.getBoundingClientRect().height;

      d.remove();
      return { closedH, openH, reclosedH, closedVisible, openVisible };
    });

    expect(
      m.closedVisible,
      'the content of a CLOSED <details> reports as visible — the user-agent behaviour that\n' +
      'hides non-summary children is not taking effect (#996).',
    ).toBe(false);

    expect(
      m.openVisible,
      'the content of an OPEN <details> reports as hidden — opening it does nothing.',
    ).toBe(true);

    expect(
      m.openH,
      `opening the <details> did not make it taller (closed ${Math.round(m.closedH)}px, open ` +
      `${Math.round(m.openH)}px). A collapsed details should be roughly its summary, and an open\n` +
      'one should include its content.',
    ).toBeGreaterThan(m.closedH + 20);

    expect(
      Math.round(m.reclosedH),
      `closing it again left it at ${Math.round(m.reclosedH)}px instead of returning to\n` +
      `${Math.round(m.closedH)}px — it opens but does not close.`,
    ).toBe(Math.round(m.closedH));
  });

  test('the details elements already on the page behave the same way', async ({ page }) => {
    // The bare probe above proves the UA behaviour is intact. This proves the
    // PAGE has not broken it for its own details — which is what #996 was
    // actually reported against.
    await page.goto(PAGE, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => (window as any).WB);

    // Wait for the page's OWN details to exist. behaviors.html carries 11 in
    // source plus one the browse navigator builds at runtime, so querying on
    // `window.WB` alone found none and skipped — a skip that looked like a pass
    // while checking nothing.
    await page.waitForSelector('details', { state: 'attached' });

    const found = await page.evaluate(() => {
      const all = [...document.querySelectorAll('details')] as HTMLDetailsElement[];
      const closed = all.filter((d) => !d.open);
      const leaking: string[] = [];
      for (const d of closed.slice(0, 25)) {
        const kids = [...d.children].filter((c) => c.tagName !== 'SUMMARY') as HTMLElement[];
        for (const k of kids) {
          if (k.checkVisibility && k.checkVisibility()) {
            leaking.push(`${d.id || d.className || 'details'} > ${k.tagName.toLowerCase()}`);
          }
        }
      }
      return { total: all.length, count: closed.length, leaking };
    });

    // NOT test.skip() on an empty result. behaviors.html has 11 <details> in
    // source, so finding zero means the page failed to render them — which is a
    // failure worth reporting, not a reason to report nothing.
    expect(
      found.total,
      'the behaviors page rendered no <details> at all, though its source carries 11.',
    ).toBeGreaterThan(0);

    expect(
      found.leaking,
      `${found.leaking.length} closed <details> on the page still show their content:\n` +
      `  ${found.leaking.join('\n  ')}\n` +
      'A reader sees content under a collapsed disclosure, which is #996.',
    ).toEqual([]);
  });
});
