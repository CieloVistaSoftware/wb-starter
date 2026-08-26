import { test, expect } from '@playwright/test';

/**
 * `href` must work on every host the behavior supports.
 *
 * John, pointing at the behaviors page with the `x-attribute` filter selected:
 * "does not navigate when clicked bad example" — the `x-button · link` sample,
 * which carries `href="/pages/docs.html"`.
 *
 * MEASURED before the fix. `<div x-button href="/pages/docs.html"
 * variant="link" label="Docs">` renders as:
 *
 *   <div x-button href="/pages/docs.html" variant="link" label="Docs"
 *        class="x-button x-button--link">Docs</div>
 *
 * A bare <div>. No anchor, no role, no click handler. It is styled to look
 * exactly like a link and does nothing at all when clicked.
 *
 * CAUSE
 *
 * src/wb-viewmodels/semantics/button.js gated the whole href block on the host
 * being a native <button>:
 *
 *   if (href && element.tagName === 'BUTTON') { … }
 *
 * The comment above it (#669) explains why the block exists — "a <button>
 * cannot navigate, so an href turns it into a real link" — and that reasoning
 * is about <button>, so the guard looked right. But 4.0.0 made the attribute
 * form `<div x-button>` a first-class host, and every other feature in this
 * file (variant, size, icon-only, full-width) applies to both. Only href
 * checked the tag, so exactly one attribute silently stopped working on the
 * form the docs now recommend.
 *
 * Both hosts are asserted here, so fixing one by breaking the other fails.
 */

const DEST = '/pages/docs.html';

test.describe('x-button href navigates from any host', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?page=demos');
    await page.waitForFunction(() => (window as any).WB, null, { timeout: 20000 });
  });

  /** Build a host, scan it, and return a locator for it. */
  async function mount(page: import('@playwright/test').Page, html: string) {
    await page.evaluate(async (markup: string) => {
      document.getElementById('href-probe')?.remove();
      const host = document.createElement('div');
      host.id = 'href-probe';
      host.innerHTML = markup;
      document.body.appendChild(host);
      await (window as any).WB.scan(host);
    }, html);
    // The base class is what the behavior writes on completion — a real
    // barrier, not a sleep.
    await expect(page.locator('#href-probe .x-button').first()).toBeVisible({ timeout: 10000 });
  }

  test('the attribute form <div x-button href> navigates on click', async ({ page }) => {
    await mount(page, `<div id="b" x-button href="${DEST}" variant="link">Docs</div>`);

    await page.locator('#b').click();

    await expect(
      page,
      'Clicking <div x-button href="…"> did not navigate. button.js gates its href '
      + 'handling on element.tagName === "BUTTON", so the attribute form — the one '
      + 'the behaviors page and docs show — is styled like a link and does nothing.',
    ).toHaveURL(new RegExp(DEST.replace(/\//g, '\\/')), { timeout: 10000 });
  });

  test('the attribute form exposes link semantics, not a silent div', async ({ page }) => {
    await mount(page, `<div id="b" x-button href="${DEST}" variant="link">Docs</div>`);

    // A control that navigates must say so, or a screen-reader user cannot
    // know what activating it will do.
    await expect(page.locator('#b')).toHaveAttribute('role', 'link');
  });

  test('the native form <button href> still navigates', async ({ page }) => {
    await mount(page, `<button id="b" href="${DEST}" variant="link">Docs</button>`);

    await page.locator('#b').click();

    await expect(
      page,
      'The native <button href> path regressed — it worked before the attribute '
      + 'form was fixed, so this asserts the fix did not trade one host for the other.',
    ).toHaveURL(new RegExp(DEST.replace(/\//g, '\\/')), { timeout: 10000 });
  });

  test('the attribute form is keyboard operable', async ({ page }) => {
    await mount(page, `<div id="b" x-button href="${DEST}" variant="link">Docs</div>`);

    // role="link" without focus or key activation is worse than no role at
    // all: it announces a link to a screen reader that cannot then be used.
    await expect(page.locator('#b')).toHaveAttribute('tabindex', '0');

    await page.locator('#b').focus();
    await page.keyboard.press('Enter');

    await expect(
      page,
      'Enter did not activate the link. A <div role="link"> gets no keyboard '
      + 'activation for free, unlike a native <button>.',
    ).toHaveURL(new RegExp(DEST.replace(/\//g, '\\/')), { timeout: 10000 });
  });

  test('a disabled host does not navigate', async ({ page }) => {
    await mount(page, `<div id="b" x-button href="${DEST}" variant="link" disabled>Docs</div>`);

    const before = page.url();
    await page.locator('#b').click({ force: true });
    await page.waitForTimeout(500);

    expect(page.url(), 'a disabled control navigated anyway').toBe(before);
  });
});
