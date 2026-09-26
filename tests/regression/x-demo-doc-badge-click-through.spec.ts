import { test, expect, Page } from '@playwright/test';

/**
 * #593: John, live on pages/behaviors.html — the small 📖 doc-link badge in
 * the top-right corner of the "Show Popover" and "Confirm Dialog" demo cards
 * does nothing when clicked.
 *
 * Root cause: demo.js's attachInstanceDocLink() (#388/#390) appends the
 * badge `<a>` as a DOM CHILD of hostEl — for an x-* behavior, hostEl is the
 * very element carrying the attribute (`<button x-confirm>` etc.), the same
 * element several overlay.js behaviors (confirm(), prompt(), lightbox())
 * wire up with `element.onclick = (e) => { e.preventDefault(); ...open own
 * overlay... }`, unconditionally, with no check on e.target. A click on the
 * badge bubbles straight into that handler: e.preventDefault() kills the
 * anchor's own navigation, and the behavior's own dialog/lightbox opens
 * instead — confirmed live via Playwright (see PR discussion): no new tab,
 * the confirm overlay ("Are you sure you want to proceed?") appeared behind
 * it instead. x-popover's own handler (`element.onclick = () => popoverEl ?
 * hide() : show()`) never calls preventDefault, so that one badge already
 * worked — but was fragile to the exact same class of bug landing there
 * later (e.g. copy-pasting the confirm()/prompt() pattern).
 *
 * NOT a docs-manifest / stale-doc-restructuring problem: docs/manifest.json
 * has no dedicated popover.md/confirm.md/prompt.md/lightbox.md entry (none
 * of those files exist under docs/ at all — confirmed via search), so
 * findBehaviorDocFile()'s fallback to the shared docs/behaviors-reference.md
 * is the CORRECT, working, current fallback for every one of them, not a
 * bug. If dedicated docs are ever written for these behaviors, this
 * fallback should naturally stop matching (findBehaviorDocFile() always
 * prefers an exact name match first) — no separate migration needed.
 *
 * Fix: demo.js's attachInstanceDocLink() now stops the click's propagation
 * right on the badge itself (target phase, before it can bubble into
 * hostEl's own handler) — restores the badge as a fully independent control
 * for EVERY x-* behavior, not a one-off patch to overlay.js's individual
 * handlers. The anchor's own default action (navigate, target="_blank")
 * still fires normally; it simply never reaches hostEl's click handling.
 */

const HARNESS = '/demos/test-harness.html';

async function inject(page: Page, html: string) {
  await page.goto(HARNESS);
  await page.waitForFunction(
    () => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0,
    { timeout: 10000 }
  );
  await page.evaluate(async (h: string) => {
    const existing = document.getElementById('test-container');
    if (existing) existing.remove();
    const container = document.createElement('div');
    container.id = 'test-container';
    container.innerHTML = h;
    document.body.appendChild(container);
    await (window as any).WB.scan(container);
  }, html);
  await page.waitForSelector('#test-container [x-demo] .x-demo__grid', { timeout: 10000 });
}

