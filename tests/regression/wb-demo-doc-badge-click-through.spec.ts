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
  await page.waitForSelector('#test-container wb-demo .wb-demo__grid', { timeout: 10000 });
}

test.describe('wb-demo doc-badge click-through on x-* behaviors (#593)', () => {
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
      // overlay.js's lightbox() puts the SAME 'wb-lightbox' class on both the
      // trigger button (element.classList.add('wb-lightbox')) and the
      // injected fullscreen overlay div -- '.wb-lightbox' alone matches the
      // trigger too. The overlay is a direct child of <body>; the trigger
      // lives inside #test-container, so scope to body's direct children.
      overlaySelector: 'body > div.wb-lightbox',
    },
    {
      attr: 'x-popover',
      markup: `<button x-popover popover-title="Popover Title" popover-content="More info">Show Popover</button>`,
      overlaySelector: '.wb-popover',
    },
  ];

  for (const { attr, markup, overlaySelector } of behaviors) {
    test(`${attr}: clicking the doc badge navigates instead of triggering the behavior's own overlay`, async ({ page, context }) => {
      await inject(page, `<wb-demo id="d">${markup}</wb-demo>`);

      const badge = page.locator('#d .wb-demo__card-doc-link');
      await expect(badge, `${attr}'s wb-demo has no doc-link badge`).toHaveCount(1, { timeout: 5000 });

      const href = await badge.getAttribute('href');
      expect(href, `${attr}'s doc-link badge has no href`).toBeTruthy();

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

  test('x-confirm badge href resolves to a real, loadable doc (fallback to behaviors-reference.md, since no dedicated confirm.md exists)', async ({ page, request }) => {
    await inject(page, `<wb-demo id="d"><button x-confirm confirm-title="t" confirm-message="m">Confirm Dialog</button></wb-demo>`);
    const badge = page.locator('#d .wb-demo__card-doc-link');
    await expect(badge).toHaveCount(1, { timeout: 5000 });
    const href = await badge.getAttribute('href');

    // No dedicated confirm.md/x-confirm.md/wb-confirm.md exists under docs/
    // (checked live) -- the shared reference page is the correct, intended
    // fallback here, not a bug. If a dedicated doc is ever added, this
    // assertion should be updated to expect it instead.
    expect(href).toContain('behaviors-reference.md');

    const res = await request.get(href!);
    expect(res.ok(), `fallback doc link ${href} did not load`).toBeTruthy();
  });
});

test.describe('pages/behaviors.html: the exact cards John reported (#593)', () => {
  test('Popover and Confirm Dialog demo badges are both clickable and open a real doc in a new tab', async ({ page, context }) => {
    await page.goto('/pages/behaviors.html');
    await page.waitForSelector('wb-demo .wb-demo__grid', { timeout: 10000 });

    for (const attr of ['x-popover', 'x-confirm']) {
      const demo = page.locator(`wb-demo:has([${attr}])`).first();
      await demo.scrollIntoViewIfNeeded();
      // Settle time for the lazy demo() init + doc-manifest fetch (same
      // wait used elsewhere in this suite for the same async path).
      await page.waitForTimeout(1000);

      const badge = demo.locator('.wb-demo__card-doc-link');
      await expect(badge, `${attr}'s wb-demo has no doc-link badge on the real page`).toHaveCount(1, { timeout: 5000 });

      const [popup] = await Promise.all([
        context.waitForEvent('page', { timeout: 5000 }),
        badge.click(),
      ]);
      await popup.waitForLoadState();
      expect(popup.url(), `${attr}'s doc badge must actually navigate`).toContain('doc-viewer.html?file=');
      await popup.close();
    }
  });
});
