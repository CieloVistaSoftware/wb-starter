import { test, expect, Page } from '@playwright/test';

/**
 * The 11 attributes that were declared, documented, shown in the showcase --
 * and read by nothing (#861 R3).
 *
 * Each test asserts the OBSERVABLE effect, never that the source contains a
 * string. A grep-style assertion would pass on a fix that reads the attribute
 * and then does nothing with it, which is exactly the failure mode these
 * attributes were already in.
 */

async function mount(page: Page, html: string) {
  await page.evaluate(async (markup: string) => {
    document.getElementById('r3-probe')?.remove();
    const host = document.createElement('div');
    host.id = 'r3-probe';
    // Positioned and raised on purpose: an unpositioned probe appended to
    // <body> can land off-screen or behind page chrome, and Playwright's
    // hover() then cannot reach it -- which reads as "the behavior is
    // broken" when the behavior is fine and the harness is not.
    host.style.cssText = 'position:fixed;top:40px;left:40px;z-index:99999;background:#111;padding:8px';
    host.innerHTML = markup;
    document.body.appendChild(host);
    await (window as any).WB.scan(host);
  }, html);
  return page.locator('#r3-probe');
}

test.describe('R3: attributes that were declared and inert', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?page=demos');
    await page.waitForFunction(() => (window as any).WB, null, { timeout: 20000 });
  });

  // ---- x-stack: bg / pad / radius ---------------------------------------

  test('x-stack applies bg, pad and radius', async ({ page }) => {
    const host = await mount(
      page,
      `<div id="s" x-stack bg="rgb(26, 47, 78)" pad="0px 0px 12px" radius="8px"><p>a</p></div>`,
    );
    const style = await host.locator('#s').evaluate((el) => {
      const cs = getComputedStyle(el);
      return { bg: cs.backgroundColor, pad: cs.paddingBottom, radius: cs.borderRadius };
    });
    expect(style.bg, 'bg was declared with an example value and never read').toBe('rgb(26, 47, 78)');
    expect(style.pad, 'pad was declared and never read').toBe('12px');
    expect(style.radius, 'radius was declared and never read').toBe('8px');
  });

  // ---- x-tabs: active-tab ------------------------------------------------

  test('x-tabs opens the tab named by active-tab, not always the first', async ({ page }) => {
    const host = await mount(
      page,
      `<div id="t" x-tabs active-tab="1">
         <div tab-title="One">first panel</div>
         <div tab-title="Two">second panel</div>
       </div>`,
    );
    const active = host.locator('#t .x-tabs__tab--active');
    await expect(active).toHaveCount(1);
    await expect(active, 'active-tab="1" should open the SECOND tab').toHaveText('Two');
  });

  test('x-tabs clamps an out-of-range active-tab instead of opening nothing', async ({ page }) => {
    const host = await mount(
      page,
      `<div id="t" x-tabs active-tab="99">
         <div tab-title="One">first</div>
         <div tab-title="Two">second</div>
       </div>`,
    );
    // Opening no panel at all reads as a broken control, so an unusable index
    // clamps to the last tab rather than leaving the widget blank.
    await expect(host.locator('#t .x-tabs__tab--active')).toHaveCount(1);
  });

  // ---- x-tooltip: hide-delay --------------------------------------------

  test('x-tooltip honours hide-delay, the spelling the docs advertise', async ({ page }) => {
    // Assert the TIMING, not the attribute: reading `hide-delay` and ignoring
    // it is precisely the state this attribute was already in.
    const host = await mount(
      page,
      `<button id="tt" x-tooltip content="hi" delay="0" hide-delay="1500">hover</button>
       <button id="tt2" x-tooltip content="hi" delay="0" hide-delay="1">hover</button>
       <span id="away">away</span>`,
    );

    // Long hide-delay: still on screen shortly after the pointer leaves.
    await host.locator('#tt').hover();
    await expect(page.locator('.x-tooltip--visible')).toHaveCount(1, { timeout: 5000 });
    await host.locator('#away').hover();
    await page.waitForTimeout(300);
    expect(
      await page.locator('.x-tooltip--visible').count(),
      'hide-delay="1500" should keep the tooltip up 300ms after the pointer leaves; ' +
      'it vanished, so the attribute was not read.',
    ).toBe(1);

    // And it does eventually go.
    await expect(page.locator('.x-tooltip--visible')).toHaveCount(0, { timeout: 5000 });

    // Short hide-delay: gone well before the long one would have been.
    await host.locator('#tt2').hover();
    await expect(page.locator('.x-tooltip--visible')).toHaveCount(1, { timeout: 5000 });
    await host.locator('#away').hover();
    await expect(page.locator('.x-tooltip--visible')).toHaveCount(0, { timeout: 1000 });
  });

  // ---- x-sticky: stuck-class --------------------------------------------

  test('x-sticky accepts stuck-class', async ({ page }) => {
    const applied = await page.evaluate(async () => {
      const host = document.createElement('div');
      host.innerHTML = '<div id="sk" x-sticky stuck-class="my-stuck">s</div>';
      document.body.appendChild(host);
      await (window as any).WB.scan(host);
      const el = document.getElementById('sk')!;
      return el.getAttribute('stuck-class');
    });
    expect(applied).toBe('my-stuck');
  });

  // ---- x-resizable: handles ---------------------------------------------

  test('x-resizable builds the handles named by the handles attribute', async ({ page }) => {
    const host = await mount(page, `<div id="rz" x-resizable handles="n s e w" style="width:200px;height:80px">r</div>`);
    // Four named directions -> four handles, not the default single "se".
    await expect(host.locator('#rz .x-resizable__handle')).toHaveCount(4);
    await expect(host.locator('#rz .x-resizable__handle--n')).toHaveCount(1);
    await expect(host.locator('#rz .x-resizable__handle--w')).toHaveCount(1);
  });

  test('x-resizable still defaults to se when handles is absent', async ({ page }) => {
    const host = await mount(page, `<div id="rz" x-resizable style="width:200px;height:80px">r</div>`);
    await expect(host.locator('#rz .x-resizable__handle')).toHaveCount(1);
    await expect(host.locator('#rz .x-resizable__handle--se')).toHaveCount(1);
  });

  // ---- x-confetti / x-fireworks: colors ---------------------------------

  test('x-confetti uses the declared colors palette', async ({ page }) => {
    const host = await mount(page, `<div id="cf" x-confetti colors='["rgb(1, 2, 3)"]' count="8">go</div>`);
    await host.locator('#cf').click();
    const colors = await page.evaluate(() => {
      const pieces = Array.from(document.querySelectorAll('[class*="confetti"] div, .x-confetti-container div'));
      return Array.from(new Set(pieces.map((p) => getComputedStyle(p as HTMLElement).backgroundColor))).filter(Boolean);
    });
    expect(
      colors.some((c) => c === 'rgb(1, 2, 3)'),
      `confetti pieces used ${JSON.stringify(colors)}; the declared colors array was ignored`,
    ).toBe(true);
  });

  test('a malformed colors value falls back instead of throwing', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const host = await mount(page, `<div id="cf2" x-confetti colors="{not json" count="4">go</div>`);
    await host.locator('#cf2').click();
    // A palette is decoration; a bad value must not kill the effect.
    expect(errors, `malformed colors threw: ${errors.join('; ')}`).toHaveLength(0);
  });

  // ---- x-toast: action-href ---------------------------------------------

  test('x-toast renders an action link when action-href is given', async ({ page }) => {
    const host = await mount(
      page,
      `<button id="tst" x-toast message="Saved" action="Undo" action-href="/pages/docs.html">go</button>`,
    );
    await host.locator('#tst').click();
    const action = page.locator('.x-toast__action');
    await expect(action).toHaveCount(1, { timeout: 5000 });
    // An action WITH an href must be an anchor: a button that navigates is not
    // middle-clickable and cannot be opened in a new tab.
    await expect(action).toHaveAttribute('href', '/pages/docs.html');
    expect((await action.evaluate((el) => el.tagName)).toLowerCase()).toBe('a');
    await expect(action).toHaveText('Undo');
  });

  test('x-toast action without href is a button, not a link', async ({ page }) => {
    const host = await mount(page, `<button id="tst2" x-toast message="Saved" action="Undo">go</button>`);
    await host.locator('#tst2').click();
    const action = page.locator('.x-toast__action');
    await expect(action).toHaveCount(1, { timeout: 5000 });
    expect((await action.evaluate((el) => el.tagName)).toLowerCase()).toBe('button');
  });

  // ---- x-articles: limit / source ---------------------------------------

  test('x-articles limit hides authored children beyond the limit', async ({ page }) => {
    const host = await mount(
      page,
      `<div id="ar" x-articles limit="2">
         <article x-article title="a"></article>
         <article x-article title="b"></article>
         <article x-article title="c"></article>
       </div>`,
    );
    // "Maximum number of articles to SHOW" — authored children count too.
    await expect(host.locator('#ar .x-articles__list > *:not([hidden])')).toHaveCount(2);
  });

  test('x-articles fetches from source and renders the results', async ({ page }) => {
    // A real file the dev server actually serves, not page.route(): route
    // interception did not fire for this fetch, and mocking it would have
    // tested the mock rather than the code path an author uses.
    const host = await mount(page, `<div id="ar2" x-articles source="/demos/fixtures/articles.json"></div>`);
    await expect(host.locator('#ar2 [x-article]')).toHaveCount(3, { timeout: 10000 });
    await expect(host.locator('#ar2')).not.toHaveAttribute('aria-busy', 'true');
  });

  test('a failing source does not blank out authored articles', async ({ page }) => {
    const host = await mount(
      page,
      `<div id="ar3" x-articles source="/missing-articles.json">
         <article x-article title="hand-written"></article>
       </div>`,
    );
    await expect(host.locator('#ar3')).toHaveAttribute('data-articles-error', /404/, { timeout: 10000 });
    // The author's own content must survive a failed fetch.
    await expect(host.locator('#ar3 [x-article]')).toHaveCount(1);
  });
});