test.describe('[x-demo] doc-badge click-through on x-* behaviors (#593)', () => {
  // Each of these is authored on pages/behaviors.html as a native element
  // decorated with the attribute, exactly like the two John reported.
  const behaviors: Array<{ attr: string; markup: string; overlaySelector: string }> = [
    {
      attr: 'x-confirm',
      markup: `<button x-confirm confirm-title="Confirm Action" confirm-message="Are you sure you want to proceed?">Confirm Dialog</button>`,
      overlaySelector: 'body > div:has(button.ok)',
    },
    {
      attr: 'x-prompt',
      markup: `<button x-prompt prompt-title="Enter Value" prompt-message="Please enter your name:">Prompt Dialog</button>`,
      overlaySelector: 'body > div:has(input[type="text"])',
    },
    {
      attr: 'x-lightbox',
      markup: `<button x-lightbox src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E">View Image</button>`,
      // overlay.js's lightbox() puts the SAME 'x-lightbox' class on both the
      // trigger button (element.classList.add('x-lightbox')) and the
      // injected fullscreen overlay div -- '.x-lightbox' alone matches the
      // trigger too. The overlay is a direct child of <body>; the trigger
      // lives inside #test-container, so scope to body's direct children.
      overlaySelector: 'body > div.x-lightbox',
    },
    {
      attr: 'x-popover',
      markup: `<button x-popover popover-title="Popover Title" popover-content="More info">Show Popover</button>`,
      overlaySelector: '.x-popover',
    },
  ];

  for (const { attr, markup, overlaySelector } of behaviors) {
    test(`${attr}: clicking the doc badge navigates instead of triggering the behavior's own overlay`, async ({ page, context }) => {
      await inject(page, `<div x-demo id="d">${markup}</div>`);

      // #977: this asserted toHaveCount(1), which encoded a single-badge world
      // that no longer exists. `<button x-confirm>` is TWO behaviors — the
      // auto-injected <button> (Law 4b) and x-confirm — resolving to two
      // distinct docs, and demo.js deliberately renders one badge per distinct
      // doc (demo.css even offsets the second so it doesn't stack).
      //
      // Relaxing to .first() would throw away what the count was really
      // guarding: a genuine double-injection of the SAME badge. So assert the
      // invariant that actually holds — at least one badge, all hrefs distinct.
      const badges = page.locator('#d .x-demo__card-doc-link');
      await expect(badges.first(), `${attr}'s x-demo has no doc-link badge`).toBeAttached({ timeout: 5000 });

      const hrefs = await badges.evaluateAll((els) =>
        els.map((e) => (e as HTMLAnchorElement).getAttribute('href'))
      );
      expect(hrefs.every(Boolean), `${attr}: a doc-link badge has no href`).toBe(true);
      expect(
        new Set(hrefs).size,
        `${attr}: duplicate doc-link badges for the same href — the href dedup in attachInstanceDocLink is broken (${hrefs.join(', ')})`
      ).toBe(hrefs.length);

      // Click this behavior's own badge, not merely whichever came first.
      const own = attr.replace(/^x-/, '');
      const idx = Math.max(0, hrefs.findIndex((h) => (h || '').includes(own)));
      const badge = badges.nth(idx);

      const [popup] = await Promise.all([
        context.waitForEvent('page', { timeout: 5000 }),
        badge.click(),
      ]);
      await popup.waitForLoadState();
      expect(popup.url(), `${attr}'s doc badge must open a real doc, not a blank/error page`).toContain(
        'doc-viewer.html?file='
      );
      await popup.close();

      // The behavior's own overlay must NOT have opened as a side effect of
      // clicking the badge — it's meta chrome, not the demoed action.
      await expect(
        page.locator(overlaySelector),
        `${attr}'s own overlay must not open when only the doc badge was clicked`
      ).toHaveCount(0);
    });
  }

  test('x-confirm badge href resolves to a real, loadable doc (its own docs/behaviors/confirm.md)', async ({ page, request }) => {
    await inject(page, `<div x-demo id="d"><button x-confirm confirm-title="t" confirm-message="m">Confirm Dialog</button></div>`);
    // #977: two distinct docs (auto-injected <button> + x-confirm) legitimately
    // render two badges. Assert on x-confirm's own, not on there being only one.
    const badges = page.locator('#d .x-demo__card-doc-link');
    await expect(badges.first()).toBeAttached({ timeout: 5000 });
    const hrefs = await badges.evaluateAll((els) =>
      els.map((e) => (e as HTMLAnchorElement).getAttribute('href'))
    );
    expect(new Set(hrefs).size, `duplicate badges for one href (${hrefs.join(', ')})`).toBe(hrefs.length);
    const href = hrefs.find((h) => (h || '').includes('confirm.md')) ?? hrefs[0];

    // This used to expect the shared behaviors-reference.md fallback, with a
    // note to switch to the dedicated doc once one existed. It does now:
    // docs/behaviors/confirm.md (generated from the schema, #842), which
    // findBehaviorDocFile() prefers over the shared reference.
    expect(href).toContain(encodeURIComponent('behaviors/confirm.md'));

    const res = await request.get(href!);
    expect(res.ok(), `fallback doc link ${href} did not load`).toBeTruthy();
  });
});

// RETIRED: "pages/behaviors.html: the exact cards John reported (#593)".
//
// It clicked the doc badges on the Popover and Confirm Dialog demos of
// pages/behaviors.html. #666 removed every <div x-demo> from that page:
// examples now render on demand in the live panel, which carries no x-demo and
// no badges, so there was nothing left for it to click. Retired on John's
// decision (2026-09-25). The #593 bug itself -- a badge click must navigate,
// not trigger the behavior's own overlay -- stays covered by the
// '[x-demo] doc-badge click-through' tests above, for x-confirm and x-popover
// among others.
